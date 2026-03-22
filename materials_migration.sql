-- Materials table: stores individual material line items per cost sheet
-- Run this in Supabase SQL Editor

-- 0. Add unique constraint on cost_sheets(id, user_id) for composite foreign keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'cost_sheets_id_user_id_unique'
    ) THEN
        ALTER TABLE public.cost_sheets
            ADD CONSTRAINT cost_sheets_id_user_id_unique UNIQUE (id, user_id);
    END IF;
END $$;

create table if not exists public.materials (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    cost_sheet_id uuid not null,
    name text not null,
    unit text not null default 'pcs',
    quantity numeric(12, 2) not null default 0 check (quantity >= 0),
    rate numeric(12, 2) not null default 0 check (rate >= 0),
    amount numeric(12, 2) not null default 0 check (amount >= 0),
    created_at timestamptz not null default timezone('utc', now()),
    constraint materials_cost_sheet_user_fkey
        foreign key (cost_sheet_id, user_id)
        references public.cost_sheets (id, user_id)
        on delete cascade
);

-- Indexes
create index if not exists materials_cost_sheet_id_idx
    on public.materials (cost_sheet_id);

create index if not exists materials_user_id_idx
    on public.materials (user_id);

-- Enable RLS
alter table public.materials enable row level security;

-- RLS Policies
drop policy if exists "Users can view own materials" on public.materials;
create policy "Users can view own materials"
    on public.materials
    for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own materials" on public.materials;
create policy "Users can insert own materials"
    on public.materials
    for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update own materials" on public.materials;
create policy "Users can update own materials"
    on public.materials
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Users can delete own materials" on public.materials;
create policy "Users can delete own materials"
    on public.materials
    for delete
    using (auth.uid() = user_id);
