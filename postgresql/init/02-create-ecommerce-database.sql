-- Create smart_ecommerce_dev database and smart_dev user for e-commerce development
-- This script creates the development database and sets up proper security

-- Check if database already exists before creating
DO $$
BEGIN
    -- Only create database if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'smart_ecommerce_dev') THEN
        CREATE DATABASE smart_ecommerce_dev;
        RAISE NOTICE 'Database smart_ecommerce_dev created successfully';
    ELSE
        RAISE NOTICE 'Database smart_ecommerce_dev already exists, skipping creation';
    END IF;
END $$;

-- Create the smart_dev user only if it doesn't exist
DO $$
BEGIN
    -- Only create user if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smart_dev') THEN
        CREATE USER smart_dev WITH PASSWORD 'smart_dev_password_2024';
        RAISE NOTICE 'User smart_dev created successfully';
    ELSE
        RAISE NOTICE 'User smart_dev already exists, skipping creation';
    END IF;
END $$;

-- Connect to the new database to set it up
\c smart_ecommerce_dev;

-- Create extensions for the e-commerce database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create basic schemas for e-commerce functionality
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS products;
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS payments;

-- Grant permissions to the smart_dev user
GRANT ALL PRIVILEGES ON DATABASE smart_ecommerce_dev TO smart_dev;
GRANT ALL ON SCHEMA users TO smart_dev;
GRANT ALL ON SCHEMA products TO smart_dev;
GRANT ALL ON SCHEMA orders TO smart_dev;
GRANT ALL ON SCHEMA inventory TO smart_dev;
GRANT ALL ON SCHEMA payments TO smart_dev;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA users GRANT ALL ON TABLES TO smart_dev;
ALTER DEFAULT PRIVILEGES IN SCHEMA products GRANT ALL ON TABLES TO smart_dev;
ALTER DEFAULT PRIVILEGES IN SCHEMA orders GRANT ALL ON TABLES TO smart_dev;
ALTER DEFAULT PRIVILEGES IN SCHEMA inventory GRANT ALL ON TABLES TO smart_dev;
ALTER DEFAULT PRIVILEGES IN SCHEMA payments GRANT ALL ON TABLES TO smart_dev;

-- Create basic tables for e-commerce structure
-- Users table
CREATE TABLE users.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users.customers(id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE orders.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders.orders(id),
    product_id UUID REFERENCES products.items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_customers_email ON users.customers(email);
CREATE INDEX idx_items_category ON products.items(category);
CREATE INDEX idx_orders_customer ON orders.orders(customer_id);
CREATE INDEX idx_orders_status ON orders.orders(status);
CREATE INDEX idx_order_items_order ON orders.order_items(order_id);
CREATE INDEX idx_order_items_product ON orders.order_items(product_id);

-- Insert sample data for testing
INSERT INTO users.customers (email, password_hash, first_name, last_name, phone) VALUES
('test@example.com', 'hashed_password', 'Test', 'User', '+8801234567890');

INSERT INTO products.items (name, description, price, stock_quantity, category) VALUES
('Sample Product', 'This is a sample product for testing', 99.99, 100, 'electronics');

-- Log successful database creation
DO $$
BEGIN
    RAISE NOTICE 'smart_ecommerce_dev database created successfully';
    RAISE NOTICE 'Database: %', current_database();
    RAISE NOTICE 'User: %', current_user;
    RAISE NOTICE 'Timestamp: %', now();
    RAISE NOTICE 'Tables created: customers, items, orders, order_items';
    RAISE NOTICE 'Sample data inserted for testing';
END $$;