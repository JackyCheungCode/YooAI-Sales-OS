-- Core CRM relationships: additive, transaction-safe, and owner-scoped.
-- This migration is intentionally additive; existing customer/lead records are preserved.

alter table public.customers
  add column if not exists lifecycle_stage text not null default 'potential'
    check (lifecycle_stage in ('potential','new','existing','churned')),
  add column if not exists first_order_at timestamptz,
  add column if not exists lifetime_order_value numeric(14,2) not null default 0
    check (lifetime_order_value >= 0),
  add column if not exists risk_flags jsonb not null default '[]'::jsonb;

alter table public.contacts
  add column if not exists roles text[] not null default '{}',
  add column if not exists is_decision_maker boolean not null default false,
  add column if not exists employment_status text not null default 'active'
    check (employment_status in ('active','left','unreachable'));

alter table public.leads
  add column if not exists converted_at timestamptz,
  add column if not exists converted_customer_id uuid references public.customers(id) on delete set null,
  add column if not exists converted_contact_id uuid references public.contacts(id) on delete set null,
  add column if not exists converted_opportunity_id uuid,
  add column if not exists conversion_note text,
  add column if not exists contact_title text,
  add column if not exists country text,
  add column if not exists city text,
  add column if not exists website text,
  add column if not exists product_interest text,
  add column if not exists estimated_volume text,
  add column if not exists target_price text;

