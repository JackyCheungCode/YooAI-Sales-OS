-- Payment & receivables workspace (additive; does not store bank account numbers).
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete restrict,
  order_number text not null,
  status text not null default 'confirmed',
  currency_code char(3) not null default 'USD',
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  payment_terms jsonb not null default '{}'::jsonb,
  confirmed_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, order_number)
);

create table if not exists public.receivable_schedules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  schedule_number text not null,
  order_id uuid not null references public.orders(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  shipment_id uuid,
  payment_type text not null check (payment_type in ('deposit','balance','full_payment','price_adjustment','refund','compensation')),
  currency_code char(3) not null,
  due_amount numeric(14,2) not null check (due_amount >= 0),
  due_date date not null,
  reference_fx_rate numeric(18,8),
  reference_fx_source text,
  reference_fx_at timestamptz,
  status text not null default 'pending' check (status in ('pending','partially_paid','paid','overdue','disputed','refunded','closed')),
  terms_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, schedule_number)
);

create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  payment_number text not null,
  schedule_id uuid references public.receivable_schedules(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  shipment_id uuid,
  payment_type text not null check (payment_type in ('deposit','balance','full_payment','price_adjustment','refund','compensation')),
  receivable_amount numeric(14,2) not null check (receivable_amount >= 0),
  remitted_amount numeric(14,2) not null default 0 check (remitted_amount >= 0),
  remitted_at timestamptz,
  received_amount numeric(14,2) not null default 0 check (received_amount >= 0),
  currency_code char(3) not null,
  received_at timestamptz,
  fx_rate numeric(18,8),
  fx_source text,
  fx_rate_at timestamptz,
  bank_fee numeric(14,2) not null default 0 check (bank_fee >= 0),
  intermediary_fee numeric(14,2) not null default 0 check (intermediary_fee >= 0),
  net_received_amount numeric(14,2) not null default 0 check (net_received_amount >= 0),
  base_currency_code char(3),
  base_currency_amount numeric(14,2),
  realized_fx_gain_loss numeric(14,2),
  difference_reason text check (difference_reason is null or difference_reason in ('bank_fee','discount','short_shipment_claim','fx_difference','customer_underpayment','other')),
  difference_note text,
  remitter_name text,
  remitter_bank text,
  remitter_country text,
  remitter_matches_customer boolean,
  remitter_mismatch_reason text,
  payment_method text check (payment_method is null or payment_method in ('TT','LC','DP','DA','credit_card','third_party_platform','other')),
  bank_reference text,
  lc_number text,
  lc_issuing_bank text,
  lc_expiry_date date,
  lc_presentation_days integer,
  lc_discrepancy boolean,
  lc_discrepancy_note text,
  status text not null default 'pending' check (status in ('pending','payment_notified','remitted_pending_confirmation','partially_received','received','overdue','disputed','reconciled','refunded')),
  finance_confirmed_by uuid references auth.users(id),
  finance_confirmed_at timestamptz,
  dispute_reason text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, payment_number),
  check (remitter_matches_customer is distinct from false or nullif(trim(remitter_mismatch_reason),'') is not null),
  check (received_amount = 0 or received_at is not null),
  check (difference_reason is null or nullif(trim(difference_note),'') is not null)
);

