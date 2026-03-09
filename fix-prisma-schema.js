#!/usr/bin/env node

/**
 * Comprehensive Prisma Schema Fix Script
 * 
 * This script analyzes the Prisma schema and codebase to identify and fix
 * all model and field naming mismatches between the schema and code.
 * 
 * Features:
 * - Analyzes Prisma schema for model and field names
 * - Scans backend JavaScript files for Prisma usage
 * - Scans frontend TypeScript files for Prisma usage
 * - Identifies naming mismatches
 * - Provides interactive fix options
 * - Creates backups before making changes
 * - Shows preview of changes before applying
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  backendDir: './backend',
  frontendDir: './frontend',
  prismaSchemaPath: './backend/prisma/schema.prisma',
  backupDir: './backups/prisma-fixes',
  // File extensions to scan
  backendExtensions: ['.js', '.ts'],
  frontendExtensions: ['.ts', '.tsx'],
  // Directories to exclude from scanning
  excludeDirs: ['node_modules', '.next', 'dist', 'build', '.git']
};

// ============================================================================
// PRISMA SCHEMA MODELS AND CORRECT NAMES
// ============================================================================

// Based on the actual schema analysis
const PRISMA_MODELS = {
  // Models that use snake_case plural names
  'addresses': 'addresses',
  'brands': 'brands',
  'categories': 'categories',
  'carts': 'carts',
  'orders': 'orders',
  'products': 'products',
  'reviews': 'reviews',
  'wishlists': 'wishlists',
  'users': 'users',
  'cart_items': 'cart_items',
  'order_items': 'order_items',
  'order_fulfillments': 'order_fulfillments',
  'order_modifications': 'order_modifications',
  'order_notes': 'order_notes',
  'order_notifications': 'order_notifications',
  'order_sharing': 'order_sharing',
  'order_status_history': 'order_status_history',
  'order_tracking_events': 'order_tracking_events',
  'order_cancellations': 'order_cancellations',
  'order_invoices': 'order_invoices',
  'product_categories': 'product_categories',
  'product_images': 'product_images',
  'product_variants': 'product_variants',
  'product_specifications': 'product_specifications',
  'wishlist_items': 'wishlist_items',
  'wishlist_analytics': 'wishlist_analytics',
  'cart_analytics': 'cart_analytics',
  'cart_events': 'cart_events',
  'cart_offline_sync': 'cart_offline_sync',
  'cart_recovery_events': 'cart_recovery_events',
  'cart_recovery_settings': 'cart_recovery_settings',
  'cart_share_tokens': 'cart_share_tokens',
  'cart_sms_log': 'cart_sms_log',
  'cart_sms_subscription': 'cart_sms_subscription',
  'cart_wishlist_move_history': 'cart_wishlist_move_history',
  'cart_wishlist_sync': 'cart_wishlist_sync',
  'cart_cleanup_audit': 'cart_cleanup_audit',
  'checkout_sessions': 'checkout_sessions',
  'checkout_abandonment': 'checkout_abandonment',
  'checkout_settings': 'checkout_settings',
  'cod_settings': 'cod_settings',
  'comparison_history': 'comparison_history',
  'comparison_share_tokens': 'comparison_share_tokens',
  'product_comparisons': 'product_comparisons',
  'product_comparison_items': 'product_comparison_items',
  'corporate_accounts': 'corporate_accounts',
  'corporate_approvals': 'corporate_approvals',
  'corporate_documents': 'corporate_documents',
  'corporate_pricing': 'corporate_pricing',
  'corporate_users': 'corporate_users',
  'courier_services': 'courier_services',
  'cross_sell_products': 'cross_sell_products',
  'delivery_confirmations': 'delivery_confirmations',
  'emi_plans': 'emi_plans',
  'emi_providers': 'emi_providers',
  'fraud_detection': 'fraud_detection',
  'guest_sessions': 'guest_sessions',
  'local_payment_methods': 'local_payment_methods',
  'offline_cart_changes': 'offline_cart_changes',
  'password_history': 'password_history',
  'payment_analytics': 'payment_analytics',
  'payment_cache': 'payment_cache',
  'payment_gateway_settings': 'payment_gateway_settings',
  'payment_log': 'payment_log',
  'payment_metrics': 'payment_metrics',
  'payment_queue': 'payment_queue',
  'payment_transaction': 'payment_transaction',
  'permissions': 'permissions',
  'phone_otps': 'phone_otps',
  'related_products': 'related_products',
  'role_escalation_requests': 'role_escalation_requests',
  'role_permissions': 'role_permissions',
  'roles': 'roles',
  'search_analytics': 'search_analytics',
  'search_click_tracking': 'search_click_tracking',
  'search_logs': 'search_logs',
  'search_optimization_experiments': 'search_optimization_experiments',
  'search_performance_metrics': 'search_performance_metrics',
  'search_recommendations': 'search_recommendations',
  'search_trending': 'search_trending',
  'security_audit': 'security_audit',
  'sms_subscriptions': 'sms_subscriptions',
  'transactions': 'transactions',
  'up_sell_products': 'up_sell_products',
  'user_communication_preferences': 'user_communication_preferences',
  'user_data_exports': 'user_data_exports',
  'user_notification_preferences': 'user_notification_preferences',
  'user_privacy_settings': 'user_privacy_settings',
  'user_roles': 'user_roles',
  'user_search_preferences': 'user_search_preferences',
  'user_sessions': 'user_sessions',
  'user_social_accounts': 'user_social_accounts',
  'variant_types': 'variant_types',
  'variant_values': 'variant_values',
  'account_deletion_requests': 'account_deletion_requests',
  'email_verification_tokens': 'email_verification_tokens',
  'coupons': 'coupons',
  // CamelCase models (keep as is)
  'CartAuditLog': 'CartAuditLog',
  'CartNote': 'CartNote'
};

// ============================================================================
// FIELD NAME MAPPINGS
// ============================================================================

// Backend: camelCase → snake_case (for database operations)
const BACKEND_FIELD_FIXES = {
  'firstName': 'first_name',
  'lastName': 'last_name',
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
  'deletedAt': 'deleted_at',
  'isActive': 'is_active',
  'isEmailVerified': 'is_email_verified',
  'emailVerified': 'email_verified',
  'phoneNumber': 'phone_number',
  'dateOfBirth': 'date_of_birth',
  'totalAmount': 'total',
  'totalPrice': 'total_price',
  'unitPrice': 'unit_price',
  'discountAmount': 'discount_amount',
  'shippingAmount': 'shipping_amount',
  'taxAmount': 'tax_amount',
  'orderStatus': 'order_status',
  'paymentStatus': 'payment_status',
  'paymentMethod': 'payment_method',
  'paymentType': 'payment_type',
  'transactionId': 'transaction_id',
  'transactionStatus': 'transaction_status',
  'transactionType': 'transaction_type',
  'userId': 'user_id',
  'productId': 'product_id',
  'categoryId': 'category_id',
  'brandId': 'brand_id',
  'orderId': 'order_id',
  'cartId': 'cart_id',
  'wishlistId': 'wishlist_id',
  'reviewId': 'review_id',
  'addressId': 'address_id',
  'courierServiceId': 'courier_service_id',
  'trackingNumber': 'tracking_number',
  'estimatedDelivery': 'estimated_delivery',
  'shippedAt': 'shipped_at',
  'deliveredAt': 'delivered_at',
  'packagingDetails': 'packaging_details',
  'fulfillmentId': 'fulfillment_id',
  'noteType': 'note_type',
  'isPinned': 'is_pinned',
  'createdBy': 'created_by',
  'updatedBy': 'updated_by',
  'changedBy': 'changed_by',
  'eventTime': 'event_time',
  'cancellationType': 'cancellation_type',
  'requestedBy': 'requested_by',
  'approvedBy': 'approved_by',
  'processedAt': 'processed_at',
  'modificationType': 'modification_type',
  'orderItems': 'order_items',
  'orderItem': 'order_item',
  'orderItems': 'order_items',
  'orderItem': 'order_item',
  'orderNumber': 'order_number',
  'addressId': 'address_id',
  'subtotal': 'subtotal',
  'shippingCost': 'shipping_cost',
  'paidAt': 'paid_at',
  'confirmedAt': 'confirmed_at',
  'shippedAt': 'shipped_at',
  'deliveredAt': 'delivered_at',
  'corporateAccountId': 'corporate_account_id',
  'paymentDetails': 'payment_details',
  'checkoutSessionId': 'checkout_session_id',
  'shippingMethod': 'shipping_method',
  'internalNotes': 'internal_notes',
  'expiresAt': 'expires_at',
  'verifiedAt': 'verified_at',
  'isVerified': 'is_verified',
  'isApproved': 'is_approved',
  'isPrimary': 'is_primary',
  'isDefault': 'is_default',
  'isPublic': 'is_public',
  'isActive': 'is_active',
  'isSubscribed': 'is_subscribed',
  'lastLoginAt': 'last_login_at',
  'preferredLanguage': 'preferred_language',
  'accountStatus': 'account_status',
  'deletionRequestedAt': 'deletion_requested_at',
  'deletionReason': 'deletion_reason',
  'displayOrder': 'display_order',
  'sortOrder': 'sort_order',
  'metaTitle': 'meta_title',
  'metaDescription': 'meta_description',
  'metaKeywords': 'meta_keywords',
  'nameBn': 'name_bn',
  'nameEn': 'name_en',
  'logoUrl': 'logo_url',
  'websiteUrl': 'website_url',
  'contactEmail': 'contact_email',
  'contactPhone': 'contact_phone',
  'isFeatured': 'is_featured',
  'featuredOrder': 'featured_order',
  'regularPrice': 'regular_price',
  'salePrice': 'sale_price',
  'costPrice': 'cost_price',
  'taxRate': 'tax_rate',
  'stockQuantity': 'stock_quantity',
  'lowStockThreshold': 'low_stock_threshold',
  'isNewArrival': 'is_new_arrival',
  'isBestSeller': 'is_best_seller',
  'warrantyPeriod': 'warranty_period',
  'warrantyType': 'warranty_type',
  'publishedAt': 'published_at',
  'visibility': 'visibility',
  'comparePrice': 'compare_price',
  'sku': 'sku',
  'slug': 'slug',
  'shortDescription': 'short_description',
  'description': 'description',
  'parentId': 'parent_id',
  'originalUrl': 'original_url',
  'optimizedUrl': 'optimized_url',
  'thumbnailUrl': 'thumbnail_url',
  'altTextBn': 'alt_text_bn',
  'altTextEn': 'alt_text_en',
  'fileSizeBytes': 'file_size_bytes',
  'mimeType': 'mime_type',
  'processingStatus': 'processing_status',
  'width': 'width',
  'height': 'height',
  'addedAt': 'added_at',
  'shareToken': 'share_token',
  'lastSyncAt': 'last_sync_at',
  'errorMessage': 'error_message',
  'syncStatus': 'sync_status',
  'moveType': 'move_type',
  'sourceId': 'source_id',
  'destinationId': 'destination_id',
  'subscriptionId': 'subscription_id',
  'eventType': 'event_type',
  'sentAt': 'sent_at',
  'unsubscribedAt': 'unsubscribed_at',
  'sessionId': 'session_id',
  'deviceId': 'device_id',
  'platform': 'platform',
  'deviceType': 'device_type',
  'browser': 'browser',
  'networkType': 'network_type',
  'networkSpeed': 'network_speed',
  'screenResolution': 'screen_resolution',
  'pageCount': 'page_count',
  'touchCount': 'touch_count',
  'scrollDepth': 'scroll_depth',
  'conversionFunnel': 'conversion_funnel',
  'abandonmentReasons': 'abandonment_reasons',
  'abandonedAt': 'abandoned_at',
  'recoveredAt': 'recovered_at',
  'recoveryToken': 'recovery_token',
  'recoveryTokenExpires': 'recovery_token_expires',
  'recoveryAttempts': 'recovery_attempts',
  'recoveryEmailSentAt': 'recovery_email_sent_at',
  'reminderCount': 'reminder_count',
  'lastReminderAt': 'last_reminder_at',
  'abandonmentReason': 'abandonment_reason',
  'recoveryNotes': 'recovery_notes',
  'discountCode': 'discount_code',
  'discountAmount': 'discount_amount',
  'lastRecoveryAt': 'last_recovery_at',
  'version': 'version',
  'syncedItemsCount': 'synced_items_count',
  'conflictsResolved': 'conflicts_resolved',
  'syncStatus': 'sync_status',
  'lastError': 'last_error',
  'firstEmailDelay': 'first_email_delay',
  'secondEmailDelay': 'second_email_delay',
  'thirdEmailDelay': 'third_email_delay',
  'discountEnabled': 'discount_enabled',
  'discountPercentage': 'discount_percentage',
  'maxRecoveryAttempts': 'max_recovery_attempts',
  'minCartValue': 'min_cart_value',
  'emailFromName': 'email_from_name',
  'emailFromAddress': 'email_from_address',
  'cartAbandonmentThreshold': 'cart_abandonment_threshold',
  'recoveryTokenExpiry': 'recovery_token_expiry',
  'sessionTimeout': 'session_timeout',
  'abandonmentEnabled': 'abandonment_enabled',
  'abandonmentTimeout': 'abandonment_timeout',
  'abandonmentCheckInterval': 'abandonment_check_interval',
  'recoveryEmailEnabled': 'recovery_email_enabled',
  'recoveryEmailDelay': 'recovery_email_delay',
  'recoveryEmailMaxAttempts': 'recovery_email_max_attempts',
  'guestCheckoutEnabled': 'guest_checkout_enabled',
  'guestRequireEmail': 'guest_require_email',
  'guestRequirePhone': 'guest_require_phone',
  'guestMaxSessionDuration': 'guest_max_session_duration',
  'guestAllowAccountCreation': 'guest_allow_account_creation',
  'securityRequireAuthForHighValue': 'security_require_auth_for_high_value',
  'securityHighValueThreshold': 'security_high_value_threshold',
  'securityEnableFraudDetection': 'security_enable_fraud_detection',
  'mobileEnabled': 'mobile_enabled',
  'mobileOptimizeForMobile': 'mobile_optimize_for_mobile',
  'mobileShowMobileOptimizedUI': 'mobile_show_mobile_optimized_ui',
  'stepsCartEnabled': 'steps_cart_enabled',
  'stepsCartRequired': 'steps_cart_required',
  'stepsShippingEnabled': 'steps_shipping_enabled',
  'stepsShippingRequired': 'steps_shipping_required',
  'stepsBillingEnabled': 'steps_billing_enabled',
  'stepsBillingRequired': 'steps_billing_required',
  'stepsPaymentEnabled': 'steps_payment_enabled',
  'stepsPaymentRequired': 'steps_payment_required',
  'stepsReviewEnabled': 'steps_review_enabled',
  'stepsReviewRequired': 'steps_review_required',
  'stepsConfirmationEnabled': 'steps_confirmation_enabled',
  'stepsConfirmationRequired': 'steps_confirmation_required',
  'isEnabled': 'is_enabled',
  'minAmount': 'min_amount',
  'maxAmount': 'max_amount',
  'availableDivisions': 'available_divisions',
  'unavailableDivisions': 'unavailable_divisions',
  'additionalFee': 'additional_fee',
  'freeAboveAmount': 'free_above_amount',
  'requirePhoneVerification': 'require_phone_verification',
  'requireAddressVerification': 'require_address_verification',
  'maxDailyOrders': 'max_daily_orders',
  'maxWeeklyOrders': 'max_weekly_orders',
  'deliveryDays': 'delivery_days',
  'comparisonId': 'comparison_id',
  'companyId': 'company_id',
  'companyName': 'company_name',
  'companyRegistrationNumber': 'company_registration_number',
  'tinNumber': 'tin_number',
  'businessAddress': 'business_address',
  'businessDivision': 'business_division',
  'businessDistrict': 'business_district',
  'businessUpazila': 'business_upazila',
  'businessPostalCode': 'business_postal_code',
  'authorizedPersonName': 'authorized_person_name',
  'authorizedPersonEmail': 'authorized_person_email',
  'authorizedPersonPhone': 'authorized_person_phone',
  'companyEmail': 'company_email',
  'creditLimit': 'credit_limit',
  'creditUsed': 'credit_used',
  'accountStatus': 'account_status',
  'verificationStatus': 'verification_status',
  'accountManagerId': 'account_manager_id',
  'verifiedAt': 'verified_at',
  'approvedBy': 'approved_by',
  'approvedAt': 'approved_at',
  'requestType': 'request_type',
  'requestedBy': 'requested_by',
  'requestedAmount': 'requested_amount',
  'requestedAt': 'requested_at',
  'approvedBy': 'approved_by',
  'approvedAt': 'approved_at',
  'documentType': 'document_type',
  'documentName': 'document_name',
  'documentUrl': 'document_url',
  'uploadedAt': 'uploaded_at',
  'verifiedBy': 'verified_by',
  'discountPercent': 'discount_percent',
  'specialPrice': 'special_price',
  'validFrom': 'valid_from',
  'validTo': 'valid_to',
  'isActive': 'is_active',
  'assignedAt': 'assigned_at',
  'expiresAt': 'expires_at',
  'code': 'code',
  'type': 'type',
  'value': 'value',
  'minAmount': 'min_amount',
  'maxDiscount': 'max_discount',
  'usageLimit': 'usage_limit',
  'usedCount': 'used_count',
  'isActive': 'is_active',
  'expiresAt': 'expires_at',
  'apiEndpoint': 'api_endpoint',
  'trackingUrl': 'tracking_url',
  'contactPhone': 'contact_phone',
  'contactEmail': 'contact_email',
  'isActive': 'is_active',
  'deliveryTime': 'delivery_time',
  'coverageAreas': 'coverage_areas',
  'baseRate': 'base_rate',
  'ratePerKg': 'rate_per_kg',
  'relatedProductId': 'related_product_id',
  'displayOrder': 'display_order',
  'confirmedBy': 'confirmed_by',
  'recipientName': 'recipient_name',
  'recipientPhone': 'recipient_phone',
  'confirmationMethod': 'confirmation_method',
  'signatureUrl': 'signature_url',
  'otpCode': 'otp_code',
  'deliveryLocation': 'delivery_location',
  'deliveryNotes': 'delivery_notes',
  'photos': 'photos',
  'confirmedAt': 'confirmed_at',
  'providerId': 'provider_id',
  'duration': 'duration',
  'interestRate': 'interest_rate',
  'processingFee': 'processing_fee',
  'downPayment': 'down_payment',
  'displayOrder': 'display_order',
  'logoUrl': 'logo_url',
  'minAmount': 'min_amount',
  'maxAmount': 'max_amount',
  'riskScore': 'risk_score',
  'riskLevel': 'risk_level',
  'detectionRules': 'detection_rules',
  'detectedAt': 'detected_at',
  'resolvedAt': 'resolved_at',
  'resolvedBy': 'resolved_by',
  'resolutionNotes': 'resolution_notes',
  'firstName': 'first_name',
  'lastName': 'last_name',
  'lastActivityAt': 'last_activity_at',
  'convertedToUserId': 'converted_to_user_id',
  'convertedAt': 'converted_at',
  'currentStep': 'current_step',
  'shippingMethod': 'shipping_method',
  'name': 'name',
  'displayName': 'display_name',
  'logoUrl': 'logo_url',
  'isActive': 'is_active',
  'minAmount': 'min_amount',
  'maxAmount': 'max_amount',
  'processingFee': 'processing_fee',
  'processingFeePercent': 'processing_fee_percent',
  'requiresPhone': 'requires_phone',
  'requiresPin': 'requires_pin',
  'description': 'description',
  'instructions': 'instructions',
  'supportedNetworks': 'supported_networks',
  'previousValue': 'previous_value',
  'newValue': 'new_value',
  'isSynced': 'is_synced',
  'syncedAt': 'synced_at',
  'failedAttempts': 'failed_attempts',
  'errorMessage': 'error_message',
  'refundAmount': 'refund_amount',
  'refundMethod': 'refund_method',
  'adminNotes': 'admin_notes',
  'shippingAddress': 'shipping_address',
  'packagingDetails': 'packaging_details',
  'weight': 'weight',
  'dimensions': 'dimensions',
  'invoiceNumber': 'invoice_number',
  'invoiceUrl': 'invoice_url',
  'pdfData': 'pdf_data',
  'generatedAt': 'generated_at',
  'sentAt': 'sent_at',
  'downloadedAt': 'downloaded_at',
  'downloadCount': 'download_count',
  'description': 'description',
  'changes': 'changes',
  'content': 'content',
  'notificationType': 'notification_type',
  'channel': 'channel',
  'recipient': 'recipient',
  'subject': 'subject',
  'message': 'message',
  'sentAt': 'sent_at',
  'deliveredAt': 'delivered_at',
  'failedAt': 'failed_at',
  'failureReason': 'failure_reason',
  'shareType': 'share_type',
  'maxViews': 'max_views',
  'viewCount': 'view_count',
  'password': 'password',
  'lastViewedAt': 'last_viewed_at',
  'previousStatus': 'previous_status',
  'newStatus': 'new_status',
  'changedBy': 'changed_by',
  'reason': 'reason',
  'location': 'location',
  'eventData': 'event_data',
  'isPublic': 'is_public',
  'createdAt': 'created_at',
  'passwordHash': 'password_hash',
  'date': 'date',
  'period': 'period',
  'totalRevenue': 'total_revenue',
  'totalTransactions': 'total_transactions',
  'successRate': 'success_rate',
  'failedTransactions': 'failed_transactions',
  'refundedAmount': 'refunded_amount',
  'gatewayBreakdown': 'gateway_breakdown',
  'methodBreakdown': 'method_breakdown',
  'cacheKey': 'cache_key',
  'cachedResponse': 'cached_response',
  'expiresAt': 'expires_at',
  'gateway': 'gateway',
  'isActive': 'is_active',
  'isTestMode': 'is_test_mode',
  'merchantId': 'merchant_id',
  'storeId': 'store_id',
  'apiKey': 'api_key',
  'apiSecret': 'api_secret',
  'publicKey': 'public_key',
  'privateKey': 'private_key',
  'webhookUrl': 'webhook_url',
  'returnUrl': 'return_url',
  'config': 'config',
  'transactionId': 'transaction_id',
  'eventType': 'event_type',
  'eventData': 'event_data',
  'ipAddress': 'ip_address',
  'userAgent': 'user_agent',
  'riskScore': 'risk_score',
  'isSuspicious': 'is_suspicious',
  'metricName': 'metric_name',
  'metricValue': 'metric_value',
  'metricType': 'metric_type',
  'paymentMethod': 'payment_method',
  'timestamp': 'timestamp',
  'priority': 'priority',
  'status': 'status',
  'attempts': 'attempts',
  'maxAttempts': 'max_attempts',
  'lastAttemptAt': 'last_attempt_at',
  'nextAttemptAt': 'next_attempt_at',
  'queueData': 'queue_data',
  'errorMessages': 'error_messages',
  'gatewayTransactionId': 'gateway_transaction_id',
  'paymentId': 'payment_id',
  'merchantInvoiceNumber': 'merchant_invoice_number',
  'customerMsisdn': 'customer_msisdn',
  'gatewayResponse': 'gateway_response',
  'callbackResponse': 'callback_response',
  'failureReason': 'failure_reason',
  'refundAmount': 'refund_amount',
  'refundedAt': 'refunded_at',
  'resource': 'resource',
  'action': 'action',
  'otp': 'otp',
  'isPrimary': 'is_primary',
  'addedAt': 'added_at',
  'notes': 'notes',
  'name': 'name',
  'hierarchyLevel': 'hierarchy_level',
  'sessionId': 'session_id',
  'query': 'query',
  'resultsCount': 'results_count',
  'responseTime': 'response_time',
  'clickedResults': 'clicked_results',
  'filtersApplied': 'filters_applied',
  'sortBy': 'sort_by',
  'ipAddress': 'ip_address',
  'userAgent': 'user_agent',
  'deviceType': 'device_type',
  'conversionType': 'conversion_type',
  'searchAnalyticsId': 'search_analytics_id',
  'position': 'position',
  'clickedAt': 'clicked_at',
  'dwellTime': 'dwell_time',
  'executionTime': 'execution_time',
  'filters': 'filters',
  'algorithmVariant': 'algorithm_variant',
  'startDate': 'start_date',
  'endDate': 'end_date',
  'isActive': 'is_active',
  'metrics': 'metrics',
  'sampleSize': 'sample_size',
  'queryCount': 'query_count',
  'avgResponseTime': 'avg_response_time',
  'p95ResponseTime': 'p95_response_time',
  'p99ResponseTime': 'p99_response_time',
  'cacheHitRate': 'cache_hit_rate',
  'zeroResultQueries': 'zero_result_queries',
  'recommendationType': 'recommendation_type',
  'score': 'score',
  'searchCount': 'search_count',
  'trendScore': 'trend_score',
  'lastSearchedAt': 'last_searched_at',
  'category': 'category',
  'isTrending': 'is_trending',
  'eventType': 'event_type',
  'severity': 'severity',
  'description': 'description',
  'affectedUserId': 'affected_user_id',
  'affectedTransactionId': 'affected_transaction_id',
  'performedBy': 'performed_by',
  'phoneNumber': 'phone_number',
  'paymentMethod': 'payment_method',
  'isSubscribed': 'is_subscribed',
  'lastPaymentAt': 'last_payment_at',
  'nextPaymentAt': 'next_payment_at',
  'preferredLanguage': 'preferred_language',
  'preferredTimezone': 'preferred_timezone',
  'preferredContactMethod': 'preferred_contact_method',
  'marketingConsent': 'marketing_consent',
  'dataSharingConsent': 'data_sharing_consent',
  'exportToken': 'export_token',
  'dataTypes': 'data_types',
  'format': 'format',
  'fileUrl': 'file_url',
  'readyAt': 'ready_at',
  'emailNotifications': 'email_notifications',
  'smsNotifications': 'sms_notifications',
  'whatsappNotifications': 'whatsapp_notifications',
  'marketingCommunications': 'marketing_communications',
  'newsletterSubscription': 'newsletter_subscription',
  'notificationFrequency': 'notification_frequency',
  'profileVisibility': 'profile_visibility',
  'showEmail': 'show_email',
  'showPhone': 'show_phone',
  'showAddress': 'show_address',
  'allowSearchByEmail': 'allow_search_by_email',
  'allowSearchByPhone': 'allow_search_by_phone',
  'twoFactorEnabled': 'two_factor_enabled',
  'twoFactorSecret': 'two_factor_secret',
  'twoFactorMethod': 'two_factor_method',
  'dataSharingEnabled': 'data_sharing_enabled',
  'assignedBy': 'assigned_by',
  'assignedAt': 'assigned_at',
  'preferredCategories': 'preferred_categories',
  'preferredBrands': 'preferred_brands',
  'priceRangeMin': 'price_range_min',
  'priceRangeMax': 'price_range_max',
  'searchHistory': 'search_history',
  'token': 'token',
  'provider': 'provider',
  'providerId': 'provider_id'
};

// Frontend: snake_case → camelCase (for TypeScript interfaces)
const FRONTEND_FIELD_FIXES = {};
// Reverse the backend fixes for frontend
Object.keys(BACKEND_FIELD_FIXES).forEach(camelCase => {
  const snakeCase = BACKEND_FIELD_FIXES[camelCase];
  FRONTEND_FIELD_FIXES[snakeCase] = camelCase;
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Read Prisma schema file
 */
