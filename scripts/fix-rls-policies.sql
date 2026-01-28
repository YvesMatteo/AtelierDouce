-- =====================================================
-- RLS SECURITY FIXES
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. FIX PRODUCTS TABLE POLICIES
-- Only service role should be able to insert/update products

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Products can be inserted by service role" ON public.products;
DROP POLICY IF EXISTS "Products can be updated by service role" ON public.products;

-- Create stricter policies that check for service role
-- Service role bypasses RLS by default, so these policies will only apply to anon/authenticated users
-- For anon users: deny insert/update
CREATE POLICY "Products insert - service role only" 
ON public.products 
FOR INSERT 
TO authenticated, anon
WITH CHECK (false);  -- Deny all inserts from non-service-role users

CREATE POLICY "Products update - service role only" 
ON public.products 
FOR UPDATE 
TO authenticated, anon
USING (false)  -- Deny all updates from non-service-role users
WITH CHECK (false);

-- 2. FIX ORDERS TABLE POLICIES
-- INSERT: Allow anyone to create orders (needed for checkout)
-- But add some basic validation

DROP POLICY IF EXISTS "Orders can be created by anyone" ON public.orders;
DROP POLICY IF EXISTS "Orders can be updated" ON public.orders;

-- Orders INSERT: Allow but only for new orders with valid required fields
CREATE POLICY "Orders can be created during checkout" 
ON public.orders 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
    -- Basic validation: status must be 'pending' on creation
    status = 'pending'
    AND amount_total > 0
    AND customer_email IS NOT NULL
);

-- Orders UPDATE: Only allow updates via service role (for webhook)
-- Deny direct updates from anon/authenticated users
CREATE POLICY "Orders update - service role only" 
ON public.orders 
FOR UPDATE 
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- 3. FIX ORDER_ITEMS TABLE POLICIES
DROP POLICY IF EXISTS "Order items can be created" ON public.order_items;

-- Order items INSERT: Only when associated with a valid order
CREATE POLICY "Order items can be created with valid order" 
ON public.order_items 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
    -- Must have a valid order_id, product_id, and quantity
    order_id IS NOT NULL
    AND product_id IS NOT NULL
    AND quantity > 0
);

-- =====================================================
-- VERIFY POLICIES
-- =====================================================
-- After running, check: SELECT * FROM pg_policies WHERE tablename IN ('products', 'orders', 'order_items');
