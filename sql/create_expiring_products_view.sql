-- Create a view for products expiring within 30 days
-- Updated to use products table expiry_date instead of stock_batches
CREATE OR REPLACE VIEW expiring_products AS
SELECT 
  p.id,
  p.name,
  p.barcode,
  p.current_stock,
  p.min_stock_level,
  p.selling_price_usd,
  p.selling_price_syp,
  p.expiry_date,
  p.current_stock as batch_quantity,
  p.cost_price as cost_per_unit,
  COALESCE(DATEDIFF(p.expiry_date, CURRENT_DATE), 999) as days_until_expiry,
  CASE 
    WHEN p.expiry_date IS NULL THEN 'no_date'
    WHEN DATEDIFF(p.expiry_date, CURRENT_DATE) <= 0 THEN 'expired'
    WHEN DATEDIFF(p.expiry_date, CURRENT_DATE) <= 7 THEN 'critical'
    WHEN DATEDIFF(p.expiry_date, CURRENT_DATE) <= 30 THEN 'warning'
    ELSE 'ok'
  END as expiry_status
FROM products p
WHERE 
  p.is_active = true
  AND p.expiry_date IS NOT NULL
  AND DATEDIFF(p.expiry_date, CURRENT_DATE) <= 30
ORDER BY 
  DATEDIFF(p.expiry_date, CURRENT_DATE) ASC,
  p.name ASC;

-- Create index for better performance on products expiry_date
CREATE INDEX IF NOT EXISTS idx_products_expiry_date_view ON products(expiry_date) WHERE expiry_date IS NOT NULL;
