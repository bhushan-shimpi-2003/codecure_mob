const supabase = require('../config/supabaseClient');

/**
 * Assignment Model — maps to `assignments` + `assignment_submissions` tables
 * Source: Assignments.tsx (student: title, status, score, due),
 *         TeacherAssignments.tsx (create: title, description, due_date),
 *         AdminAssignments.tsx (log: id, title, teacher, course, submissions count)
 */

// --- Assignments ---
exports.getAssignmentsByCourse = async (courseId) => {
  const { data, error } = await supabase
    .from('assignments')
    .select('*, profiles!teacher_id(id, name)')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.getAllAssignments = async () => {
  const { data, error } = await supabase
    .from('assignments')
    .select('*, profiles!teacher_id(id, name), courses(id, title)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.createAssignment = async (assignmentData) => {
  const { data, error } = await supabase.from('assignments').insert(assignmentData).select().single();
  if (error) throw error;
  return data;
};

exports.updateAssignment = async (assignmentId, updates) => {
  const { data, error } = await supabase.from('assignments').update(updates).eq('id', assignmentId).select().single();
  if (error) throw error;
  return data;
};

exports.deleteAssignment = async (assignmentId) => {
  const { error } = await supabase.from('assignments').delete().eq('id', assignmentId);
  if (error) throw error;
  return true;
};

// --- Submissions ---
exports.getSubmissionsByStudent = async (studentId) => {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select('*, assignments(id, title, due_date, courses(id, title))')
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.getSubmissionsByAssignment = async (assignmentId) => {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select('*, profiles!student_id(id, name, email)')
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.submitAssignment = async (submissionData) => {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .insert({ ...submissionData, submitted_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
};

exports.updateSubmission = async (submissionId, updates) => {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .update(updates)
    .eq('id', submissionId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

exports.deleteSubmission = async (submissionId) => {
  const { error } = await supabase.from('assignment_submissions').delete().eq('id', submissionId);
  if (error) throw error;
  return true;
};

exports.gradeSubmission = async (submissionId, score, feedback) => {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .update({ status: 'graded', score, feedback, graded_at: new Date().toISOString() })
    .eq('id', submissionId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

exports.getAssignmentsByStudentEnrollments = async (studentId) => {
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('student_id', studentId)
    .eq('student_status', 'active');
  
  if (enrollError) throw enrollError;
  const courseIds = enrollments.map(e => e.course_id);
  if (courseIds.length === 0) return [];

  const { data, error } = await supabase
    .from('assignments')
    .select('*, courses(id, title)')
    .in('course_id', courseIds)
    .order('due_date', { ascending: true });
    
  if (error) throw error;
  return data;
};
