-- Run only after the Edge Function and its server secrets are configured.
-- First set Vault secrets named sway_project_url and sway_news_cron_secret.
-- Never use the public app key as the cron secret.
create extension if not exists pg_cron;
create extension if not exists pg_net;
-- Remove the earlier 30-minute job, or a previous copy of this one, if scheduled.
select cron.unschedule(jobid) from cron.job where jobname in ('sway-news-every-30-minutes','sway-news-hourly');
-- Collect news at the top of every hour.
select cron.schedule('sway-news-hourly','0 * * * *',$$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='sway_project_url') || '/functions/v1/ingest-news',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='sway_news_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
$$);
