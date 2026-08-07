-- ============================================
-- Al-Kholoud Market & Coffee Roastery POS System Database Setup Script
-- ============================================
-- This script creates the necessary tables and functions
-- for the POS system from scratch
-- ============================================

-- Drop existing objects if they exist (to avoid duplicates)
DROP FUNCTION IF EXISTS public.update_stock_atomically CASCADE;
DROP TABLE IF EXISTS public.inventory_logs CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;

-- ============================================
-- Create 'products' table
-- ============================================
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    barcode TEXT UNIQUE NOT NULL,
    category_id UUID,
    current_stock INTEGER DEFAULT 0,
    cost_price NUMERIC(20, 2) DEFAULT 0,
    selling_price_dollar NUMERIC(20, 2) DEFAULT 0,
    selling_price_lira NUMERIC(20, 2) DEFAULT 0,
    description TEXT,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create index on barcode for faster lookups
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_is_active ON public.products(is_active);

-- ============================================
-- Create 'inventory_logs' table
-- ============================================
CREATE TABLE public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('initial', 'sale', 'restock', 'adjustment', 'return')),
    quantity INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_inventory_logs_product_id 
        FOREIGN KEY (product_id) 
        REFERENCES public.products(id) 
        ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_inventory_logs_product_id ON public.inventory_logs(product_id);
CREATE INDEX idx_inventory_logs_movement_type ON public.inventory_logs(movement_type);
CREATE INDEX idx_inventory_logs_created_at ON public.inventory_logs(created_at DESC);

-- ============================================
-- Create 'update_stock_atomically' function
-- ============================================
-- This function atomically updates the product stock and logs the movement
-- Parameters:
--   p_movement_type: Type of movement ('initial', 'sale', 'restock', 'adjustment', 'return')
--   p_new_stock: The new stock value to set
--   p_notes: Optional notes about the movement
--   p_product_id: The UUID of the product to update
CREATE OR REPLACE FUNCTION public.update_stock_atomically(
    p_movement_type TEXT,
    p_new_stock INTEGER,
    p_notes TEXT,
    p_product_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Validate inputs
    IF p_product_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Product ID is required');
    END IF;
    
    IF p_new_stock IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'New stock value is required');
    END IF;
    
    IF p_movement_type IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Movement type is required');
    END IF;
    
    -- Validate movement_type
    IF p_movement_type NOT IN ('initial', 'sale', 'restock', 'adjustment', 'return') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid movement type');
    END IF;
    
    -- Start transaction (implicit in function)
    -- Update the product stock
    UPDATE public.products
    SET current_stock = p_new_stock
    WHERE id = p_product_id;
    
    -- Check if product exists and was updated
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Product not found');
    END IF;
    
    -- Insert the inventory log
    INSERT INTO public.inventory_logs (
        product_id,
        movement_type,
        quantity,
        notes
    ) VALUES (
        p_product_id,
        p_movement_type,
        p_new_stock,
        p_notes
    );
    
    -- Return success
    v_result := json_build_object(
        'success', true,
        'data', json_build_object(
            'product_id', p_product_id,
            'new_stock', p_new_stock,
            'movement_type', p_movement_type
        )
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error details
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.update_stock_atomically TO anon;
GRANT EXECUTE ON FUNCTION public.update_stock_atomically TO authenticated;

-- ============================================
-- Grant permissions on tables
-- ============================================
-- Products table permissions
GRANT SELECT, INSERT, UPDATE ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE ON public.products TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.products_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.products_id_seq TO authenticated;

-- Inventory logs table permissions
GRANT SELECT, INSERT ON public.inventory_logs TO anon;
GRANT SELECT, INSERT ON public.inventory_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.inventory_logs_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.inventory_logs_id_seq TO authenticated;

-- ============================================
-- Notify API to reload schema
-- ============================================
-- This command notifies the Supabase API to reload the schema
-- so that the new tables and functions are immediately available
NOTIFY pgrst;

-- ============================================
-- Verification queries (optional)
-- ============================================
-- Uncomment to verify the setup
-- SELECT * FROM information_schema.tables WHERE table_name = 'products';
-- SELECT * FROM information_schema.tables WHERE table_name = 'inventory_logs';
-- SELECT * FROM information_schema.routines WHERE routine_name = 'update_stock_atomically';
