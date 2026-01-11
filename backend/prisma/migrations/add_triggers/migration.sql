-- Add triggers to automatically update updated_at timestamps

-- Trigger for user_notification_preferences
CREATE OR REPLACE FUNCTION update_user_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_notification_preferences_updated_at ON "user_notification_preferences";
CREATE TRIGGER update_user_notification_preferences_updated_at
  BEFORE UPDATE ON "user_notification_preferences"
  FOR EACH ROW
  EXECUTE FUNCTION update_user_notification_preferences_updated_at();

-- Trigger for user_communication_preferences
CREATE OR REPLACE FUNCTION update_user_communication_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_communication_preferences_updated_at ON "user_communication_preferences";
CREATE TRIGGER update_user_communication_preferences_updated_at
  BEFORE UPDATE ON "user_communication_preferences"
  FOR EACH ROW
  EXECUTE FUNCTION update_user_communication_preferences_updated_at();

-- Trigger for user_privacy_settings
CREATE OR REPLACE FUNCTION update_user_privacy_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_privacy_settings_updated_at ON "user_privacy_settings";
CREATE TRIGGER update_user_privacy_settings_updated_at
  BEFORE UPDATE ON "user_privacy_settings"
  FOR EACH ROW
  EXECUTE FUNCTION update_user_privacy_settings_updated_at();
