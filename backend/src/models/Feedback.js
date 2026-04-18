const supabase = require('../config/supabaseClient');

/**
 * Feedback Model — maps to `feedback` table
 * Source: AdminFeedback.tsx (student, target, rating, comment, type)
 *         Types: teacher_rating, platform_feedback, complaint
 */

exports.createFeedback = async (feedbackData) => {
  const { data, error } = await supabase.from('feedback').insert(feedbackData).select().single();
  if (error) throw error;
  return data;
};

exports.getAllFeedback = async () => {
  const { data, error } = await supabase
    .from('feedback')
    .select('*, profiles!student_id(id, name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.getFeedbackByType = async (type) => {
  const { data, error } = await supabase
    .from('feedback')
    .select('*, profiles!student_id(id, name)')
    .eq('type', type)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.getOpenComplaints = async () => {
  const { data, error } = await supabase
    .from('feedback')
    .select('*, profiles!student_id(id, name)')
    .eq('type', 'complaint')
    .eq('is_resolved', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.resolveComplaint = async (feedbackId) => {
  const { data, error } = await supabase
    .from('feedback')
    .update({ is_resolved: true })
    .eq('id', feedbackId)
    .select()
    .single();
  if (error) throw error;
  return data;
};
