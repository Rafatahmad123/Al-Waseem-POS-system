-- Update existing products to populate selling_price_syp based on current exchange rate
-- Run this in Supabase SQL Editor to update all existing products

-- First, ensure selling_price_usd is calculated with 20% profit margin
UPDATE products
SET selling_price_usd = cost_price * 1.20
WHERE selling_price_usd IS NULL OR selling_price_usd = 0;

-- Then, update selling_price_syp using the exchange rate from settings
-- This query fetches the current exchange rate and applies it to all products
UPDATE products
SET selling_price_syp = selling_price_usd * (
  SELECT CAST(value AS DECIMAL(10, 2))
  FROM settings
  WHERE key = 'exchange_rate'
  LIMIT 1
)
WHERE selling_price_syp IS NULL OR selling_price_syp = 0;

-- If the settings table doesn't have an exchange rate, use a default of 12500
UPDATE products
SET selling_price_syp = selling_price_usd * 12500
WHERE selling_price_syp IS NULL OR selling_price_syp = 0;

-- Verify the updates
SELECT 
  id,
  name,
  barcode,
  cost_price,
  selling_price_usd,
  selling_price_syp,
  (selling_price_usd - cost_price) as profit_margin_usd,
  ((selling_price_usd - cost_price) / cost_price * 100) as profit_percentage
FROM products
ORDER BY name;
