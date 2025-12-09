-- Security and connection setup for Smart Technologies e-commerce platform
-- This script configures secure access and connection settings

-- Grant additional permissions to main user for management
GRANT ALL PRIVILEGES ON DATABASE smart_ecommerce_dev TO smarttech_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO smarttech_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO smarttech_user;

-- Grant smart_dev user read access to main database for reference
GRANT CONNECT ON DATABASE smarttech_db TO smart_dev;
GRANT USAGE ON SCHEMA public TO smart_dev;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO smart_dev;

-- Create connection monitoring view
CREATE OR REPLACE VIEW public.connection_info AS
SELECT 
    'smart_ecommerce_dev' as database_name,
    'smart_dev' as development_user,
    'smarttech_user' as admin_user,
    current_database() as current_db,
    current_user() as current_user,
    now() as connection_time;

-- Set up row-level security for customer data (optional, can be enabled later)
-- ALTER TABLE users.customers ENABLE ROW LEVEL SECURITY;

-- Create audit log table for tracking changes
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(255) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_values JSONB,
    new_values JSONB
);

-- Grant permissions on audit log
GRANT ALL ON public.audit_log TO smart_dev;
GRANT ALL ON public.audit_log TO smarttech_user;

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_name ON public.audit_log(user_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON public.audit_log(timestamp);

-- Log successful security setup
DO $$
BEGIN
    RAISE NOTICE 'Security configuration completed';
    RAISE NOTICE 'smart_dev user created with appropriate permissions';
    RAISE NOTICE 'Audit logging enabled';
    RAISE NOTICE 'Connection monitoring view created';
    RAISE NOTICE 'Timestamp: %', now();
END $$;