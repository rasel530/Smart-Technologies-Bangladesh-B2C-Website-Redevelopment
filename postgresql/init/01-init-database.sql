-- PostgreSQL Initialization Script for Smart Technologies Bangladesh B2C Website
-- This script runs when the container first starts

-- Create additional databases if needed
-- CREATE DATABASE smarttech_test;

-- Create additional users with specific permissions
-- CREATE USER smarttech_app WITH PASSWORD 'app_password_2024';
-- GRANT CONNECT ON DATABASE smarttech_db TO smarttech_app;

-- Create extensions that might be needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set default privileges for the main user
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO smarttech_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO smarttech_user;

-- Create basic schema structure (can be expanded later)
-- CREATE SCHEMA IF NOT EXISTS ecommerce;
-- CREATE SCHEMA IF NOT EXISTS users;
-- CREATE SCHEMA IF NOT EXISTS products;

-- Log initialization completion
DO $$
BEGIN
    RAISE NOTICE 'Smart Technologies PostgreSQL database initialized successfully';
    RAISE NOTICE 'Database: %', current_database();
    RAISE NOTICE 'User: %', current_user;
    RAISE NOTICE 'Timestamp: %', now();
END $$;