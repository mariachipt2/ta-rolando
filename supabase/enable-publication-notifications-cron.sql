-- Run once after migration 012. The named job is updated rather than duplicated.
create extension if not exists pg_cron;
select cron.schedule('ta-rolando-publication-notifications','* * * * *','select public.collect_publication_notifications()');
