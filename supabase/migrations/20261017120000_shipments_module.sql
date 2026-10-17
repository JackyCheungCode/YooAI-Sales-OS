-- Shipment / fulfillment module. Additive migration; existing CRM/payment data is preserved.
create sequence if not exists public.shipment_number_seq;
create sequence if not exists public.receivable_schedule_number_seq;

-- Orders are a prerequisite for shipment fulfillment in fresh CRM databases.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  order_number text not null check(char_length(trim(order_number)) between 1 and 120),
  status text not null default 'confirmed' check(status in ('draft','pending_approval','sent','awaiting_deposit','confirmed','preparing','partially_shipped','shipped','closed','cancelled')),
  currency_code char(3) not null default 'USD' check(currency_code ~ '^[A-Z]{3}$'),
  total_amount numeric(14,2) not null check(total_amount > 0),
  payment_terms jsonb not null default '{}'::jsonb,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,order_number)
);
create index if not exists orders_owner_created_idx on public.orders(owner_id,created_at desc);
create index if not exists orders_customer_idx on public.orders(owner_id,customer_id);

create table if not exists public.receivable_schedules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  schedule_number text not null,
  payment_type text not null check(payment_type in ('deposit','balance','full_payment','price_adjustment','refund','compensation')),
  currency_code char(3) not null default 'USD',
  due_amount numeric(14,2) not null check(due_amount >= 0),
  due_date date not null,
  status text not null default 'pending' check(status in ('pending','payment_notified','remitted_pending_confirmation','partially_received','received','overdue','disputed','reconciled','refunded','paid','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,schedule_number)
);
create index if not exists receivable_schedules_order_idx on public.receivable_schedules(owner_id,order_id,due_date);
create index if not exists receivable_schedules_balance_idx on public.receivable_schedules(owner_id,order_id,payment_type,status);

create table if not exists public.order_audit_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  action text not null,
  old_values jsonb,
  new_values jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists order_audit_logs_order_idx on public.order_audit_logs(owner_id,order_id,created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  line_number integer not null default 1 check(line_number > 0),
  product_name text not null check(char_length(trim(product_name)) between 1 and 240),
  sku text,
  specification text,
  quantity numeric(14,3) not null check(quantity > 0),
  shipped_quantity numeric(14,3) not null default 0 check(shipped_quantity >= 0 and shipped_quantity <= quantity),
  unit text not null default '件',
  unit_price numeric(14,4) not null default 0 check(unit_price >= 0),
  currency_code char(3) not null default 'USD',
  delivery_date date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(order_id,line_number)
);
create index if not exists order_items_order_idx on public.order_items(owner_id,order_id,line_number);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  shipment_number text not null,
  order_id uuid not null references public.orders(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete restrict,
  batch_number integer not null default 1 check(batch_number > 0),
  batch_total integer check(batch_total is null or batch_total >= batch_number),
  status text not null default 'draft' check(status in ('draft','pending_booking','booked','containerized','customs_cleared','departed','in_transit','arrived','delivered','closed','cancelled')),
  release_status text not null default 'pending' check(release_status in ('pending','ready_to_send','sent','blocked')),
  release_confirmed_by uuid references auth.users(id),
  release_confirmed_at timestamptz,
  release_override_reason text,
  shipping_mode text not null default 'fcl' check(shipping_mode in ('fcl','lcl','bulk','air','express','rail')),
  incoterm text,
  origin_port text,
  destination_port text,
  latest_ship_date date,
  etd date,
  eta date,
  actual_departure_date date,
  actual_arrival_date date,
  customer_pickup_date date,
  responsible_name text,
  followup_name text,
  documentation_name text,
  consignee text,
  notify_party text,
  container_type text,
  container_count integer not null default 0 check(container_count >= 0),
  container_numbers text,
  seal_numbers text,
  carrier_name text,
  shipping_line text,
  booking_number text,
  bill_of_lading_number text,
  bill_of_lading_type text check(bill_of_lading_type is null or bill_of_lading_type in ('original','telex_release','sea_waybill')),
  vessel_voyage text,
  transshipment_info text,
  tracking_number text,
  tracking_url text,
  notes text,
  cancellation_reason text,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,shipment_number)
);
create index if not exists shipments_owner_created_idx on public.shipments(owner_id,created_at desc);
create index if not exists shipments_order_idx on public.shipments(owner_id,order_id);
create index if not exists shipments_status_eta_idx on public.shipments(owner_id,status,eta);

create table if not exists public.shipment_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete restrict,
  product_name text not null,
  sku text,
  specification text,
  quantity numeric(14,3) not null check(quantity > 0),
  unit text not null default '件',
  gross_weight numeric(14,3) not null default 0 check(gross_weight >= 0),
  net_weight numeric(14,3) not null default 0 check(net_weight >= 0),
  volume_cbm numeric(14,4) not null default 0 check(volume_cbm >= 0),
  package_count integer not null default 0 check(package_count >= 0),
  packaging_method text,
  marks text,
  production_batch text,
  production_date date,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists shipment_items_shipment_idx on public.shipment_items(owner_id,shipment_id);
create index if not exists shipment_items_order_item_idx on public.shipment_items(order_item_id);

