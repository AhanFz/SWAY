// Hourly news collection. Free by design: RSS in, Postgres out, no AI provider.
// Each story shows the outlet's own headline and feed blurb with a link to the original;
// matching reports from other outlets are attached to the same story by headline overlap.
import { XMLParser } from 'fast-xml-parser';
import { database, check, json } from '../_shared/common.ts';
import { canonicalUrl, classifyTopic, excerpt, headlineTokens, plainText, sameStory, topics, validSummary } from '../_shared/news.ts';

type Feed={outlet_name:string;rss_url:string;topic:string|null};
type Known={article_url:string;story_id:string|null;headline:string;published_at:string};
type Candidate={story_id:string;tokens:string[];time:number};
type Raw=Record<string,unknown>;
const DEFAULT_HOSTS='feeds.npr.org,www.aljazeera.com,feeds.bbci.co.uk,www.theguardian.com';
const HOUR=3600000,MAX_AGE=48*HOUR,MAX_PER_FEED=60,MAX_PER_RUN=1500;

async function fetchFeed(url:string):Promise<Raw[]>{
  const allowed=(Deno.env.get('FEED_HOST_ALLOWLIST')||DEFAULT_HOSTS).split(',').map(host=>host.trim());
  const parsed=new URL(url);if(parsed.protocol!=='https:'||!allowed.includes(parsed.hostname))throw new Error('feed_host_not_allowed');
  const response=await fetch(parsed,{redirect:'error',headers:{'User-Agent':'SwayNewsBot/1.0 (RSS reader)',Accept:'application/rss+xml, application/atom+xml, application/xml, text/xml'},signal:AbortSignal.timeout(15000)});
  if(!response.ok){await response.body?.cancel();throw new Error('feed_unavailable');}
  const reader=response.body!.getReader();let text='',size=0;const decoder=new TextDecoder();
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>3000000){await reader.cancel();throw new Error('feed_too_large');}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();
  if(/<!DOCTYPE|<!ENTITY/i.test(text))throw new Error('unsupported_xml');
  const data=new XMLParser({ignoreAttributes:false,processEntities:false}).parse(text);
  const items=data.rss?.channel?.item??data.feed?.entry??[];return Array.isArray(items)?items:[items];
}
// RSS gives a string; Atom gives one or more <link href> elements; some feeds wrap text in #text.
function linkOf(raw:Raw):unknown{
  const link=raw.link;
  if(typeof link==='string')return link;
  const list=(Array.isArray(link)?link:[link]) as (Raw|string|undefined)[];
  const pick=list.find(l=>!!l&&typeof l==='object'&&(!l['@_rel']||l['@_rel']==='alternate'))??list[0];
  return pick&&typeof pick==='object'?(pick['@_href']??pick['#text']):pick;
}
function textOf(value:unknown):unknown{return value&&typeof value==='object'?(value as Raw)['#text']:value;}

Deno.serve(async req=>{
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  if(!Deno.env.get('NEWS_CRON_SECRET')||req.headers.get('authorization')!==`Bearer ${Deno.env.get('NEWS_CRON_SECRET')}`)return json({error:'Unauthorized'},401);
  const db=database(),owner=crypto.randomUUID();let acquired=false;
  try{
    const threshold=Number(Deno.env.get('NEWS_SIMILARITY_THRESHOLD')||0.6);if(!(threshold>=0.3&&threshold<=1))throw new Error('invalid_threshold');
    const lock=await db.rpc('acquire_pipeline',{p_owner:owner});check(lock);if(!lock.data)return json({busy:true});acquired=true;
    const feeds=await db.from('feeds').select('outlet_name,rss_url,topic').eq('active',true);check(feeds);

    // Everything seen in the last 4 days: skips known URLs and supplies stories to attach new reports to.
    const known:Known[]=[];
    for(let from=0;;from+=1000){
      const page=await db.from('news_items').select('article_url,story_id,headline,published_at').gte('published_at',new Date(Date.now()-96*HOUR).toISOString()).order('article_url').range(from,from+999);check(page);
      const rows=(page.data||[]) as Known[];known.push(...rows);if(rows.length<1000)break;
    }
    const seen=new Set(known.map(item=>item.article_url));
    const candidates:Candidate[]=[];
    for(const item of known)if(item.story_id)candidates.push({story_id:item.story_id,tokens:headlineTokens(item.headline),time:Date.parse(item.published_at)});

    const list=(feeds.data||[]) as Feed[];
    const fetched=await Promise.allSettled(list.map(feed=>fetchFeed(feed.rss_url)));
    const stories:Record<string,unknown>[]=[],items:Record<string,unknown>[]=[];
    let failedFeeds=0,skipped=0;
    fetched.forEach((result,index)=>{
      if(result.status==='rejected'){failedFeeds++;return;}
      const feed=list[index];
      for(const raw of result.value.slice(0,MAX_PER_FEED)){
        if(items.length>=MAX_PER_RUN)break;
        try{
          const url=canonicalUrl(linkOf(raw));if(!url||seen.has(url))continue;
          const date=Date.parse(String(textOf(raw.pubDate??raw.published??raw.updated??raw['dc:date'])));
          if(!Number.isFinite(date)||date>Date.now()+600000||date<Date.now()-MAX_AGE){skipped++;continue;}
          const headline=plainText(textOf(raw.title),240),description=plainText(textOf(raw.description??raw.summary??''));
          const summary=excerpt(description);
          // A story needs enough of a blurb to judge; headline-only items are left out.
          if(!headline||summary.split(/\s+/).length<8){skipped++;continue;}
          const topic=feed.topic&&topics.includes(feed.topic)?feed.topic:classifyTopic(headline+' '+description);
          if(!validSummary({headline,summary,topic})){skipped++;continue;}
          const tokens=headlineTokens(headline),published_at=new Date(date).toISOString();
          const match=candidates.find(c=>Math.abs(c.time-date)<=MAX_AGE&&sameStory(c.tokens,tokens,threshold));
          const story_id=match?.story_id??crypto.randomUUID();
          if(!match){stories.push({id:story_id,headline,summary,topic,published_at});candidates.push({story_id,tokens,time:date});}
          items.push({article_url:url,story_id,outlet_name:feed.outlet_name,headline,description,published_at});
          seen.add(url);
        }catch{skipped++;}
      }
    });
    if(items.length){const saved=await db.rpc('ingest_news',{p_stories:stories,p_items:items});check(saved);}
    return json({feeds:list.length,failedFeeds,newStories:stories.length,newArticles:items.length,skipped},list.length>0&&failedFeeds===list.length?502:200);
  }catch{return json({error:'News ingestion failed. Check configuration and feed availability.'},503);}
  finally{if(acquired)await db.from('pipeline_locks').delete().eq('name','news').eq('owner',owner);}
});
