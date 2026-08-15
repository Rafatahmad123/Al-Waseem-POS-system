-- Migration: Add bulk item support to products table
-- This script adds the is_bulk column and changes current_stock to NUMERIC for decimal weight support
-- Run this to enable bulk/weighted item selling functionality

-- Add the is_bulk column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'is_bulk'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN is_bulk BOOLEAN NOT NULL DEFAULT false;
        
        RAISE NOTICE 'is_bulk column added successfully';
    ELSE
        RAISE NOTICE 'is_bulk column already exists';
    END IF;
END $$;

-- Change current_stock from INTEGER to NUMERIC(20,3) to support decimal weights
DO $$
BEGIN
    -- Check if current_stock is still INTEGER
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'current_stock'
        AND data_type = 'integer'
    ) THEN
        -- First, create a temporary column to preserve data
        ALTER TABLE public.products 
        ADD COLUMN current_stock_new NUMERIC(20,3);
        
        -- Copy data from old column to new column
        UPDATE public.products 
        SET current_stock_new = current_stock::NUMERIC(20,3);
        
        -- Drop old column
        ALTER TABLE public.products 
        DROP COLUMN current_stock;
        
        -- Rename new column to original name
        ALTER TABLE public.products 
        RENAME COLUMN current_stock_new TO current_stock;
        
        -- Set default value
        ALTER TABLE public.products 
        ALTER COLUMN current_stock SET DEFAULT 0;
        
        -- Set NOT NULL constraint
        ALTER TABLE public.products 
        ALTER COLUMN current_stock SET NOT NULL;
        
        RAISE NOTICE 'current_stock changed from INTEGER to NUMERIC(20,3)';
    ELSE
        RAISE NOTICE 'current_stock is already NUMERIC or has been migrated';
    END IF;
END $$;

-- Also update sale_items.quantity to NUMERIC for proper weight tracking
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sale_items' 
        AND column_name = 'quantity'
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.sale_items 
        ALTER COLUMN quantity TYPE NUMERIC(20,3) USING quantity::NUMERIC(20,3);
        
        RAISE NOTICE 'sale_items.quantity changed from INTEGER to NUMERIC(20,3)';
    ELSE
        RAISE NOTICE 'sale_items.quantity is already NUMERIC or has been migrated';
    END IF;
END $$;

-- Also update stock_batches.quantity to NUMERIC for proper weight tracking
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'stock_batches' 
        AND column_name = 'quantity'
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.stock_batches 
        ALTER COLUMN quantity TYPE NUMERIC(20,3) USING quantity::NUMERIC(20,3);
        
        RAISE NOTICE 'stock_batches.quantity changed from INTEGER to NUMERIC(20,3)';
    ELSE
        RAISE NOTICE 'stock_batches.quantity is already NUMERIC or has been migrated';
    END IF;
END $$;

-- Also update purchase_items.quantity to NUMERIC for proper weight tracking
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'purchase_items' 
        AND column_name = 'quantity'
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.purchase_items 
        ALTER COLUMN quantity TYPE NUMERIC(20,3) USING quantity::NUMERIC(20,3);
        
        RAISE NOTICE 'purchase_items.quantity changed from INTEGER to NUMERIC(20,3)';
    ELSE
        RAISE NOTICE 'purchase_items.quantity is already NUMERIC or has been migrated';
    END IF;
END $$;

-- Grant permissions on the new column
GRANT SELECT, UPDATE ON public.products TO anon;
GRANT SELECT, UPDATE ON public.products TO authenticated;

-- Notify API to reload schema
NOTIFY pgrst;

-- Add comment to document the bulk functionality
COMMENT ON COLUMN public.products.is_bulk IS 'Indicates if the product is sold by weight (bulk items) vs by piece (regular items)';