
-- Add supplier column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS supplier TEXT DEFAULT 'CJ';

-- Add supplier column to order_items table
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS supplier TEXT DEFAULT 'CJ';

-- Existing rows will automatically get 'CJ' due to the DEFAULT value if not already present
-- but for safety on existing rows if column existed but was null (unlikely here but good practice)
UPDATE products SET supplier = 'CJ' WHERE supplier IS NULL;
UPDATE order_items SET supplier = 'CJ' WHERE supplier IS NULL;
