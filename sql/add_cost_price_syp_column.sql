-- Add cost_price_syp column to products table
ALTER TABLE products 
ADD COLUMN cost_price_syp NUMERIC(20, 2) DEFAULT 0;

-- Add comment to describe the column
COMMENT ON COLUMN products.cost_price_syp IS 'Cost price in Syrian Pounds (SYP)';

-- Notify PostgREST to refresh schema cache
NOTIFY pgrst;
