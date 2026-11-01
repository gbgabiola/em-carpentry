-- Expand owner-managed public content. Public customer submissions remain closed.
alter table public.business_settings
 add column phone text not null default '+61 497 175 163',
 add column email text not null default 'emcarpentry.maintenance@gmail.com',
 add column facebook_url text not null default 'https://www.facebook.com/EMscarpentryworks',
 add constraint business_phone_format check(length(phone)<=30 and regexp_replace(phone,'[ ()-]','','g') ~ '^[+]61[0-9]{9}$'),
 add constraint business_email_format check(length(email)<=320 and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
 add constraint business_facebook_url check(length(facebook_url)<=2048 and facebook_url ~ '^https://(www[.])?facebook[.]com/[^[:space:]]+$');
alter table public.projects add column comparison_enabled boolean not null default false;
create table public.services (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 1 and 120),
 slug text not null unique check(length(slug)<=100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 description text not null check(length(trim(description)) between 1 and 1500),
 display_order integer not null default 0 check(display_order between 0 and 999),
 status text not null default 'draft' check(status in ('draft','published','archived')),
 publication_confirmed boolean not null default false,
 created_at timestamptz not null default now(),
 check(status<>'published' or publication_confirmed)
);
create table public.faqs (
 id uuid primary key default gen_random_uuid(),
 question text not null check(length(trim(question)) between 1 and 200),
 answer text not null check(length(trim(answer)) between 1 and 3000),
 display_order integer not null default 0 check(display_order between 0 and 999),
 status text not null default 'draft' check(status in ('draft','published','archived')),
 publication_confirmed boolean not null default false,
 created_at timestamptz not null default now(),
 check(status<>'published' or publication_confirmed)
);
alter table public.services enable row level security;
alter table public.faqs enable row level security;
revoke all on public.services,public.faqs from public,anon,authenticated;
grant select on public.services,public.faqs to anon;
grant select,insert,update,delete on public.services,public.faqs to authenticated;
create policy services_read on public.services for select to anon,authenticated using((status='published' and publication_confirmed) or (select public.is_admin()));
create policy services_owner on public.services for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy faqs_read on public.faqs for select to anon,authenticated using((status='published' and publication_confirmed) or (select public.is_admin()));
create policy faqs_owner on public.faqs for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
-- Existing verified FAQ copy becomes editable drafts, requiring owner review before publication.
-- No offered-service inventory is invented or seeded.
insert into public.faqs(question,answer,display_order) values
 ('Which areas do you serve?','Geelong, Victoria, and nearby areas. Contact the business to discuss your location.',0),
 ('How can I request a quote?','Call, email or visit the business Facebook page using the contact page. A brief description of the work and your general suburb will help start the conversation.',1),
 ('How long has the business operated in Australia?','EM Carpentry & Home Maintenance has operated in Australia since 2018.',2),
 ('Can I see examples of completed work?','Browse the published portfolio or contact the business to discuss examples relevant to your project.',3);
