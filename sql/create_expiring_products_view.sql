-- Create a view for products expiring within 30 days
CREATE OR REPLACE VIEW expiring_products AS
SELECT 
  p.id,
  p.name,
  p.barcode,
  p.current_stock,
  p.min_stock_level,
  p.selling_price_usd,
  p.selling_price_syp,
  sb.expiry_date,
  sb.batch_number,
  sb.quantity as batch_quantity,
  sb.cost_per_unit,
  DATEDIFF(sb.expiry_date, CURRENT_DATE) as days_until_expiry,
  CASE 
    WHEN DATEDIFF(sb.expiry_date, CURRENT_DATE) <= 0 THEN 'expired'
    WHEN DATEDIFF(sb.expiry_date, CURRENT_DATE) <= 7 THEN 'critical'
    WHEN DATEDIFF(sb.expiry_date, CURRENT_DATE) <= 30 THEN 'warning'
    ELSE 'ok'
  END as expiry_status
FROM products p
INNER JOIN stock_batches sb ON p.id = sb.product_id
WHERE 
  p.is_active = true
  AND sb.expiry_date IS NOT NULL
  AND DATEDIFF(sb.expiry_date, CURRENT_DATE) <= 30
  AND sb.quantity > 0
ORDER BY 
  DATEDIFF(sb.expiry_date, CURRENT_DATE) ASC,
  p.name ASC;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_stock_batches_expiry_date ON stock_batches(expiry_date);
