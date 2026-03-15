-- Cost Analyst complete Supabase schema
-- Canonical schema file for this project.
-- Paste into Supabase SQL editor on a fresh project.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    type text not null default 'product' check (type in ('product', 'service')),
    unit text not null default 'pcs',
    expected_monthly_quantity integer check (expected_monthly_quantity is null or expected_monthly_quantity >= 0),
    description text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    constraint products_id_user_id_unique unique (id, user_id)
);

create table if not exists public.user_settings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references auth.users(id) on delete cascade,
    full_name text,
    business_name text,
    address text,
    currency text not null default 'INR' check (currency in ('INR', 'USD', 'EUR', 'GBP', 'AED', 'SAR')),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cost_sheets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    product_id uuid not null,
    sheet_number text not null,
    date date not null,
    quantity_produced integer not null default 1 check (quantity_produced > 0),
    cost_unit text not null default 'per_unit' check (cost_unit in ('per_unit', 'per_batch')),
    material_cost numeric(12, 2) not null default 0 check (material_cost >= 0),
    labor_cost numeric(12, 2) not null default 0 check (labor_cost >= 0),
    labor_hours numeric(10, 2) not null default 0 check (labor_hours >= 0),
    labor_rate numeric(12, 2) not null default 0 check (labor_rate >= 0),
    overhead_cost numeric(12, 2) not null default 0 check (overhead_cost >= 0),
    other_costs numeric(12, 2) not null default 0 check (other_costs >= 0),
    total_cost numeric(12, 2) not null default 0 check (total_cost >= 0),
    cost_per_unit numeric(12, 2) not null default 0 check (cost_per_unit >= 0),
    notes text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    constraint cost_sheets_id_user_id_unique unique (id, user_id),
    constraint cost_sheets_product_user_fkey
        foreign key (product_id, user_id)
        references public.products (id, user_id)
        on delete cascade
);

create table if not exists public.pricing_decisions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    cost_sheet_id uuid not null,
    pricing_method text not null check (pricing_method in ('cost_plus', 'desired_profit', 'market_basis')),
    cost_per_unit numeric(12, 2) not null default 0 check (cost_per_unit >= 0),
    selling_price numeric(12, 2) not null default 0 check (selling_price >= 0),
    markup_percentage numeric(8, 2),
    profit_margin numeric(8, 2),
    competitor_price numeric(12, 2),
    notes text,
    created_at timestamptz not null default timezone('utc', now()),
    constraint pricing_decisions_cost_sheet_user_fkey
        foreign key (cost_sheet_id, user_id)
        references public.cost_sheets (id, user_id)
        on delete cascade
);

create index if not exists products_user_id_created_at_idx
    on public.products (user_id, created_at desc);

create index if not exists products_user_id_type_idx
    on public.products (user_id, type);

create index if not exists cost_sheets_user_id_created_at_idx
    on public.cost_sheets (user_id, created_at desc);

create index if not exists cost_sheets_product_id_idx
    on public.cost_sheets (product_id);

create index if not exists pricing_decisions_user_id_created_at_idx
    on public.pricing_decisions (user_id, created_at desc);

create index if not exists pricing_decisions_cost_sheet_id_idx
    on public.pricing_decisions (cost_sheet_id);

alter table public.products enable row level security;
alter table public.user_settings enable row level security;
alter table public.cost_sheets enable row level security;
alter table public.pricing_decisions enable row level security;

drop policy if exists "Users can view own products" on public.products;
create policy "Users can view own products"
    on public.products
    for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own products" on public.products;
create policy "Users can insert own products"
    on public.products
    for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update own products" on public.products;
create policy "Users can update own products"
    on public.products
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Users can delete own products" on public.products;
create policy "Users can delete own products"
    on public.products
    for delete
    using (auth.uid() = user_id);

drop policy if exists "Users can view own settings" on public.user_settings;
create policy "Users can view own settings"
    on public.user_settings
    for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own settings" on public.user_settings;
create policy "Users can insert own settings"
    on public.user_settings
    for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update own settings" on public.user_settings;
create policy "Users can update own settings"
    on public.user_settings
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Users can delete own settings" on public.user_settings;
create policy "Users can delete own settings"
    on public.user_settings
    for delete
    using (auth.uid() = user_id);

drop policy if exists "Users can view own cost_sheets" on public.cost_sheets;
create policy "Users can view own cost_sheets"
    on public.cost_sheets
    for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own cost_sheets" on public.cost_sheets;
create policy "Users can insert own cost_sheets"
    on public.cost_sheets
    for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update own cost_sheets" on public.cost_sheets;
create policy "Users can update own cost_sheets"
    on public.cost_sheets
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Users can delete own cost_sheets" on public.cost_sheets;
create policy "Users can delete own cost_sheets"
    on public.cost_sheets
    for delete
    using (auth.uid() = user_id);

drop policy if exists "Users can view own pricing" on public.pricing_decisions;
create policy "Users can view own pricing"
    on public.pricing_decisions
    for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own pricing" on public.pricing_decisions;
create policy "Users can insert own pricing"
    on public.pricing_decisions
    for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update own pricing" on public.pricing_decisions;
create policy "Users can update own pricing"
    on public.pricing_decisions
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Users can delete own pricing" on public.pricing_decisions;
create policy "Users can delete own pricing"
    on public.pricing_decisions
    for delete
    using (auth.uid() = user_id);

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists set_user_settings_updated_at on public.user_settings;
create trigger set_user_settings_updated_at
before update on public.user_settings
for each row
execute function public.set_updated_at();

drop trigger if exists set_cost_sheets_updated_at on public.cost_sheets;
create trigger set_cost_sheets_updated_at
before update on public.cost_sheets
for each row
execute function public.set_updated_at();
