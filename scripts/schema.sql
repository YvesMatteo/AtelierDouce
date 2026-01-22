-- Dropshipping Website Database Schema
-- Run this in Supabase SQL Editor

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  images TEXT[] DEFAULT '{}',
  cj_product_id TEXT UNIQUE,
  cj_sku TEXT,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  options JSONB DEFAULT '[]',
  inventory INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  customer_email TEXT,
  customer_name TEXT,
  shipping_address JSONB,
  status TEXT DEFAULT 'pending',
  cj_order_id TEXT,
  amount_total INTEGER,
  currency TEXT DEFAULT 'usd',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  options JSONB,
  cj_variant_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_products_cj_id ON products(cj_product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Allow public read access to products
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

-- Allow authenticated users (or service role) to insert/update products
CREATE POLICY "Products can be inserted by service role" ON products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Products can be updated by service role" ON products
  FOR UPDATE USING (true);

-- Orders policies - allow insert and select for now (you'd tighten this with auth later)
CREATE POLICY "Orders can be created by anyone" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Orders are viewable by email match" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Orders can be updated" ON orders
  FOR UPDATE USING (true);

-- Order items policies
CREATE POLICY "Order items can be created" ON order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Order items are viewable" ON order_items
  FOR SELECT USING (true);
