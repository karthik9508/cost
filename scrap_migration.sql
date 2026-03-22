-- BOM Enhancement & Scrap Value Migration
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

-- 1. Add BOM fields to materials table
ALTER TABLE public.materials
    ADD COLUMN IF NOT EXISTS part_number text,
    ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'raw_material';

-- 2. Create scrap_items table
CREATE TABLE IF NOT EXISTS public.scrap_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cost_sheet_id uuid NOT NULL,
    description text NOT NULL,
    unit text NOT NULL DEFAULT 'kg',
    quantity numeric(12, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    rate numeric(12, 2) NOT NULL DEFAULT 0 CHECK (rate >= 0),
    amount numeric(12, 2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT scrap_items_cost_sheet_user_fkey
        FOREIGN KEY (cost_sheet_id, user_id)
        REFERENCES public.cost_sheets (id, user_id)
        ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS scrap_items_cost_sheet_id_idx
    ON public.scrap_items (cost_sheet_id);

CREATE INDEX IF NOT EXISTS scrap_items_user_id_idx
    ON public.scrap_items (user_id);

-- Enable RLS
ALTER TABLE public.scrap_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own scrap_items" ON public.scrap_items;
CREATE POLICY "Users can view own scrap_items"
    ON public.scrap_items
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own scrap_items" ON public.scrap_items;
CREATE POLICY "Users can insert own scrap_items"
    ON public.scrap_items
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own scrap_items" ON public.scrap_items;
CREATE POLICY "Users can update own scrap_items"
    ON public.scrap_items
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own scrap_items" ON public.scrap_items;
CREATE POLICY "Users can delete own scrap_items"
    ON public.scrap_items
    FOR DELETE
    USING (auth.uid() = user_id);