function readPrismaSchema() {
  console.log('📖 Reading Prisma schema...');
  const schemaPath = path.resolve(CONFIG.prismaSchemaPath);
  
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Prisma schema not found at: ${schemaPath}`);
    process.exit(1);
  }
  
  const schema = fs.readFileSync(schemaPath, 'utf8');
  console.log('✅ Prisma schema loaded successfully');
  return schema;
}

/**
 * Extract models from Prisma schema
 */
function extractModelsFromSchema(schema) {
  console.log('🔍 Extracting models from Prisma schema...');
  const models = {};
  const modelPattern = /model\s+(\w+)\s*\{/g;
  let match;
  
  while ((match = modelPattern.exec(schema)) !== null) {
    const modelName = match[1];
    models[modelName] = {
      name: modelName,
      fields: extractFieldsFromModel(match.input, match.index)
    };
  }
  
  console.log(`✅ Found ${Object.keys(models).length} models in Prisma schema`);
  return models;
}

/**
 * Extract fields from model definition
 */
function extractFieldsFromModel(schema, startIndex) {
  const fields = [];
  const fieldPattern = /(\w+)\s+[\w\[\]?]+/g;
  
  // Find the model block
  let braceCount = 0;
  let inModel = false;
  let modelEnd = startIndex;
  
  for (let i = startIndex; i < schema.length; i++) {
    if (schema[i] === '{') {
      braceCount++;
      inModel = true;
    } else if (schema[i] === '}') {
      braceCount--;
      if (braceCount === 0 && inModel) {
        modelEnd = i;
        break;
      }
    }
  }
  
  const modelBlock = schema.substring(startIndex, modelEnd);
  const lines = modelBlock.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('@@')) {
      const match = trimmed.match(/^(\w+)\s+/);
      if (match) {
        fields.push(match[1]);
      }
    }
  });
  
  return fields;
}

/**
 * Get all files matching pattern recursively
 */
function getFiles(dir, extensions, excludeDirs = CONFIG.excludeDirs) {
  const files = [];
  
  function walkDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip excluded directories
        if (!excludeDirs.includes(item)) {
          walkDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walkDirectory(dir);
  return files;
}

/**
 * Find line number of a search term in content
 */
function findLineNumber(content, searchTerm) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchTerm)) {
      return i + 1;
    }
  }
  return -1;
}

/**
 * Count occurrences of a pattern in content
 */
function countOccurrences(content, pattern) {
  const matches = content.match(pattern);
  return matches ? matches.length : 0;
}

/**
 * Backup files
 */
function backupFiles(files) {
  console.log('💾 Backing up files...');
  
  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(CONFIG.backupDir, `backup-${timestamp}`);
  fs.mkdirSync(backupPath, { recursive: true });
  
  files.forEach(filePath => {
    const relativePath = path.relative(process.cwd(), filePath);
    const destPath = path.join(backupPath, relativePath);
    const destDir = path.dirname(destPath);
    
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    fs.copyFileSync(filePath, destPath);
    console.log(`  ✅ Backed up: ${relativePath}`);
  });
  
  console.log(`✅ Backup created at: ${backupPath}`);
  return backupPath;
}

/**
 * Show file content with line numbers
 */
function showFileWithLineNumbers(filePath, searchTerm = null) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  console.log(`\n📄 File: ${filePath}`);
  console.log('='.repeat(80));
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const prefix = searchTerm && line.includes(searchTerm) ? '>>> ' : '    ';
    console.log(`${prefix}${lineNum}: ${line}`);
  });
  
  console.log('='.repeat(80));
}

/**
 * Scan backend files for Prisma model usage
 */
function scanBackendFiles() {
  console.log('🔍 Scanning backend files for Prisma model usage...');
  const issues = [];
  
  const backendFiles = getFiles(CONFIG.backendDir, CONFIG.backendExtensions);
  
  backendFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(CONFIG.backendDir, filePath);
    
    // Check for incorrect model names (singular instead of plural)
    Object.keys(PRISMA_MODELS).forEach(modelName => {
      const singularForm = modelName.replace(/s$/, ''); // Remove trailing 's'
      
      // Skip if model is already singular in schema
      if (modelName === singularForm) return;
      
      // Check if file uses singular model name
      const singularPattern = new RegExp(`\\b${singularForm}\\s*\\.`, 'g');
      const pluralPattern = new RegExp(`\\b${modelName}\\s*\\.`, 'g');
      
      const singularMatches = content.match(singularPattern);
      const pluralMatches = content.match(pluralPattern);
      
      if (singularMatches && !pluralMatches) {
        const count = singularMatches.length;
        
        if (count > 0) {
          issues.push({
            type: 'backend_model_name',
            file: relativePath,
            incorrect: singularForm,
            correct: modelName,
            count: count,
            line: findLineNumber(content, singularForm)
          });
        }
      }
    });
    
    // Check for incorrect field names (camelCase instead of snake_case)
    Object.keys(BACKEND_FIELD_FIXES).forEach(camelCaseField => {
      const snakeCaseField = BACKEND_FIELD_FIXES[camelCaseField];
      
      // Check if file uses camelCase field name
      const camelCasePattern = new RegExp(`\\b${camelCaseField}\\b`, 'g');
      const snakeCasePattern = new RegExp(`\\b${snakeCaseField}\\b`, 'g');
      
      const camelCaseMatches = content.match(camelCasePattern);
      const snakeCaseMatches = content.match(snakeCasePattern);
      
      if (camelCaseMatches && !snakeCaseMatches) {
        const count = camelCaseMatches.length;
        
        if (count > 0) {
          issues.push({
            type: 'backend_field_name',
            file: relativePath,
            incorrect: camelCaseField,
            correct: snakeCaseField,
            count: count,
            line: findLineNumber(content, camelCaseField)
          });
        }
      }
    });
  });
  
  console.log(`✅ Scanned ${backendFiles.length} backend files, found ${issues.length} issues`);
  return issues;
}

/**
 * Scan frontend files for Prisma field usage
 */
function scanFrontendFiles() {
  console.log('🔍 Scanning frontend files for Prisma field usage...');
  const issues = [];
  
  const frontendFiles = getFiles(CONFIG.frontendDir, CONFIG.frontendExtensions);
  
  frontendFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(CONFIG.frontendDir, filePath);
    
    // Check for incorrect field names (snake_case instead of camelCase)
    Object.keys(FRONTEND_FIELD_FIXES).forEach(snakeCaseField => {
      const camelCaseField = FRONTEND_FIELD_FIXES[snakeCaseField];
      
      // Check if file uses snake_case field name
      const snakeCasePattern = new RegExp(`\\b${snakeCaseField}\\b`, 'g');
      const camelCasePattern = new RegExp(`\\b${camelCaseField}\\b`, 'g');
      
      const snakeCaseMatches = content.match(snakeCasePattern);
      const camelCaseMatches = content.match(camelCasePattern);
      
      if (snakeCaseMatches && !camelCaseMatches) {
        const count = snakeCaseMatches.length;
        
        if (count > 0) {
          issues.push({
            type: 'frontend_field_name',
            file: relativePath,
            incorrect: snakeCaseField,
            correct: camelCaseField,
            count: count,
            line: findLineNumber(content, snakeCaseField)
          });
        }
      }
    });
  });
  
  console.log(`✅ Scanned ${frontendFiles.length} frontend files, found ${issues.length} issues`);
  return issues;
}

/**
 * Fix backend file
 */
function fixBackendFile(filePath, issues) {
  console.log(`🔧 Fixing: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let fixCount = 0;
  
  issues.forEach(issue => {
    if (issue.type === 'backend_model_name') {
      // Fix model name: singular → plural
      const incorrectPattern = new RegExp(`\\b${issue.incorrect}\\s*\\.`, 'g');
      const matches = content.match(incorrectPattern);
      if (matches) {
        content = content.replace(incorrectPattern, `${issue.correct}.`);
        console.log(`  ✅ Fixed model name: ${issue.incorrect} → ${issue.correct} (${matches.length} occurrences)`);
        fixCount += matches.length;
      }
    } else if (issue.type === 'backend_field_name') {
      // Fix field name: camelCase → snake_case
      const incorrectPattern = new RegExp(`\\b${issue.incorrect}\\b`, 'g');
      const matches = content.match(incorrectPattern);
      if (matches) {
        content = content.replace(incorrectPattern, issue.correct);
        console.log(`  ✅ Fixed field name: ${issue.incorrect} → ${issue.correct} (${matches.length} occurrences)`);
        fixCount += matches.length;
      }
    }
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fixed: ${filePath} (${fixCount} total fixes)`);
  return fixCount;
}

/**
 * Fix frontend file
 */
function fixFrontendFile(filePath, issues) {
  console.log(`🔧 Fixing: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let fixCount = 0;
  
  issues.forEach(issue => {
    if (issue.type === 'frontend_field_name') {
      // Fix field name: snake_case → camelCase
      const incorrectPattern = new RegExp(`\\b${issue.incorrect}\\b`, 'g');
      const matches = content.match(incorrectPattern);
      if (matches) {
        content = content.replace(incorrectPattern, issue.correct);
        console.log(`  ✅ Fixed field name: ${issue.incorrect} → ${issue.correct} (${matches.length} occurrences)`);
        fixCount += matches.length;
      }
    }
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fixed: ${filePath} (${fixCount} total fixes)`);
  return fixCount;
}

/**
 * Show summary of issues
 */
function showIssuesSummary(backendIssues, frontendIssues) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 ISSUES SUMMARY');
  console.log('='.repeat(80));
  
  console.log(`\n🔹 Backend Issues: ${backendIssues.length}`);
  if (backendIssues.length > 0) {
    console.log('\nBackend Model Name Issues:');
    backendIssues.filter(i => i.type === 'backend_model_name').forEach(issue => {
      console.log(`  [${issue.file}:${issue.line}] ${issue.incorrect} → ${issue.correct} (${issue.count} occurrences)`);
    });
    
    console.log('\nBackend Field Name Issues:');
    backendIssues.filter(i => i.type === 'backend_field_name').forEach(issue => {
      console.log(`  [${issue.file}:${issue.line}] ${issue.incorrect} → ${issue.correct} (${issue.count} occurrences)`);
    });
  }
  
  console.log(`\n🔹 Frontend Issues: ${frontendIssues.length}`);
  if (frontendIssues.length > 0) {
    console.log('\nFrontend Field Name Issues:');
    frontendIssues.forEach(issue => {
      console.log(`  [${issue.file}:${issue.line}] ${issue.incorrect} → ${issue.correct} (${issue.count} occurrences)`);
    });
  }
  
  const totalIssues = backendIssues.length + frontendIssues.length;
  console.log(`\n🔹 Total Issues: ${totalIssues}`);
  console.log('='.repeat(80));
}

/**
 * Show interactive menu
 */
function showMenu() {
  console.log('\n' + '='.repeat(80));
  console.log('🔧 PRISMA SCHEMA FIX SCRIPT');
  console.log('='.repeat(80) + '\n');
  console.log('1. Analyze Prisma schema and codebase');
  console.log('2. Fix all backend model name mismatches');
  console.log('3. Fix all backend field name mismatches');
  console.log('4. Fix all frontend field name mismatches');
  console.log('5. Fix all issues (backend + frontend)');
  console.log('6. Show summary of all changes');
  console.log('7. View specific file');
  console.log('8. Exit');
  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Get user input
 */
function getUserInput(prompt) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Confirm action
 */
async function confirmAction(message) {
  const answer = await getUserInput(`${message} (y/n): `);
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Prisma Schema Fix Script...\n');
  
  while (true) {
    showMenu();
    const option = await getUserInput('Please select an option (1-8): ');
    
    switch (option) {
      case '1':
        console.log('\n📖 Analyzing Prisma schema and codebase...\n');
        const schema = readPrismaSchema();
        const models = extractModelsFromSchema(schema);
        
        console.log('\n📊 Prisma Models Found:');
        Object.entries(models).forEach(([name, data]) => {
          console.log(`  - ${name}: ${data.fields.length} fields`);
        });
        
        console.log('\n🔍 Scanning codebase for issues...\n');
        const backendIssues = scanBackendFiles();
        const frontendIssues = scanFrontendFiles();
        
        showIssuesSummary(backendIssues, frontendIssues);
        break;
        
      case '2':
        console.log('\n🔧 Fixing all backend model name mismatches...\n');
        const schema2 = readPrismaSchema();
        const models2 = extractModelsFromSchema(schema2);
        
        const backendIssues2 = scanBackendFiles();
        const modelIssues = backendIssues2.filter(i => i.type === 'backend_model_name');
        
        if (modelIssues.length > 0) {
          console.log(`\n📊 Found ${modelIssues.length} model name issues`);
          
          const confirm = await confirmAction('Do you want to apply these fixes?');
          if (confirm) {
            const filesToBackup = [...new Set(modelIssues.map(i => path.join(CONFIG.backendDir, i.file)))];
            backupFiles(filesToBackup);
            
            console.log('\n🔧 Applying fixes...\n');
            
            const backendIssuesByFile = {};
            modelIssues.forEach(issue => {
              const filePath = path.join(CONFIG.backendDir, issue.file);
              if (!backendIssuesByFile[filePath]) {
                backendIssuesByFile[filePath] = [];
              }
              backendIssuesByFile[filePath].push(issue);
            });
            
            let totalFixes = 0;
            Object.entries(backendIssuesByFile).forEach(([filePath, issues]) => {
              totalFixes += fixBackendFile(filePath, issues);
            });
            
            console.log(`\n✅ All model name fixes applied! Total: ${totalFixes} fixes`);
          } else {
            console.log('\n❌ Fixes cancelled by user');
          }
        } else {
          console.log('\n✅ No model name issues found!');
        }
        break;
        
      case '3':
        console.log('\n🔧 Fixing all backend field name mismatches...\n');
        const schema3 = readPrismaSchema();
        const models3 = extractModelsFromSchema(schema3);
        
        const backendIssues3 = scanBackendFiles();
        const fieldIssues = backendIssues3.filter(i => i.type === 'backend_field_name');
        
        if (fieldIssues.length > 0) {
          console.log(`\n📊 Found ${fieldIssues.length} field name issues`);
          
          const confirm = await confirmAction('Do you want to apply these fixes?');
          if (confirm) {
            const filesToBackup = [...new Set(fieldIssues.map(i => path.join(CONFIG.backendDir, i.file)))];
            backupFiles(filesToBackup);
            
            console.log('\n🔧 Applying fixes...\n');
            
            const backendIssuesByFile = {};
            fieldIssues.forEach(issue => {
              const filePath = path.join(CONFIG.backendDir, issue.file);
              if (!backendIssuesByFile[filePath]) {
                backendIssuesByFile[filePath] = [];
              }
              backendIssuesByFile[filePath].push(issue);
            });
            
            let totalFixes = 0;
            Object.entries(backendIssuesByFile).forEach(([filePath, issues]) => {
              totalFixes += fixBackendFile(filePath, issues);
            });
            
            console.log(`\n✅ All field name fixes applied! Total: ${totalFixes} fixes`);
          } else {
            console.log('\n❌ Fixes cancelled by user');
          }
        } else {
          console.log('\n✅ No field name issues found!');
        }
        break;
        
      case '4':
        console.log('\n🔧 Fixing all frontend field name mismatches...\n');
        const schema4 = readPrismaSchema();
        const models4 = extractModelsFromSchema(schema4);
        
        const frontendIssues4 = scanFrontendFiles();
        
        if (frontendIssues4.length > 0) {
          console.log(`\n📊 Found ${frontendIssues4.length} field name issues`);
          
          const confirm = await confirmAction('Do you want to apply these fixes?');
          if (confirm) {
            const filesToBackup = [...new Set(frontendIssues4.map(i => path.join(CONFIG.frontendDir, i.file)))];
            backupFiles(filesToBackup);
            
            console.log('\n🔧 Applying fixes...\n');
            
            const frontendIssuesByFile = {};
            frontendIssues4.forEach(issue => {
              const filePath = path.join(CONFIG.frontendDir, issue.file);
              if (!frontendIssuesByFile[filePath]) {
                frontendIssuesByFile[filePath] = [];
              }
              frontendIssuesByFile[filePath].push(issue);
            });
            
            let totalFixes = 0;
            Object.entries(frontendIssuesByFile).forEach(([filePath, issues]) => {
              totalFixes += fixFrontendFile(filePath, issues);
            });
            
            console.log(`\n✅ All field name fixes applied! Total: ${totalFixes} fixes`);
          } else {
            console.log('\n❌ Fixes cancelled by user');
          }
        } else {
          console.log('\n✅ No field name issues found!');
        }
        break;
        
      case '5':
        console.log('\n🔧 Fixing all issues (backend + frontend)...\n');
        const schema5 = readPrismaSchema();
        const models5 = extractModelsFromSchema(schema5);
        
        const backendIssues5 = scanBackendFiles();
        const frontendIssues5 = scanFrontendFiles();
        const allIssues = [...backendIssues5, ...frontendIssues5];
        
        if (allIssues.length > 0) {
          console.log(`\n📊 Found ${allIssues.length} total issues`);
          
          const confirm = await confirmAction('Do you want to apply all fixes?');
          if (confirm) {
            const filesToBackup = [
              ...new Set(backendIssues5.map(i => path.join(CONFIG.backendDir, i.file))),
              ...new Set(frontendIssues5.map(i => path.join(CONFIG.frontendDir, i.file)))
            ];
            backupFiles(filesToBackup);
            
            console.log('\n🔧 Applying fixes...\n');
            
            // Group issues by file
            const backendIssuesByFile = {};
            backendIssues5.forEach(issue => {
              const filePath = path.join(CONFIG.backendDir, issue.file);
              if (!backendIssuesByFile[filePath]) {
                backendIssuesByFile[filePath] = [];
              }
              backendIssuesByFile[filePath].push(issue);
            });
            
            const frontendIssuesByFile = {};
            frontendIssues5.forEach(issue => {
              const filePath = path.join(CONFIG.frontendDir, issue.file);
              if (!frontendIssuesByFile[filePath]) {
                frontendIssuesByFile[filePath] = [];
              }
              frontendIssuesByFile[filePath].push(issue);
            });
            
            // Fix backend files
            let totalBackendFixes = 0;
            Object.entries(backendIssuesByFile).forEach(([filePath, issues]) => {
              totalBackendFixes += fixBackendFile(filePath, issues);
            });
            
            // Fix frontend files
            let totalFrontendFixes = 0;
            Object.entries(frontendIssuesByFile).forEach(([filePath, issues]) => {
              totalFrontendFixes += fixFrontendFile(filePath, issues);
            });
            
            console.log(`\n✅ All fixes applied successfully!`);
            console.log(`   Backend: ${totalBackendFixes} fixes in ${Object.keys(backendIssuesByFile).length} files`);
            console.log(`   Frontend: ${totalFrontendFixes} fixes in ${Object.keys(frontendIssuesByFile).length} files`);
          } else {
            console.log('\n❌ Fixes cancelled by user');
          }
        } else {
          console.log('\n✅ No issues found!');
        }
        break;
        
      case '6':
        console.log('\n📊 Summary of all changes...\n');
        const schema6 = readPrismaSchema();
        const models6 = extractModelsFromSchema(schema6);
        
        const backendIssues6 = scanBackendFiles();
        const frontendIssues6 = scanFrontendFiles();
        
        showIssuesSummary(backendIssues6, frontendIssues6);
        break;
        
      case '7':
        console.log('\n📄 View specific file\n');
        const filePath = await getUserInput('Enter file path (relative to project root): ');
        const fullPath = path.resolve(filePath);
        
        if (fs.existsSync(fullPath)) {
          const searchTerm = await getUserInput('Enter search term (optional, press Enter to skip): ');
          showFileWithLineNumbers(fullPath, searchTerm || null);
        } else {
          console.log(`\n❌ File not found: ${fullPath}`);
        }
        break;
        
      case '8':
        console.log('\n👋 Exiting...\n');
        process.exit(0);
        break;
        
      default:
        console.log('\n❌ Invalid option. Please select 1-8.');
        break;
    }
  }
}

// Run main function
main().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
