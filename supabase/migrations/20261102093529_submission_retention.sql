-- Website-copy retention only; public intake remains disabled.
-- Existing closed/rejected rows need an operator-confirmed anchor, never a guessed date.
do $$ begin
  if exists(select 1 from public.enquiries where status='closed')
     or exists(select 1 from public.reviews where status='rejected') then
    raise exception 'Confirm legacy closure/moderation dates before applying retention';
  end if;
end $$;

alter table public.enquiries add column closed_at timestamptz,
  add column retention_expires_at timestamptz;
alter table public.reviews add column retention_started_at timestamptz,
  add column retention_expires_at timestamptz;
update public.reviews set retention_started_at=created_at,
  retention_expires_at=created_at + interval '720 hours' where status='pending';

alter table public.enquiries add constraint enquiry_retention_clock check(
  (status='closed' and closed_at is not null and retention_expires_at is not null and retention_expires_at=closed_at + interval '2160 hours')
  or (status<>'closed' and closed_at is null and retention_expires_at is null)
);
alter table public.reviews add constraint review_retention_clock check(
  (status='approved' and retention_started_at is null and retention_expires_at is null)
  or (status<>'approved' and retention_started_at is not null and retention_expires_at is not null and retention_expires_at=retention_started_at + interval '720 hours')
);

create function private.track_enquiry_retention() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if TG_OP='UPDATE' then
    if old.retention_expires_at <= statement_timestamp() then
      raise exception 'Expired enquiries can only be deleted';
    end if;
    new.created_at=old.created_at;
    if new.status='closed' and old.status='closed' then
      new.closed_at=old.closed_at;
    elsif new.status='closed' then
      new.closed_at=statement_timestamp();
    else
      new.closed_at=null;
    end if;
  else
    new.created_at=statement_timestamp();
    new.closed_at=case when new.status='closed' then statement_timestamp() else null end;
  end if;
  new.retention_expires_at=new.closed_at + interval '2160 hours';
  return new;
end $$;
revoke all on function private.track_enquiry_retention() from public,anon,authenticated;
create trigger enquiry_retention before insert or update on public.enquiries
for each row execute function private.track_enquiry_retention();

create function private.track_review_retention() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if TG_OP='UPDATE' then
    if old.retention_expires_at <= statement_timestamp() then
      raise exception 'Expired reviews can only be deleted';
    end if;
    new.created_at=old.created_at;
    if new.status='approved' then
      new.retention_started_at=null;
    elsif old.status='approved' then
      new.retention_started_at=statement_timestamp();
    else
      -- Pending/rejected changes and ordinary edits share the original deadline.
      new.retention_started_at=old.retention_started_at;
    end if;
  else
    new.created_at=statement_timestamp();
    new.retention_started_at=case when new.status='approved' then null else statement_timestamp() end;
  end if;
  new.retention_expires_at=new.retention_started_at + interval '720 hours';
  return new;
end $$;
revoke all on function private.track_review_retention() from public,anon,authenticated;
create trigger review_retention before insert or update on public.reviews
for each row execute function private.track_review_retention();

create index enquiries_retention_idx on public.enquiries(retention_expires_at)
  where status='closed';
create index reviews_retention_idx on public.reviews(retention_expires_at)
  where status in ('pending','rejected');

-- Runs only through the trusted database scheduler/operator. No public RPC,
-- client key or elevated web-server credential is needed.
create function private.purge_expired_submissions() returns jsonb
language plpgsql security invoker set search_path='' as $$
declare enquiry_count integer; review_count integer;
begin
  delete from public.enquiries where status='closed'
    and retention_expires_at <= statement_timestamp();
  get diagnostics enquiry_count = row_count;
  delete from public.reviews where status in ('pending','rejected')
    and retention_expires_at <= statement_timestamp();
  get diagnostics review_count = row_count;
  return jsonb_build_object('enquiries',enquiry_count,'reviews',review_count);
end $$;
revoke all on function private.purge_expired_submissions() from public,anon,authenticated;
