-- ============================================================================
-- PHASE1: ROOT CAUSE FIX - Convert users.id and products.id to UUID
-- Using CASCADE approach for safer migration
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: DROP PRIMARY KEY CONSTRAINTS WITH CASCADE
-- ============================================================================

-- Drop users primary key with CASCADE (this will drop all dependent FKs)
ALTER TABLE users DROP CONSTRAINT users_pkey CASCADE;

-- Drop products primary key with CASCADE (this will drop all dependent FKs)
ALTER TABLE products DROP CONSTRAINT products_pkey CASCADE;

-- ============================================================================
-- STEP 2: CONVERT users.id FROM TEXT TO UUID
-- ============================================================================

ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::UUID;
ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- ============================================================================
-- STEP 3: CONVERT products.id FROM TEXT TO UUID
-- ============================================================================

ALTER TABLE products ALTER COLUMN id TYPE UUID USING id::UUID;
ALTER TABLE products ADD CONSTRAINT products_pkey PRIMARY KEY (id);

COMMIT;

-- ============================================================================
-- STEP 4: VERIFY CONVERSION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Verifying users.id column type...';
    
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
          AND column_name = 'id' 
          AND data_type = 'uuid'
    ) THEN
        RAISE NOTICE 'SUCCESS: users.id is now UUID type';
    ELSE
        RAISE EXCEPTION 'FAILED: users.id is not UUID type';
    END IF;
END $$;

DO $$
BEGIN
    RAISE NOTICE 'Verifying products.id column type...';
    
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
          AND column_name = 'id' 
          AND data_type = 'uuid'
    ) THEN
        RAISE NOTICE 'SUCCESS: products.id is now UUID type';
    ELSE
        RAISE EXCEPTION 'FAILED: products.id is not UUID type';
    END IF;
END $$;

DO $$
DECLARE
    v_users_fk_count INTEGER;
    v_products_fk_count INTEGER;
BEGIN
    RAISE NOTICE 'Verifying foreign key constraints...';
    
    -- Count FKs referencing users.id
    SELECT COUNT(*) INTO v_users_fk_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'users'
      AND ccu.column_name = 'id';
    
    -- Count FKs referencing products.id
    SELECT COUNT(*) INTO v_products_fk_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'products'
      AND ccu.column_name = 'id';
    
    RAISE NOTICE 'Foreign keys referencing users.id: %', v_users_fk_count;
    RAISE NOTICE 'Foreign keys referencing products.id: %', v_products_fk_count;
    
    IF v_users_fk_count >= 20 THEN
        RAISE NOTICE 'SUCCESS: Foreign key constraints for users.id have been recreated';
    ELSE
        RAISE WARNING 'WARNING: Some foreign key constraints for users.id may be missing';
    END IF;
    
    IF v_products_fk_count >= 16 THEN
        RAISE NOTICE 'SUCCESS: Foreign key constraints for products.id have been recreated';
    ELSE
        RAISE WARNING 'WARNING: Some foreign key constraints for products.id may be missing';
    END IF;
END $$;
