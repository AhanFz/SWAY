-- Free hourly news pipeline: no AI provider, more sources, one batched write per run.

-- A section feed (e.g. BBC Technology) fixes the topic; general feeds leave it null and are classified by keyword.
alter table public.feeds add column topic text
  check (topic is null or topic in ('World','Politics','Economy','Tech','Science','Climate','Health','Culture','Sport'));
-- Embeddings are no longer produced; keep the column so earlier rows and the old function stay valid.
alter table public.news_items alter column embedding set default '{}';

insert into public.feeds(outlet_name,rss_url,topic) values
('NPR','https://feeds.npr.org/1004/rss.xml','World'),
('NPR','https://feeds.npr.org/1014/rss.xml','Politics'),
('NPR','https://feeds.npr.org/1006/rss.xml','Economy'),
('NPR','https://feeds.npr.org/1019/rss.xml','Tech'),
('NPR','https://feeds.npr.org/1007/rss.xml','Science'),
('NPR','https://feeds.npr.org/1128/rss.xml','Health'),
('NPR','https://feeds.npr.org/1008/rss.xml','Culture'),
('BBC News','https://feeds.bbci.co.uk/news/world/rss.xml','World'),
('BBC News','https://feeds.bbci.co.uk/news/politics/rss.xml','Politics'),
('BBC News','https://feeds.bbci.co.uk/news/business/rss.xml','Economy'),
('BBC News','https://feeds.bbci.co.uk/news/technology/rss.xml','Tech'),
('BBC News','https://feeds.bbci.co.uk/news/science_and_environment/rss.xml','Science'),
('BBC News','https://feeds.bbci.co.uk/news/health/rss.xml','Health'),
('BBC News','https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml','Culture'),
('BBC Sport','https://feeds.bbci.co.uk/sport/rss.xml','Sport'),
('The Guardian','https://www.theguardian.com/world/rss','World'),
('The Guardian','https://www.theguardian.com/business/economics/rss','Economy'),
('The Guardian','https://www.theguardian.com/technology/rss','Tech'),
('The Guardian','https://www.theguardian.com/science/rss','Science'),
('The Guardian','https://www.theguardian.com/environment/climate-crisis/rss','Climate'),
('The Guardian','https://www.theguardian.com/culture/rss','Culture')
on conflict(rss_url) do nothing;

-- One call per run: new stories, their source links, and the feed snippets used for de-duplication.
create function public.ingest_news(p_stories jsonb,p_items jsonb) returns integer
language plpgsql security invoker set search_path='' as $$
declare created integer;
begin
  insert into public.stories(id,headline,summary,topic,published_at)
  select (s->>'id')::uuid,s->>'headline',s->>'summary',s->>'topic',(s->>'published_at')::timestamptz
  from jsonb_array_elements(p_stories) s;
  get diagnostics created = row_count;
  insert into public.story_sources(story_id,outlet_name,article_url)
  select (i->>'story_id')::uuid,i->>'outlet_name',i->>'article_url' from jsonb_array_elements(p_items) i
  on conflict(article_url) do nothing;
  insert into public.news_items(article_url,story_id,outlet_name,headline,description,published_at)
  select i->>'article_url',(i->>'story_id')::uuid,i->>'outlet_name',i->>'headline',i->>'description',(i->>'published_at')::timestamptz
  from jsonb_array_elements(p_items) i
  on conflict(article_url) do nothing;
  -- Snippets are only needed while a story can still gain sources.
  delete from public.news_items where published_at < now() - interval '14 days';
  return created;
end; $$;
revoke all on function public.ingest_news(jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.ingest_news(jsonb,jsonb) to service_role;
