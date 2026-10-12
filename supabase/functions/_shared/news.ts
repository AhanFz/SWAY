// Pure helpers for the free (no-AI) news pipeline. No Deno or network APIs here so Node can unit-test them.
export const topics=['World','Politics','Economy','Tech','Science','Climate','Health','Culture','Sport'];

// Feed XML is parsed without entity expansion, and descriptions are often HTML escaped inside XML,
// so text is decoded twice (XML layer, then HTML layer) with tags stripped after each pass.
function decodeOnce(text:string) {
  return text.replace(/<[^>]*>/g,' ')
    .replace(/&nbsp;|&#160;/g,' ')
    .replace(/&#(\d+);/g,(_,n)=>safeChar(Number(n))).replace(/&#x([0-9a-f]+);/gi,(_,n)=>safeChar(parseInt(n,16)))
    .replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
}
export function plainText(value:unknown,max=2000) {
  return decodeOnce(decodeOnce(String(value??''))).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
}
function safeChar(code:number) { return code>31&&code<0x110000?String.fromCodePoint(code):' '; }

// Tracking parameters differ between section feeds for the same article; drop them so URLs dedupe.
export function canonicalUrl(link:unknown):string|null {
  if(typeof link!=='string'||!link.startsWith('https://'))return null;
  try{
    // Feed XML is parsed without entity expansion, so query separators arrive as &amp;.
    const url=new URL(link.trim().replace(/&amp;/g,'&'));url.hash='';
    for(const key of [...url.searchParams.keys()])if(/^(utm_|at_|ns_|cmp$|ref$|traffic_source$)/i.test(key))url.searchParams.delete(key);
    return url.href;
  }catch{return null;}
}

// The outlet's own feed blurb, trimmed to whole sentences. Nothing is rewritten or invented.
export function excerpt(text:string,maxWords=80) {
  const clean=text.replace(/\s*Continue reading\s*(\.\.\.|…)?\s*$/i,'').replace(/\s*\[(\.\.\.|…)\]\s*$/,'').trim();
  const words=clean.split(/\s+/).filter(Boolean);
  if(words.length<=maxWords)return clean;
  const cut=words.slice(0,maxWords).join(' ');
  const end=Math.max(cut.lastIndexOf('. '),cut.lastIndexOf('? '),cut.lastIndexOf('! '));
  return end>cut.length*0.4?cut.slice(0,end+1):cut.replace(/[,;:\-–—]$/,'')+'…';
}

const stop=new Set('a an the and or but of to in on at for from by with as is are was were be been has have had it its this that these those after before over into amid says say said new will would could may can not no more than up out off about who what when where why how his her their he she they we you i us'.split(' '));
export function headlineTokens(headline:string) {
  const tokens=headline.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/['’]s\b/g,'').replace(/[^a-z0-9]+/g,' ').split(' ')
    .filter(word=>word.length>1&&!stop.has(word)).map(word=>word.length>4&&word.endsWith('s')&&!word.endsWith('ss')?word.slice(0,-1):word);
  return [...new Set(tokens)];
}
// Jaccard overlap of significant headline words: 1 = same words, 0 = nothing shared.
export function headlineSimilarity(a:string[],b:string[]) {
  if(!a.length||!b.length)return {score:0,shared:0};
  const set=new Set(a);let shared=0;for(const token of b)if(set.has(token))shared++;
  return {score:shared/(a.length+b.length-shared),shared};
}
export function sameStory(a:string[],b:string[],threshold=0.6) {
  const {score,shared}=headlineSimilarity(a,b);
  return shared>=3&&score>=threshold;
}

const keywords:Record<string,string[]>={
  Sport:['football','soccer','cricket','tennis','olympic','nba','nfl','premier league','champions league','world cup','grand prix','rugby','golf','athletics','coach','tournament'],
  Climate:['climate','emissions','global warming','heatwave','wildfire','drought','flood','net zero','carbon','renewable','cop3','hurricane','cyclone'],
  Health:['health','hospital','vaccine','virus','disease','cancer','nhs','medical','doctor','outbreak','mental health','drug trial','patients'],
  Tech:['ai ','artificial intelligence','tech','software','app ','apple','google','microsoft','meta ','openai','chip','cyber','hack','smartphone','robot','startup','data breach'],
  Science:['scientist','research','study finds','nasa','space','telescope','fossil','species','physics','astronom','archaeolog','quantum','asteroid'],
  Economy:['economy','inflation','interest rate','market','stocks','shares','tariff','trade','bank','jobs','unemployment','gdp','budget','recession','profit','oil price'],
  Politics:['election','parliament','congress','senate','president','prime minister','minister','vote','policy','government','white house','supreme court','campaign','lawmakers','bill '],
  Culture:['film','movie','music','album','book','novel','art ','artist','museum','festival','theatre','theater','tv ','actor','singer','award','fashion'],
};
// Used only for general feeds that carry no section of their own. Falls back to World.
export function classifyTopic(text:string) {
  const haystack=' '+text.toLowerCase().replace(/[^a-z0-9]+/g,' ')+' ';
  let best='World',bestScore=0;
  for(const [topic,words] of Object.entries(keywords)){
    let score=0;for(const word of words)if(haystack.includes(' '+word))score++;
    if(score>bestScore){best=topic;bestScore=score;}
  }
  return best;
}

export function validSummary(value:unknown):value is {headline:string;summary:string;topic:string} {
  const v=value as {headline?:unknown;summary?:unknown;topic?:unknown};
  return !!v&&typeof v.headline==='string'&&v.headline.length>0&&v.headline.length<=240&&typeof v.summary==='string'&&v.summary.trim().length>0&&v.summary.trim().split(/\s+/).length<=100&&v.summary.length<=1600&&typeof v.topic==='string'&&topics.includes(v.topic);
}
