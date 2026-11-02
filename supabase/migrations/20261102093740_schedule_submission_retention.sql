-- Supabase Cron uses the existing database; no external service or HTTP secret.
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

select cron.schedule(
  'em-carpentry-submission-retention',
  '0 * * * *',
  $job$
    select private.purge_expired_submissions();
    delete from cron.job_run_details
    where jobid=(select jobid from cron.job where jobname='em-carpentry-submission-retention')
      and end_time < statement_timestamp() - interval '7 days';
  $job$
);
