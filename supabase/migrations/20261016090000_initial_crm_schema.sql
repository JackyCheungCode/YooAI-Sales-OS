-- Initial CRM schema. Establishes base tables and row-level security before additive module migrations.
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 200),
  website text,
  industry text,
  country text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  name text not null check (char_length(trim(name)) between 1 and 200),
  customer_type text not null default 'prospect' check (customer_type in ('prospect','customer','partner')),
  status text not null default 'active' check (status in ('active','inactive','qualified','unqualified')),
  email text,
  phone text,
  country text,
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  full_name text not null check (char_length(trim(full_name)) between 1 and 200),
  job_title text,
  email text,
  phone text,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  contact_name text,
  company_name text,
  email text,
  phone text,
  source text,
  stage text not null default 'new' check (stage in ('new','contacted','qualified','proposal','won','lost')),
  estimated_value numeric(14,2) check (estimated_value is null or estimated_value >= 0),
  currency_code char(3) not null default 'USD',
  next_follow_up_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  activity_type text not null check (activity_type in ('call','email','meeting','task','note')),
  subject text not null check (char_length(trim(subject)) between 1 and 200),
  details text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists companies_owner_updated_idx on public.companies(owner_id, updated_at desc);
create index if not exists customers_owner_updated_idx on public.customers(owner_id, updated_at desc);
create index if not exists customers_company_idx on public.customers(company_id);
create index if not exists contacts_owner_name_idx on public.contacts(owner_id, full_name);
create index if not exists contacts_customer_idx on public.contacts(customer_id);
create index if not exists leads_owner_stage_idx on public.leads(owner_id, stage, created_at desc);
create index if not exists activities_owner_created_idx on public.activities(owner_id, created_at desc);
create index if not exists activities_customer_idx on public.activities(customer_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_set_updated_at before update on public.companies
for each row execute function public.set_updated_at();
create trigger customers_set_updated_at before update on public.customers
for each row execute function public.set_updated_at();
create trigger contacts_set_updated_at before update on public.contacts
for each row execute function public.set_updated_at();
create trigger leads_set_updated_at before update on public.leads
for each row execute function public.set_updated_at();

alter table public.companies enable row level security;
alter table public.customers enable row level security;
alter table public.contacts enable row level security;
alter table public.leads enable row level security;
alter table public.activities enable row level security;

create policy "Users can read their own companies" on public.companies for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Users can create their own companies" on public.companies for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Users can update their own companies" on public.companies for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Users can delete their own companies" on public.companies for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "Users can read their own customers" on public.customers for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Users can create their own customers" on public.customers for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Users can update their own customers" on public.customers for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Users can delete their own customers" on public.customers for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "Users can read their own contacts" on public.contacts for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Users can create their own contacts" on public.contacts for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Users can update their own contacts" on public.contacts for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Users can delete their own contacts" on public.contacts for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "Users can read their own leads" on public.leads for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Users can create their own leads" on public.leads for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Users can update their own leads" on public.leads for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Users can delete their own leads" on public.leads for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "Users can read their own activities" on public.activities for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Users can create their own activities" on public.activities for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Users can update their own activities" on public.activities for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Users can delete their own activities" on public.activities for delete to authenticated using ((select auth.uid()) = owner_id);

grant select, insert, update, delete on public.companies, public.customers, public.contacts, public.leads, public.activities to authenticated;


-- Restrictive relationship checks prevent a user from attaching their records to
-- another user's company, customer, contact, or lead by guessing a foreign UUID.
create policy "Company links must belong to the same user" on public.customers
as restrictive for all to authenticated
using (owner_id = (select auth.uid()) and (company_id is null or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid()))))
with check (owner_id = (select auth.uid()) and (company_id is null or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid()))));

create policy "Contact links must belong to the same user" on public.contacts
as restrictive for all to authenticated
using (owner_id = (select auth.uid())
  and (customer_id is null or exists (select 1 from public.customers c where c.id = customer_id and c.owner_id = (select auth.uid())))
  and (company_id is null or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid()))))
with check (owner_id = (select auth.uid())
  and (customer_id is null or exists (select 1 from public.customers c where c.id = customer_id and c.owner_id = (select auth.uid())))
  and (company_id is null or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid()))));

create policy "Lead company links must belong to the same user" on public.leads
as restrictive for all to authenticated
using (owner_id = (select auth.uid()) and (company_id is null or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid()))))
with check (owner_id = (select auth.uid()) and (company_id is null or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid()))));

create policy "Activity links must belong to the same user" on public.activities
as restrictive for all to authenticated
using (owner_id = (select auth.uid())
  and (customer_id is null or exists (select 1 from public.customers c where c.id = customer_id and c.owner_id = (select auth.uid())))
  and (contact_id is null or exists (select 1 from public.contacts c where c.id = contact_id and c.owner_id = (select auth.uid())))
  and (lead_id is null or exists (select 1 from public.leads l where l.id = lead_id and l.owner_id = (select auth.uid()))))
with check (owner_id = (select auth.uid())
  and (customer_id is null or exists (select 1 from public.customers c where c.id = customer_id and c.owner_id = (select auth.uid())))
  and (contact_id is null or exists (select 1 from public.contacts c where c.id = contact_id and c.owner_id = (select auth.uid())))
  and (lead_id is null or exists (select 1 from public.leads l where l.id = lead_id and l.owner_id = (select auth.uid()))));
