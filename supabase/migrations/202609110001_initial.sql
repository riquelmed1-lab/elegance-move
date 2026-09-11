-- Elegance Move - Supabase production schema
-- Safe to apply to a NEW Supabase project.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Profiles / authorization
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'seller' check (role in ('admin','manager','seller')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid() and active = true), 'none');
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select public.current_app_role() = 'admin'; $$;

create or replace function public.is_manager_or_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select public.current_app_role() in ('admin','manager'); $$;

create or replace function public.is_authenticated_app_user()
returns boolean language sql stable security definer set search_path = public
as $$ select public.current_app_role() in ('admin','manager','seller'); $$;

-- ------------------------------------------------------------
-- Master data
-- ------------------------------------------------------------
create table if not exists public.clients (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  phone text not null default '',
  city text not null default '',
  birthday date,
  source text not null default '',
  status text not null default 'Ativo',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key default gen_random_uuid()::text,
  code text unique,
  name text not null,
  category text not null default '',
  size text not null default '',
  color text not null default '',
  stock integer not null default 0 check (stock >= 0),
  price numeric(14,2) not null default 0 check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cost lives separately so sellers never need SELECT permission on cost.
create table if not exists public.product_costs (
  product_id text primary key references public.products(id) on delete cascade,
  average_cost numeric(14,2) not null default 0 check (average_cost >= 0),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Sales
-- ------------------------------------------------------------
create table if not exists public.sales (
  id text primary key default gen_random_uuid()::text,
  client_id text references public.clients(id) on delete set null,
  client_name text not null,
  sale_date date not null default current_date,
  subtotal numeric(14,2) not null default 0,
  discount_type text not null default 'none',
  discount_value numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  payment_label text not null default '',
  payment_terms text not null default '',
  payment_condition text not null default 'full',
  due_date date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sale_items (
  id text primary key default gen_random_uuid()::text,
  sale_id text not null references public.sales(id) on delete cascade,
  line_no integer not null,
  product_id text references public.products(id) on delete set null,
  product_name text not null,
  category text not null default '',
  size text not null default '',
  color text not null default '',
  qty integer not null default 1 check (qty > 0),
  unit_price numeric(14,2) not null default 0,
  unique (sale_id, line_no)
);

-- Historical cost snapshot is isolated from seller-readable sale_items.
create table if not exists public.sale_item_costs (
  sale_item_id text primary key references public.sale_items(id) on delete cascade,
  unit_cost numeric(14,2) not null default 0
);

create table if not exists public.payments (
  id text primary key default gen_random_uuid()::text,
  sale_id text not null references public.sales(id) on delete cascade,
  payment_date date not null default current_date,
  amount numeric(14,2) not null check (amount >= 0),
  method text not null default 'Pix',
  terms text not null default '',
  note text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Purchases / inventory
-- ------------------------------------------------------------
create table if not exists public.purchase_entries (
  id text primary key default gen_random_uuid()::text,
  entry_date date not null default current_date,
  product_id text references public.products(id) on delete set null,
  product_code text not null default '',
  product_name text not null,
  qty integer not null check (qty > 0),
  unit_cost numeric(14,2) not null check (unit_cost >= 0),
  total_cost numeric(14,2) not null default 0,
  previous_cost numeric(14,2) not null default 0,
  new_cost numeric(14,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id text primary key default gen_random_uuid()::text,
  product_id text not null references public.products(id) on delete restrict,
  movement_date timestamptz not null default now(),
  movement_type text not null check (movement_type in ('purchase','sale','sale_cancel','purchase_rollback','adjustment','return')),
  quantity integer not null check (quantity <> 0),
  reference_type text not null default '',
  reference_id text,
  note text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Expenses
-- ------------------------------------------------------------
create table if not exists public.expenses (
  id text primary key default gen_random_uuid()::text,
  expense_date date not null default current_date,
  description text not null,
  category text not null default 'Operacional',
  amount numeric(14,2) not null check (amount >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Quotes
-- ------------------------------------------------------------
create table if not exists public.quotes (
  id text primary key default gen_random_uuid()::text,
  client_id text references public.clients(id) on delete set null,
  client_name text not null,
  quote_date date not null default current_date,
  subtotal numeric(14,2) not null default 0,
  discount_type text not null default 'none',
  discount_value numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  payment_label text not null default '',
  payment_terms text not null default '',
  payment_condition text not null default 'full',
  due_date date,
  status text not null default 'Ativo',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_items (
  id text primary key default gen_random_uuid()::text,
  quote_id text not null references public.quotes(id) on delete cascade,
  line_no integer not null,
  product_id text references public.products(id) on delete set null,
  product_name text not null,
  category text not null default '',
  size text not null default '',
  color text not null default '',
  qty integer not null default 1 check (qty > 0),
  unit_price numeric(14,2) not null default 0,
  unique (quote_id, line_no)
);

-- ------------------------------------------------------------
-- Audit
-- ------------------------------------------------------------
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
create index if not exists idx_clients_name on public.clients(name);
create index if not exists idx_products_code on public.products(code);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_sales_date on public.sales(sale_date);
create index if not exists idx_sales_client on public.sales(client_id);
create index if not exists idx_payments_sale on public.payments(sale_id);
create index if not exists idx_expenses_date on public.expenses(expense_date);
create index if not exists idx_purchase_entries_date on public.purchase_entries(entry_date);
create index if not exists idx_inventory_movements_product_date on public.inventory_movements(product_id,movement_date desc);
create index if not exists idx_quotes_date on public.quotes(quote_date);

-- ------------------------------------------------------------
-- Reporting views
-- ------------------------------------------------------------
create or replace view public.v_monthly_profit
with (security_invoker = true)
as
select
  m.month,
  coalesce(s.revenue,0)::numeric(14,2) as revenue,
  coalesce(s.cogs,0)::numeric(14,2) as cogs,
  (coalesce(s.revenue,0)-coalesce(s.cogs,0))::numeric(14,2) as gross_profit,
  coalesce(e.expenses,0)::numeric(14,2) as expenses,
  (coalesce(s.revenue,0)-coalesce(s.cogs,0)-coalesce(e.expenses,0))::numeric(14,2) as net_profit
from (
  select date_trunc('month',sale_date)::date month from public.sales
  union
  select date_trunc('month',expense_date)::date month from public.expenses
) m
left join (
  select date_trunc('month',s.sale_date)::date month,
         sum(s.total) revenue,
         sum(sic.unit_cost * si.qty) cogs
  from public.sales s
  join public.sale_items si on si.sale_id=s.id
  join public.sale_item_costs sic on sic.sale_item_id=si.id
  group by 1
) s using(month)
left join (
  select date_trunc('month',expense_date)::date month, sum(amount) expenses
  from public.expenses
  group by 1
) e using(month)
order by m.month desc;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.product_costs enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.sale_item_costs enable row level security;
alter table public.payments enable row level security;
alter table public.purchase_entries enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.expenses enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: everyone sees self; admin sees/manages all.
create policy "profiles_read_self_or_admin" on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());
create policy "profiles_admin_manage" on public.profiles for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Operational tables readable by active app users.
create policy "clients_read" on public.clients for select to authenticated using (public.is_authenticated_app_user());
create policy "clients_write" on public.clients for all to authenticated using (public.is_authenticated_app_user()) with check (public.is_authenticated_app_user());
create policy "products_read" on public.products for select to authenticated using (public.is_authenticated_app_user());
create policy "sales_read" on public.sales for select to authenticated using (public.is_authenticated_app_user());
create policy "sales_write" on public.sales for all to authenticated using (public.is_authenticated_app_user()) with check (public.is_authenticated_app_user());
create policy "sale_items_read" on public.sale_items for select to authenticated using (public.is_authenticated_app_user());
create policy "sale_items_write" on public.sale_items for all to authenticated using (public.is_authenticated_app_user()) with check (public.is_authenticated_app_user());
create policy "payments_read" on public.payments for select to authenticated using (public.is_authenticated_app_user());
create policy "payments_write" on public.payments for all to authenticated using (public.is_authenticated_app_user()) with check (public.is_authenticated_app_user());
create policy "quotes_read" on public.quotes for select to authenticated using (public.is_authenticated_app_user());
create policy "quotes_write" on public.quotes for all to authenticated using (public.is_authenticated_app_user()) with check (public.is_authenticated_app_user());
create policy "quote_items_read" on public.quote_items for select to authenticated using (public.is_authenticated_app_user());
create policy "quote_items_write" on public.quote_items for all to authenticated using (public.is_authenticated_app_user()) with check (public.is_authenticated_app_user());

-- Sensitive/management tables: manager/admin only.
create policy "product_costs_manage" on public.product_costs for all to authenticated using (public.is_manager_or_admin()) with check (public.is_manager_or_admin());
create policy "sale_costs_read" on public.sale_item_costs for select to authenticated using (public.is_manager_or_admin());
create policy "sale_costs_write" on public.sale_item_costs for all to authenticated using (public.is_manager_or_admin()) with check (public.is_manager_or_admin());
create policy "products_manage" on public.products for insert to authenticated with check (public.is_manager_or_admin());
create policy "products_update" on public.products for update to authenticated using (public.is_manager_or_admin()) with check (public.is_manager_or_admin());
create policy "products_delete" on public.products for delete to authenticated using (public.is_manager_or_admin());
create policy "purchase_entries_manage" on public.purchase_entries for all to authenticated using (public.is_manager_or_admin()) with check (public.is_manager_or_admin());
create policy "inventory_read" on public.inventory_movements for select to authenticated using (public.is_manager_or_admin());
create policy "inventory_write" on public.inventory_movements for all to authenticated using (public.is_manager_or_admin()) with check (public.is_manager_or_admin());
create policy "expenses_manage" on public.expenses for all to authenticated using (public.is_manager_or_admin()) with check (public.is_manager_or_admin());
create policy "audit_admin_read" on public.audit_logs for select to authenticated using (public.is_admin());

-- Grants (RLS remains authoritative).
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.clients, public.products, public.sales, public.sale_items, public.payments, public.quotes, public.quote_items to authenticated;
grant select, insert, update, delete on public.product_costs, public.sale_item_costs, public.purchase_entries, public.inventory_movements, public.expenses to authenticated;
grant select on public.profiles, public.audit_logs, public.v_monthly_profit to authenticated;

-- Keep anonymous access closed.
revoke all on all tables in schema public from anon;
