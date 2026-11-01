-- Narrow privileged lookup to the non-exposed schema. Public RPC remains invoker-only.
alter table private.admin_users enable row level security;
create or replace function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and exists(select 1 from private.admin_users where user_id=(select auth.uid()));
$$;
revoke all on function private.is_admin() from public,anon,authenticated;
-- These roles can invoke the narrow helper through policies/RPC, never read membership rows.
grant usage on schema private to anon,authenticated;
grant execute on function private.is_admin() to anon,authenticated;
create or replace function public.is_admin() returns boolean language sql stable security invoker set search_path='' as $$
 select private.is_admin();
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon,authenticated;
