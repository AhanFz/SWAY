-- Public schema remains inaccessible to clients; all access goes through validated Edge Functions.
create table public.feeds (
  id uuid primary key default gen_random_uuid(), outlet_name text not null,
  rss_url text not null unique check (rss_url like 'https://%'), active boolean not null default true
);
create table public.stories (
  id uuid primary key default gen_random_uuid(), headline text not null check(length(headline) between 1 and 240),
  summary text not null check(length(summary) between 1 and 1600),
  topic text not null check(topic in ('World','Politics','Economy','Tech','Science','Climate','Health','Culture','Sport')),
  published_at timestamptz not null, created_at timestamptz not null default now()
);
create index stories_feed_idx on public.stories(published_at desc, id desc);
create table public.story_sources (
  story_id uuid not null references public.stories(id) on delete cascade,
  outlet_name text not null, article_url text primary key check(article_url like 'https://%')
);
create index story_sources_story_idx on public.story_sources(story_id);
create table public.responses (
  story_id uuid not null references public.stories(id) on delete cascade,
  device_hash text not null check(device_hash ~ '^[0-9a-f]{64}$'),
  value text not null check(value in ('good','bad','skip')), created_at timestamptz not null default now(),
  primary key(story_id, device_hash)
);
create index responses_device_rate_idx on public.responses(device_hash, created_at desc);
create table public.story_totals (
  story_id uuid primary key references public.stories(id) on delete cascade,
  good_count bigint not null default 0 check(good_count>=0),
  bad_count bigint not null default 0 check(bad_count>=0),
  skip_count bigint not null default 0 check(skip_count>=0)
);
create table public.attest_keys (
  key_id text primary key, device_hash text not null unique, public_key text not null,
  sign_count bigint not null default 0, created_at timestamptz not null default now()
);
create table public.attest_challenges (
  challenge text primary key, device_hash text not null, created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '5 minutes'
);
create index attest_challenges_device_idx on public.attest_challenges(device_hash,created_at);
create index attest_challenges_expiry_idx on public.attest_challenges(expires_at);
create table public.news_items (
  article_url text primary key, story_id uuid references public.stories(id) on delete cascade,
  outlet_name text not null, headline text not null, description text not null,
  published_at timestamptz not null, embedding double precision[] not null
);
create index news_items_recent_idx on public.news_items(published_at desc);
create index news_items_story_idx on public.news_items(story_id);
create table public.pipeline_locks (name text primary key, owner uuid not null, expires_at timestamptz not null);

alter table public.feeds enable row level security;
alter table public.stories enable row level security;
alter table public.story_sources enable row level security;
alter table public.responses enable row level security;
alter table public.story_totals enable row level security;
alter table public.attest_keys enable row level security;
alter table public.attest_challenges enable row level security;
alter table public.news_items enable row level security;
alter table public.pipeline_locks enable row level security;
revoke all on public.feeds, public.stories, public.story_sources, public.responses, public.story_totals,
  public.attest_keys, public.attest_challenges, public.news_items, public.pipeline_locks from anon, authenticated;
grant all on public.feeds, public.stories, public.story_sources, public.responses, public.story_totals,
  public.attest_keys, public.attest_challenges, public.news_items, public.pipeline_locks to service_role;

create function public.increment_story_totals() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  insert into public.story_totals(story_id,good_count,bad_count,skip_count)
  values(new.story_id,(new.value='good')::int,(new.value='bad')::int,(new.value='skip')::int)
  on conflict(story_id) do update set
    good_count=public.story_totals.good_count+excluded.good_count,
    bad_count=public.story_totals.bad_count+excluded.bad_count,
    skip_count=public.story_totals.skip_count+excluded.skip_count;
  return new;
end; $$;
create trigger response_totals after insert on public.responses for each row execute function public.increment_story_totals();

create function public.new_challenge(p_device_hash text, p_challenge text) returns void language plpgsql security invoker set search_path='' as $$
begin
  if p_device_hash !~ '^[0-9a-f]{64}$' or length(p_challenge)<32 then raise exception 'invalid_request'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_device_hash, 1));
  delete from public.attest_challenges where expires_at < now();
  if (select count(*) from public.attest_challenges where device_hash=p_device_hash and created_at>now()-interval '1 minute') >= 120 then raise exception 'rate_limited'; end if;
  insert into public.attest_challenges(challenge,device_hash) values(p_challenge,p_device_hash);
end; $$;

