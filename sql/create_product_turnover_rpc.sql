-- Create RPC function to calculate product turnover rate
CREATE OR REPLACE FUNCTION get_product_turnover(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR,
  barcode VARCHAR,
  current_stock INTEGER,
  avg_stock INTEGER,
  total_sold INTEGER,
  turnover_rate DECIMAL,
  movement_speed VARCHAR,
  category VARCHAR
) AS $$
DECLARE
  v_start_date DATE;
BEGIN
  v_start_date := CURRENT_DATE - (p_days || ' days')::INTERVAL;
  
  RETURN QUERY
  WITH product_sales AS (
    SELECT 
      si.product_id,
      SUM(si.quantity) as total_sold
    FROM sale_items si
    INNER JOIN sales s ON si.sale_id = s.id
    WHERE s.sale_date >= v_start_date
    GROUP BY si.product_id
  ),
  product_avg_stock AS (
    SELECT 
      p.id as product_id,
      p.current_stock,
      -- Calculate average stock as current stock (simplified for this implementation)
      -- In a more complex system, this would be the average over the period
      p.current_stock as avg_stock
    FROM products p
    WHERE p.is_active = true
  )
  SELECT 
    p.id as product_id,
    p.name as product_name,
    p.barcode,
    p.current_stock,
    COALESCE(ps.avg_stock, 0) as avg_stock,
    COALESCE(sales.total_sold, 0) as total_sold,
    CASE 
      WHEN COALESCE(ps.avg_stock, 0) = 0 THEN 0
      ELSE ROUND((COALESCE(sales.total_sold, 0)::DECIMAL / COALESCE(ps.avg_stock, 0)) * (365::DECIMAL / p_days), 2)
    END as turnover_rate,
    CASE 
      WHEN COALESCE(sales.total_sold, 0) = 0 THEN 'Slow'
      WHEN COALESCE(ps.avg_stock, 0) = 0 THEN 'Unknown'
      WHEN (COALESCE(sales.total_sold, 0)::DECIMAL / COALESCE(ps.avg_stock, 0)) * (365::DECIMAL / p_days) > 4 THEN 'Fast'
      WHEN (COALESCE(sales.total_sold, 0)::DECIMAL / COALESCE(ps.avg_stock, 0)) * (365::DECIMAL / p_days) > 2 THEN 'Normal'
      ELSE 'Slow'
    END as movement_speed,
    COALESCE(c.name, 'Uncategorized') as category
  FROM products p
  LEFT JOIN product_avg_stock ps ON p.id = ps.product_id
  LEFT JOIN product_sales sales ON p.id = sales.product_id
  LEFT JOIN categories c ON p.category_id = c.id
  WHERE p.is_active = true
  ORDER BY 
    CASE 
      WHEN COALESCE(sales.total_sold, 0) = 0 THEN 3
      WHEN (COALESCE(sales.total_sold, 0)::DECIMAL / COALESCE(ps.avg_stock, 0)) * (365::DECIMAL / p_days) > 4 THEN 1
      WHEN (COALESCE(sales.total_sold, 0)::DECIMAL / COALESCE(ps.avg_stock, 0)) * (365::DECIMAL / p_days) > 2 THEN 2
      ELSE 3
    END ASC,
    p.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_product_turnover TO authenticated;
