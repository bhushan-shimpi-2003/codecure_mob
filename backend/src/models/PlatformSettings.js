const supabase = require('../config/supabaseClient');

/**
 * PlatformSettings Model — maps to `platform_settings` table
 * Source: AdminSettings.tsx (RBAC toggles + notification config)
 *   Keys: allow_student_registration, auto_approve_enrollments,
 *          instructor_course_creation, email_alerts_admin, slack_discord_webhooks
 */

exports.getAllSettings = async () => {
  const { data, error } = await supabase.from('platform_settings').select('*');
  if (error) throw error;
  return data || [];
};

exports.getSetting = async (key) => {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .eq('key', key)
    .single();
  if (error) throw error;
  return data;
};

exports.updateSetting = async (key, value) => {
  const { data, error } = await supabase
    .from('platform_settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)
    .select()
    .single();
  if (error) throw error;
  return data;
};
