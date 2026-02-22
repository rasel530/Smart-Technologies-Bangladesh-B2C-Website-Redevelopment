-- CreateEnum
CREATE TYPE "BrandStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'manager', 'customer', 'corporate', 'super_admin', 'support');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended', 'pending');

-- CreateEnum
CREATE TYPE "Division" AS ENUM ('dhaka', 'chittagong', 'rajshahi', 'sylhet', 'khulna', 'barishal', 'rangpur', 'mymensingh');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('shipping', 'billing', 'home', 'work', 'other');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('active', 'inactive', 'out_of_stock', 'discontinued', 'draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "ProductVisibility" AS ENUM ('public', 'private', 'restricted');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('credit_card', 'bank_transfer', 'cash_on_delivery', 'emi', 'mcash', 'bkash', 'nagad', 'rocket');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "SocialProvider" AS ENUM ('google', 'facebook');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('percentage', 'fixed_amount');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('public', 'private', 'friends_only');

-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('active', 'abandoned', 'converted', 'expired');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('pending', 'syncing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "MoveType" AS ENUM ('cart_to_wishlist', 'wishlist_to_cart');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "phone" TEXT,
    "phoneVerified" TIMESTAMP(3),
    "password" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'customer',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "preferredLanguage" TEXT DEFAULT 'en',
    "accountStatus" TEXT DEFAULT 'active',
    "deletionRequestedAt" TIMESTAMP(3),
    "deletionReason" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AddressType" NOT NULL DEFAULT 'shipping',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "division" "Division" NOT NULL,
    "upazila" TEXT,
    "postalCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_social_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "SocialProvider" NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "featuredOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "logoUrl" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "metaTitle" TEXT,
    "nameBn" TEXT,
    "nameEn" TEXT,
    "status" "BrandStatus" NOT NULL DEFAULT 'active',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "websiteUrl" TEXT,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "iconUrl" TEXT,
    "imageUrl" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "metaTitle" TEXT,
    "nameBn" TEXT,
    "nameEn" TEXT,
    "status" "CategoryStatus" NOT NULL DEFAULT 'active',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameBn" TEXT,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "brandId" TEXT NOT NULL,
    "regularPrice" DECIMAL(12,2) NOT NULL,
    "salePrice" DECIMAL(12,2),
    "costPrice" DECIMAL(12,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "status" "ProductStatus" NOT NULL DEFAULT 'active',
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isNewArrival" BOOLEAN NOT NULL DEFAULT false,
    "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
    "warrantyPeriod" INTEGER,
    "warrantyType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "visibility" "ProductVisibility" NOT NULL DEFAULT 'public',

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "original_url" TEXT NOT NULL,
    "optimized_url" TEXT,
    "thumbnail_url" TEXT,
    "alt_text_bn" VARCHAR(250),
    "alt_text_en" VARCHAR(250),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "file_size_bytes" INTEGER,
    "mime_type" VARCHAR(50),
    "width" INTEGER,
    "height" INTEGER,
    "processing_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_specifications" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_specifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "comparePrice" DECIMAL(12,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variant_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_values" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "variantTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variant_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cross_sell_products" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "relatedProductId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cross_sell_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "up_sell_products" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "relatedProductId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "up_sell_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "related_products" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "relatedProductId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "related_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shipping_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "CartStatus" NOT NULL DEFAULT 'active',
    "abandoned_at" TIMESTAMP(3),
    "recovered_at" TIMESTAMP(3),
    "recovery_token" VARCHAR(255),
    "recovery_token_expires" TIMESTAMP(3),
    "recovery_attempts" INTEGER NOT NULL DEFAULT 0,
    "recovery_email_sent_at" TIMESTAMP(3),
    "reminder_count" INTEGER NOT NULL DEFAULT 0,
    "last_reminder_at" TIMESTAMP(3),
    "abandonment_reason" VARCHAR(255),
    "recovery_notes" TEXT,
    "discount_code" VARCHAR(50),
    "discount_amount" DECIMAL(10,2),
    "last_recovery_at" TIMESTAMP(3),

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_recovery_events" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255),
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_recovery_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_recovery_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "first_email_delay" INTEGER NOT NULL DEFAULT 1,
    "second_email_delay" INTEGER NOT NULL DEFAULT 24,
    "third_email_delay" INTEGER NOT NULL DEFAULT 72,
    "discount_enabled" BOOLEAN NOT NULL DEFAULT true,
    "discount_percentage" INTEGER NOT NULL DEFAULT 10,
    "discount_code" VARCHAR(50) NOT NULL DEFAULT 'COMEBACK10',
    "max_recovery_attempts" INTEGER NOT NULL DEFAULT 3,
    "min_cart_value" DECIMAL(12,2) NOT NULL DEFAULT 1000,
    "email_from_name" VARCHAR(100) NOT NULL DEFAULT 'Smart Tech',
    "email_from_address" VARCHAR(255) NOT NULL DEFAULT 'noreply@smarttech.com',
    "cart_abandonment_threshold" INTEGER NOT NULL DEFAULT 30,
    "recovery_token_expiry" INTEGER NOT NULL DEFAULT 7,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_recovery_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_analytics" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "events" JSONB NOT NULL DEFAULT '{}',
    "conversion_funnel" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "abandonment_reasons" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "cart_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_events" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" VARCHAR(50) NOT NULL,
    "product_id" TEXT,
    "quantity" INTEGER,
    "price" DECIMAL(12,2),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_share_tokens" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_share_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "share_token" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "product_id" TEXT NOT NULL,
    "wishlist_id" TEXT NOT NULL,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_analytics" (
    "id" TEXT NOT NULL,
    "wishlistId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shippingCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "internalNotes" TEXT,
    "paymentDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "corporate_account_id" UUID,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "transactionId" TEXT,
    "gatewayResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "comment" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "minAmount" DECIMAL(12,2) NOT NULL,
    "maxDiscount" DECIMAL(5,2) NOT NULL,
    "usageLimit" INTEGER NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phone_otps" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "phone" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "whatsappNotifications" BOOLEAN NOT NULL DEFAULT false,
    "marketingCommunications" BOOLEAN NOT NULL DEFAULT false,
    "newsletterSubscription" BOOLEAN NOT NULL DEFAULT false,
    "notificationFrequency" TEXT NOT NULL DEFAULT 'immediate',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_communication_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "preferredTimezone" TEXT NOT NULL DEFAULT 'UTC',
    "preferredContactMethod" TEXT NOT NULL DEFAULT 'email',
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "dataSharingConsent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_communication_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_privacy_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'private',
    "showEmail" BOOLEAN NOT NULL DEFAULT false,
    "showPhone" BOOLEAN NOT NULL DEFAULT false,
    "showAddress" BOOLEAN NOT NULL DEFAULT false,
    "allowSearchByEmail" BOOLEAN NOT NULL DEFAULT false,
    "allowSearchByPhone" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "twoFactorMethod" TEXT,
    "dataSharingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "profile_visibility" "ProfileVisibility" DEFAULT 'public',

    CONSTRAINT "user_privacy_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_deletion_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deletionToken" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_deletion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_data_exports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exportToken" TEXT NOT NULL,
    "dataTypes" JSONB NOT NULL,
    "format" TEXT NOT NULL,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readyAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_data_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_escalation_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "current_role_id" UUID,
    "requested_role_id" UUID NOT NULL,
    "requested_by" TEXT,
    "status" VARCHAR(20) DEFAULT 'pending',
    "reason" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMPTZ(6),
    "review_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_escalation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "granted_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "granted_by" TEXT,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "hierarchy_level" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_by" TEXT,
    "assigned_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_registration_number" TEXT NOT NULL,
    "tin_number" TEXT,
    "business_address" TEXT NOT NULL,
    "business_division" TEXT NOT NULL,
    "business_district" TEXT NOT NULL,
    "business_upazila" TEXT,
    "business_postal_code" TEXT,
    "authorized_person_name" TEXT NOT NULL,
    "authorized_person_email" TEXT NOT NULL,
    "authorized_person_phone" TEXT NOT NULL,
    "company_email" TEXT NOT NULL,
    "credit_limit" DECIMAL(12,2),
    "credit_used" DECIMAL(12,2) DEFAULT 0,
    "account_status" VARCHAR(50) DEFAULT 'pending_verification',
    "verification_status" VARCHAR(50) DEFAULT 'pending',
    "account_manager_id" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "corporate_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "corporate_account_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "assigned_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "corporate_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "corporate_account_id" UUID NOT NULL,
    "document_type" VARCHAR(50) NOT NULL,
    "document_name" TEXT NOT NULL,
    "document_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMP(3),
    "verified_by" TEXT,
    "status" VARCHAR(50) DEFAULT 'pending',

    CONSTRAINT "corporate_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_approvals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "corporate_account_id" UUID NOT NULL,
    "request_type" VARCHAR(50) NOT NULL,
    "requested_by" TEXT NOT NULL,
    "requested_amount" DECIMAL(12,2),
    "requested_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "status" VARCHAR(50) DEFAULT 'pending',
    "notes" TEXT,

    CONSTRAINT "corporate_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_pricing" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "corporate_account_id" UUID NOT NULL,
    "product_id" TEXT NOT NULL,
    "discount_percent" DECIMAL(5,2) DEFAULT 0,
    "special_price" DECIMAL(12,2),
    "valid_from" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "valid_to" TIMESTAMP(3),

    CONSTRAINT "corporate_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_logs" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "userId" TEXT,
    "resultsCount" INTEGER NOT NULL DEFAULT 0,
    "executionTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_comparisons" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "product_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_comparison_items" (
    "id" TEXT NOT NULL,
    "comparisonId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "product_comparison_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comparison_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comparisonId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comparison_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comparison_share_tokens" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "comparison_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comparison_share_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "resultsCount" INTEGER NOT NULL DEFAULT 0,
    "responseTime" INTEGER NOT NULL DEFAULT 0,
    "clickedResults" JSONB NOT NULL DEFAULT '[]',
    "filtersApplied" JSONB NOT NULL DEFAULT '{}',
    "sortBy" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "conversionType" TEXT,
    "productId" TEXT,

    CONSTRAINT "search_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_performance_metrics" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "queryCount" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTime" INTEGER NOT NULL DEFAULT 0,
    "p95ResponseTime" INTEGER NOT NULL DEFAULT 0,
    "p99ResponseTime" INTEGER NOT NULL DEFAULT 0,
    "cacheHitRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "zeroResultQueries" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "search_performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_trending" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    "trendScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastSearchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT,
    "isTrending" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "search_trending_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_optimization_experiments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "algorithmVariant" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "sampleSize" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "search_optimization_experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_search_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredCategories" JSONB NOT NULL DEFAULT '[]',
    "preferredBrands" JSONB NOT NULL DEFAULT '[]',
    "priceRangeMin" INTEGER,
    "priceRangeMax" INTEGER,
    "searchHistory" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "user_search_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "converted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "search_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_click_tracking" (
    "id" TEXT NOT NULL,
    "searchAnalyticsId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dwellTime" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "search_click_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_cleanup_audit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" VARCHAR(100) NOT NULL,
    "cart_id" VARCHAR(255),
    "user_id" VARCHAR(255),
    "session_id" VARCHAR(255),
    "details" JSONB DEFAULT '{}',
    "timestamp" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_cleanup_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartAuditLog" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "previousValue" JSONB,
    "newValue" JSONB,
    "performedBy" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartNote" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_wishlist_sync" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "cart_id" TEXT,
    "wishlist_id" TEXT,
    "last_sync_at" TIMESTAMP(6),
    "error_message" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sync_status" "SyncStatus",

    CONSTRAINT "cart_wishlist_sync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_wishlist_move_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER DEFAULT 1,
    "source_id" TEXT,
    "destination_id" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "move_type" "MoveType",

    CONSTRAINT "cart_wishlist_move_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emi_providers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "website" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "min_amount" DECIMAL(12,2) NOT NULL,
    "max_amount" DECIMAL(12,2) NOT NULL,
    "processing_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "interest_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emi_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emi_plans" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "interest_rate" DECIMAL(5,2) NOT NULL,
    "min_amount" DECIMAL(12,2) NOT NULL,
    "max_amount" DECIMAL(12,2) NOT NULL,
    "processing_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "down_payment" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emi_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cod_settings" (
    "id" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "min_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "max_amount" DECIMAL(12,2) NOT NULL DEFAULT 100000,
    "available_divisions" TEXT[] DEFAULT ARRAY['dhaka', 'chittagong', 'khulna', 'rajshahi', 'sylhet', 'barishal', 'rangpur', 'mymensingh']::TEXT[],
    "unavailable_divisions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "additional_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "free_above_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "require_phone_verification" BOOLEAN NOT NULL DEFAULT false,
    "require_address_verification" BOOLEAN NOT NULL DEFAULT false,
    "max_daily_orders" INTEGER NOT NULL DEFAULT 5,
    "max_weekly_orders" INTEGER NOT NULL DEFAULT 10,
    "delivery_days" INTEGER NOT NULL DEFAULT 3,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cod_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "local_payment_methods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minAmount" DECIMAL(12,2) NOT NULL DEFAULT 10,
    "maxAmount" DECIMAL(12,2) NOT NULL DEFAULT 200000,
    "processingFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "processingFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "requiresPhone" BOOLEAN NOT NULL DEFAULT true,
    "requiresPin" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "instructions" TEXT,
    "supportedNetworks" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "local_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "isSubscribed" BOOLEAN NOT NULL DEFAULT true,
    "transactionId" TEXT,
    "lastPaymentAt" TIMESTAMP(3),
    "nextPaymentAt" TIMESTAMP(3),
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offline_cart_changes" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "deviceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "quantity" INTEGER,
    "previousValue" JSONB,
    "newValue" JSONB,
    "isSynced" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offline_cart_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_analytics_bd" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "deviceId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "deviceType" TEXT,
    "browser" TEXT,
    "networkType" TEXT,
    "networkSpeed" TEXT,
    "screenResolution" TEXT,
    "cartId" TEXT,
    "action" TEXT NOT NULL,
    "productId" TEXT,
    "paymentMethod" TEXT,
    "emiPlanId" TEXT,
    "duration" INTEGER,
    "pageCount" INTEGER,
    "touchCount" INTEGER,
    "scrollDepth" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_analytics_bd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_sms_subscription" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "events" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_sms_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_offline_sync" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cart_id" TEXT,
    "device_id" TEXT,
    "last_sync_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "synced_items_count" INTEGER NOT NULL DEFAULT 0,
    "conflicts_resolved" INTEGER NOT NULL DEFAULT 0,
    "sync_status" TEXT NOT NULL DEFAULT 'idle',
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_offline_sync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_sms_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "message_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_sms_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT,
    "current_step" TEXT NOT NULL DEFAULT 'address',
    "shipping_address_id" TEXT,
    "billing_address_id" TEXT,
    "shipping_method" TEXT,
    "payment_method" TEXT,
    "cart_id" TEXT NOT NULL,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout_abandonment" (
    "id" TEXT NOT NULL,
    "checkout_session_id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT,
    "abandonment_step" TEXT NOT NULL,
    "abandonment_reason" TEXT,
    "cart_value" DECIMAL(12,2) NOT NULL,
    "item_count" INTEGER NOT NULL,
    "recovery_email_sent" BOOLEAN NOT NULL DEFAULT false,
    "recovery_email_sent_at" TIMESTAMP(3),
    "recovered" BOOLEAN NOT NULL DEFAULT false,
    "recovered_at" TIMESTAMP(3),
    "recovery_attempts" INTEGER NOT NULL DEFAULT 0,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkout_abandonment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_sessions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "cart_id" TEXT NOT NULL,
    "metadata" JSONB,
    "last_activity_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "converted_to_user_id" TEXT,
    "converted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE INDEX "brands_status_idx" ON "brands"("status");

-- CreateIndex
CREATE INDEX "brands_isFeatured_idx" ON "brands"("isFeatured");

-- CreateIndex
CREATE INDEX "idx_brands_is_featured" ON "brands"("isFeatured");

-- CreateIndex
CREATE INDEX "idx_brands_status" ON "brands"("status");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_status_idx" ON "categories"("status");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- CreateIndex
CREATE INDEX "idx_categories_parent_id" ON "categories"("parentId");

-- CreateIndex
CREATE INDEX "idx_categories_status" ON "categories"("status");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "products_visibility_idx" ON "products"("visibility");

-- CreateIndex
CREATE INDEX "products_regularPrice_idx" ON "products"("regularPrice");

-- CreateIndex
CREATE INDEX "products_salePrice_idx" ON "products"("salePrice");

-- CreateIndex
CREATE INDEX "products_brandId_idx" ON "products"("brandId");

-- CreateIndex
CREATE INDEX "products_createdAt_idx" ON "products"("createdAt");

-- CreateIndex
CREATE INDEX "products_updatedAt_idx" ON "products"("updatedAt");

-- CreateIndex
CREATE INDEX "idx_products_brand_id" ON "products"("brandId");

-- CreateIndex
CREATE INDEX "idx_products_created_at" ON "products"("createdAt");

-- CreateIndex
CREATE INDEX "idx_products_regular_price" ON "products"("regularPrice");

-- CreateIndex
CREATE INDEX "idx_products_sale_price" ON "products"("salePrice");

-- CreateIndex
CREATE INDEX "idx_products_status" ON "products"("status");

-- CreateIndex
CREATE INDEX "idx_products_updated_at" ON "products"("updatedAt");

-- CreateIndex
CREATE INDEX "idx_products_visibility" ON "products"("visibility");

-- CreateIndex
CREATE INDEX "idx_product_images_product_id" ON "product_images"("product_id");

-- CreateIndex
CREATE INDEX "idx_product_images_display_order" ON "product_images"("product_id", "display_order");

-- CreateIndex
CREATE INDEX "idx_product_images_processing_status" ON "product_images"("processing_status");

-- CreateIndex
CREATE INDEX "idx_product_images_is_primary" ON "product_images"("product_id", "is_primary");

-- CreateIndex
CREATE INDEX "product_categories_productId_idx" ON "product_categories"("productId");

-- CreateIndex
CREATE INDEX "product_categories_categoryId_idx" ON "product_categories"("categoryId");

-- CreateIndex
CREATE INDEX "product_categories_isPrimary_idx" ON "product_categories"("isPrimary");

-- CreateIndex
CREATE INDEX "idx_product_categories_category_id" ON "product_categories"("categoryId");

-- CreateIndex
CREATE INDEX "idx_product_categories_is_primary" ON "product_categories"("isPrimary");

-- CreateIndex
CREATE INDEX "idx_product_categories_product_id" ON "product_categories"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_productId_categoryId_key" ON "product_categories"("productId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "cross_sell_products_productId_relatedProductId_key" ON "cross_sell_products"("productId", "relatedProductId");

-- CreateIndex
CREATE UNIQUE INDEX "up_sell_products_productId_relatedProductId_key" ON "up_sell_products"("productId", "relatedProductId");

-- CreateIndex
CREATE UNIQUE INDEX "related_products_productId_relatedProductId_key" ON "related_products"("productId", "relatedProductId");

-- CreateIndex
CREATE UNIQUE INDEX "carts_user_id_key" ON "carts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "carts_recovery_token_key" ON "carts"("recovery_token");

-- CreateIndex
CREATE INDEX "carts_expires_at_idx" ON "carts"("expires_at");

-- CreateIndex
CREATE INDEX "carts_session_id_idx" ON "carts"("session_id");

-- CreateIndex
CREATE INDEX "carts_status_idx" ON "carts"("status");

-- CreateIndex
CREATE INDEX "carts_user_id_idx" ON "carts"("user_id");

-- CreateIndex
CREATE INDEX "idx_carts_abandoned_at" ON "carts"("abandoned_at");

-- CreateIndex
CREATE INDEX "idx_carts_last_recovery_at" ON "carts"("last_recovery_at");

-- CreateIndex
CREATE INDEX "idx_carts_recovered_at" ON "carts"("recovered_at");

-- CreateIndex
CREATE INDEX "idx_carts_recovery_token" ON "carts"("recovery_token");

-- CreateIndex
CREATE INDEX "idx_cart_recovery_events_cart_id" ON "cart_recovery_events"("cart_id");

-- CreateIndex
CREATE INDEX "idx_cart_recovery_events_created_at" ON "cart_recovery_events"("created_at");

-- CreateIndex
CREATE INDEX "idx_cart_recovery_events_event_type" ON "cart_recovery_events"("event_type");

-- CreateIndex
CREATE INDEX "idx_cart_recovery_settings_updated" ON "cart_recovery_settings"("updated_at");

-- CreateIndex
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items"("cart_id");

-- CreateIndex
CREATE INDEX "cart_items_product_id_idx" ON "cart_items"("product_id");

-- CreateIndex
CREATE INDEX "cart_items_variant_id_idx" ON "cart_items"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_analytics_cart_id_key" ON "cart_analytics"("cart_id");

-- CreateIndex
CREATE INDEX "cart_analytics_cart_id_idx" ON "cart_analytics"("cart_id");

-- CreateIndex
CREATE INDEX "cart_events_cart_id_idx" ON "cart_events"("cart_id");

-- CreateIndex
CREATE INDEX "cart_events_cart_id_timestamp_idx" ON "cart_events"("cart_id", "timestamp");

-- CreateIndex
CREATE INDEX "cart_events_event_type_idx" ON "cart_events"("event_type");

-- CreateIndex
CREATE INDEX "cart_events_timestamp_idx" ON "cart_events"("timestamp");

-- CreateIndex
CREATE INDEX "cart_events_user_id_idx" ON "cart_events"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_share_tokens_token_key" ON "cart_share_tokens"("token");

-- CreateIndex
CREATE INDEX "cart_share_tokens_cart_id_idx" ON "cart_share_tokens"("cart_id");

-- CreateIndex
CREATE INDEX "cart_share_tokens_token_idx" ON "cart_share_tokens"("token");

-- CreateIndex
CREATE INDEX "cart_share_tokens_expires_at_idx" ON "cart_share_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_share_token_key" ON "wishlists"("share_token");

-- CreateIndex
CREATE INDEX "wishlists_share_token_idx" ON "wishlists"("share_token");

-- CreateIndex
CREATE INDEX "wishlists_is_public_idx" ON "wishlists"("is_public");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_user_id_is_default_key" ON "wishlists"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "wishlist_items_added_at_idx" ON "wishlist_items"("added_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_wishlist_id_product_id_key" ON "wishlist_items"("wishlist_id", "product_id");

-- CreateIndex
CREATE INDEX "wishlist_analytics_eventType_idx" ON "wishlist_analytics"("eventType");

-- CreateIndex
CREATE INDEX "wishlist_analytics_createdAt_idx" ON "wishlist_analytics"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_preferences_userId_key" ON "user_notification_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_communication_preferences_userId_key" ON "user_communication_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_privacy_settings_userId_key" ON "user_privacy_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "account_deletion_requests_deletionToken_key" ON "account_deletion_requests"("deletionToken");

-- CreateIndex
CREATE UNIQUE INDEX "user_data_exports_exportToken_key" ON "user_data_exports"("exportToken");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "idx_permissions_action" ON "permissions"("action");

-- CreateIndex
CREATE INDEX "idx_permissions_resource" ON "permissions"("resource");

-- CreateIndex
CREATE INDEX "idx_permissions_resource_action" ON "permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "idx_role_escalation_created_at" ON "role_escalation_requests"("created_at");

-- CreateIndex
CREATE INDEX "idx_role_escalation_current_role_id" ON "role_escalation_requests"("current_role_id");

-- CreateIndex
CREATE INDEX "idx_role_escalation_requested_role_id" ON "role_escalation_requests"("requested_role_id");

-- CreateIndex
CREATE INDEX "idx_role_escalation_status" ON "role_escalation_requests"("status");

-- CreateIndex
CREATE INDEX "idx_role_escalation_user_id" ON "role_escalation_requests"("user_id");

-- CreateIndex
CREATE INDEX "idx_role_permissions_granted_at" ON "role_permissions"("granted_at");

-- CreateIndex
CREATE INDEX "idx_role_permissions_permission_id" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "idx_role_permissions_role_id" ON "role_permissions"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_role_permission" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "idx_roles_hierarchy_level" ON "roles"("hierarchy_level");

-- CreateIndex
CREATE INDEX "idx_user_roles_assigned_at" ON "user_roles"("assigned_at");

-- CreateIndex
CREATE INDEX "idx_user_roles_expires_at" ON "user_roles"("expires_at");

-- CreateIndex
CREATE INDEX "idx_user_roles_is_active" ON "user_roles"("is_active");

-- CreateIndex
CREATE INDEX "idx_user_roles_role_id" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "idx_user_roles_user_id" ON "user_roles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_user_role_active" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "corporate_accounts_user_id_key" ON "corporate_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "corporate_accounts_company_registration_number_key" ON "corporate_accounts"("company_registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "unique_corporate_user" ON "corporate_users"("corporate_account_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_corporate_product_pricing" ON "corporate_pricing"("corporate_account_id", "product_id");

-- CreateIndex
CREATE INDEX "search_logs_userId_idx" ON "search_logs"("userId");

-- CreateIndex
CREATE INDEX "search_logs_timestamp_idx" ON "search_logs"("timestamp");

-- CreateIndex
CREATE INDEX "search_logs_query_idx" ON "search_logs"("query");

-- CreateIndex
CREATE INDEX "idx_search_logs_query" ON "search_logs"("query");

-- CreateIndex
CREATE INDEX "idx_search_logs_timestamp" ON "search_logs"("timestamp");

-- CreateIndex
CREATE INDEX "product_comparisons_userId_idx" ON "product_comparisons"("userId");

-- CreateIndex
CREATE INDEX "product_comparisons_sessionId_idx" ON "product_comparisons"("sessionId");

-- CreateIndex
CREATE INDEX "product_comparisons_expiresAt_idx" ON "product_comparisons"("expiresAt");

-- CreateIndex
CREATE INDEX "product_comparison_items_comparisonId_idx" ON "product_comparison_items"("comparisonId");

-- CreateIndex
CREATE INDEX "product_comparison_items_productId_idx" ON "product_comparison_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_comparison_items_comparisonId_productId_key" ON "product_comparison_items"("comparisonId", "productId");

-- CreateIndex
CREATE INDEX "comparison_history_userId_idx" ON "comparison_history"("userId");

-- CreateIndex
CREATE INDEX "comparison_history_comparisonId_idx" ON "comparison_history"("comparisonId");

-- CreateIndex
CREATE INDEX "comparison_history_createdAt_idx" ON "comparison_history"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "comparison_share_tokens_token_key" ON "comparison_share_tokens"("token");

-- CreateIndex
CREATE INDEX "comparison_share_tokens_comparison_id_idx" ON "comparison_share_tokens"("comparison_id");

-- CreateIndex
CREATE INDEX "comparison_share_tokens_expires_at_idx" ON "comparison_share_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "search_analytics_userId_idx" ON "search_analytics"("userId");

-- CreateIndex
CREATE INDEX "search_analytics_sessionId_idx" ON "search_analytics"("sessionId");

-- CreateIndex
CREATE INDEX "search_analytics_query_idx" ON "search_analytics"("query");

-- CreateIndex
CREATE INDEX "search_analytics_timestamp_idx" ON "search_analytics"("timestamp");

-- CreateIndex
CREATE INDEX "search_performance_metrics_timestamp_idx" ON "search_performance_metrics"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "search_trending_query_key" ON "search_trending"("query");

-- CreateIndex
CREATE INDEX "search_trending_query_idx" ON "search_trending"("query");

-- CreateIndex
CREATE INDEX "search_trending_isTrending_idx" ON "search_trending"("isTrending");

-- CreateIndex
CREATE INDEX "search_trending_trendScore_idx" ON "search_trending"("trendScore");

-- CreateIndex
CREATE INDEX "search_trending_lastSearchedAt_idx" ON "search_trending"("lastSearchedAt");

-- CreateIndex
CREATE INDEX "search_optimization_experiments_isActive_idx" ON "search_optimization_experiments"("isActive");

-- CreateIndex
CREATE INDEX "search_optimization_experiments_startDate_idx" ON "search_optimization_experiments"("startDate");

-- CreateIndex
CREATE INDEX "search_optimization_experiments_algorithmVariant_idx" ON "search_optimization_experiments"("algorithmVariant");

-- CreateIndex
CREATE UNIQUE INDEX "user_search_preferences_userId_key" ON "user_search_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_search_preferences_userId_idx" ON "user_search_preferences"("userId");

-- CreateIndex
CREATE INDEX "search_recommendations_userId_idx" ON "search_recommendations"("userId");

-- CreateIndex
CREATE INDEX "search_recommendations_productId_idx" ON "search_recommendations"("productId");

-- CreateIndex
CREATE INDEX "search_recommendations_recommendationType_idx" ON "search_recommendations"("recommendationType");

-- CreateIndex
CREATE INDEX "search_recommendations_score_idx" ON "search_recommendations"("score");

-- CreateIndex
CREATE INDEX "search_recommendations_createdAt_idx" ON "search_recommendations"("createdAt");

-- CreateIndex
CREATE INDEX "search_click_tracking_searchAnalyticsId_idx" ON "search_click_tracking"("searchAnalyticsId");

-- CreateIndex
CREATE INDEX "search_click_tracking_productId_idx" ON "search_click_tracking"("productId");

-- CreateIndex
CREATE INDEX "search_click_tracking_clickedAt_idx" ON "search_click_tracking"("clickedAt");

-- CreateIndex
CREATE INDEX "idx_cart_cleanup_audit_cart_id" ON "cart_cleanup_audit"("cart_id");

-- CreateIndex
CREATE INDEX "idx_cart_cleanup_audit_timestamp" ON "cart_cleanup_audit"("timestamp");

-- CreateIndex
CREATE INDEX "idx_cart_cleanup_audit_type" ON "cart_cleanup_audit"("type");

-- CreateIndex
CREATE INDEX "idx_cart_cleanup_audit_user_id" ON "cart_cleanup_audit"("user_id");

-- CreateIndex
CREATE INDEX "CartAuditLog_action_idx" ON "CartAuditLog"("action");

-- CreateIndex
CREATE INDEX "CartAuditLog_cartId_idx" ON "CartAuditLog"("cartId");

-- CreateIndex
CREATE INDEX "CartAuditLog_createdAt_idx" ON "CartAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "CartAuditLog_performedBy_idx" ON "CartAuditLog"("performedBy");

-- CreateIndex
CREATE INDEX "CartNote_cartId_idx" ON "CartNote"("cartId");

-- CreateIndex
CREATE INDEX "idx_cart_wishlist_sync_cart_id" ON "cart_wishlist_sync"("cart_id");

-- CreateIndex
CREATE INDEX "idx_cart_wishlist_sync_last_sync" ON "cart_wishlist_sync"("last_sync_at" DESC);

-- CreateIndex
CREATE INDEX "idx_cart_wishlist_sync_user_id" ON "cart_wishlist_sync"("user_id");

-- CreateIndex
CREATE INDEX "idx_cart_wishlist_sync_wishlist_id" ON "cart_wishlist_sync"("wishlist_id");

-- CreateIndex
CREATE INDEX "idx_move_history_created_at" ON "cart_wishlist_move_history"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_move_history_destination_id" ON "cart_wishlist_move_history"("destination_id");

-- CreateIndex
CREATE INDEX "idx_move_history_product_id" ON "cart_wishlist_move_history"("product_id");

-- CreateIndex
CREATE INDEX "idx_move_history_source_id" ON "cart_wishlist_move_history"("source_id");

-- CreateIndex
CREATE INDEX "idx_move_history_user_id" ON "cart_wishlist_move_history"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "emi_providers_code_key" ON "emi_providers"("code");

-- CreateIndex
CREATE INDEX "idx_emi_providers_is_active" ON "emi_providers"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "emi_plans_code_key" ON "emi_plans"("code");

-- CreateIndex
CREATE INDEX "idx_emi_plans_is_active" ON "emi_plans"("is_active");

-- CreateIndex
CREATE INDEX "idx_emi_plans_provider_id" ON "emi_plans"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "local_payment_methods_code_key" ON "local_payment_methods"("code");

-- CreateIndex
CREATE INDEX "local_payment_methods_isActive_idx" ON "local_payment_methods"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "sms_subscriptions_userId_key" ON "sms_subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sms_subscriptions_phoneNumber_key" ON "sms_subscriptions"("phoneNumber");

-- CreateIndex
CREATE INDEX "sms_subscriptions_paymentMethod_idx" ON "sms_subscriptions"("paymentMethod");

-- CreateIndex
CREATE INDEX "offline_cart_changes_userId_idx" ON "offline_cart_changes"("userId");

-- CreateIndex
CREATE INDEX "offline_cart_changes_sessionId_idx" ON "offline_cart_changes"("sessionId");

-- CreateIndex
CREATE INDEX "offline_cart_changes_deviceId_idx" ON "offline_cart_changes"("deviceId");

-- CreateIndex
CREATE INDEX "offline_cart_changes_isSynced_idx" ON "offline_cart_changes"("isSynced");

-- CreateIndex
CREATE INDEX "cart_analytics_bd_userId_idx" ON "cart_analytics_bd"("userId");

-- CreateIndex
CREATE INDEX "cart_analytics_bd_sessionId_idx" ON "cart_analytics_bd"("sessionId");

-- CreateIndex
CREATE INDEX "cart_analytics_bd_deviceId_idx" ON "cart_analytics_bd"("deviceId");

-- CreateIndex
CREATE INDEX "cart_analytics_bd_platform_idx" ON "cart_analytics_bd"("platform");

-- CreateIndex
CREATE INDEX "cart_analytics_bd_action_idx" ON "cart_analytics_bd"("action");

-- CreateIndex
CREATE INDEX "cart_analytics_bd_createdAt_idx" ON "cart_analytics_bd"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "cart_sms_subscription_user_id_key" ON "cart_sms_subscription"("user_id");

-- CreateIndex
CREATE INDEX "idx_cart_sms_subscription_user_id" ON "cart_sms_subscription"("user_id");

-- CreateIndex
CREATE INDEX "idx_cart_sms_subscription_phone_number" ON "cart_sms_subscription"("phone_number");

-- CreateIndex
CREATE INDEX "idx_cart_sms_subscription_is_active" ON "cart_sms_subscription"("is_active");

-- CreateIndex
CREATE INDEX "idx_cart_sms_subscription_created_at" ON "cart_sms_subscription"("created_at");

-- CreateIndex
CREATE INDEX "idx_cart_offline_sync_user_id" ON "cart_offline_sync"("user_id");

-- CreateIndex
CREATE INDEX "idx_cart_offline_sync_cart_id" ON "cart_offline_sync"("cart_id");

-- CreateIndex
CREATE INDEX "idx_cart_offline_sync_device_id" ON "cart_offline_sync"("device_id");

-- CreateIndex
CREATE INDEX "idx_cart_offline_sync_last_sync_at" ON "cart_offline_sync"("last_sync_at");

-- CreateIndex
CREATE INDEX "idx_cart_offline_sync_sync_status" ON "cart_offline_sync"("sync_status");

-- CreateIndex
CREATE INDEX "idx_cart_sms_log_user_id" ON "cart_sms_log"("user_id");

-- CreateIndex
CREATE INDEX "idx_cart_sms_log_subscription_id" ON "cart_sms_log"("subscription_id");

-- CreateIndex
CREATE INDEX "idx_cart_sms_log_event_type" ON "cart_sms_log"("event_type");

-- CreateIndex
CREATE INDEX "idx_cart_sms_log_status" ON "cart_sms_log"("status");

-- CreateIndex
CREATE INDEX "idx_cart_sms_log_sent_at" ON "cart_sms_log"("sent_at");

-- CreateIndex
CREATE INDEX "idx_checkout_sessions_session_id" ON "checkout_sessions"("session_id");

-- CreateIndex
CREATE INDEX "idx_checkout_sessions_user_id" ON "checkout_sessions"("user_id");

-- CreateIndex
CREATE INDEX "idx_checkout_sessions_cart_id" ON "checkout_sessions"("cart_id");

-- CreateIndex
CREATE INDEX "idx_checkout_sessions_status" ON "checkout_sessions"("status");

-- CreateIndex
CREATE INDEX "idx_checkout_abandonment_checkout_session_id" ON "checkout_abandonment"("checkout_session_id");

-- CreateIndex
CREATE INDEX "idx_checkout_abandonment_user_id" ON "checkout_abandonment"("user_id");

-- CreateIndex
CREATE INDEX "idx_checkout_abandonment_session_id" ON "checkout_abandonment"("session_id");

-- CreateIndex
CREATE INDEX "idx_checkout_abandonment_recovered" ON "checkout_abandonment"("recovered");

-- CreateIndex
CREATE UNIQUE INDEX "guest_sessions_session_id_key" ON "guest_sessions"("session_id");

-- CreateIndex
CREATE INDEX "idx_guest_sessions_session_id" ON "guest_sessions"("session_id");

-- CreateIndex
CREATE INDEX "idx_guest_sessions_cart_id" ON "guest_sessions"("cart_id");

-- CreateIndex
CREATE INDEX "idx_guest_sessions_expires_at" ON "guest_sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_social_accounts" ADD CONSTRAINT "user_social_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_specifications" ADD CONSTRAINT "product_specifications_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_types" ADD CONSTRAINT "variant_types_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_values" ADD CONSTRAINT "variant_values_variantTypeId_fkey" FOREIGN KEY ("variantTypeId") REFERENCES "variant_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cross_sell_products" ADD CONSTRAINT "cross_sell_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cross_sell_products" ADD CONSTRAINT "cross_sell_products_relatedProductId_fkey" FOREIGN KEY ("relatedProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "up_sell_products" ADD CONSTRAINT "up_sell_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "up_sell_products" ADD CONSTRAINT "up_sell_products_relatedProductId_fkey" FOREIGN KEY ("relatedProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "related_products" ADD CONSTRAINT "related_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "related_products" ADD CONSTRAINT "related_products_relatedProductId_fkey" FOREIGN KEY ("relatedProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_recovery_events" ADD CONSTRAINT "cart_recovery_events_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_analytics" ADD CONSTRAINT "cart_analytics_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_events" ADD CONSTRAINT "cart_events_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_share_tokens" ADD CONSTRAINT "cart_share_tokens_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "wishlists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_analytics" ADD CONSTRAINT "wishlist_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_analytics" ADD CONSTRAINT "wishlist_analytics_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "wishlists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_corporate_account" FOREIGN KEY ("corporate_account_id") REFERENCES "corporate_accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_otps" ADD CONSTRAINT "phone_otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_history" ADD CONSTRAINT "password_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_communication_preferences" ADD CONSTRAINT "user_communication_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_privacy_settings" ADD CONSTRAINT "user_privacy_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_deletion_requests" ADD CONSTRAINT "account_deletion_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_data_exports" ADD CONSTRAINT "user_data_exports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_escalation_requests" ADD CONSTRAINT "fk_role_escalation_current_role" FOREIGN KEY ("current_role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_escalation_requests" ADD CONSTRAINT "fk_role_escalation_requested_role" FOREIGN KEY ("requested_role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_escalation_requests" ADD CONSTRAINT "fk_role_escalation_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "fk_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "fk_role_permissions_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "fk_user_roles_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "fk_user_roles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "corporate_accounts" ADD CONSTRAINT "fk_corporate_accounts_manager" FOREIGN KEY ("account_manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "corporate_accounts" ADD CONSTRAINT "fk_corporate_accounts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "corporate_users" ADD CONSTRAINT "fk_corporate_users_account" FOREIGN KEY ("corporate_account_id") REFERENCES "corporate_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "corporate_users" ADD CONSTRAINT "fk_corporate_users_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "corporate_documents" ADD CONSTRAINT "fk_corporate_documents_account" FOREIGN KEY ("corporate_account_id") REFERENCES "corporate_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "corporate_approvals" ADD CONSTRAINT "fk_corporate_approvals_account" FOREIGN KEY ("corporate_account_id") REFERENCES "corporate_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "corporate_pricing" ADD CONSTRAINT "fk_corporate_pricing_account" FOREIGN KEY ("corporate_account_id") REFERENCES "corporate_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "corporate_pricing" ADD CONSTRAINT "fk_corporate_pricing_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_comparisons" ADD CONSTRAINT "product_comparisons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_comparison_items" ADD CONSTRAINT "product_comparison_items_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "product_comparisons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_comparison_items" ADD CONSTRAINT "product_comparison_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparison_history" ADD CONSTRAINT "comparison_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparison_share_tokens" ADD CONSTRAINT "comparison_share_tokens_comparison_id_fkey" FOREIGN KEY ("comparison_id") REFERENCES "product_comparisons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_analytics" ADD CONSTRAINT "search_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_search_preferences" ADD CONSTRAINT "user_search_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_recommendations" ADD CONSTRAINT "search_recommendations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_recommendations" ADD CONSTRAINT "search_recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_click_tracking" ADD CONSTRAINT "search_click_tracking_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_click_tracking" ADD CONSTRAINT "search_click_tracking_searchAnalyticsId_fkey" FOREIGN KEY ("searchAnalyticsId") REFERENCES "search_analytics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_wishlist_sync" ADD CONSTRAINT "cart_wishlist_sync_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cart_wishlist_sync" ADD CONSTRAINT "cart_wishlist_sync_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cart_wishlist_sync" ADD CONSTRAINT "cart_wishlist_sync_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "wishlists"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cart_wishlist_move_history" ADD CONSTRAINT "cart_wishlist_move_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cart_wishlist_move_history" ADD CONSTRAINT "cart_wishlist_move_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "emi_plans" ADD CONSTRAINT "emi_plans_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "emi_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_sms_subscription" ADD CONSTRAINT "cart_sms_subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_offline_sync" ADD CONSTRAINT "cart_offline_sync_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_offline_sync" ADD CONSTRAINT "cart_offline_sync_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_sms_log" ADD CONSTRAINT "cart_sms_log_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "cart_sms_subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_sms_log" ADD CONSTRAINT "cart_sms_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_shipping_address_id_fkey" FOREIGN KEY ("shipping_address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_billing_address_id_fkey" FOREIGN KEY ("billing_address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_abandonment" ADD CONSTRAINT "checkout_abandonment_checkout_session_id_fkey" FOREIGN KEY ("checkout_session_id") REFERENCES "checkout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_sessions" ADD CONSTRAINT "guest_sessions_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

