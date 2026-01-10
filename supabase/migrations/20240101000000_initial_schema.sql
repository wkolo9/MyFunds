-- Create tables for the MyFunds application

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sectors Table
CREATE TABLE IF NOT EXISTS public.sectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Portfolio Assets Table
CREATE TABLE IF NOT EXISTS public.portfolio_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  ticker VARCHAR(20) NOT NULL,
  quantity DECIMAL(20, 10) NOT NULL,
  sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Watchlist Items Table
CREATE TABLE IF NOT EXISTS public.watchlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  ticker VARCHAR(20) NOT NULL,
  grid_position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;

-- Create Policies

-- Profiles: Users can view and edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sectors: Users can CRUD their own sectors
CREATE POLICY "Users can view own sectors" ON public.sectors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sectors" ON public.sectors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sectors" ON public.sectors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sectors" ON public.sectors
  FOR DELETE USING (auth.uid() = user_id);

-- Portfolio Assets: Users can CRUD their own assets
CREATE POLICY "Users can view own portfolio assets" ON public.portfolio_assets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio assets" ON public.portfolio_assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio assets" ON public.portfolio_assets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio assets" ON public.portfolio_assets
  FOR DELETE USING (auth.uid() = user_id);

-- Watchlist Items: Users can CRUD their own watchlist items
CREATE POLICY "Users can view own watchlist items" ON public.watchlist_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist items" ON public.watchlist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist items" ON public.watchlist_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist items" ON public.watchlist_items
  FOR DELETE USING (auth.uid() = user_id);

-- Function to handle new user signup (automatically create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on auth.users insert
-- Drop if exists to avoid errors on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();



