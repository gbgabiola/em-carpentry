-- Preserve existing reads while avoiding duplicate authenticated SELECT policies.
drop policy projects_owner on public.projects;
create policy projects_owner_insert on public.projects for insert to authenticated with check((select public.is_admin()));
create policy projects_owner_update on public.projects for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy projects_owner_delete on public.projects for delete to authenticated using((select public.is_admin()));
drop policy images_owner on public.project_images;
create policy images_owner_insert on public.project_images for insert to authenticated with check((select public.is_admin()));
create policy images_owner_update on public.project_images for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy images_owner_delete on public.project_images for delete to authenticated using((select public.is_admin()));
drop policy reviews_owner on public.reviews;
create policy reviews_owner_insert on public.reviews for insert to authenticated with check((select public.is_admin()));
create policy reviews_owner_update on public.reviews for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy reviews_owner_delete on public.reviews for delete to authenticated using((select public.is_admin()));
drop policy services_owner on public.services;
create policy services_owner_insert on public.services for insert to authenticated with check((select public.is_admin()));
create policy services_owner_update on public.services for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy services_owner_delete on public.services for delete to authenticated using((select public.is_admin()));
drop policy faqs_owner on public.faqs;
create policy faqs_owner_insert on public.faqs for insert to authenticated with check((select public.is_admin()));
create policy faqs_owner_update on public.faqs for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy faqs_owner_delete on public.faqs for delete to authenticated using((select public.is_admin()));

-- Explicit defense-in-depth denial; the private definer lookup alone bypasses this table’s RLS.
create policy admin_membership_denied on private.admin_users as restrictive for all to anon,authenticated using(false) with check(false);