create table if not exists public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  payment_record_id uuid not null references public.payment_records(id) on delete restrict,
  schedule_id uuid not null references public.receivable_schedules(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  allocated_amount numeric(14,2) not null check (allocated_amount > 0),
  currency_code char(3) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_collection_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  payment_record_id uuid not null references public.payment_records(id) on delete cascade,
  contact_method text not null check (contact_method in ('email','whatsapp','phone','letter','other')),
  contacted_at timestamptz not null default now(),
  response_summary text,
  promised_payment_date date,
  next_follow_up_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.payment_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  payment_record_id uuid not null references public.payment_records(id) on delete cascade,
  document_type text not null check (document_type in ('remittance_advice','bank_receipt','lc_copy','lc_amendment','collection_letter','dispute_correspondence','reconciliation_proof','other')),
  file_name text not null,
  storage_path text,
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.payment_audit_logs (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  payment_record_id uuid references public.payment_records(id) on delete set null,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists receivable_schedules_owner_due_idx on public.receivable_schedules(owner_id,due_date,status);
create index if not exists payment_records_owner_status_idx on public.payment_records(owner_id,status,created_at desc);
create index if not exists payment_records_order_idx on public.payment_records(order_id);
create index if not exists payment_records_customer_idx on public.payment_records(customer_id);
create index if not exists payment_allocations_schedule_idx on public.payment_allocations(schedule_id);
create index if not exists payment_collection_next_idx on public.payment_collection_logs(owner_id,next_follow_up_at);
create index if not exists payment_audit_payment_idx on public.payment_audit_logs(payment_record_id,created_at desc);

do $$
declare t text;
begin
  foreach t in array array['orders','receivable_schedules','payment_records','payment_allocations','payment_collection_logs','payment_documents','payment_audit_logs']
  loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists "payment owner read" on public.%I',t);
    execute format('create policy "payment owner read" on public.%I for select to authenticated using (owner_id = (select auth.uid()))',t);
    execute format('drop policy if exists "payment owner insert" on public.%I',t);
    execute format('create policy "payment owner insert" on public.%I for insert to authenticated with check (owner_id = (select auth.uid()))',t);
    execute format('drop policy if exists "payment owner update" on public.%I',t);
    execute format('create policy "payment owner update" on public.%I for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))',t);
  end loop;
end $$;

drop policy if exists "payment owner delete" on public.payment_collection_logs;
create policy "payment owner delete" on public.payment_collection_logs for delete to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "payment owner delete" on public.payment_documents;
create policy "payment owner delete" on public.payment_documents for delete to authenticated using (owner_id = (select auth.uid()));

grant select,insert,update,delete on public.orders,public.receivable_schedules,public.payment_records,public.payment_allocations,public.payment_collection_logs,public.payment_documents to authenticated;
grant select,insert on public.payment_audit_logs to authenticated;
grant usage,select on sequence public.payment_audit_logs_id_seq to authenticated;

-- Record confirmation is reserved for trusted application roles in app_metadata.
create or replace function public.confirm_payment_receipt(p_payment_id uuid, p_received_amount numeric, p_received_at timestamptz, p_fx_rate numeric default null, p_fx_source text default null, p_bank_fee numeric default 0, p_intermediary_fee numeric default 0, p_difference_reason text default null, p_difference_note text default null)
returns jsonb language plpgsql security invoker set search_path = ''
as $$
declare
  v_role text := coalesce(auth.jwt()->'app_metadata'->>'role','');
  v_payment public.payment_records%rowtype;
  v_net numeric(14,2);
  v_status text;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if v_role not in ('finance','admin','executive') then raise exception 'Only finance-authorized users may confirm bank receipt' using errcode='42501'; end if;
  if p_received_amount < 0 or p_bank_fee < 0 or p_intermediary_fee < 0 then raise exception 'Amounts and fees must not be negative' using errcode='22023'; end if;
  if p_received_amount <> 0 and p_received_at is null then raise exception 'Receipt date is required' using errcode='22023'; end if;
  if abs(coalesce(p_received_amount,0) - coalesce((select receivable_amount from public.payment_records where id=p_payment_id and owner_id=auth.uid()),0)) > 0.0001
     and (p_difference_reason is null or nullif(trim(p_difference_note),'') is null) then
    raise exception 'A difference reason and note are required when received amount differs from receivable' using errcode='22023';
  end if;
  select * into v_payment from public.payment_records where id=p_payment_id and owner_id=auth.uid() for update;
  if not found then raise exception 'Payment record not found or access denied' using errcode='P0002'; end if;
  if v_payment.status in ('reconciled','refunded') then raise exception 'Closed payment cannot be reconfirmed' using errcode='55000'; end if;
  v_net := greatest(0,p_received_amount-coalesce(p_bank_fee,0)-coalesce(p_intermediary_fee,0));
  v_status := case when p_received_amount=0 then 'pending' when p_received_amount < v_payment.receivable_amount then 'partially_received' else 'received' end;
  update public.payment_records set received_amount=p_received_amount, received_at=p_received_at, fx_rate=p_fx_rate,
    fx_source=p_fx_source, fx_rate_at=case when p_fx_rate is not null then p_received_at else null end,
    bank_fee=p_bank_fee, intermediary_fee=p_intermediary_fee, net_received_amount=v_net,
    difference_reason=p_difference_reason, difference_note=p_difference_note, status=v_status,
    finance_confirmed_by=auth.uid(), finance_confirmed_at=now(), updated_at=now()
    where id=p_payment_id returning * into v_payment;
  insert into public.payment_audit_logs(owner_id,payment_record_id,action,new_values,created_by)
    values(v_payment.owner_id,v_payment.id,'finance_receipt_confirmed',to_jsonb(v_payment),auth.uid());
  return jsonb_build_object('payment_id',v_payment.id,'status',v_payment.status,'net_received_amount',v_net,'finance_confirmed_at',v_payment.finance_confirmed_at);
end $$;
revoke all on function public.confirm_payment_receipt(uuid,numeric,timestamptz,numeric,text,numeric,numeric,text,text) from public,anon;
grant execute on function public.confirm_payment_receipt(uuid,numeric,timestamptz,numeric,text,numeric,numeric,text,text) to authenticated;

create or replace function public.payment_display_status(p_id uuid, p_status text, p_due_date date, p_receivable numeric, p_received numeric)
returns text language sql stable set search_path = ''
as $$
  select case
    when p_status in ('disputed','reconciled','refunded') then p_status
    when coalesce(p_received,0) >= coalesce(p_receivable,0) and p_receivable > 0 then 'received'
    when coalesce(p_received,0) > 0 then 'partially_received'
    when p_due_date < current_date then 'overdue'
    else p_status
  end
$$;

-- Prevent non-finance users from writing bank-confirmed values directly through table updates.
create or replace function public.guard_payment_finance_fields()
returns trigger language plpgsql set search_path = ''
as $$
declare v_role text := coalesce(auth.jwt()->'app_metadata'->>'role','');
begin
  if v_role not in ('finance','admin','executive') then
    if tg_op = 'INSERT' then
      if coalesce(new.received_amount,0) <> 0 or new.finance_confirmed_at is not null
        or new.finance_confirmed_by is not null or new.status in ('received','reconciled') then
        raise exception 'Finance confirmation fields may only be set by authorized finance users' using errcode='42501';
      end if;
    else
      if new.received_amount is distinct from old.received_amount
        or new.bank_fee is distinct from old.bank_fee
        or new.intermediary_fee is distinct from old.intermediary_fee
        or new.net_received_amount is distinct from old.net_received_amount
        or new.fx_rate is distinct from old.fx_rate
        or new.fx_source is distinct from old.fx_source
        or new.finance_confirmed_by is distinct from old.finance_confirmed_by
        or new.finance_confirmed_at is distinct from old.finance_confirmed_at
        or new.status in ('received','reconciled') and old.status not in ('received','reconciled') then
        raise exception 'Finance confirmation fields may only be changed by authorized finance users' using errcode='42501';
      end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists payment_finance_fields_guard on public.payment_records;
create trigger payment_finance_fields_guard before insert or update on public.payment_records
for each row execute function public.guard_payment_finance_fields();

-- Idempotently create an order's receivable schedule from its stored payment terms.
create or replace function public.generate_order_receivables(p_order_id uuid)
returns jsonb language plpgsql security invoker set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_terms jsonb;
  v_deposit_pct numeric := 0;
  v_deposit_days integer := 7;
  v_balance_days integer := 30;
  v_due_date date;
  v_created integer := 0;
  v_number text;
  v_base_date date;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
  select * into v_order from public.orders where id=p_order_id and owner_id=auth.uid() for update;
  if not found then raise exception 'Order not found or access denied' using errcode='P0002'; end if;
  if exists(select 1 from public.receivable_schedules where order_id=v_order.id and owner_id=auth.uid()) then
    return jsonb_build_object('order_id',v_order.id,'created',0,'already_exists',true);
  end if;
  v_terms := coalesce(v_order.payment_terms,'{}'::jsonb);
  v_deposit_pct := greatest(0,least(100,coalesce((v_terms->>'deposit_percent')::numeric,0)));
  v_deposit_days := greatest(0,least(3650,coalesce((v_terms->>'deposit_due_days')::integer,7)));
  v_balance_days := greatest(0,least(3650,coalesce((v_terms->>'balance_due_days')::integer,30)));
  v_base_date := coalesce(v_order.confirmed_at::date,v_order.created_at::date,current_date);
  if v_deposit_pct > 0 then
    v_number := 'AR-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
    insert into public.receivable_schedules(owner_id,schedule_number,order_id,customer_id,payment_type,currency_code,due_amount,due_date,status,terms_snapshot)
    values(auth.uid(),v_number,v_order.id,v_order.customer_id,'deposit',v_order.currency_code,round(v_order.total_amount*v_deposit_pct/100,2),v_base_date+v_deposit_days,'pending',jsonb_build_object('deposit_percent',v_deposit_pct,'deposit_due_days',v_deposit_days));
    v_created := v_created+1;
  end if;
  if v_deposit_pct < 100 then
    v_number := 'AR-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
    v_due_date := case
      when coalesce(v_terms->>'balance_due_from','order_confirmed') in ('bill_of_lading','arrival') then v_base_date+v_balance_days
      else v_base_date+v_balance_days
    end;
    insert into public.receivable_schedules(owner_id,schedule_number,order_id,customer_id,payment_type,currency_code,due_amount,due_date,status,terms_snapshot)
    values(auth.uid(),v_number,v_order.id,v_order.customer_id,'balance',v_order.currency_code,round(v_order.total_amount*(100-v_deposit_pct)/100,2),v_due_date,'pending',
      jsonb_build_object('balance_due_from',coalesce(v_terms->>'balance_due_from','order_confirmed'),'balance_due_days',v_balance_days,'requires_shipment_date_update',coalesce(v_terms->>'balance_due_from','order_confirmed') in ('bill_of_lading','arrival')));
    v_created := v_created+1;
  end if;
  insert into public.payment_audit_logs(owner_id,action,new_values,created_by)
  values(auth.uid(),'receivable_schedules_generated',jsonb_build_object('order_id',v_order.id,'created',v_created),auth.uid());
  return jsonb_build_object('order_id',v_order.id,'created',v_created,'already_exists',false);
end $$;
revoke all on function public.generate_order_receivables(uuid) from public,anon;
grant execute on function public.generate_order_receivables(uuid) to authenticated;
