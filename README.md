# Cost Accounting App

A Next.js cost accounting application with Supabase backend.

## Features

- 📊 **Dashboard** - Overview of key metrics
- 📦 **Products/Services** - Manage your products and services
- 📋 **Cost Sheet** - Create and manage cost sheets with PDF export
- 💰 **Pricing Decision** - Calculate selling prices using multiple methods
- 📈 **Break-Even Analysis** - Analyze break-even points at different profit margins
- 📑 **Reports** - View all cost data and summaries
- ⚙️ **Settings** - Configure company info and preferences

## Tech Stack

- **Framework**: Next.js 15
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Auth**: Supabase Auth

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-github-repo-url
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
5. Click "Deploy"

### 3. Supabase Configuration

In your Supabase project settings, add your Vercel deployment URL to:
- **Authentication > URL Configuration > Site URL**: `https://your-app.vercel.app`
- **Authentication > URL Configuration > Redirect URLs**: `https://your-app.vercel.app/**`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

## Database Setup

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'product',
    unit TEXT DEFAULT 'piece',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    company_name TEXT,
    company_address TEXT,
    currency TEXT DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cost sheets table
CREATE TABLE IF NOT EXISTS cost_sheets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    sheet_number TEXT NOT NULL,
    date DATE NOT NULL,
    quantity_produced INTEGER DEFAULT 1,
    cost_unit TEXT DEFAULT 'per_unit',
    material_cost DECIMAL(12,2) DEFAULT 0,
    labor_cost DECIMAL(12,2) DEFAULT 0,
    labor_hours DECIMAL(8,2) DEFAULT 0,
    labor_rate DECIMAL(10,2) DEFAULT 0,
    overhead_cost DECIMAL(12,2) DEFAULT 0,
    other_costs DECIMAL(12,2) DEFAULT 0,
    total_cost DECIMAL(12,2) DEFAULT 0,
    cost_per_unit DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing decisions table
CREATE TABLE IF NOT EXISTS pricing_decisions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cost_sheet_id UUID REFERENCES cost_sheets(id) ON DELETE CASCADE NOT NULL,
    pricing_method TEXT NOT NULL,
    cost_per_unit DECIMAL(12,2) NOT NULL,
    selling_price DECIMAL(12,2) NOT NULL,
    markup_percentage DECIMAL(8,2),
    profit_margin DECIMAL(8,2),
    competitor_price DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (run DROP IF EXISTS first)
CREATE POLICY "Users can view own products" ON products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cost_sheets" ON cost_sheets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cost_sheets" ON cost_sheets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cost_sheets" ON cost_sheets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cost_sheets" ON cost_sheets FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own pricing" ON pricing_decisions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pricing" ON pricing_decisions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own pricing" ON pricing_decisions FOR DELETE USING (auth.uid() = user_id);
```

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)
