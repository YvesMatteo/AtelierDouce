-- Add compare_at_price column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price decimal;
