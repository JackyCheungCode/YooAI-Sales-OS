-- Shipment / fulfillment module. Additive migration; existing CRM/payment data is preserved.
create sequence if not exists public.shipment_number_seq;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  line_number integer not null default 1 check (line_number > 0),
  product_name text not null check (char_length(trim(product_name)) between 1 and 240),
  sku text,
  specification text,
  quantity numeric(14,3) not null check (quantity > 0),
  shipped_quantity numeric(14,3) not null default 0 check (shipped_quantity >= 0 and shipped_quantity <= quantity),
  unit text not null default '件',
  unit_price numeric(14,4) not null default 0 check (unit_price >= 0),
  currency_code char(3) not null default 'USD',
  delivery_date date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(order_id, line_number)
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

-- Updated-at triggers.
drop trigger if exists shipments_set_updated_at on public.shipments;
create trigger shipments_set_updated_at before update on public.shipments for each row execute function public.set_updated_at();
drop trigger if exists shipment_documents_set_updated_at on public.shipment_documents;
create trigger shipment_documents_set_updated_at before update on public.shipment_documents for each row execute function public.set_updated_at();
drop trigger if exists shipment_exceptions_set_updated_at on public.shipment_exceptions;
create trigger shipment_exceptions_set_updated_at before update on public.shipment_exceptions for each row execute function public.set_updated_at();
drop trigger if exists order_items_set_updated_at on public.order_items;
create trigger order_items_set_updated_at before update on public.order_items for each row execute function public.set_updated_at();

-- Enable tenant-scoped RLS. Costs are visible/writable only to finance/admin/executive app roles.
alter table public.order_items enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_items enable row level security;
alter table public.shipment_documents enable row level security;
alter table public.shipment_costs enable row level security;
alter table public.shipment_exceptions enable row level security;
alter table public.shipment_events enable row level security;
alter table public.shipment_notification_jobs enable row level security;

drop policy if exists "order items owner access" on public.order_items;
create policy "order items owner access" on public.order_items for all to authenticated
using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
drop policy if exists "shipments owner access" on public.shipments;
create policy "shipments owner access" on public.shipments for all to authenticated
using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
drop policy if exists "shipment items owner access" on public.shipment_items;
create policy "shipment items owner access" on public.shipment_items for all to authenticated
using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
drop policy if exists "shipment documents owner access" on public.shipment_documents;
create policy "shipment documents owner access" on public.shipment_documents for all to authenticated
using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
drop policy if exists "shipment costs finance access" on public.shipment_costs;
create policy "shipment costs finance access" on public.shipment_costs for all to authenticated
using(owner_id=(select auth.uid()) and coalesce(auth.jwt()->'app_metadata'->>'role','') in ('finance','admin','executive'))
with check(owner_id=(select auth.uid()) and coalesce(auth.jwt()->'app_metadata'->>'role','') in ('finance','admin','executive'));
drop policy if exists "shipment exceptions owner access" on public.shipment_exceptions;
create policy "shipment exceptions owner access" on public.shipment_exceptions for all to authenticated
using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
drop policy if exists "shipment events owner access" on public.shipment_events;
create policy "shipment events owner access" on public.shipment_events for all to authenticated
using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
drop policy if exists "shipment notification jobs owner access" on public.shipment_notification_jobs;
create policy "shipment notification jobs owner access" on public.shipment_notification_jobs for all to authenticated
using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));

