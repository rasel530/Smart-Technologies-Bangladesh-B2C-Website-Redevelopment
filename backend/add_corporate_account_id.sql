-- Add corporate_account_id column to orders table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'corporate_account_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN corporate_account_id UUID;
        ALTER TABLE orders ADD CONSTRAINT fk_orders_corporate_account 
            FOREIGN KEY (corporate_account_id) REFERENCES corporate_accounts(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
        RAISE NOTICE 'corporate_account_id column added to orders table';
    ELSE
        RAISE NOTICE 'corporate_account_id column already exists in orders table';
    END IF;
END $$;