create table if not exists public.shipment_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  document_type text not null,
  file_name text not null,
  storage_path text,
  mime_type text,
  file_size bigint check(file_size is null or file_size >= 0),
  status text not null default 'pending' check(status in ('pending','prepared','approved','sent')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  sent_at timestamptz,
  note text,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shipment_documents_shipment_idx on public.shipment_documents(owner_id,shipment_id,created_at desc);

create table if not exists public.shipment_costs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  cost_type text not null check(cost_type in ('ocean_freight','air_freight','booking_surcharge','customs','trucking','storage','inspection','insurance','other')),
  currency_code char(3) not null default 'USD',
  amount numeric(14,2) not null check(amount >= 0),
  supplier text,
  is_paid boolean not null default false,
  paid_at date,
  note text,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists shipment_costs_shipment_idx on public.shipment_costs(owner_id,shipment_id);

create table if not exists public.shipment_exceptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  exception_type text not null check(exception_type in ('delay','rolled','inspection','damage','shortage','wrong_goods','document_error','other')),
  occurred_at timestamptz not null default now(),
  reason text not null check(char_length(trim(reason)) > 0),
  responsible_party text,
  resolution text,
  loss_amount numeric(14,2) not null default 0 check(loss_amount >= 0),
  currency_code char(3) not null default 'USD',
  status text not null default 'open' check(status in ('open','investigating','resolved')),
  after_sales_ticket_id uuid,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shipment_exceptions_shipment_idx on public.shipment_exceptions(owner_id,shipment_id,occurred_at desc);

create table if not exists public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  event_type text not null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists shipment_events_shipment_idx on public.shipment_events(owner_id,shipment_id,created_at desc);

create table if not exists public.shipment_notification_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  event_key text not null,
  recipient_type text not null check(recipient_type in ('customer','sales','documentation','finance','manager')),
  recipient text,
  template_key text not null,
  locale text not null default 'en',
  scheduled_at timestamptz not null default now(),
  timezone text,
  status text not null default 'pending' check(status in ('pending','processing','sent','failed','cancelled')),
  attempts integer not null default 0 check(attempts >= 0),
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique(shipment_id,event_key,recipient_type,template_key)
);

-- Shared updated-at trigger from the base CRM schema.
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();
drop trigger if exists receivable_schedules_set_updated_at on public.receivable_schedules;
create trigger receivable_schedules_set_updated_at before update on public.receivable_schedules for each row execute function public.set_updated_at();
drop trigger if exists order_items_set_updated_at on public.order_items;
create trigger order_items_set_updated_at before update on public.order_items for each row execute function public.set_updated_at();
drop trigger if exists shipments_set_updated_at on public.shipments;
create trigger shipments_set_updated_at before update on public.shipments for each row execute function public.set_updated_at();
drop trigger if exists shipment_documents_set_updated_at on public.shipment_documents;
create trigger shipment_documents_set_updated_at before update on public.shipment_documents for each row execute function public.set_updated_at();
drop trigger if exists shipment_exceptions_set_updated_at on public.shipment_exceptions;
create trigger shipment_exceptions_set_updated_at before update on public.shipment_exceptions for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.receivable_schedules enable row level security;
alter table public.order_audit_logs enable row level security;
alter table public.order_items enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_items enable row level security;
alter table public.shipment_documents enable row level security;
alter table public.shipment_costs enable row level security;
alter table public.shipment_exceptions enable row level security;
alter table public.shipment_events enable row level security;
alter table public.shipment_notification_jobs enable row level security;

drop policy if exists "orders owner read" on public.orders;
create policy "orders owner read" on public.orders for select to authenticated using(owner_id=(select auth.uid()));
drop policy if exists "receivable schedules owner read" on public.receivable_schedules;
create policy "receivable schedules owner read" on public.receivable_schedules for select to authenticated using(owner_id=(select auth.uid()));
drop policy if exists "order audit logs owner read" on public.order_audit_logs;
create policy "order audit logs owner read" on public.order_audit_logs for select to authenticated using(owner_id=(select auth.uid()));
drop policy if exists "order items owner access" on public.order_items;
create policy "order items owner access" on public.order_items for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
drop policy if exists "shipments owner access" on public.shipments;
create policy "shipments owner access" on public.shipments for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
drop policy if exists "shipment items owner access" on public.shipment_items;
create policy "shipment items owner access" on public.shipment_items for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
drop policy if exists "shipment documents owner access" on public.shipment_documents;
drop policy if exists "shipment documents owner read" on public.shipment_documents;
drop policy if exists "shipment documents editor insert" on public.shipment_documents;
drop policy if exists "shipment documents editor update" on public.shipment_documents;
create policy "shipment documents owner read" on public.shipment_documents for select to authenticated using(owner_id=(select auth.uid()));
create policy "shipment documents editor insert" on public.shipment_documents for insert to authenticated
with check(owner_id=(select auth.uid()) and coalesce(auth.jwt()->'app_metadata'->>'role','') in ('followup','documentation','admin','executive','manager','operations','shipping'));
create policy "shipment documents editor update" on public.shipment_documents for update to authenticated
using(owner_id=(select auth.uid()) and coalesce(auth.jwt()->'app_metadata'->>'role','') in ('followup','documentation','admin','executive','manager','operations','shipping'))
with check(owner_id=(select auth.uid()) and coalesce(auth.jwt()->'app_metadata'->>'role','') in ('followup','documentation','admin','executive','manager','operations','shipping'));
drop policy if exists "shipment costs finance access" on public.shipment_costs;
create policy "shipment costs finance access" on public.shipment_costs for all to authenticated
using(owner_id=(select auth.uid()) and coalesce(auth.jwt()->'app_metadata'->>'role','') in ('finance','admin','executive'))
with check(owner_id=(select auth.uid()) and coalesce(auth.jwt()->'app_metadata'->>'role','') in ('finance','admin','executive'));
drop policy if exists "shipment exceptions owner access" on public.shipment_exceptions;
drop policy if exists "shipment exceptions owner read" on public.shipment_exceptions;
drop policy if exists "shipment exceptions editor insert" on public.shipment_exceptions;
drop policy if exists "shipment exceptions editor update" on public.shipment_exceptions;
create policy "shipment exceptions owner read" on public.shipment_exceptions for select to authenticated using(owner_id=(select auth.uid()));
create policy "shipment exceptions editor insert" on public.shipment_exceptions for insert to authenticated
with check(owner_id=(select auth.uid()) and coalesce(auth.jwt()->'app_metadata'->>'role','') in ('followup','documentation','admin','executive','manager','operations','shipping'));
create policy "shipment exceptions editor update" on public.shipment_exceptions for update to authenticated
using(owner_id=(select auth.uid()) and coalesce(auth.jwt()->'app_metadata'->>'role','') in ('followup','documentation','admin','executive','manager','operations','shipping'))
with check(owner_id=(select auth.uid()) and coalesce(auth.jwt()->'app_metadata'->>'role','') in ('followup','documentation','admin','executive','manager','operations','shipping'));
drop policy if exists "shipment events owner access" on public.shipment_events;
drop policy if exists "shipment events owner read" on public.shipment_events;
drop policy if exists "shipment events editor insert" on public.shipment_events;
create policy "shipment events owner read" on public.shipment_events for select to authenticated using(owner_id=(select auth.uid()));
create policy "shipment events editor insert" on public.shipment_events for insert to authenticated
with check(owner_id=(select auth.uid()) and coalesce(auth.jwt()->'app_metadata'->>'role','') in ('followup','documentation','admin','executive','manager','operations','shipping'));
drop policy if exists "shipment notification jobs owner access" on public.shipment_notification_jobs;
create policy "shipment notification jobs owner access" on public.shipment_notification_jobs for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));