-- Private document bucket. Object keys start with auth.uid(), matching the user's own shipment records.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('shipment-documents','shipment-documents',false,26214400,array['application/pdf','image/png','image/jpeg','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict(id) do nothing;
drop policy if exists "shipment documents object owner upload" on storage.objects;
create policy "shipment documents object owner upload" on storage.objects for insert to authenticated
with check(bucket_id='shipment-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "shipment documents object owner read" on storage.objects;
create policy "shipment documents object owner read" on storage.objects for select to authenticated
using(bucket_id='shipment-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "shipment documents object owner delete" on storage.objects;
create policy "shipment documents object owner delete" on storage.objects for delete to authenticated
using(bucket_id='shipment-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- Keep all quantity validation on the server and serialize shipments against the order row.
create or replace function public.create_shipment_with_items(
  p_order_id uuid,
  p_shipping_mode text,
  p_incoterm text,
  p_origin_port text,
  p_destination_port text,
  p_latest_ship_date date,
  p_etd date,
  p_eta date,
  p_responsible_name text,
  p_consignee text,
  p_notify_party text,
  p_booking_number text,
  p_bill_of_lading_number text,
  p_vessel_voyage text,
  p_container_numbers text,
  p_seal_numbers text,
  p_notes text,
  p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = ''
as $
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
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then
    raise exception 'At least one shipment item is required' using errcode='22023';
  end if;
  select * into v_order from public.orders where id=p_order_id and owner_id=auth.uid() for update;
  if not found then raise exception 'Order not found or access denied' using errcode='P0002'; end if;
  if v_order.status in ('cancelled','closed','shipped') then raise exception 'This order cannot accept a new shipment' using errcode='22023'; end if;
  if p_shipping_mode not in ('fcl','lcl','bulk','air','express','rail') then raise exception 'Invalid shipping mode' using errcode='22023'; end if;
  select coalesce(max(batch_number),0)+1 into v_batch from public.shipments where order_id=p_order_id and owner_id=auth.uid();
  v_number := 'SHP-'||to_char(current_date,'YYYYMMDD')||'-'||lpad(nextval('public.shipment_number_seq')::text,6,'0');
  insert into public.shipments(owner_id,shipment_number,order_id,customer_id,batch_number,status,shipping_mode,incoterm,origin_port,destination_port,latest_ship_date,etd,eta,responsible_name,consignee,notify_party,booking_number,bill_of_lading_number,vessel_voyage,container_numbers,seal_numbers,notes)
  values(auth.uid(),v_number,p_order_id,v_order.customer_id,v_batch,'draft',p_shipping_mode,p_incoterm,p_origin_port,p_destination_port,p_latest_ship_date,p_etd,p_eta,p_responsible_name,p_consignee,p_notify_party,p_booking_number,p_bill_of_lading_number,p_vessel_voyage,p_container_numbers,p_seal_numbers,p_notes)
  returning * into v_shipment;

  for v_item in select value from jsonb_array_elements(p_items) loop
    if nullif(v_item->>'order_item_id','') is null then raise exception 'Order item is required' using errcode='22023'; end if;
    v_quantity := (v_item->>'quantity')::numeric;
    if v_quantity is null or v_quantity <= 0 then raise exception 'Shipment quantity must be greater than zero' using errcode='22023'; end if;
    select * into v_order_item from public.order_items
      where id=(v_item->>'order_item_id')::uuid and order_id=p_order_id and owner_id=auth.uid() for update;
    if not found then raise exception 'Order item does not belong to this order' using errcode='42501'; end if;
    if v_order_item.shipped_quantity + v_quantity > v_order_item.quantity then
      raise exception 'Shipment quantity exceeds remaining quantity for product % (remaining %)',v_order_item.product_name,(v_order_item.quantity-v_order_item.shipped_quantity) using errcode='22023';
    end if;
    insert into public.shipment_items(owner_id,shipment_id,order_item_id,product_name,sku,specification,quantity,unit,gross_weight,net_weight,volume_cbm,package_count,packaging_method,marks,note)
    values(auth.uid(),v_shipment.id,v_order_item.id,v_order_item.product_name,v_order_item.sku,v_order_item.specification,v_quantity,v_order_item.unit,
      coalesce(nullif(v_item->>'gross_weight','')::numeric,0),coalesce(nullif(v_item->>'net_weight','')::numeric,0),
      coalesce(nullif(v_item->>'volume_cbm','')::numeric,0),coalesce(nullif(v_item->>'package_count','')::integer,0),
      nullif(v_item->>'packaging_method',''),nullif(v_item->>'marks',''),nullif(v_item->>'note',''));
    update public.order_items set shipped_quantity=shipped_quantity+v_quantity where id=v_order_item.id;
  end loop;

  insert into public.shipment_events(owner_id,shipment_id,event_type,description)
  values(auth.uid(),v_shipment.id,'created','出运单已创建，等待确认备货及订舱。');
  return jsonb_build_object('shipment_id',v_shipment.id,'shipment_number',v_shipment.shipment_number,'batch_number',v_shipment.batch_number);
end;
$$;
revoke all on function public.create_shipment_with_items(uuid,text,text,text,date,date,date,text,text,text,text,text,text,text,text,text,text,jsonb) from public,anon;
grant execute on function public.create_shipment_with_items(uuid,text,text,text,date,date,date,text,text,text,text,text,text,text,text,text,text,jsonb) to authenticated;

create or replace function public.transition_shipment_status(p_shipment_id uuid,p_new_status text,p_reason text default null)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_shipment public.shipments%rowtype;
  v_current_index integer;
  v_new_index integer;
  v_allowed text[] := array['draft','pending_booking','booked','containerized','customs_cleared','departed','in_transit','arrived','delivered','closed'];
  v_item record;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
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
    if p_new_status='booked' and nullif(trim(v_shipment.booking_number),'') is null then
      raise exception 'Booking number is required before confirming booking' using errcode='22023';
    end if;
    if p_new_status='departed' and nullif(trim(v_shipment.bill_of_lading_number),'') is null then
      raise exception 'Bill of lading number is required before departure' using errcode='22023';
    end if;
    if p_new_status='closed' and exists(select 1 from public.shipment_documents where shipment_id=p_shipment_id and status<>'approved') then
      raise exception 'All shipment documents must be approved before closing' using errcode='22023';
    end if;
    update public.shipments set status=p_new_status,
      actual_departure_date=case when p_new_status='departed' then current_date else actual_departure_date end,
      actual_arrival_date=case when p_new_status='arrived' then current_date else actual_arrival_date end,
      customer_pickup_date=case when p_new_status='delivered' then current_date else customer_pickup_date end
      where id=p_shipment_id;
  end if;
  insert into public.shipment_events(owner_id,shipment_id,event_type,description,metadata)
  values(auth.uid(),p_shipment_id,'status_changed','出运状态更新为：'||p_new_status,jsonb_build_object('from',v_shipment.status,'to',p_new_status,'reason',p_reason));
  if p_new_status in ('booked','containerized','departed','arrived','delivered') then
    insert into public.shipment_notification_jobs(owner_id,shipment_id,event_key,recipient_type,template_key,locale,scheduled_at)
    values(auth.uid(),p_shipment_id,p_new_status,'sales','shipment_'||p_new_status,'zh-CN',now())
    on conflict(shipment_id,event_key,recipient_type,template_key) do nothing;
  end if;
  update public.orders o set status=case
    when exists(select 1 from public.order_items oi where oi.order_id=o.id and oi.quantity>oi.shipped_quantity) then
      case when exists(select 1 from public.order_items oi where oi.order_id=o.id and oi.shipped_quantity>0) then 'partially_shipped' else o.status end
    when exists(select 1 from public.order_items oi where oi.order_id=o.id) then 'shipped'
    else o.status end,
    updated_at=now()
  where o.id=v_shipment.order_id and o.owner_id=auth.uid();
  return jsonb_build_object('shipment_id',p_shipment_id,'status',p_new_status);
end;
$$;
revoke all on function public.transition_shipment_status(uuid,text,text) from public,anon;
grant execute on function public.transition_shipment_status(uuid,text,text) to authenticated;

-- Do not allow direct inserts to bypass quantity checks; all shipment items are created by the atomic RPC.
revoke insert,update,delete on public.shipment_items from authenticated;
grant select on public.shipment_items to authenticated;
revoke insert,update,delete on public.shipments from authenticated;
grant select on public.shipments to authenticated;
revoke insert,update,delete on public.order_items from authenticated;
grant select on public.order_items to authenticated;
