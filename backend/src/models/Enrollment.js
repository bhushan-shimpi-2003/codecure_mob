const supabase = require('../config/supabaseClient');

/**
 * Enrollment Model — maps to `enrollments` table
 * Source: Checkout.tsx (purchase flow → enrollment),
 *         Overview.tsx (enrollment request/approval flow),
 *         StudentManagement.tsx (student: course, batch, progress, status),
 *         AdminOverview.tsx (Batch Enrollment Stats)
 */

exports.isEnrolled = async (studentId, courseId) => {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
};

exports.createEnrollment = async (enrollmentData) => {
  const { data, error } = await supabase.from('enrollments').insert(enrollmentData).select().single();
  if (error) throw error;
  return data;
};

exports.getEnrollmentsByStudent = async (studentId) => {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, courses(*)')
    .eq('student_id', studentId)
    .order('enrolled_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.getEnrollmentsByCourse = async (courseId) => {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, profiles!student_id(id, name, email)')
    .eq('course_id', courseId)
    .order('enrolled_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.updateEnrollment = async (enrollmentId, updates) => {
  const { data, error } = await supabase
    .from('enrollments')
    .update(updates)
    .eq('id', enrollmentId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

exports.getAllEnrollments = async () => {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, profiles!student_id(id, name, email), courses(id, title)')
    .order('enrolled_at', { ascending: false });
  if (error) throw error;
  return data;
};

// --- Enrollment Requests ---
exports.createEnrollmentRequest = async (requestData) => {
  const { data, error } = await supabase.from('enrollment_requests').insert(requestData).select().single();
  if (error) throw error;
  return data;
};

exports.getPendingRequests = async () => {
  const { data, error } = await supabase
    .from('enrollment_requests')
    .select('*, profiles!student_id(id, name, email), courses(id, title)')
    .eq('status', 'pending')
    .order('requested_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.getRequestsByStudent = async (studentId) => {
  const { data, error } = await supabase
    .from('enrollment_requests')
    .select('*, courses(id, title)')
    .eq('student_id', studentId)
    .order('requested_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.updateEnrollmentRequest = async (requestId, updates) => {
  const { data, error } = await supabase
    .from('enrollment_requests')
    .update({ ...updates, resolved_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

exports.deleteEnrollment = async (enrollmentId) => {
  const { error } = await supabase.from('enrollments').delete().eq('id', enrollmentId);
  if (error) throw error;
  return true;
};

exports.deleteEnrollmentRequest = async (requestId) => {
  const { error } = await supabase.from('enrollment_requests').delete().eq('id', requestId);
  if (error) throw error;
  return true;
};
