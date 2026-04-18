const supabase = require('../config/supabaseClient');

/**
 * Profile Model — maps to `profiles` table
 * Source: Signup.tsx (name, email, password), Login.tsx
 * RBAC: role enum (student | teacher | admin)
 */

exports.getProfileById = async (userId) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
};

exports.getProfileByEmail = async (email) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('email', email).single();
  if (error) throw error;
  return data;
};

exports.getAllProfiles = async () => {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.getStudents = async () => {
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.getTeachers = async () => {
  const { data, error } = await supabase.from('profiles').select('*').in('role', ['teacher', 'admin']).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.updateProfile = async (userId, updates) => {
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
  if (error) throw error;
  return data;
};

exports.updateUserRole = async (userId, role) => {
  const { data, error } = await supabase.from('profiles').update({ role }).eq('id', userId).select().single();
  if (error) throw error;
  return data;
};

exports.deleteProfile = async (userId) => {
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;
  return true;
};

exports.deleteUserCompletely = async (userId) => {
  const { data, error } = await supabase.auth.admin.deleteUser(userId);
  return { data, error };
};
