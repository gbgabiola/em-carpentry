-- Apply with Supabase migrations. No real users, reviews or projects are seeded.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.admin_users (user_id uuid primary key references auth.users(id) on delete cascade);
revoke all on private.admin_users from public, anon, authenticated;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from private.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.projects (
 id uuid primary key default gen_random_uuid(), slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 100),
 title text not null check(length(trim(title)) between 1 and 120), summary text not null check(length(trim(summary)) between 1 and 300),
 description text not null check(length(trim(description)) between 1 and 10000), category text not null default '' check(length(category) <= 80),
 location text not null default '' check(length(location) <= 120), completion_date date,
 status text not null default 'draft' check(status in ('draft','published','archived')), featured boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.project_images (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
 path text not null unique, alt text not null check(length(trim(alt)) between 1 and 250), display_order integer not null default 0 check(display_order >= 0),
 role text not null default 'gallery' check(role in ('gallery','before','after')),
 created_at timestamptz not null default now(),
 check(path ~ ('^' || project_id::text || '/[a-f0-9-]+[.]webp$'))
);
create index project_images_project_idx on public.project_images(project_id);
create index projects_public_idx on public.projects(status, created_at desc);

create table public.reviews (
 id uuid primary key default gen_random_uuid(), display_name text not null check(length(trim(display_name)) between 1 and 100),
 rating integer check(rating between 1 and 5), body text not null check(length(trim(body)) between 1 and 3000),
 source text not null default 'website' check(source in ('website','facebook')), source_url text,
 consent boolean not null default false, status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 check(status <> 'approved' or consent), check(source <> 'website' or rating is not null),
 check(source <> 'facebook' or (source_url is not null and source_url ~ '^https://(www[.])?facebook[.]com/[^[:space:]]+$'))
);
create table public.enquiries (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name)) between 1 and 100),
 contact_method text not null check(contact_method in ('email','phone')), contact_details text not null check(length(trim(contact_details)) between 3 and 320),
 description text not null check(length(trim(description)) between 10 and 5000), suburb text not null default '' check(length(suburb) <= 120),
 status text not null default 'new' check(status in ('new','reviewed','closed')), created_at timestamptz not null default now()
);
create table public.business_settings (
 id integer primary key default 1 check(id=1), about_text text not null check(length(trim(about_text)) between 1 and 3000),
 service_area text not null check(length(trim(service_area)) between 1 and 200)
);
insert into public.business_settings(id, about_text, service_area) values(1,
 'Neat workmanship, attention to detail and a willingness to go the extra mile guide EM Carpentry & Home Maintenance. Operating in Australia since 2018.',
 'Geelong, VIC, Australia, and nearby areas');

alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.reviews enable row level security;
alter table public.enquiries enable row level security;
alter table public.business_settings enable row level security;
revoke all on public.projects, public.project_images, public.reviews, public.enquiries, public.business_settings from public, anon, authenticated;
grant select on public.projects, public.project_images, public.reviews, public.business_settings to anon;
grant select,insert,update,delete on public.projects, public.project_images, public.reviews to authenticated;
grant select,update,delete on public.enquiries to authenticated;
grant select,update on public.business_settings to authenticated;
create policy projects_read on public.projects for select to anon, authenticated using(status='published' or (select public.is_admin()));
create policy projects_owner on public.projects for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy images_read on public.project_images for select to anon, authenticated using(exists(select 1 from public.projects p where p.id=project_id and (p.status='published' or (select public.is_admin()))));
create policy images_owner on public.project_images for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy reviews_read on public.reviews for select to anon, authenticated using((status='approved' and consent) or (select public.is_admin()));
create policy reviews_owner on public.reviews for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy enquiries_owner on public.enquiries for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy settings_read on public.business_settings for select to anon, authenticated using(true);
create policy settings_owner on public.business_settings for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));

create or replace function public.touch_project() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
revoke all on function public.touch_project() from public;
create trigger projects_updated before update on public.projects for each row execute function public.touch_project();

-- Private bucket: no public object URLs, SVGs or original EXIF data.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('project-images','project-images',false,5242880,array['image/webp']);
create policy portfolio_read on storage.objects for select to anon, authenticated using(bucket_id='project-images' and (
 (select public.is_admin()) or exists(select 1 from public.project_images i join public.projects p on p.id=i.project_id where i.path=name and p.status='published')
));
create policy portfolio_insert on storage.objects for insert to authenticated with check(bucket_id='project-images' and (select public.is_admin()));
create policy portfolio_update on storage.objects for update to authenticated using(bucket_id='project-images' and (select public.is_admin())) with check(bucket_id='project-images' and (select public.is_admin()));
create policy portfolio_delete on storage.objects for delete to authenticated using(bucket_id='project-images' and (select public.is_admin()));
-- No anonymous INSERT grants/policies: all public submissions remain disabled pending retention agreement.
