--
-- PostgreSQL database dump
--

\restrict Q5be8eouL1JminjUkyNqjejKwDJrTNEoejM0Y9GxZax0EhfKUfl2tVhK5ZRzaGz

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: AddressType; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."AddressType" AS ENUM (
    'shipping',
    'billing'
);


ALTER TYPE public."AddressType" OWNER TO smart_dev;

--
-- Name: AddressType_old; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."AddressType_old" AS ENUM (
    'shipping',
    'billing'
);


ALTER TYPE public."AddressType_old" OWNER TO smart_dev;

--
-- Name: BrandStatus; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."BrandStatus" AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE public."BrandStatus" OWNER TO smart_dev;

--
-- Name: CategoryStatus; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."CategoryStatus" AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE public."CategoryStatus" OWNER TO smart_dev;

--
-- Name: CouponType; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."CouponType" AS ENUM (
    'percentage',
    'fixed_amount'
);


ALTER TYPE public."CouponType" OWNER TO smart_dev;

--
-- Name: CouponType_old; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."CouponType_old" AS ENUM (
    'percentage',
    'fixed_amount'
);


ALTER TYPE public."CouponType_old" OWNER TO smart_dev;

--
-- Name: Division; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."Division" AS ENUM (
    'dhaka',
    'chittagong',
    'rajshahi',
    'sylhet',
    'khulna',
    'barishal',
    'rangpur',
    'mymensingh'
);


ALTER TYPE public."Division" OWNER TO smart_dev;

--
-- Name: Division_old; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."Division_old" AS ENUM (
    'dhaka',
    'chittagong',
    'rajshahi',
    'sylhet',
    'khulna',
    'barishal',
    'rangpur',
    'mymensingh'
);


ALTER TYPE public."Division_old" OWNER TO smart_dev;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
);


ALTER TYPE public."OrderStatus" OWNER TO smart_dev;

--
-- Name: OrderStatus_old; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."OrderStatus_old" AS ENUM (
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
);


ALTER TYPE public."OrderStatus_old" OWNER TO smart_dev;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'credit_card',
    'bank_transfer',
    'cash_on_delivery',
    'bkash',
    'nagad',
    'rocket'
);


ALTER TYPE public."PaymentMethod" OWNER TO smart_dev;

--
-- Name: PaymentMethod_old; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."PaymentMethod_old" AS ENUM (
    'credit_card',
    'bank_transfer',
    'cash_on_delivery',
    'bkash',
    'nagad',
    'rocket'
);


ALTER TYPE public."PaymentMethod_old" OWNER TO smart_dev;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled',
    'refunded'
);


ALTER TYPE public."PaymentStatus" OWNER TO smart_dev;

--
-- Name: PaymentStatus_old; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."PaymentStatus_old" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled',
    'refunded'
);


ALTER TYPE public."PaymentStatus_old" OWNER TO smart_dev;

--
-- Name: ProductStatus; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."ProductStatus" AS ENUM (
    'active',
    'inactive',
    'out_of_stock',
    'discontinued',
    'draft',
    'published',
    'archived'
);


ALTER TYPE public."ProductStatus" OWNER TO smart_dev;

--
-- Name: ProductStatus_old; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."ProductStatus_old" AS ENUM (
    'active',
    'inactive',
    'out_of_stock',
    'discontinued'
);


ALTER TYPE public."ProductStatus_old" OWNER TO smart_dev;

--
-- Name: ProductVisibility; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."ProductVisibility" AS ENUM (
    'public',
    'private',
    'restricted'
);


ALTER TYPE public."ProductVisibility" OWNER TO smart_dev;

--
-- Name: ProfileVisibility; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."ProfileVisibility" AS ENUM (
    'public',
    'private',
    'friends_only'
);


ALTER TYPE public."ProfileVisibility" OWNER TO smart_dev;

--
-- Name: ProfileVisibility_old; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."ProfileVisibility_old" AS ENUM (
    'public',
    'private',
    'friends_only'
);


ALTER TYPE public."ProfileVisibility_old" OWNER TO smart_dev;

--
-- Name: SocialProvider; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."SocialProvider" AS ENUM (
    'google',
    'facebook'
);


ALTER TYPE public."SocialProvider" OWNER TO smart_dev;

--
-- Name: SocialProvider_old; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."SocialProvider_old" AS ENUM (
    'google',
    'facebook'
);


ALTER TYPE public."SocialProvider_old" OWNER TO smart_dev;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."UserRole" AS ENUM (
    'admin',
    'manager',
    'customer',
    'corporate',
    'super_admin',
    'support'
);


ALTER TYPE public."UserRole" OWNER TO smart_dev;

--
-- Name: UserRole_old; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."UserRole_old" AS ENUM (
    'customer',
    'admin',
    'manager',
    'super_admin',
    'support',
    'corporate'
);


ALTER TYPE public."UserRole_old" OWNER TO smart_dev;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."UserStatus" AS ENUM (
    'active',
    'inactive',
    'suspended',
    'pending'
);


ALTER TYPE public."UserStatus" OWNER TO smart_dev;

--
-- Name: UserStatus_old; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."UserStatus_old" AS ENUM (
    'active',
    'inactive',
    'suspended',
    'pending'
);


ALTER TYPE public."UserStatus_old" OWNER TO smart_dev;

--
-- Name: get_user_permissions(text); Type: FUNCTION; Schema: public; Owner: smart_dev
--

CREATE FUNCTION public.get_user_permissions(p_user_id text) RETURNS TABLE(permission_id uuid, permission_name character varying, resource character varying, action character varying, description text, role_name character varying, hierarchy_level integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.resource,
    p.action,
    p.description,
    r.name,
    r.hierarchy_level
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id
    AND ur.is_active = TRUE
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ORDER BY r.hierarchy_level DESC, p.resource, p.action;
END;
$$;


ALTER FUNCTION public.get_user_permissions(p_user_id text) OWNER TO smart_dev;

--
-- Name: get_user_roles(text); Type: FUNCTION; Schema: public; Owner: smart_dev
--

CREATE FUNCTION public.get_user_roles(p_user_id text) RETURNS TABLE(role_id uuid, role_name character varying, hierarchy_level integer, assigned_at timestamp with time zone, expires_at timestamp with time zone, is_active boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.name,
    r.hierarchy_level,
    ur.assigned_at,
    ur.expires_at,
    ur.is_active
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id
  ORDER BY r.hierarchy_level DESC, ur.assigned_at DESC;
END;
$$;


ALTER FUNCTION public.get_user_roles(p_user_id text) OWNER TO smart_dev;

--
-- Name: sync_all_user_legacy_roles(); Type: FUNCTION; Schema: public; Owner: smart_dev
--

CREATE FUNCTION public.sync_all_user_legacy_roles() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_count INTEGER := 0;
  v_update_count INTEGER;
BEGIN
  -- Update all users with their highest RBAC role
  UPDATE users u
  SET role = (
    SELECT LOWER(r.name)::"UserRole"
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = u.id
      AND ur.is_active = TRUE
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ORDER BY r.hierarchy_level DESC
    LIMIT 1
  )
  WHERE EXISTS (
    SELECT 1 FROM user_roles ur2
    WHERE ur2.user_id = u.id
      AND ur2.is_active = TRUE
      AND (ur2.expires_at IS NULL OR ur2.expires_at > NOW())
  );

  GET DIAGNOSTICS v_update_count = ROW_COUNT;
  v_count := v_count + v_update_count;

  -- Set remaining users without active RBAC roles to 'customer'
  UPDATE users
  SET role = 'customer'::"UserRole"
  WHERE role IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = users.id
        AND ur.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    );

  GET DIAGNOSTICS v_update_count = ROW_COUNT;
  v_count := v_count + v_update_count;

  RETURN v_count;
END;
$$;


ALTER FUNCTION public.sync_all_user_legacy_roles() OWNER TO smart_dev;

--
-- Name: sync_user_legacy_role(); Type: FUNCTION; Schema: public; Owner: smart_dev
--

CREATE FUNCTION public.sync_user_legacy_role() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_highest_role_name VARCHAR(50);
  v_legacy_role VARCHAR(20);
BEGIN
  -- Get the highest hierarchy_level role for the affected user
  -- Only consider active roles that haven't expired
  SELECT r.name INTO v_highest_role_name
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND ur.is_active = TRUE
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ORDER BY r.hierarchy_level DESC
  LIMIT 1;

  -- Map RBAC role name to legacy UserRole enum
  IF v_highest_role_name IS NOT NULL THEN
    v_legacy_role := LOWER(v_highest_role_name);
  ELSE
    -- Default to customer if no active RBAC role exists
    v_legacy_role := 'customer';
  END IF;

  -- Update the users.role column
  UPDATE users
  SET role = v_legacy_role::"UserRole"
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.sync_user_legacy_role() OWNER TO smart_dev;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: smart_dev
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO smart_dev;

--
-- Name: user_has_minimum_role_level(text, integer); Type: FUNCTION; Schema: public; Owner: smart_dev
--

CREATE FUNCTION public.user_has_minimum_role_level(p_user_id text, p_min_level integer) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_has_level BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND ur.is_active = TRUE
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      AND r.hierarchy_level >= p_min_level
  ) INTO v_has_level;

  RETURN v_has_level;
END;
$$;


ALTER FUNCTION public.user_has_minimum_role_level(p_user_id text, p_min_level integer) OWNER TO smart_dev;

--
-- Name: user_has_permission(text, character varying); Type: FUNCTION; Schema: public; Owner: smart_dev
--

CREATE FUNCTION public.user_has_permission(p_user_id text, p_permission_name character varying) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_has_permission BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND ur.is_active = TRUE
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      AND p.name = p_permission_name
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$;


ALTER FUNCTION public.user_has_permission(p_user_id text, p_permission_name character varying) OWNER TO smart_dev;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO smart_dev;

--
-- Name: account_deletion_requests; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.account_deletion_requests (
    id text NOT NULL,
    "userId" text NOT NULL,
    "deletionToken" text NOT NULL,
    reason text,
    status text DEFAULT 'pending'::text NOT NULL,
    "requestedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "confirmedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.account_deletion_requests OWNER TO smart_dev;

--
-- Name: addresses; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.addresses (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."AddressType" DEFAULT 'shipping'::public."AddressType" NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text,
    address text NOT NULL,
    "addressLine2" text,
    city text NOT NULL,
    district text NOT NULL,
    division public."Division" NOT NULL,
    upazila text,
    "postalCode" text,
    "isDefault" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.addresses OWNER TO smart_dev;

--
-- Name: brands; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.brands (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    address text,
    "contactEmail" text,
    "contactPhone" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "featuredOrder" integer DEFAULT 0 NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "logoUrl" text,
    "metaDescription" text,
    "metaKeywords" text,
    "metaTitle" text,
    "nameBn" text,
    "nameEn" text,
    status public."BrandStatus" DEFAULT 'active'::public."BrandStatus" NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "websiteUrl" text
);


ALTER TABLE public.brands OWNER TO smart_dev;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.cart_items (
    id text NOT NULL,
    "cartId" text NOT NULL,
    "productId" text NOT NULL,
    "variantId" text,
    quantity integer NOT NULL,
    "unitPrice" numeric(12,2) NOT NULL,
    "totalPrice" numeric(12,2) NOT NULL,
    "addedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.cart_items OWNER TO smart_dev;

--
-- Name: carts; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.carts (
    id text NOT NULL,
    "userId" text,
    "sessionId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "expiresAt" timestamp(3) without time zone
);


ALTER TABLE public.carts OWNER TO smart_dev;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.categories (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "parentId" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "iconUrl" text,
    "imageUrl" text,
    "metaDescription" text,
    "metaKeywords" text,
    "metaTitle" text,
    "nameBn" text,
    "nameEn" text,
    status public."CategoryStatus" DEFAULT 'active'::public."CategoryStatus" NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO smart_dev;

--
-- Name: connection_info; Type: VIEW; Schema: public; Owner: smart_dev
--

CREATE VIEW public.connection_info AS
 SELECT 'smart_ecommerce_dev'::text AS database_name,
    'smart_dev'::text AS development_user,
    current_database() AS current_db,
    CURRENT_USER AS "current_user",
    now() AS connection_time;


ALTER TABLE public.connection_info OWNER TO smart_dev;

--
-- Name: corporate_accounts; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.corporate_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    company_name text NOT NULL,
    company_registration_number text NOT NULL,
    tin_number text,
    business_address text NOT NULL,
    business_division text NOT NULL,
    business_district text NOT NULL,
    business_upazila text,
    business_postal_code text,
    authorized_person_name text NOT NULL,
    authorized_person_email text NOT NULL,
    authorized_person_phone text NOT NULL,
    company_email text NOT NULL,
    credit_limit numeric(12,2),
    credit_used numeric(12,2) DEFAULT 0,
    account_status character varying(50) DEFAULT 'pending_verification'::character varying,
    verification_status character varying(50) DEFAULT 'pending'::character varying,
    account_manager_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    verified_at timestamp(3) without time zone,
    approved_by text,
    approved_at timestamp(3) without time zone
);


ALTER TABLE public.corporate_accounts OWNER TO smart_dev;

--
-- Name: corporate_approvals; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.corporate_approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    corporate_account_id uuid NOT NULL,
    request_type character varying(50) NOT NULL,
    requested_by text NOT NULL,
    requested_amount numeric(12,2),
    requested_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    approved_by text,
    approved_at timestamp(3) without time zone,
    status character varying(50) DEFAULT 'pending'::character varying,
    notes text
);


ALTER TABLE public.corporate_approvals OWNER TO smart_dev;

--
-- Name: corporate_documents; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.corporate_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    corporate_account_id uuid NOT NULL,
    document_type character varying(50) NOT NULL,
    document_name text NOT NULL,
    document_url text NOT NULL,
    uploaded_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    verified_at timestamp(3) without time zone,
    verified_by text,
    status character varying(50) DEFAULT 'pending'::character varying
);


ALTER TABLE public.corporate_documents OWNER TO smart_dev;

--
-- Name: corporate_pricing; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.corporate_pricing (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    corporate_account_id uuid NOT NULL,
    product_id text NOT NULL,
    discount_percent numeric(5,2) DEFAULT 0,
    special_price numeric(12,2),
    valid_from timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    valid_to timestamp(3) without time zone
);


ALTER TABLE public.corporate_pricing OWNER TO smart_dev;

--
-- Name: corporate_users; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.corporate_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    corporate_account_id uuid NOT NULL,
    user_id text NOT NULL,
    role character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    assigned_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp(3) without time zone
);


