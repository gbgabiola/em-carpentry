-- Keep the restricted writer independent of provider-managed Auth grants.
-- The public invoker checks auth.uid(); the private gateway independently checks
-- the same trusted JWT subject without using the managed auth schema.
revoke usage on schema auth from website_intake;
revoke execute on function auth.uid() from website_intake;

create or replace function private.submit_website_submission(
 p_kind text,p_secret text,p_request_id uuid,p_rate_key text,p_data jsonb
) returns text language plpgsql security definer set search_path='' as $$
declare
 v_now timestamptz := statement_timestamp();
 v_day timestamptz := date_trunc('day',statement_timestamp() at time zone 'UTC') at time zone 'UTC';
 v_payload_hash bytea;
 v_prior private.intake_requests%rowtype;
begin
 if coalesce(
      nullif(current_setting('request.jwt.claim.sub',true),''),
      nullif(current_setting('request.jwt.claims',true),'')::jsonb ->> 'sub'
    ) is not null or p_secret is null or length(p_secret)<>64
    or not exists(select 1 from private.intake_credentials
      where id=1 and enabled and key_hash=sha256(convert_to(p_secret,'UTF8'))) then
   raise exception 'Submission gateway unavailable' using errcode='42501';
 end if;
 if p_kind is null or p_kind not in ('enquiry','review') or p_request_id is null
    or p_rate_key is null or p_rate_key !~ '^[a-f0-9]{64}$'
    or p_data is null or jsonb_typeof(p_data)<>'object' then
   raise exception 'Invalid submission' using errcode='22023';
 end if;
 if p_kind='enquiry' then
   if (p_data - array['name','contact_method','contact_details','description','suburb'])<>'{}'::jsonb
      or coalesce(jsonb_typeof(p_data->'name'),'')<>'string'
      or coalesce(jsonb_typeof(p_data->'description'),'')<>'string'
      or coalesce(jsonb_typeof(p_data->'contact_details'),'')<>'string'
      or coalesce(jsonb_typeof(p_data->'suburb'),'')<>'string'
      or coalesce(p_data->>'contact_method','') not in ('email','phone')
      or length(trim(p_data->>'name')) not between 1 and 100
      or length(trim(p_data->>'description')) not between 10 and 5000
      or length(p_data->>'suburb')>120
      or length(p_data->>'contact_details') not between 3 and 320 then
     raise exception 'Invalid enquiry' using errcode='22023';
   end if;
   if (p_data->>'contact_method'='email' and p_data->>'contact_details' !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')
      or (p_data->>'contact_method'='phone' and (
        p_data->>'contact_details' !~ '^[+]?[0-9 ()-]{6,30}$'
        or length(regexp_replace(p_data->>'contact_details','[^0-9]','','g'))<6)) then
     raise exception 'Invalid contact details' using errcode='22023';
   end if;
 else
   if (p_data - array['display_name','rating','body','consent'])<>'{}'::jsonb
      or coalesce(jsonb_typeof(p_data->'display_name'),'')<>'string'
      or coalesce(jsonb_typeof(p_data->'body'),'')<>'string'
      or coalesce(jsonb_typeof(p_data->'rating'),'')<>'number'
      or coalesce(p_data->>'rating','') !~ '^[1-5]$'
      or p_data->'consent' is distinct from 'true'::jsonb
      or length(trim(p_data->>'display_name')) not between 1 and 100
      or length(trim(p_data->>'body')) not between 1 and 3000 then
     raise exception 'Invalid review' using errcode='22023';
   end if;
 end if;
 v_payload_hash=sha256(convert_to(p_kind||p_data::text,'UTF8'));
 -- One short transaction serialises quota checks and inserts, including concurrent requests.
 perform pg_advisory_xact_lock(754726121);
 select * into v_prior from private.intake_requests where request_id=p_request_id;
 if found then
   if v_prior.kind=p_kind and v_prior.rate_key=p_rate_key and v_prior.payload_hash=v_payload_hash then
     return 'duplicate';
   end if;
   return 'invalid';
 end if;
 if (select count(*) from private.intake_requests where created_at>=v_day)>=40
    or (select count(*) from private.intake_requests where rate_key=p_rate_key and created_at>=v_now-interval '24 hours')>=8
    or (select count(*) from private.intake_requests where rate_key=p_rate_key and created_at>=v_now-interval '1 hour')>=3 then
   return 'rate_limited';
 end if;
 if p_kind='enquiry' then
   insert into public.enquiries(name,contact_method,contact_details,description,suburb,status)
   values(trim(p_data->>'name'),p_data->>'contact_method',trim(p_data->>'contact_details'),trim(p_data->>'description'),trim(p_data->>'suburb'),'new');
 else
   insert into public.reviews(display_name,rating,body,consent,status,source,source_url)
   values(trim(p_data->>'display_name'),(p_data->>'rating')::integer,trim(p_data->>'body'),true,'pending','website',null);
 end if;
 insert into private.intake_requests(request_id,kind,rate_key,payload_hash)
 values(p_request_id,p_kind,p_rate_key,v_payload_hash);
 return 'accepted';
end $$;

revoke all on function private.submit_website_submission(text,text,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function private.submit_website_submission(text,text,uuid,text,jsonb) to anon;
create or replace function public.submit_website_submission(
 p_kind text,p_secret text,p_request_id uuid,p_rate_key text,p_data jsonb
) returns text language plpgsql security invoker set search_path='' as $$
begin
 if (select auth.uid()) is not null then
   raise exception 'Submission gateway unavailable' using errcode='42501';
 end if;
 return private.submit_website_submission(p_kind,p_secret,p_request_id,p_rate_key,p_data);
end $$;
revoke all on function public.submit_website_submission(text,text,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.submit_website_submission(text,text,uuid,text,jsonb) to anon;
