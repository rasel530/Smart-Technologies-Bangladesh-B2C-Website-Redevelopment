-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

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
    "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'PRIVATE',
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
