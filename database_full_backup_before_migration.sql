--
-- PostgreSQL database dump
--

\restrict qDG1MWKXCygufvge5z14X5Sy1VDEqmZkCxqfO2ccPHerg6PLCPElJO7zu4kRoEJ

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
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


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
-- Name: BrandStatus; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."BrandStatus" AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE public."BrandStatus" OWNER TO smart_dev;

--
-- Name: CartStatus; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."CartStatus" AS ENUM (
    'active',
    'abandoned',
    'converted',
    'expired'
);


ALTER TYPE public."CartStatus" OWNER TO smart_dev;

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
-- Name: SocialProvider; Type: TYPE; Schema: public; Owner: smart_dev
--

CREATE TYPE public."SocialProvider" AS ENUM (
    'google',
    'facebook'
);


ALTER TYPE public."SocialProvider" OWNER TO smart_dev;

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
-- Name: get_user_permissions(uuid); Type: FUNCTION; Schema: public; Owner: smart_dev
--

CREATE FUNCTION public.get_user_permissions(p_user_id uuid) RETURNS TABLE(id uuid, name character varying, resource character varying, action character varying, description text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
    SELECT p.id, p.name, p.resource, p.action, p.description
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN roles r ON rp.role_id = r.id
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = p_user_id
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ORDER BY r.hierarchy_level DESC, p.name;
END;
$$;


ALTER FUNCTION public.get_user_permissions(p_user_id uuid) OWNER TO smart_dev;

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
  NEW.updated_at = CURRENT_TIMESTAMP;
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

--
-- Name: user_has_permission(uuid, character varying); Type: FUNCTION; Schema: public; Owner: smart_dev
--

CREATE FUNCTION public.user_has_permission(p_user_id uuid, p_permission_name character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN roles r ON rp.role_id = r.id
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = p_user_id
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      AND p.name = p_permission_name
  );
END;
$$;


ALTER FUNCTION public.user_has_permission(p_user_id uuid, p_permission_name character varying) OWNER TO smart_dev;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: CartAuditLog; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public."CartAuditLog" (
    id text NOT NULL,
    "cartId" text NOT NULL,
    action text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text,
    "previousValue" jsonb,
    "newValue" jsonb,
    "performedBy" text NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CartAuditLog" OWNER TO smart_dev;

--
-- Name: TABLE "CartAuditLog"; Type: COMMENT; Schema: public; Owner: smart_dev
--

COMMENT ON TABLE public."CartAuditLog" IS 'Audit log of all cart modifications';


--
-- Name: CartNote; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public."CartNote" (
    id text NOT NULL,
    "cartId" text NOT NULL,
    "userId" text NOT NULL,
    content text NOT NULL,
    "isPrivate" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CartNote" OWNER TO smart_dev;

--
-- Name: TABLE "CartNote"; Type: COMMENT; Schema: public; Owner: smart_dev
--

COMMENT ON TABLE public."CartNote" IS 'Notes added to carts by admins';


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
-- Name: cart_analytics; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.cart_analytics (
    id text NOT NULL,
    cart_id text NOT NULL,
    events jsonb DEFAULT '{}'::jsonb NOT NULL,
    conversion_funnel jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.cart_analytics OWNER TO smart_dev;

--
-- Name: cart_cleanup_audit; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.cart_cleanup_audit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying(100) NOT NULL,
    cart_id character varying(255),
    user_id character varying(255),
    session_id character varying(255),
    details jsonb DEFAULT '{}'::jsonb,
    "timestamp" timestamp with time zone DEFAULT now()
);


ALTER TABLE public.cart_cleanup_audit OWNER TO smart_dev;

--
-- Name: cart_events; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.cart_events (
    id text NOT NULL,
    cart_id text NOT NULL,
    user_id text,
    event_type character varying(50) NOT NULL,
    product_id text,
    quantity integer,
    price numeric(12,2),
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.cart_events OWNER TO smart_dev;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.cart_items (
    id text NOT NULL,
    cart_id text NOT NULL,
    product_id text NOT NULL,
    variant_id text,
    quantity integer NOT NULL,
    price numeric(12,2) NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    added_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.cart_items OWNER TO smart_dev;

--
-- Name: cart_share_tokens; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.cart_share_tokens (
    id text NOT NULL,
    cart_id text NOT NULL,
    token text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.cart_share_tokens OWNER TO smart_dev;

--
-- Name: carts; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.carts (
    id text NOT NULL,
    user_id text,
    session_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    expires_at timestamp(3) without time zone,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    tax numeric(12,2) DEFAULT 0 NOT NULL,
    shipping_cost numeric(12,2) DEFAULT 0 NOT NULL,
    discount numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    status public."CartStatus" DEFAULT 'active'::public."CartStatus" NOT NULL
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
-- Name: comparison_history; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.comparison_history (
    id text NOT NULL,
    "userId" text NOT NULL,
    "comparisonId" text NOT NULL,
    action text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.comparison_history OWNER TO smart_dev;

--
-- Name: comparison_share_tokens; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.comparison_share_tokens (
    id text DEFAULT gen_random_uuid() NOT NULL,
    comparison_id text NOT NULL,
    token text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.comparison_share_tokens OWNER TO smart_dev;

--
-- Name: TABLE comparison_share_tokens; Type: COMMENT; Schema: public; Owner: smart_dev
--

COMMENT ON TABLE public.comparison_share_tokens IS 'Stores share tokens for product comparisons to enable sharing functionality';


--
-- Name: COLUMN comparison_share_tokens.token; Type: COMMENT; Schema: public; Owner: smart_dev
--

COMMENT ON COLUMN public.comparison_share_tokens.token IS 'Unique token used to access shared comparison';


--
-- Name: COLUMN comparison_share_tokens.expires_at; Type: COMMENT; Schema: public; Owner: smart_dev
--

COMMENT ON COLUMN public.comparison_share_tokens.expires_at IS 'Token expiration date - should match comparison expiration';


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
-- Name: product_comparison_items; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.product_comparison_items (
    id text NOT NULL,
    "comparisonId" text NOT NULL,
    "productId" text NOT NULL,
    "addedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text
);


ALTER TABLE public.product_comparison_items OWNER TO smart_dev;

--
-- Name: product_comparisons; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.product_comparisons (
    id text NOT NULL,
    "userId" text,
    "sessionId" text,
    name text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "expiresAt" timestamp(3) without time zone
);


ALTER TABLE public.product_comparisons OWNER TO smart_dev;

--
-- Name: product_images; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.product_images (
    id text NOT NULL,
    product_id text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    original_url text NOT NULL,
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
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
-- Name: search_analytics; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.search_analytics (
    id text NOT NULL,
    "userId" text,
    "sessionId" text NOT NULL,
    query text NOT NULL,
    "resultsCount" integer DEFAULT 0 NOT NULL,
    "responseTime" integer DEFAULT 0 NOT NULL,
    "clickedResults" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "filtersApplied" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "sortBy" text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "deviceType" text,
    "conversionType" text,
    "productId" text
);


ALTER TABLE public.search_analytics OWNER TO smart_dev;

--
-- Name: search_click_tracking; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.search_click_tracking (
    id text NOT NULL,
    "searchAnalyticsId" text NOT NULL,
    "productId" text NOT NULL,
    "position" integer NOT NULL,
    "clickedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dwellTime" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.search_click_tracking OWNER TO smart_dev;

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
-- Name: TABLE search_logs; Type: COMMENT; Schema: public; Owner: smart_dev
--

COMMENT ON TABLE public.search_logs IS 'Stores search query logs for analytics and performance monitoring';


--
-- Name: COLUMN search_logs.id; Type: COMMENT; Schema: public; Owner: smart_dev
--

COMMENT ON COLUMN public.search_logs.id IS 'Unique identifier for each search log entry';


--
-- Name: COLUMN search_logs.query; Type: COMMENT; Schema: public; Owner: smart_dev
--

COMMENT ON COLUMN public.search_logs.query IS 'The search query string entered by the user';


--
-- Name: COLUMN search_logs.filters; Type: COMMENT; Schema: public; Owner: smart_dev
--

COMMENT ON COLUMN public.search_logs.filters IS 'JSONB object storing applied search filters (category, price range, etc.)';


--
-- Name: COLUMN search_logs."timestamp"; Type: COMMENT; Schema: public; Owner: smart_dev
--

COMMENT ON COLUMN public.search_logs."timestamp" IS 'Timestamp when the search was performed';


--
-- Name: search_optimization_experiments; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.search_optimization_experiments (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "algorithmVariant" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    metrics jsonb DEFAULT '{}'::jsonb NOT NULL,
    "sampleSize" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.search_optimization_experiments OWNER TO smart_dev;

--
-- Name: search_performance_metrics; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.search_performance_metrics (
    id text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "queryCount" integer DEFAULT 0 NOT NULL,
    "avgResponseTime" integer DEFAULT 0 NOT NULL,
    "p95ResponseTime" integer DEFAULT 0 NOT NULL,
    "p99ResponseTime" integer DEFAULT 0 NOT NULL,
    "cacheHitRate" double precision DEFAULT 0 NOT NULL,
    "zeroResultQueries" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.search_performance_metrics OWNER TO smart_dev;

--
-- Name: search_recommendations; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.search_recommendations (
    id text NOT NULL,
    "userId" text NOT NULL,
    "productId" text NOT NULL,
    "recommendationType" text NOT NULL,
    score double precision DEFAULT 0 NOT NULL,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    clicked boolean DEFAULT false NOT NULL,
    converted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.search_recommendations OWNER TO smart_dev;

--
-- Name: search_trending; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.search_trending (
    id text NOT NULL,
    query text NOT NULL,
    "searchCount" integer DEFAULT 0 NOT NULL,
    "trendScore" double precision DEFAULT 0 NOT NULL,
    "lastSearchedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    category text,
    "isTrending" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.search_trending OWNER TO smart_dev;

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
    "updatedAt" timestamp(3) without time zone NOT NULL,
    profile_visibility public."ProfileVisibility" DEFAULT 'public'::public."ProfileVisibility"
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
-- Name: user_search_preferences; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.user_search_preferences (
    id text NOT NULL,
    "userId" text NOT NULL,
    "preferredCategories" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "preferredBrands" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "priceRangeMin" integer,
    "priceRangeMax" integer,
    "searchHistory" jsonb DEFAULT '[]'::jsonb NOT NULL
);


ALTER TABLE public.user_search_preferences OWNER TO smart_dev;

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
-- Name: wishlist_analytics; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.wishlist_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "wishlistId" uuid NOT NULL,
    "eventType" character varying(50) NOT NULL,
    "userId" uuid,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT valid_event_type CHECK ((("eventType")::text = ANY ((ARRAY['view'::character varying, 'add_item'::character varying, 'remove_item'::character varying, 'share'::character varying, 'export'::character varying])::text[])))
);


ALTER TABLE public.wishlist_analytics OWNER TO smart_dev;

--
-- Name: TABLE wishlist_analytics; Type: COMMENT; Schema: public; Owner: smart_dev
--

COMMENT ON TABLE public.wishlist_analytics IS 'Tracks wishlist events for analytics and insights';


--
-- Name: COLUMN wishlist_analytics.id; Type: COMMENT; Schema: public; Owner: smart_dev
--

COMMENT ON COLUMN public.wishlist_analytics.id IS 'Unique identifier for analytics event';


--
-- Name: COLUMN wishlist_analytics."wishlistId"; Type: COMMENT; Schema: public; Owner: smart_dev
--

COMMENT ON COLUMN public.wishlist_analytics."wishlistId" IS 'Reference to wishlists_new table (CASCADE DELETE)';


--
-- Name: COLUMN wishlist_analytics."eventType"; Type: COMMENT; Schema: public; Owner: smart_dev
--

COMMENT ON COLUMN public.wishlist_analytics."eventType" IS 'Type of event: view, add_item, remove_item, share, export';


--
-- Name: COLUMN wishlist_analytics."userId"; Type: COMMENT; Schema: public; Owner: smart_dev
--

COMMENT ON COLUMN public.wishlist_analytics."userId" IS 'Reference to users table (SET NULL on delete)';


--
-- Name: COLUMN wishlist_analytics.metadata; Type: COMMENT; Schema: public; Owner: smart_dev
--

COMMENT ON COLUMN public.wishlist_analytics.metadata IS 'Additional event data stored as JSONB';


--
-- Name: COLUMN wishlist_analytics."createdAt"; Type: COMMENT; Schema: public; Owner: smart_dev
--

COMMENT ON COLUMN public.wishlist_analytics."createdAt" IS 'Timestamp when event occurred';


--
-- Name: wishlist_items; Type: TABLE; Schema: public; Owner: smart_dev
--

CREATE TABLE public.wishlist_items (
    id uuid NOT NULL,
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
    name character varying(255),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "isDefault" boolean DEFAULT false,
    "isPublic" boolean DEFAULT false,
    "shareToken" character varying(255)
);


ALTER TABLE public.wishlists OWNER TO smart_dev;

--
-- Data for Name: CartAuditLog; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: CartNote; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('aee503dd-4d20-4fbe-ab0f-a6a3fe0b4994', '41952e1bf2229f834f0fb074a596e6f2be2f183032a04de4039e40eb6edb8635', '2026-01-25 04:27:09.850272+00', '20260105062541_init', NULL, NULL, '2026-01-25 04:27:09.07119+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('2434a7c0-141e-412d-a725-fa5f1a0e1838', 'd6c82381ed999570f8ff8144c2daa1b6d6196f55987557e2334de62866a4c4a5', '2026-01-25 04:27:09.876452+00', '20260108_add_preferred_language', NULL, NULL, '2026-01-25 04:27:09.856008+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('ec0fda0b-2f6b-4fcb-a06a-2db758f496bf', '61798f9a51bbac0b9afd7106abc4305190b3a0de9b5e0baa5717861157cbd541', '2026-01-25 04:27:09.918353+00', '20260109_add_single_default_address_constraint', NULL, NULL, '2026-01-25 04:27:09.882656+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('487bdde3-9930-4448-af8e-a27eb5c7e8d1', '4e9f42a13247da0863e63d80896037810735e43907bc73f85d7b96b0fcea0f48', '2026-01-25 04:27:10.100188+00', '20260111_add_user_preferences_and_account_management', NULL, NULL, '2026-01-25 04:27:09.92376+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('ea75c999-83a2-4a27-91e6-7ba036c7cbce', '0c01e2da49c2f70fcffd2a5c86050b561516f0abcaab5d0d4373130105a25df7', '2026-01-25 04:27:10.162275+00', '20260113_add_friends_only_to_profile_visibility', NULL, NULL, '2026-01-25 04:27:10.105343+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('51a0404d-b5e3-4e93-bbc4-90a1b9383c4f', 'b4866cf877cae22ee3d141c47585321ea5776ae4138cfe73f9053b39ac9bb58b', '2026-01-25 04:27:10.287615+00', '20260113_rename_tables_to_snake_case', NULL, NULL, '2026-01-25 04:27:10.167533+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('4e47eb88-1ba4-47f8-a717-d60deb3d3bf0', '213d483d20100c1d0163c78b45e1b56fd5618841a2bd5d40b43b9a1f8239ac10', '2026-01-25 04:27:10.837579+00', '20260119_add_missing_rbac_and_corporate_tables', NULL, NULL, '2026-01-25 04:27:10.292846+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('f584071e-844b-4710-bfd7-64244ebabd20', 'fb24db3e1026a86a49083aca4380329feb855e531de44e13206f338568f1ff39', '2026-01-25 04:27:10.86646+00', '20260120_drop_legacy_permission_table', NULL, NULL, '2026-01-25 04:27:10.846675+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('328eac1b-01af-425f-9886-347060121373', '9225516784865b8c68300d1669a0310bdbf0c77a445d2b1698b4483e74cbead5', '2026-01-25 04:27:10.89081+00', 'add_account_deletion_columns', NULL, NULL, '2026-01-25 04:27:10.871918+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('27c040d0-28cc-4f29-8051-7f3b75d4d3a4', '37f50894498befefe02ae6a73e7bba5ada23c849aad995ec32de55cc44aa1f5d', NULL, '20260126190700_remove_categoryid_from_products', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20260126190700_remove_categoryid_from_products

Database error code: 42703

Database error:
ERROR: column p.categoryId does not exist

Position:
[1m  6[0m -- This ensures no data is lost when we remove the categoryId column
[1m  7[0m INSERT INTO product_categories (id, "productId", "categoryId", "isPrimary", "createdAt", "updatedAt")
[1m  8[0m SELECT 
[1m  9[0m   gen_random_uuid() as id,
[1m 10[0m   p.id as "productId",
[1m 11[1;31m   p."categoryId" as "categoryId",[0m

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42703), message: "column p.categoryId does not exist", detail: None, hint: None, position: Some(Original(624)), where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("parse_relation.c"), line: Some(3665), routine: Some("errorMissingColumn") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20260126190700_remove_categoryid_from_products"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20260126190700_remove_categoryid_from_products"
             at schema-engine/core/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:226', '2026-01-31 21:22:19.785752+00', '2026-01-26 21:03:01.803339+00', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('53abc60b-b629-4707-ad2f-83df6b5ef815', '37f50894498befefe02ae6a73e7bba5ada23c849aad995ec32de55cc44aa1f5d', '2026-01-31 21:22:19.794277+00', '20260126190700_remove_categoryid_from_products', '', NULL, '2026-01-31 21:22:19.794277+00', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('ce673c08-8026-4a31-a55a-a8aab00ddf92', 'd7571251aad6e2232bd0b0a7fc09999cd65807cef7b4ecd3228602045f9976d1', '2026-01-31 21:22:29.885031+00', '20260126193000_add_performance_indexes', NULL, NULL, '2026-01-31 21:22:29.712231+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('477715e3-7a50-4033-8036-3b3bea2d4249', '4485497a8849375bd709bf9a4a504da35b2b167ac64992551fb12f0c149022fd', '2026-02-01 05:29:46.804336+00', '20260201051300_fix_product_images_schema', NULL, NULL, '2026-02-01 05:29:46.628784+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('6694fb75-bbdf-4cea-8732-67e930234304', 'add_product_comparison_system_checksum', '2026-02-03 13:22:57.339409+00', '20260203130000_add_product_comparison_system', NULL, NULL, '2026-02-03 13:22:57.339409+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('0acd31d8-bb9b-4241-a3f5-65f6a5067266', 'edbde54bf44cc6463ea9588276fc305d5a2868a03a9ae2bd7630bf3ff94e48e7', '2026-02-03 18:56:23.394114+00', '20260203163000_add_comparison_share_tokens', '', NULL, '2026-02-03 18:56:23.394114+00', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('36ae063a-0263-48b4-85c2-5c7dfa719d77', '5dcd02ff38da7f3079f3ccbd3bf8db0d5dd28689ac987a6d6a451122bbdd3465', NULL, '20260201054000_fix_product_images_snake_case_columns', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20260201054000_fix_product_images_snake_case_columns

Database error code: 42703

Database error:
ERROR: column "productId" does not exist

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42703), message: "column \"productId\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(3556), routine: Some("renameatt_internal") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20260201054000_fix_product_images_snake_case_columns"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20260201054000_fix_product_images_snake_case_columns"
             at schema-engine/core/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:226', '2026-02-04 17:35:54.398768+00', '2026-02-03 15:53:24.869612+00', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('37442a5b-433b-4408-833b-315ad6728af0', '5dcd02ff38da7f3079f3ccbd3bf8db0d5dd28689ac987a6d6a451122bbdd3465', '2026-02-04 17:35:54.415303+00', '20260201054000_fix_product_images_snake_case_columns', '', NULL, '2026-02-04 17:35:54.415303+00', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('ac859fdf-06b8-4ef1-b295-28d45a5889c3', 'ec9b2bc3eb5e49de789f6df5f22ee2c168eba29ac36a87f7c870878653d97065', '2026-02-04 17:40:44.915051+00', '20260201054000_rename_product_id_to_snake_case', NULL, NULL, '2026-02-04 17:40:44.897814+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('ee5432fc-2d70-425c-8bd9-f55ce8a3925b', 'db5dce9676b644d6ae9d2a8f6f9f3f8268736e0ad66b3251a0ff795e7137ac36', '2026-02-04 17:40:44.930402+00', '20260201_fix_schema_mismatches', NULL, NULL, '2026-02-04 17:40:44.919418+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('14c0cd6d-8b01-455e-bbc2-339cfdab6786', '0ffa42bb36b0f86c439ff7fc08077e90d61e48f82c653ad7cdb3bbad56c3ed8d', '2026-02-04 17:40:45.760956+00', '20260204100000_add_search_analytics_and_optimization', NULL, NULL, '2026-02-04 17:40:44.937062+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('ec43a196-e797-40a1-bbf3-9a6cc31c8bb7', 'f5af881749706f15cbd4643bc7aa358e70c1a0f7399e5c84a90fc8051c89c924', NULL, '20260207120000_add_shopping_cart_tables', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20260207120000_add_shopping_cart_tables

Database error code: 42703

Database error:
ERROR: column "userId" does not exist

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42703), message: "column \"userId\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(3556), routine: Some("renameatt_internal") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20260207120000_add_shopping_cart_tables"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20260207120000_add_shopping_cart_tables"
             at schema-engine/core/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:226', '2026-02-08 05:00:05.747719+00', '2026-02-07 14:36:01.988659+00', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('ddc6d71c-508a-4efb-9c5e-54ccb9965af9', 'f5af881749706f15cbd4643bc7aa358e70c1a0f7399e5c84a90fc8051c89c924', '2026-02-08 05:00:05.755101+00', '20260207120000_add_shopping_cart_tables', '', NULL, '2026-02-08 05:00:05.755101+00', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('c1bcad02-8719-4ba7-adf8-bf5b10b2884e', '9a834eaf8822a99acf810f5f70eb694ee296c59343f809ce0cb5dac219330fe3', NULL, '20260207140000_add_cart_event_table', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20260207140000_add_cart_event_table

Database error code: 42P16

Database error:
ERROR: multiple primary keys for table "cart_events" are not allowed

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P16), message: "multiple primary keys for table \"cart_events\" are not allowed", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("index.c"), line: Some(222), routine: Some("index_check_primary_key") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20260207140000_add_cart_event_table"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20260207140000_add_cart_event_table"
             at schema-engine/core/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:226', '2026-02-08 05:03:37.174243+00', '2026-02-08 05:02:01.258737+00', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('39cef41e-2a5d-4962-ac5e-38753469a251', '767134af622b076af3bd06bb5aeaac4fa5d2d393cc4faf996dff4ad5bd06aea5', NULL, '20260207130000_add_cart_status_field', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20260207130000_add_cart_status_field

Database error code: 42710

Database error:
ERROR: type "CartStatus" already exists

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42710), message: "type \"CartStatus\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("typecmds.c"), line: Some(1167), routine: Some("DefineEnum") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20260207130000_add_cart_status_field"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20260207130000_add_cart_status_field"
             at schema-engine/core/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:226', '2026-02-08 05:01:49.946544+00', '2026-02-08 05:01:06.625118+00', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('3b53ab82-1283-4467-87b7-d6cacf7038b0', '767134af622b076af3bd06bb5aeaac4fa5d2d393cc4faf996dff4ad5bd06aea5', '2026-02-08 05:01:49.952322+00', '20260207130000_add_cart_status_field', '', NULL, '2026-02-08 05:01:49.952322+00', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('4f1b619d-893d-4762-afba-95e1ef00b16d', '367f0e2ed7ff9bfad40fdff1175e672220902584f59e2fb877744fc95c156d52', '2026-02-10 06:00:22.61061+00', '20260210_create_rbac_database_functions', NULL, NULL, '2026-02-10 06:00:22.55832+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('78a7e991-2ee3-4b34-876b-6159d51f1aec', '9a834eaf8822a99acf810f5f70eb694ee296c59343f809ce0cb5dac219330fe3', '2026-02-08 05:03:37.180948+00', '20260207140000_add_cart_event_table', '', NULL, '2026-02-08 05:03:37.180948+00', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('2c82f51a-c115-4889-b658-a70dac53009b', 'dcb28af71936f692c2e2fd13fb8ffc2fe29ae6d24cfd71c681c0469482b2feb5', '2026-02-08 05:04:14.976058+00', '20260207150000_add_cart_share_token_table', '', NULL, '2026-02-08 05:04:14.976058+00', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('6e00b401-dc8b-48f0-8388-aa993fca630b', '6eac2ae84fa3863b054faed186c36c6b4277c7b3696806d678e4b91f7cd2eb8a', '2026-02-09 19:02:47.555907+00', '20260209_add_cart_permissions', NULL, NULL, '2026-02-09 19:02:47.519517+00', 1);


--
-- Data for Name: account_deletion_requests; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.addresses (id, "userId", type, "firstName", "lastName", phone, address, "addressLine2", city, district, division, upazila, "postalCode", "isDefault") VALUES ('7fb0a0a7-2b9b-4f85-9a8a-b9f78de6e0df', '2bdca14e-ac33-43ca-b98a-5117c8ecdeb9', 'shipping', 'Mohammad', 'Bepari', '01914287530', 'Jahir Smart Tower', '205/1 & 205/1/A, West Kafrul, Begum Rokeya Sharani, Taltola', 'Dahaka', '301', 'dhaka', '30106', '1207', false);
INSERT INTO public.addresses (id, "userId", type, "firstName", "lastName", phone, address, "addressLine2", city, district, division, upazila, "postalCode", "isDefault") VALUES ('e5cc2d06-90ca-4fbb-bed6-ff6f965e3ed2', '2bdca14e-ac33-43ca-b98a-5117c8ecdeb9', 'billing', 'Mohammad', 'Bepari', '01914287532', 'Jahir Smart Tower', '205/1 & 205/1/A, West Kafrul, Begum Rokeya Sharani, Taltola', 'Dahaka', '301', 'dhaka', '30101', '1207', true);


--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('bab5b14e-eb39-4971-921b-b7356a0c8be4', 'Bulk Brand 1', 'bulk-brand-1-1769497128829-e0mif9xw9', NULL, NULL, NULL, NULL, '2026-01-27 06:58:48.831', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 1', 'active', '2026-01-27 06:58:48.831', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('278155cd-781b-4cbb-8c5f-fb563b36f864', 'Bulk Brand 2', 'bulk-brand-2-1769497128829-vzff7gwap', NULL, NULL, NULL, NULL, '2026-01-27 06:58:48.831', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 2', 'active', '2026-01-27 06:58:48.831', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('d3d304d3-a7a8-476b-b10b-c26e7fc57124', 'New Brand', 'new-brand-1769496931130-rav75er8w', NULL, NULL, NULL, NULL, '2026-01-27 06:55:31.131', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-01-27 06:55:31.131', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('c75c9e48-efe8-49d0-95ba-1e35c3a8bbe8', 'Bulk Brand 1', 'bulk-brand-1-1769497259702-di5w4enf2', NULL, NULL, NULL, NULL, '2026-01-27 07:00:59.704', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 1', 'active', '2026-01-27 07:00:59.704', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('49984843-c8d2-4b78-9041-bd5361592ff6', 'Bulk Brand 2', 'bulk-brand-2-1769497259702-o1db10vg0', NULL, NULL, NULL, NULL, '2026-01-27 07:00:59.704', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 2', 'active', '2026-01-27 07:00:59.704', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('e0df900d-c5b2-4e2c-97bc-8f1bf2e6dae0', 'Bulk Brand 1', 'bulk-brand-1-1769497534683-02llk12jk', NULL, NULL, NULL, NULL, '2026-01-27 07:05:34.685', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 1', 'active', '2026-01-27 07:05:34.685', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('602332bf-d6b9-48ce-89a3-7c9dc3db5e3d', 'Bulk Brand 2', 'bulk-brand-2-1769497534683-2qqprv1by', NULL, NULL, NULL, NULL, '2026-01-27 07:05:34.685', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 2', 'active', '2026-01-27 07:05:34.685', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('8d218ec8-6224-4134-82c3-612ee20f3425', 'Bulk Brand 1', 'bulk-brand-1-1769497865519-wz4yr7tdr', NULL, NULL, NULL, NULL, '2026-01-27 07:11:05.52', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 1', 'active', '2026-01-27 07:11:05.52', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('82e327a3-0fef-417d-a9ce-09f49d337a4a', 'Bulk Brand 2', 'bulk-brand-2-1769497865519-1ohhi6oqn', NULL, NULL, NULL, NULL, '2026-01-27 07:11:05.52', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 2', 'active', '2026-01-27 07:11:05.52', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('63d2d28b-20df-41f1-8095-6f86ab3e6221', 'Bulk Brand 1', 'bulk-brand-1-1769497982342-dqrw21hgy', NULL, NULL, NULL, NULL, '2026-01-27 07:13:02.344', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 1', 'active', '2026-01-27 07:13:02.344', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('9cda8b86-ebb8-4662-bdca-b6289bbc7141', 'Bulk Brand 2', 'bulk-brand-2-1769497982342-t4ih3e75s', NULL, NULL, NULL, NULL, '2026-01-27 07:13:02.344', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 2', 'active', '2026-01-27 07:13:02.344', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('a7883bec-eb1d-47d0-8a7e-526a4931076a', 'Bulk Brand 1', 'bulk-brand-1-1769499410142-tfga77tst', NULL, NULL, NULL, NULL, '2026-01-27 07:36:50.144', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 1', 'active', '2026-01-27 07:36:50.144', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('62bba69a-d77f-49f3-9a65-20b95a458564', 'Bulk Brand 2', 'bulk-brand-2-1769499410142-5seigns0k', NULL, NULL, NULL, NULL, '2026-01-27 07:36:50.144', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 2', 'active', '2026-01-27 07:36:50.144', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('e9b11dfe-330e-4c53-bc13-f3d1852ef572', 'Bulk Brand 1', 'bulk-brand-1-1769496953560-ueykyk3m7', NULL, NULL, NULL, NULL, '2026-01-27 06:55:53.561', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 1', 'active', '2026-01-27 06:55:53.561', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('5e01982d-a367-4dde-ad15-ace45e6fff4e', 'Bulk Brand 2', 'bulk-brand-2-1769496953560-j6ortxu2c', NULL, NULL, NULL, NULL, '2026-01-27 06:55:53.561', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 2', 'active', '2026-01-27 06:55:53.561', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('0b79da56-4443-4b63-ba0e-e87a1b1f86b7', 'New Brand', 'new-brand-1769497129608-ieokm8ja0', NULL, NULL, NULL, NULL, '2026-01-27 06:58:49.61', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-01-27 06:58:49.61', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('e7466179-6e21-45c2-b3e7-157eb542cd7d', 'New Brand', 'new-brand-1769497260403-q70qqfpxx', NULL, NULL, NULL, NULL, '2026-01-27 07:01:00.405', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-01-27 07:01:00.405', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('33abd699-1bd1-4678-bb26-2902bc505261', 'New Brand', 'new-brand-1769497535443-zjtm6bxxh', NULL, NULL, NULL, NULL, '2026-01-27 07:05:35.445', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-01-27 07:05:35.445', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('cefc5db7-e9dd-46d2-bb6a-051a797f5988', 'New Brand', 'new-brand-1769497868239-sho2bhdya', NULL, NULL, NULL, NULL, '2026-01-27 07:11:08.24', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-01-27 07:11:08.24', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('31924b47-3eea-4e8a-bb17-feba223bc904', 'New Brand', 'new-brand-1769497983165-1pzt2cd44', NULL, NULL, NULL, NULL, '2026-01-27 07:13:03.167', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-01-27 07:13:03.167', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('6aa58400-002c-44e2-acae-d179468313ad', 'New Brand', 'new-brand-1769499412778-eurtu2xsf', NULL, NULL, NULL, NULL, '2026-01-27 07:36:52.78', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-01-27 07:36:52.78', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('d0e4febc-c9df-485d-96aa-e25425c0dcb9', 'New Brand', 'new-brand-1769496967827-ftjv01aos', NULL, NULL, NULL, NULL, '2026-01-27 06:56:07.828', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-01-27 06:56:07.828', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('35204bf1-840f-4925-82c4-92698a64329b', 'Bulk Brand 1', 'bulk-brand-1-1769497884205-38qju3v99', NULL, NULL, NULL, NULL, '2026-01-27 07:11:24.207', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 1', 'active', '2026-01-27 07:11:24.207', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('5b115081-b7f2-4227-ae82-1edcbddd8dfb', 'Bulk Brand 2', 'bulk-brand-2-1769497884205-8fw2mzao8', NULL, NULL, NULL, NULL, '2026-01-27 07:11:24.207', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 2', 'active', '2026-01-27 07:11:24.207', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('108cb4d0-9137-4df9-bbe9-bdddee8517a1', 'Bulk Brand 1', 'bulk-brand-1-1769497757076-6b8yr8lzw', NULL, NULL, NULL, NULL, '2026-01-27 07:09:17.078', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 1', 'active', '2026-01-27 07:09:17.078', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('f612c1be-551b-4c49-a35b-7b761fe3f27d', 'Bulk Brand 2', 'bulk-brand-2-1769497757076-n9prowvau', NULL, NULL, NULL, NULL, '2026-01-27 07:09:17.078', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 2', 'active', '2026-01-27 07:09:17.078', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('ab4dbdf9-debc-4d74-85b4-c587dc8db08f', 'New Brand', 'new-brand-1769497885151-iyz6e5f7h', NULL, NULL, NULL, NULL, '2026-01-27 07:11:25.153', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-01-27 07:11:25.153', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('ad7b24e6-f9c2-477d-b3a3-b265b8cae834', 'New Brand', 'new-brand-1769497757715-zvs35r87k', NULL, NULL, NULL, NULL, '2026-01-27 07:09:17.716', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-01-27 07:09:17.716', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('9e41b5b0-84dd-4f3d-889d-70efc48b37f4', 'HP', 'hp', 'HP', NULL, 'test@gmail.com', '01914287530', '2026-02-01 03:48:12.735', 0, true, NULL, 'HP', 'HP', 'HP', 'HP', 'HP', 'active', '2026-02-01 03:48:12.735', 'https://hp.com');
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('ce1555a3-cd63-4396-817f-7952e7f3c8ae', 'Dell', 'dell', 'Dell', NULL, 'test@gmail.com', '01914287530', '2026-02-01 03:48:57.857', 0, true, NULL, 'Dell', 'Dell', 'Dell', 'Dell', 'Dell', 'active', '2026-02-01 03:48:57.857', 'https://dell.com');
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('2bd4edf3-0311-485b-ae4d-610957330475', 'Lenovo', 'lenovo', 'Lenovo', NULL, 'test@gmail.com', '01914287530', '2026-02-01 03:49:39.189', 0, true, NULL, 'Lenovo', 'Lenovo', 'Lenovo', 'Lenovo', 'Lenovo', 'active', '2026-02-01 03:49:39.189', 'https://lenovo.com');
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('10594c15-4df7-4acd-b2c4-771f35a584df', 'Apple', 'apple', 'Apple', NULL, 'test@gmail.com', '01914287530', '2026-02-01 03:51:00.793', 0, true, NULL, 'Apple', 'Apple', 'Apple', 'Apple', 'Apple', 'active', '2026-02-01 03:51:00.793', 'https://apple.com');
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('14907a1d-2cac-421f-864e-603f51751fbb', 'Acer', 'acer', 'Acer', '', 'test@gmail.com', '01914287530', '2026-02-01 03:50:20.221', 0, true, 'http://localhost:3001/uploads/brands/brand-1770459032722-637104035.jpg', 'Acer', 'Acer', 'Acer', 'Acer', 'Acer', 'active', '2026-02-07 10:10:42.547', 'https://acer.com');
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('9bb2dccd-3116-43be-93f5-c0b7eca3ec29', 'Constraint Test Brand', 'constraint-test-brand-1770141231307', NULL, NULL, NULL, NULL, '2026-02-03 17:53:51.31', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-03 17:53:51.31', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('dba00eb6-34d6-4d84-99f6-8f70c8237c12', 'Slug Test Brand', 'slug-test-brand-1770141231710', NULL, NULL, NULL, NULL, '2026-02-03 17:53:51.712', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-03 17:53:51.712', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('5a211a37-85b7-4b32-9d36-ac0d1c92bcf1', 'Bulk Brand 1', 'bulk-brand-1-1770025257958-q79iskvvq', NULL, NULL, NULL, NULL, '2026-02-02 09:40:57.963', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 1', 'active', '2026-02-02 09:40:57.963', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('647c381f-a4ba-42eb-a8ff-f36730c1e2f4', 'Bulk Brand 2', 'bulk-brand-2-1770025257958-r5554skuz', NULL, NULL, NULL, NULL, '2026-02-02 09:40:57.963', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 2', 'active', '2026-02-02 09:40:57.963', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('d8eefd16-6c64-422b-a88d-50d4ddf2a9a9', 'Bulk Brand 1', 'bulk-brand-1-1770735742485-a9i9fmpej', NULL, NULL, NULL, NULL, '2026-02-10 15:02:22.489', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 1', 'active', '2026-02-10 15:02:22.489', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('1d2bdd8f-f404-4f6b-8414-8532247d72b9', 'New Brand', 'new-brand-1770025260372-qgm3a58an', NULL, NULL, NULL, NULL, '2026-02-02 09:41:00.373', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-02 09:41:00.373', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('91e91160-abef-4c47-b133-9c5420ab7384', 'Constraint Test Brand', 'constraint-test-brand-1770138065396', NULL, NULL, NULL, NULL, '2026-02-03 17:01:05.397', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-03 17:01:05.397', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('b877c7fb-13ee-40dc-b228-e95c9e91c5b1', 'Slug Test Brand', 'slug-test-brand-1770138069536', NULL, NULL, NULL, NULL, '2026-02-03 17:01:09.537', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-03 17:01:09.537', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('9746031e-6664-4da5-ab8d-26b6dbe21301', 'Bulk Brand 1', 'bulk-brand-1-1770138071258-mcuamaqwn', NULL, NULL, NULL, NULL, '2026-02-03 17:01:11.266', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 1', 'active', '2026-02-03 17:01:11.266', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('7f035524-4e16-4c43-a786-e482b9b263bd', 'Bulk Brand 2', 'bulk-brand-2-1770138071258-5i8pabx7a', NULL, NULL, NULL, NULL, '2026-02-03 17:01:11.266', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 2', 'active', '2026-02-03 17:01:11.266', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('60945e8d-2b2f-4ceb-a3ce-6c3da4eea2af', 'Brand Slug Test 1', 'brand-slug-test-1770138081714', NULL, NULL, NULL, NULL, '2026-02-03 17:01:21.716', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-03 17:01:21.716', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('de3d3a61-72f0-492e-b521-dd2d63eee6d9', 'New Brand', 'new-brand-1770138104045-waep3owb0', NULL, NULL, NULL, NULL, '2026-02-03 17:01:44.046', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-03 17:01:44.046', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('929446a6-436c-4420-b02c-65845963f5dd', 'Constraint Test Brand', 'constraint-test-brand-1770735732401', NULL, NULL, NULL, NULL, '2026-02-10 15:02:12.404', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-10 15:02:12.404', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('2f3d5dc1-026f-4128-b2fd-e4e21c1084d8', 'Slug Test Brand', 'slug-test-brand-1770735733200', NULL, NULL, NULL, NULL, '2026-02-10 15:02:13.201', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-10 15:02:13.201', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('63d2d36e-701f-4e12-90a0-dc67a69f6ffd', 'Bulk Brand 2', 'bulk-brand-2-1770735742486-7cr36jlje', NULL, NULL, NULL, NULL, '2026-02-10 15:02:22.489', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 2', 'active', '2026-02-10 15:02:22.489', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('2f299a7b-1d20-43ad-bdcf-3ce01e1f8132', 'New Brand', 'new-brand-1770735756782-ic49o1c30', NULL, NULL, NULL, NULL, '2026-02-10 15:02:36.785', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-10 15:02:36.785', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('b41a8355-4c07-43d9-8815-62251be82ecc', 'Constraint Test Brand', 'constraint-test-brand-1770228988422', NULL, NULL, NULL, NULL, '2026-02-04 18:16:28.425', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-04 18:16:28.425', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('d9971464-15a9-4ccd-a2ef-692812ea167e', 'Slug Test Brand', 'slug-test-brand-1770228988795', NULL, NULL, NULL, NULL, '2026-02-04 18:16:28.797', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-04 18:16:28.797', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('ec5375ac-a701-4b07-b651-b80e5918cd72', 'Bulk Brand 1', 'bulk-brand-1-1770229054324-6m7122k7h', NULL, NULL, NULL, NULL, '2026-02-04 18:17:34.325', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 1', 'active', '2026-02-04 18:17:34.325', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('8efb0533-f4c8-4876-8658-711502e213f0', 'Bulk Brand 2', 'bulk-brand-2-1770229054324-3y3suwsoy', NULL, NULL, NULL, NULL, '2026-02-04 18:17:34.325', 0, false, NULL, NULL, NULL, NULL, NULL, 'Bulk Brand 2', 'active', '2026-02-04 18:17:34.325', NULL);
INSERT INTO public.brands (id, name, slug, description, address, "contactEmail", "contactPhone", "createdAt", "featuredOrder", "isFeatured", "logoUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt", "websiteUrl") VALUES ('2bbf09e5-5fca-4ad4-a891-4378f723cfda', 'New Brand', 'new-brand-1770229055669-za0z6x0jr', NULL, NULL, NULL, NULL, '2026-02-04 18:17:35.67', 0, false, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-04 18:17:35.67', NULL);


--
-- Data for Name: cart_analytics; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('f33cf3d5-83d8-4e9c-be27-fee227f1c898', 'b0412420-3075-4c7d-ae50-1e5abe2d073b', '{}', '{}', '2026-02-08 18:20:47.014', '2026-02-08 18:20:47.014');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('233c4eea-c3c1-4666-a217-5acd1a23a145', 'b89cd182-30a4-422c-8b91-bcf1954c7149', '{"item_added_1771008807923": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:53:27.923Z"}}', '{}', '2026-02-13 18:53:27.834', '2026-02-13 18:53:27.925');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('2eda67e7-e528-4d9a-8c1c-2eba3447fd99', 'a2c68ef9-2c14-4ac1-bcd9-fe1e79b67795', '{}', '{}', '2026-02-10 19:06:32.818', '2026-02-10 19:06:32.818');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('766811df-7ae8-4f45-8bd8-0bab2a5eae7b', 'a0527266-6d5f-4e7f-90cc-fc85f917e683', '{}', '{}', '2026-02-10 19:20:43.454', '2026-02-10 19:20:43.454');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('eafc00cd-1850-480b-8da0-ad531a2aaa77', 'fcef2bc6-ce4e-4562-82b5-d9daa79a3343', '{"item_added_1771008808558": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:53:28.558Z"}}', '{}', '2026-02-13 18:53:28.518', '2026-02-13 18:53:28.56');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('124ea27a-774e-4b7b-a585-1de8278c34f3', 'fcfd7475-42cf-42d3-a1a1-2885f62992c9', '{"item_added_1771008809138": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:53:29.138Z"}}', '{}', '2026-02-13 18:53:29.111', '2026-02-13 18:53:29.139');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('628263eb-2d66-4eb6-af0b-681a17eca5c7', 'f584c9be-6f3b-4b37-9b8b-c7e6345bb9ee', '{"item_added_1771008809844": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:53:29.844Z"}}', '{}', '2026-02-13 18:53:29.804', '2026-02-13 18:53:29.845');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('2c742156-2cc2-4e47-a866-b2478c1bd9d0', '1047b4aa-ff70-4919-8218-2baa34306772', '{"item_added_1771008809910": {"data": {"price": 850, "quantity": 3, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:53:29.910Z"}}', '{}', '2026-02-13 18:53:29.872', '2026-02-13 18:53:29.911');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('39abab79-20d9-4a12-a175-5a1462011299', '6e743874-7d90-4315-8493-719353029146', '{"item_added_1771008810508": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:53:30.508Z"}}', '{}', '2026-02-13 18:53:30.475', '2026-02-13 18:53:30.509');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('5acc96b0-75a7-4a4b-940f-394254519599', '66b83aea-e058-41fd-84ea-4607721be792', '{"item_added_1771008904592": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:55:04.592Z"}}', '{}', '2026-02-13 18:55:04.54', '2026-02-13 18:55:04.594');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('27a206cc-04a2-4a3e-9fa8-7c96041b2bbb', '6c1c800f-b0e0-4c96-a007-6d610edfade2', '{"item_added_1771008905266": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:55:05.266Z"}}', '{}', '2026-02-13 18:55:05.205', '2026-02-13 18:55:05.267');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('79327816-4dc8-4c41-b8d0-a4422368b7a1', '14629daa-28dd-4924-a6f0-0d92a5b0fed6', '{"item_added_1771008905855": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:55:05.855Z"}}', '{}', '2026-02-13 18:55:05.825', '2026-02-13 18:55:05.856');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('2242ac49-116d-4a82-bb3c-72148bdae09c', '7a4a5cab-4300-47f4-8b5d-ef811ba9d10b', '{"item_added_1771008906562": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:55:06.562Z"}}', '{}', '2026-02-13 18:55:06.528', '2026-02-13 18:55:06.563');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('f29a97a4-4be3-4578-86d0-febcb3df9fad', 'd180e419-8e8e-495d-ae0e-8f1b9c34d04f', '{"item_added_1771008906618": {"data": {"price": 850, "quantity": 3, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:55:06.618Z"}}', '{}', '2026-02-13 18:55:06.579', '2026-02-13 18:55:06.619');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('5f0a7dc6-5032-422d-8cc5-00a88ebecbb5', '9912c77b-809b-4d8e-854a-77bb5877fdc3', '{"item_added_1771008907241": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:55:07.241Z"}}', '{}', '2026-02-13 18:55:07.2', '2026-02-13 18:55:07.242');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('88bb4536-a5db-4a9c-a334-b04033e283c8', '4e702325-1123-4600-a21c-af167e150ec4', '{"item_added_1771008950934": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:55:50.934Z"}}', '{}', '2026-02-13 18:55:50.885', '2026-02-13 18:55:50.935');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('36f10401-ae4b-4749-b51c-6599e2812ad6', '85d55404-387b-46ec-839f-6e19b856db85', '{"item_added_1771008951613": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:55:51.613Z"}}', '{}', '2026-02-13 18:55:51.536', '2026-02-13 18:55:51.615');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('8fa0137b-2d6d-4fed-8538-1d154641f6b6', 'ce62b747-7c36-4cc5-968d-ea8f9b8e9084', '{"item_added_1771008952225": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:55:52.225Z"}}', '{}', '2026-02-13 18:55:52.171', '2026-02-13 18:55:52.227');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('99ef3a86-789d-41a1-93e2-27c807a0f4dc', '04f7e88c-93c5-41b5-b8da-f28979634540', '{"item_added_1771008952979": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:55:52.979Z"}}', '{}', '2026-02-13 18:55:52.903', '2026-02-13 18:55:52.981');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('e8f8fc5a-cfb3-486d-ab41-db612e17a5a6', '2d88d243-f873-4477-b772-396e0caf8403', '{"item_added_1771008953055": {"data": {"price": 850, "quantity": 3, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:55:53.055Z"}}', '{}', '2026-02-13 18:55:53.011', '2026-02-13 18:55:53.056');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('ccd71cca-80ec-42df-9171-483be3e6767c', '658dda60-618a-411a-9b36-48938237f142', '{"item_added_1771008953663": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:55:53.663Z"}}', '{}', '2026-02-13 18:55:53.634', '2026-02-13 18:55:53.664');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('0eb0be12-0d03-4a9c-af68-c772e408ba93', 'b579d190-9eb5-4689-a2a5-1e33e3380779', '{"item_added_1771009074108": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:57:54.108Z"}}', '{}', '2026-02-13 18:57:54.064', '2026-02-13 18:57:54.109');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('566c10d5-7625-4132-91c9-755ccfa5cc15', '494b71b8-8916-48e5-ba8d-07fb5ab98a0e', '{"item_added_1771009074700": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:57:54.700Z"}}', '{}', '2026-02-13 18:57:54.674', '2026-02-13 18:57:54.701');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('fe89fea3-7175-48e4-8497-a6c64c562ad7', '2967017d-7704-4cfd-b53f-a70142d6dab5', '{"item_added_1771009075288": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:57:55.288Z"}}', '{}', '2026-02-13 18:57:55.245', '2026-02-13 18:57:55.289');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('e57c30cf-5bd9-41bb-9203-c128a619e5f7', '0d9bf0d2-7bb2-4b9a-a402-eded3ba746c9', '{"item_added_1771009076018": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:57:56.018Z"}}', '{}', '2026-02-13 18:57:55.987', '2026-02-13 18:57:56.019');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('1b03d91a-a102-483b-9aae-073c12dc0cf7', 'f82465ac-0a11-44aa-a716-50859a76a8d8', '{"item_added_1771009076074": {"data": {"price": 850, "quantity": 3, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:57:56.074Z"}}', '{}', '2026-02-13 18:57:56.04', '2026-02-13 18:57:56.075');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('c48a2c66-b996-4524-b8df-abe7a2228afc', '42988576-0bde-4771-b50e-af1d9ec51b4d', '{"item_added_1771009076694": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:57:56.694Z"}}', '{}', '2026-02-13 18:57:56.647', '2026-02-13 18:57:56.695');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('a6f91d56-7976-4f49-8a15-7ef13400dde4', 'd17f1daa-ae08-47a6-b512-140ccb11254c', '{"item_added_1771009162711": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:59:22.711Z"}}', '{}', '2026-02-13 18:59:22.635', '2026-02-13 18:59:22.713');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('1bb5093b-25bd-4c3c-adb5-7c4a9ec2c3b3', 'b2bf2413-db63-4c2f-b647-6599ba3c5175', '{"item_added_1771009163371": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:59:23.371Z"}}', '{}', '2026-02-13 18:59:23.312', '2026-02-13 18:59:23.373');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('e9448d06-af47-4568-94c1-715600d20c75', '4f6a37b5-6668-4c98-b93e-a5e4bbfeb063', '{"item_added_1771009164670": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:59:24.670Z"}}', '{}', '2026-02-13 18:59:24.224', '2026-02-13 18:59:24.672');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('3c6cb2c3-75c2-4390-9e25-e68738cb0bed', 'bfb0d39c-6427-45a5-a512-d574eb8f477b', '{"item_added_1771009165441": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:59:25.441Z"}}', '{}', '2026-02-13 18:59:25.41', '2026-02-13 18:59:25.443');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('cab47c22-413a-41a8-9c83-bc4f12c3d64d', 'dc83beb7-dea2-4ffd-86aa-be7fde046784', '{"item_added_1771009165492": {"data": {"price": 850, "quantity": 3, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:59:25.492Z"}}', '{}', '2026-02-13 18:59:25.462', '2026-02-13 18:59:25.493');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('5614c83b-5fd5-4fe0-a3f7-344274d86756', '0035d8b0-3fa1-47ed-9d11-266ef2d4c20e', '{"item_added_1771009166097": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:59:26.097Z"}}', '{}', '2026-02-13 18:59:26.064', '2026-02-13 18:59:26.098');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('99ade58c-abfc-4c29-930c-85d3bfd31603', '6b5e3b8a-66a9-438a-8e30-a96b4385045e', '{"item_added_1771009255945": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T19:00:55.945Z"}}', '{}', '2026-02-13 19:00:55.907', '2026-02-13 19:00:55.946');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('a924be94-4765-43ea-99a1-ce0336cb0f38', 'a69259da-b4f2-4fbf-9dc1-e0d030245311', '{"item_added_1771009256549": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T19:00:56.549Z"}}', '{}', '2026-02-13 19:00:56.518', '2026-02-13 19:00:56.55');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('ebda29d5-3d88-4e81-b5f2-b89e3029e96c', '47b8cfbc-2a61-4dd6-9919-ba0fbf353baa', '{"item_added_1771009257114": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T19:00:57.114Z"}}', '{}', '2026-02-13 19:00:57.091', '2026-02-13 19:00:57.115');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('cd5fe279-fa23-44f9-a8fb-ad15be491a31', 'f66ce221-aa2a-47b1-8760-0eef66ab0d12', '{"item_added_1771009257835": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T19:00:57.835Z"}}', '{}', '2026-02-13 19:00:57.798', '2026-02-13 19:00:57.837');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('3980fb20-9d78-4991-bffd-55f3bc3dff9b', '7a04469e-9102-4a69-859a-fee90e03af11', '{"item_added_1771009257918": {"data": {"price": 850, "quantity": 3, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T19:00:57.918Z"}}', '{}', '2026-02-13 19:00:57.864', '2026-02-13 19:00:57.919');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('9e6e3395-105a-4b0d-9acf-2b8cbd533b20', '9be5e98a-3e70-4533-ac53-4df652fb67e6', '{"item_added_1771009258542": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T19:00:58.542Z"}}', '{}', '2026-02-13 19:00:58.496', '2026-02-13 19:00:58.543');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('f6307a29-74f7-4fdb-b336-aac482527c91', 'a1759545-ecf1-4aaf-a8b7-d972a211e82b', '{"item_added_1771009343317": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T19:02:23.317Z"}}', '{}', '2026-02-13 19:02:23.223', '2026-02-13 19:02:23.319');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('a5b42b14-f90a-4dcf-b132-d0eea7038206', 'af6ca6a1-1293-4ece-9fba-0c3016cd4d12', '{"item_added_1771009343957": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T19:02:23.957Z"}}', '{}', '2026-02-13 19:02:23.909', '2026-02-13 19:02:23.959');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('bf3cd308-c480-4635-b8a4-21a4fa5b2421', '54bccabd-a276-4373-84cd-1e2a0cc6222f', '{"item_added_1771009344531": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T19:02:24.531Z"}}', '{}', '2026-02-13 19:02:24.5', '2026-02-13 19:02:24.532');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('1de69475-060b-4ac5-b633-b227d7f1dc21', 'f2f3fa14-2d8d-485b-b159-ef6539b62ddd', '{"item_added_1771009345271": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T19:02:25.271Z"}}', '{}', '2026-02-13 19:02:25.223', '2026-02-13 19:02:25.272');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('07647764-ec1a-432c-94a0-50a21dded034', '5b6be18b-c188-483a-9704-c29f7c28ff7c', '{"item_added_1771009345855": {"data": {"price": 850, "quantity": 3, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T19:02:25.855Z"}}', '{}', '2026-02-13 19:02:25.809', '2026-02-13 19:02:25.856');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('7adec64a-cb0c-4296-8b22-67b687dd4ef8', '013ba0ea-d558-48ca-8b9d-1a72de4e8b68', '{"item_added_1771009346472": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T19:02:26.472Z"}}', '{}', '2026-02-13 19:02:26.437', '2026-02-13 19:02:26.474');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('575f158f-bab9-4ad4-8517-98953a268575', '0ddbf673-093d-42ad-bb66-7a4852c91826', '{"item_added_1771004841663": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T17:47:21.663Z"}}', '{}', '2026-02-13 17:47:21.581', '2026-02-13 17:47:21.664');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('9a3db6ab-269b-4f87-80d3-f4bcb1de1a7c', '46acb952-d537-49f8-b824-673d1e442e01', '{"item_added_1771004842237": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T17:47:22.237Z"}}', '{}', '2026-02-13 17:47:22.202', '2026-02-13 17:47:22.238');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('fa00dd5b-b7c5-4784-a201-2bedf4f9edcb', '2dd5d57b-0696-44d3-aea4-acbf688d9f85', '{"item_added_1771004842818": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T17:47:22.818Z"}}', '{}', '2026-02-13 17:47:22.774', '2026-02-13 17:47:22.819');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('1c4a004b-c54a-4a71-acf6-2d6c1142af36', '567558ad-4a17-42da-9a18-b73053380801', '{"item_added_1771004843510": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T17:47:23.510Z"}}', '{}', '2026-02-13 17:47:23.48', '2026-02-13 17:47:23.511');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('367b6d05-ae71-4bca-b081-81b2f182341e', 'e705d6f5-1557-406a-b9bf-340e7ff2e6f7', '{"item_added_1771004843560": {"data": {"price": 850, "quantity": 3, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T17:47:23.560Z"}}', '{}', '2026-02-13 17:47:23.528', '2026-02-13 17:47:23.561');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('9f1a646d-ac7a-4ce2-82a3-e8acc0e65d35', '1775ff5c-58e4-428a-be63-ab644dbd9e55', '{"item_added_1771004844169": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T17:47:24.169Z"}}', '{}', '2026-02-13 17:47:24.147', '2026-02-13 17:47:24.17');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('cf66d3c3-d8dd-4d04-9460-a8912048ed4f', '0ee34d70-5e3f-4daa-a16e-95f6fb51498f', '{"item_added_1771005039211": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T17:50:39.211Z"}}', '{}', '2026-02-13 17:50:39.178', '2026-02-13 17:50:39.212');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('18d760ef-82e9-4d88-affd-85588749c928', '295e4559-9836-468e-a252-5be52c2e4ae8', '{"item_added_1771005039776": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T17:50:39.776Z"}}', '{}', '2026-02-13 17:50:39.744', '2026-02-13 17:50:39.777');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('b9e8578e-c208-480f-b8be-52a185b1f45b', 'bf6acc97-8f6b-4207-b62b-a67180647907', '{"item_added_1771005040341": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T17:50:40.341Z"}}', '{}', '2026-02-13 17:50:40.313', '2026-02-13 17:50:40.342');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('2037be25-2fa8-478e-bcc2-cabe8ae7331b', 'b9487cdf-5294-4b6e-b14a-8d5c597f1ce2', '{"item_added_1771005041022": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T17:50:41.023Z"}}', '{}', '2026-02-13 17:50:41', '2026-02-13 17:50:41.023');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('c46cba12-ae2e-48ba-bab3-9a72cff8e5af', '8e445a2d-d958-48c6-b28f-f7e2bab6295d', '{"item_added_1771005041058": {"data": {"price": 850, "quantity": 3, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T17:50:41.058Z"}}', '{}', '2026-02-13 17:50:41.036', '2026-02-13 17:50:41.059');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('57a9b42b-229a-4dec-8e8e-f23dbbbc668e', '3971d20a-09e3-4068-a086-205a7810c059', '{}', '{}', '2026-02-13 14:55:45.405', '2026-02-13 14:55:45.405');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('c95d7980-23b3-44f2-9847-72e0e2b9fd14', '08f4a1d0-d670-4c17-adb6-e8612a05e19d', '{"item_added_1771005041656": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T17:50:41.656Z"}}', '{}', '2026-02-13 17:50:41.633', '2026-02-13 17:50:41.657');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('0eac1402-35b7-4db2-8192-9eaa979b6d5d', '7d60f98e-51e7-4a50-9c63-a338dceb2885', '{}', '{}', '2026-02-13 18:20:24.393', '2026-02-13 18:20:24.393');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('558ffad0-bfb9-4441-93b0-c9eb4431a06f', '5447c689-dd87-477b-891e-7f37608e7859', '{}', '{}', '2026-02-13 18:20:24.952', '2026-02-13 18:20:24.952');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('47b441b6-3a35-473e-a46d-8a6a64e6403b', '1e105ef0-8e7b-42de-8015-dcf76568cd67', '{}', '{}', '2026-02-13 18:20:25.496', '2026-02-13 18:20:25.496');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('bfa0df77-0967-4add-bb33-38aec48ba5ac', 'a3e85f7e-d2eb-4f16-9761-c8c1fb7c21fe', '{}', '{}', '2026-02-13 18:20:26.041', '2026-02-13 18:20:26.041');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('8880aa40-1ded-49fe-8153-49d34dcdddd6', 'dd9c4516-d018-449a-a3ef-ba2c23c83820', '{}', '{}', '2026-02-13 18:20:26.624', '2026-02-13 18:20:26.624');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('ac417f5a-2a8e-4b16-91d5-bef7b2b5b15b', '0e549e6b-40c4-4b43-bf55-626aaf4ea0b4', '{"item_added_1771007637987": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:33:57.987Z"}}', '{}', '2026-02-13 18:33:57.843', '2026-02-13 18:33:57.989');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('bebffee6-b0d2-4223-a081-f5a552b2df63', '174353a8-32bd-4979-b90e-aecf79f47ed9', '{"item_added_1771007638585": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:33:58.585Z"}}', '{}', '2026-02-13 18:33:58.545', '2026-02-13 18:33:58.587');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('034bfc79-32df-42a9-b291-c72ea7f43ec6', 'd8ba28bc-f4e5-40a5-8f35-ffbcfacf4d52', '{"item_added_1771007639158": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:33:59.158Z"}}', '{}', '2026-02-13 18:33:59.127', '2026-02-13 18:33:59.159');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('27c3c394-0a00-4b16-875d-b87fa332ed92', 'a6589a5d-6180-41ca-bb5f-d06a78f218b2', '{"item_added_1771007639868": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:33:59.868Z"}}', '{}', '2026-02-13 18:33:59.835', '2026-02-13 18:33:59.869');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('9629297d-a71c-4e23-ba36-ea8ad2f74c6d', '9ac836d1-7c5c-4c0d-a11a-94c1bf993986', '{"item_added_1771007639945": {"data": {"price": 850, "quantity": 3, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:33:59.945Z"}}', '{}', '2026-02-13 18:33:59.895', '2026-02-13 18:33:59.946');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('8c0106ec-9df7-4e47-8cb1-786118f9d1bd', '81dbab85-526a-4be8-aff8-7cda3c079ca9', '{"item_added_1771007640623": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T18:34:00.623Z"}}', '{}', '2026-02-13 18:34:00.573', '2026-02-13 18:34:00.624');
INSERT INTO public.cart_analytics (id, cart_id, events, conversion_funnel, created_at, updated_at) VALUES ('0f887e9b-aa99-44c3-bbd6-193d9ba18d14', '2614269d-f61a-4669-b1de-7e8a47370311', '{"item_added_1770718734330": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-10T10:18:54.330Z"}, "item_added_1770718791349": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-10T10:19:51.350Z"}, "item_added_1770721316829": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-10T11:01:56.829Z"}, "item_added_1770721374977": {"data": {"price": 1000, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-10T11:02:54.977Z"}, "item_added_1770722589289": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-10T11:23:09.289Z"}, "item_added_1770794158125": {"data": {"price": 1000, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-11T07:15:58.125Z"}, "item_added_1770800346927": {"data": {"price": 1000, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-11T08:59:06.927Z"}, "item_added_1770800408881": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-11T09:00:08.881Z"}, "item_added_1770800423545": {"data": {"price": 1000, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-11T09:00:23.545Z"}, "item_added_1770803402621": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-11T09:50:02.621Z"}, "item_added_1770803413154": {"data": {"price": 1000, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-11T09:50:13.154Z"}, "item_added_1770804898433": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-11T10:14:58.433Z"}, "item_added_1770804911657": {"data": {"price": 1000, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-11T10:15:11.657Z"}, "item_added_1770806697608": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-11T10:44:57.608Z"}, "item_added_1770806711679": {"data": {"price": 1000, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-11T10:45:11.679Z"}, "item_added_1770808781652": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-11T11:19:41.652Z"}, "item_added_1770808787459": {"data": {"price": 1000, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-11T11:19:47.459Z"}, "item_added_1770812219753": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-11T12:16:59.753Z"}, "item_added_1770818901699": {"data": {"price": 1000, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-11T14:08:21.699Z"}, "item_added_1770832652517": {"data": {"price": 1000, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-11T17:57:32.517Z"}, "item_added_1770885620014": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-12T08:40:20.014Z"}, "item_added_1770885626490": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-12T08:40:26.490Z"}, "item_added_1770924476573": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-12T19:27:56.573Z"}, "item_added_1770924480177": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-12T19:28:00.177Z"}, "item_added_1770927451436": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-12T20:17:31.437Z"}, "item_added_1770927454622": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-12T20:17:34.623Z"}, "item_added_1770927596784": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-12T20:19:56.784Z"}, "item_added_1770928634065": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-12T20:37:14.065Z"}, "item_added_1770928637814": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-12T20:37:17.814Z"}, "item_added_1770932011796": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-12T21:33:31.796Z"}, "item_added_1770932013405": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-12T21:33:33.405Z"}, "item_added_1770976939834": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T10:02:19.834Z"}, "item_added_1770976943511": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T10:02:23.511Z"}, "item_added_1770980220114": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T10:57:00.114Z"}, "item_added_1770980221627": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T10:57:01.627Z"}, "item_added_1770985585916": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T12:26:25.916Z"}, "item_added_1770985590234": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T12:26:30.234Z"}, "item_added_1770985590888": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T12:26:30.888Z"}, "item_added_1770985595648": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T12:26:35.648Z"}, "item_added_1770996924619": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T15:35:24.619Z"}, "item_added_1770996928675": {"data": {"price": 5000, "quantity": 2, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T15:35:28.675Z"}, "item_added_1770996930704": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T15:35:30.704Z"}, "item_added_1770996932324": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T15:35:32.324Z"}, "item_added_1770998075172": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T15:54:35.172Z"}, "item_added_1770998076318": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T15:54:36.318Z"}, "item_added_1770998314858": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T15:58:34.858Z"}, "item_added_1770998316283": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T15:58:36.283Z"}, "item_added_1770999591536": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T16:19:51.536Z"}, "item_added_1771001358374": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T16:49:18.374Z"}, "item_added_1771001359713": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T16:49:19.713Z"}, "item_added_1771001436749": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T16:50:36.750Z"}, "item_added_1771001437758": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T16:50:37.758Z"}, "item_added_1771001493167": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T16:51:33.167Z"}, "item_added_1771015129164": {"data": {"price": 5000, "quantity": 1, "productId": "4010caae-464e-4787-ad8f-ee04096100d0", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T20:38:49.165Z"}, "item_added_1771015143588": {"data": {"price": 850, "quantity": 1, "productId": "c571ed71-fd5b-4158-ad6d-87405e75f046", "variantId": null}, "type": "item_added", "timestamp": "2026-02-13T20:39:03.588Z"}, "cart_cleared_1770922321593": {"data": {}, "type": "cart_cleared", "timestamp": "2026-02-12T18:52:01.593Z"}, "cart_cleared_1770924510487": {"data": {}, "type": "cart_cleared", "timestamp": "2026-02-12T19:28:30.487Z"}, "cart_cleared_1770927485337": {"data": {}, "type": "cart_cleared", "timestamp": "2026-02-12T20:18:05.337Z"}, "cart_cleared_1770927623309": {"data": {}, "type": "cart_cleared", "timestamp": "2026-02-12T20:20:23.309Z"}, "cart_cleared_1770931924545": {"data": {}, "type": "cart_cleared", "timestamp": "2026-02-12T21:32:04.545Z"}, "cart_cleared_1770932063098": {"data": {}, "type": "cart_cleared", "timestamp": "2026-02-12T21:34:23.098Z"}, "cart_cleared_1770977328408": {"data": {}, "type": "cart_cleared", "timestamp": "2026-02-13T10:08:48.408Z"}, "cart_cleared_1770980847931": {"data": {}, "type": "cart_cleared", "timestamp": "2026-02-13T11:07:27.931Z"}, "cart_cleared_1770985590280": {"data": {}, "type": "cart_cleared", "timestamp": "2026-02-13T12:26:30.280Z"}, "cart_cleared_1770996928615": {"data": {}, "type": "cart_cleared", "timestamp": "2026-02-13T15:35:28.615Z"}, "cart_cleared_1770996931828": {"data": {}, "type": "cart_cleared", "timestamp": "2026-02-13T15:35:31.828Z"}, "cart_cleared_1770996932239": {"data": {}, "type": "cart_cleared", "timestamp": "2026-02-13T15:35:32.239Z"}, "cart_cleared_1770998108116": {"data": {}, "type": "cart_cleared", "timestamp": "2026-02-13T15:55:08.116Z"}, "cart_cleared_1770998605845": {"data": {}, "type": "cart_cleared", "timestamp": "2026-02-13T16:03:25.845Z"}, "cart_cleared_1770999698779": {"data": {}, "type": "cart_cleared", "timestamp": "2026-02-13T16:21:38.779Z"}, "cart_cleared_1771001390691": {"data": {}, "type": "cart_cleared", "timestamp": "2026-02-13T16:49:50.691Z"}, "cart_cleared_1771001463277": {"data": {}, "type": "cart_cleared", "timestamp": "2026-02-13T16:51:03.277Z"}, "cart_cleared_1771001517261": {"data": {}, "type": "cart_cleared", "timestamp": "2026-02-13T16:51:57.261Z"}, "cart_cleared_1771015185222": {"data": {}, "type": "cart_cleared", "timestamp": "2026-02-13T20:39:45.222Z"}, "item_removed_1770798917735": {"data": {"cartItemId": "e49888f0-53ea-4344-a843-533b63b6f5f9"}, "type": "item_removed", "timestamp": "2026-02-11T08:35:17.735Z"}, "item_removed_1770800399847": {"data": {"cartItemId": "d148b649-2239-45a7-bcf8-a5e58f2a08d2"}, "type": "item_removed", "timestamp": "2026-02-11T08:59:59.847Z"}, "item_removed_1770803352330": {"data": {"cartItemId": "21850935-1e31-44cd-afe1-451dedf458d6"}, "type": "item_removed", "timestamp": "2026-02-11T09:49:12.330Z"}, "item_removed_1770803369298": {"data": {"cartItemId": "963aebd7-85ab-4108-ab4f-c05ce8874b88"}, "type": "item_removed", "timestamp": "2026-02-11T09:49:29.298Z"}, "item_removed_1770803689808": {"data": {"cartItemId": "323577ae-5a96-438c-9dcb-c980a976288d"}, "type": "item_removed", "timestamp": "2026-02-11T09:54:49.808Z"}, "item_removed_1770804892206": {"data": {"cartItemId": "ad51e5db-b03d-4794-a1df-8dba1db24d79"}, "type": "item_removed", "timestamp": "2026-02-11T10:14:52.206Z"}, "item_removed_1770805394972": {"data": {"cartItemId": "813af550-6c83-4307-bc8d-0bcfede0f500"}, "type": "item_removed", "timestamp": "2026-02-11T10:23:14.972Z"}, "item_removed_1770806689149": {"data": {"cartItemId": "da0d5f79-8fda-4aee-a274-08091e4e0590"}, "type": "item_removed", "timestamp": "2026-02-11T10:44:49.149Z"}, "item_removed_1770806937638": {"data": {"cartItemId": "a836381c-e2ae-4641-9696-ccb708e5da6e"}, "type": "item_removed", "timestamp": "2026-02-11T10:48:57.638Z"}, "item_removed_1770808774098": {"data": {"cartItemId": "016a40c4-210c-4477-9328-1718cbff8cc8"}, "type": "item_removed", "timestamp": "2026-02-11T11:19:34.098Z"}, "item_removed_1770810170929": {"data": {"cartItemId": "318520ec-ece3-4b58-8ca4-ac7a0ba40b01"}, "type": "item_removed", "timestamp": "2026-02-11T11:42:50.929Z"}, "item_removed_1770812260601": {"data": {"cartItemId": "91b41e4a-d860-4b7b-8057-bc6fb31b11a9"}, "type": "item_removed", "timestamp": "2026-02-11T12:17:40.601Z"}, "item_removed_1770824411835": {"data": {"cartItemId": "d896ab7c-fa2f-4c36-8963-4b96d829047e"}, "type": "item_removed", "timestamp": "2026-02-11T15:40:11.835Z"}, "item_removed_1770832646287": {"data": {"cartItemId": "0b09beb6-923c-4478-b0b1-e20b4abd27a1"}, "type": "item_removed", "timestamp": "2026-02-11T17:57:26.287Z"}, "item_removed_1770885614689": {"data": {"cartItemId": "c21d8192-25e0-417c-8092-ecc72783aa92"}, "type": "item_removed", "timestamp": "2026-02-12T08:40:14.689Z"}, "item_removed_1770985589146": {"data": {"cartItemId": "c2468eca-a0d5-496b-a6b6-ac88ec1b712b"}, "type": "item_removed", "timestamp": "2026-02-13T12:26:29.146Z"}, "item_removed_1770996927885": {"data": {"cartItemId": "550d90f1-e47c-4e6d-9a7c-4eb0bdf9cfa0"}, "type": "item_removed", "timestamp": "2026-02-13T15:35:27.885Z"}, "item_updated_1770722630555": {"data": {"quantity": 2, "cartItemId": "d148b649-2239-45a7-bcf8-a5e58f2a08d2"}, "type": "item_updated", "timestamp": "2026-02-10T11:23:50.555Z"}, "item_updated_1770723153167": {"data": {"quantity": 3, "cartItemId": "d148b649-2239-45a7-bcf8-a5e58f2a08d2"}, "type": "item_updated", "timestamp": "2026-02-10T11:32:33.167Z"}, "item_updated_1770749805029": {"data": {"quantity": 3, "cartItemId": "e49888f0-53ea-4344-a843-533b63b6f5f9"}, "type": "item_updated", "timestamp": "2026-02-10T18:56:45.029Z"}, "item_updated_1770758554050": {"data": {"quantity": 4, "cartItemId": "d148b649-2239-45a7-bcf8-a5e58f2a08d2"}, "type": "item_updated", "timestamp": "2026-02-10T21:22:34.050Z"}, "item_updated_1770791323624": {"data": {"quantity": 3, "cartItemId": "d148b649-2239-45a7-bcf8-a5e58f2a08d2"}, "type": "item_updated", "timestamp": "2026-02-11T06:28:43.624Z"}, "item_updated_1770798731774": {"data": {"quantity": 5, "cartItemId": "d148b649-2239-45a7-bcf8-a5e58f2a08d2"}, "type": "item_updated", "timestamp": "2026-02-11T08:32:11.774Z"}, "item_updated_1770798842717": {"data": {"quantity": 6, "cartItemId": "d148b649-2239-45a7-bcf8-a5e58f2a08d2"}, "type": "item_updated", "timestamp": "2026-02-11T08:34:02.717Z"}, "item_updated_1770798860983": {"data": {"quantity": 5, "cartItemId": "d148b649-2239-45a7-bcf8-a5e58f2a08d2"}, "type": "item_updated", "timestamp": "2026-02-11T08:34:20.983Z"}, "item_updated_1770800559178": {"data": {"quantity": 2, "cartItemId": "21850935-1e31-44cd-afe1-451dedf458d6"}, "type": "item_updated", "timestamp": "2026-02-11T09:02:39.178Z"}, "item_updated_1770805145861": {"data": {"quantity": 2, "cartItemId": "da0d5f79-8fda-4aee-a274-08091e4e0590"}, "type": "item_updated", "timestamp": "2026-02-11T10:19:05.861Z"}, "item_updated_1770805290314": {"data": {"quantity": 1, "cartItemId": "da0d5f79-8fda-4aee-a274-08091e4e0590"}, "type": "item_updated", "timestamp": "2026-02-11T10:21:30.314Z"}, "item_updated_1770806675338": {"data": {"quantity": 2, "cartItemId": "da0d5f79-8fda-4aee-a274-08091e4e0590"}, "type": "item_updated", "timestamp": "2026-02-11T10:44:35.338Z"}, "item_updated_1770806682380": {"data": {"quantity": 1, "cartItemId": "da0d5f79-8fda-4aee-a274-08091e4e0590"}, "type": "item_updated", "timestamp": "2026-02-11T10:44:42.380Z"}, "item_updated_1770808800656": {"data": {"quantity": 2, "cartItemId": "91b41e4a-d860-4b7b-8057-bc6fb31b11a9"}, "type": "item_updated", "timestamp": "2026-02-11T11:20:00.656Z"}, "item_updated_1770809628005": {"data": {"quantity": 1, "cartItemId": "91b41e4a-d860-4b7b-8057-bc6fb31b11a9"}, "type": "item_updated", "timestamp": "2026-02-11T11:33:48.005Z"}, "item_updated_1770833883455": {"data": {"quantity": 2, "cartItemId": "c21d8192-25e0-417c-8092-ecc72783aa92"}, "type": "item_updated", "timestamp": "2026-02-11T18:18:03.455Z"}, "item_updated_1770833898473": {"data": {"quantity": 1, "cartItemId": "c21d8192-25e0-417c-8092-ecc72783aa92"}, "type": "item_updated", "timestamp": "2026-02-11T18:18:18.473Z"}, "item_updated_1770885896296": {"data": {"quantity": 2, "cartItemId": "98260d00-2c7a-4a83-878d-2c322c77f3b6"}, "type": "item_updated", "timestamp": "2026-02-12T08:44:56.296Z"}, "item_updated_1770885917467": {"data": {"quantity": 1, "cartItemId": "98260d00-2c7a-4a83-878d-2c322c77f3b6"}, "type": "item_updated", "timestamp": "2026-02-12T08:45:17.467Z"}, "item_updated_1770890357474": {"data": {"quantity": 2, "cartItemId": "98260d00-2c7a-4a83-878d-2c322c77f3b6"}, "type": "item_updated", "timestamp": "2026-02-12T09:59:17.474Z"}, "item_updated_1770890376839": {"data": {"quantity": 2, "cartItemId": "a628b947-9947-400a-bf5d-f80138eef986"}, "type": "item_updated", "timestamp": "2026-02-12T09:59:36.839Z"}, "item_updated_1770915171254": {"data": {"quantity": 1, "cartItemId": "98260d00-2c7a-4a83-878d-2c322c77f3b6"}, "type": "item_updated", "timestamp": "2026-02-12T16:52:51.254Z"}, "item_updated_1770985587532": {"data": {"quantity": 5, "cartItemId": "c2468eca-a0d5-496b-a6b6-ac88ec1b712b"}, "type": "item_updated", "timestamp": "2026-02-13T12:26:27.532Z"}, "item_updated_1770996927040": {"data": {"quantity": 5, "cartItemId": "550d90f1-e47c-4e6d-9a7c-4eb0bdf9cfa0"}, "type": "item_updated", "timestamp": "2026-02-13T15:35:27.040Z"}, "item_updated_1770996927468": {"data": {"quantity": 1, "cartItemId": "550d90f1-e47c-4e6d-9a7c-4eb0bdf9cfa0"}, "type": "item_updated", "timestamp": "2026-02-13T15:35:27.468Z"}, "item_updated_1771015158674": {"data": {"quantity": 2, "cartItemId": "2c22bc73-26cc-435d-97a4-123e0e88c7ef"}, "type": "item_updated", "timestamp": "2026-02-13T20:39:18.674Z"}}', '{}', '2026-02-08 18:20:12.889', '2026-02-13 20:39:45.231');


--
-- Data for Name: cart_cleanup_audit; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: cart_events; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('953fcfbe-6eb4-4fe7-acab-9c1f55e56c8c', '0ddbf673-093d-42ad-bb66-7a4852c91826', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00, '2026-02-13 17:47:21.637');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('6e6d45e6-3b09-4a1b-a071-a15dc1e51384', '46acb952-d537-49f8-b824-673d1e442e01', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00, '2026-02-13 17:47:22.217');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('e3394a00-6ad0-4521-9d33-731d387cf391', '2dd5d57b-0696-44d3-aea4-acbf688d9f85', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00, '2026-02-13 17:47:22.796');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('84b13d2e-a4ae-451b-88ae-3c2dbb6a6ea4', '567558ad-4a17-42da-9a18-b73053380801', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00, '2026-02-13 17:47:23.495');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('e6ac5c7b-e199-488b-88f3-787346f4bb18', 'e705d6f5-1557-406a-b9bf-340e7ff2e6f7', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 3, 850.00, 2550.00, '2026-02-13 17:47:23.542');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('d32dbf84-33e9-488d-a83e-55789a359a3e', '1775ff5c-58e4-428a-be63-ab644dbd9e55', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 850.00, 850.00, '2026-02-13 17:47:24.157');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('9e1b1105-1036-4fee-a9e2-02074fef6f6c', '0ee34d70-5e3f-4daa-a16e-95f6fb51498f', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00, '2026-02-13 17:50:39.196');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('bb3d112b-e46a-4689-ab4b-5b342eb39ca5', '295e4559-9836-468e-a252-5be52c2e4ae8', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00, '2026-02-13 17:50:39.761');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('cfa3b7f6-c6ff-4756-a80f-e38d79d8f30f', 'bf6acc97-8f6b-4207-b62b-a67180647907', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00, '2026-02-13 17:50:40.328');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('10d7f485-fe0e-4d8e-b36c-24d331ca2abc', 'b9487cdf-5294-4b6e-b14a-8d5c597f1ce2', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00, '2026-02-13 17:50:41.012');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('eb2a078a-8ea2-42d4-aa41-1f6fcfa47750', '8e445a2d-d958-48c6-b28f-f7e2bab6295d', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 3, 850.00, 2550.00, '2026-02-13 17:50:41.047');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('3d54bd5a-f789-42a5-92dc-3d8bcd3b106c', '08f4a1d0-d670-4c17-adb6-e8612a05e19d', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 850.00, 850.00, '2026-02-13 17:50:41.646');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('a81ee223-bf3e-4840-8009-55da1ff030c3', '0e549e6b-40c4-4b43-bf55-626aaf4ea0b4', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00, '2026-02-13 18:33:57.912');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('5b0a4433-1b25-4c1f-ac40-4fa6f1d73a3d', '174353a8-32bd-4979-b90e-aecf79f47ed9', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00, '2026-02-13 18:33:58.565');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('9915ab9b-6342-4947-bf03-e4212683996d', 'd8ba28bc-f4e5-40a5-8f35-ffbcfacf4d52', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00, '2026-02-13 18:33:59.142');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('346771f2-b20b-441e-aed2-beb8673b1c63', 'a6589a5d-6180-41ca-bb5f-d06a78f218b2', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00, '2026-02-13 18:33:59.85');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('ff23eb6a-413d-4bc1-9594-5e0f9a825d51', '9ac836d1-7c5c-4c0d-a11a-94c1bf993986', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 3, 850.00, 2550.00, '2026-02-13 18:33:59.919');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('e978d608-c929-4a1b-8a82-68090543c87a', '81dbab85-526a-4be8-aff8-7cda3c079ca9', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 850.00, 850.00, '2026-02-13 18:34:00.598');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('655532bc-3ee1-4bd3-8985-eaf1bde433d3', 'b89cd182-30a4-422c-8b91-bcf1954c7149', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00, '2026-02-13 18:53:27.882');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('250d75dd-a8fb-4c07-bdfe-8555db41afd8', 'fcef2bc6-ce4e-4562-82b5-d9daa79a3343', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00, '2026-02-13 18:53:28.538');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('fd23b140-d333-4f9a-b9e2-628200a489d0', 'fcfd7475-42cf-42d3-a1a1-2885f62992c9', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00, '2026-02-13 18:53:29.124');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('6854a7ca-f26f-46b1-9efe-cd35ab5dfc72', 'f584c9be-6f3b-4b37-9b8b-c7e6345bb9ee', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00, '2026-02-13 18:53:29.823');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('0ef7db56-7158-4262-9a8a-c8561cec7b42', '1047b4aa-ff70-4919-8218-2baa34306772', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 3, 850.00, 2550.00, '2026-02-13 18:53:29.889');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('0c8aa050-c550-455c-b036-79cd86a64f81', '6e743874-7d90-4315-8493-719353029146', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 850.00, 850.00, '2026-02-13 18:53:30.49');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('23522bcf-8119-48cd-8ab3-00de27b3bd0a', '66b83aea-e058-41fd-84ea-4607721be792', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00, '2026-02-13 18:55:04.567');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('f4de5340-6845-44b5-a88c-340b51493df2', '6c1c800f-b0e0-4c96-a007-6d610edfade2', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00, '2026-02-13 18:55:05.237');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('19f5e507-ad0b-4ad7-93c6-ecf3c04e1a5d', '14629daa-28dd-4924-a6f0-0d92a5b0fed6', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00, '2026-02-13 18:55:05.838');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('95817df3-afae-4a5b-b7a5-85a5bb81a1f2', '7a4a5cab-4300-47f4-8b5d-ef811ba9d10b', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00, '2026-02-13 18:55:06.548');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('62878173-2dec-43b4-84d9-8b77e946eb93', 'd180e419-8e8e-495d-ae0e-8f1b9c34d04f', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 3, 850.00, 2550.00, '2026-02-13 18:55:06.598');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('24fb790b-465d-41df-bf85-d3d57d71d5d4', '9912c77b-809b-4d8e-854a-77bb5877fdc3', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 850.00, 850.00, '2026-02-13 18:55:07.219');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('7fc34b32-e1e5-47d2-8fd7-76d0b43b31f3', '4e702325-1123-4600-a21c-af167e150ec4', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00, '2026-02-13 18:55:50.909');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('6373e164-a523-424d-a50b-6d11f37565bd', '85d55404-387b-46ec-839f-6e19b856db85', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00, '2026-02-13 18:55:51.571');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('15e5b2a7-addf-4135-9dc8-dbd4a2e4d2c4', 'ce62b747-7c36-4cc5-968d-ea8f9b8e9084', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00, '2026-02-13 18:55:52.201');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('fb75ea35-e0d3-41cc-acc7-e9b65a1d867c', '04f7e88c-93c5-41b5-b8da-f28979634540', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00, '2026-02-13 18:55:52.953');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('df8d3afa-6fb4-472d-882b-b74380053589', '2d88d243-f873-4477-b772-396e0caf8403', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 3, 850.00, 2550.00, '2026-02-13 18:55:53.034');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('4daafe66-512a-4f8b-b91e-162949f697f4', '658dda60-618a-411a-9b36-48938237f142', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 850.00, 850.00, '2026-02-13 18:55:53.649');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('6ba7eba2-032c-49e0-b7b4-66546dc60072', 'b579d190-9eb5-4689-a2a5-1e33e3380779', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00, '2026-02-13 18:57:54.087');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('0a343137-4986-4aa2-976f-7ccee84d4a8d', '494b71b8-8916-48e5-ba8d-07fb5ab98a0e', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00, '2026-02-13 18:57:54.685');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('aa5fa0f6-ed4d-4cc1-93ed-05012434cf80', '2967017d-7704-4cfd-b53f-a70142d6dab5', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00, '2026-02-13 18:57:55.268');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('d5e1173a-cfff-402f-bd46-de60fe0a9a15', '0d9bf0d2-7bb2-4b9a-a402-eded3ba746c9', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00, '2026-02-13 18:57:56.003');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('74a06d32-9d6d-47a9-b150-18a537ff4f51', 'f82465ac-0a11-44aa-a716-50859a76a8d8', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 3, 850.00, 2550.00, '2026-02-13 18:57:56.055');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('49799400-c5e0-43c1-ae53-1169f458fcc0', '42988576-0bde-4771-b50e-af1d9ec51b4d', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 850.00, 850.00, '2026-02-13 18:57:56.673');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('2436ecc5-db59-408a-8845-ccf87b7e4c21', 'd17f1daa-ae08-47a6-b512-140ccb11254c', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00, '2026-02-13 18:59:22.681');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('e91b0bef-e1b7-47fd-bfc6-13169286b289', 'b2bf2413-db63-4c2f-b647-6599ba3c5175', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00, '2026-02-13 18:59:23.342');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('b99641b3-7219-4302-98dd-a2f3c352c259', '4f6a37b5-6668-4c98-b93e-a5e4bbfeb063', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00, '2026-02-13 18:59:24.507');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('0efa55a4-2c69-4532-96d8-47efdfa1a2ab', 'bfb0d39c-6427-45a5-a512-d574eb8f477b', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00, '2026-02-13 18:59:25.427');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('509acd97-d856-41a6-b82e-1e9325b0c9d5', 'dc83beb7-dea2-4ffd-86aa-be7fde046784', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 3, 850.00, 2550.00, '2026-02-13 18:59:25.478');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('98b4f705-597f-40ee-9e54-209719ffe503', '0035d8b0-3fa1-47ed-9d11-266ef2d4c20e', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 850.00, 850.00, '2026-02-13 18:59:26.083');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('5c624c89-fa10-4b3d-98f9-6f3e36d2d3a1', '6b5e3b8a-66a9-438a-8e30-a96b4385045e', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00, '2026-02-13 19:00:55.924');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('92214d4c-d4aa-4bdb-ac57-91ff8a3b40fc', 'a69259da-b4f2-4fbf-9dc1-e0d030245311', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00, '2026-02-13 19:00:56.534');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('bd8cf435-eba1-4717-a664-6b9f7663c21d', '47b8cfbc-2a61-4dd6-9919-ba0fbf353baa', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00, '2026-02-13 19:00:57.101');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('64955bd8-6dec-4f51-b1e4-791815c669b9', 'f66ce221-aa2a-47b1-8760-0eef66ab0d12', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00, '2026-02-13 19:00:57.814');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('1fc2708d-9ca0-4be8-8bb7-0dfe92d3700c', '7a04469e-9102-4a69-859a-fee90e03af11', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 3, 850.00, 2550.00, '2026-02-13 19:00:57.889');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('9b64520f-0f11-4e80-ba6c-f28c4ce5a031', '9be5e98a-3e70-4533-ac53-4df652fb67e6', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 850.00, 850.00, '2026-02-13 19:00:58.516');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('993b4849-6339-4272-8a47-84cd8755e199', 'a1759545-ecf1-4aaf-a8b7-d972a211e82b', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00, '2026-02-13 19:02:23.26');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('dd99cd1d-0f1b-47e7-8bab-b151374d9ca6', 'af6ca6a1-1293-4ece-9fba-0c3016cd4d12', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00, '2026-02-13 19:02:23.939');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('02bd240f-21cb-4ee8-b848-fa812e218bfa', '54bccabd-a276-4373-84cd-1e2a0cc6222f', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00, '2026-02-13 19:02:24.516');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('036a00a2-aa40-4b3d-bf08-ebe190b3ad1c', 'f2f3fa14-2d8d-485b-b159-ef6539b62ddd', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00, '2026-02-13 19:02:25.252');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('a00f398c-fa01-4a9f-9e85-b9e0a798d55f', '5b6be18b-c188-483a-9704-c29f7c28ff7c', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 3, 850.00, 2550.00, '2026-02-13 19:02:25.832');
INSERT INTO public.cart_items (id, cart_id, product_id, variant_id, quantity, price, subtotal, added_at) VALUES ('8496e840-e563-4281-a3ee-7dbb81a6f713', '013ba0ea-d558-48ca-8b9d-1a72de4e8b68', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 850.00, 850.00, '2026-02-13 19:02:26.453');


--
-- Data for Name: cart_share_tokens; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('85d55404-387b-46ec-839f-6e19b856db85', NULL, 'guest-session-test2-1771008951487', '2026-02-13 18:55:51.509', '2026-02-13 18:55:51.595', '2026-03-15 18:55:51.505', 5000.00, 0.00, 100.00, 0.00, 5100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('d8ba28bc-f4e5-40a5-8f35-ffbcfacf4d52', NULL, 'guest-session-test3-1771007639115', '2026-02-13 18:33:59.122', '2026-02-13 18:33:59.313', '2026-03-15 18:33:59.121', 10000.00, 0.00, 100.00, 0.00, 10100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('2614269d-f61a-4669-b1de-7e8a47370311', '2bdca14e-ac33-43ca-b98a-5117c8ecdeb9', NULL, '2026-02-08 18:20:12.873', '2026-02-13 20:42:07.176', NULL, 0.00, 0.00, 100.00, 0.00, 100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('1047b4aa-ff70-4919-8218-2baa34306772', NULL, 'guest-session-test4-1771008809786', '2026-02-13 18:53:29.864', '2026-02-13 18:53:29.934', '2026-03-15 18:53:29.863', 2550.00, 0.00, 100.00, 0.00, 2650.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('3971d20a-09e3-4068-a086-205a7810c059', NULL, 'guest-session-1770994545050', '2026-02-13 14:55:45.345', '2026-02-13 14:55:47.388', '2026-03-15 14:55:45.338', 0.00, 0.00, 100.00, 0.00, 100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('0ddbf673-093d-42ad-bb66-7a4852c91826', NULL, 'guest-session-test1-1771004841514', '2026-02-13 17:47:21.554', '2026-02-13 17:47:21.656', '2026-03-15 17:47:21.521', 5000.00, 0.00, 100.00, 0.00, 5100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('46acb952-d537-49f8-b824-673d1e442e01', NULL, 'guest-session-test2-1771004842180', '2026-02-13 17:47:22.196', '2026-02-13 17:47:22.231', '2026-03-15 17:47:22.195', 5000.00, 0.00, 100.00, 0.00, 5100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('2dd5d57b-0696-44d3-aea4-acbf688d9f85', NULL, 'guest-session-test3-1771004842757', '2026-02-13 17:47:22.767', '2026-02-13 17:47:22.942', '2026-03-15 17:47:22.766', 10000.00, 0.00, 100.00, 0.00, 10100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('e705d6f5-1557-406a-b9bf-340e7ff2e6f7', NULL, 'guest-session-test4-1771004843459', '2026-02-13 17:47:23.524', '2026-02-13 17:47:23.554', '2026-03-15 17:47:23.523', 2550.00, 0.00, 100.00, 0.00, 2650.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('567558ad-4a17-42da-9a18-b73053380801', NULL, 'guest-session-test4-1771004843459', '2026-02-13 17:47:23.475', '2026-02-13 17:47:23.58', '2026-03-15 17:47:23.473', 10000.00, 0.00, 100.00, 0.00, 10100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('a2c68ef9-2c14-4ac1-bcd9-fe1e79b67795', 'ea59bf47-4b66-431d-ba63-a0a69437798f', NULL, '2026-02-10 19:06:32.801', '2026-02-13 20:42:56.265', NULL, 0.00, 0.00, 100.00, 0.00, 100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('1775ff5c-58e4-428a-be63-ab644dbd9e55', NULL, 'guest-session-test5-1771004844100', '2026-02-13 17:47:24.143', '2026-02-13 17:47:24.164', '2026-03-15 17:47:24.142', 850.00, 0.00, 100.00, 0.00, 950.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('0ee34d70-5e3f-4daa-a16e-95f6fb51498f', NULL, 'guest-session-test1-1771005039156', '2026-02-13 17:50:39.168', '2026-02-13 17:50:39.207', '2026-03-15 17:50:39.167', 5000.00, 0.00, 100.00, 0.00, 5100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('295e4559-9836-468e-a252-5be52c2e4ae8', NULL, 'guest-session-test2-1771005039730', '2026-02-13 17:50:39.739', '2026-02-13 17:50:39.771', '2026-03-15 17:50:39.738', 5000.00, 0.00, 100.00, 0.00, 5100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('9ac836d1-7c5c-4c0d-a11a-94c1bf993986', NULL, 'guest-session-test4-1771007639823', '2026-02-13 18:33:59.889', '2026-02-13 18:33:59.938', '2026-03-15 18:33:59.888', 2550.00, 0.00, 100.00, 0.00, 2650.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('bf6acc97-8f6b-4207-b62b-a67180647907', NULL, 'guest-session-test3-1771005040299', '2026-02-13 17:50:40.308', '2026-02-13 17:50:40.47', '2026-03-15 17:50:40.307', 10000.00, 0.00, 100.00, 0.00, 10100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('a6589a5d-6180-41ca-bb5f-d06a78f218b2', NULL, 'guest-session-test4-1771007639823', '2026-02-13 18:33:59.83', '2026-02-13 18:33:59.976', '2026-03-15 18:33:59.829', 10000.00, 0.00, 100.00, 0.00, 10100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('8e445a2d-d958-48c6-b28f-f7e2bab6295d', NULL, 'guest-session-test4-1771005040985', '2026-02-13 17:50:41.033', '2026-02-13 17:50:41.055', '2026-03-15 17:50:41.032', 2550.00, 0.00, 100.00, 0.00, 2650.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('b9487cdf-5294-4b6e-b14a-8d5c597f1ce2', NULL, 'guest-session-test4-1771005040985', '2026-02-13 17:50:40.996', '2026-02-13 17:50:41.074', '2026-03-15 17:50:40.994', 10000.00, 0.00, 100.00, 0.00, 10100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('4d807ff6-e321-4a4e-8abd-34c242c67efb', '0c43809b-46d0-466b-be8b-e3d56e58b886', NULL, '2026-02-11 12:19:37.235', '2026-02-11 13:06:30.393', NULL, 6000.00, 500.00, 100.00, 0.00, 6600.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('08f4a1d0-d670-4c17-adb6-e8612a05e19d', NULL, 'guest-session-test5-1771005041582', '2026-02-13 17:50:41.618', '2026-02-13 17:50:41.653', '2026-03-15 17:50:41.616', 850.00, 0.00, 100.00, 0.00, 950.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('7d60f98e-51e7-4a50-9c63-a338dceb2885', NULL, 'guest-session-test1-1771006824327', '2026-02-13 18:20:24.375', '2026-02-13 18:20:24.375', '2026-03-15 18:20:24.342', 0.00, 0.00, 0.00, 0.00, 0.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('5447c689-dd87-477b-891e-7f37608e7859', NULL, 'guest-session-test2-1771006824939', '2026-02-13 18:20:24.946', '2026-02-13 18:20:24.946', '2026-03-15 18:20:24.945', 0.00, 0.00, 0.00, 0.00, 0.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('1e105ef0-8e7b-42de-8015-dcf76568cd67', NULL, 'guest-session-test3-1771006825479', '2026-02-13 18:20:25.491', '2026-02-13 18:20:25.491', '2026-03-15 18:20:25.49', 0.00, 0.00, 0.00, 0.00, 0.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('a3e85f7e-d2eb-4f16-9761-c8c1fb7c21fe', NULL, 'guest-session-test4-1771006826023', '2026-02-13 18:20:26.035', '2026-02-13 18:20:26.035', '2026-03-15 18:20:26.034', 0.00, 0.00, 0.00, 0.00, 0.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('dd9c4516-d018-449a-a3ef-ba2c23c83820', NULL, 'guest-session-test5-1771006826579', '2026-02-13 18:20:26.62', '2026-02-13 18:20:26.62', '2026-03-15 18:20:26.618', 0.00, 0.00, 0.00, 0.00, 0.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('b0412420-3075-4c7d-ae50-1e5abe2d073b', NULL, NULL, '2026-02-08 18:20:47.004', '2026-02-10 11:35:08.292', NULL, 0.00, 0.00, 100.00, 0.00, 100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('0e549e6b-40c4-4b43-bf55-626aaf4ea0b4', NULL, 'guest-session-test1-1771007637647', '2026-02-13 18:33:57.803', '2026-02-13 18:33:57.965', '2026-03-15 18:33:57.664', 5000.00, 0.00, 100.00, 0.00, 5100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('174353a8-32bd-4979-b90e-aecf79f47ed9', NULL, 'guest-session-test2-1771007638507', '2026-02-13 18:33:58.517', '2026-02-13 18:33:58.578', '2026-03-15 18:33:58.516', 5000.00, 0.00, 100.00, 0.00, 5100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('81dbab85-526a-4be8-aff8-7cda3c079ca9', NULL, 'guest-session-test5-1771007640490', '2026-02-13 18:34:00.568', '2026-02-13 18:34:00.615', '2026-03-15 18:34:00.567', 850.00, 0.00, 100.00, 0.00, 950.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('6e743874-7d90-4315-8493-719353029146', NULL, 'guest-session-test5-1771008810443', '2026-02-13 18:53:30.471', '2026-02-13 18:53:30.502', '2026-03-15 18:53:30.47', 850.00, 0.00, 100.00, 0.00, 950.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('b89cd182-30a4-422c-8b91-bcf1954c7149', NULL, 'guest-session-test1-1771008807786', '2026-02-13 18:53:27.804', '2026-02-13 18:53:27.983', '2026-03-15 18:53:27.8', 5000.00, 0.00, 100.00, 0.00, 5100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('fcef2bc6-ce4e-4562-82b5-d9daa79a3343', NULL, 'guest-session-test2-1771008808499', '2026-02-13 18:53:28.513', '2026-02-13 18:53:28.551', '2026-03-15 18:53:28.511', 5000.00, 0.00, 100.00, 0.00, 5100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('fcfd7475-42cf-42d3-a1a1-2885f62992c9', NULL, 'guest-session-test3-1771008809094', '2026-02-13 18:53:29.105', '2026-02-13 18:53:29.271', '2026-03-15 18:53:29.104', 10000.00, 0.00, 100.00, 0.00, 10100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('f584c9be-6f3b-4b37-9b8b-c7e6345bb9ee', NULL, 'guest-session-test4-1771008809786', '2026-02-13 18:53:29.795', '2026-02-13 18:53:29.836', '2026-03-15 18:53:29.794', 10000.00, 0.00, 100.00, 0.00, 10100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('66b83aea-e058-41fd-84ea-4607721be792', NULL, 'guest-session-test1-1771008904518', '2026-02-13 18:55:04.533', '2026-02-13 18:55:04.647', '2026-03-15 18:55:04.531', 5000.00, 0.00, 100.00, 0.00, 5100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('6c1c800f-b0e0-4c96-a007-6d610edfade2', NULL, 'guest-session-test2-1771008905164', '2026-02-13 18:55:05.191', '2026-02-13 18:55:05.255', '2026-03-15 18:55:05.19', 5000.00, 0.00, 100.00, 0.00, 5100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('d180e419-8e8e-495d-ae0e-8f1b9c34d04f', NULL, 'guest-session-test4-1771008906514', '2026-02-13 18:55:06.575', '2026-02-13 18:55:06.613', '2026-03-15 18:55:06.574', 2550.00, 0.00, 100.00, 0.00, 2650.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('14629daa-28dd-4924-a6f0-0d92a5b0fed6', NULL, 'guest-session-test3-1771008905803', '2026-02-13 18:55:05.809', '2026-02-13 18:55:05.998', '2026-03-15 18:55:05.808', 10000.00, 0.00, 100.00, 0.00, 10100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('7a4a5cab-4300-47f4-8b5d-ef811ba9d10b', NULL, 'guest-session-test4-1771008906514', '2026-02-13 18:55:06.523', '2026-02-13 18:55:06.642', '2026-03-15 18:55:06.522', 10000.00, 0.00, 100.00, 0.00, 10100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('9912c77b-809b-4d8e-854a-77bb5877fdc3', NULL, 'guest-session-test5-1771008907154', '2026-02-13 18:55:07.196', '2026-02-13 18:55:07.234', '2026-03-15 18:55:07.194', 850.00, 0.00, 100.00, 0.00, 950.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('4e702325-1123-4600-a21c-af167e150ec4', NULL, 'guest-session-test1-1771008950870', '2026-02-13 18:55:50.879', '2026-02-13 18:55:50.97', '2026-03-15 18:55:50.877', 5000.00, 0.00, 100.00, 0.00, 5100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('658dda60-618a-411a-9b36-48938237f142', NULL, 'guest-session-test5-1771008953603', '2026-02-13 18:55:53.629', '2026-02-13 18:55:53.659', '2026-03-15 18:55:53.625', 850.00, 0.00, 100.00, 0.00, 950.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('ce62b747-7c36-4cc5-968d-ea8f9b8e9084', NULL, 'guest-session-test3-1771008952151', '2026-02-13 18:55:52.163', '2026-02-13 18:55:52.363', '2026-03-15 18:55:52.162', 10000.00, 0.00, 100.00, 0.00, 10100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('2d88d243-f873-4477-b772-396e0caf8403', NULL, 'guest-session-test4-1771008952871', '2026-02-13 18:55:53.005', '2026-02-13 18:55:53.049', '2026-03-15 18:55:53.003', 2550.00, 0.00, 100.00, 0.00, 2650.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('04f7e88c-93c5-41b5-b8da-f28979634540', NULL, 'guest-session-test4-1771008952871', '2026-02-13 18:55:52.892', '2026-02-13 18:55:53.09', '2026-03-15 18:55:52.89', 10000.00, 0.00, 100.00, 0.00, 10100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('a0527266-6d5f-4e7f-90cc-fc85f917e683', 'test-superadmin-001', NULL, '2026-02-10 19:20:43.431', '2026-02-13 20:42:21.326', NULL, 0.00, 0.00, 100.00, 0.00, 100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('b579d190-9eb5-4689-a2a5-1e33e3380779', NULL, 'guest-session-test1-1771009074043', '2026-02-13 18:57:54.056', '2026-02-13 18:57:54.143', '2026-03-15 18:57:54.055', 5000.00, 0.00, 100.00, 0.00, 5100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('494b71b8-8916-48e5-ba8d-07fb5ab98a0e', NULL, 'guest-session-test2-1771009074662', '2026-02-13 18:57:54.668', '2026-02-13 18:57:54.695', '2026-03-15 18:57:54.667', 5000.00, 0.00, 100.00, 0.00, 5100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('af6ca6a1-1293-4ece-9fba-0c3016cd4d12', NULL, 'guest-session-test2-1771009343892', '2026-02-13 19:02:23.904', '2026-02-13 19:02:23.95', '2026-03-15 19:02:23.902', 5000.00, 0.00, 100.00, 0.00, 5100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('2967017d-7704-4cfd-b53f-a70142d6dab5', NULL, 'guest-session-test3-1771009075230', '2026-02-13 18:57:55.238', '2026-02-13 18:57:55.432', '2026-03-15 18:57:55.237', 10000.00, 0.00, 100.00, 0.00, 10100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('f82465ac-0a11-44aa-a716-50859a76a8d8', NULL, 'guest-session-test4-1771009075954', '2026-02-13 18:57:56.032', '2026-02-13 18:57:56.067', '2026-03-15 18:57:56.031', 2550.00, 0.00, 100.00, 0.00, 2650.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('0d9bf0d2-7bb2-4b9a-a402-eded3ba746c9', NULL, 'guest-session-test4-1771009075954', '2026-02-13 18:57:55.982', '2026-02-13 18:57:56.104', '2026-03-15 18:57:55.981', 10000.00, 0.00, 100.00, 0.00, 10100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('42988576-0bde-4771-b50e-af1d9ec51b4d', NULL, 'guest-session-test5-1771009076612', '2026-02-13 18:57:56.643', '2026-02-13 18:57:56.687', '2026-03-15 18:57:56.642', 850.00, 0.00, 100.00, 0.00, 950.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('d17f1daa-ae08-47a6-b512-140ccb11254c', NULL, 'guest-session-test1-1771009162593', '2026-02-13 18:59:22.605', '2026-02-13 18:59:22.768', '2026-03-15 18:59:22.604', 5000.00, 0.00, 100.00, 0.00, 5100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('b2bf2413-db63-4c2f-b647-6599ba3c5175', NULL, 'guest-session-test2-1771009163291', '2026-02-13 18:59:23.306', '2026-02-13 18:59:23.361', '2026-03-15 18:59:23.305', 5000.00, 0.00, 100.00, 0.00, 5100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('54bccabd-a276-4373-84cd-1e2a0cc6222f', NULL, 'guest-session-test3-1771009344488', '2026-02-13 19:02:24.495', '2026-02-13 19:02:24.658', '2026-03-15 19:02:24.494', 10000.00, 0.00, 100.00, 0.00, 10100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('4f6a37b5-6668-4c98-b93e-a5e4bbfeb063', NULL, 'guest-session-test3-1771009163932', '2026-02-13 18:59:24.198', '2026-02-13 18:59:24.863', '2026-03-15 18:59:24.196', 10000.00, 0.00, 100.00, 0.00, 10100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('dc83beb7-dea2-4ffd-86aa-be7fde046784', NULL, 'guest-session-test4-1771009165372', '2026-02-13 18:59:25.458', '2026-02-13 18:59:25.488', '2026-03-15 18:59:25.457', 2550.00, 0.00, 100.00, 0.00, 2650.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('bfb0d39c-6427-45a5-a512-d574eb8f477b', NULL, 'guest-session-test4-1771009165372', '2026-02-13 18:59:25.405', '2026-02-13 18:59:25.515', '2026-03-15 18:59:25.404', 10000.00, 0.00, 100.00, 0.00, 10100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('0035d8b0-3fa1-47ed-9d11-266ef2d4c20e', NULL, 'guest-session-test5-1771009166030', '2026-02-13 18:59:26.059', '2026-02-13 18:59:26.092', '2026-03-15 18:59:26.057', 850.00, 0.00, 100.00, 0.00, 950.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('6b5e3b8a-66a9-438a-8e30-a96b4385045e', NULL, 'guest-session-test1-1771009255888', '2026-02-13 19:00:55.897', '2026-02-13 19:00:55.985', '2026-03-15 19:00:55.896', 5000.00, 0.00, 100.00, 0.00, 5100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('a69259da-b4f2-4fbf-9dc1-e0d030245311', NULL, 'guest-session-test2-1771009256499', '2026-02-13 19:00:56.511', '2026-02-13 19:00:56.544', '2026-03-15 19:00:56.51', 5000.00, 0.00, 100.00, 0.00, 5100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('47b8cfbc-2a61-4dd6-9919-ba0fbf353baa', NULL, 'guest-session-test3-1771009257078', '2026-02-13 19:00:57.086', '2026-02-13 19:00:57.249', '2026-03-15 19:00:57.085', 10000.00, 0.00, 100.00, 0.00, 10100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('5b6be18b-c188-483a-9704-c29f7c28ff7c', NULL, 'guest-session-test4-1771009345177', '2026-02-13 19:02:25.797', '2026-02-13 19:02:25.849', '2026-03-15 19:02:25.796', 2550.00, 0.00, 100.00, 0.00, 2650.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('7a04469e-9102-4a69-859a-fee90e03af11', NULL, 'guest-session-test4-1771009257769', '2026-02-13 19:00:57.857', '2026-02-13 19:00:57.911', '2026-03-15 19:00:57.856', 2550.00, 0.00, 100.00, 0.00, 2650.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('f66ce221-aa2a-47b1-8760-0eef66ab0d12', NULL, 'guest-session-test4-1771009257769', '2026-02-13 19:00:57.792', '2026-02-13 19:00:57.948', '2026-03-15 19:00:57.791', 10000.00, 0.00, 100.00, 0.00, 10100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('9be5e98a-3e70-4533-ac53-4df652fb67e6', NULL, 'guest-session-test5-1771009258459', '2026-02-13 19:00:58.491', '2026-02-13 19:00:58.535', '2026-03-15 19:00:58.49', 850.00, 0.00, 100.00, 0.00, 950.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('f2f3fa14-2d8d-485b-b159-ef6539b62ddd', NULL, 'guest-session-test4-1771009345177', '2026-02-13 19:02:25.219', '2026-02-13 19:02:25.884', '2026-03-15 19:02:25.218', 10000.00, 0.00, 100.00, 0.00, 10100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('a1759545-ecf1-4aaf-a8b7-d972a211e82b', NULL, 'guest-session-test1-1771009343180', '2026-02-13 19:02:23.209', '2026-02-13 19:02:23.365', '2026-03-15 19:02:23.207', 5000.00, 0.00, 100.00, 0.00, 5100.00, 'active');
INSERT INTO public.carts (id, user_id, session_id, created_at, updated_at, expires_at, subtotal, tax, shipping_cost, discount, total, status) VALUES ('013ba0ea-d558-48ca-8b9d-1a72de4e8b68', NULL, 'guest-session-test5-1771009346407', '2026-02-13 19:02:26.432', '2026-02-13 19:02:26.465', '2026-03-15 19:02:26.432', 850.00, 0.00, 100.00, 0.00, 950.00, 'active');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") VALUES ('2829f167-4aa0-4ac9-9fc9-a88812e98ef2', 'Laptops', 'laptops', 'Laptops', NULL, 0, '2026-02-01 03:52:52.52', 0, '/uploads/categories/category-1770456984826-142820620.jpg', '/uploads/categories/category-1770456980876-789045081.jpg', 'Laptops', 'Laptops', 'Laptops', 'Laptops', 'Laptops', 'active', '2026-02-07 09:36:32.922');
INSERT INTO public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") VALUES ('7f5a0291-ac67-4a3a-9e5b-15a78ae71866', 'Constraint Test Category', 'constraint-test-cat-1770735732246', NULL, NULL, 0, '2026-02-10 15:02:12.248', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-10 15:02:12.248');
INSERT INTO public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") VALUES ('580818ba-ca76-48e9-95ff-18e97d1ca6d1', 'Slug Test Category', 'slug-test-cat-1770735732653', NULL, NULL, 0, '2026-02-10 15:02:12.654', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-10 15:02:12.654');
INSERT INTO public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") VALUES ('1cd82d6b-d04b-4a3d-836e-7f2fe4d07b34', 'HP Laptop', 'hp-laptop', 'HP Laptop', '2829f167-4aa0-4ac9-9fc9-a88812e98ef2', 0, '2026-02-01 03:56:08.996', 0, NULL, NULL, 'HP Laptop', 'HP Laptop', 'HP Laptop', 'HP Laptop', 'HP Laptop', 'active', '2026-02-01 03:56:08.996');
INSERT INTO public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") VALUES ('d4317da1-c477-49f0-8d8d-1f383ff19688', 'Dell Laptop', 'dell-laptop', 'Dell Laptop', '2829f167-4aa0-4ac9-9fc9-a88812e98ef2', 0, '2026-02-01 03:57:09.008', 1, NULL, NULL, 'Dell Laptop', 'Dell Laptop', 'Dell Laptop', 'Dell Laptop', 'Dell Laptop', 'active', '2026-02-01 03:57:09.008');
INSERT INTO public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") VALUES ('384f8b71-756d-48ca-9406-b173284926f1', 'Acer Laptop', 'acer-laptop', 'Acer Laptop', '2829f167-4aa0-4ac9-9fc9-a88812e98ef2', 0, '2026-02-01 03:58:12.694', 2, NULL, NULL, 'Acer Laptop', 'Acer Laptop', 'Acer Laptop', 'Acer Laptop', 'Acer Laptop', 'active', '2026-02-01 03:58:12.694');
INSERT INTO public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") VALUES ('8308aa41-41a6-4651-8efb-12fda926ba7e', 'Tablets', 'tablets', 'Tablets', NULL, 0, '2026-02-01 03:59:25.372', 1, NULL, NULL, 'Tablets', 'Tablets', 'Tablets', 'Tablets', 'Tablets', 'active', '2026-02-01 03:59:25.372');
INSERT INTO public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") VALUES ('0474b1f2-c49b-4166-aabc-9042d2397087', 'Lenovo Tablet', 'lenovo-tablet', 'Lenovo Tablet', '8308aa41-41a6-4651-8efb-12fda926ba7e', 0, '2026-02-01 04:01:47.304', 0, NULL, NULL, 'Lenovo Tablet', 'Lenovo Tablet', 'Lenovo Tablet', 'Lenovo Tablet', 'Lenovo Tablet', 'active', '2026-02-01 04:01:47.304');
INSERT INTO public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") VALUES ('a492016b-a0e1-47ba-8566-c5342a14f381', 'Lenovo Tablet 1', 'lenovo-tablet-1', 'Lenovo Tablet 1', '0474b1f2-c49b-4166-aabc-9042d2397087', 0, '2026-02-01 04:02:31.817', 0, NULL, NULL, 'Lenovo Tablet 1', 'Lenovo Tablet 1', 'Lenovo Tablet 1', 'Lenovo Tablet 1', 'Lenovo Tablet 1', 'active', '2026-02-01 04:02:31.817');
INSERT INTO public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") VALUES ('676bf4dd-047b-470c-acbc-2d8f01c76858', 'Bulk Category 1', 'bulk-category-1-1770025255391-0xiyzd6we', NULL, NULL, 0, '2026-02-02 09:40:55.403', 0, NULL, NULL, NULL, NULL, NULL, NULL, 'Bulk Category 1', 'active', '2026-02-02 09:40:55.403');
INSERT INTO public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") VALUES ('5a362576-493f-4245-b11a-cf05629aaa4b', 'Bulk Category 2', 'bulk-category-2-1770025255391-fp9543hw4', NULL, NULL, 0, '2026-02-02 09:40:55.403', 0, NULL, NULL, NULL, NULL, NULL, NULL, 'Bulk Category 2', 'active', '2026-02-02 09:40:55.403');
INSERT INTO public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") VALUES ('6283121d-dc40-41af-a168-a9d0b0226bbf', 'New Category', 'new-category-1770138096107-bo90iwx3k', NULL, NULL, 0, '2026-02-03 17:01:36.109', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-03 17:01:36.109');
INSERT INTO public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") VALUES ('738c15fd-1e9c-4afa-902c-3e43cfe4f128', 'New Category', 'new-category-1770025259881-y4n94h2rx', NULL, NULL, 0, '2026-02-02 09:40:59.883', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-02 09:40:59.883');
INSERT INTO public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") VALUES ('7b3d0459-a4c3-4972-b365-8a07221222f6', 'New Category', 'new-category-1770735752853-zjj2ba6bm', NULL, NULL, 0, '2026-02-10 15:02:32.856', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-10 15:02:32.856');
INSERT INTO public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") VALUES ('5e942546-4130-4df0-967e-e7f720c1c10a', 'Bulk Category 1', 'bulk-category-1-1770735739870-m3q4layyk', NULL, NULL, 0, '2026-02-10 15:02:19.876', 0, NULL, NULL, NULL, NULL, NULL, NULL, 'Bulk Category 1', 'active', '2026-02-10 15:02:19.876');
INSERT INTO public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") VALUES ('a49bb511-510f-48c7-8f5d-30c7f454758c', 'Bulk Category 2', 'bulk-category-2-1770735739870-ywcpt2kv3', NULL, NULL, 0, '2026-02-10 15:02:19.876', 0, NULL, NULL, NULL, NULL, NULL, NULL, 'Bulk Category 2', 'active', '2026-02-10 15:02:19.876');
INSERT INTO public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") VALUES ('9da69659-fc99-40a9-9e7f-03d4e8639ef0', 'Constraint Test Category', 'constraint-test-cat-1770228988337', NULL, NULL, 0, '2026-02-04 18:16:28.339', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-04 18:16:28.339');
INSERT INTO public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") VALUES ('c15b674c-3898-4a08-88a3-3289f4a846f1', 'Slug Test Category', 'slug-test-cat-1770228988558', NULL, NULL, 0, '2026-02-04 18:16:28.561', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-04 18:16:28.561');
INSERT INTO public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") VALUES ('ea60b5c7-8db1-4cc3-890e-b5f51242dae6', 'Bulk Category 2', 'bulk-category-2-1770229054132-r237hf3qt', NULL, NULL, 0, '2026-02-04 18:17:34.134', 0, NULL, NULL, NULL, NULL, NULL, NULL, 'Bulk Category 2', 'active', '2026-02-04 18:17:34.134');
INSERT INTO public.categories (id, name, slug, description, "parentId", "sortOrder", "createdAt", "displayOrder", "iconUrl", "imageUrl", "metaDescription", "metaKeywords", "metaTitle", "nameBn", "nameEn", status, "updatedAt") VALUES ('9cba48e0-2d35-4aad-b2cc-d5d8acfc560c', 'New Category', 'new-category-1770229055128-qq8bdkv88', NULL, NULL, 0, '2026-02-04 18:17:35.13', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-04 18:17:35.13');


--
-- Data for Name: comparison_history; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: comparison_share_tokens; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: corporate_accounts; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: corporate_approvals; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: corporate_documents; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: corporate_pricing; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: corporate_users; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: cross_sell_products; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: email_verification_tokens; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.email_verification_tokens (id, "userId", token, "expiresAt", "createdAt") VALUES ('f7e752f6-17e3-49f9-af0a-d1b0db3dd696', '44ac9bed-0c3a-4327-b0b4-102b1a0a00bd', '769077142970c57376bd9383632197973b65573bc32790b2c2998b09be37829e', '2026-02-11 15:03:04.761', '2026-02-10 15:03:04.763');


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES ('2463e13b-920e-464d-ab10-e1e99e06aef2', 'b4267a0c-34f6-4873-b083-9c529f49bdc9', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 1000.00, 1000.00);
INSERT INTO public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES ('02356ef7-a5a1-4b83-9077-cdd8556157bb', 'b4267a0c-34f6-4873-b083-9c529f49bdc9', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00);
INSERT INTO public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES ('733478fa-664d-4ea7-b165-b41e26c57b5b', '17b750be-683b-4ae6-a116-9a3332502c05', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 1000.00, 1000.00);
INSERT INTO public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES ('906164dc-2a03-42d1-a391-7ac1d1670624', '17b750be-683b-4ae6-a116-9a3332502c05', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00);
INSERT INTO public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES ('e2ffbaa1-eaf1-4ba7-b23a-3534a7ddc96f', 'fe5e7f65-7158-4f20-8314-0b5f36081614', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 1000.00, 1000.00);
INSERT INTO public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES ('f2c1519c-cf1c-475f-97b5-4f4fabea6d85', 'fe5e7f65-7158-4f20-8314-0b5f36081614', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00);
INSERT INTO public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES ('5d93a77c-abb4-41ae-9821-bae8231223a9', '45bfd340-0f6c-45f1-805c-5e64ca378459', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 850.00, 850.00);
INSERT INTO public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES ('08252b6d-8dd0-463c-8dd3-a2ed398c0292', '45bfd340-0f6c-45f1-805c-5e64ca378459', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00);
INSERT INTO public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES ('0fd09b14-c6fb-4e26-9c88-cb1337e879dc', '3a4acc93-8a1b-41f8-ada5-c3cebe0e906a', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 850.00, 850.00);
INSERT INTO public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES ('1fec6da6-117d-417b-a855-61fa4bb04b8e', '3a4acc93-8a1b-41f8-ada5-c3cebe0e906a', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00);
INSERT INTO public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES ('2b217e01-8d85-45b2-826f-9386db187702', 'c45cc65d-38d0-42f4-adbd-5bc8141e1f7e', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 850.00, 850.00);
INSERT INTO public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES ('e6a45b32-0675-4ccf-a6ff-1448c796e2a8', 'c45cc65d-38d0-42f4-adbd-5bc8141e1f7e', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00);
INSERT INTO public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES ('9250f96c-c497-4cfc-a7b8-d8bb7e920ae2', 'a05ea4e1-278e-4bd4-b463-82a82d33664c', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 850.00, 850.00);
INSERT INTO public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES ('4fbc5ca8-7784-4123-8bdc-1a61fd1518e0', '67443a71-1d03-4077-8ba6-9c745d5a6b2c', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 850.00, 850.00);
INSERT INTO public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES ('89a8b772-523e-4ecd-ac8f-d7beb9eb8b86', '67443a71-1d03-4077-8ba6-9c745d5a6b2c', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00);
INSERT INTO public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES ('73c1e5dc-1d29-4b43-99a9-5d0dea93151a', '83f4653e-9d54-431b-98c4-797318a0dd2c', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 850.00, 850.00);
INSERT INTO public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES ('ca910dbf-8dbc-4905-b9a4-6697b018980e', '83f4653e-9d54-431b-98c4-797318a0dd2c', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 1, 5000.00, 5000.00);
INSERT INTO public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES ('c7317de9-c299-4bb9-9908-d6bcb6e2b8b3', '831fecf5-ab78-4417-bccf-ae322aea0e87', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 850.00, 850.00);
INSERT INTO public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES ('14f19f71-32fe-4f40-9d58-0146efcd5dee', '5f01237f-e911-42e9-8b04-73effe98a1ae', 'c571ed71-fd5b-4158-ad6d-87405e75f046', NULL, 1, 850.00, 850.00);
INSERT INTO public.order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES ('a5e9e4af-119c-469a-8f23-657f1162c1bd', '5f01237f-e911-42e9-8b04-73effe98a1ae', '4010caae-464e-4787-ad8f-ee04096100d0', NULL, 2, 5000.00, 10000.00);


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.orders (id, "orderNumber", "userId", "addressId", subtotal, tax, "shippingCost", discount, total, "paymentMethod", "paymentStatus", "paidAt", status, notes, "internalNotes", "createdAt", "updatedAt", "confirmedAt", "shippedAt", "deliveredAt", corporate_account_id) VALUES ('b4267a0c-34f6-4873-b083-9c529f49bdc9', 'ORD1770931924340241', '2bdca14e-ac33-43ca-b98a-5117c8ecdeb9', '7fb0a0a7-2b9b-4f85-9a8a-b9f78de6e0df', 6000.00, 900.00, 100.00, 0.00, 7000.00, 'cash_on_delivery', 'pending', NULL, 'pending', '', NULL, '2026-02-12 21:32:04.342', '2026-02-12 21:32:04.342', NULL, NULL, NULL, NULL);
INSERT INTO public.orders (id, "orderNumber", "userId", "addressId", subtotal, tax, "shippingCost", discount, total, "paymentMethod", "paymentStatus", "paidAt", status, notes, "internalNotes", "createdAt", "updatedAt", "confirmedAt", "shippedAt", "deliveredAt", corporate_account_id) VALUES ('17b750be-683b-4ae6-a116-9a3332502c05', 'ORD1770932063030556', '2bdca14e-ac33-43ca-b98a-5117c8ecdeb9', '7fb0a0a7-2b9b-4f85-9a8a-b9f78de6e0df', 6000.00, 900.00, 100.00, 0.00, 7000.00, 'cash_on_delivery', 'pending', NULL, 'confirmed', '', NULL, '2026-02-12 21:34:23.031', '2026-02-13 07:55:43.09', '2026-02-13 07:55:43.089', NULL, NULL, NULL);
INSERT INTO public.orders (id, "orderNumber", "userId", "addressId", subtotal, tax, "shippingCost", discount, total, "paymentMethod", "paymentStatus", "paidAt", status, notes, "internalNotes", "createdAt", "updatedAt", "confirmedAt", "shippedAt", "deliveredAt", corporate_account_id) VALUES ('fe5e7f65-7158-4f20-8314-0b5f36081614', 'ORD1770977328305933', '2bdca14e-ac33-43ca-b98a-5117c8ecdeb9', '7fb0a0a7-2b9b-4f85-9a8a-b9f78de6e0df', 6000.00, 900.00, 100.00, 0.00, 7000.00, 'cash_on_delivery', 'pending', NULL, 'pending', '', NULL, '2026-02-13 10:08:48.306', '2026-02-13 10:08:48.306', NULL, NULL, NULL, NULL);
INSERT INTO public.orders (id, "orderNumber", "userId", "addressId", subtotal, tax, "shippingCost", discount, total, "paymentMethod", "paymentStatus", "paidAt", status, notes, "internalNotes", "createdAt", "updatedAt", "confirmedAt", "shippedAt", "deliveredAt", corporate_account_id) VALUES ('45bfd340-0f6c-45f1-805c-5e64ca378459', 'ORD177098084778865', '2bdca14e-ac33-43ca-b98a-5117c8ecdeb9', '7fb0a0a7-2b9b-4f85-9a8a-b9f78de6e0df', 5850.00, 0.00, 100.00, 150.00, 5800.00, 'cash_on_delivery', 'pending', NULL, 'confirmed', '', NULL, '2026-02-13 11:07:27.79', '2026-02-13 11:08:30.898', '2026-02-13 11:08:30.897', NULL, NULL, NULL);
INSERT INTO public.orders (id, "orderNumber", "userId", "addressId", subtotal, tax, "shippingCost", discount, total, "paymentMethod", "paymentStatus", "paidAt", status, notes, "internalNotes", "createdAt", "updatedAt", "confirmedAt", "shippedAt", "deliveredAt", corporate_account_id) VALUES ('3a4acc93-8a1b-41f8-ada5-c3cebe0e906a', 'ORD1770998107950666', '2bdca14e-ac33-43ca-b98a-5117c8ecdeb9', '7fb0a0a7-2b9b-4f85-9a8a-b9f78de6e0df', 10850.00, 0.00, 100.00, 150.00, 10800.00, 'cash_on_delivery', 'pending', NULL, 'pending', '', NULL, '2026-02-13 15:55:07.954', '2026-02-13 15:55:07.954', NULL, NULL, NULL, NULL);
INSERT INTO public.orders (id, "orderNumber", "userId", "addressId", subtotal, tax, "shippingCost", discount, total, "paymentMethod", "paymentStatus", "paidAt", status, notes, "internalNotes", "createdAt", "updatedAt", "confirmedAt", "shippedAt", "deliveredAt", corporate_account_id) VALUES ('c45cc65d-38d0-42f4-adbd-5bc8141e1f7e', 'ORD1770998605760578', '2bdca14e-ac33-43ca-b98a-5117c8ecdeb9', '7fb0a0a7-2b9b-4f85-9a8a-b9f78de6e0df', 5850.00, 0.00, 100.00, 150.00, 5800.00, 'cash_on_delivery', 'pending', NULL, 'pending', '', NULL, '2026-02-13 16:03:25.762', '2026-02-13 16:03:25.762', NULL, NULL, NULL, NULL);
INSERT INTO public.orders (id, "orderNumber", "userId", "addressId", subtotal, tax, "shippingCost", discount, total, "paymentMethod", "paymentStatus", "paidAt", status, notes, "internalNotes", "createdAt", "updatedAt", "confirmedAt", "shippedAt", "deliveredAt", corporate_account_id) VALUES ('a05ea4e1-278e-4bd4-b463-82a82d33664c', 'ORD1770999698696682', '2bdca14e-ac33-43ca-b98a-5117c8ecdeb9', '7fb0a0a7-2b9b-4f85-9a8a-b9f78de6e0df', 850.00, 0.00, 100.00, 150.00, 800.00, 'cash_on_delivery', 'pending', NULL, 'pending', '', NULL, '2026-02-13 16:21:38.698', '2026-02-13 16:21:38.698', NULL, NULL, NULL, NULL);
INSERT INTO public.orders (id, "orderNumber", "userId", "addressId", subtotal, tax, "shippingCost", discount, total, "paymentMethod", "paymentStatus", "paidAt", status, notes, "internalNotes", "createdAt", "updatedAt", "confirmedAt", "shippedAt", "deliveredAt", corporate_account_id) VALUES ('67443a71-1d03-4077-8ba6-9c745d5a6b2c', 'ORD1771001390589346', '2bdca14e-ac33-43ca-b98a-5117c8ecdeb9', '7fb0a0a7-2b9b-4f85-9a8a-b9f78de6e0df', 5850.00, 0.00, 0.00, 0.00, 5850.00, 'cash_on_delivery', 'pending', NULL, 'pending', '', NULL, '2026-02-13 16:49:50.59', '2026-02-13 16:49:50.59', NULL, NULL, NULL, NULL);
INSERT INTO public.orders (id, "orderNumber", "userId", "addressId", subtotal, tax, "shippingCost", discount, total, "paymentMethod", "paymentStatus", "paidAt", status, notes, "internalNotes", "createdAt", "updatedAt", "confirmedAt", "shippedAt", "deliveredAt", corporate_account_id) VALUES ('83f4653e-9d54-431b-98c4-797318a0dd2c', 'ORD1771001463220535', '2bdca14e-ac33-43ca-b98a-5117c8ecdeb9', '7fb0a0a7-2b9b-4f85-9a8a-b9f78de6e0df', 5850.00, 0.00, 0.00, 0.00, 5850.00, 'cash_on_delivery', 'pending', NULL, 'pending', '', NULL, '2026-02-13 16:51:03.221', '2026-02-13 16:51:03.221', NULL, NULL, NULL, NULL);
INSERT INTO public.orders (id, "orderNumber", "userId", "addressId", subtotal, tax, "shippingCost", discount, total, "paymentMethod", "paymentStatus", "paidAt", status, notes, "internalNotes", "createdAt", "updatedAt", "confirmedAt", "shippedAt", "deliveredAt", corporate_account_id) VALUES ('831fecf5-ab78-4417-bccf-ae322aea0e87', 'ORD1771001517205252', '2bdca14e-ac33-43ca-b98a-5117c8ecdeb9', '7fb0a0a7-2b9b-4f85-9a8a-b9f78de6e0df', 850.00, 0.00, 100.00, 0.00, 950.00, 'cash_on_delivery', 'pending', NULL, 'confirmed', '', NULL, '2026-02-13 16:51:57.206', '2026-02-13 16:57:49.758', '2026-02-13 16:57:49.757', NULL, NULL, NULL);
INSERT INTO public.orders (id, "orderNumber", "userId", "addressId", subtotal, tax, "shippingCost", discount, total, "paymentMethod", "paymentStatus", "paidAt", status, notes, "internalNotes", "createdAt", "updatedAt", "confirmedAt", "shippedAt", "deliveredAt", corporate_account_id) VALUES ('5f01237f-e911-42e9-8b04-73effe98a1ae', 'ORD1771015185106699', '2bdca14e-ac33-43ca-b98a-5117c8ecdeb9', '7fb0a0a7-2b9b-4f85-9a8a-b9f78de6e0df', 10850.00, 0.00, 0.00, 0.00, 10850.00, 'cash_on_delivery', 'pending', NULL, 'pending', '', NULL, '2026-02-13 20:39:45.107', '2026-02-13 20:39:45.107', NULL, NULL, NULL, NULL);


--
-- Data for Name: password_history; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.password_history (id, "userId", "passwordHash", "createdAt") VALUES ('52237e65-b43a-43f8-961b-98ad5cce9a86', '35c1d3fe-3ccb-4730-b1d2-dce186ac7431', '$2a$12$t.pmBi.66xkmtI2FWH3u8efYED/pVBYntBDbT2PRwWMxlwGR85XKa', '2026-02-08 20:07:32.846');
INSERT INTO public.password_history (id, "userId", "passwordHash", "createdAt") VALUES ('ca2dd988-8ff9-41e4-864a-695424f1a089', '9c18a472-b362-4bb7-9a4f-29563472317a', '$2a$12$AnhF8qP9M3Z.uxFK9gSQfuHxEay4HOsQEnEBXuRzuwea83EPx1I42', '2026-02-08 20:10:15.545');
INSERT INTO public.password_history (id, "userId", "passwordHash", "createdAt") VALUES ('5f82cb1b-e7c8-465c-95fc-1766c0f2d829', 'bb810626-a9ed-4ef1-a3e2-ef5ea504fa87', '$2a$12$wdEE95vDnb3MEyy3Fa7MMOhupYww/46TQDeRGBC80ScqlUGYT5ra.', '2026-02-09 04:06:17.973');
INSERT INTO public.password_history (id, "userId", "passwordHash", "createdAt") VALUES ('bc9745ab-f1cc-446f-a58f-c5eb7ac97b21', '84672403-5f9f-4d77-8f01-795a3fc6e3ae', '$2a$12$FQtSCgqbu5HC56aN606QqusxzsClul4IevUPbXqSvoM..XR8tCCwK', '2026-02-09 15:48:51.898');
INSERT INTO public.password_history (id, "userId", "passwordHash", "createdAt") VALUES ('110598af-eb56-4ac7-97c2-7848cbec737b', '44ac9bed-0c3a-4327-b0b4-102b1a0a00bd', '$2a$12$8bgm.GrpZtQrlm.sAF.WxuPsKfAiP.Fyk7AuvEtamr7FDmZGljcTW', '2026-02-10 15:03:04.719');


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('18052c3d-aa84-48b8-8fd0-bee55538b7b9', 'user:read', 'user', 'read', 'View user information', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('4449d6d4-ecfe-4146-9b4b-ae86d9d75d80', 'user:create', 'user', 'create', 'Create new users', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('6c81487e-5d73-47f0-89b9-618cc6f32232', 'user:update', 'user', 'update', 'Update user information', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('06216b84-3695-41b5-8325-c2919f3d3eac', 'user:delete', 'user', 'delete', 'Delete users', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('1363aa55-bc45-4b65-bd40-21f80f37df30', 'user:assign_role', 'user', 'assign_role', 'Assign roles to users', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('f3a72737-6c39-4a7d-8a9b-8adeb6f01a04', 'product:read', 'product', 'read', 'View products', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('f96f95ec-1502-4609-8802-80f775782ba0', 'product:create', 'product', 'create', 'Create new products', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('d3e1ed4e-822e-49ba-83af-074b44ccf3fc', 'product:update', 'product', 'update', 'Update product information', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('a307e6cb-53ec-415b-9289-38b7d692a83e', 'product:delete', 'product', 'delete', 'Delete products', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('c0ac7de9-27ff-4ce1-9929-582449fd7492', 'order:read', 'order', 'read', 'View orders', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('ac2f7497-dc35-4b3c-9c4c-1adb4b86e57f', 'order:create', 'order', 'create', 'Create orders', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('bbaae6c8-9351-49ef-a2af-3e5ef0b2be79', 'order:update', 'order', 'update', 'Update order information', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('fbcb991b-20a2-41d9-80fb-aef865ef76e0', 'order:delete', 'order', 'delete', 'Delete orders', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('0b224c6f-a9f8-4450-9481-87eec23b8b3a', 'order:manage_status', 'order', 'manage_status', 'Manage order status', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('55c8257e-f5a6-48fb-8265-59c08d695405', 'category:read', 'category', 'read', 'View categories', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('96029482-e5e2-46b0-91d6-972ac8f176dd', 'category:create', 'category', 'create', 'Create new categories', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('35f807da-21b7-466f-85e2-5b958e10bf5a', 'category:update', 'category', 'update', 'Update category information', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('e3cb3d9c-22fc-4193-b45c-464c8b64fb9b', 'category:delete', 'category', 'delete', 'Delete categories', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('fc6234f8-aa04-4825-9d8e-3e5801ff106f', 'brand:read', 'brand', 'read', 'View brands', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('947ea574-03e8-4854-82f4-13b1703b96de', 'brand:create', 'brand', 'create', 'Create new brands', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('9ca2b5d6-562e-4025-8337-ab54e9735fa9', 'brand:update', 'brand', 'update', 'Update brand information', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('e94e27d3-e568-4369-b691-05c5f8bf8c73', 'brand:delete', 'brand', 'delete', 'Delete brands', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('7dc33bbb-9178-4f11-bbad-51e1a2986b29', 'review:read', 'review', 'read', 'View reviews', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('83435a52-986b-4dad-b731-172ec37df140', 'review:create', 'review', 'create', 'Create reviews', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('2394c9c2-9f05-4a80-b895-283e07368142', 'review:manage', 'review', 'manage', 'Manage reviews (approve/delete)', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('a3e9ceba-29dc-47ef-b4a3-3f9bcfe90320', 'analytics:view', 'analytics', 'view', 'View analytics dashboard', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('b080199d-2beb-48ff-b482-db0d63b6e5a8', 'analytics:export', 'analytics', 'export', 'Export analytics data', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('b0e453b3-cf2b-47b5-8555-ccefb83ef646', 'support:read', 'support', 'read', 'View support tickets', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('3f576e85-b27e-4c1b-8fb9-f362d670580c', 'support:respond', 'support', 'respond', 'Respond to support tickets', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('31d0301e-b13d-4c69-9b3a-8a997f91ca9c', 'support:manage', 'support', 'manage', 'Manage support tickets', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('86658291-5002-4391-86c7-944d7801a197', 'corporate:read', 'corporate', 'read', 'View corporate accounts', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('5dea5965-1929-4ec0-9437-d363d6d8b172', 'corporate:create', 'corporate', 'create', 'Create corporate accounts', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('f7042b4c-1797-4e40-bb21-5ee222f1ec60', 'corporate:update', 'corporate', 'update', 'Update corporate accounts', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('d0a1b4ce-067d-40a3-bb4c-cbd4b51c26d2', 'corporate:manage_users', 'corporate', 'manage_users', 'Manage corporate users', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('3e3ec705-b314-456a-bf19-70a963c9fb09', 'system:config', 'system', 'config', 'Configure system settings', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('1ce64ae3-84c2-440e-ac1d-99b8462bfc64', 'system:logs', 'system', 'logs', 'View system logs', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('cec23cd5-5ae5-444e-b271-9bef9acf0ef1', 'system:backup', 'system', 'backup', 'Create system backups', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('f7e97b0b-abf5-411d-8de5-20e64dd914de', 'cart:analytics', 'cart', 'analytics', 'View cart analytics data', '2026-02-07 19:08:12.754017+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('22e19aa9-eacf-4b6a-a8e3-9fbc6b25f8b1', 'cart_note:create', 'cart_note', 'create', 'Allows admins to add notes to carts', '2026-02-10 17:25:57.335+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('f6abcc06-d08f-4760-9b20-34e7d27da8bd', 'cart_note:read', 'cart_note', 'read', 'Allows admins to view notes on carts', '2026-02-10 17:25:57.358+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('1e1d96b3-9e8d-433e-81a6-dbbbfdafa436', 'cart_note:update', 'cart_note', 'update', 'Allows admins to edit notes on carts', '2026-02-10 17:25:57.366+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('9691d18c-1c08-4cbd-add8-2066ead116f2', 'cart_note:delete', 'cart_note', 'delete', 'Allows admins to delete notes from carts', '2026-02-10 17:25:57.374+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('693d4e75-dff5-43c6-874c-4cf3714d4d8d', 'cart_audit:read', 'cart_audit', 'read', 'Allows admins to view cart modification history', '2026-02-10 17:25:57.382+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('4598a3a3-2a54-40d4-b2b2-0722a423e495', 'cart_audit:rollback', 'cart_audit', 'rollback', 'Allows admins to rollback cart modifications', '2026-02-10 17:25:57.389+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('c4d287a8-2dee-4599-acfd-52b6f7341930', 'cart_audit:export', 'cart_audit', 'export', 'Allows admins to export cart audit logs', '2026-02-10 17:25:57.397+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('6e928804-f784-4108-a2cf-e25f0a40fe5e', 'cart:delete', 'cart', 'delete', 'Delete/cleanup expired carts, reservations, and run full cleanup', '2026-02-07 19:08:12.754017+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('0a0e4335-5c7a-4fab-b403-8aecf5fa8e62', 'cart:write', 'cart', 'write', 'Mark carts as abandoned and send recovery reminders', '2026-02-07 19:08:12.754017+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('0d7ff35e-31c6-45c1-a03a-ae4481b7b6cc', 'cart:read', 'cart', 'read', 'View cleanup statistics, history, and scheduler status', '2026-02-07 19:08:12.754017+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('d3379b4f-5c0a-4a52-9de3-9cf256fc3dbb', 'cart:admin', 'cart', 'admin', 'Manage cleanup scheduler - start/stop and run manual jobs', '2026-02-10 17:41:36.782+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('9849bd2a-8936-4675-b26d-56f1bbfd0daa', 'discount:read', 'discount', 'read', 'View all admin discounts', '2026-02-10 18:03:22.949+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('ba731a3e-2652-4fe3-8d7b-ef56c91ef947', 'discount:read:own', 'discount', 'read:own', 'View discounts created by self', '2026-02-10 18:03:22.965+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('d96a762d-5297-4fb1-a220-fa89424a1cd2', 'discount:write', 'discount', 'write', 'Create and update admin discounts', '2026-02-10 18:03:22.972+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('0d700759-e013-4dcb-a06d-5ff38c63f6d0', 'discount:create', 'discount', 'create', 'Create new discount codes', '2026-02-10 18:03:22.979+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('db2fe425-b1f7-42a3-8574-671a5ab4c8ed', 'discount:update', 'discount', 'update', 'Update existing discount codes', '2026-02-10 18:03:22.987+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('f66f304d-87d6-4426-849a-ab04071c1446', 'discount:delete', 'discount', 'delete', 'Deactivate or delete discount codes', '2026-02-10 18:03:22.994+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('b3790f9e-636f-4430-a118-0666862c2e6b', 'cart:discount:apply', 'cart', 'discount:apply', 'Apply discounts to customer carts', '2026-02-10 18:03:23.001+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('23f355f2-a831-4ddd-9cfb-3343a8cb7c1a', 'cart:discount:remove', 'cart', 'discount:remove', 'Remove discounts from customer carts', '2026-02-10 18:03:23.007+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('3f5becc8-f6b3-4b48-b754-a35d4b5d808f', 'cart:discount:view', 'cart', 'discount:view', 'View discount information on carts', '2026-02-10 18:03:23.013+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('403e3b77-eb74-41d1-af18-f865d7b9e01a', 'discount:bulk:apply', 'discount', 'bulk:apply', 'Apply discounts to multiple carts', '2026-02-10 18:03:23.019+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('8cbe2b47-a386-4305-b01d-818b795ddf0a', 'inventory:read', 'inventory', 'read', 'Read inventory reservation data', '2026-02-10 18:05:39.473775+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('cae30d9a-adb2-4f6c-a112-62092f293193', 'inventory:write', 'inventory', 'write', 'Modify inventory reservations (release, confirm)', '2026-02-10 18:05:39.473775+00');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES ('38f1fc6d-0681-4d93-bc8c-f15f768d56e3', 'inventory:admin', 'inventory', 'admin', 'Admin inventory operations (cleanup, bulk actions)', '2026-02-10 18:05:39.473775+00');


--
-- Data for Name: phone_otps; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.product_categories (id, "productId", "categoryId", "isPrimary", "createdAt", "updatedAt") VALUES ('5bb0c7c0-37d4-4eda-adbe-cccf81ed607f', 'c571ed71-fd5b-4158-ad6d-87405e75f046', '1cd82d6b-d04b-4a3d-836e-7f2fe4d07b34', true, '2026-02-03 04:45:09.085', '2026-02-03 04:45:09.085');
INSERT INTO public.product_categories (id, "productId", "categoryId", "isPrimary", "createdAt", "updatedAt") VALUES ('98a1b3f4-1790-4e3f-80c6-5614cfc0b8e0', 'c571ed71-fd5b-4158-ad6d-87405e75f046', '2829f167-4aa0-4ac9-9fc9-a88812e98ef2', false, '2026-02-03 04:45:09.085', '2026-02-03 04:45:09.085');
INSERT INTO public.product_categories (id, "productId", "categoryId", "isPrimary", "createdAt", "updatedAt") VALUES ('64e4bab5-e0bd-4ba9-a821-a0f28cf0dc00', '4010caae-464e-4787-ad8f-ee04096100d0', '8308aa41-41a6-4651-8efb-12fda926ba7e', true, '2026-02-12 08:42:34.573', '2026-02-12 08:42:34.573');
INSERT INTO public.product_categories (id, "productId", "categoryId", "isPrimary", "createdAt", "updatedAt") VALUES ('331ced09-18bd-4df1-96d8-1eb902545b37', '4010caae-464e-4787-ad8f-ee04096100d0', '0474b1f2-c49b-4166-aabc-9042d2397087', false, '2026-02-12 08:42:34.573', '2026-02-12 08:42:34.573');
INSERT INTO public.product_categories (id, "productId", "categoryId", "isPrimary", "createdAt", "updatedAt") VALUES ('79833d48-9fa7-4727-9e9f-6efaa563322c', '4010caae-464e-4787-ad8f-ee04096100d0', 'a492016b-a0e1-47ba-8566-c5342a14f381', false, '2026-02-12 08:42:34.573', '2026-02-12 08:42:34.573');


--
-- Data for Name: product_comparison_items; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: product_comparisons; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('8b440c14-3092-49a6-952d-cdc61fbdf14c', 'c571ed71-fd5b-4158-ad6d-87405e75f046', 0, 'http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954313019_326758816_0_HP-15-fc0659AU-Laptop.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954313019_326758816_0_HP-15-fc0659AU-Laptop_large.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954313019_326758816_0_HP-15-fc0659AU-Laptop_thumb.jpg', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', false, 34010, 'image/jpeg', 500, 500, 'deleted', '2026-02-01 13:58:36.18475+00', '2026-02-01 15:59:43.702271+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('0e3262ed-4991-4eac-98c4-aacf61214e7c', 'c571ed71-fd5b-4158-ad6d-87405e75f046', 0, 'http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954288689_610240233_0_HP-15-fc0659AU-Laptop.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954288689_610240233_0_HP-15-fc0659AU-Laptop_large.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954288689_610240233_0_HP-15-fc0659AU-Laptop_thumb.jpg', 'আপডেট করা অল্ট টেক্সট 1770141257537', 'Updated alt text 1770141257537', true, 34010, 'image/jpeg', 500, 500, 'completed', '2026-02-01 13:58:12.612189+00', '2026-02-03 17:54:21.510357+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('d75dfe19-bbc2-451d-a3f9-5ff79b1bb2f4', 'c571ed71-fd5b-4158-ad6d-87405e75f046', 1, 'http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954292649_221225_1_HP-15-fc0659AU-Laptop-1.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954292649_221225_1_HP-15-fc0659AU-Laptop-1_large.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954292649_221225_1_HP-15-fc0659AU-Laptop-1_thumb.jpg', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', false, 31179, 'image/jpeg', 500, 500, 'deleted', '2026-02-01 13:58:15.61629+00', '2026-02-01 15:59:43.768326+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('4971a1c8-d9ca-4ad6-88e2-0cf58f53f3b7', 'c571ed71-fd5b-4158-ad6d-87405e75f046', 2, 'http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954318838_942318007_2_HP-15-fc0659AU-Laptop-2.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954318838_942318007_2_HP-15-fc0659AU-Laptop-2_large.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954318838_942318007_2_HP-15-fc0659AU-Laptop-2_thumb.jpg', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', false, 30602, 'image/jpeg', 500, 500, 'deleted', '2026-02-01 13:58:41.379909+00', '2026-02-01 15:59:43.890964+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('b067b90d-3428-437e-a1b5-a2acaeab30fa', 'c571ed71-fd5b-4158-ad6d-87405e75f046', 3, 'http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954298854_851451865_3_HP-15-fc0659AU-Laptop-3.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954298854_851451865_3_HP-15-fc0659AU-Laptop-3_large.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954298854_851451865_3_HP-15-fc0659AU-Laptop-3_thumb.jpg', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', false, 13158, 'image/jpeg', 500, 500, 'deleted', '2026-02-01 13:58:23.119915+00', '2026-02-01 15:59:44.092106+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('3a846374-baa0-44bd-9ff1-f3d94e157722', 'c571ed71-fd5b-4158-ad6d-87405e75f046', 4, 'http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954323998_387871877_4_HP-15-fc0659AU-Laptop-4.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954323998_387871877_4_HP-15-fc0659AU-Laptop-4_large.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954323998_387871877_4_HP-15-fc0659AU-Laptop-4_thumb.jpg', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', false, 10009, 'image/jpeg', 500, 500, 'deleted', '2026-02-01 13:58:46.466937+00', '2026-02-01 15:59:44.223519+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('fc52d2d3-4a94-4079-834b-730bf184f956', 'c571ed71-fd5b-4158-ad6d-87405e75f046', 1, 'http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954316200_319212868_1_HP-15-fc0659AU-Laptop-1.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954316200_319212868_1_HP-15-fc0659AU-Laptop-1_large.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954316200_319212868_1_HP-15-fc0659AU-Laptop-1_thumb.jpg', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', false, 31179, 'image/jpeg', 500, 500, 'deleted', '2026-02-01 13:58:38.827177+00', '2026-02-01 16:21:11.484815+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('e0fb6420-6e80-4312-b607-469dd768c22f', 'c571ed71-fd5b-4158-ad6d-87405e75f046', 2, 'http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954295644_203145225_2_HP-15-fc0659AU-Laptop-2.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954295644_203145225_2_HP-15-fc0659AU-Laptop-2_large.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954295644_203145225_2_HP-15-fc0659AU-Laptop-2_thumb.jpg', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', false, 30602, 'image/jpeg', 500, 500, 'deleted', '2026-02-01 13:58:18.844646+00', '2026-02-01 16:25:08.232432+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('0cda5397-3eb6-4520-b130-1e3e1eb8fdd7', 'c571ed71-fd5b-4158-ad6d-87405e75f046', 3, 'http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954321386_695507058_3_HP-15-fc0659AU-Laptop-3.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954321386_695507058_3_HP-15-fc0659AU-Laptop-3_large.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954321386_695507058_3_HP-15-fc0659AU-Laptop-3_thumb.jpg', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', false, 13158, 'image/jpeg', 500, 500, 'deleted', '2026-02-01 13:58:43.988662+00', '2026-02-01 16:30:23.660539+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('9e217f58-8362-4b47-8175-efb01a599270', 'c571ed71-fd5b-4158-ad6d-87405e75f046', 5, 'http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963486825_873295550_3_HP-15-fc0659AU-Laptop-3.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963486825_873295550_3_HP-15-fc0659AU-Laptop-3_large.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963486825_873295550_3_HP-15-fc0659AU-Laptop-3_thumb.jpg', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', false, 13158, 'image/jpeg', 500, 500, 'deleted', '2026-02-01 16:31:27.122136+00', '2026-02-02 04:14:17.560595+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('254c7b8c-2726-41c9-8a6e-fe593d72ec28', 'c571ed71-fd5b-4158-ad6d-87405e75f046', 4, 'http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963486451_893840155_2_HP-15-fc0659AU-Laptop-2.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963486451_893840155_2_HP-15-fc0659AU-Laptop-2_large.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963486451_893840155_2_HP-15-fc0659AU-Laptop-2_thumb.jpg', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', false, 30602, 'image/jpeg', 500, 500, 'deleted', '2026-02-01 16:31:26.822573+00', '2026-02-02 04:35:00.106578+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('bce93b5a-4ac2-4f7b-b630-95c6bcae3482', 'c571ed71-fd5b-4158-ad6d-87405e75f046', 2, 'http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963485760_480212692_0_HP-15-fc0355AU-Laptop-3.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963485760_480212692_0_HP-15-fc0355AU-Laptop-3_large.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963485760_480212692_0_HP-15-fc0355AU-Laptop-3_thumb.jpg', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', false, 13106, 'image/jpeg', 500, 500, 'deleted', '2026-02-01 16:31:26.11916+00', '2026-02-01 16:31:47.922348+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('f43025a0-7707-463b-963d-dc1d4e2262d6', 'c571ed71-fd5b-4158-ad6d-87405e75f046', 3, 'http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963486124_198391104_1_HP-15-fc0355AU-Laptop-4.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963486124_198391104_1_HP-15-fc0355AU-Laptop-4_large.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963486124_198391104_1_HP-15-fc0355AU-Laptop-4_thumb.jpg', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', false, 10613, 'image/jpeg', 500, 500, 'deleted', '2026-02-01 16:31:26.447371+00', '2026-02-01 16:31:47.897269+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('d68ef413-b767-4753-bc96-8382bf36b26d', 'c571ed71-fd5b-4158-ad6d-87405e75f046', 6, 'http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963487127_514547434_4_HP-15-fc0659AU-Laptop-4.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963487127_514547434_4_HP-15-fc0659AU-Laptop-4_large.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769963487127_514547434_4_HP-15-fc0659AU-Laptop-4_thumb.jpg', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', false, 10009, 'image/jpeg', 500, 500, 'deleted', '2026-02-01 16:31:27.38158+00', '2026-02-01 16:31:47.951596+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('3160d1c2-9790-4ab4-98bf-054b5e1a2c52', 'c571ed71-fd5b-4158-ad6d-87405e75f046', 4, 'http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954303137_915573243_4_HP-15-fc0659AU-Laptop-4.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954303137_915573243_4_HP-15-fc0659AU-Laptop-4_large.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1769954303137_915573243_4_HP-15-fc0659AU-Laptop-4_thumb.jpg', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', false, 10009, 'image/jpeg', 500, 500, 'deleted', '2026-02-01 13:58:27.592351+00', '2026-02-01 16:34:32.229447+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('87bb3a9b-195e-46a0-b85c-e143cc154055', 'c571ed71-fd5b-4158-ad6d-87405e75f046', 1, 'http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008481972_868949816_0_HP-15-fc0659AU-Laptop-1.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008481972_868949816_0_HP-15-fc0659AU-Laptop-1_large.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008481972_868949816_0_HP-15-fc0659AU-Laptop-1_thumb.jpg', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', false, 31179, 'image/jpeg', 500, 500, 'completed', '2026-02-02 05:01:22.385302+00', '2026-02-02 05:01:22.385302+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('4b1b60a0-e23c-4c0c-8cb5-02a29809d0fe', 'c571ed71-fd5b-4158-ad6d-87405e75f046', 2, 'http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008482401_52417570_1_HP-15-fc0659AU-Laptop-2.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008482401_52417570_1_HP-15-fc0659AU-Laptop-2_large.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008482401_52417570_1_HP-15-fc0659AU-Laptop-2_thumb.jpg', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', false, 30602, 'image/jpeg', 500, 500, 'completed', '2026-02-02 05:01:22.691116+00', '2026-02-02 05:01:22.691116+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('914bf92f-2463-42a7-a7d5-30016224de4f', 'c571ed71-fd5b-4158-ad6d-87405e75f046', 3, 'http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008482695_775642763_2_HP-15-fc0659AU-Laptop-3.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008482695_775642763_2_HP-15-fc0659AU-Laptop-3_large.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008482695_775642763_2_HP-15-fc0659AU-Laptop-3_thumb.jpg', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', false, 13158, 'image/jpeg', 500, 500, 'completed', '2026-02-02 05:01:23.05857+00', '2026-02-02 05:01:23.05857+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('1897d00b-fc13-492f-8c77-ca0738d39796', 'c571ed71-fd5b-4158-ad6d-87405e75f046', 4, 'http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008483066_637729097_3_HP-15-fc0659AU-Laptop-4.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008483066_637729097_3_HP-15-fc0659AU-Laptop-4_large.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008483066_637729097_3_HP-15-fc0659AU-Laptop-4_thumb.jpg', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', false, 10009, 'image/jpeg', 500, 500, 'completed', '2026-02-02 05:01:23.484327+00', '2026-02-02 05:01:23.484327+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('377bbac5-a08c-41c2-b0ad-75945cc5ede6', 'c571ed71-fd5b-4158-ad6d-87405e75f046', 5, 'http://localhost:3001/uploads/products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008483489_264805692_4_HP-15-fc0659AU-Laptop.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008483489_264805692_4_HP-15-fc0659AU-Laptop_large.jpg', 'products/c571ed71-fd5b-4158-ad6d-87405e75f046/1770008483489_264805692_4_HP-15-fc0659AU-Laptop_thumb.jpg', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', false, 34010, 'image/jpeg', 500, 500, 'deleted', '2026-02-02 05:01:23.988181+00', '2026-02-02 05:01:48.641+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('2bd70ff8-60dd-409d-8dfc-d7f0f3c3fdfb', '4010caae-464e-4787-ad8f-ee04096100d0', 1, 'http://localhost:3001/uploads/products/4010caae-464e-4787-ad8f-ee04096100d0/1770216820275_381971710_1_HP-15-fc0355AU-Laptop-1.jpg', 'products/4010caae-464e-4787-ad8f-ee04096100d0/1770216820275_381971710_1_HP-15-fc0355AU-Laptop-1_large.jpg', 'products/4010caae-464e-4787-ad8f-ee04096100d0/1770216820275_381971710_1_HP-15-fc0355AU-Laptop-1_thumb.jpg', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', false, 30954, 'image/jpeg', 500, 500, 'completed', '2026-02-04 14:53:40.670513+00', '2026-02-04 14:53:40.670513+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('269dac6e-a18e-407d-9eb8-07649b20e289', '4010caae-464e-4787-ad8f-ee04096100d0', 2, 'http://localhost:3001/uploads/products/4010caae-464e-4787-ad8f-ee04096100d0/1770216820676_632450673_2_HP-15-fc0355AU-Laptop-2.jpg', 'products/4010caae-464e-4787-ad8f-ee04096100d0/1770216820676_632450673_2_HP-15-fc0355AU-Laptop-2_large.jpg', 'products/4010caae-464e-4787-ad8f-ee04096100d0/1770216820676_632450673_2_HP-15-fc0355AU-Laptop-2_thumb.jpg', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', false, 31565, 'image/jpeg', 500, 500, 'completed', '2026-02-04 14:53:41.060541+00', '2026-02-04 14:53:41.060541+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('c659066a-d00e-48e6-910f-04c1bafc36aa', '4010caae-464e-4787-ad8f-ee04096100d0', 0, 'http://localhost:3001/uploads/products/4010caae-464e-4787-ad8f-ee04096100d0/1770216819816_20589543_0_HP-15-fc0355AU-Laptop.jpg', 'products/4010caae-464e-4787-ad8f-ee04096100d0/1770216819816_20589543_0_HP-15-fc0355AU-Laptop_large.jpg', 'products/4010caae-464e-4787-ad8f-ee04096100d0/1770216819816_20589543_0_HP-15-fc0355AU-Laptop_thumb.jpg', 'আপডেট করা অল্ট টেক্সট 1770735734699', 'Updated alt text 1770735734699', true, 33219, 'image/jpeg', 500, 500, 'completed', '2026-02-04 14:53:40.267366+00', '2026-02-10 15:02:15.535826+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('59cf764c-00c2-4216-a5cb-444ee949d464', '4010caae-464e-4787-ad8f-ee04096100d0', 3, 'http://localhost:3001/uploads/products/4010caae-464e-4787-ad8f-ee04096100d0/1770216821064_172879210_3_HP-15-fc0355AU-Laptop-3.jpg', 'products/4010caae-464e-4787-ad8f-ee04096100d0/1770216821064_172879210_3_HP-15-fc0355AU-Laptop-3_large.jpg', 'products/4010caae-464e-4787-ad8f-ee04096100d0/1770216821064_172879210_3_HP-15-fc0355AU-Laptop-3_thumb.jpg', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', false, 13106, 'image/jpeg', 500, 500, 'completed', '2026-02-04 14:53:41.368743+00', '2026-02-04 14:53:41.368743+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('480778b5-86cf-4682-9ab2-519e9f4f75ab', '4010caae-464e-4787-ad8f-ee04096100d0', 4, 'http://localhost:3001/uploads/products/4010caae-464e-4787-ad8f-ee04096100d0/1770216821372_798261435_4_HP-15-fc0355AU-Laptop-4.jpg', 'products/4010caae-464e-4787-ad8f-ee04096100d0/1770216821372_798261435_4_HP-15-fc0355AU-Laptop-4_large.jpg', 'products/4010caae-464e-4787-ad8f-ee04096100d0/1770216821372_798261435_4_HP-15-fc0355AU-Laptop-4_thumb.jpg', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', false, 10613, 'image/jpeg', 500, 500, 'completed', '2026-02-04 14:53:41.61803+00', '2026-02-04 14:53:41.61803+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('33534a21-b7cc-4d76-b2de-5018f4d97bf6', '4010caae-464e-4787-ad8f-ee04096100d0', 5, 'http://localhost:3001/uploads/products/4010caae-464e-4787-ad8f-ee04096100d0/1770411188369_422004187_0_HP-15-fc0659AU-Laptop.jpg', 'products/4010caae-464e-4787-ad8f-ee04096100d0/1770411188369_422004187_0_HP-15-fc0659AU-Laptop_large.jpg', 'products/4010caae-464e-4787-ad8f-ee04096100d0/1770411188369_422004187_0_HP-15-fc0659AU-Laptop_thumb.jpg', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', false, 34010, 'image/jpeg', 500, 500, 'deleted', '2026-02-06 20:53:08.733684+00', '2026-02-06 20:53:28.318+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('6065bec0-eba6-47c5-b116-3bfb052a4860', '4010caae-464e-4787-ad8f-ee04096100d0', 6, 'http://localhost:3001/uploads/products/4010caae-464e-4787-ad8f-ee04096100d0/1770411188745_819104242_1_HP-15-fc0659AU-Laptop-1.jpg', 'products/4010caae-464e-4787-ad8f-ee04096100d0/1770411188745_819104242_1_HP-15-fc0659AU-Laptop-1_large.jpg', 'products/4010caae-464e-4787-ad8f-ee04096100d0/1770411188745_819104242_1_HP-15-fc0659AU-Laptop-1_thumb.jpg', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', false, 31179, 'image/jpeg', 500, 500, 'deleted', '2026-02-06 20:53:09.05075+00', '2026-02-06 20:53:28.359+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('3a8a8f37-713b-4cc7-b85b-64916cec4bf2', '4010caae-464e-4787-ad8f-ee04096100d0', 7, 'http://localhost:3001/uploads/products/4010caae-464e-4787-ad8f-ee04096100d0/1770411189054_707707886_2_HP-15-fc0659AU-Laptop-2.jpg', 'products/4010caae-464e-4787-ad8f-ee04096100d0/1770411189054_707707886_2_HP-15-fc0659AU-Laptop-2_large.jpg', 'products/4010caae-464e-4787-ad8f-ee04096100d0/1770411189054_707707886_2_HP-15-fc0659AU-Laptop-2_thumb.jpg', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', false, 30602, 'image/jpeg', 500, 500, 'deleted', '2026-02-06 20:53:09.415478+00', '2026-02-06 20:53:28.402+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('5146da6c-4c5b-46b0-9421-c2a8ee19c5ee', '4010caae-464e-4787-ad8f-ee04096100d0', 8, 'http://localhost:3001/uploads/products/4010caae-464e-4787-ad8f-ee04096100d0/1770411189422_343394303_3_HP-15-fc0659AU-Laptop-3.jpg', 'products/4010caae-464e-4787-ad8f-ee04096100d0/1770411189422_343394303_3_HP-15-fc0659AU-Laptop-3_large.jpg', 'products/4010caae-464e-4787-ad8f-ee04096100d0/1770411189422_343394303_3_HP-15-fc0659AU-Laptop-3_thumb.jpg', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', false, 13158, 'image/jpeg', 500, 500, 'deleted', '2026-02-06 20:53:09.705267+00', '2026-02-06 20:53:28.442+00');
INSERT INTO public.product_images (id, product_id, display_order, original_url, optimized_url, thumbnail_url, alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height, processing_status, created_at, updated_at) VALUES ('9247cd95-057e-4b31-9c51-840560593b2a', '4010caae-464e-4787-ad8f-ee04096100d0', 9, 'http://localhost:3001/uploads/products/4010caae-464e-4787-ad8f-ee04096100d0/1770411189709_681162155_4_HP-15-fc0659AU-Laptop-4.jpg', 'products/4010caae-464e-4787-ad8f-ee04096100d0/1770411189709_681162155_4_HP-15-fc0659AU-Laptop-4_large.jpg', 'products/4010caae-464e-4787-ad8f-ee04096100d0/1770411189709_681162155_4_HP-15-fc0659AU-Laptop-4_thumb.jpg', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', false, 10009, 'image/jpeg', 500, 500, 'deleted', '2026-02-06 20:53:10.000755+00', '2026-02-06 20:53:28.476+00');


--
-- Data for Name: product_specifications; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.products (id, sku, name, "nameEn", "nameBn", slug, "shortDescription", description, "brandId", "regularPrice", "salePrice", "costPrice", "taxRate", "stockQuantity", "lowStockThreshold", status, "metaTitle", "metaDescription", "metaKeywords", "isFeatured", "isNewArrival", "isBestSeller", "warrantyPeriod", "warrantyType", "createdAt", "updatedAt", "publishedAt", visibility) VALUES ('4010caae-464e-4787-ad8f-ee04096100d0', '132', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', 'hp-15-fr0076tu-core-i5-13th-gen-156-inch-fhd-laptop', '

    MPN: C78JFPA
    Model: 15-fr0076TU
    Processor: Intel Core i5-13420H (12MB L3 Cache, Up to 4.6 GHz)
    RAM: 16GB DDR4-3200 MHz, Storage: 512 GB PCIe NVMe M.2 SSD
    Display: 15.6″ FHD (1920 x 1080), Anti-Glare, 250 nits, 62.5% sRGB
    Features: Backlit Keyboard, Privacy Shutter, Type-C, Wi-Fi 6

', 'Product number 	C78JFPA#UUF
Product name 	HP 15-fr0076TU
Microprocessor 	Intel® Core™ i5-13420H (up to 4.6 GHz with Intel® Turbo Boost Technology, 12 MB L3 cache, 8 cores, 12 threads)
Chipset 	Intel® integrated SoC
Operating system 	Windows 11 Home
Memory, standard 	16 GB DDR4-3200 MT/s (2 x 8 GB)
Video graphics 	Intel® UHD Graphics
Hard drive 	512 GB PCIe® NVMe™ M.2 SSD
Display 	Intel® Core™ i5-13420H (up to 4.6 GHz with Intel® Turbo Boost Technology, 12 MB L3 cache, 8 cores, 12 threads)
Wireless connectivity 	Realtek Wi-Fi 6 (2×2) and Bluetooth® 5.4 wireless card
External ports 	2 USB Type-A 5Gbps signaling rate; 1 AC smart pin; 1 HDMI 1.4b; 1 headphone/microphone combo; 1 USB Type-C® 10Gbps signaling rate (USB Power Delivery 3.1, DisplayPort™ 1.4b, HP Sleep and Charge)
Minimum dimensions (W x D x H) 	35.98 x 23.6 x 1.86 cm
Weight 	1.65 kg
Power supply type 	90 W Smart AC power adapter
Battery type 	3-cell, 41 Wh Li-ion polymer
Keyboard 	Full-size, backlit, soft gray keyboard with numeric keypad
Webcam 	HP True Vision 1080p FHD camera with temporal noise reduction and integrated dual array digital microphones
Security management 	Mic mute key; Camera privacy shutter; Trusted Platform Module (Firmware
TPM) support
Audio 	Dual speakers
Color 	Moonlight blue
Warranty 	2 Years (Condition applied)', '2bd4edf3-0311-485b-ae4d-610957330475', 5000.00, 0.00, 4500.00, 0.00, 89, 10, 'active', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop', true, true, false, 12, 'Test', '2026-02-04 14:53:13.093', '2026-02-13 20:39:45.143', NULL, 'public');
INSERT INTO public.products (id, sku, name, "nameEn", "nameBn", slug, "shortDescription", description, "brandId", "regularPrice", "salePrice", "costPrice", "taxRate", "stockQuantity", "lowStockThreshold", status, "metaTitle", "metaDescription", "metaKeywords", "isFeatured", "isNewArrival", "isBestSeller", "warrantyPeriod", "warrantyType", "createdAt", "updatedAt", "publishedAt", visibility) VALUES ('c571ed71-fd5b-4158-ad6d-87405e75f046', '1234', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'hp-15-fc0659au-ryzen-5-7520u-156-inch-fhd-laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', '9e41b5b0-84dd-4f3d-889d-70efc48b37f4', 1000.00, 850.00, 700.00, 0.00, 89, 10, 'active', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', 'HP 15-fc0659au Ryzen 5 7520U 15.6 Inch FHD Laptop', true, true, true, 12, ' 	02 Years (Condition applied)', '2026-02-01 05:57:43.106', '2026-02-13 20:39:45.125', NULL, 'public');


--
-- Data for Name: related_products; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: role_escalation_requests; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('b2b5dc10-aacf-4ccb-9553-57754a047b69', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '18052c3d-aa84-48b8-8fd0-bee55538b7b9', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('08c3af2c-00b5-4e03-ad05-c7616f9e0f11', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '4449d6d4-ecfe-4146-9b4b-ae86d9d75d80', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('d779323d-790e-45fa-8b03-30be702fc298', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '6c81487e-5d73-47f0-89b9-618cc6f32232', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('555c6705-a48d-4aa0-9bc3-ac71ceae5805', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '06216b84-3695-41b5-8325-c2919f3d3eac', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('bdb96111-2a65-479b-997b-124eb95a1d45', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '1363aa55-bc45-4b65-bd40-21f80f37df30', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('c24f04dd-49c5-4459-a6dd-fed616d9b925', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'f3a72737-6c39-4a7d-8a9b-8adeb6f01a04', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('f4f43f53-a6b7-43e6-ae51-94e87ff605cc', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'f96f95ec-1502-4609-8802-80f775782ba0', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('da42289f-d123-42b9-bd47-c68f729391cf', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'd3e1ed4e-822e-49ba-83af-074b44ccf3fc', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('91cbf605-079c-40af-81e4-2818688f8088', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'a307e6cb-53ec-415b-9289-38b7d692a83e', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('82a7e62d-04bc-4c0b-9b2a-2cbe4dd285db', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'c0ac7de9-27ff-4ce1-9929-582449fd7492', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('bb6aafe8-2879-416b-ac07-d32e3177fea4', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'ac2f7497-dc35-4b3c-9c4c-1adb4b86e57f', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('d65cfe1d-4038-4a80-94c8-6250ed649d2d', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'bbaae6c8-9351-49ef-a2af-3e5ef0b2be79', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('9fb5200a-8ed7-42cc-b0ff-ed8a9a83dc6e', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'fbcb991b-20a2-41d9-80fb-aef865ef76e0', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('a6ab4f19-ee65-4eb0-8ab3-faae5a1a64f1', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '0b224c6f-a9f8-4450-9481-87eec23b8b3a', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('a830d754-1f05-4c2a-81d2-e862d1cf3ad5', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '55c8257e-f5a6-48fb-8265-59c08d695405', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('7f7a1b05-8861-4513-b556-2bc0d61d7268', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '96029482-e5e2-46b0-91d6-972ac8f176dd', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('f2ba20f3-6d4b-48d9-be1d-d126a33564ef', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '35f807da-21b7-466f-85e2-5b958e10bf5a', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('46d55819-ac02-4b33-b863-81c2ea8eb164', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'e3cb3d9c-22fc-4193-b45c-464c8b64fb9b', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('233639a2-848c-4db4-8685-26355843a68e', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'fc6234f8-aa04-4825-9d8e-3e5801ff106f', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('1dcc2975-6505-41ef-8c43-a0f835e11883', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '947ea574-03e8-4854-82f4-13b1703b96de', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('f76c5cdd-781b-49f9-b6ed-f35c9a3c20d9', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '9ca2b5d6-562e-4025-8337-ab54e9735fa9', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('1deded02-57b0-48a7-9270-76ee1b95ebee', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'e94e27d3-e568-4369-b691-05c5f8bf8c73', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('facea0c2-ac8a-4399-af7d-fa6fce424bbd', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '7dc33bbb-9178-4f11-bbad-51e1a2986b29', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('fb964a32-eab6-4b31-b1c7-07bee97e20fb', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '83435a52-986b-4dad-b731-172ec37df140', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('b3cddc79-e0fa-4d5e-a5d2-5b06fa6dd834', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '2394c9c2-9f05-4a80-b895-283e07368142', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('a39c86ba-26ef-4882-8fc3-a499c2120ba8', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'a3e9ceba-29dc-47ef-b4a3-3f9bcfe90320', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('244e93ce-ab10-4e70-96a2-4d9fa995a7f2', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'b080199d-2beb-48ff-b482-db0d63b6e5a8', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('5de12f79-df53-4822-9f46-6976b938466d', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'b0e453b3-cf2b-47b5-8555-ccefb83ef646', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('4e805e25-6008-476c-8451-1dda9fbfb231', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '3f576e85-b27e-4c1b-8fb9-f362d670580c', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('a5dffad7-5662-4115-b6cf-df021697bfe5', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '31d0301e-b13d-4c69-9b3a-8a997f91ca9c', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('82dd7c8f-db62-4730-bac2-6a8782db1b2f', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '86658291-5002-4391-86c7-944d7801a197', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('3d4858b8-a784-4c49-92a9-d9539647de9c', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '5dea5965-1929-4ec0-9437-d363d6d8b172', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('4833c6a8-1189-4c72-a5c7-ad89ab4b1036', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'f7042b4c-1797-4e40-bb21-5ee222f1ec60', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('bfd7a89d-622f-4514-ad3f-64a9f8b3838e', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'd0a1b4ce-067d-40a3-bb4c-cbd4b51c26d2', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('2ce6771d-1aec-484f-9617-c4db478cbf76', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '3e3ec705-b314-456a-bf19-70a963c9fb09', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('15b4088a-d73c-4f0f-8726-c4e8bc46be87', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '1ce64ae3-84c2-440e-ac1d-99b8462bfc64', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('9e119ea0-6a52-473b-aa79-3a56456c99ae', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'cec23cd5-5ae5-444e-b271-9bef9acf0ef1', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('3d26d7d9-1dad-4da3-b15a-f8a0afa3edc1', '09510acf-2e77-4ae0-8206-3b154b391821', '18052c3d-aa84-48b8-8fd0-bee55538b7b9', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('67f30783-8cb4-438b-8713-ac83cac713ce', '09510acf-2e77-4ae0-8206-3b154b391821', '4449d6d4-ecfe-4146-9b4b-ae86d9d75d80', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('2b47aab0-11b8-48b3-a9fe-3ee1ff949549', '09510acf-2e77-4ae0-8206-3b154b391821', '6c81487e-5d73-47f0-89b9-618cc6f32232', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('9aad6934-ae7e-40f9-b40d-0fd255acc4a1', '09510acf-2e77-4ae0-8206-3b154b391821', '06216b84-3695-41b5-8325-c2919f3d3eac', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('60ef931a-a4aa-483b-bbd5-677189922d5e', '09510acf-2e77-4ae0-8206-3b154b391821', '1363aa55-bc45-4b65-bd40-21f80f37df30', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('9433e38f-9eae-40fa-8efe-9d21f7f3ef73', '09510acf-2e77-4ae0-8206-3b154b391821', 'f3a72737-6c39-4a7d-8a9b-8adeb6f01a04', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('3493b925-3407-488c-85ce-12bdd7d3404a', '09510acf-2e77-4ae0-8206-3b154b391821', 'f96f95ec-1502-4609-8802-80f775782ba0', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('ebed4c8a-6cb0-43bd-8dda-0e0c61651a1a', '09510acf-2e77-4ae0-8206-3b154b391821', 'd3e1ed4e-822e-49ba-83af-074b44ccf3fc', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('c4042e81-bbf8-49e9-b4e8-3b586bf6ea4b', '09510acf-2e77-4ae0-8206-3b154b391821', 'a307e6cb-53ec-415b-9289-38b7d692a83e', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('be63c508-d8f5-4d13-af8c-e72cd2450f7d', '09510acf-2e77-4ae0-8206-3b154b391821', 'c0ac7de9-27ff-4ce1-9929-582449fd7492', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('0f954168-5bdf-4021-8ddf-6f362ad3f886', '09510acf-2e77-4ae0-8206-3b154b391821', 'ac2f7497-dc35-4b3c-9c4c-1adb4b86e57f', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('b3c0e4c5-dcf8-4489-a540-e1f5fb437e21', '09510acf-2e77-4ae0-8206-3b154b391821', 'bbaae6c8-9351-49ef-a2af-3e5ef0b2be79', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('9393367b-03ad-4af2-9d1b-010258cd548e', '09510acf-2e77-4ae0-8206-3b154b391821', 'fbcb991b-20a2-41d9-80fb-aef865ef76e0', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('6d824ba6-b7a3-4301-82d1-a5b3d2abcc74', '09510acf-2e77-4ae0-8206-3b154b391821', '0b224c6f-a9f8-4450-9481-87eec23b8b3a', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('7a7a3832-6e81-459b-b13c-9ba232722575', '09510acf-2e77-4ae0-8206-3b154b391821', '55c8257e-f5a6-48fb-8265-59c08d695405', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('28450a43-f98c-4d09-a995-f99a626ce4a4', '09510acf-2e77-4ae0-8206-3b154b391821', '96029482-e5e2-46b0-91d6-972ac8f176dd', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('55f5eba9-9b8f-49a4-b780-9ef27fbcff59', '09510acf-2e77-4ae0-8206-3b154b391821', '35f807da-21b7-466f-85e2-5b958e10bf5a', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('e0d7ccd7-fdbf-4eb7-8cc5-f1fe0b78c918', '09510acf-2e77-4ae0-8206-3b154b391821', 'e3cb3d9c-22fc-4193-b45c-464c8b64fb9b', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('75ff71cc-ac5d-4dec-96a7-1c447fea4174', '09510acf-2e77-4ae0-8206-3b154b391821', 'fc6234f8-aa04-4825-9d8e-3e5801ff106f', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('c4cfe837-52c1-44d8-9683-4106087f10db', '09510acf-2e77-4ae0-8206-3b154b391821', '947ea574-03e8-4854-82f4-13b1703b96de', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('7da0755c-35f5-40f8-87bc-83016e925859', '09510acf-2e77-4ae0-8206-3b154b391821', '9ca2b5d6-562e-4025-8337-ab54e9735fa9', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('2d75e98f-d440-442e-8a79-5ee9d700bfaf', '09510acf-2e77-4ae0-8206-3b154b391821', 'e94e27d3-e568-4369-b691-05c5f8bf8c73', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('8888c3d4-df13-44c5-9417-23c7e43211f5', '09510acf-2e77-4ae0-8206-3b154b391821', '7dc33bbb-9178-4f11-bbad-51e1a2986b29', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('0e5282de-1721-4eea-aa96-3f68d29dfe48', '09510acf-2e77-4ae0-8206-3b154b391821', '83435a52-986b-4dad-b731-172ec37df140', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('2cc90de3-321d-4925-8b5d-440e348e9742', '09510acf-2e77-4ae0-8206-3b154b391821', '2394c9c2-9f05-4a80-b895-283e07368142', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('7ed85acb-8bc0-4f70-a6b9-5747a2315124', '09510acf-2e77-4ae0-8206-3b154b391821', 'a3e9ceba-29dc-47ef-b4a3-3f9bcfe90320', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('3dff740c-9f82-4e23-b581-bc62dabdc447', '09510acf-2e77-4ae0-8206-3b154b391821', 'b080199d-2beb-48ff-b482-db0d63b6e5a8', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('10a4a2ba-6231-4909-9e79-f0c5908841e1', '09510acf-2e77-4ae0-8206-3b154b391821', '86658291-5002-4391-86c7-944d7801a197', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('3febecbb-88c3-4459-a23f-46840b3a8855', '09510acf-2e77-4ae0-8206-3b154b391821', '5dea5965-1929-4ec0-9437-d363d6d8b172', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('ad5486da-d5bd-4c97-b361-4e720cac5e7f', '09510acf-2e77-4ae0-8206-3b154b391821', 'f7042b4c-1797-4e40-bb21-5ee222f1ec60', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('e41428ed-912c-40cb-8c5d-197abdfe9d99', '09510acf-2e77-4ae0-8206-3b154b391821', 'd0a1b4ce-067d-40a3-bb4c-cbd4b51c26d2', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('0bf94a3c-b572-4b55-8840-9b72aadddf64', 'bae96556-98bd-472c-ac6d-7e53f43dd7ce', 'a3e9ceba-29dc-47ef-b4a3-3f9bcfe90320', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('aa3f3960-ccd3-41c4-87ac-910f057a5644', 'bae96556-98bd-472c-ac6d-7e53f43dd7ce', 'b080199d-2beb-48ff-b482-db0d63b6e5a8', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('e6a7cade-10f6-4bb2-ba5d-a60b3566027b', '625453b9-d560-4cd8-9a90-c9897d039dc2', 'b0e453b3-cf2b-47b5-8555-ccefb83ef646', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('67131bd2-2e4e-4a20-a647-ae026dc63c98', '625453b9-d560-4cd8-9a90-c9897d039dc2', '3f576e85-b27e-4c1b-8fb9-f362d670580c', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('419655a2-3408-4ea0-9e42-0808e6ad7bc5', '625453b9-d560-4cd8-9a90-c9897d039dc2', '31d0301e-b13d-4c69-9b3a-8a997f91ca9c', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('c03e4379-25e6-48a4-a50d-87063548efda', '03437257-409d-4735-81b2-7fd0eea98672', '86658291-5002-4391-86c7-944d7801a197', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('21f27e94-2aa6-4f17-8aaa-7f907c639f4a', '03437257-409d-4735-81b2-7fd0eea98672', '5dea5965-1929-4ec0-9437-d363d6d8b172', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('ed567675-ebef-4263-a9b5-3b5b8652d911', '03437257-409d-4735-81b2-7fd0eea98672', 'f7042b4c-1797-4e40-bb21-5ee222f1ec60', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('443d1af5-de1b-4e17-ba67-5f25d0d5c2ea', '03437257-409d-4735-81b2-7fd0eea98672', 'd0a1b4ce-067d-40a3-bb4c-cbd4b51c26d2', '2026-01-25 04:27:10.300782+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('f7610116-d5c9-47a6-8b74-c4b952e0de54', '4d0cd4a1-3c74-4782-a766-8020f0296e00', '0d7ff35e-31c6-45c1-a03a-ae4481b7b6cc', '2026-02-07 19:09:48.447692+00', 'system');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('6688efa4-2263-4e36-bf09-2210e2cd8fe0', '4d0cd4a1-3c74-4782-a766-8020f0296e00', '0a0e4335-5c7a-4fab-b403-8aecf5fa8e62', '2026-02-07 19:09:48.46093+00', 'system');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('4447238c-91a4-4353-98d2-1b1770336582', '4d0cd4a1-3c74-4782-a766-8020f0296e00', '6e928804-f784-4108-a2cf-e25f0a40fe5e', '2026-02-07 19:09:48.46629+00', 'system');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('f7ff5777-ba0c-436a-9442-924dedfc1684', '4d0cd4a1-3c74-4782-a766-8020f0296e00', 'f7e97b0b-abf5-411d-8de5-20e64dd914de', '2026-02-07 19:09:48.471128+00', 'system');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('042c9a8d-8e50-4930-afad-7adc0b084bdd', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'b080199d-2beb-48ff-b482-db0d63b6e5a8', '2026-02-08 04:53:03.177+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('b8e34fd1-092f-46e5-9163-b0daa47faf14', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'a3e9ceba-29dc-47ef-b4a3-3f9bcfe90320', '2026-02-08 04:53:03.203+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('82ddae9c-de1b-46d8-a949-281d2e5fcae0', 'c8e80340-054e-451c-a53f-104b188fe0ec', '947ea574-03e8-4854-82f4-13b1703b96de', '2026-02-08 04:53:03.211+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('58b68d06-3d88-43c1-8319-24feeb9617b8', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'e94e27d3-e568-4369-b691-05c5f8bf8c73', '2026-02-08 04:53:03.22+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('2d8cb42f-c201-41d9-af05-f389a7973276', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'fc6234f8-aa04-4825-9d8e-3e5801ff106f', '2026-02-08 04:53:03.233+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('8e06c09a-fae3-4942-832f-3dbaa33cb82c', 'c8e80340-054e-451c-a53f-104b188fe0ec', '9ca2b5d6-562e-4025-8337-ab54e9735fa9', '2026-02-08 04:53:03.252+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('824aa4f1-29a4-4fa8-b7aa-32d495845dfe', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'f7e97b0b-abf5-411d-8de5-20e64dd914de', '2026-02-08 04:53:03.268+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('432ea37b-08df-4eec-8c75-f9df09a7d6e5', 'c8e80340-054e-451c-a53f-104b188fe0ec', '6e928804-f784-4108-a2cf-e25f0a40fe5e', '2026-02-08 04:53:03.277+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('6d7cdf9a-cf67-4642-ba07-be4991bcc727', 'c8e80340-054e-451c-a53f-104b188fe0ec', '0d7ff35e-31c6-45c1-a03a-ae4481b7b6cc', '2026-02-08 04:53:03.286+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('ad5a0a49-3419-471c-b250-98dba9acd57e', 'c8e80340-054e-451c-a53f-104b188fe0ec', '0a0e4335-5c7a-4fab-b403-8aecf5fa8e62', '2026-02-08 04:53:03.297+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('39f82148-ea5b-4dcb-a189-01b80ee1018e', 'c8e80340-054e-451c-a53f-104b188fe0ec', '96029482-e5e2-46b0-91d6-972ac8f176dd', '2026-02-08 04:53:03.307+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('b015dd7f-98a8-462f-ac6a-1ade3cb9ebcd', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'e3cb3d9c-22fc-4193-b45c-464c8b64fb9b', '2026-02-08 04:53:03.317+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('edae7a99-e9d1-4298-80fd-697c71e03b69', 'c8e80340-054e-451c-a53f-104b188fe0ec', '55c8257e-f5a6-48fb-8265-59c08d695405', '2026-02-08 04:53:03.325+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('96a7283e-9b5c-45fc-b0fa-0a80c70d624f', 'c8e80340-054e-451c-a53f-104b188fe0ec', '35f807da-21b7-466f-85e2-5b958e10bf5a', '2026-02-08 04:53:03.335+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('9c0287ef-7820-4405-acec-e4150b5c79ee', 'c8e80340-054e-451c-a53f-104b188fe0ec', '5dea5965-1929-4ec0-9437-d363d6d8b172', '2026-02-08 04:53:03.347+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('28c079ea-8d37-43de-941a-05791c7e2108', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'd0a1b4ce-067d-40a3-bb4c-cbd4b51c26d2', '2026-02-08 04:53:03.355+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('f5c7ba53-59cb-4120-8ece-e1896744c66e', 'c8e80340-054e-451c-a53f-104b188fe0ec', '86658291-5002-4391-86c7-944d7801a197', '2026-02-08 04:53:03.365+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('1b4969dc-e8b4-4ad8-b09a-f906bebb75f0', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'f7042b4c-1797-4e40-bb21-5ee222f1ec60', '2026-02-08 04:53:03.375+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('ef8d72af-33a8-4fc4-b04e-b91ff85a312d', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'ac2f7497-dc35-4b3c-9c4c-1adb4b86e57f', '2026-02-08 04:53:03.386+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('5c059338-c45e-4066-8998-572f1ffd772c', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'fbcb991b-20a2-41d9-80fb-aef865ef76e0', '2026-02-08 04:53:03.394+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('4d02caeb-9bef-44c4-8b7f-c9572635c5e5', 'c8e80340-054e-451c-a53f-104b188fe0ec', '0b224c6f-a9f8-4450-9481-87eec23b8b3a', '2026-02-08 04:53:03.404+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('9c3d9e1d-dc62-4b8b-8ccd-b3c20343fe24', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'c0ac7de9-27ff-4ce1-9929-582449fd7492', '2026-02-08 04:53:03.416+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('98ffc2e6-07e6-44a4-8bda-13e0eecc663c', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'bbaae6c8-9351-49ef-a2af-3e5ef0b2be79', '2026-02-08 04:53:03.425+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('ab04dea0-71eb-4b71-b78a-8ecd21f5e76c', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'f96f95ec-1502-4609-8802-80f775782ba0', '2026-02-08 04:53:03.434+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('8a01d036-4e50-487d-bc3e-426763798254', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'a307e6cb-53ec-415b-9289-38b7d692a83e', '2026-02-08 04:53:03.442+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('e1994e30-690e-450f-885f-4142a6e305c8', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'f3a72737-6c39-4a7d-8a9b-8adeb6f01a04', '2026-02-08 04:53:03.45+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('07de5fc8-0717-4360-86a9-b7db182b4770', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'd3e1ed4e-822e-49ba-83af-074b44ccf3fc', '2026-02-08 04:53:03.46+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('712a47d4-e3f2-42a2-a2e0-8501dca7e524', 'c8e80340-054e-451c-a53f-104b188fe0ec', '83435a52-986b-4dad-b731-172ec37df140', '2026-02-08 04:53:03.468+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('a821dfa9-6f48-48f0-82af-505d444e523c', 'c8e80340-054e-451c-a53f-104b188fe0ec', '2394c9c2-9f05-4a80-b895-283e07368142', '2026-02-08 04:53:03.477+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('6f4777e3-0b45-4626-bed8-26d05a7187cc', 'c8e80340-054e-451c-a53f-104b188fe0ec', '7dc33bbb-9178-4f11-bbad-51e1a2986b29', '2026-02-08 04:53:03.485+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('cab853a4-7d57-46c5-a352-7ff600c34dd8', 'c8e80340-054e-451c-a53f-104b188fe0ec', '31d0301e-b13d-4c69-9b3a-8a997f91ca9c', '2026-02-08 04:53:03.494+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('02288351-cbda-4e2f-9ae8-136787ffd64e', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'b0e453b3-cf2b-47b5-8555-ccefb83ef646', '2026-02-08 04:53:03.503+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('7055be47-933c-46a5-9211-112a77cebee4', 'c8e80340-054e-451c-a53f-104b188fe0ec', '3f576e85-b27e-4c1b-8fb9-f362d670580c', '2026-02-08 04:53:03.513+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('b2afc814-77db-40e4-a553-986a79ca96c9', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'cec23cd5-5ae5-444e-b271-9bef9acf0ef1', '2026-02-08 04:53:03.523+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('8d155daa-bdad-4886-8f2d-356db192e0fd', 'c8e80340-054e-451c-a53f-104b188fe0ec', '3e3ec705-b314-456a-bf19-70a963c9fb09', '2026-02-08 04:53:03.533+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('ab7b997d-9d67-4bdf-9d1b-f36f6f85ce54', 'c8e80340-054e-451c-a53f-104b188fe0ec', '1ce64ae3-84c2-440e-ac1d-99b8462bfc64', '2026-02-08 04:53:03.544+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('e5bbc051-90d2-46b2-8398-5e2178b767e6', 'c8e80340-054e-451c-a53f-104b188fe0ec', '1363aa55-bc45-4b65-bd40-21f80f37df30', '2026-02-08 04:53:03.555+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('89bb387e-34df-4ea3-8486-772e5f569c38', 'c8e80340-054e-451c-a53f-104b188fe0ec', '4449d6d4-ecfe-4146-9b4b-ae86d9d75d80', '2026-02-08 04:53:03.565+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('e8428778-f3d3-4b2b-a4ee-bd4fec3d0546', 'c8e80340-054e-451c-a53f-104b188fe0ec', '06216b84-3695-41b5-8325-c2919f3d3eac', '2026-02-08 04:53:03.575+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('1b2a81d0-6a33-452b-b930-fba55a93a522', 'c8e80340-054e-451c-a53f-104b188fe0ec', '18052c3d-aa84-48b8-8fd0-bee55538b7b9', '2026-02-08 04:53:03.584+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('5a15ebe6-c4ad-4395-9a1e-970ff5b7e729', 'c8e80340-054e-451c-a53f-104b188fe0ec', '6c81487e-5d73-47f0-89b9-618cc6f32232', '2026-02-08 04:53:03.592+00', 'c8e80340-054e-451c-a53f-104b188fe0ec');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('0914c544-36a5-46c1-a89e-2666d53ec818', '09510acf-2e77-4ae0-8206-3b154b391821', 'f7e97b0b-abf5-411d-8de5-20e64dd914de', '2026-02-08 19:17:03.372+00', '92df20d4-1c7b-401f-8005-3c68b1572519');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('ee6f4959-5f2f-4b84-8b67-167f5c210a6f', '09510acf-2e77-4ae0-8206-3b154b391821', '6e928804-f784-4108-a2cf-e25f0a40fe5e', '2026-02-08 19:17:03.372+00', '92df20d4-1c7b-401f-8005-3c68b1572519');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('cd7591a6-dcb5-4721-b6fd-a9addbab2c6b', '09510acf-2e77-4ae0-8206-3b154b391821', '0d7ff35e-31c6-45c1-a03a-ae4481b7b6cc', '2026-02-08 19:17:03.372+00', '92df20d4-1c7b-401f-8005-3c68b1572519');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('33d46675-e363-40b2-bfce-99ec8ce195e8', '09510acf-2e77-4ae0-8206-3b154b391821', '0a0e4335-5c7a-4fab-b403-8aecf5fa8e62', '2026-02-08 19:17:03.372+00', '92df20d4-1c7b-401f-8005-3c68b1572519');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('760b4fe8-3528-4d87-b01f-bbbf1023ed78', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'f7e97b0b-abf5-411d-8de5-20e64dd914de', '2026-02-09 17:38:46.9+00', '92df20d4-1c7b-401f-8005-3c68b1572519');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('19af2e82-10de-47e4-96a7-91b554a6f5da', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '6e928804-f784-4108-a2cf-e25f0a40fe5e', '2026-02-09 17:38:46.9+00', '92df20d4-1c7b-401f-8005-3c68b1572519');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('a3e286e2-3744-4ce7-a6a5-d225529b40c0', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '0d7ff35e-31c6-45c1-a03a-ae4481b7b6cc', '2026-02-09 17:38:46.9+00', '92df20d4-1c7b-401f-8005-3c68b1572519');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('6fb0e445-7ef2-4e4f-b5d7-dbcaf29b3af7', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '0a0e4335-5c7a-4fab-b403-8aecf5fa8e62', '2026-02-09 17:38:46.9+00', '92df20d4-1c7b-401f-8005-3c68b1572519');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('0afc1f59-cf5e-4b2c-9bff-c5da5b16b40d', '09510acf-2e77-4ae0-8206-3b154b391821', '31d0301e-b13d-4c69-9b3a-8a997f91ca9c', '2026-02-09 17:39:59.768+00', '92df20d4-1c7b-401f-8005-3c68b1572519');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('0e9db04d-2756-44ec-b6dc-825d94de06f8', '09510acf-2e77-4ae0-8206-3b154b391821', 'b0e453b3-cf2b-47b5-8555-ccefb83ef646', '2026-02-09 17:39:59.768+00', '92df20d4-1c7b-401f-8005-3c68b1572519');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('49767b2a-8f4e-4d86-b6db-b622400db1f4', '09510acf-2e77-4ae0-8206-3b154b391821', '3f576e85-b27e-4c1b-8fb9-f362d670580c', '2026-02-09 17:39:59.768+00', '92df20d4-1c7b-401f-8005-3c68b1572519');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('c9122fa9-6e34-41c3-9c33-0f19ebd352a3', '09510acf-2e77-4ae0-8206-3b154b391821', 'cec23cd5-5ae5-444e-b271-9bef9acf0ef1', '2026-02-09 17:39:59.768+00', '92df20d4-1c7b-401f-8005-3c68b1572519');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('d7345423-888d-4784-acad-a7886aebfe9c', '09510acf-2e77-4ae0-8206-3b154b391821', '3e3ec705-b314-456a-bf19-70a963c9fb09', '2026-02-09 17:39:59.768+00', '92df20d4-1c7b-401f-8005-3c68b1572519');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('ff849370-8216-4cf4-86d3-8a86d4151450', '09510acf-2e77-4ae0-8206-3b154b391821', '1ce64ae3-84c2-440e-ac1d-99b8462bfc64', '2026-02-09 17:39:59.768+00', '92df20d4-1c7b-401f-8005-3c68b1572519');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('d8259d8a-2a7d-44ee-9bcf-2e32f42795e7', 'bae96556-98bd-472c-ac6d-7e53f43dd7ce', '0d7ff35e-31c6-45c1-a03a-ae4481b7b6cc', '2026-02-09 18:19:40.939039+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('84b44939-803f-4ea0-ac41-5c20747f2812', '09510acf-2e77-4ae0-8206-3b154b391821', '8cbe2b47-a386-4305-b01d-818b795ddf0a', '2026-02-10 18:05:39.473775+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('eba30275-7027-4933-a2e7-b132576b2f30', '09510acf-2e77-4ae0-8206-3b154b391821', 'cae30d9a-adb2-4f6c-a112-62092f293193', '2026-02-10 18:05:39.473775+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('9749713c-97d7-440c-8608-b11877399bf1', '09510acf-2e77-4ae0-8206-3b154b391821', '38f1fc6d-0681-4d93-bc8c-f15f768d56e3', '2026-02-10 18:05:39.473775+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('8712e346-4152-4447-87a2-3f202499f3bd', 'bae96556-98bd-472c-ac6d-7e53f43dd7ce', '8cbe2b47-a386-4305-b01d-818b795ddf0a', '2026-02-10 18:05:39.473775+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('a9fddd75-ab59-4db0-8857-ffadd0ae3372', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '8cbe2b47-a386-4305-b01d-818b795ddf0a', '2026-02-10 18:05:39.473775+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('cdc9efe2-037b-47cd-b000-d9ea3fdfee22', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'cae30d9a-adb2-4f6c-a112-62092f293193', '2026-02-10 18:05:39.473775+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('197c6a02-7629-4a34-823c-a25af64cd4d2', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '38f1fc6d-0681-4d93-bc8c-f15f768d56e3', '2026-02-10 18:05:39.473775+00', NULL);
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('a38f9099-dd50-4bb5-b21a-ece18c963eca', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'd3379b4f-5c0a-4a52-9de3-9cf256fc3dbb', '2026-02-10 20:57:25.941+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('78a11b59-6f75-46ad-ae19-9862c67d5a43', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'b3790f9e-636f-4430-a118-0666862c2e6b', '2026-02-10 20:57:25.941+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('7b30426e-03b7-4e45-8805-f0424bf942a3', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '23f355f2-a831-4ddd-9cfb-3343a8cb7c1a', '2026-02-10 20:57:25.941+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('26156ca1-8461-418e-8f6f-05d8c48fb8b3', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '3f5becc8-f6b3-4b48-b754-a35d4b5d808f', '2026-02-10 20:57:25.941+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('613af8c3-15f0-4e41-9b34-0e94738495df', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'c4d287a8-2dee-4599-acfd-52b6f7341930', '2026-02-10 20:57:25.941+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('e03db9d7-1549-446f-af5c-6e90404e1c84', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '693d4e75-dff5-43c6-874c-4cf3714d4d8d', '2026-02-10 20:57:25.941+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('2c23a56e-2ee2-442d-83ca-b9f95ded98b2', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '4598a3a3-2a54-40d4-b2b2-0722a423e495', '2026-02-10 20:57:25.941+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('e0d2948f-b6a0-4539-8138-90cca2d06138', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '22e19aa9-eacf-4b6a-a8e3-9fbc6b25f8b1', '2026-02-10 20:57:25.941+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('1e6b0888-1240-4424-a05c-d50484df4433', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '9691d18c-1c08-4cbd-add8-2066ead116f2', '2026-02-10 20:57:25.941+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('d0b6871d-d663-483e-84d2-3493359e4deb', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'f6abcc06-d08f-4760-9b20-34e7d27da8bd', '2026-02-10 20:57:25.941+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('220d763f-3e66-4856-84f9-fca40c712ca9', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '1e1d96b3-9e8d-433e-81a6-dbbbfdafa436', '2026-02-10 20:57:25.941+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('d8fec48b-038f-473a-8cfd-93fc31d97ca7', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '403e3b77-eb74-41d1-af18-f865d7b9e01a', '2026-02-10 20:57:25.941+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('da756ed9-9eed-4e18-9480-199c8a962f9b', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '0d700759-e013-4dcb-a06d-5ff38c63f6d0', '2026-02-10 20:57:25.941+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('3f188d13-720f-4376-af32-1b44f1197bb8', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'f66f304d-87d6-4426-849a-ab04071c1446', '2026-02-10 20:57:25.941+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('648a79b1-dd3f-437f-b7a9-9457c34f9561', 'fbc807d7-c739-4293-b50e-601cc19e1e41', '9849bd2a-8936-4675-b26d-56f1bbfd0daa', '2026-02-10 20:57:25.941+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('40ee726c-a3be-4769-bbcc-3926dff7c708', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'ba731a3e-2652-4fe3-8d7b-ef56c91ef947', '2026-02-10 20:57:25.941+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('9b69cfc2-c109-4d24-9e80-f272aad79216', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'db2fe425-b1f7-42a3-8574-671a5ab4c8ed', '2026-02-10 20:57:25.941+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('f83311e3-3010-4150-8b46-4df89437d02f', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'd96a762d-5297-4fb1-a220-fa89424a1cd2', '2026-02-10 20:57:25.941+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('aae4e852-dc4c-47aa-b127-2ab2cf7fe216', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'd3379b4f-5c0a-4a52-9de3-9cf256fc3dbb', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('af070dae-455f-4ae3-9749-f7adc52a9a1f', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'b3790f9e-636f-4430-a118-0666862c2e6b', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('f1e66829-75f5-40d8-b027-3fee7fe86704', 'c8e80340-054e-451c-a53f-104b188fe0ec', '23f355f2-a831-4ddd-9cfb-3343a8cb7c1a', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('9c7e1bd2-afed-46c5-85c9-eb518164b154', 'c8e80340-054e-451c-a53f-104b188fe0ec', '3f5becc8-f6b3-4b48-b754-a35d4b5d808f', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('2aa134c6-8153-4c8f-b35c-8cd7794e6e49', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'c4d287a8-2dee-4599-acfd-52b6f7341930', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('f616c98f-4fc3-4c0f-8dc9-cd15ac2b6db8', 'c8e80340-054e-451c-a53f-104b188fe0ec', '693d4e75-dff5-43c6-874c-4cf3714d4d8d', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('6c0b8666-bdd3-4708-81db-aa1f94d48b42', 'c8e80340-054e-451c-a53f-104b188fe0ec', '4598a3a3-2a54-40d4-b2b2-0722a423e495', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('9e3477e4-7057-4b59-8dbb-f1cd957638b8', 'c8e80340-054e-451c-a53f-104b188fe0ec', '22e19aa9-eacf-4b6a-a8e3-9fbc6b25f8b1', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('e07aa854-e8a0-4fea-a6b5-9ce37bbd1458', 'c8e80340-054e-451c-a53f-104b188fe0ec', '9691d18c-1c08-4cbd-add8-2066ead116f2', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('a3781cd3-fff1-425e-bdd7-5e7c80264662', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'f6abcc06-d08f-4760-9b20-34e7d27da8bd', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('a28b17e4-136a-4240-9886-c5d471e25898', 'c8e80340-054e-451c-a53f-104b188fe0ec', '1e1d96b3-9e8d-433e-81a6-dbbbfdafa436', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('d5026407-a3fd-497d-9455-4151b945447e', 'c8e80340-054e-451c-a53f-104b188fe0ec', '403e3b77-eb74-41d1-af18-f865d7b9e01a', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('39926305-018b-4f82-9f63-c96088b3291a', 'c8e80340-054e-451c-a53f-104b188fe0ec', '0d700759-e013-4dcb-a06d-5ff38c63f6d0', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('deab4e52-1efc-440f-ab75-5a26f313ba48', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'f66f304d-87d6-4426-849a-ab04071c1446', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('9a64b1ba-0c46-4ea4-ae9c-cf4b2ede375d', 'c8e80340-054e-451c-a53f-104b188fe0ec', '9849bd2a-8936-4675-b26d-56f1bbfd0daa', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('de0f1499-97c6-4889-b2db-859181790ba4', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'ba731a3e-2652-4fe3-8d7b-ef56c91ef947', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('1241b35c-0fbf-48e2-b12d-b31ab7c87173', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'db2fe425-b1f7-42a3-8574-671a5ab4c8ed', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('5cd30c10-92b5-4e6e-ad3b-2ceb49e7d28c', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'd96a762d-5297-4fb1-a220-fa89424a1cd2', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('53fbd895-440b-4825-a0f5-6589be08236e', 'c8e80340-054e-451c-a53f-104b188fe0ec', '38f1fc6d-0681-4d93-bc8c-f15f768d56e3', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('b25c46ec-156e-4816-a791-e317e3e4d9a7', 'c8e80340-054e-451c-a53f-104b188fe0ec', '8cbe2b47-a386-4305-b01d-818b795ddf0a', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');
INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at, granted_by) VALUES ('839b5cf2-e104-4815-9eb1-d6978c6cbe54', 'c8e80340-054e-451c-a53f-104b188fe0ec', 'cae30d9a-adb2-4f6c-a112-62092f293193', '2026-02-10 20:57:35.084+00', 'test-superadmin-001');


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.roles (id, name, description, hierarchy_level, created_at, updated_at) VALUES ('4fd4b3b3-dd51-443c-8836-d59af653d244', 'customer', 'Regular customer with basic permissions', 0, '2026-01-25 04:27:10.300782+00', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.roles (id, name, description, hierarchy_level, created_at, updated_at) VALUES ('625453b9-d560-4cd8-9a90-c9897d039dc2', 'support', 'Support staff with limited admin permissions', 1, '2026-01-25 04:27:10.300782+00', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.roles (id, name, description, hierarchy_level, created_at, updated_at) VALUES ('03437257-409d-4735-81b2-7fd0eea98672', 'corporate', 'Corporate account user', 2, '2026-01-25 04:27:10.300782+00', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.roles (id, name, description, hierarchy_level, created_at, updated_at) VALUES ('bae96556-98bd-472c-ac6d-7e53f43dd7ce', 'manager', 'Manager with elevated permissions', 3, '2026-01-25 04:27:10.300782+00', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.roles (id, name, description, hierarchy_level, created_at, updated_at) VALUES ('09510acf-2e77-4ae0-8206-3b154b391821', 'admin', 'Administrator with most permissions', 4, '2026-01-25 04:27:10.300782+00', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.roles (id, name, description, hierarchy_level, created_at, updated_at) VALUES ('fbc807d7-c739-4293-b50e-601cc19e1e41', 'super_admin', 'Super administrator with all permissions', 5, '2026-01-25 04:27:10.300782+00', '2026-01-25 04:27:10.300782+00');
INSERT INTO public.roles (id, name, description, hierarchy_level, created_at, updated_at) VALUES ('73893c08-90f2-4c1b-8114-53057e1d388c', 'CUSTOMER', 'Regular customer', 1, '2026-01-26 17:57:25.045+00', '2026-01-26 17:57:25.045+00');
INSERT INTO public.roles (id, name, description, hierarchy_level, created_at, updated_at) VALUES ('2baf70f1-5bb1-45bd-aeeb-a4cc409efc26', 'SUPPORT', 'Support staff', 2, '2026-01-26 17:57:25.069+00', '2026-01-26 17:57:25.069+00');
INSERT INTO public.roles (id, name, description, hierarchy_level, created_at, updated_at) VALUES ('12f934fa-4dde-433d-808d-5cd75f451db8', 'MANAGER', 'Manager', 3, '2026-01-26 17:57:25.076+00', '2026-01-26 17:57:25.076+00');
INSERT INTO public.roles (id, name, description, hierarchy_level, created_at, updated_at) VALUES ('4d0cd4a1-3c74-4782-a766-8020f0296e00', 'ADMIN', 'Administrator', 4, '2026-01-26 17:57:25.083+00', '2026-01-26 17:57:25.083+00');
INSERT INTO public.roles (id, name, description, hierarchy_level, created_at, updated_at) VALUES ('c8e80340-054e-451c-a53f-104b188fe0ec', 'SUPER_ADMIN', 'Super administrator', 5, '2026-01-26 17:57:25.091+00', '2026-01-26 17:57:25.091+00');
INSERT INTO public.roles (id, name, description, hierarchy_level, created_at, updated_at) VALUES ('dd3949f5-89c7-4468-b2c6-b21023e1cd41', 'Discount Manager', 'Can manage discounts and apply them to carts', 0, '2026-02-10 18:04:08.99+00', '2026-02-10 18:04:08.99+00');


--
-- Data for Name: search_analytics; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: search_click_tracking; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: search_logs; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: search_optimization_experiments; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: search_performance_metrics; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: search_recommendations; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: search_trending; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: up_sell_products; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: user_communication_preferences; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: user_data_exports; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: user_notification_preferences; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.user_notification_preferences (id, "userId", "emailNotifications", "smsNotifications", "whatsappNotifications", "marketingCommunications", "newsletterSubscription", "notificationFrequency", "createdAt", "updatedAt") VALUES ('f2207ff5-1dc1-4909-aa93-bdcd8675abbc', '2bdca14e-ac33-43ca-b98a-5117c8ecdeb9', true, false, false, false, false, 'immediate', '2026-01-26 17:39:08.111', '2026-01-26 17:39:08.111');


--
-- Data for Name: user_privacy_settings; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.user_privacy_settings (id, "userId", "profileVisibility", "showEmail", "showPhone", "showAddress", "allowSearchByEmail", "allowSearchByPhone", "twoFactorEnabled", "twoFactorSecret", "twoFactorMethod", "dataSharingEnabled", "createdAt", "updatedAt", profile_visibility) VALUES ('cf291fd0-a3b1-48f0-9b72-cae43802c7a5', '2bdca14e-ac33-43ca-b98a-5117c8ecdeb9', 'private', false, false, false, false, false, false, NULL, NULL, true, '2026-01-26 17:39:08.153', '2026-01-26 17:39:08.153', 'public');


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.user_roles (id, user_id, role_id, assigned_by, assigned_at, expires_at, is_active) VALUES ('50a104e9-11e5-4eec-8b38-9cbadc3e6f6b', 'test-superadmin-001', 'fbc807d7-c739-4293-b50e-601cc19e1e41', 'test-superadmin-001', '2026-02-10 19:19:26.876215+00', NULL, true);
INSERT INTO public.user_roles (id, user_id, role_id, assigned_by, assigned_at, expires_at, is_active) VALUES ('d72f020f-5337-49b9-b7a1-84e0529ab94f', 'ea59bf47-4b66-431d-ba63-a0a69437798f', '4d0cd4a1-3c74-4782-a766-8020f0296e00', 'ea59bf47-4b66-431d-ba63-a0a69437798f', '2026-01-26 17:57:54.524+00', NULL, true);
INSERT INTO public.user_roles (id, user_id, role_id, assigned_by, assigned_at, expires_at, is_active) VALUES ('81a586c6-b031-41ec-8ff1-fcfb375e368c', '90270928-766e-49dd-bee0-13ede11e9dad', '4d0cd4a1-3c74-4782-a766-8020f0296e00', '90270928-766e-49dd-bee0-13ede11e9dad', '2026-01-26 17:57:54.6+00', NULL, true);
INSERT INTO public.user_roles (id, user_id, role_id, assigned_by, assigned_at, expires_at, is_active) VALUES ('34101207-f361-46a0-a526-63129fd0e154', '84672403-5f9f-4d77-8f01-795a3fc6e3ae', '12f934fa-4dde-433d-808d-5cd75f451db8', '92df20d4-1c7b-401f-8005-3c68b1572519', '2026-02-09 15:48:51.882+00', NULL, true);
INSERT INTO public.user_roles (id, user_id, role_id, assigned_by, assigned_at, expires_at, is_active) VALUES ('fd02a126-fe03-42c0-a8c4-4ad2f0f0ef18', '44ac9bed-0c3a-4327-b0b4-102b1a0a00bd', '73893c08-90f2-4c1b-8114-53057e1d388c', NULL, '2026-02-10 15:03:04.744454+00', NULL, true);


--
-- Data for Name: user_search_preferences; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.user_sessions (id, "userId", token, "expiresAt", "createdAt") VALUES ('79d079de-30a1-460c-8508-93a5acdfa9db', 'ea59bf47-4b66-431d-ba63-a0a69437798f', 'remember_me:63e08cfb0e6706a64e665083e95dc7c3813ab307274e85a9ffa85c6f1b189e40', '2026-03-06 08:32:54.894', '2026-02-04 08:32:54.895');
INSERT INTO public.user_sessions (id, "userId", token, "expiresAt", "createdAt") VALUES ('3763044d-3b86-4270-bdcb-8dd626602f07', 'ea59bf47-4b66-431d-ba63-a0a69437798f', 'remember_me:675645230289e7d1f06938869c04be9c82061dea8e231cae229c41631e36973d', '2026-03-09 06:16:15.032', '2026-02-07 06:16:15.035');
INSERT INTO public.user_sessions (id, "userId", token, "expiresAt", "createdAt") VALUES ('9e00c349-e7f7-4090-b6f1-5b9e824527bb', 'ea59bf47-4b66-431d-ba63-a0a69437798f', 'remember_me:d066b6244dde9ceece1662028e1287db93437ac56fa1f84890abfa707afc84f4', '2026-03-09 08:03:16.497', '2026-02-07 08:03:16.5');
INSERT INTO public.user_sessions (id, "userId", token, "expiresAt", "createdAt") VALUES ('8709eed1-89d3-414d-9245-8dd66250525a', 'ea59bf47-4b66-431d-ba63-a0a69437798f', '7c117840721f0ccced49623916ccd22190bb91f816e828191311b0edab22c85c', '2026-02-19 08:41:41.285', '2026-02-12 08:41:41.286');
INSERT INTO public.user_sessions (id, "userId", token, "expiresAt", "createdAt") VALUES ('192d99fd-0e64-4e6b-bf50-795a566450eb', 'ea59bf47-4b66-431d-ba63-a0a69437798f', 'remember_me:7ddcc99d33176fe71d7087daa739e41faa1f8c3882eedc1cd16f68c5ad6da151', '2026-03-14 08:41:41.299', '2026-02-12 08:41:41.3');
INSERT INTO public.user_sessions (id, "userId", token, "expiresAt", "createdAt") VALUES ('1f2dc7c0-6973-4887-8157-ac55f788b873', '2bdca14e-ac33-43ca-b98a-5117c8ecdeb9', '82f260fd692600a00726a4dbab9b89dc19e40628e11f0c9ebcfa1afcf981d8f3', '2026-02-20 05:27:59.901', '2026-02-13 05:28:00');
INSERT INTO public.user_sessions (id, "userId", token, "expiresAt", "createdAt") VALUES ('237135b9-0f32-42b6-934c-744e830e1281', '2bdca14e-ac33-43ca-b98a-5117c8ecdeb9', 'remember_me:767163153949a251dbadaf87688cd7c38c8f47e1da6f180705e6c45d171428bc', '2026-03-15 05:28:00.075', '2026-02-13 05:28:00.076');
INSERT INTO public.user_sessions (id, "userId", token, "expiresAt", "createdAt") VALUES ('eaba0eb4-dc62-4385-93b7-44e5ebfb9265', 'ea59bf47-4b66-431d-ba63-a0a69437798f', '3284d19bd4b7245529e7966431bbecada56c54ed210e8fb1504ffb720266f3ae', '2026-02-20 05:28:35.921', '2026-02-13 05:28:35.923');
INSERT INTO public.user_sessions (id, "userId", token, "expiresAt", "createdAt") VALUES ('ccc9ed32-24be-4ddd-9806-e5ba97c9bb18', 'ea59bf47-4b66-431d-ba63-a0a69437798f', 'remember_me:b93b0553fe2bf573678f2f6731966b6c12d04dd7e85f9404e8dabf8c804e55eb', '2026-03-15 05:28:35.931', '2026-02-13 05:28:35.933');


--
-- Data for Name: user_social_accounts; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: smart_dev
--

INSERT INTO public.users (id, email, "emailVerified", phone, "phoneVerified", password, "firstName", "lastName", "dateOfBirth", gender, role, status, image, "createdAt", "updatedAt", "lastLoginAt", "preferredLanguage", "accountStatus", "deletionRequestedAt", "deletionReason", "deletedAt") VALUES ('90270928-766e-49dd-bee0-13ede11e9dad', 'admin2@smarttech.com', '2026-01-26 17:57:54.593', NULL, NULL, '$2a$10$GEfEun708c7SRlKWCI6x6e3wm2fYEyWCxEQ3Qf/shlDreqVMxdvQG', 'Admin', 'User 2', NULL, NULL, 'admin', 'active', NULL, '2026-01-26 17:57:54.595', '2026-01-26 17:57:54.595', NULL, 'en', 'active', NULL, NULL, NULL);
INSERT INTO public.users (id, email, "emailVerified", phone, "phoneVerified", password, "firstName", "lastName", "dateOfBirth", gender, role, status, image, "createdAt", "updatedAt", "lastLoginAt", "preferredLanguage", "accountStatus", "deletionRequestedAt", "deletionReason", "deletedAt") VALUES ('2bdca14e-ac33-43ca-b98a-5117c8ecdeb9', 'raselbepari88@gmail.com', NULL, '+8801914287530', NULL, '$2a$12$eP8GgqnYl05T3KbDKkumIe8NfWCvJPOpbpio8sjZ8h9zRFP3PdD/6', 'Rasel', 'Bepari', '1988-12-15 00:00:00', 'MALE', 'customer', 'active', '/uploads/profile-pictures/profile-2bdca14e-ac33-43ca-b98a-5117c8ecdeb9-1770459288185-576772264.jpg', '2026-01-26 17:34:10.345', '2026-02-13 20:38:19.017', '2026-02-13 20:38:19.015', 'en', 'active', NULL, NULL, NULL);
INSERT INTO public.users (id, email, "emailVerified", phone, "phoneVerified", password, "firstName", "lastName", "dateOfBirth", gender, role, status, image, "createdAt", "updatedAt", "lastLoginAt", "preferredLanguage", "accountStatus", "deletionRequestedAt", "deletionReason", "deletedAt") VALUES ('test-superadmin-001', 'test.superadmin@smarttech.com', NULL, NULL, NULL, '$2a$10$NHj93epFopyyVZyg/Ev2MeXNbAu.VWu/DU7ENL6j5UBEzxU4nLdfm', 'Super', 'Admin', NULL, NULL, 'super_admin', 'active', NULL, '2026-02-10 19:18:34.524', '2026-02-13 20:42:21.219', '2026-02-13 20:42:21.218', 'en', 'active', NULL, NULL, NULL);
INSERT INTO public.users (id, email, "emailVerified", phone, "phoneVerified", password, "firstName", "lastName", "dateOfBirth", gender, role, status, image, "createdAt", "updatedAt", "lastLoginAt", "preferredLanguage", "accountStatus", "deletionRequestedAt", "deletionReason", "deletedAt") VALUES ('9c18a472-b362-4bb7-9a4f-29563472317a', 'mdbaki@gmail.com', NULL, '+8801914287538', NULL, '$2a$12$AnhF8qP9M3Z.uxFK9gSQfuHxEay4HOsQEnEBXuRzuwea83EPx1I42', 'Mohammad1', 'Baki', NULL, NULL, 'customer', 'inactive', NULL, '2026-02-08 20:10:15.537', '2026-02-09 15:46:50.787', NULL, 'en', 'active', NULL, NULL, '2026-02-09 15:46:50.786');
INSERT INTO public.users (id, email, "emailVerified", phone, "phoneVerified", password, "firstName", "lastName", "dateOfBirth", gender, role, status, image, "createdAt", "updatedAt", "lastLoginAt", "preferredLanguage", "accountStatus", "deletionRequestedAt", "deletionReason", "deletedAt") VALUES ('84672403-5f9f-4d77-8f01-795a3fc6e3ae', 'raselbepari@gmail.com', NULL, NULL, NULL, '$2a$12$FQtSCgqbu5HC56aN606QqusxzsClul4IevUPbXqSvoM..XR8tCCwK', 'Mohammad', 'Rasel', NULL, NULL, 'manager', 'active', NULL, '2026-02-09 15:48:51.879', '2026-02-09 15:48:51.89', NULL, 'en', 'active', NULL, NULL, NULL);
INSERT INTO public.users (id, email, "emailVerified", phone, "phoneVerified", password, "firstName", "lastName", "dateOfBirth", gender, role, status, image, "createdAt", "updatedAt", "lastLoginAt", "preferredLanguage", "accountStatus", "deletionRequestedAt", "deletionReason", "deletedAt") VALUES ('35c1d3fe-3ccb-4730-b1d2-dce186ac7431', 'rasel.bepari@smartbd.com', NULL, '+8801914287537', NULL, '$2a$12$t.pmBi.66xkmtI2FWH3u8efYED/pVBYntBDbT2PRwWMxlwGR85XKa', 'Mohammad', 'Bepari', NULL, NULL, 'customer', 'inactive', NULL, '2026-02-08 20:07:32.835', '2026-02-09 15:46:53.802', NULL, 'en', 'active', NULL, NULL, '2026-02-09 15:46:53.801');
INSERT INTO public.users (id, email, "emailVerified", phone, "phoneVerified", password, "firstName", "lastName", "dateOfBirth", gender, role, status, image, "createdAt", "updatedAt", "lastLoginAt", "preferredLanguage", "accountStatus", "deletionRequestedAt", "deletionReason", "deletedAt") VALUES ('a07036d5-3be6-49ec-b2e7-89825d597482', 'invalid@_deleted_1770645430982', '2026-02-04 18:16:37.038', NULL, NULL, '$2a$10$icSgbzULDYui5C1uiEJe6uW9CJEFI/8mkJoDv2dYXTCO9UlakSkD2', 'Invalid', 'Email', NULL, NULL, 'customer', 'inactive', NULL, '2026-02-04 18:16:37.04', '2026-02-09 13:57:10.983', NULL, 'en', 'active', NULL, NULL, '2026-02-09 13:57:10.981');
INSERT INTO public.users (id, email, "emailVerified", phone, "phoneVerified", password, "firstName", "lastName", "dateOfBirth", gender, role, status, image, "createdAt", "updatedAt", "lastLoginAt", "preferredLanguage", "accountStatus", "deletionRequestedAt", "deletionReason", "deletedAt") VALUES ('c91fc160-e443-42a6-9662-9074ad043e02', '@invalid.com', '2026-02-03 17:53:42.241', NULL, NULL, '$2a$10$sd2zpU3XK47MqgSP2/rY2OjgthTwa0i05jAHSbiVz7dDaiV9XVr/S', 'Invalid', 'Email', NULL, NULL, 'customer', 'inactive', NULL, '2026-02-03 17:53:42.244', '2026-02-09 15:47:05.528', NULL, 'en', 'active', NULL, NULL, '2026-02-09 15:47:05.527');
INSERT INTO public.users (id, email, "emailVerified", phone, "phoneVerified", password, "firstName", "lastName", "dateOfBirth", gender, role, status, image, "createdAt", "updatedAt", "lastLoginAt", "preferredLanguage", "accountStatus", "deletionRequestedAt", "deletionReason", "deletedAt") VALUES ('0c43809b-46d0-466b-be8b-e3d56e58b886', 'invalid-email', '2026-02-03 17:00:59.678', NULL, NULL, '$2a$10$Ngd/jI6tqiM8TqYvWThDyOiE0OdUsw8i3bhnkJJ9EMPmBbF71rhea', 'Invalid', 'Email', NULL, NULL, 'customer', 'inactive', NULL, '2026-02-03 17:00:59.681', '2026-02-09 15:47:08.893', NULL, 'en', 'active', NULL, NULL, '2026-02-09 15:47:08.892');
INSERT INTO public.users (id, email, "emailVerified", phone, "phoneVerified", password, "firstName", "lastName", "dateOfBirth", gender, role, status, image, "createdAt", "updatedAt", "lastLoginAt", "preferredLanguage", "accountStatus", "deletionRequestedAt", "deletionReason", "deletedAt") VALUES ('bb810626-a9ed-4ef1-a3e2-ef5ea504fa87', 'rasel1@gmail.com', NULL, '+8801733398183', NULL, '$2a$12$wdEE95vDnb3MEyy3Fa7MMOhupYww/46TQDeRGBC80ScqlUGYT5ra.', 'Rasel1', 'Test1', NULL, NULL, 'manager', 'inactive', NULL, '2026-02-09 04:06:17.958', '2026-02-09 15:46:43.054', NULL, 'en', 'active', NULL, NULL, '2026-02-09 15:46:43.053');
INSERT INTO public.users (id, email, "emailVerified", phone, "phoneVerified", password, "firstName", "lastName", "dateOfBirth", gender, role, status, image, "createdAt", "updatedAt", "lastLoginAt", "preferredLanguage", "accountStatus", "deletionRequestedAt", "deletionReason", "deletedAt") VALUES ('b02c7a63-8530-43f2-aca1-59e88c19cdd8', 'invalid@', '2026-02-10 15:02:10.649', NULL, NULL, '$2a$10$0zBEQRCYyrTskNGATVGFj.sCgtx1NTnkvzj12AfSq5m11K.tT7fHy', 'Invalid', 'Email', NULL, NULL, 'customer', 'active', NULL, '2026-02-10 15:02:10.651', '2026-02-10 15:02:10.651', NULL, 'en', 'active', NULL, NULL, NULL);
INSERT INTO public.users (id, email, "emailVerified", phone, "phoneVerified", password, "firstName", "lastName", "dateOfBirth", gender, role, status, image, "createdAt", "updatedAt", "lastLoginAt", "preferredLanguage", "accountStatus", "deletionRequestedAt", "deletionReason", "deletedAt") VALUES ('44ac9bed-0c3a-4327-b0b4-102b1a0a00bd', 'testuser1770735781379@example.com', NULL, '+8801826773152', NULL, '$2a$12$8bgm.GrpZtQrlm.sAF.WxuPsKfAiP.Fyk7AuvEtamr7FDmZGljcTW', 'Test', 'User', NULL, NULL, 'customer', 'active', NULL, '2026-02-10 15:03:04.691', '2026-02-10 15:03:07.415', '2026-02-10 15:03:07.413', 'en', 'active', NULL, NULL, NULL);
INSERT INTO public.users (id, email, "emailVerified", phone, "phoneVerified", password, "firstName", "lastName", "dateOfBirth", gender, role, status, image, "createdAt", "updatedAt", "lastLoginAt", "preferredLanguage", "accountStatus", "deletionRequestedAt", "deletionReason", "deletedAt") VALUES ('ea59bf47-4b66-431d-ba63-a0a69437798f', 'admin@smarttech.com', '2026-01-26 17:57:54.516', NULL, NULL, '$2a$12$SwmCZHTR4PYgAAapMsahQeuFMt7bZZRQq2pN/zTrTX3YigpcwR/Qy', 'Admin', 'User', NULL, NULL, 'admin', 'active', '/uploads/profile-pictures/profile-ea59bf47-4b66-431d-ba63-a0a69437798f-1770459208480-181302108.jpg', '2026-01-26 17:57:54.518', '2026-02-13 20:42:56.193', '2026-02-13 20:42:56.192', 'en', 'active', NULL, NULL, NULL);


--
-- Data for Name: variant_types; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: variant_values; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: wishlist_analytics; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: wishlist_items; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Data for Name: wishlists; Type: TABLE DATA; Schema: public; Owner: smart_dev
--



--
-- Name: CartAuditLog CartAuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public."CartAuditLog"
    ADD CONSTRAINT "CartAuditLog_pkey" PRIMARY KEY (id);


--
-- Name: CartNote CartNote_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public."CartNote"
    ADD CONSTRAINT "CartNote_pkey" PRIMARY KEY (id);


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
-- Name: cart_analytics cart_analytics_cart_id_key; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.cart_analytics
    ADD CONSTRAINT cart_analytics_cart_id_key UNIQUE (cart_id);


--
-- Name: cart_analytics cart_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.cart_analytics
    ADD CONSTRAINT cart_analytics_pkey PRIMARY KEY (id);


--
-- Name: cart_cleanup_audit cart_cleanup_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.cart_cleanup_audit
    ADD CONSTRAINT cart_cleanup_audit_pkey PRIMARY KEY (id);


--
-- Name: cart_events cart_events_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.cart_events
    ADD CONSTRAINT cart_events_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: cart_share_tokens cart_share_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.cart_share_tokens
    ADD CONSTRAINT cart_share_tokens_pkey PRIMARY KEY (id);


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
-- Name: comparison_history comparison_history_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.comparison_history
    ADD CONSTRAINT comparison_history_pkey PRIMARY KEY (id);


--
-- Name: comparison_share_tokens comparison_share_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.comparison_share_tokens
    ADD CONSTRAINT comparison_share_tokens_pkey PRIMARY KEY (id);


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
-- Name: product_comparison_items product_comparison_items_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.product_comparison_items
    ADD CONSTRAINT product_comparison_items_pkey PRIMARY KEY (id);


--
-- Name: product_comparisons product_comparisons_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.product_comparisons
    ADD CONSTRAINT product_comparisons_pkey PRIMARY KEY (id);


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
-- Name: search_analytics search_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.search_analytics
    ADD CONSTRAINT search_analytics_pkey PRIMARY KEY (id);


--
-- Name: search_click_tracking search_click_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.search_click_tracking
    ADD CONSTRAINT search_click_tracking_pkey PRIMARY KEY (id);


--
-- Name: search_logs search_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.search_logs
    ADD CONSTRAINT search_logs_pkey PRIMARY KEY (id);


--
-- Name: search_optimization_experiments search_optimization_experiments_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.search_optimization_experiments
    ADD CONSTRAINT search_optimization_experiments_pkey PRIMARY KEY (id);


--
-- Name: search_performance_metrics search_performance_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.search_performance_metrics
    ADD CONSTRAINT search_performance_metrics_pkey PRIMARY KEY (id);


--
-- Name: search_recommendations search_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.search_recommendations
    ADD CONSTRAINT search_recommendations_pkey PRIMARY KEY (id);


--
-- Name: search_trending search_trending_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.search_trending
    ADD CONSTRAINT search_trending_pkey PRIMARY KEY (id);


--
-- Name: search_trending search_trending_query_key; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.search_trending
    ADD CONSTRAINT search_trending_query_key UNIQUE (query);


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
-- Name: user_search_preferences user_search_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.user_search_preferences
    ADD CONSTRAINT user_search_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_search_preferences user_search_preferences_userId_key; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.user_search_preferences
    ADD CONSTRAINT "user_search_preferences_userId_key" UNIQUE ("userId");


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
-- Name: wishlist_analytics wishlist_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.wishlist_analytics
    ADD CONSTRAINT wishlist_analytics_pkey PRIMARY KEY (id);


--
-- Name: wishlist_items wishlist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_pkey PRIMARY KEY (id);


--
-- Name: wishlist_items wishlist_items_wishlistid_productid_key; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_wishlistid_productid_key UNIQUE ("wishlistId", "productId");


--
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);


--
-- Name: wishlists wishlists_shareToken_key; Type: CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT "wishlists_shareToken_key" UNIQUE ("shareToken");


--
-- Name: CartAuditLog_action_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "CartAuditLog_action_idx" ON public."CartAuditLog" USING btree (action);


--
-- Name: CartAuditLog_cartId_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "CartAuditLog_cartId_idx" ON public."CartAuditLog" USING btree ("cartId");


--
-- Name: CartAuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "CartAuditLog_createdAt_idx" ON public."CartAuditLog" USING btree ("createdAt");


--
-- Name: CartAuditLog_performedBy_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "CartAuditLog_performedBy_idx" ON public."CartAuditLog" USING btree ("performedBy");


--
-- Name: CartNote_cartId_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "CartNote_cartId_idx" ON public."CartNote" USING btree ("cartId");


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
-- Name: cart_analytics_cart_id_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX cart_analytics_cart_id_idx ON public.cart_analytics USING btree (cart_id);


--
-- Name: cart_events_cart_id_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX cart_events_cart_id_idx ON public.cart_events USING btree (cart_id);


--
-- Name: cart_events_cart_id_timestamp_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX cart_events_cart_id_timestamp_idx ON public.cart_events USING btree (cart_id, "timestamp");


--
-- Name: cart_events_event_type_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX cart_events_event_type_idx ON public.cart_events USING btree (event_type);


--
-- Name: cart_events_timestamp_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX cart_events_timestamp_idx ON public.cart_events USING btree ("timestamp");


--
-- Name: cart_events_user_id_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX cart_events_user_id_idx ON public.cart_events USING btree (user_id);


--
-- Name: cart_items_cart_id_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX cart_items_cart_id_idx ON public.cart_items USING btree (cart_id);


--
-- Name: cart_items_product_id_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX cart_items_product_id_idx ON public.cart_items USING btree (product_id);


--
-- Name: cart_items_variant_id_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX cart_items_variant_id_idx ON public.cart_items USING btree (variant_id);


--
-- Name: cart_share_tokens_cart_id_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX cart_share_tokens_cart_id_idx ON public.cart_share_tokens USING btree (cart_id);


--
-- Name: cart_share_tokens_expires_at_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX cart_share_tokens_expires_at_idx ON public.cart_share_tokens USING btree (expires_at);


--
-- Name: cart_share_tokens_token_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX cart_share_tokens_token_idx ON public.cart_share_tokens USING btree (token);


--
-- Name: cart_share_tokens_token_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX cart_share_tokens_token_key ON public.cart_share_tokens USING btree (token);


--
-- Name: carts_expires_at_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX carts_expires_at_idx ON public.carts USING btree (expires_at);


--
-- Name: carts_session_id_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX carts_session_id_idx ON public.carts USING btree (session_id);


--
-- Name: carts_status_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX carts_status_idx ON public.carts USING btree (status);


--
-- Name: carts_user_id_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX carts_user_id_idx ON public.carts USING btree (user_id);


--
-- Name: carts_user_id_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX carts_user_id_key ON public.carts USING btree (user_id);


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
-- Name: comparison_history_comparisonId_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "comparison_history_comparisonId_idx" ON public.comparison_history USING btree ("comparisonId");


--
-- Name: comparison_history_createdAt_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "comparison_history_createdAt_idx" ON public.comparison_history USING btree ("createdAt");


--
-- Name: comparison_history_userId_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "comparison_history_userId_idx" ON public.comparison_history USING btree ("userId");


--
-- Name: comparison_share_tokens_comparison_id_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX comparison_share_tokens_comparison_id_idx ON public.comparison_share_tokens USING btree (comparison_id);


--
-- Name: comparison_share_tokens_expires_at_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX comparison_share_tokens_expires_at_idx ON public.comparison_share_tokens USING btree (expires_at);


--
-- Name: comparison_share_tokens_token_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX comparison_share_tokens_token_key ON public.comparison_share_tokens USING btree (token);


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
-- Name: idx_cart_cleanup_audit_cart_id; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_cart_cleanup_audit_cart_id ON public.cart_cleanup_audit USING btree (cart_id);


--
-- Name: idx_cart_cleanup_audit_timestamp; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_cart_cleanup_audit_timestamp ON public.cart_cleanup_audit USING btree ("timestamp");


--
-- Name: idx_cart_cleanup_audit_type; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_cart_cleanup_audit_type ON public.cart_cleanup_audit USING btree (type);


--
-- Name: idx_cart_cleanup_audit_user_id; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_cart_cleanup_audit_user_id ON public.cart_cleanup_audit USING btree (user_id);


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
-- Name: idx_search_logs_query; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_search_logs_query ON public.search_logs USING btree (query);


--
-- Name: INDEX idx_search_logs_query; Type: COMMENT; Schema: public; Owner: smart_dev
--

COMMENT ON INDEX public.idx_search_logs_query IS 'Index for search pattern and popular query analysis';


--
-- Name: idx_search_logs_timestamp; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX idx_search_logs_timestamp ON public.search_logs USING btree ("timestamp");


--
-- Name: INDEX idx_search_logs_timestamp; Type: COMMENT; Schema: public; Owner: smart_dev
--

COMMENT ON INDEX public.idx_search_logs_timestamp IS 'Index for time-based search analytics queries';


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
-- Name: product_comparison_items_comparisonId_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "product_comparison_items_comparisonId_idx" ON public.product_comparison_items USING btree ("comparisonId");


--
-- Name: product_comparison_items_comparisonId_productId_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX "product_comparison_items_comparisonId_productId_key" ON public.product_comparison_items USING btree ("comparisonId", "productId");


--
-- Name: product_comparison_items_productId_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "product_comparison_items_productId_idx" ON public.product_comparison_items USING btree ("productId");


--
-- Name: product_comparisons_expiresAt_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "product_comparisons_expiresAt_idx" ON public.product_comparisons USING btree ("expiresAt");


--
-- Name: product_comparisons_sessionId_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "product_comparisons_sessionId_idx" ON public.product_comparisons USING btree ("sessionId");


--
-- Name: product_comparisons_userId_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "product_comparisons_userId_idx" ON public.product_comparisons USING btree ("userId");


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
-- Name: search_analytics_query_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX search_analytics_query_idx ON public.search_analytics USING btree (query);


--
-- Name: search_analytics_sessionId_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "search_analytics_sessionId_idx" ON public.search_analytics USING btree ("sessionId");


--
-- Name: search_analytics_timestamp_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX search_analytics_timestamp_idx ON public.search_analytics USING btree ("timestamp");


--
-- Name: search_analytics_userId_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "search_analytics_userId_idx" ON public.search_analytics USING btree ("userId");


--
-- Name: search_click_tracking_clickedAt_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "search_click_tracking_clickedAt_idx" ON public.search_click_tracking USING btree ("clickedAt");


--
-- Name: search_click_tracking_productId_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "search_click_tracking_productId_idx" ON public.search_click_tracking USING btree ("productId");


--
-- Name: search_click_tracking_searchAnalyticsId_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "search_click_tracking_searchAnalyticsId_idx" ON public.search_click_tracking USING btree ("searchAnalyticsId");


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
-- Name: search_optimization_experiments_algorithmVariant_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "search_optimization_experiments_algorithmVariant_idx" ON public.search_optimization_experiments USING btree ("algorithmVariant");


--
-- Name: search_optimization_experiments_isActive_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "search_optimization_experiments_isActive_idx" ON public.search_optimization_experiments USING btree ("isActive");


--
-- Name: search_optimization_experiments_startDate_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "search_optimization_experiments_startDate_idx" ON public.search_optimization_experiments USING btree ("startDate");


--
-- Name: search_performance_metrics_timestamp_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX search_performance_metrics_timestamp_idx ON public.search_performance_metrics USING btree ("timestamp");


--
-- Name: search_recommendations_createdAt_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "search_recommendations_createdAt_idx" ON public.search_recommendations USING btree ("createdAt");


--
-- Name: search_recommendations_productId_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "search_recommendations_productId_idx" ON public.search_recommendations USING btree ("productId");


--
-- Name: search_recommendations_recommendationType_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "search_recommendations_recommendationType_idx" ON public.search_recommendations USING btree ("recommendationType");


--
-- Name: search_recommendations_score_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX search_recommendations_score_idx ON public.search_recommendations USING btree (score);


--
-- Name: search_recommendations_userId_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "search_recommendations_userId_idx" ON public.search_recommendations USING btree ("userId");


--
-- Name: search_trending_isTrending_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "search_trending_isTrending_idx" ON public.search_trending USING btree ("isTrending");


--
-- Name: search_trending_lastSearchedAt_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "search_trending_lastSearchedAt_idx" ON public.search_trending USING btree ("lastSearchedAt");


--
-- Name: search_trending_query_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX search_trending_query_idx ON public.search_trending USING btree (query);


--
-- Name: search_trending_trendScore_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "search_trending_trendScore_idx" ON public.search_trending USING btree ("trendScore");


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
-- Name: user_search_preferences_userId_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "user_search_preferences_userId_idx" ON public.user_search_preferences USING btree ("userId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_phone_key; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE UNIQUE INDEX users_phone_key ON public.users USING btree (phone);


--
-- Name: wishlist_analytics_createdAt_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "wishlist_analytics_createdAt_idx" ON public.wishlist_analytics USING btree ("createdAt" DESC);


--
-- Name: wishlist_analytics_eventType_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "wishlist_analytics_eventType_idx" ON public.wishlist_analytics USING btree ("eventType");


--
-- Name: wishlist_items_addedAt_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "wishlist_items_addedAt_idx" ON public.wishlist_items USING btree ("addedAt" DESC);


--
-- Name: wishlists_isPublic_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "wishlists_isPublic_idx" ON public.wishlists USING btree ("isPublic");


--
-- Name: wishlists_shareToken_idx; Type: INDEX; Schema: public; Owner: smart_dev
--

CREATE INDEX "wishlists_shareToken_idx" ON public.wishlists USING btree ("shareToken");


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
-- Name: cart_analytics cart_analytics_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.cart_analytics
    ADD CONSTRAINT cart_analytics_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_events cart_events_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.cart_events
    ADD CONSTRAINT cart_events_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cart_items cart_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cart_share_tokens cart_share_tokens_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.cart_share_tokens
    ADD CONSTRAINT cart_share_tokens_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: carts carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: categories categories_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comparison_history comparison_history_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.comparison_history
    ADD CONSTRAINT "comparison_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: comparison_share_tokens comparison_share_tokens_comparison_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.comparison_share_tokens
    ADD CONSTRAINT comparison_share_tokens_comparison_id_fkey FOREIGN KEY (comparison_id) REFERENCES public.product_comparisons(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
    ADD CONSTRAINT "password_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: product_comparison_items product_comparison_items_comparisonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.product_comparison_items
    ADD CONSTRAINT "product_comparison_items_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES public.product_comparisons(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_comparison_items product_comparison_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.product_comparison_items
    ADD CONSTRAINT "product_comparison_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: product_comparisons product_comparisons_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.product_comparisons
    ADD CONSTRAINT "product_comparisons_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: search_analytics search_analytics_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.search_analytics
    ADD CONSTRAINT "search_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: search_click_tracking search_click_tracking_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.search_click_tracking
    ADD CONSTRAINT "search_click_tracking_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: search_click_tracking search_click_tracking_searchAnalyticsId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.search_click_tracking
    ADD CONSTRAINT "search_click_tracking_searchAnalyticsId_fkey" FOREIGN KEY ("searchAnalyticsId") REFERENCES public.search_analytics(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: search_logs search_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.search_logs
    ADD CONSTRAINT "search_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: search_recommendations search_recommendations_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.search_recommendations
    ADD CONSTRAINT "search_recommendations_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: search_recommendations search_recommendations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.search_recommendations
    ADD CONSTRAINT "search_recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: user_search_preferences user_search_preferences_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_dev
--

ALTER TABLE ONLY public.user_search_preferences
    ADD CONSTRAINT "user_search_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


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

\unrestrict qDG1MWKXCygufvge5z14X5Sy1VDEqmZkCxqfO2ccPHerg6PLCPElJO7zu4kRoEJ