alter table public.leads drop constraint if exists leads_stage_check;
alter table public.leads add constraint leads_stage_check
  check (stage in ('new','contacted','qualified','proposal','won','lost','converted'));

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  customer_id uuid not null references public.customers(id) on delete restrict,
  primary_contact_id uuid references public.contacts(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 200),
  stage text not null default 'qualification'
    check (stage in ('qualification','discovery','proposal','negotiation','deposit_pending','won','lost','on_hold')),
  amount numeric(14,2) not null default 0 check (amount >= 0),
  currency_code char(3) not null default 'USD',
  expected_close_date date,
  source_lead_id uuid unique references public.leads(id) on delete set null,
  loss_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.opportunity_contacts (
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  contact_role text not null default 'influencer'
    check (contact_role in ('decision_maker','buyer','finance','logistics','technical','influencer','other')),
  created_at timestamptz not null default now(),
  primary key (opportunity_id, contact_id)
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists opportunities_owner_stage_idx on public.opportunities(owner_id, stage, updated_at desc);
create index if not exists opportunities_customer_idx on public.opportunities(customer_id);
create index if not exists opportunity_contacts_contact_idx on public.opportunity_contacts(contact_id);
create index if not exists audit_logs_owner_created_idx on public.audit_logs(owner_id, created_at desc);
create index if not exists leads_converted_customer_idx on public.leads(converted_customer_id);
create unique index if not exists contacts_one_primary_per_customer_idx
  on public.contacts(customer_id) where is_primary and customer_id is not null;
alter table public.leads drop constraint if exists leads_converted_opportunity_id_fkey;
alter table public.leads add constraint leads_converted_opportunity_id_fkey
  foreign key (converted_opportunity_id) references public.opportunities(id) on delete set null;

drop trigger if exists opportunities_set_updated_at on public.opportunities;
create trigger opportunities_set_updated_at before update on public.opportunities
for each row execute function public.set_updated_at();

alter table public.opportunities enable row level security;
alter table public.opportunity_contacts enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Users can read own opportunities" on public.opportunities;
create policy "Users can read own opportunities" on public.opportunities
  for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "Users can create own opportunities" on public.opportunities;
create policy "Users can create own opportunities" on public.opportunities
  for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists "Users can update own opportunities" on public.opportunities;
create policy "Users can update own opportunities" on public.opportunities
  for update to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
drop policy if exists "Users can delete own opportunities" on public.opportunities;
create policy "Users can delete own opportunities" on public.opportunities
  for delete to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "Users can read own opportunity contacts" on public.opportunity_contacts;
create policy "Users can read own opportunity contacts" on public.opportunity_contacts
  for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "Users can manage own opportunity contacts" on public.opportunity_contacts;
create policy "Users can manage own opportunity contacts" on public.opportunity_contacts
  for all to authenticated
  using (owner_id = (select auth.uid())
    and exists (select 1 from public.opportunities o where o.id = opportunity_id and o.owner_id = (select auth.uid()))
    and exists (select 1 from public.contacts c where c.id = contact_id and c.owner_id = (select auth.uid())))
  with check (owner_id = (select auth.uid())
    and exists (select 1 from public.opportunities o where o.id = opportunity_id and o.owner_id = (select auth.uid()))
    and exists (select 1 from public.contacts c where c.id = contact_id and c.owner_id = (select auth.uid())));

drop policy if exists "Users can read own audit logs" on public.audit_logs;
create policy "Users can read own audit logs" on public.audit_logs
  for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "Users can create own audit logs" on public.audit_logs;
create policy "Users can create own audit logs" on public.audit_logs
  for insert to authenticated with check (owner_id = (select auth.uid()));

grant select, insert, update, delete on public.opportunities, public.opportunity_contacts to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant usage, select on sequence public.audit_logs_id_seq to authenticated;

-- A converted lead is immutable. The conversion RPC updates it exactly once.
create or replace function public.prevent_converted_lead_mutation()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if old.converted_at is not null then
    raise exception 'Converted leads are immutable; edit the linked customer, contact, or opportunity instead.'
      using errcode = '55000';
  end if;
  return new;
end;
$$;
drop trigger if exists leads_prevent_converted_mutation on public.leads;
create trigger leads_prevent_converted_mutation before update or delete on public.leads
for each row execute function public.prevent_converted_lead_mutation();

-- Conversion runs as the signed-in user and is atomic: customer, contact,
-- opportunity, role association, lead lock, and audit event commit together.
create or replace function public.convert_lead(p_lead_id uuid, p_customer_id uuid default null)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_lead public.leads%rowtype;
  v_customer public.customers%rowtype;
  v_contact public.contacts%rowtype;
  v_opportunity public.opportunities%rowtype;
  v_company_id uuid;
  v_customer_name text;
  v_contact_name text;
  v_title text;
  v_customer_reused boolean := false;
  v_make_primary boolean := false;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_lead
  from public.leads
  where id = p_lead_id and owner_id = v_user
  for update;

  if not found then
    raise exception 'Lead not found or access denied' using errcode = 'P0002';
  end if;
  if v_lead.converted_at is not null or v_lead.stage = 'converted' then
    raise exception 'Lead has already been converted' using errcode = '23505';
  end if;

  v_customer_name := coalesce(nullif(trim(v_lead.company_name), ''), nullif(trim(v_lead.contact_name), ''), 'Converted lead');
  v_contact_name := coalesce(nullif(trim(v_lead.contact_name), ''), v_customer_name);
  v_title := left('新商机 - ' || v_customer_name ||
    case when nullif(trim(v_lead.product_interest), '') is not null then ' · ' || trim(v_lead.product_interest) else '' end, 200);

  if p_customer_id is not null then
    select * into v_customer from public.customers
    where id = p_customer_id and owner_id = v_user for update;
    if not found then
      raise exception 'Target customer not found or access denied' using errcode = 'P0002';
    end if;
  else
    select * into v_customer from public.customers
    where owner_id = v_user
      and (
        (v_lead.email is not null and lower(email) = lower(v_lead.email))
        or lower(trim(name)) = lower(trim(v_customer_name))
      )
    order by case when v_lead.email is not null and lower(email) = lower(v_lead.email) then 0 else 1 end,
             created_at
    limit 1
    for update;
  end if;

  if v_customer.id is null then
    if v_lead.company_id is not null then
      select c.id into v_company_id from public.companies c
      where c.id = v_lead.company_id and c.owner_id = v_user;
    end if;
    insert into public.customers(owner_id, company_id, name, customer_type, status,
      email, phone, country, source, notes, lifecycle_stage)
    values (v_user, v_company_id, v_customer_name, 'prospect', 'qualified',
      v_lead.email, v_lead.phone, v_lead.country, v_lead.source, v_lead.notes, 'potential')
    returning * into v_customer;
  else
    v_customer_reused := true;
    update public.customers
    set email = coalesce(email, v_lead.email),
        phone = coalesce(phone, v_lead.phone),
        source = coalesce(source, v_lead.source),
        status = case when status = 'inactive' then status else 'qualified' end
    where id = v_customer.id
    returning * into v_customer;
  end if;

  select * into v_contact from public.contacts
  where owner_id = v_user and customer_id = v_customer.id
    and v_lead.email is not null and lower(email) = lower(v_lead.email)
  order by created_at limit 1 for update;

  if v_contact.id is null then
    select not exists (
      select 1 from public.contacts c
      where c.customer_id = v_customer.id and c.is_primary
    ) into v_make_primary;
    insert into public.contacts(owner_id, customer_id, company_id, full_name, job_title, email, phone, is_primary, roles)
    values (v_user, v_customer.id, v_customer.company_id, v_contact_name, v_lead.contact_title, v_lead.email, v_lead.phone, v_make_primary, array['buyer'])
    returning * into v_contact;
  else
    update public.contacts
      set full_name = coalesce(nullif(full_name, ''), v_contact_name),
          phone = coalesce(phone, v_lead.phone)
    where id = v_contact.id
    returning * into v_contact;
  end if;

  insert into public.opportunities(owner_id, company_id, customer_id, primary_contact_id,
    title, stage, amount, currency_code, source_lead_id)
  values (v_user, v_customer.company_id, v_customer.id, v_contact.id, v_title,
    'qualification', coalesce(v_lead.estimated_value, 0), v_lead.currency_code, v_lead.id)
  returning * into v_opportunity;

  insert into public.opportunity_contacts(opportunity_id, contact_id, owner_id, contact_role)
  values (v_opportunity.id, v_contact.id, v_user, 'buyer')
  on conflict (opportunity_id, contact_id) do nothing;

  update public.leads
  set stage = 'converted',
      converted_at = now(),
      converted_customer_id = v_customer.id,
      converted_contact_id = v_contact.id,
      converted_opportunity_id = v_opportunity.id
  where id = v_lead.id;

  insert into public.audit_logs(owner_id, entity_type, entity_id, action, old_values, new_values, metadata)
  values (v_user, 'lead', v_lead.id, 'converted',
    jsonb_build_object('stage', v_lead.stage),
    jsonb_build_object('stage', 'converted', 'customer_id', v_customer.id,
      'contact_id', v_contact.id, 'opportunity_id', v_opportunity.id),
    jsonb_build_object('conversion', 'lead_to_customer_contact_opportunity'));

  return jsonb_build_object(
    'lead_id', v_lead.id,
    'customer_id', v_customer.id,
    'contact_id', v_contact.id,
    'opportunity_id', v_opportunity.id,
    'customer_reused', v_customer_reused
  );
end;
$$;

revoke all on function public.convert_lead(uuid, uuid) from public, anon;
grant execute on function public.convert_lead(uuid, uuid) to authenticated;