ALTER TABLE public.corporate_users OWNER TO smart_dev;

--
-- Name: coupons; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.coupons (
    id text NOT NULL,
    code text NOT NULL,
    type public."CouponType" NOT NULL,
    value numeric(12,2) NOT NULL,
    "minAmount" numeric(12,2) NOT NULL,
    "maxDiscount" numeric(5,2) NOT NULL,
    "usageLimit" integer NOT NULL,
    "usedCount" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.coupons OWNER TO smart_dev;

--
-- Name: cross_sell_products; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.cross_sell_products (
    id text NOT NULL,
    "productId" text NOT NULL,
    "relatedProductId" text NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.cross_sell_products OWNER TO smart_dev;

--
-- Name: email_verification_tokens; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.email_verification_tokens (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.email_verification_tokens OWNER TO smart_dev;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    "variantId" text,
    quantity integer NOT NULL,
    "unitPrice" numeric(12,2) NOT NULL,
    "totalPrice" numeric(12,2) NOT NULL
);


ALTER TABLE public.order_items OWNER TO smart_dev;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.orders (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    "userId" text NOT NULL,
    "addressId" text NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    tax numeric(12,2) DEFAULT 0 NOT NULL,
    "shippingCost" numeric(12,2) DEFAULT 0 NOT NULL,
    discount numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) NOT NULL,
    "paymentMethod" public."PaymentMethod" NOT NULL,
    "paymentStatus" public."PaymentStatus" DEFAULT 'pending'::public."PaymentStatus" NOT NULL,
    "paidAt" timestamp(3) without time zone,
    status public."OrderStatus" DEFAULT 'pending'::public."OrderStatus" NOT NULL,
    notes text,
    "internalNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "confirmedAt" timestamp(3) without time zone,
    "shippedAt" timestamp(3) without time zone,
    "deliveredAt" timestamp(3) without time zone,
    corporate_account_id uuid
);


ALTER TABLE public.orders OWNER TO smart_dev;

--
-- Name: password_history; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.password_history (
    id text NOT NULL,
    "userId" text NOT NULL,
    "passwordHash" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.password_history OWNER TO smart_dev;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    resource character varying(50) NOT NULL,
    action character varying(50) NOT NULL,
    description text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.permissions OWNER TO smart_dev;

--
-- Name: phone_otps; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.phone_otps (
    id text NOT NULL,
    "userId" text,
    phone text NOT NULL,
    otp text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "verifiedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.phone_otps OWNER TO smart_dev;

--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.product_categories (
    id text NOT NULL,
    "productId" text NOT NULL,
    "categoryId" text NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.product_categories OWNER TO smart_dev;

--
-- Name: product_images; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.product_images (
    id text NOT NULL,
    product_id text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    original_url text DEFAULT ''::text NOT NULL,
    optimized_url text,
    thumbnail_url text,
    alt_text_bn character varying(250),
    alt_text_en character varying(250),
    is_primary boolean DEFAULT false NOT NULL,
    file_size_bytes integer,
    mime_type character varying(50),
    width integer,
    height integer,
    processing_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.product_images OWNER TO smart_dev;

--
-- Name: product_specifications; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.product_specifications (
    id text NOT NULL,
    "productId" text NOT NULL,
    name text NOT NULL,
    value text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.product_specifications OWNER TO smart_dev;

--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.product_variants (
    id text NOT NULL,
    "productId" text NOT NULL,
    name text NOT NULL,
    sku text NOT NULL,
    price numeric(12,2) NOT NULL,
    "comparePrice" numeric(12,2),
    stock integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.product_variants OWNER TO smart_dev;

--
-- Name: products; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.products (
    id text NOT NULL,
    sku text NOT NULL,
    name text NOT NULL,
    "nameEn" text NOT NULL,
    "nameBn" text,
    slug text NOT NULL,
    "shortDescription" text,
    description text,
    "brandId" text NOT NULL,
    "regularPrice" numeric(12,2) NOT NULL,
    "salePrice" numeric(12,2),
    "costPrice" numeric(12,2) NOT NULL,
    "taxRate" numeric(5,2) DEFAULT 0 NOT NULL,
    "stockQuantity" integer DEFAULT 0 NOT NULL,
    "lowStockThreshold" integer DEFAULT 10 NOT NULL,
    status public."ProductStatus" DEFAULT 'active'::public."ProductStatus" NOT NULL,
    "metaTitle" text,
    "metaDescription" text,
    "metaKeywords" text,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "isNewArrival" boolean DEFAULT false NOT NULL,
    "isBestSeller" boolean DEFAULT false NOT NULL,
    "warrantyPeriod" integer,
    "warrantyType" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    visibility public."ProductVisibility" DEFAULT 'public'::public."ProductVisibility" NOT NULL
);


ALTER TABLE public.products OWNER TO smart_dev;

--
-- Name: related_products; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.related_products (
    id text NOT NULL,
    "productId" text NOT NULL,
    "relatedProductId" text NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.related_products OWNER TO smart_dev;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.reviews (
    id text NOT NULL,
    "productId" text NOT NULL,
    "userId" text NOT NULL,
    rating integer NOT NULL,
    title text NOT NULL,
    comment text,
    "isVerified" boolean DEFAULT false NOT NULL,
    "isApproved" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.reviews OWNER TO smart_dev;

--
-- Name: role_escalation_requests; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.role_escalation_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    current_role_id uuid,
    requested_role_id uuid NOT NULL,
    requested_by text,
    status character varying(20) DEFAULT 'pending'::character varying,
    reason text,
    reviewed_by text,
    reviewed_at timestamp(6) with time zone,
    review_notes text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.role_escalation_requests OWNER TO smart_dev;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    granted_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    granted_by text
);


ALTER TABLE public.role_permissions OWNER TO smart_dev;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    hierarchy_level integer DEFAULT 0,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roles OWNER TO smart_dev;

--
-- Name: search_logs; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.search_logs (
    id text NOT NULL,
    query text NOT NULL,
    "userId" text,
    "resultsCount" integer DEFAULT 0 NOT NULL,
    "executionTime" double precision DEFAULT 0 NOT NULL,
    filters jsonb DEFAULT '{}'::jsonb NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.search_logs OWNER TO smart_dev;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.transactions (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "paymentMethod" public."PaymentMethod" NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency text DEFAULT 'BDT'::text NOT NULL,
    status public."PaymentStatus" DEFAULT 'pending'::public."PaymentStatus" NOT NULL,
    "transactionId" text,
    "gatewayResponse" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.transactions OWNER TO smart_dev;

--
-- Name: up_sell_products; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.up_sell_products (
    id text NOT NULL,
    "productId" text NOT NULL,
    "relatedProductId" text NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.up_sell_products OWNER TO smart_dev;

--
-- Name: user_communication_preferences; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.user_communication_preferences (
    id text NOT NULL,
    "userId" text NOT NULL,
    "preferredLanguage" text DEFAULT 'en'::text NOT NULL,
    "preferredTimezone" text DEFAULT 'UTC'::text NOT NULL,
    "preferredContactMethod" text DEFAULT 'email'::text NOT NULL,
    "marketingConsent" boolean DEFAULT false NOT NULL,
    "dataSharingConsent" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_communication_preferences OWNER TO smart_dev;

--
-- Name: user_data_exports; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.user_data_exports (
    id text NOT NULL,
    "userId" text NOT NULL,
    "exportToken" text NOT NULL,
    "dataTypes" jsonb NOT NULL,
    format text NOT NULL,
    "fileUrl" text,
    status text DEFAULT 'processing'::text NOT NULL,
    "requestedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "readyAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_data_exports OWNER TO smart_dev;

--
-- Name: user_notification_preferences; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.user_notification_preferences (
    id text NOT NULL,
    "userId" text NOT NULL,
    "emailNotifications" boolean DEFAULT true NOT NULL,
    "smsNotifications" boolean DEFAULT false NOT NULL,
    "whatsappNotifications" boolean DEFAULT false NOT NULL,
    "marketingCommunications" boolean DEFAULT false NOT NULL,
    "newsletterSubscription" boolean DEFAULT false NOT NULL,
    "notificationFrequency" text DEFAULT 'immediate'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_notification_preferences OWNER TO smart_dev;

--
-- Name: user_privacy_settings; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.user_privacy_settings (
    id text NOT NULL,
    "userId" text NOT NULL,
    "profileVisibility" public."ProfileVisibility" DEFAULT 'private'::public."ProfileVisibility" NOT NULL,
    "showEmail" boolean DEFAULT false NOT NULL,
    "showPhone" boolean DEFAULT false NOT NULL,
    "showAddress" boolean DEFAULT false NOT NULL,
    "allowSearchByEmail" boolean DEFAULT false NOT NULL,
    "allowSearchByPhone" boolean DEFAULT false NOT NULL,
    "twoFactorEnabled" boolean DEFAULT false NOT NULL,
    "twoFactorSecret" text,
    "twoFactorMethod" text,
    "dataSharingEnabled" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_privacy_settings OWNER TO smart_dev;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    role_id uuid NOT NULL,
    assigned_by text,
    assigned_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp(6) with time zone,
    is_active boolean DEFAULT true
);


ALTER TABLE public.user_roles OWNER TO smart_dev;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.user_sessions (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_sessions OWNER TO smart_dev;

--
-- Name: user_social_accounts; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.user_social_accounts (
    id text NOT NULL,
    "userId" text NOT NULL,
    provider public."SocialProvider" NOT NULL,
    "providerId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_social_accounts OWNER TO smart_dev;

--
-- Name: users; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    phone text,
    "phoneVerified" timestamp(3) without time zone,
    password text,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    "dateOfBirth" timestamp(3) without time zone,
    gender text,
    role public."UserRole" DEFAULT 'customer'::public."UserRole" NOT NULL,
    status public."UserStatus" DEFAULT 'active'::public."UserStatus" NOT NULL,
    image text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "preferredLanguage" text DEFAULT 'en'::text,
    "accountStatus" text DEFAULT 'active'::text,
    "deletionRequestedAt" timestamp(3) without time zone,
    "deletionReason" text,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public.users OWNER TO smart_dev;

--
-- Name: COLUMN users."preferredLanguage"; Type: COMMENT; Schema: public; Owner: smart_dev
--

COMMENT ON COLUMN public.users."preferredLanguage" IS 'User preferred language setting (e.g., en, bn)';


--
-- Name: variant_types; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.variant_types (
    id text NOT NULL,
    name text NOT NULL,
    "productId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.variant_types OWNER TO smart_dev;

--
-- Name: variant_values; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.variant_values (
    id text NOT NULL,
    value text NOT NULL,
    "variantTypeId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.variant_values OWNER TO smart_dev;

--
-- Name: wishlist_items; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.wishlist_items (
    id text NOT NULL,
    "wishlistId" text NOT NULL,
    "productId" text NOT NULL,
    "addedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.wishlist_items OWNER TO smart_dev;

--
-- Name: wishlists; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.wishlists (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text,
    "isPrivate" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "expiresAt" timestamp(3) without time zone
);


ALTER TABLE public.wishlists OWNER TO smart_dev;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
aee503dd-4d20-4fbe-ab0f-a6a3fe0b4994	41952e1bf2229f834f0fb074a596e6f2be2f183032a04de4039e40eb6edb8635	2026-01-25 04:27:09.850272+00	20260105062541_init	\N	\N	2026-01-25 04:27:09.07119+00	1
2434a7c0-141e-412d-a725-fa5f1a0e1838	d6c82381ed999570f8ff8144c2daa1b6d6196f55987557e2334de62866a4c4a5	2026-01-25 04:27:09.876452+00	20260108_add_preferred_language	\N	\N	2026-01-25 04:27:09.856008+00	1
ec0fda0b-2f6b-4fcb-a06a-2db758f496bf	61798f9a51bbac0b9afd7106abc4305190b3a0de9b5e0baa5717861157cbd541	2026-01-25 04:27:09.918353+00	20260109_add_single_default_address_constraint	\N	\N	2026-01-25 04:27:09.882656+00	1
487bdde3-9930-4448-af8e-a27eb5c7e8d1	4e9f42a13247da0863e63d80896037810735e43907bc73f85d7b96b0fcea0f48	2026-01-25 04:27:10.100188+00	20260111_add_user_preferences_and_account_management	\N	\N	2026-01-25 04:27:09.92376+00	1
ea75c999-83a2-4a27-91e6-7ba036c7cbce	0c01e2da49c2f70fcffd2a5c86050b561516f0abcaab5d0d4373130105a25df7	2026-01-25 04:27:10.162275+00	20260113_add_friends_only_to_profile_visibility	\N	\N	2026-01-25 04:27:10.105343+00	1
51a0404d-b5e3-4e93-bbc4-90a1b9383c4f	b4866cf877cae22ee3d141c47585321ea5776ae4138cfe73f9053b39ac9bb58b	2026-01-25 04:27:10.287615+00	20260113_rename_tables_to_snake_case	\N	\N	2026-01-25 04:27:10.167533+00	1
4e47eb88-1ba4-47f8-a717-d60deb3d3bf0	213d483d20100c1d0163c78b45e1b56fd5618841a2bd5d40b43b9a1f8239ac10	2026-01-25 04:27:10.837579+00	20260119_add_missing_rbac_and_corporate_tables	\N	\N	2026-01-25 04:27:10.292846+00	1
f584071e-844b-4710-bfd7-64244ebabd20	fb24db3e1026a86a49083aca4380329feb855e531de44e13206f338568f1ff39	2026-01-25 04:27:10.86646+00	20260120_drop_legacy_permission_table	\N	\N	2026-01-25 04:27:10.846675+00	1
328eac1b-01af-425f-9886-347060121373	9225516784865b8c68300d1669a0310bdbf0c77a445d2b1698b4483e74cbead5	2026-01-25 04:27:10.89081+00	add_account_deletion_columns	\N	\N	2026-01-25 04:27:10.871918+00	1
27c040d0-28cc-4f29-8051-7f3b75d4d3a4	37f50894498befefe02ae6a73e7bba5ada23c849aad995ec32de55cc44aa1f5d	\N	20260126190700_remove_categoryid_from_products	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260126190700_remove_categoryid_from_products\n\nDatabase error code: 42703\n\nDatabase error:\nERROR: column p.categoryId does not exist\n\nPosition:\n[1m  6[0m -- This ensures no data is lost when we remove the categoryId column\n[1m  7[0m INSERT INTO product_categories (id, "productId", "categoryId", "isPrimary", "createdAt", "updatedAt")\n[1m  8[0m SELECT \n[1m  9[0m   gen_random_uuid() as id,\n[1m 10[0m   p.id as "productId",\n[1m 11[1;31m   p."categoryId" as "categoryId",[0m\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42703), message: "column p.categoryId does not exist", detail: None, hint: None, position: Some(Original(624)), where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("parse_relation.c"), line: Some(3665), routine: Some("errorMissingColumn") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260126190700_remove_categoryid_from_products"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260126190700_remove_categoryid_from_products"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2026-01-31 21:22:19.785752+00	2026-01-26 21:03:01.803339+00	0
53abc60b-b629-4707-ad2f-83df6b5ef815	37f50894498befefe02ae6a73e7bba5ada23c849aad995ec32de55cc44aa1f5d	2026-01-31 21:22:19.794277+00	20260126190700_remove_categoryid_from_products		\N	2026-01-31 21:22:19.794277+00	0
ce673c08-8026-4a31-a55a-a8aab00ddf92	d7571251aad6e2232bd0b0a7fc09999cd65807cef7b4ecd3228602045f9976d1	2026-01-31 21:22:29.885031+00	20260126193000_add_performance_indexes	\N	\N	2026-01-31 21:22:29.712231+00	1
477715e3-7a50-4033-8036-3b3bea2d4249	4485497a8849375bd709bf9a4a504da35b2b167ac64992551fb12f0c149022fd	2026-02-01 05:29:46.804336+00	20260201051300_fix_product_images_schema	\N	\N	2026-02-01 05:29:46.628784+00	1
505a37f5-663e-47ba-82ca-e6846294005f	5dcd02ff38da7f3079f3ccbd3bf8db0d5dd28689ac987a6d6a451122bbdd3465	\N	20260201054000_fix_product_images_snake_case_columns	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260201054000_fix_product_images_snake_case_columns\n\nDatabase error code: 42703\n\nDatabase error:\nERROR: column "productId" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42703), message: "column \\"productId\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(3556), routine: Some("renameatt_internal") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260201054000_fix_product_images_snake_case_columns"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260201054000_fix_product_images_snake_case_columns"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	\N	2026-02-01 05:54:19.551237+00	0
\.


--
-- Data for Name: account_deletion_requests; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.account_deletion_requests (id, "userId", "deletionToken", reason, status, "requestedAt", "confirmedAt", "completedAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.addresses (id, "userId", type, "firstName", "lastName", phone, address, "addressLine2", city, district, division, upazila, "postalCode", "isDefault") FROM stdin;
7fb0a0a7-2b9b-4f85-9a8a-b9f78de6e0df	2bdca14e-ac33-43ca-b98a-5117c8ecdeb9	shipping	Mohammad	Bepari	01914287530	Jahir Smart Tower	205/1 & 205/1/A, West Kafrul, Begum Rokeya Sharani, Taltola	Dahaka	301	dhaka	30106	1207	t
\.


--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") FROM stdin;
bab5b14e-eb39-4971-921b-b7356a0c8be4	Bulk Brand 1	bulk-brand-1-1769497128829-e0mif9xw9	\N	\N	\N	\N	2026-01-27 06:58:48.831	0	f	\N	\N	\N	\N	\N	Bulk Brand 1	active	2026-01-27 06:58:48.831	\N
278155cd-781b-4cbb-8c5f-fb563b36f864	Bulk Brand 2	bulk-brand-2-1769497128829-vzff7gwap	\N	\N	\N	\N	2026-01-27 06:58:48.831	0	f	\N	\N	\N	\N	\N	Bulk Brand 2	active	2026-01-27 06:58:48.831	\N
d3d304d3-a7a8-476b-b10b-c26e7fc57124	New Brand	new-brand-1769496931130-rav75er8w	\N	\N	\N	\N	2026-01-27 06:55:31.131	0	f	\N	\N	\N	\N	\N	\N	active	2026-01-27 06:55:31.131	\N
c75c9e48-efe8-49d0-95ba-1e35c3a8bbe8	Bulk Brand 1	bulk-brand-1-1769497259702-di5w4enf2	\N	\N	\N	\N	2026-01-27 07:00:59.704	0	f	\N	\N	\N	\N	\N	Bulk Brand 1	active	2026-01-27 07:00:59.704	\N
49984843-c8d2-4b78-9041-bd5361592ff6	Bulk Brand 2	bulk-brand-2-1769497259702-o1db10vg0	\N	\N	\N	\N	2026-01-27 07:00:59.704	0	f	\N	\N	\N	\N	\N	Bulk Brand 2	active	2026-01-27 07:00:59.704	\N
e0df900d-c5b2-4e2c-97bc-8f1bf2e6dae0	Bulk Brand 1	bulk-brand-1-1769497534683-02llk12jk	\N	\N	\N	\N	2026-01-27 07:05:34.685	0	f	\N	\N	\N	\N	\N	Bulk Brand 1	active	2026-01-27 07:05:34.685	\N
602332bf-d6b9-48ce-89a3-7c9dc3db5e3d	Bulk Brand 2	bulk-brand-2-1769497534683-2qqprv1by	\N	\N	\N	\N	2026-01-27 07:05:34.685	0	f	\N	\N	\N	\N	\N	Bulk Brand 2	active	2026-01-27 07:05:34.685	\N
8d218ec8-6224-4134-82c3-612ee20f3425	Bulk Brand 1	bulk-brand-1-1769497865519-wz4yr7tdr	\N	\N	\N	\N	2026-01-27 07:11:05.52	0	f	\N	\N	\N	\N	\N	Bulk Brand 1	active	2026-01-27 07:11:05.52	\N
82e327a3-0fef-417d-a9ce-09f49d337a4a	Bulk Brand 2	bulk-brand-2-1769497865519-1ohhi6oqn	\N	\N	\N	\N	2026-01-27 07:11:05.52	0	f	\N	\N	\N	\N	\N	Bulk Brand 2	active	2026-01-27 07:11:05.52	\N
63d2d28b-20df-41f1-8095-6f86ab3e6221	Bulk Brand 1	bulk-brand-1-1769497982342-dqrw21hgy	\N	\N	\N	\N	2026-01-27 07:13:02.344	0	f	\N	\N	\N	\N	\N	Bulk Brand 1	active	2026-01-27 07:13:02.344	\N
9cda8b86-ebb8-4662-bdca-b6289bbc7141	Bulk Brand 2	bulk-brand-2-1769497982342-t4ih3e75s	\N	\N	\N	\N	2026-01-27 07:13:02.344	0	f	\N	\N	\N	\N	\N	Bulk Brand 2	active	2026-01-27 07:13:02.344	\N
a7883bec-eb1d-47d0-8a7e-526a4931076a	Bulk Brand 1	bulk-brand-1-1769499410142-tfga77tst	\N	\N	\N	\N	2026-01-27 07:36:50.144	0	f	\N	\N	\N	\N	\N	Bulk Brand 1	active	2026-01-27 07:36:50.144	\N
62bba69a-d77f-49f3-9a65-20b95a458564	Bulk Brand 2	bulk-brand-2-1769499410142-5seigns0k	\N	\N	\N	\N	2026-01-27 07:36:50.144	0	f	\N	\N	\N	\N	\N	Bulk Brand 2	active	2026-01-27 07:36:50.144	\N
e9b11dfe-330e-4c53-bc13-f3d1852ef572	Bulk Brand 1	bulk-brand-1-1769496953560-ueykyk3m7	\N	\N	\N	\N	2026-01-27 06:55:53.561	0	f	\N	\N	\N	\N	\N	Bulk Brand 1	active	2026-01-27 06:55:53.561	\N
5e01982d-a367-4dde-ad15-ace45e6fff4e	Bulk Brand 2	bulk-brand-2-1769496953560-j6ortxu2c	\N	\N	\N	\N	2026-01-27 06:55:53.561	0	f	\N	\N	\N	\N	\N	Bulk Brand 2	active	2026-01-27 06:55:53.561	\N
0b79da56-4443-4b63-ba0e-e87a1b1f86b7	New Brand	new-brand-1769497129608-ieokm8ja0	\N	\N	\N	\N	2026-01-27 06:58:49.61	0	f	\N	\N	\N	\N	\N	\N	active	2026-01-27 06:58:49.61	\N
e7466179-6e21-45c2-b3e7-157eb542cd7d	New Brand	new-brand-1769497260403-q70qqfpxx	\N	\N	\N	\N	2026-01-27 07:01:00.405	0	f	\N	\N	\N	\N	\N	\N	active	2026-01-27 07:01:00.405	\N
33abd699-1bd1-4678-bb26-2902bc505261	New Brand	new-brand-1769497535443-zjtm6bxxh	\N	\N	\N	\N	2026-01-27 07:05:35.445	0	f	\N	\N	\N	\N	\N	\N	active	2026-01-27 07:05:35.445	\N
cefc5db7-e9dd-46d2-bb6a-051a797f5988	New Brand	new-brand-1769497868239-sho2bhdya	\N	\N	\N	\N	2026-01-27 07:11:08.24	0	f	\N	\N	\N	\N	\N	\N	active	2026-01-27 07:11:08.24	\N
31924b47-3eea-4e8a-bb17-feba223bc904	New Brand	new-brand-1769497983165-1pzt2cd44	\N	\N	\N	\N	2026-01-27 07:13:03.167	0	f	\N	\N	\N	\N	\N	\N	active	2026-01-27 07:13:03.167	\N
6aa58400-002c-44e2-acae-d179468313ad	New Brand	new-brand-1769499412778-eurtu2xsf	\N	\N	\N	\N	2026-01-27 07:36:52.78	0	f	\N	\N	\N	\N	\N	\N	active	2026-01-27 07:36:52.78	\N
d0e4febc-c9df-485d-96aa-e25425c0dcb9	New Brand	new-brand-1769496967827-ftjv01aos	\N	\N	\N	\N	2026-01-27 06:56:07.828	0	f	\N	\N	\N	\N	\N	\N	active	2026-01-27 06:56:07.828	\N
35204bf1-840f-4925-82c4-92698a64329b	Bulk Brand 1	bulk-brand-1-1769497884205-38qju3v99	\N	\N	\N	\N	2026-01-27 07:11:24.207	0	f	\N	\N	\N	\N	\N	Bulk Brand 1	active	2026-01-27 07:11:24.207	\N
5b115081-b7f2-4227-ae82-1edcbddd8dfb	Bulk Brand 2	bulk-brand-2-1769497884205-8fw2mzao8	\N	\N	\N	\N	2026-01-27 07:11:24.207	0	f	\N	\N	\N	\N	\N	Bulk Brand 2	active	2026-01-27 07:11:24.207	\N
108cb4d0-9137-4df9-bbe9-bdddee8517a1	Bulk Brand 1	bulk-brand-1-1769497757076-6b8yr8lzw	\N	\N	\N	\N	2026-01-27 07:09:17.078	0	f	\N	\N	\N	\N	\N	Bulk Brand 1	active	2026-01-27 07:09:17.078	\N
f612c1be-551b-4c49-a35b-7b761fe3f27d	Bulk Brand 2	bulk-brand-2-1769497757076-n9prowvau	\N	\N	\N	\N	2026-01-27 07:09:17.078	0	f	\N	\N	\N	\N	\N	Bulk Brand 2	active	2026-01-27 07:09:17.078	\N
ab4dbdf9-debc-4d74-85b4-c587dc8db08f	New Brand	new-brand-1769497885151-iyz6e5f7h	\N	\N	\N	\N	2026-01-27 07:11:25.153	0	f	\N	\N	\N	\N	\N	\N	active	2026-01-27 07:11:25.153	\N
ad7b24e6-f9c2-477d-b3a3-b265b8cae834	New Brand	new-brand-1769497757715-zvs35r87k	\N	\N	\N	\N	2026-01-27 07:09:17.716	0	f	\N	\N	\N	\N	\N	\N	active	2026-01-27 07:09:17.716	\N
9e41b5b0-84dd-4f3d-889d-70efc48b37f4	HP	hp	HP	\N	test@gmail.com	01914287530	2026-02-01 03:48:12.735	0	t	\N	HP	HP	HP	HP	HP	active	2026-02-01 03:48:12.735	https://hp.com
ce1555a3-cd63-4396-817f-7952e7f3c8ae	Dell	dell	Dell	\N	test@gmail.com	01914287530	2026-02-01 03:48:57.857	0	t	\N	Dell	Dell	Dell	Dell	Dell	active	2026-02-01 03:48:57.857	https://dell.com
2bd4edf3-0311-485b-ae4d-610957330475	Lenovo	lenovo	Lenovo	\N	test@gmail.com	01914287530	2026-02-01 03:49:39.189	0	t	\N	Lenovo	Lenovo	Lenovo	Lenovo	Lenovo	active	2026-02-01 03:49:39.189	https://lenovo.com
14907a1d-2cac-421f-864e-603f51751fbb	Acer	acer	Acer	\N	test@gmail.com	01914287530	2026-02-01 03:50:20.221	0	t	\N	Acer	Acer	Acer	Acer	Acer	active	2026-02-01 03:50:20.221	https://acer.com
10594c15-4df7-4acd-b2c4-771f35a584df	Apple	apple	Apple	\N	test@gmail.com	01914287530	2026-02-01 03:51:00.793	0	t	\N	Apple	Apple	Apple	Apple	Apple	active	2026-02-01 03:51:00.793	https://apple.com
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.cart_items (id, "cartId", "productId", "variantId", quantity, "unitPrice", "totalPrice", "addedAt") FROM stdin;
\.


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.carts (id, "userId", "sessionId", "createdAt", "updatedAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") FROM stdin;
4912ab61-ebc8-42fb-aa0f-10330d7f8ddb	New Category	new-category-1769496967579-f192nx8ji	\N	\N	0	2026-01-27 06:56:07.58	0	\N	\N	\N	\N	\N	\N	\N	active	2026-01-27 06:56:07.58
cfb57bbe-21fa-40eb-bd61-284396060e13	Bulk Category 2	bulk-category-2-1769497884057-i9ajwvfg7	\N	\N	0	2026-01-27 07:11:24.059	0	\N	\N	\N	\N	\N	\N	Bulk Category 2	active	2026-01-27 07:11:24.059
4e26aa1d-9c06-4b0e-9c89-ad9ddfe6e8d5	Bulk Category 1	bulk-category-1-1769497756966-2jd1zb4n3	\N	\N	0	2026-01-27 07:09:16.968	0	\N	\N	\N	\N	\N	\N	Bulk Category 1	active	2026-01-27 07:09:16.968
e458be27-0d0f-4ec1-8daa-8ba2de520be5	Bulk Category 2	bulk-category-2-1769497756966-t4z224zc9	\N	\N	0	2026-01-27 07:09:16.968	0	\N	\N	\N	\N	\N	\N	Bulk Category 2	active	2026-01-27 07:09:16.968
56bc820c-e6d2-4711-a844-bc8cc714279c	New Category	new-category-1769497884884-3h1viwyaj	\N	\N	0	2026-01-27 07:11:24.886	0	\N	\N	\N	\N	\N	\N	\N	active	2026-01-27 07:11:24.886
72bc45e3-a484-4ef6-aa9d-e892f42062a3	New Category	new-category-1769497757546-0tva2ada4	\N	\N	0	2026-01-27 07:09:17.547	0	\N	\N	\N	\N	\N	\N	\N	active	2026-01-27 07:09:17.547
2829f167-4aa0-4ac9-9fc9-a88812e98ef2	Laptops	laptops	Laptops	\N	0	2026-02-01 03:52:52.52	0	\N	\N	Laptops	Laptops	Laptops	Laptops	Laptops	active	2026-02-01 03:52:52.52
1cd82d6b-d04b-4a3d-836e-7f2fe4d07b34	HP Laptop	hp-laptop	HP Laptop	2829f167-4aa0-4ac9-9fc9-a88812e98ef2	0	2026-02-01 03:56:08.996	0	\N	\N	HP Laptop	HP Laptop	HP Laptop	HP Laptop	HP Laptop	active	2026-02-01 03:56:08.996
d4317da1-c477-49f0-8d8d-1f383ff19688	Dell Laptop	dell-laptop	Dell Laptop	2829f167-4aa0-4ac9-9fc9-a88812e98ef2	0	2026-02-01 03:57:09.008	1	\N	\N	Dell Laptop	Dell Laptop	Dell Laptop	Dell Laptop	Dell Laptop	active	2026-02-01 03:57:09.008
384f8b71-756d-48ca-9406-b173284926f1	Acer Laptop	acer-laptop	Acer Laptop	2829f167-4aa0-4ac9-9fc9-a88812e98ef2	0	2026-02-01 03:58:12.694	2	\N	\N	Acer Laptop	Acer Laptop	Acer Laptop	Acer Laptop	Acer Laptop	active	2026-02-01 03:58:12.694
8308aa41-41a6-4651-8efb-12fda926ba7e	Tablets	tablets	Tablets	\N	0	2026-02-01 03:59:25.372	1	\N	\N	Tablets	Tablets	Tablets	Tablets	Tablets	active	2026-02-01 03:59:25.372
0474b1f2-c49b-4166-aabc-9042d2397087	Lenovo Tablet	lenovo-tablet	Lenovo Tablet	8308aa41-41a6-4651-8efb-12fda926ba7e	0	2026-02-01 04:01:47.304	0	\N	\N	Lenovo Tablet	Lenovo Tablet	Lenovo Tablet	Lenovo Tablet	Lenovo Tablet	active	2026-02-01 04:01:47.304
a492016b-a0e1-47ba-8566-c5342a14f381	Lenovo Tablet 1	lenovo-tablet-1	Lenovo Tablet 1	0474b1f2-c49b-4166-aabc-9042d2397087	0	2026-02-01 04:02:31.817	0	\N	\N	Lenovo Tablet 1	Lenovo Tablet 1	Lenovo Tablet 1	Lenovo Tablet 1	Lenovo Tablet 1	active	2026-02-01 04:02:31.817
\.


--
-- Data for Name: corporate_accounts; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.corporate_accounts (id, user_id, company_name, company_registration_number, tin_number, business_address, business_division, business_district, business_upazila, business_postal_code, authorized_person_name, authorized_person_email, authorized_person_phone, company_email, credit_limit, credit_used, account_status, verification_status, account_manager_id, created_at, updated_at, verified_at, approved_by, approved_at) FROM stdin;
\.


--
-- Data for Name: corporate_approvals; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.corporate_approvals (id, corporate_account_id, request_type, requested_by, requested_amount, requested_at, approved_by, approved_at, status, notes) FROM stdin;
\.


--
-- Data for Name: corporate_documents; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.corporate_documents (id, corporate_account_id, document_type, document_name, document_url, uploaded_at, verified_at, verified_by, status) FROM stdin;
\.


--
-- Data for Name: corporate_pricing; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.corporate_pricing (id, corporate_account_id, product_id, discount_percent, special_price, valid_from, valid_to) FROM stdin;
\.


--
-- Data for Name: corporate_users; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.corporate_users (id, corporate_account_id, user_id, role, is_active, assigned_at, expires_at) FROM stdin;
\.


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.coupons (id, code, type, value, "minAmount", "maxDiscount", "usageLimit", "usedCount", "isActive", "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: cross_sell_products; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.cross_sell_products (id, "productId", "relatedProductId", "displayOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: email_verification_tokens; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.email_verification_tokens (id, "userId", token, "expiresAt", "createdAt") FROM stdin;
ef9fe549-8458-437c-bbbb-aaf389f5ba9f	eca45d70-6476-493b-8c85-eded2c2e4ccb	ec7645863a7d5e1df23fac0d0e38bbf8229caaad4f35a858ff2174d9ab10825d	2026-01-27 16:58:45.453	2026-01-26 16:58:45.454
2e700b3e-0fd8-46c4-942a-4252e3ea469e	2bdca14e-ac33-43ca-b98a-5117c8ecdeb9	6dbd1025229cb3876419707af8129da89255e6709f29593be132724a31dac5ec	2026-01-27 17:34:10.39	2026-01-26 17:34:10.391
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.orders (id, "orderNumber", "userId", "addressId", subtotal, tax, "shippingCost", discount, total, "paymentMethod", "paymentStatus", "paidAt", status, notes, "internalNotes", "createdAt", "updatedAt", "confirmedAt", "shippedAt", "deliveredAt", corporate_account_id) FROM stdin;
\.


--
-- Data for Name: password_history; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.password_history (id, "userId", "passwordHash", "createdAt") FROM stdin;
9974415f-8aef-4c49-afad-9f9ae2cf2b41	eca45d70-6476-493b-8c85-eded2c2e4ccb	$2a$12$194HjN0O574A2eAjdFX7nugO4PDXnOXR01.As6sxorsMz0KOa34mi	2026-01-26 16:58:45.441
5d19a09f-0cd3-40ec-9223-2e5b08fb61cc	2bdca14e-ac33-43ca-b98a-5117c8ecdeb9	$2a$12$eP8GgqnYl05T3KbDKkumIe8NfWCvJPOpbpio8sjZ8h9zRFP3PdD/6	2026-01-26 17:34:10.378
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.permissions (id, name, resource, action, description, created_at) FROM stdin;
18052c3d-aa84-48b8-8fd0-bee55538b7b9	user:read	user	read	View user information	2026-01-25 04:27:10.300782+00
4449d6d4-ecfe-4146-9b4b-ae86d9d75d80	user:create	user	create	Create new users	2026-01-25 04:27:10.300782+00
6c81487e-5d73-47f0-89b9-618cc6f32232	user:update	user	update	Update user information	2026-01-25 04:27:10.300782+00
06216b84-3695-41b5-8325-c2919f3d3eac	user:delete	user	delete	Delete users	2026-01-25 04:27:10.300782+00
1363aa55-bc45-4b65-bd40-21f80f37df30	user:assign_role	user	assign_role	Assign roles to users	2026-01-25 04:27:10.300782+00
f3a72737-6c39-4a7d-8a9b-8adeb6f01a04	product:read	product	read	View products	2026-01-25 04:27:10.300782+00
f96f95ec-1502-4609-8802-80f775782ba0	product:create	product	create	Create new products	2026-01-25 04:27:10.300782+00
d3e1ed4e-822e-49ba-83af-074b44ccf3fc	product:update	product	update	Update product information	2026-01-25 04:27:10.300782+00
a307e6cb-53ec-415b-9289-38b7d692a83e	product:delete	product	delete	Delete products	2026-01-25 04:27:10.300782+00
c0ac7de9-27ff-4ce1-9929-582449fd7492	order:read	order	read	View orders	2026-01-25 04:27:10.300782+00
ac2f7497-dc35-4b3c-9c4c-1adb4b86e57f	order:create	order	create	Create orders	2026-01-25 04:27:10.300782+00
bbaae6c8-9351-49ef-a2af-3e5ef0b2be79	order:update	order	update	Update order information	2026-01-25 04:27:10.300782+00
fbcb991b-20a2-41d9-80fb-aef865ef76e0	order:delete	order	delete	Delete orders	2026-01-25 04:27:10.300782+00
0b224c6f-a9f8-4450-9481-87eec23b8b3a	order:manage_status	order	manage_status	Manage order status	2026-01-25 04:27:10.300782+00
55c8257e-f5a6-48fb-8265-59c08d695405	category:read	category	read	View categories	2026-01-25 04:27:10.300782+00
96029482-e5e2-46b0-91d6-972ac8f176dd	category:create	category	create	Create new categories	2026-01-25 04:27:10.300782+00
35f807da-21b7-466f-85e2-5b958e10bf5a	category:update	category	update	Update category information	2026-01-25 04:27:10.300782+00
e3cb3d9c-22fc-4193-b45c-464c8b64fb9b	category:delete	category	delete	Delete categories	2026-01-25 04:27:10.300782+00
fc6234f8-aa04-4825-9d8e-3e5801ff106f	brand:read	brand	read	View brands	2026-01-25 04:27:10.300782+00
947ea574-03e8-4854-82f4-13b1703b96de	brand:create	brand	create	Create new brands	2026-01-25 04:27:10.300782+00
9ca2b5d6-562e-4025-8337-ab54e9735fa9	brand:update	brand	update	Update brand information	2026-01-25 04:27:10.300782+00
e94e27d3-e568-4369-b691-05c5f8bf8c73	brand:delete	brand	delete	Delete brands	2026-01-25 04:27:10.300782+00
7dc33bbb-9178-4f11-bbad-51e1a2986b29	review:read	review	read	View reviews	2026-01-25 04:27:10.300782+00
83435a52-986b-4dad-b731-172ec37df140	review:create	review	create	Create reviews	2026-01-25 04:27:10.300782+00
2394c9c2-9f05-4a80-b895-283e07368142	review:manage	review	manage	Manage reviews (approve/delete)	2026-01-25 04:27:10.300782+00
a3e9ceba-29dc-47ef-b4a3-3f9bcfe90320	analytics:view	analytics	view	View analytics dashboard	2026-01-25 04:27:10.300782+00
b080199d-2beb-48ff-b482-db0d63b6e5a8	analytics:export	analytics	export	Export analytics data	2026-01-25 04:27:10.300782+00
b0e453b3-cf2b-47b5-8555-ccefb83ef646	support:read	support	read	View support tickets	2026-01-25 04:27:10.300782+00
3f576e85-b27e-4c1b-8fb9-f362d670580c	support:respond	support	respond	Respond to support tickets	2026-01-25 04:27:10.300782+00
31d0301e-b13d-4c69-9b3a-8a997f91ca9c	support:manage	support	manage	Manage support tickets	2026-01-25 04:27:10.300782+00
86658291-5002-4391-86c7-944d7801a197	corporate:read	corporate	read	View corporate accounts	2026-01-25 04:27:10.300782+00
5dea5965-1929-4ec0-9437-d363d6d8b172	corporate:create	corporate	create	Create corporate accounts	2026-01-25 04:27:10.300782+00
f7042b4c-1797-4e40-bb21-5ee222f1ec60	corporate:update	corporate	update	Update corporate accounts	2026-01-25 04:27:10.300782+00
d0a1b4ce-067d-40a3-bb4c-cbd4b51c26d2	corporate:manage_users	corporate	manage_users	Manage corporate users	2026-01-25 04:27:10.300782+00
3e3ec705-b314-456a-bf19-70a963c9fb09	system:config	system	config	Configure system settings	2026-01-25 04:27:10.300782+00
1ce64ae3-84c2-440e-ac1d-99b8462bfc64	system:logs	system	logs	View system logs	2026-01-25 04:27:10.300782+00
cec23cd5-5ae5-444e-b271-9bef9acf0ef1	system:backup	system	backup	Create system backups	2026-01-25 04:27:10.300782+00
\.


--
-- Data for Name: phone_otps; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.phone_otps (id, "userId", phone, otp, "expiresAt", "verifiedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.product_categories (id, "productId", "categoryId", "isPrimary", "createdAt", "updatedAt") FROM stdin;
518a43d5-5ce8-4b16-82ae-837975d340e2	c571ed71-fd5b-4158-ad6d-87405e75f046	1cd82d6b-d04b-4a3d-836e-7f2fe4d07b34	t	2026-02-01 05:57:43.106	2026-02-01 05:57:43.106
5221ce6b-0457-4889-98e9-8af3599e56f0	efe9a564-7000-484b-8900-fece3feb6e0f	a492016b-a0e1-47ba-8566-c5342a14f381	t	2026-02-02 06:37:44.586	2026-02-02 06:37:44.586
\.


--
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) FROM stdin;
0e3262ed-4991-4eac-98c4-aacf61214e7c	c571ed71-fd5b-4158-ad6d-87405e75f046	0	http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954288689_610240233_0_HP-15-fc0659AU-Laptop.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954288689_610240233_0_HP-15-fc0659AU-Laptop_large.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954288689_610240233_0_HP-15-fc0659AU-Laptop_thumb.jpg	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	t	34010	image/jpeg	500	500	completed	2026-02-01 13:58:12.612189	2026-02-01 13:58:12.612189
8b440c14-3092-49a6-952d-cdc61fbdf14c	c571ed71-fd5b-4158-ad6d-87405e75f046	0	http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954313019_326758816_0_HP-15-fc0659AU-Laptop.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954313019_326758816_0_HP-15-fc0659AU-Laptop_large.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954313019_326758816_0_HP-15-fc0659AU-Laptop_thumb.jpg	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	f	34010	image/jpeg	500	500	deleted	2026-02-01 13:58:36.18475	2026-02-01 15:59:43.702271
d75dfe19-bbc2-451d-a3f9-5ff79b1bb2f4	c571ed71-fd5b-4158-ad6d-87405e75f046	1	http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954292649_221225_1_HP-15-fc0659AU-Laptop-1.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954292649_221225_1_HP-15-fc0659AU-Laptop-1_large.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954292649_221225_1_HP-15-fc0659AU-Laptop-1_thumb.jpg	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	f	31179	image/jpeg	500	500	deleted	2026-02-01 13:58:15.61629	2026-02-01 15:59:43.768326
4971a1c8-d9ca-4ad6-88e2-0cf58f53f3b7	c571ed71-fd5b-4158-ad6d-87405e75f046	2	http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954318838_942318007_2_HP-15-fc0659AU-Laptop-2.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954318838_942318007_2_HP-15-fc0659AU-Laptop-2_large.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954318838_942318007_2_HP-15-fc0659AU-Laptop-2_thumb.jpg	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	f	30602	image/jpeg	500	500	deleted	2026-02-01 13:58:41.379909	2026-02-01 15:59:43.890964
b067b90d-3428-437e-a1b5-a2acaeab30fa	c571ed71-fd5b-4158-ad6d-87405e75f046	3	http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954298854_851451865_3_HP-15-fc0659AU-Laptop-3.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954298854_851451865_3_HP-15-fc0659AU-Laptop-3_large.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954298854_851451865_3_HP-15-fc0659AU-Laptop-3_thumb.jpg	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	f	13158	image/jpeg	500	500	deleted	2026-02-01 13:58:23.119915	2026-02-01 15:59:44.092106
3a846374-baa0-44bd-9ff1-f3d94e157722	c571ed71-fd5b-4158-ad6d-87405e75f046	4	http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954323998_387871877_4_HP-15-fc0659AU-Laptop-4.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954323998_387871877_4_HP-15-fc0659AU-Laptop-4_large.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954323998_387871877_4_HP-15-fc0659AU-Laptop-4_thumb.jpg	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	f	10009	image/jpeg	500	500	deleted	2026-02-01 13:58:46.466937	2026-02-01 15:59:44.223519
fc52d2d3-4a94-4079-834b-730bf184f956	c571ed71-fd5b-4158-ad6d-87405e75f046	1	http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954316200_319212868_1_HP-15-fc0659AU-Laptop-1.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954316200_319212868_1_HP-15-fc0659AU-Laptop-1_large.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954316200_319212868_1_HP-15-fc0659AU-Laptop-1_thumb.jpg	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	f	31179	image/jpeg	500	500	deleted	2026-02-01 13:58:38.827177	2026-02-01 16:21:11.484815
e0fb6420-6e80-4312-b607-469dd768c22f	c571ed71-fd5b-4158-ad6d-87405e75f046	2	http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954295644_203145225_2_HP-15-fc0659AU-Laptop-2.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954295644_203145225_2_HP-15-fc0659AU-Laptop-2_large.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954295644_203145225_2_HP-15-fc0659AU-Laptop-2_thumb.jpg	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	f	30602	image/jpeg	500	500	deleted	2026-02-01 13:58:18.844646	2026-02-01 16:25:08.232432
0cda5397-3eb6-4520-b130-1e3e1eb8fdd7	c571ed71-fd5b-4158-ad6d-87405e75f046	3	http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954321386_695507058_3_HP-15-fc0659AU-Laptop-3.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954321386_695507058_3_HP-15-fc0659AU-Laptop-3_large.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954321386_695507058_3_HP-15-fc0659AU-Laptop-3_thumb.jpg	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	f	13158	image/jpeg	500	500	deleted	2026-02-01 13:58:43.988662	2026-02-01 16:30:23.660539
9e217f58-8362-4b47-8175-efb01a599270	c571ed71-fd5b-4158-ad6d-87405e75f046	5	http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963486825_873295550_3_HP-15-fc0659AU-Laptop-3.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963486825_873295550_3_HP-15-fc0659AU-Laptop-3_large.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963486825_873295550_3_HP-15-fc0659AU-Laptop-3_thumb.jpg	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	f	13158	image/jpeg	500	500	deleted	2026-02-01 16:31:27.122136	2026-02-02 04:14:17.560595
254c7b8c-2726-41c9-8a6e-fe593d72ec28	c571ed71-fd5b-4158-ad6d-87405e75f046	4	http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963486451_893840155_2_HP-15-fc0659AU-Laptop-2.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963486451_893840155_2_HP-15-fc0659AU-Laptop-2_large.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963486451_893840155_2_HP-15-fc0659AU-Laptop-2_thumb.jpg	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	f	30602	image/jpeg	500	500	deleted	2026-02-01 16:31:26.822573	2026-02-02 04:35:00.106578
bce93b5a-4ac2-4f7b-b630-95c6bcae3482	c571ed71-fd5b-4158-ad6d-87405e75f046	2	http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963485760_480212692_0_HP-15-fc0355AU-Laptop-3.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963485760_480212692_0_HP-15-fc0355AU-Laptop-3_large.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963485760_480212692_0_HP-15-fc0355AU-Laptop-3_thumb.jpg	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	f	13106	image/jpeg	500	500	deleted	2026-02-01 16:31:26.11916	2026-02-01 16:31:47.922348
f43025a0-7707-463b-963d-dc1d4e2262d6	c571ed71-fd5b-4158-ad6d-87405e75f046	3	http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963486124_198391104_1_HP-15-fc0355AU-Laptop-4.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963486124_198391104_1_HP-15-fc0355AU-Laptop-4_large.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963486124_198391104_1_HP-15-fc0355AU-Laptop-4_thumb.jpg	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	f	10613	image/jpeg	500	500	deleted	2026-02-01 16:31:26.447371	2026-02-01 16:31:47.897269
d68ef413-b767-4753-bc96-8382bf36b26d	c571ed71-fd5b-4158-ad6d-87405e75f046	6	http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963487127_514547434_4_HP-15-fc0659AU-Laptop-4.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963487127_514547434_4_HP-15-fc0659AU-Laptop-4_large.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963487127_514547434_4_HP-15-fc0659AU-Laptop-4_thumb.jpg	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	f	10009	image/jpeg	500	500	deleted	2026-02-01 16:31:27.38158	2026-02-01 16:31:47.951596
3160d1c2-9790-4ab4-98bf-054b5e1a2c52	c571ed71-fd5b-4158-ad6d-87405e75f046	4	http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954303137_915573243_4_HP-15-fc0659AU-Laptop-4.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954303137_915573243_4_HP-15-fc0659AU-Laptop-4_large.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954303137_915573243_4_HP-15-fc0659AU-Laptop-4_thumb.jpg	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	f	10009	image/jpeg	500	500	deleted	2026-02-01 13:58:27.592351	2026-02-01 16:34:32.229447
87bb3a9b-195e-46a0-b85c-e143cc154055	c571ed71-fd5b-4158-ad6d-87405e75f046	1	http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008481972_868949816_0_HP-15-fc0659AU-Laptop-1.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008481972_868949816_0_HP-15-fc0659AU-Laptop-1_large.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008481972_868949816_0_HP-15-fc0659AU-Laptop-1_thumb.jpg	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	f	31179	image/jpeg	500	500	completed	2026-02-02 05:01:22.385302	2026-02-02 05:01:22.385302
4b1b60a0-e23c-4c0c-8cb5-02a29809d0fe	c571ed71-fd5b-4158-ad6d-87405e75f046	2	http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008482401_52417570_1_HP-15-fc0659AU-Laptop-2.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008482401_52417570_1_HP-15-fc0659AU-Laptop-2_large.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008482401_52417570_1_HP-15-fc0659AU-Laptop-2_thumb.jpg	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	f	30602	image/jpeg	500	500	completed	2026-02-02 05:01:22.691116	2026-02-02 05:01:22.691116
914bf92f-2463-42a7-a7d5-30016224de4f	c571ed71-fd5b-4158-ad6d-87405e75f046	3	http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008482695_775642763_2_HP-15-fc0659AU-Laptop-3.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008482695_775642763_2_HP-15-fc0659AU-Laptop-3_large.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008482695_775642763_2_HP-15-fc0659AU-Laptop-3_thumb.jpg	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	f	13158	image/jpeg	500	500	completed	2026-02-02 05:01:23.05857	2026-02-02 05:01:23.05857
1897d00b-fc13-492f-8c77-ca0738d39796	c571ed71-fd5b-4158-ad6d-87405e75f046	4	http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008483066_637729097_3_HP-15-fc0659AU-Laptop-4.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008483066_637729097_3_HP-15-fc0659AU-Laptop-4_large.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008483066_637729097_3_HP-15-fc0659AU-Laptop-4_thumb.jpg	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	f	10009	image/jpeg	500	500	completed	2026-02-02 05:01:23.484327	2026-02-02 05:01:23.484327
377bbac5-a08c-41c2-b0ad-75945cc5ede6	c571ed71-fd5b-4158-ad6d-87405e75f046	5	http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008483489_264805692_4_HP-15-fc0659AU-Laptop.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008483489_264805692_4_HP-15-fc0659AU-Laptop_large.jpg	products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008483489_264805692_4_HP-15-fc0659AU-Laptop_thumb.jpg	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	f	34010	image/jpeg	500	500	deleted	2026-02-02 05:01:23.988181	2026-02-02 05:01:48.641
\.


--
-- Data for Name: product_specifications; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.product_specifications (id, "productId", name, value, "sortOrder") FROM stdin;
\.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.product_variants (id, "productId", name, sku, price, "comparePrice", stock, "isActive") FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.products (id, sku, name, "nameEn", "nameBn", slug, "shortDescription", description, "brandId", "regularPrice", "salePrice", "costPrice", "taxRate", "stockQuantity", "lowStockThreshold", status, "metaTitle", "metaDescription", "metaKeywords", "isFeatured", "isNewArrival", "isBestSeller", "warrantyPeriod", "warrantyType", "createdAt", "updatedAt", "publishedAt", visibility) FROM stdin;
c571ed71-fd5b-4158-ad6d-87405e75f046	1234	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	hp-15-fc0659au-ryzen-5-7520u-156-inch-fhd-laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	9e41b5b0-84dd-4f3d-889d-70efc48b37f4	1000.00	850.00	700.00	0.00	100	10	active	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop	t	t	t	12	 \t02 Years (Condition applied)	2026-02-01 05:57:43.106	2026-02-01 05:57:43.106	\N	public
efe9a564-7000-484b-8900-fece3feb6e0f	TEST-1769925304236	Test Product	Test Product		test-product-1769925304236	A test product	This is a test product	14907a1d-2cac-421f-864e-603f51751fbb	100.00	90.00	70.00	0.00	100	10	active	Test Product	A test product	test,product	f	f	t	12		2026-02-01 05:55:04.486	2026-02-02 06:37:44.599	2026-02-02 06:36:38.508	public
\.


--
-- Data for Name: related_products; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.related_products (id, "productId", "relatedProductId", "displayOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.reviews (id, "productId", "userId", rating, title, comment, "isVerified", "isApproved", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: role_escalation_requests; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.role_escalation_requests (id, user_id, current_role_id, requested_role_id, requested_by, status, reason, reviewed_by, reviewed_at, review_notes, created_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.role_permissions (id, role_id, permission_id, granted_at, granted_by) FROM stdin;
b2b5dc10-aacf-4ccb-9553-57754a047b69	fbc807d7-c739-4293-b50e-601cc19e1e41	18052c3d-aa84-48b8-8fd0-bee55538b7b9	2026-01-25 04:27:10.300782+00	\N
08c3af2c-00b5-4e03-ad05-c7616f9e0f11	fbc807d7-c739-4293-b50e-601cc19e1e41	4449d6d4-ecfe-4146-9b4b-ae86d9d75d80	2026-01-25 04:27:10.300782+00	\N
d779323d-790e-45fa-8b03-30be702fc298	fbc807d7-c739-4293-b50e-601cc19e1e41	6c81487e-5d73-47f0-89b9-618cc6f32232	2026-01-25 04:27:10.300782+00	\N
555c6705-a48d-4aa0-9bc3-ac71ceae5805	fbc807d7-c739-4293-b50e-601cc19e1e41	06216b84-3695-41b5-8325-c2919f3d3eac	2026-01-25 04:27:10.300782+00	\N
bdb96111-2a65-479b-997b-124eb95a1d45	fbc807d7-c739-4293-b50e-601cc19e1e41	1363aa55-bc45-4b65-bd40-21f80f37df30	2026-01-25 04:27:10.300782+00	\N
c24f04dd-49c5-4459-a6dd-fed616d9b925	fbc807d7-c739-4293-b50e-601cc19e1e41	f3a72737-6c39-4a7d-8a9b-8adeb6f01a04	2026-01-25 04:27:10.300782+00	\N
f4f43f53-a6b7-43e6-ae51-94e87ff605cc	fbc807d7-c739-4293-b50e-601cc19e1e41	f96f95ec-1502-4609-8802-80f775782ba0	2026-01-25 04:27:10.300782+00	\N
da42289f-d123-42b9-bd47-c68f729391cf	fbc807d7-c739-4293-b50e-601cc19e1e41	d3e1ed4e-822e-49ba-83af-074b44ccf3fc	2026-01-25 04:27:10.300782+00	\N
91cbf605-079c-40af-81e4-2818688f8088	fbc807d7-c739-4293-b50e-601cc19e1e41	a307e6cb-53ec-415b-9289-38b7d692a83e	2026-01-25 04:27:10.300782+00	\N
82a7e62d-04bc-4c0b-9b2a-2cbe4dd285db	fbc807d7-c739-4293-b50e-601cc19e1e41	c0ac7de9-27ff-4ce1-9929-582449fd7492	2026-01-25 04:27:10.300782+00	\N
bb6aafe8-2879-416b-ac07-d32e3177fea4	fbc807d7-c739-4293-b50e-601cc19e1e41	ac2f7497-dc35-4b3c-9c4c-1adb4b86e57f	2026-01-25 04:27:10.300782+00	\N
d65cfe1d-4038-4a80-94c8-6250ed649d2d	fbc807d7-c739-4293-b50e-601cc19e1e41	bbaae6c8-9351-49ef-a2af-3e5ef0b2be79	2026-01-25 04:27:10.300782+00	\N
9fb5200a-8ed7-42cc-b0ff-ed8a9a83dc6e	fbc807d7-c739-4293-b50e-601cc19e1e41	fbcb991b-20a2-41d9-80fb-aef865ef76e0	2026-01-25 04:27:10.300782+00	\N
a6ab4f19-ee65-4eb0-8ab3-faae5a1a64f1	fbc807d7-c739-4293-b50e-601cc19e1e41	0b224c6f-a9f8-4450-9481-87eec23b8b3a	2026-01-25 04:27:10.300782+00	\N
a830d754-1f05-4c2a-81d2-e862d1cf3ad5	fbc807d7-c739-4293-b50e-601cc19e1e41	55c8257e-f5a6-48fb-8265-59c08d695405	2026-01-25 04:27:10.300782+00	\N
7f7a1b05-8861-4513-b556-2bc0d61d7268	fbc807d7-c739-4293-b50e-601cc19e1e41	96029482-e5e2-46b0-91d6-972ac8f176dd	2026-01-25 04:27:10.300782+00	\N
f2ba20f3-6d4b-48d9-be1d-d126a33564ef	fbc807d7-c739-4293-b50e-601cc19e1e41	35f807da-21b7-466f-85e2-5b958e10bf5a	2026-01-25 04:27:10.300782+00	\N
46d55819-ac02-4b33-b863-81c2ea8eb164	fbc807d7-c739-4293-b50e-601cc19e1e41	e3cb3d9c-22fc-4193-b45c-464c8b64fb9b	2026-01-25 04:27:10.300782+00	\N
233639a2-848c-4db4-8685-26355843a68e	fbc807d7-c739-4293-b50e-601cc19e1e41	fc6234f8-aa04-4825-9d8e-3e5801ff106f	2026-01-25 04:27:10.300782+00	\N
1dcc2975-6505-41ef-8c43-a0f835e11883	fbc807d7-c739-4293-b50e-601cc19e1e41	947ea574-03e8-4854-82f4-13b1703b96de	2026-01-25 04:27:10.300782+00	\N
f76c5cdd-781b-49f9-b6ed-f35c9a3c20d9	fbc807d7-c739-4293-b50e-601cc19e1e41	9ca2b5d6-562e-4025-8337-ab54e9735fa9	2026-01-25 04:27:10.300782+00	\N
1deded02-57b0-48a7-9270-76ee1b95ebee	fbc807d7-c739-4293-b50e-601cc19e1e41	e94e27d3-e568-4369-b691-05c5f8bf8c73	2026-01-25 04:27:10.300782+00	\N
facea0c2-ac8a-4399-af7d-fa6fce424bbd	fbc807d7-c739-4293-b50e-601cc19e1e41	7dc33bbb-9178-4f11-bbad-51e1a2986b29	2026-01-25 04:27:10.300782+00	\N
fb964a32-eab6-4b31-b1c7-07bee97e20fb	fbc807d7-c739-4293-b50e-601cc19e1e41	83435a52-986b-4dad-b731-172ec37df140	2026-01-25 04:27:10.300782+00	\N
b3cddc79-e0fa-4d5e-a5d2-5b06fa6dd834	fbc807d7-c739-4293-b50e-601cc19e1e41	2394c9c2-9f05-4a80-b895-283e07368142	2026-01-25 04:27:10.300782+00	\N
a39c86ba-26ef-4882-8fc3-a499c2120ba8	fbc807d7-c739-4293-b50e-601cc19e1e41	a3e9ceba-29dc-47ef-b4a3-3f9bcfe90320	2026-01-25 04:27:10.300782+00	\N
244e93ce-ab10-4e70-96a2-4d9fa995a7f2	fbc807d7-c739-4293-b50e-601cc19e1e41	b080199d-2beb-48ff-b482-db0d63b6e5a8	2026-01-25 04:27:10.300782+00	\N
5de12f79-df53-4822-9f46-6976b938466d	fbc807d7-c739-4293-b50e-601cc19e1e41	b0e453b3-cf2b-47b5-8555-ccefb83ef646	2026-01-25 04:27:10.300782+00	\N
4e805e25-6008-476c-8451-1dda9fbfb231	fbc807d7-c739-4293-b50e-601cc19e1e41	3f576e85-b27e-4c1b-8fb9-f362d670580c	2026-01-25 04:27:10.300782+00	\N
a5dffad7-5662-4115-b6cf-df021697bfe5	fbc807d7-c739-4293-b50e-601cc19e1e41	31d0301e-b13d-4c69-9b3a-8a997f91ca9c	2026-01-25 04:27:10.300782+00	\N
82dd7c8f-db62-4730-bac2-6a8782db1b2f	fbc807d7-c739-4293-b50e-601cc19e1e41	86658291-5002-4391-86c7-944d7801a197	2026-01-25 04:27:10.300782+00	\N
3d4858b8-a784-4c49-92a9-d9539647de9c	fbc807d7-c739-4293-b50e-601cc19e1e41	5dea5965-1929-4ec0-9437-d363d6d8b172	2026-01-25 04:27:10.300782+00	\N
4833c6a8-1189-4c72-a5c7-ad89ab4b1036	fbc807d7-c739-4293-b50e-601cc19e1e41	f7042b4c-1797-4e40-bb21-5ee222f1ec60	2026-01-25 04:27:10.300782+00	\N
bfd7a89d-622f-4514-ad3f-64a9f8b3838e	fbc807d7-c739-4293-b50e-601cc19e1e41	d0a1b4ce-067d-40a3-bb4c-cbd4b51c26d2	2026-01-25 04:27:10.300782+00	\N
2ce6771d-1aec-484f-9617-c4db478cbf76	fbc807d7-c739-4293-b50e-601cc19e1e41	3e3ec705-b314-456a-bf19-70a963c9fb09	2026-01-25 04:27:10.300782+00	\N
15b4088a-d73c-4f0f-8726-c4e8bc46be87	fbc807d7-c739-4293-b50e-601cc19e1e41	1ce64ae3-84c2-440e-ac1d-99b8462bfc64	2026-01-25 04:27:10.300782+00	\N
9e119ea0-6a52-473b-aa79-3a56456c99ae	fbc807d7-c739-4293-b50e-601cc19e1e41	cec23cd5-5ae5-444e-b271-9bef9acf0ef1	2026-01-25 04:27:10.300782+00	\N
3d26d7d9-1dad-4da3-b15a-f8a0afa3edc1	09510acf-2e77-4ae0-8206-3b154b391821	18052c3d-aa84-48b8-8fd0-bee55538b7b9	2026-01-25 04:27:10.300782+00	\N
67f30783-8cb4-438b-8713-ac83cac713ce	09510acf-2e77-4ae0-8206-3b154b391821	4449d6d4-ecfe-4146-9b4b-ae86d9d75d80	2026-01-25 04:27:10.300782+00	\N
2b47aab0-11b8-48b3-a9fe-3ee1ff949549	09510acf-2e77-4ae0-8206-3b154b391821	6c81487e-5d73-47f0-89b9-618cc6f32232	2026-01-25 04:27:10.300782+00	\N
9aad6934-ae7e-40f9-b40d-0fd255acc4a1	09510acf-2e77-4ae0-8206-3b154b391821	06216b84-3695-41b5-8325-c2919f3d3eac	2026-01-25 04:27:10.300782+00	\N
60ef931a-a4aa-483b-bbd5-677189922d5e	09510acf-2e77-4ae0-8206-3b154b391821	1363aa55-bc45-4b65-bd40-21f80f37df30	2026-01-25 04:27:10.300782+00	\N
9433e38f-9eae-40fa-8efe-9d21f7f3ef73	09510acf-2e77-4ae0-8206-3b154b391821	f3a72737-6c39-4a7d-8a9b-8adeb6f01a04	2026-01-25 04:27:10.300782+00	\N
3493b925-3407-488c-85ce-12bdd7d3404a	09510acf-2e77-4ae0-8206-3b154b391821	f96f95ec-1502-4609-8802-80f775782ba0	2026-01-25 04:27:10.300782+00	\N
ebed4c8a-6cb0-43bd-8dda-0e0c61651a1a	09510acf-2e77-4ae0-8206-3b154b391821	d3e1ed4e-822e-49ba-83af-074b44ccf3fc	2026-01-25 04:27:10.300782+00	\N
c4042e81-bbf8-49e9-b4e8-3b586bf6ea4b	09510acf-2e77-4ae0-8206-3b154b391821	a307e6cb-53ec-415b-9289-38b7d692a83e	2026-01-25 04:27:10.300782+00	\N
be63c508-d8f5-4d13-af8c-e72cd2450f7d	09510acf-2e77-4ae0-8206-3b154b391821	c0ac7de9-27ff-4ce1-9929-582449fd7492	2026-01-25 04:27:10.300782+00	\N
0f954168-5bdf-4021-8ddf-6f362ad3f886	09510acf-2e77-4ae0-8206-3b154b391821	ac2f7497-dc35-4b3c-9c4c-1adb4b86e57f	2026-01-25 04:27:10.300782+00	\N
b3c0e4c5-dcf8-4489-a540-e1f5fb437e21	09510acf-2e77-4ae0-8206-3b154b391821	bbaae6c8-9351-49ef-a2af-3e5ef0b2be79	2026-01-25 04:27:10.300782+00	\N
9393367b-03ad-4af2-9d1b-010258cd548e	09510acf-2e77-4ae0-8206-3b154b391821	fbcb991b-20a2-41d9-80fb-aef865ef76e0	2026-01-25 04:27:10.300782+00	\N
6d824ba6-b7a3-4301-82d1-a5b3d2abcc74	09510acf-2e77-4ae0-8206-3b154b391821	0b224c6f-a9f8-4450-9481-87eec23b8b3a	2026-01-25 04:27:10.300782+00	\N
7a7a3832-6e81-459b-b13c-9ba232722575	09510acf-2e77-4ae0-8206-3b154b391821	55c8257e-f5a6-48fb-8265-59c08d695405	2026-01-25 04:27:10.300782+00	\N
28450a43-f98c-4d09-a995-f99a626ce4a4	09510acf-2e77-4ae0-8206-3b154b391821	96029482-e5e2-46b0-91d6-972ac8f176dd	2026-01-25 04:27:10.300782+00	\N
55f5eba9-9b8f-49a4-b780-9ef27fbcff59	09510acf-2e77-4ae0-8206-3b154b391821	35f807da-21b7-466f-85e2-5b958e10bf5a	2026-01-25 04:27:10.300782+00	\N
e0d7ccd7-fdbf-4eb7-8cc5-f1fe0b78c918	09510acf-2e77-4ae0-8206-3b154b391821	e3cb3d9c-22fc-4193-b45c-464c8b64fb9b	2026-01-25 04:27:10.300782+00	\N
75ff71cc-ac5d-4dec-96a7-1c447fea4174	09510acf-2e77-4ae0-8206-3b154b391821	fc6234f8-aa04-4825-9d8e-3e5801ff106f	2026-01-25 04:27:10.300782+00	\N
c4cfe837-52c1-44d8-9683-4106087f10db	09510acf-2e77-4ae0-8206-3b154b391821	947ea574-03e8-4854-82f4-13b1703b96de	2026-01-25 04:27:10.300782+00	\N
7da0755c-35f5-40f8-87bc-83016e925859	09510acf-2e77-4ae0-8206-3b154b391821	9ca2b5d6-562e-4025-8337-ab54e9735fa9	2026-01-25 04:27:10.300782+00	\N
2d75e98f-d440-442e-8a79-5ee9d700bfaf	09510acf-2e77-4ae0-8206-3b154b391821	e94e27d3-e568-4369-b691-05c5f8bf8c73	2026-01-25 04:27:10.300782+00	\N
8888c3d4-df13-44c5-9417-23c7e43211f5	09510acf-2e77-4ae0-8206-3b154b391821	7dc33bbb-9178-4f11-bbad-51e1a2986b29	2026-01-25 04:27:10.300782+00	\N
0e5282de-1721-4eea-aa96-3f68d29dfe48	09510acf-2e77-4ae0-8206-3b154b391821	83435a52-986b-4dad-b731-172ec37df140	2026-01-25 04:27:10.300782+00	\N
2cc90de3-321d-4925-8b5d-440e348e9742	09510acf-2e77-4ae0-8206-3b154b391821	2394c9c2-9f05-4a80-b895-283e07368142	2026-01-25 04:27:10.300782+00	\N
7ed85acb-8bc0-4f70-a6b9-5747a2315124	09510acf-2e77-4ae0-8206-3b154b391821	a3e9ceba-29dc-47ef-b4a3-3f9bcfe90320	2026-01-25 04:27:10.300782+00	\N
3dff740c-9f82-4e23-b581-bc62dabdc447	09510acf-2e77-4ae0-8206-3b154b391821	b080199d-2beb-48ff-b482-db0d63b6e5a8	2026-01-25 04:27:10.300782+00	\N
11c4b315-c3e5-4b1d-9431-fedfd9496eec	09510acf-2e77-4ae0-8206-3b154b391821	b0e453b3-cf2b-47b5-8555-ccefb83ef646	2026-01-25 04:27:10.300782+00	\N
c472b7f7-68e9-44f7-8c4a-562f64cded15	09510acf-2e77-4ae0-8206-3b154b391821	3f576e85-b27e-4c1b-8fb9-f362d670580c	2026-01-25 04:27:10.300782+00	\N
d094db20-6abb-4d24-8589-45cb21fcd2e3	09510acf-2e77-4ae0-8206-3b154b391821	31d0301e-b13d-4c69-9b3a-8a997f91ca9c	2026-01-25 04:27:10.300782+00	\N
10a4a2ba-6231-4909-9e79-f0c5908841e1	09510acf-2e77-4ae0-8206-3b154b391821	86658291-5002-4391-86c7-944d7801a197	2026-01-25 04:27:10.300782+00	\N
3febecbb-88c3-4459-a23f-46840b3a8855	09510acf-2e77-4ae0-8206-3b154b391821	5dea5965-1929-4ec0-9437-d363d6d8b172	2026-01-25 04:27:10.300782+00	\N
ad5486da-d5bd-4c97-b361-4e720cac5e7f	09510acf-2e77-4ae0-8206-3b154b391821	f7042b4c-1797-4e40-bb21-5ee222f1ec60	2026-01-25 04:27:10.300782+00	\N
e41428ed-912c-40cb-8c5d-197abdfe9d99	09510acf-2e77-4ae0-8206-3b154b391821	d0a1b4ce-067d-40a3-bb4c-cbd4b51c26d2	2026-01-25 04:27:10.300782+00	\N
0bf94a3c-b572-4b55-8840-9b72aadddf64	bae96556-98bd-472c-ac6d-7e53f43dd7ce	a3e9ceba-29dc-47ef-b4a3-3f9bcfe90320	2026-01-25 04:27:10.300782+00	\N
aa3f3960-ccd3-41c4-87ac-910f057a5644	bae96556-98bd-472c-ac6d-7e53f43dd7ce	b080199d-2beb-48ff-b482-db0d63b6e5a8	2026-01-25 04:27:10.300782+00	\N
e6a7cade-10f6-4bb2-ba5d-a60b3566027b	625453b9-d560-4cd8-9a90-c9897d039dc2	b0e453b3-cf2b-47b5-8555-ccefb83ef646	2026-01-25 04:27:10.300782+00	\N
67131bd2-2e4e-4a20-a647-ae026dc63c98	625453b9-d560-4cd8-9a90-c9897d039dc2	3f576e85-b27e-4c1b-8fb9-f362d670580c	2026-01-25 04:27:10.300782+00	\N
419655a2-3408-4ea0-9e42-0808e6ad7bc5	625453b9-d560-4cd8-9a90-c9897d039dc2	31d0301e-b13d-4c69-9b3a-8a997f91ca9c	2026-01-25 04:27:10.300782+00	\N
c03e4379-25e6-48a4-a50d-87063548efda	03437257-409d-4735-81b2-7fd0eea98672	86658291-5002-4391-86c7-944d7801a197	2026-01-25 04:27:10.300782+00	\N
21f27e94-2aa6-4f17-8aaa-7f907c639f4a	03437257-409d-4735-81b2-7fd0eea98672	5dea5965-1929-4ec0-9437-d363d6d8b172	2026-01-25 04:27:10.300782+00	\N
ed567675-ebef-4263-a9b5-3b5b8652d911	03437257-409d-4735-81b2-7fd0eea98672	f7042b4c-1797-4e40-bb21-5ee222f1ec60	2026-01-25 04:27:10.300782+00	\N
443d1af5-de1b-4e17-ba67-5f25d0d5c2ea	03437257-409d-4735-81b2-7fd0eea98672	d0a1b4ce-067d-40a3-bb4c-cbd4b51c26d2	2026-01-25 04:27:10.300782+00	\N
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.roles (id, name, description, hierarchy_level, created_at, updated_at) FROM stdin;
4fd4b3b3-dd51-443c-8836-d59af653d244	customer	Regular customer with basic permissions	0	2026-01-25 04:27:10.300782+00	2026-01-25 04:27:10.300782+00
625453b9-d560-4cd8-9a90-c9897d039dc2	support	Support staff with limited admin permissions	1	2026-01-25 04:27:10.300782+00	2026-01-25 04:27:10.300782+00
03437257-409d-4735-81b2-7fd0eea98672	corporate	Corporate account user	2	2026-01-25 04:27:10.300782+00	2026-01-25 04:27:10.300782+00
bae96556-98bd-472c-ac6d-7e53f43dd7ce	manager	Manager with elevated permissions	3	2026-01-25 04:27:10.300782+00	2026-01-25 04:27:10.300782+00
09510acf-2e77-4ae0-8206-3b154b391821	admin	Administrator with most permissions	4	2026-01-25 04:27:10.300782+00	2026-01-25 04:27:10.300782+00
fbc807d7-c739-4293-b50e-601cc19e1e41	super_admin	Super administrator with all permissions	5	2026-01-25 04:27:10.300782+00	2026-01-25 04:27:10.300782+00
73893c08-90f2-4c1b-8114-53057e1d388c	CUSTOMER	Regular customer	1	2026-01-26 17:57:25.045+00	2026-01-26 17:57:25.045+00
2baf70f1-5bb1-45bd-aeeb-a4cc409efc26	SUPPORT	Support staff	2	2026-01-26 17:57:25.069+00	2026-01-26 17:57:25.069+00
12f934fa-4dde-433d-808d-5cd75f451db8	MANAGER	Manager	3	2026-01-26 17:57:25.076+00	2026-01-26 17:57:25.076+00
4d0cd4a1-3c74-4782-a766-8020f0296e00	ADMIN	Administrator	4	2026-01-26 17:57:25.083+00	2026-01-26 17:57:25.083+00
c8e80340-054e-451c-a53f-104b188fe0ec	SUPER_ADMIN	Super administrator	5	2026-01-26 17:57:25.091+00	2026-01-26 17:57:25.091+00
\.


--
-- Data for Name: search_logs; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.search_logs (id, query, "userId", "resultsCount", "executionTime", filters, "ipAddress", "userAgent", "timestamp") FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.transactions (id, "orderId", "paymentMethod", amount, currency, status, "transactionId", "gatewayResponse", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: up_sell_products; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.up_sell_products (id, "productId", "relatedProductId", "displayOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_communication_preferences; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.user_communication_preferences (id, "userId", "preferredLanguage", "preferredTimezone", "preferredContactMethod", "marketingConsent", "dataSharingConsent", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_data_exports; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.user_data_exports (id, "userId", "exportToken", "dataTypes", format, "fileUrl", status, "requestedAt", "readyAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: user_notification_preferences; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.user_notification_preferences (id, "userId", "emailNotifications", "smsNotifications", "whatsappNotifications", "marketingCommunications", "newsletterSubscription", "notificationFrequency", "createdAt", "updatedAt") FROM stdin;
f2207ff5-1dc1-4909-aa93-bdcd8675abbc	2bdca14e-ac33-43ca-b98a-5117c8ecdeb9	t	f	f	f	f	immediate	2026-01-26 17:39:08.111	2026-01-26 17:39:08.111
\.


--
-- Data for Name: user_privacy_settings; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.user_privacy_settings (id, "userId", "profileVisibility", "showEmail", "showPhone", "showAddress", "allowSearchByEmail", "allowSearchByPhone", "twoFactorEnabled", "twoFactorSecret", "twoFactorMethod", "dataSharingEnabled", "createdAt", "updatedAt") FROM stdin;
cf291fd0-a3b1-48f0-9b72-cae43802c7a5	2bdca14e-ac33-43ca-b98a-5117c8ecdeb9	private	f	f	f	f	f	f	\N	\N	t	2026-01-26 17:39:08.153	2026-01-26 17:39:08.153
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.user_roles (id, user_id, role_id, assigned_by, assigned_at, expires_at, is_active) FROM stdin;
fea1ee4f-bd87-41f7-ab79-c276cc5ea2d1	69becdf9-5a0a-4b7d-a0b8-308fac2c4646	c8e80340-054e-451c-a53f-104b188fe0ec	69becdf9-5a0a-4b7d-a0b8-308fac2c4646	2026-01-26 17:57:54.438+00	\N	t
d72f020f-5337-49b9-b7a1-84e0529ab94f	ea59bf47-4b66-431d-ba63-a0a69437798f	4d0cd4a1-3c74-4782-a766-8020f0296e00	ea59bf47-4b66-431d-ba63-a0a69437798f	2026-01-26 17:57:54.524+00	\N	t
81a586c6-b031-41ec-8ff1-fcfb375e368c	90270928-766e-49dd-bee0-13ede11e9dad	4d0cd4a1-3c74-4782-a766-8020f0296e00	90270928-766e-49dd-bee0-13ede11e9dad	2026-01-26 17:57:54.6+00	\N	t
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.user_sessions (id, "userId", token, "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: user_social_accounts; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.user_social_accounts (id, "userId", provider, "providerId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.users (id, email, "emailVerified", phone, "phoneVerified", password, "firstName", "lastName", "dateOfBirth", gender, role, status, image, "createdAt", "updatedAt", "lastLoginAt", "preferredLanguage", "accountStatus", "deletionRequestedAt", "deletionReason", "deletedAt") FROM stdin;
eca45d70-6476-493b-8c85-eded2c2e4ccb	testuser3@example.com	\N	+8801712345680	\N	$2a$12$194HjN0O574A2eAjdFX7nugO4PDXnOXR01.As6sxorsMz0KOa34mi	Test	User	1990-01-01 00:00:00	male	customer	active	\N	2026-01-26 16:58:45.372	2026-01-26 16:58:45.372	\N	en	active	\N	\N	\N
90270928-766e-49dd-bee0-13ede11e9dad	admin2@smarttech.com	2026-01-26 17:57:54.593	\N	\N	$2a$10$GEfEun708c7SRlKWCI6x6e3wm2fYEyWCxEQ3Qf/shlDreqVMxdvQG	Admin	User 2	\N	\N	admin	active	\N	2026-01-26 17:57:54.595	2026-01-26 17:57:54.595	\N	en	active	\N	\N	\N
69becdf9-5a0a-4b7d-a0b8-308fac2c4646	test.superadmin@smarttech.com	2026-01-26 17:57:54.413	\N	\N	$2a$10$mWemQlMi28SxbY0TUjbKgeWy/Jf8fmOIKDXkkvksFOsPLvd5eidwm	Super	Admin	\N	\N	super_admin	active	\N	2026-01-26 17:57:54.416	2026-01-26 17:59:44.548	2026-01-26 17:59:44.546	en	active	\N	\N	\N
2bdca14e-ac33-43ca-b98a-5117c8ecdeb9	raselbepari88@gmail.com	\N	+8801914287530	\N	$2a$12$eP8GgqnYl05T3KbDKkumIe8NfWCvJPOpbpio8sjZ8h9zRFP3PdD/6	Rasel	Bepari	1988-12-15 00:00:00	MALE	customer	active	/uploads/profile-pictures/profile-2bdca14e-ac33-43ca-b98a-5117c8ecdeb9-1770005458759-144407459.jpg	2026-01-26 17:34:10.345	2026-02-02 04:10:58.777	2026-02-02 04:09:37.303	en	active	\N	\N	\N
ea59bf47-4b66-431d-ba63-a0a69437798f	admin@smarttech.com	2026-01-26 17:57:54.516	\N	\N	$2a$10$jYUeGb40mz.T2UVsy5L3JeVxkLmgT.tsnatOIXDKW321D0uO/.nEm	Admin	User	\N	\N	admin	active	\N	2026-01-26 17:57:54.518	2026-02-02 06:33:40.759	2026-02-02 06:33:40.756	en	active	\N	\N	\N
\.


--
-- Data for Name: variant_types; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.variant_types (id, name, "productId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: variant_values; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.variant_values (id, value, "variantTypeId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: wishlist_items; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.wishlist_items (id, "wishlistId", "productId", "addedAt") FROM stdin;
\.


--
-- Data for Name: wishlists; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

COPY public.wishlists (id, "userId", name, "isPrivate", "createdAt", "updatedAt", "expiresAt") FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: account_deletion_requests account_deletion_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.account_deletion_requests
    ADD CONSTRAINT account_deletion_requests_pkey PRIMARY KEY (id);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: corporate_accounts corporate_accounts_company_registration_number_key; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.corporate_accounts
    ADD CONSTRAINT corporate_accounts_company_registration_number_key UNIQUE (company_registration_number);


--
-- Name: corporate_accounts corporate_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.corporate_accounts
    ADD CONSTRAINT corporate_accounts_pkey PRIMARY KEY (id);


--
-- Name: corporate_accounts corporate_accounts_user_id_key; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.corporate_accounts
    ADD CONSTRAINT corporate_accounts_user_id_key UNIQUE (user_id);


--
-- Name: corporate_approvals corporate_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.corporate_approvals
    ADD CONSTRAINT corporate_approvals_pkey PRIMARY KEY (id);


--
-- Name: corporate_documents corporate_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.corporate_documents
    ADD CONSTRAINT corporate_documents_pkey PRIMARY KEY (id);


--
-- Name: corporate_pricing corporate_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.corporate_pricing
    ADD CONSTRAINT corporate_pricing_pkey PRIMARY KEY (id);


--
-- Name: corporate_users corporate_users_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.corporate_users
    ADD CONSTRAINT corporate_users_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: cross_sell_products cross_sell_products_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.cross_sell_products
    ADD CONSTRAINT cross_sell_products_pkey PRIMARY KEY (id);


--
-- Name: email_verification_tokens email_verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: password_history password_history_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.password_history
    ADD CONSTRAINT password_history_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: phone_otps phone_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.phone_otps
    ADD CONSTRAINT phone_otps_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- Name: product_specifications product_specifications_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.product_specifications
    ADD CONSTRAINT product_specifications_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: related_products related_products_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.related_products
    ADD CONSTRAINT related_products_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: role_escalation_requests role_escalation_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.role_escalation_requests
    ADD CONSTRAINT role_escalation_requests_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: search_logs search_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.search_logs
    ADD CONSTRAINT search_logs_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: corporate_pricing unique_corporate_product_pricing; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.corporate_pricing
    ADD CONSTRAINT unique_corporate_product_pricing UNIQUE (corporate_account_id, product_id);


--
-- Name: corporate_users unique_corporate_user; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.corporate_users
    ADD CONSTRAINT unique_corporate_user UNIQUE (corporate_account_id, user_id);


--
-- Name: role_permissions unique_role_permission; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id);


--
-- Name: user_roles unique_user_role_active; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT unique_user_role_active UNIQUE (user_id, role_id);


--
-- Name: up_sell_products up_sell_products_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.up_sell_products
    ADD CONSTRAINT up_sell_products_pkey PRIMARY KEY (id);


--
-- Name: user_communication_preferences user_communication_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.user_communication_preferences
    ADD CONSTRAINT user_communication_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_data_exports user_data_exports_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.user_data_exports
    ADD CONSTRAINT user_data_exports_pkey PRIMARY KEY (id);


--
-- Name: user_notification_preferences user_notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_privacy_settings user_privacy_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.user_privacy_settings
    ADD CONSTRAINT user_privacy_settings_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_social_accounts user_social_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.user_social_accounts
    ADD CONSTRAINT user_social_accounts_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: variant_types variant_types_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.variant_types
    ADD CONSTRAINT variant_types_pkey PRIMARY KEY (id);


--
-- Name: variant_values variant_values_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.variant_values
    ADD CONSTRAINT variant_values_pkey PRIMARY KEY (id);


--
-- Name: wishlist_items wishlist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_pkey PRIMARY KEY (id);


--
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);


--
-- Name: account_deletion_requests_deletionToken_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX "account_deletion_requests_deletionToken_key" ON public.account_deletion_requests USING btree ("deletionToken");


--
-- Name: brands_isFeatured_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "brands_isFeatured_idx" ON public.brands USING btree ("isFeatured");


--
-- Name: brands_slug_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX brands_slug_key ON public.brands USING btree (slug);


--
-- Name: brands_status_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX brands_status_idx ON public.brands USING btree (status);


--
-- Name: carts_userId_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX "carts_userId_key" ON public.carts USING btree ("userId");


--
-- Name: categories_parentId_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "categories_parentId_idx" ON public.categories USING btree ("parentId");


--
-- Name: categories_slug_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);


--
-- Name: categories_status_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX categories_status_idx ON public.categories USING btree (status);


--
-- Name: coupons_code_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX coupons_code_key ON public.coupons USING btree (code);


--
-- Name: cross_sell_products_productId_relatedProductId_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX "cross_sell_products_productId_relatedProductId_key" ON public.cross_sell_products USING btree ("productId", "relatedProductId");


--
-- Name: email_verification_tokens_token_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX email_verification_tokens_token_key ON public.email_verification_tokens USING btree (token);


--
-- Name: idx_brands_is_featured; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_brands_is_featured ON public.brands USING btree ("isFeatured");


--
-- Name: idx_brands_status; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_brands_status ON public.brands USING btree (status);


--
-- Name: idx_categories_parent_id; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_categories_parent_id ON public.categories USING btree ("parentId");


--
-- Name: idx_categories_status; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_categories_status ON public.categories USING btree (status);


--
-- Name: idx_permissions_action; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_permissions_action ON public.permissions USING btree (action);


--
-- Name: idx_permissions_resource; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_permissions_resource ON public.permissions USING btree (resource);


--
-- Name: idx_permissions_resource_action; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_permissions_resource_action ON public.permissions USING btree (resource, action);


--
-- Name: idx_product_categories_category_id; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_product_categories_category_id ON public.product_categories USING btree ("categoryId");


--
-- Name: idx_product_categories_is_primary; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_product_categories_is_primary ON public.product_categories USING btree ("isPrimary");


--
-- Name: idx_product_categories_product_id; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_product_categories_product_id ON public.product_categories USING btree ("productId");


--
-- Name: idx_product_images_display_order; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_product_images_display_order ON public.product_images USING btree (product_id, display_order);


--
-- Name: idx_product_images_is_primary; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_product_images_is_primary ON public.product_images USING btree (product_id, is_primary);


--
-- Name: idx_product_images_processing_status; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_product_images_processing_status ON public.product_images USING btree (processing_status);


--
-- Name: idx_product_images_product_id; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_product_images_product_id ON public.product_images USING btree (product_id);


--
-- Name: idx_products_brand_id; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_products_brand_id ON public.products USING btree ("brandId");


--
-- Name: idx_products_created_at; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_products_created_at ON public.products USING btree ("createdAt");


--
-- Name: idx_products_regular_price; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_products_regular_price ON public.products USING btree ("regularPrice");


--
-- Name: idx_products_sale_price; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_products_sale_price ON public.products USING btree ("salePrice");


--
-- Name: idx_products_status; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_products_status ON public.products USING btree (status);


--
-- Name: idx_products_status_created_at; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_products_status_created_at ON public.products USING btree (status, "createdAt" DESC);


--
-- Name: idx_products_status_visibility; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_products_status_visibility ON public.products USING btree (status, visibility);


--
-- Name: idx_products_updated_at; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_products_updated_at ON public.products USING btree ("updatedAt");


--
-- Name: idx_products_visibility; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_products_visibility ON public.products USING btree (visibility);


--
-- Name: idx_role_escalation_created_at; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_role_escalation_created_at ON public.role_escalation_requests USING btree (created_at);


--
-- Name: idx_role_escalation_current_role_id; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_role_escalation_current_role_id ON public.role_escalation_requests USING btree (current_role_id);


--
-- Name: idx_role_escalation_requested_role_id; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_role_escalation_requested_role_id ON public.role_escalation_requests USING btree (requested_role_id);


--
-- Name: idx_role_escalation_status; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_role_escalation_status ON public.role_escalation_requests USING btree (status);


--
-- Name: idx_role_escalation_user_id; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_role_escalation_user_id ON public.role_escalation_requests USING btree (user_id);


--
-- Name: idx_role_permissions_granted_at; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_role_permissions_granted_at ON public.role_permissions USING btree (granted_at);


--
-- Name: idx_role_permissions_permission_id; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions USING btree (permission_id);


--
-- Name: idx_role_permissions_role_id; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_role_permissions_role_id ON public.role_permissions USING btree (role_id);


--
-- Name: idx_roles_hierarchy_level; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_roles_hierarchy_level ON public.roles USING btree (hierarchy_level);


--
-- Name: idx_user_roles_assigned_at; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_user_roles_assigned_at ON public.user_roles USING btree (assigned_at);


--
-- Name: idx_user_roles_expires_at; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_user_roles_expires_at ON public.user_roles USING btree (expires_at);


--
-- Name: idx_user_roles_is_active; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_user_roles_is_active ON public.user_roles USING btree (is_active);


--
-- Name: idx_user_roles_role_id; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_user_roles_role_id ON public.user_roles USING btree (role_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: orders_orderNumber_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX "orders_orderNumber_key" ON public.orders USING btree ("orderNumber");


--
-- Name: product_categories_categoryId_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "product_categories_categoryId_idx" ON public.product_categories USING btree ("categoryId");


--
-- Name: product_categories_isPrimary_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "product_categories_isPrimary_idx" ON public.product_categories USING btree ("isPrimary");


--
-- Name: product_categories_productId_categoryId_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX "product_categories_productId_categoryId_key" ON public.product_categories USING btree ("productId", "categoryId");


--
-- Name: product_categories_productId_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "product_categories_productId_idx" ON public.product_categories USING btree ("productId");


--
-- Name: products_brandId_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "products_brandId_idx" ON public.products USING btree ("brandId");


--
-- Name: products_createdAt_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "products_createdAt_idx" ON public.products USING btree ("createdAt");


--
-- Name: products_regularPrice_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "products_regularPrice_idx" ON public.products USING btree ("regularPrice");


--
-- Name: products_salePrice_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "products_salePrice_idx" ON public.products USING btree ("salePrice");


--
-- Name: products_sku_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX products_sku_key ON public.products USING btree (sku);


--
-- Name: products_slug_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX products_slug_key ON public.products USING btree (slug);


--
-- Name: products_status_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX products_status_idx ON public.products USING btree (status);


--
-- Name: products_updatedAt_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "products_updatedAt_idx" ON public.products USING btree ("updatedAt");


--
-- Name: products_visibility_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX products_visibility_idx ON public.products USING btree (visibility);


--
-- Name: related_products_productId_relatedProductId_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX "related_products_productId_relatedProductId_key" ON public.related_products USING btree ("productId", "relatedProductId");


--
-- Name: search_logs_query_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX search_logs_query_idx ON public.search_logs USING btree (query);


--
-- Name: search_logs_timestamp_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX search_logs_timestamp_idx ON public.search_logs USING btree ("timestamp");


--
-- Name: search_logs_userId_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "search_logs_userId_idx" ON public.search_logs USING btree ("userId");


--
-- Name: unique_default_address_per_user; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX unique_default_address_per_user ON public.addresses USING btree ("userId") WHERE ("isDefault" = true);


--
-- Name: up_sell_products_productId_relatedProductId_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX "up_sell_products_productId_relatedProductId_key" ON public.up_sell_products USING btree ("productId", "relatedProductId");


--
-- Name: user_communication_preferences_userId_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX "user_communication_preferences_userId_key" ON public.user_communication_preferences USING btree ("userId");


--
-- Name: user_data_exports_exportToken_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX "user_data_exports_exportToken_key" ON public.user_data_exports USING btree ("exportToken");


--
-- Name: user_notification_preferences_userId_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX "user_notification_preferences_userId_key" ON public.user_notification_preferences USING btree ("userId");


--
-- Name: user_privacy_settings_userId_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX "user_privacy_settings_userId_key" ON public.user_privacy_settings USING btree ("userId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_phone_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX users_phone_key ON public.users USING btree (phone);


--
-- Name: wishlists_userId_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX "wishlists_userId_key" ON public.wishlists USING btree ("userId");


--
-- Name: account_deletion_requests account_deletion_requests_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.account_deletion_requests
    ADD CONSTRAINT "account_deletion_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: addresses addresses_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cart_items cart_items_cartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES public.carts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cart_items cart_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cart_items cart_items_variantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: carts carts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT "carts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: categories categories_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cross_sell_products cross_sell_products_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.cross_sell_products
    ADD CONSTRAINT "cross_sell_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cross_sell_products cross_sell_products_relatedProductId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.cross_sell_products
    ADD CONSTRAINT "cross_sell_products_relatedProductId_fkey" FOREIGN KEY ("relatedProductId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: email_verification_tokens email_verification_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: corporate_accounts fk_corporate_accounts_manager; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.corporate_accounts
    ADD CONSTRAINT fk_corporate_accounts_manager FOREIGN KEY (account_manager_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: corporate_accounts fk_corporate_accounts_user; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.corporate_accounts
    ADD CONSTRAINT fk_corporate_accounts_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: corporate_approvals fk_corporate_approvals_account; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.corporate_approvals
    ADD CONSTRAINT fk_corporate_approvals_account FOREIGN KEY (corporate_account_id) REFERENCES public.corporate_accounts(id) ON DELETE CASCADE;


--
-- Name: corporate_documents fk_corporate_documents_account; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.corporate_documents
    ADD CONSTRAINT fk_corporate_documents_account FOREIGN KEY (corporate_account_id) REFERENCES public.corporate_accounts(id) ON DELETE CASCADE;


--
-- Name: corporate_pricing fk_corporate_pricing_account; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.corporate_pricing
    ADD CONSTRAINT fk_corporate_pricing_account FOREIGN KEY (corporate_account_id) REFERENCES public.corporate_accounts(id) ON DELETE CASCADE;


--
-- Name: corporate_pricing fk_corporate_pricing_product; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.corporate_pricing
    ADD CONSTRAINT fk_corporate_pricing_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: corporate_users fk_corporate_users_account; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.corporate_users
    ADD CONSTRAINT fk_corporate_users_account FOREIGN KEY (corporate_account_id) REFERENCES public.corporate_accounts(id) ON DELETE CASCADE;


--
-- Name: corporate_users fk_corporate_users_user; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.corporate_users
    ADD CONSTRAINT fk_corporate_users_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: orders fk_orders_corporate_account; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_orders_corporate_account FOREIGN KEY (corporate_account_id) REFERENCES public.corporate_accounts(id);


--
-- Name: role_escalation_requests fk_role_escalation_current_role; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.role_escalation_requests
    ADD CONSTRAINT fk_role_escalation_current_role FOREIGN KEY (current_role_id) REFERENCES public.roles(id);


--
-- Name: role_escalation_requests fk_role_escalation_requested_role; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.role_escalation_requests
    ADD CONSTRAINT fk_role_escalation_requested_role FOREIGN KEY (requested_role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: role_escalation_requests fk_role_escalation_user; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.role_escalation_requests
    ADD CONSTRAINT fk_role_escalation_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: role_permissions fk_role_permissions_permission; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions fk_role_permissions_role; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles fk_user_roles_role; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles fk_user_roles_user; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_items order_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_items order_items_variantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_addressId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES public.addresses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: password_history password_history_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.password_history
    ADD CONSTRAINT "password_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: phone_otps phone_otps_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.phone_otps
    ADD CONSTRAINT "phone_otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_categories product_categories_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT "product_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_categories product_categories_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT "product_categories_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_images product_images_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_specifications product_specifications_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.product_specifications
    ADD CONSTRAINT "product_specifications_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: product_variants product_variants_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: products products_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: related_products related_products_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.related_products
    ADD CONSTRAINT "related_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: related_products related_products_relatedProductId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.related_products
    ADD CONSTRAINT "related_products_relatedProductId_fkey" FOREIGN KEY ("relatedProductId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reviews reviews_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: search_logs search_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.search_logs
    ADD CONSTRAINT "search_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transactions transactions_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: up_sell_products up_sell_products_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.up_sell_products
    ADD CONSTRAINT "up_sell_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: up_sell_products up_sell_products_relatedProductId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.up_sell_products
    ADD CONSTRAINT "up_sell_products_relatedProductId_fkey" FOREIGN KEY ("relatedProductId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_communication_preferences user_communication_preferences_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.user_communication_preferences
    ADD CONSTRAINT "user_communication_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_data_exports user_data_exports_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.user_data_exports
    ADD CONSTRAINT "user_data_exports_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_notification_preferences user_notification_preferences_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT "user_notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_privacy_settings user_privacy_settings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.user_privacy_settings
    ADD CONSTRAINT "user_privacy_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_social_accounts user_social_accounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.user_social_accounts
    ADD CONSTRAINT "user_social_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: variant_types variant_types_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.variant_types
    ADD CONSTRAINT "variant_types_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: variant_values variant_values_variantTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.variant_values
    ADD CONSTRAINT "variant_values_variantTypeId_fkey" FOREIGN KEY ("variantTypeId") REFERENCES public.variant_types(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wishlist_items wishlist_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT "wishlist_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: wishlist_items wishlist_items_wishlistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT "wishlist_items_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES public.wishlists(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: wishlists wishlists_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT "wishlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO smart_dev;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: smart_dev
--

ALTER DEFAULT PRIVILEGES FOR ROLE smart_dev IN SCHEMA public GRANT ALL ON SEQUENCES  TO smart_dev;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: smart_dev
--

ALTER DEFAULT PRIVILEGES FOR ROLE smart_dev IN SCHEMA public GRANT ALL ON TABLES  TO smart_dev;


--
-- PostgreSQL database dump complete
--

\unrestrict Q5be8eouL1JminjUkyNqjejKwDJrTNEoejM0Y9GxZax0EhfKUfl2tVhK5ZRzaGz

