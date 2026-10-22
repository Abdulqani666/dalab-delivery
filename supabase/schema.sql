-- =====================================================================
-- Dalab Delivery - database setup for Supabase
-- Paste this whole file in Supabase > SQL Editor > New query > Run.
-- You can run it only once on a new project.
-- =====================================================================

-- ---------- PEOPLE ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  phone text not null default '',
  role text not null default 'customer' check (role in ('customer', 'rider', 'admin')),
  created_at timestamptz not null default now()
);

-- Every new account automatically gets a profile with role "customer".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers used by the security rules
create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select coalesce(public.my_role() in ('rider', 'admin'), false) $$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select coalesce(public.my_role() = 'admin', false) $$;

-- ---------- SHOPS AND PRODUCTS ----------
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Other',
  logo_url text,
  latitude double precision not null,
  longitude double precision not null,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  name text not null,
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  available boolean not null default true,
  created_at timestamptz not null default now()
);
create index products_shop_idx on public.products (shop_id);

-- ---------- ORDERS ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_id uuid not null references auth.users (id),
  customer_name text not null default '',
  customer_phone text not null default '',
  shop_id uuid references public.shops (id),
  shop_name text not null default '',
  shop_location jsonb,               -- {latitude, longitude}
  items jsonb not null,              -- [{id, name, price, qty}]
  subtotal numeric(10, 2) not null,
  delivery_fee numeric(10, 2) not null,
  total numeric(10, 2) not null,
  payment text not null default 'cash',
  dropoff jsonb not null,            -- {latitude, longitude}
  note text not null default '',
  status text not null default 'new'
    check (status in ('new', 'accepted', 'picked_up', 'delivered', 'cancelled')),
  rider_id uuid references auth.users (id),
  rider_name text,
  rider_phone text,
  rider_location jsonb               -- {latitude, longitude}
);
create index orders_customer_idx on public.orders (customer_id);
create index orders_status_idx on public.orders (status);

-- ---------- SECURITY (who can see and change what) ----------
alter table public.profiles enable row level security;
alter table public.shops    enable row level security;
alter table public.products enable row level security;
alter table public.orders   enable row level security;

-- Profiles: see your own; riders/admin see all. You can edit your own, but never your role.
create policy "profiles read" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_staff());
create policy "profiles update own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.my_role());

-- Shops and products: everybody signed in can read; only admin can change.
create policy "shops read" on public.shops
  for select to authenticated using (true);
create policy "shops admin write" on public.shops
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "products read" on public.products
  for select to authenticated using (true);
create policy "products admin write" on public.products
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Orders
create policy "orders read" on public.orders
  for select to authenticated
  using (customer_id = auth.uid() or public.is_staff());

create policy "orders create own" on public.orders
  for insert to authenticated
  with check (customer_id = auth.uid() and status = 'new' and rider_id is null);

-- A rider can change only the orders assigned to him/her. Admin can change all.
create policy "orders staff update" on public.orders
  for update to authenticated
  using (public.is_staff() and (rider_id = auth.uid() or public.is_admin()))
  with check (public.is_staff());

-- Rider takes a new order. Done in one safe step so two riders cannot take the same order.
create or replace function public.accept_order(p_order uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  p record;
begin
  if not public.is_staff() then
    raise exception 'not allowed';
  end if;
  select name, phone into p from public.profiles where id = auth.uid();
  update public.orders
     set status = 'accepted', rider_id = auth.uid(), rider_name = p.name, rider_phone = p.phone
   where id = p_order and status = 'new';
  return found;
end;
$$;

-- Customer cancels his/her own order, only before a rider accepts.
create or replace function public.cancel_order(p_order uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
     set status = 'cancelled'
   where id = p_order and customer_id = auth.uid() and status = 'new';
  return found;
end;
$$;

grant execute on function public.accept_order(uuid) to authenticated;
grant execute on function public.cancel_order(uuid) to authenticated;

-- ---------- LIVE UPDATES (order status and moto location) ----------
alter publication supabase_realtime add table public.orders;

-- =====================================================================
-- OPTIONAL: one sample shop to test with (remove the two "--" to use it)
-- =====================================================================
-- with s as (
--   insert into public.shops (name, category, latitude, longitude)
--   values ('Kanka Tea', 'Food', 8.4054, 48.4845) returning id
-- )
-- insert into public.products (shop_id, name, price)
-- select id, 'Shaah (tea)', 0.50 from s
-- union all select id, 'Sambuus', 1.00 from s;
