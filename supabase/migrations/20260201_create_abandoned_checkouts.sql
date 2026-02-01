-- SQL to create the abandoned_checkouts table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.abandoned_checkouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    cart_items JSONB NOT NULL,
    status TEXT DEFAULT 'abandoned' CHECK (status IN ('abandoned', 'recovered')),
    email_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster lookup by email and status
CREATE INDEX IF NOT EXISTS idx_abandoned_checkouts_email ON public.abandoned_checkouts(email);
CREATE INDEX IF NOT EXISTS idx_abandoned_checkouts_status ON public.abandoned_checkouts(status);

-- Enable RLS
ALTER TABLE public.abandoned_checkouts ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Allow all for service role" ON public.abandoned_checkouts
    FOR ALL USING (auth.role() = 'service_role');

-- Allow anon/public to insert (for the API route)
-- Note: In a real app, you'd want to restrict this or use a server-side route
CREATE POLICY "Allow public insert" ON public.abandoned_checkouts
    FOR INSERT WITH CHECK (true);

-- Allow public to update their own if we use a session id
-- For now, we'll keep it simple and handle updates via server-side API (service role)
