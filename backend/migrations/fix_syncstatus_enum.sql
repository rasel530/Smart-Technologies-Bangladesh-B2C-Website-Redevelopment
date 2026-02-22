-- Fix for PostgreSQL enum types missing in cart_wishlist_sync and cart_wishlist_move_history tables
-- This migration creates the required enum types and alters the table columns to use them

-- Create SyncStatus enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SyncStatus') THEN
        CREATE TYPE public."SyncStatus" AS ENUM ('pending', 'syncing', 'completed', 'failed');
        RAISE NOTICE 'Created SyncStatus enum type';
    ELSE
        RAISE NOTICE 'SyncStatus enum type already exists';
    END IF;
END
$$;

-- Create MoveType enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MoveType') THEN
        CREATE TYPE public."MoveType" AS ENUM ('cart_to_wishlist', 'wishlist_to_cart');
        RAISE NOTICE 'Created MoveType enum type';
    ELSE
        RAISE NOTICE 'MoveType enum type already exists';
    END IF;
END
$$;

-- Alter cart_wishlist_sync table's sync_status column to use SyncStatus enum
DO $$
BEGIN
    -- Check if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cart_wishlist_sync') THEN
        -- Check if the column exists and is not already using the enum type
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'cart_wishlist_sync' 
            AND column_name = 'sync_status'
            AND data_type != 'USER-DEFINED'
        ) THEN
            -- First, create a temporary column with the enum type
            ALTER TABLE public.cart_wishlist_sync ADD COLUMN IF NOT EXISTS sync_status_new public."SyncStatus";
            
            -- Copy data from old column to new column, handling any invalid values
            UPDATE public.cart_wishlist_sync 
            SET sync_status_new = CASE 
                WHEN sync_status = 'pending' THEN 'pending'::public."SyncStatus"
                WHEN sync_status = 'syncing' THEN 'syncing'::public."SyncStatus"
                WHEN sync_status = 'completed' THEN 'completed'::public."SyncStatus"
                WHEN sync_status = 'failed' THEN 'failed'::public."SyncStatus"
                ELSE 'pending'::public."SyncStatus" -- Default to pending for invalid values
            END;
            
            -- Drop the old column
            ALTER TABLE public.cart_wishlist_sync DROP COLUMN IF EXISTS sync_status;
            
            -- Rename the new column to the original name
            ALTER TABLE public.cart_wishlist_sync RENAME COLUMN sync_status_new TO sync_status;
            
            RAISE NOTICE 'Altered cart_wishlist_sync.sync_status to use SyncStatus enum';
        ELSE
            RAISE NOTICE 'cart_wishlist_sync.sync_status already using enum type or does not exist';
        END IF;
    ELSE
        RAISE NOTICE 'cart_wishlist_sync table does not exist';
    END IF;
END
$$;

-- Alter cart_wishlist_move_history table's move_type column to use MoveType enum
DO $$
BEGIN
    -- Check if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cart_wishlist_move_history') THEN
        -- Check if the column exists and is not already using the enum type
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'cart_wishlist_move_history' 
            AND column_name = 'move_type'
            AND data_type != 'USER-DEFINED'
        ) THEN
            -- First, create a temporary column with the enum type
            ALTER TABLE public.cart_wishlist_move_history ADD COLUMN IF NOT EXISTS move_type_new public."MoveType";
            
            -- Copy data from old column to new column, handling any invalid values
            UPDATE public.cart_wishlist_move_history 
            SET move_type_new = CASE 
                WHEN move_type = 'cart_to_wishlist' THEN 'cart_to_wishlist'::public."MoveType"
                WHEN move_type = 'wishlist_to_cart' THEN 'wishlist_to_cart'::public."MoveType"
                ELSE 'cart_to_wishlist'::public."MoveType" -- Default to cart_to_wishlist for invalid values
            END;
            
            -- Drop the old column
            ALTER TABLE public.cart_wishlist_move_history DROP COLUMN IF EXISTS move_type;
            
            -- Rename the new column to the original name
            ALTER TABLE public.cart_wishlist_move_history RENAME COLUMN move_type_new TO move_type;
            
            RAISE NOTICE 'Altered cart_wishlist_move_history.move_type to use MoveType enum';
        ELSE
            RAISE NOTICE 'cart_wishlist_move_history.move_type already using enum type or does not exist';
        END IF;
    ELSE
        RAISE NOTICE 'cart_wishlist_move_history table does not exist';
    END IF;
END
$$;

-- Verify the changes
SELECT 
    'Migration completed successfully' AS status,
    typname AS enum_type,
    enumlabel AS enum_value
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname IN ('SyncStatus', 'MoveType')
ORDER BY typname, enumsortorder;
