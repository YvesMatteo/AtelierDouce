ALTER TABLE products ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Woman';
-- Update existing categories to be more specific based on our knowledge if needed, 
-- but for now we will rely on the re-run of the import script to fix data.
