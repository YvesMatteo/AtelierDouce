-- SQL to create the subscribers table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    verified BOOLEAN DEFAULT false,
    verification_token TEXT DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster lookup by email and token
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_token ON public.subscribers(verification_token);

-- Enable RLS
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Allow all for service role" ON public.subscribers
    FOR ALL USING (auth.role() = 'service_role');

-- Allow anon/public to insert (for the API route)
CREATE POLICY "Allow public insert" ON public.subscribers
    FOR INSERT WITH CHECK (true);