create function public.register_attestation(p_device_hash text,p_challenge text,p_key_id text,p_public_key text) returns void language plpgsql security invoker set search_path='' as $$
begin
  delete from public.attest_challenges where challenge=p_challenge and device_hash=p_device_hash and expires_at>now();
  if not found then raise exception 'invalid_challenge'; end if;
  insert into public.attest_keys(key_id,device_hash,public_key) values(p_key_id,p_device_hash,p_public_key);
end; $$;

create function public.record_response(p_story_id uuid,p_device_hash text,p_value text,p_challenge text,p_key_id text default null,p_sign_count bigint default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare prior text; keyrow public.attest_keys;
begin
  if p_value not in ('good','bad','skip') or p_device_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid_response'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_device_hash, 0));
  delete from public.attest_challenges where challenge=p_challenge and device_hash=p_device_hash and expires_at>now();
  if not found then raise exception 'invalid_challenge'; end if;
  if p_key_id is not null then
    select * into keyrow from public.attest_keys where key_id=p_key_id and device_hash=p_device_hash for update;
    if not found or p_sign_count is null or p_sign_count<=keyrow.sign_count then raise exception 'invalid_assertion'; end if;
    update public.attest_keys set sign_count=p_sign_count where key_id=p_key_id;
  end if;
  select value into prior from public.responses where story_id=p_story_id and device_hash=p_device_hash;
  if found then
    if prior<>p_value then raise exception 'response_final'; end if;
    return jsonb_build_object('accepted',true,'duplicate',true);
  end if;
  if (select count(*) from public.responses where device_hash=p_device_hash and created_at>now()-interval '1 minute')>=60 then raise exception 'rate_limited'; end if;
  insert into public.responses(story_id,device_hash,value) values(p_story_id,p_device_hash,p_value);
  return jsonb_build_object('accepted',true,'duplicate',false);
end; $$;

create function public.acquire_pipeline(p_owner uuid) returns boolean language plpgsql security invoker set search_path='' as $$
begin
  insert into public.pipeline_locks(name,owner,expires_at) values('news',p_owner,now()+interval '25 minutes')
  on conflict(name) do update set owner=excluded.owner,expires_at=excluded.expires_at where public.pipeline_locks.expires_at<now();
  return found;
end; $$;

revoke all on function public.increment_story_totals() from public,anon,authenticated;
revoke all on function public.new_challenge(text,text) from public,anon,authenticated;
revoke all on function public.register_attestation(text,text,text,text) from public,anon,authenticated;
revoke all on function public.record_response(uuid,text,text,text,text,bigint) from public,anon,authenticated;
revoke all on function public.acquire_pipeline(uuid) from public,anon,authenticated;
grant execute on function public.increment_story_totals(),public.new_challenge(text,text),public.register_attestation(text,text,text,text),public.record_response(uuid,text,text,text,text,bigint),public.acquire_pipeline(uuid) to service_role;

insert into public.feeds(outlet_name,rss_url) values
('NPR','https://feeds.npr.org/1001/rss.xml'),('Al Jazeera','https://www.aljazeera.com/xml/rss/all.xml');

create function public.publish_story(p_story_id uuid,p_headline text,p_summary text,p_topic text,p_published_at timestamptz,p_items jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare sid uuid; item jsonb;
begin
  if p_story_id is null then
    insert into public.stories(headline,summary,topic,published_at) values(p_headline,p_summary,p_topic,p_published_at) returning id into sid;
  else
    sid:=p_story_id;
    update public.stories set headline=p_headline,summary=p_summary,topic=p_topic,published_at=greatest(published_at,p_published_at) where id=sid;
    if not found then raise exception 'story_missing'; end if;
  end if;
  for item in select * from jsonb_array_elements(p_items) loop
    insert into public.story_sources(story_id,outlet_name,article_url) values(sid,item->>'outlet_name',item->>'article_url') on conflict(article_url) do nothing;
    insert into public.news_items(article_url,story_id,outlet_name,headline,description,published_at,embedding)
    values(item->>'article_url',sid,item->>'outlet_name',item->>'headline',item->>'description',(item->>'published_at')::timestamptz,array(select jsonb_array_elements_text(item->'embedding')::double precision))
    on conflict(article_url) do nothing;
  end loop;
  return sid;
end; $$;
revoke all on function public.publish_story(uuid,text,text,text,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.publish_story(uuid,text,text,text,timestamptz,jsonb) to service_role;
