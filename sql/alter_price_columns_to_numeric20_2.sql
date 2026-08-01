-- Migration script to alter all NUMERIC/DECIMAL columns to NUMERIC(20, 2)
-- This ensures the columns can handle very large currency values (like SYP with high exchange rates)
-- NUMERIC(20, 2) can store values up to 999,999,999,999,999,999.99

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table
ALTER TABLE products 
  ALTER COLUMN cost_price TYPE NUMERIC(20, 2),
  ALTER COLUMN selling_price_usd TYPE NUMERIC(20, 2),
  ALTER COLUMN selling_price_syp TYPE NUMERIC(20, 2);

-- Stock Batches table
ALTER TABLE stock_batches 
  ALTER COLUMN cost_per_unit TYPE NUMERIC(20, 2);

-- Purchases table
ALTER TABLE purchases 
  ALTER COLUMN total_amount TYPE NUMERIC(20, 2);

-- Purchase Items table
ALTER TABLE purchase_items 
  ALTER COLUMN cost_per_unit TYPE NUMERIC(20, 2),
  ALTER COLUMN total_cost TYPE NUMERIC(20, 2);

-- Sales table
ALTER TABLE sales 
  ALTER COLUMN total_amount TYPE NUMERIC(20, 2);

-- Sale Items table
ALTER TABLE sale_items 
  ALTER COLUMN selling_price_usd TYPE NUMERIC(20, 2),
  ALTER COLUMN selling_price_syp TYPE NUMERIC(20, 2),
  ALTER COLUMN total_price TYPE NUMERIC(20, 2);

-- Update the trigger function to use larger NUMERIC type for exchange_rate
CREATE OR REPLACE FUNCTION auto_calculate_selling_prices()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-calculate selling_price_usd with 20% profit margin
  NEW.selling_price_usd = NEW.cost_price * 1.20;
  
  -- Auto-calculate selling_price_syp using exchange rate from settings
  -- Default to 12500 if exchange rate not found
  DECLARE exchange_rate_value NUMERIC(20, 2);
  BEGIN
    SELECT CAST(value AS NUMERIC(20, 2)) INTO exchange_rate_value
    FROM settings
    WHERE key = 'exchange_rate'
    LIMIT 1;
    
    IF exchange_rate_value IS NULL OR exchange_rate_value = 0 THEN
      exchange_rate_value := 12500;
    END IF;
    
    NEW.selling_price_syp = NEW.selling_price_usd * exchange_rate_value;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to default exchange rate if query fails
    NEW.selling_price_syp = NEW.selling_price_usd * 12500;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the update_all_product_prices function to use larger NUMERIC type
CREATE OR REPLACE FUNCTION update_all_product_prices(new_rate NUMERIC)
RETURNS VOID AS $$
BEGIN
  -- Update selling_price_syp for all products using the new exchange rate
  UPDATE products
  SET selling_price_syp = selling_price_usd * new_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the changes
SELECT 
  table_name,
  column_name,
  data_type,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_name IN ('products', 'stock_batches', 'purchases', 'purchase_items', 'sales', 'sale_items')
  AND column_name IN ('cost_price', 'selling_price_usd', 'selling_price_syp', 'cost_per_unit', 'total_amount', 'total_cost', 'total_price')
ORDER BY table_name, column_name;