-- Explicit Data API grants; row-level security remains the authorization boundary.
revoke insert,update,delete on public.orders,public.receivable_schedules,public.order_audit_logs from authenticated;
grant select on public.orders,public.receivable_schedules,public.order_audit_logs to authenticated;
revoke insert,update,delete on public.order_items,public.shipments,public.shipment_items from authenticated;
revoke insert,update,delete on public.shipment_documents from authenticated;
revoke delete on public.shipment_costs,public.shipment_exceptions from authenticated;
revoke update,delete on public.shipment_events from authenticated;
revoke insert,update,delete on public.shipment_notification_jobs from authenticated;
grant select on public.order_items,public.shipments,public.shipment_items,public.shipment_documents,public.shipment_costs,public.shipment_exceptions,public.shipment_events to authenticated;
grant insert on public.shipment_documents to authenticated;
grant update(status) on public.shipment_documents to authenticated;
grant insert,update on public.shipment_costs to authenticated;
grant insert,update on public.shipment_exceptions to authenticated;
grant insert on public.shipment_events to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('shipment-documents','shipment-documents',false,26214400,array['application/pdf','image/png','image/jpeg','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict(id) do nothing;
drop policy if exists "shipment documents object owner upload" on storage.objects;
create policy "shipment documents object owner upload" on storage.objects for insert to authenticated with check(bucket_id='shipment-documents' and (storage.foldername(name))[1]=(select auth.uid())::text and coalesce(auth.jwt()->'app_metadata'->>'role','') in ('followup','documentation','admin','executive','manager','operations','shipping'));
drop policy if exists "shipment documents object owner read" on storage.objects;
create policy "shipment documents object owner read" on storage.objects for select to authenticated using(bucket_id='shipment-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "shipment documents object owner delete" on storage.objects;
create policy "shipment documents object owner delete" on storage.objects for delete to authenticated using(bucket_id='shipment-documents' and (storage.foldername(name))[1]=(select auth.uid())::text and coalesce(auth.jwt()->'app_metadata'->>'role','') in ('followup','documentation','admin','executive','manager','operations','shipping'));

-- Create an order and its product rows atomically for the real-order entry point.
create or replace function public.create_order_with_items(
  p_order_number text,p_customer_id uuid,p_currency_code text,p_total_amount numeric,p_payment_terms jsonb,p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = ''
as $body$
declare
  v_order public.orders%rowtype;
  v_item jsonb;
  v_line integer := 0;
  v_quantity numeric(14,3);
  v_price numeric(14,4);
  v_items_total numeric := 0;
  v_deposit_percent numeric(5,2);
  v_deposit_due_days integer;
  v_balance_due_days integer;
  v_deposit_amount numeric(14,2);
  v_balance_amount numeric(14,2);
  v_schedule_number text;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if nullif(trim(p_order_number),'') is null then raise exception 'Order number is required' using errcode='22023'; end if;
  if p_currency_code !~ '^[A-Z]{3}$' then raise exception 'Currency must be a three-letter ISO code' using errcode='22023'; end if;
  if p_total_amount <= 0 then raise exception 'Order amount must be positive' using errcode='22023'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'At least one order item is required' using errcode='22023'; end if;
  if not exists(select 1 from public.customers c where c.id=p_customer_id and c.owner_id=auth.uid() and c.customer_type='customer') then
    raise exception 'Customer not found or is not an active customer record' using errcode='42501';
  end if;
  insert into public.orders(owner_id,customer_id,order_number,status,currency_code,total_amount,payment_terms,confirmed_at)
  values(auth.uid(),p_customer_id,trim(p_order_number),'confirmed',p_currency_code,p_total_amount,coalesce(p_payment_terms,'{}'::jsonb),now())
  returning * into v_order;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_line := v_line+1;
    v_quantity := (v_item->>'quantity')::numeric;
    v_price := coalesce(nullif(v_item->>'unit_price','')::numeric,0);
    if nullif(trim(v_item->>'product_name'),'') is null or v_quantity is null or v_quantity<=0 or v_price<0 then
      raise exception 'Each order item requires a product name, positive quantity, and non-negative price' using errcode='22023';
    end if;
    insert into public.order_items(owner_id,order_id,line_number,product_name,sku,specification,quantity,unit,unit_price,currency_code,note)
    values(auth.uid(),v_order.id,v_line,trim(v_item->>'product_name'),nullif(v_item->>'sku',''),nullif(v_item->>'specification',''),v_quantity,coalesce(nullif(v_item->>'unit',''),'件'),v_price,p_currency_code,nullif(v_item->>'note',''));
    v_items_total := v_items_total + (v_quantity*v_price);
  end loop;
  if round(v_items_total,2)<>round(p_total_amount,2) then
    raise exception 'Order total must equal the sum of its product lines' using errcode='22023';
  end if;
  v_deposit_percent := greatest(0,least(100,coalesce(nullif(v_order.payment_terms->>'deposit_percent','')::numeric,0)));
  v_deposit_due_days := greatest(0,coalesce(nullif(v_order.payment_terms->>'deposit_due_days','')::integer,7));
  v_balance_due_days := greatest(0,coalesce(nullif(v_order.payment_terms->>'balance_due_days','')::integer,30));
  v_deposit_amount := round(v_order.total_amount*v_deposit_percent/100,2);
  v_balance_amount := greatest(0,v_order.total_amount-v_deposit_amount);

  if v_deposit_amount>0 then
    v_schedule_number := 'AR-'||to_char(current_date,'YYYYMMDD')||'-'||lpad(nextval('public.receivable_schedule_number_seq')::text,6,'0');
    insert into public.receivable_schedules(owner_id,order_id,customer_id,schedule_number,payment_type,currency_code,due_amount,due_date,status)
    values(auth.uid(),v_order.id,v_order.customer_id,v_schedule_number,'deposit',v_order.currency_code,v_deposit_amount,current_date+v_deposit_due_days,'pending');
  end if;

  if v_balance_amount>0 then
    v_schedule_number := 'AR-'||to_char(current_date,'YYYYMMDD')||'-'||lpad(nextval('public.receivable_schedule_number_seq')::text,6,'0');
    insert into public.receivable_schedules(owner_id,order_id,customer_id,schedule_number,payment_type,currency_code,due_amount,due_date,status)
    values(auth.uid(),v_order.id,v_order.customer_id,v_schedule_number,'balance',v_order.currency_code,v_balance_amount,current_date+v_balance_due_days,'pending');
  end if;

  insert into public.order_audit_logs(owner_id,order_id,action,new_values,created_by)
  values(auth.uid(),v_order.id,'order_created',jsonb_build_object('order_number',v_order.order_number,'total_amount',v_order.total_amount,'currency_code',v_order.currency_code,'source','shipment_module_order_entry'),auth.uid());
  return jsonb_build_object('order_id',v_order.id,'order_number',v_order.order_number,'customer_id',v_order.customer_id);
end;
$body$;
revoke all on function public.create_order_with_items(text,uuid,text,numeric,jsonb,jsonb) from public,anon;
grant execute on function public.create_order_with_items(text,uuid,text,numeric,jsonb,jsonb) to authenticated;

-- Atomic shipment creation serializes on the order row and validates each remaining quantity.
create or replace function public.create_shipment_with_items(
  p_order_id uuid,p_shipping_mode text,p_incoterm text,p_origin_port text,p_destination_port text,
  p_latest_ship_date date,p_etd date,p_eta date,p_responsible_name text,p_consignee text,p_notify_party text,
  p_booking_number text,p_bill_of_lading_number text,p_vessel_voyage text,p_container_numbers text,p_seal_numbers text,
  p_notes text,p_batch_total integer,p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = ''
as $body$
declare
  v_order public.orders%rowtype;
  v_shipment public.shipments%rowtype;
  v_item jsonb;
  v_order_item public.order_items%rowtype;
  v_quantity numeric(14,3);
  v_number text;
  v_batch integer;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if coalesce(auth.jwt()->'app_metadata'->>'role','') not in ('followup','documentation','admin','executive','manager','operations','shipping') then raise exception 'Role cannot create shipments' using errcode='42501'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'At least one shipment item is required' using errcode='22023'; end if;
  select * into v_order from public.orders where id=p_order_id and owner_id=auth.uid() for update;
  if not found then raise exception 'Order not found or access denied' using errcode='P0002'; end if;
  if v_order.status in ('cancelled','closed','shipped') then raise exception 'This order cannot accept a new shipment' using errcode='22023'; end if;
  if p_shipping_mode not in ('fcl','lcl','bulk','air','express','rail') then raise exception 'Invalid shipping mode' using errcode='22023'; end if;
  select coalesce(max(batch_number),0)+1 into v_batch from public.shipments where order_id=p_order_id and owner_id=auth.uid();
  if p_batch_total is not null and (p_batch_total<1 or p_batch_total<v_batch) then raise exception 'Total shipment batches cannot be less than the current batch number' using errcode='22023'; end if;
  v_number := 'SHP-'||to_char(current_date,'YYYYMMDD')||'-'||lpad(nextval('public.shipment_number_seq')::text,6,'0');
  insert into public.shipments(owner_id,shipment_number,order_id,customer_id,batch_number,batch_total,status,shipping_mode,incoterm,origin_port,destination_port,latest_ship_date,etd,eta,responsible_name,consignee,notify_party,booking_number,bill_of_lading_number,vessel_voyage,container_numbers,seal_numbers,notes)
  values(auth.uid(),v_number,p_order_id,v_order.customer_id,v_batch,p_batch_total,'draft',p_shipping_mode,p_incoterm,p_origin_port,p_destination_port,p_latest_ship_date,p_etd,p_eta,p_responsible_name,p_consignee,p_notify_party,p_booking_number,p_bill_of_lading_number,p_vessel_voyage,p_container_numbers,p_seal_numbers,p_notes)
  returning * into v_shipment;
  for v_item in select value from jsonb_array_elements(p_items) loop
    if nullif(v_item->>'order_item_id','') is null then raise exception 'Order item is required' using errcode='22023'; end if;
    v_quantity := (v_item->>'quantity')::numeric;
    if v_quantity is null or v_quantity<=0 then raise exception 'Shipment quantity must be greater than zero' using errcode='22023'; end if;
    select * into v_order_item from public.order_items where id=(v_item->>'order_item_id')::uuid and order_id=p_order_id and owner_id=auth.uid() for update;
    if not found then raise exception 'Order item does not belong to this order' using errcode='42501'; end if;
    if v_order_item.shipped_quantity+v_quantity>v_order_item.quantity then
      raise exception 'Shipment quantity exceeds remaining quantity for product % (remaining %)',v_order_item.product_name,(v_order_item.quantity-v_order_item.shipped_quantity) using errcode='22023';
    end if;
    insert into public.shipment_items(owner_id,shipment_id,order_item_id,product_name,sku,specification,quantity,unit,gross_weight,net_weight,volume_cbm,package_count,packaging_method,marks,note)
    values(auth.uid(),v_shipment.id,v_order_item.id,v_order_item.product_name,v_order_item.sku,v_order_item.specification,v_quantity,v_order_item.unit,
      coalesce(nullif(v_item->>'gross_weight','')::numeric,0),coalesce(nullif(v_item->>'net_weight','')::numeric,0),coalesce(nullif(v_item->>'volume_cbm','')::numeric,0),
      coalesce(nullif(v_item->>'package_count','')::integer,0),nullif(v_item->>'packaging_method',''),nullif(v_item->>'marks',''),nullif(v_item->>'note',''));
    update public.order_items set shipped_quantity=shipped_quantity+v_quantity where id=v_order_item.id;
  end loop;
  update public.orders o set status=case
    when exists(select 1 from public.order_items oi where oi.order_id=o.id and oi.quantity>oi.shipped_quantity)
      and exists(select 1 from public.order_items oi where oi.order_id=o.id and oi.shipped_quantity>0) then 'partially_shipped'
    when exists(select 1 from public.order_items oi where oi.order_id=o.id and oi.quantity>oi.shipped_quantity) then o.status
    else 'shipped' end,
    updated_at=now()
  where o.id=v_order.id and o.owner_id=auth.uid();
  if p_latest_ship_date is not null then
    insert into public.shipment_notification_jobs(owner_id,shipment_id,event_key,recipient_type,template_key,locale,scheduled_at,timezone)
    values(auth.uid(),v_shipment.id,'latest_ship_date_warning','documentation','shipment_latest_ship_date_warning','zh-CN',greatest(now(),(p_latest_ship_date::timestamp at time zone 'UTC')-interval '7 days'),'UTC')
    on conflict(shipment_id,event_key,recipient_type,template_key) do nothing;
  end if;
  if p_eta is not null then
    insert into public.shipment_notification_jobs(owner_id,shipment_id,event_key,recipient_type,template_key,locale,scheduled_at,timezone)
    values(auth.uid(),v_shipment.id,'eta_prep_notice','customer','shipment_eta_prep_notice','zh-CN',greatest(now(),(p_eta::timestamp at time zone 'UTC')-interval '7 days'),'UTC')
    on conflict(shipment_id,event_key,recipient_type,template_key) do nothing;
    insert into public.shipment_notification_jobs(owner_id,shipment_id,event_key,recipient_type,template_key,locale,scheduled_at,timezone)
    values(auth.uid(),v_shipment.id,'eta_prep_notice','sales','shipment_eta_prep_notice','zh-CN',greatest(now(),(p_eta::timestamp at time zone 'UTC')-interval '7 days'),'UTC')
    on conflict(shipment_id,event_key,recipient_type,template_key) do nothing;
  end if;
  insert into public.shipment_events(owner_id,shipment_id,event_type,description)
  values(auth.uid(),v_shipment.id,'created','出运单已创建，等待确认备货及订舱。');
  return jsonb_build_object('shipment_id',v_shipment.id,'shipment_number',v_shipment.shipment_number,'batch_number',v_shipment.batch_number);
end;
$body$;
revoke all on function public.create_shipment_with_items(uuid,text,text,text,text,date,date,date,text,text,text,text,text,text,text,text,text,integer,jsonb) from public,anon;
grant execute on function public.create_shipment_with_items(uuid,text,text,text,text,date,date,date,text,text,text,text,text,text,text,text,text,integer,jsonb) to authenticated;

create or replace function public.update_shipment_logistics(
  p_shipment_id uuid,p_shipping_mode text,p_incoterm text,p_origin_port text,p_destination_port text,
  p_latest_ship_date date,p_etd date,p_eta date,p_responsible_name text,p_consignee text,p_notify_party text,
  p_booking_number text,p_bill_of_lading_number text,p_bill_of_lading_type text,p_vessel_voyage text,
  p_carrier_name text,p_shipping_line text,p_container_type text,p_container_count integer,p_transshipment_info text,
  p_container_numbers text,p_seal_numbers text,p_tracking_number text,p_tracking_url text,p_notes text
) returns jsonb
language plpgsql security definer set search_path = ''
as $body$
declare v_shipment public.shipments%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if coalesce(auth.jwt()->'app_metadata'->>'role','') not in ('followup','documentation','admin','executive','manager','operations','shipping') then raise exception 'Role cannot edit logistics information' using errcode='42501'; end if;
  select * into v_shipment from public.shipments where id=p_shipment_id and owner_id=auth.uid() for update;
  if not found then raise exception 'Shipment not found or access denied' using errcode='P0002'; end if;
  if v_shipment.status in ('closed','cancelled') then raise exception 'Closed or cancelled shipments cannot be edited' using errcode='22023'; end if;
  if p_shipping_mode not in ('fcl','lcl','bulk','air','express','rail') then raise exception 'Invalid shipping mode' using errcode='22023'; end if;
  if p_bill_of_lading_type is not null and p_bill_of_lading_type not in ('original','telex_release','sea_waybill') then raise exception 'Invalid bill of lading type' using errcode='22023'; end if;
  update public.shipments set shipping_mode=p_shipping_mode,incoterm=p_incoterm,origin_port=p_origin_port,destination_port=p_destination_port,
    latest_ship_date=p_latest_ship_date,etd=p_etd,eta=p_eta,responsible_name=p_responsible_name,consignee=p_consignee,notify_party=p_notify_party,
    booking_number=p_booking_number,bill_of_lading_number=p_bill_of_lading_number,bill_of_lading_type=p_bill_of_lading_type,
    vessel_voyage=p_vessel_voyage,carrier_name=p_carrier_name,shipping_line=p_shipping_line,container_type=p_container_type,
    container_count=greatest(0,coalesce(p_container_count,0)),transshipment_info=p_transshipment_info,container_numbers=p_container_numbers,
    seal_numbers=p_seal_numbers,tracking_number=p_tracking_number,tracking_url=p_tracking_url,notes=p_notes where id=p_shipment_id;
  if p_latest_ship_date is not null then
    insert into public.shipment_notification_jobs(owner_id,shipment_id,event_key,recipient_type,template_key,locale,scheduled_at,timezone)
    values(auth.uid(),p_shipment_id,'latest_ship_date_warning','documentation','shipment_latest_ship_date_warning','zh-CN',greatest(now(),(p_latest_ship_date::timestamp at time zone 'UTC')-interval '7 days'),'UTC')
    on conflict(shipment_id,event_key,recipient_type,template_key) do update set scheduled_at=excluded.scheduled_at,status='pending',last_error=null where public.shipment_notification_jobs.status<>'sent';
  end if;
  if p_eta is not null then
    insert into public.shipment_notification_jobs(owner_id,shipment_id,event_key,recipient_type,template_key,locale,scheduled_at,timezone)
    values(auth.uid(),p_shipment_id,'eta_prep_notice','customer','shipment_eta_prep_notice','zh-CN',greatest(now(),(p_eta::timestamp at time zone 'UTC')-interval '7 days'),'UTC')
    on conflict(shipment_id,event_key,recipient_type,template_key) do update set scheduled_at=excluded.scheduled_at,status='pending',last_error=null where public.shipment_notification_jobs.status<>'sent';
    insert into public.shipment_notification_jobs(owner_id,shipment_id,event_key,recipient_type,template_key,locale,scheduled_at,timezone)
    values(auth.uid(),p_shipment_id,'eta_prep_notice','sales','shipment_eta_prep_notice','zh-CN',greatest(now(),(p_eta::timestamp at time zone 'UTC')-interval '7 days'),'UTC')
    on conflict(shipment_id,event_key,recipient_type,template_key) do update set scheduled_at=excluded.scheduled_at,status='pending',last_error=null where public.shipment_notification_jobs.status<>'sent';
  end if;
  insert into public.shipment_events(owner_id,shipment_id,event_type,description) values(auth.uid(),p_shipment_id,'logistics_updated','物流与出运信息已更新。');
  return jsonb_build_object('shipment_id',p_shipment_id,'updated',true);
end;
$body$;
revoke all on function public.update_shipment_logistics(uuid,text,text,text,text,date,date,date,text,text,text,text,text,text,text,text,text,text,integer,text,text,text,text,text,text) from public,anon;
grant execute on function public.update_shipment_logistics(uuid,text,text,text,text,date,date,date,text,text,text,text,text,text,text,text,text,text,integer,text,text,text,text,text,text) to authenticated;

create or replace function public.confirm_shipment_release(p_shipment_id uuid,p_finance_override boolean default false,p_override_reason text default null)
returns jsonb language plpgsql security definer set search_path = ''
as $body$
declare
  v_shipment public.shipments%rowtype;
  v_order public.orders%rowtype;
  v_balance_due boolean := false;
  v_balance_pct numeric := 100;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if coalesce(auth.jwt()->'app_metadata'->>'role','') not in ('finance','admin','executive') then
    raise exception 'Finance confirmation is required to release shipping documents' using errcode='42501';
  end if;
  select * into v_shipment from public.shipments where id=p_shipment_id and owner_id=auth.uid() for update;
  if not found then raise exception 'Shipment not found or access denied' using errcode='P0002'; end if;
  if v_shipment.status in ('cancelled','closed') then raise exception 'Cancelled or closed shipments cannot be released' using errcode='22023'; end if;
  if not exists(select 1 from public.shipment_documents d where d.shipment_id=p_shipment_id and d.status='approved') then
    raise exception 'At least one shipment document must be approved before release' using errcode='22023';
  end if;
  if exists(select 1 from public.shipment_documents d where d.shipment_id=p_shipment_id and d.status<>'approved') then
    raise exception 'All shipment documents must be approved before release' using errcode='22023';
  end if;
  select * into v_order from public.orders where id=v_shipment.order_id and owner_id=auth.uid();
  if not found then raise exception 'Related order not found' using errcode='P0002'; end if;
  if not exists(select 1 from public.shipment_documents d where d.shipment_id=p_shipment_id and d.document_type='商业发票' and d.status='approved') then
    raise exception 'Approved commercial invoice is required before release' using errcode='22023';
  end if;
  if not exists(select 1 from public.shipment_documents d where d.shipment_id=p_shipment_id and d.document_type='装箱单' and d.status='approved') then
    raise exception 'Approved packing list is required before release' using errcode='22023';
  end if;
  if v_shipment.shipping_mode in ('fcl','lcl','bulk') and not exists(select 1 from public.shipment_documents d where d.shipment_id=p_shipment_id and d.document_type='提单 / 海运单' and d.status='approved') then
    raise exception 'Approved bill of lading or sea waybill is required before release' using errcode='22023';
  elsif v_shipment.shipping_mode='air' and not exists(select 1 from public.shipment_documents d where d.shipment_id=p_shipment_id and d.document_type='空运单' and d.status='approved') then
    raise exception 'Approved air waybill is required before release' using errcode='22023';
  elsif v_shipment.shipping_mode='express' and not exists(select 1 from public.shipment_documents d where d.shipment_id=p_shipment_id and d.document_type='快递运单' and d.status='approved') then
    raise exception 'Approved express waybill is required before release' using errcode='22023';
  elsif v_shipment.shipping_mode='rail' and not exists(select 1 from public.shipment_documents d where d.shipment_id=p_shipment_id and d.document_type='铁路运单' and d.status='approved') then
    raise exception 'Approved rail consignment note is required before release' using errcode='22023';
  end if;
  v_balance_pct := 100-greatest(0,least(100,coalesce((v_order.payment_terms->>'deposit_percent')::numeric,0)));
  if coalesce(v_order.payment_terms->>'balance_due_from','')='bill_of_lading' and v_balance_pct>0 then
    v_balance_due := not exists(select 1 from public.receivable_schedules s where s.order_id=v_order.id and s.owner_id=auth.uid() and s.payment_type='balance' and s.status in ('paid','closed','received','reconciled'));
  end if;
  if v_balance_due and (not p_finance_override or nullif(trim(p_override_reason),'') is null) then
    raise exception 'Balance payment is not confirmed. Finance override and a documented reason are required.' using errcode='22023';
  end if;
  update public.shipments set release_status='ready_to_send',release_confirmed_by=auth.uid(),release_confirmed_at=now(),
    release_override_reason=case when v_balance_due then trim(p_override_reason) else null end where id=p_shipment_id;
  insert into public.shipment_events(owner_id,shipment_id,event_type,description,metadata)
  values(auth.uid(),p_shipment_id,'release_confirmed',
    case when v_balance_due then '财务例外确认放单：尾款尚未确认到账。' else '财务确认单证齐套，出运单可寄单。' end,
    jsonb_build_object('balance_due_unconfirmed',v_balance_due,'override_reason',case when v_balance_due then trim(p_override_reason) else null end));
  return jsonb_build_object('shipment_id',p_shipment_id,'release_status','ready_to_send','balance_due_unconfirmed',v_balance_due);
end;
$body$;
revoke all on function public.confirm_shipment_release(uuid,boolean,text) from public,anon;
grant execute on function public.confirm_shipment_release(uuid,boolean,text) to authenticated;

create or replace function public.transition_shipment_status(p_shipment_id uuid,p_new_status text,p_reason text default null)
returns jsonb language plpgsql security definer set search_path = ''
as $body$
declare
  v_shipment public.shipments%rowtype;
  v_current_index integer;
  v_new_index integer;
  v_allowed text[] := array['draft','pending_booking','booked','containerized','customs_cleared','departed','in_transit','arrived','delivered','closed'];
  v_item record;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if coalesce(auth.jwt()->'app_metadata'->>'role','') not in ('followup','documentation','admin','executive','manager','operations','shipping') then raise exception 'Role cannot change shipment status' using errcode='42501'; end if;
  select * into v_shipment from public.shipments where id=p_shipment_id and owner_id=auth.uid() for update;
  if not found then raise exception 'Shipment not found or access denied' using errcode='P0002'; end if;
  if v_shipment.status in ('closed','cancelled') then raise exception 'Closed or cancelled shipments cannot change status' using errcode='22023'; end if;
  if p_new_status='cancelled' then
    if nullif(trim(p_reason),'') is null then raise exception 'Cancellation reason is required' using errcode='22023'; end if;
    if v_shipment.status in ('departed','in_transit','arrived','delivered') then raise exception 'A shipment already in transport cannot be cancelled' using errcode='22023'; end if;
    update public.shipments set status='cancelled',cancellation_reason=trim(p_reason) where id=p_shipment_id;
    for v_item in select order_item_id,quantity from public.shipment_items where shipment_id=p_shipment_id loop
      update public.order_items set shipped_quantity=greatest(0,shipped_quantity-v_item.quantity) where id=v_item.order_item_id;
    end loop;
  else
    if not p_new_status=any(v_allowed) then raise exception 'Invalid shipment status' using errcode='22023'; end if;
    v_current_index := array_position(v_allowed,v_shipment.status);
    v_new_index := array_position(v_allowed,p_new_status);
    if v_current_index is null or v_new_index is null or v_new_index<>v_current_index+1 then
      raise exception 'Shipment status must advance one step at a time' using errcode='22023';
    end if;
    if p_new_status='booked' and nullif(trim(v_shipment.booking_number),'') is null then raise exception 'Booking number is required before confirming booking' using errcode='22023'; end if;
    if p_new_status='departed' and nullif(trim(v_shipment.bill_of_lading_number),'') is null then raise exception 'Bill of lading number is required before departure' using errcode='22023'; end if;
    if p_new_status='closed' and v_shipment.release_status<>'sent' then raise exception 'All documents must be sent before closing the shipment' using errcode='22023'; end if;
    if p_new_status='closed' and (not exists(select 1 from public.shipment_documents where shipment_id=p_shipment_id) or exists(select 1 from public.shipment_documents where shipment_id=p_shipment_id and status<>'sent')) then
      raise exception 'All shipment documents must be present and sent before closing' using errcode='22023';
    end if;
    update public.shipments set status=p_new_status,
      actual_departure_date=case when p_new_status='departed' then current_date else actual_departure_date end,
      actual_arrival_date=case when p_new_status='arrived' then current_date else actual_arrival_date end,
      customer_pickup_date=case when p_new_status='delivered' then current_date else customer_pickup_date end
    where id=p_shipment_id;
  end if;
  if p_new_status='departed' then
    update public.receivable_schedules rs
    set due_date=current_date+greatest(0,coalesce(nullif(o.payment_terms->>'balance_due_days','')::integer,30)),updated_at=now()
    from public.orders o
    where rs.order_id=o.id and rs.owner_id=auth.uid() and rs.payment_type='balance'
      and o.id=v_shipment.order_id and o.payment_terms->>'balance_due_from'='bill_of_lading';
  elsif p_new_status='arrived' then
    update public.receivable_schedules rs
    set due_date=current_date+greatest(0,coalesce(nullif(o.payment_terms->>'balance_due_days','')::integer,30)),updated_at=now()
    from public.orders o
    where rs.order_id=o.id and rs.owner_id=auth.uid() and rs.payment_type='balance'
      and o.id=v_shipment.order_id and o.payment_terms->>'balance_due_from'='arrival';
  end if;
  insert into public.shipment_events(owner_id,shipment_id,event_type,description,metadata)
  values(auth.uid(),p_shipment_id,'status_changed','出运状态更新为：'||p_new_status,jsonb_build_object('from',v_shipment.status,'to',p_new_status,'reason',p_reason));
  if p_new_status in ('booked','containerized','departed','arrived','delivered') then
    insert into public.shipment_notification_jobs(owner_id,shipment_id,event_key,recipient_type,template_key,locale,scheduled_at)
    values(auth.uid(),p_shipment_id,p_new_status,'sales','shipment_'||p_new_status,'zh-CN',now())
    on conflict(shipment_id,event_key,recipient_type,template_key) do nothing;
  end if;
  update public.orders o set status=case
    when exists(select 1 from public.order_items oi where oi.order_id=o.id and oi.shipped_quantity>0)
      and exists(select 1 from public.order_items oi where oi.order_id=o.id and oi.quantity>oi.shipped_quantity) then 'partially_shipped'
    when exists(select 1 from public.order_items oi where oi.order_id=o.id)
      and not exists(select 1 from public.order_items oi where oi.order_id=o.id and oi.quantity>oi.shipped_quantity) then 'shipped'
    when not exists(select 1 from public.order_items oi where oi.order_id=o.id and oi.shipped_quantity>0) then 'confirmed'
    else o.status end,updated_at=now()
  where o.id=v_shipment.order_id and o.owner_id=auth.uid();
  return jsonb_build_object('shipment_id',p_shipment_id,'status',p_new_status);
end;
$body$;
revoke all on function public.transition_shipment_status(uuid,text,text) from public,anon;
grant execute on function public.transition_shipment_status(uuid,text,text) to authenticated;

create or replace function public.stamp_shipment_document_review()
returns trigger language plpgsql set search_path = ''
as $body$
declare v_role text := coalesce(auth.jwt()->'app_metadata'->>'role','');
begin
  if v_role not in ('documentation','admin','executive','manager','followup','operations','shipping') then
    raise exception 'Only documentation, follow-up, operations, shipping, or management roles may edit shipment documents' using errcode='42501';
  end if;
  if tg_op='INSERT' then
    if new.status not in ('pending','prepared') then
      raise exception 'New documents must start as pending or prepared' using errcode='22023';
    end if;
    return new;
  end if;
  if old.status is distinct from new.status and exists(select 1 from public.shipments s where s.id=new.shipment_id and s.release_status in ('ready_to_send','sent')) and new.status<>'sent' then
    raise exception 'Document status cannot be downgraded after finance release confirmation' using errcode='22023';
  end if;
  if new.status='approved' and old.status is distinct from 'approved' then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;
  if new.status='sent' and old.status is distinct from 'sent' then
    if not exists(select 1 from public.shipments s where s.id=new.shipment_id and s.owner_id=new.owner_id and s.release_status='ready_to_send') then
      raise exception 'Finance must confirm shipment release before documents can be marked sent' using errcode='22023';
    end if;
    new.sent_at := now();
  end if;
  return new;
end;
$body$;
drop trigger if exists shipment_documents_stamp_review on public.shipment_documents;
drop trigger if exists shipment_documents_stamp_review_insert on public.shipment_documents;
create trigger shipment_documents_stamp_review_insert before insert on public.shipment_documents for each row execute function public.stamp_shipment_document_review();
create trigger shipment_documents_stamp_review before update of status on public.shipment_documents for each row execute function public.stamp_shipment_document_review();

create or replace function public.audit_shipment_record_change()
returns trigger language plpgsql security definer set search_path = ''
as $body$
declare
  v_owner_id uuid;
  v_shipment_id uuid;
  v_record_id uuid;
  v_description text;
begin
  if tg_op='DELETE' then
    v_owner_id := old.owner_id;
    v_shipment_id := old.shipment_id;
    v_record_id := old.id;
  else
    v_owner_id := new.owner_id;
    v_shipment_id := new.shipment_id;
    v_record_id := new.id;
  end if;

  if tg_table_name='shipment_documents' then
    v_description := case when tg_op='INSERT' then '出运单已新增单证记录。' else '出运单单证状态或资料已更新。' end;
  elsif tg_table_name='shipment_costs' then
    v_description := case when tg_op='INSERT' then '出运物流费用已新增或登记。' else '出运物流费用记录已更新。' end;
  elsif tg_table_name='shipment_exceptions' then
    v_description := case when tg_op='INSERT' then '出运异常已登记。' else '出运异常处理记录已更新。' end;
  else
    v_description := '出运记录已更新。';
  end if;

  insert into public.shipment_events(owner_id,shipment_id,event_type,description,metadata,created_by)
  values(v_owner_id,v_shipment_id,'record_changed',v_description,
    jsonb_build_object('table',tg_table_name,'operation',tg_op,'record_id',v_record_id),auth.uid());

  if tg_op='DELETE' then return old; end if;
  return new;
end;
$body$;

drop trigger if exists shipment_documents_audit_change on public.shipment_documents;
create trigger shipment_documents_audit_change after insert or update on public.shipment_documents
for each row execute function public.audit_shipment_record_change();
drop trigger if exists shipment_costs_audit_change on public.shipment_costs;
create trigger shipment_costs_audit_change after insert or update on public.shipment_costs
for each row execute function public.audit_shipment_record_change();
drop trigger if exists shipment_exceptions_audit_change on public.shipment_exceptions;
create trigger shipment_exceptions_audit_change after insert or update on public.shipment_exceptions
for each row execute function public.audit_shipment_record_change();

create or replace function public.sync_shipment_release_sent()
returns trigger language plpgsql security definer set search_path = ''
as $body$
begin
  if new.status='sent' and not exists(select 1 from public.shipment_documents d where d.shipment_id=new.shipment_id and d.status<>'sent') then
    update public.shipments set release_status='sent' where id=new.shipment_id and owner_id=new.owner_id and release_status='ready_to_send';
  end if;
  return new;
end;
$body$;
drop trigger if exists shipment_documents_sync_release_sent on public.shipment_documents;
create trigger shipment_documents_sync_release_sent after update of status on public.shipment_documents for each row execute function public.sync_shipment_release_sent();

-- Client can read rows under RLS; inserts/updates that affect quantities/status go through guarded RPCs.
revoke insert,update,delete on public.shipments from authenticated;
grant select on public.shipments to authenticated;
revoke insert,update,delete on public.shipment_items from authenticated;
grant select on public.shipment_items to authenticated;
revoke insert,update,delete on public.order_items from authenticated;
grant select on public.order_items to authenticated;
