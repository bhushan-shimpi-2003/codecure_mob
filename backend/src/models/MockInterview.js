const supabase = require('../config/supabaseClient');

/**
 * MockInterview Model — maps to `mock_interviews` table
 * Source: Career.tsx (student: upcoming interview + history with scores),
 *         TeacherInterviews.tsx (schedule: student_email, date, meet_link),
 *         AdminInterviews.tsx (log: student, teacher, date, status)
 */

exports.scheduleInterview = async (interviewData) => {
  const { data, error } = await supabase.from('mock_interviews').insert(interviewData).select().single();
  if (error) throw error;
  return data;
};

exports.getInterviewsByStudent = async (studentId) => {
  const { data, error } = await supabase
    .from('mock_interviews')
    .select('*, profiles!teacher_id(id, name)')
    .eq('student_id', studentId)
    .order('scheduled_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.getInterviewsByTeacher = async (teacherId) => {
  const { data, error } = await supabase
    .from('mock_interviews')
    .select('*, profiles!student_id(id, name, email)')
    .eq('teacher_id', teacherId)
    .order('scheduled_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.getAllInterviews = async () => {
  const { data, error } = await supabase
    .from('mock_interviews')
    .select('*')
    .order('scheduled_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.updateInterview = async (interviewId, updates) => {
  const { data, error } = await supabase.from('mock_interviews').update(updates).eq('id', interviewId).select().single();
  if (error) throw error;
  return data;
};

exports.deleteInterview = async (interviewId) => {
  const { error } = await supabase.from('mock_interviews').delete().eq('id', interviewId);
  if (error) throw error;
  return true;
};

exports.completeInterview = async (interviewId, score, notes) => {
  const { data, error } = await supabase
    .from('mock_interviews')
    .update({ status: 'completed', score, notes })
    .eq('id', interviewId)
    .select()
    .single();
  if (error) throw error;
  return data;
};
