const supabase = require('../config/supabaseClient');

/**
 * Doubt Model — maps to `doubts` table
 * Source: StudentDoubts.tsx (ask doubt, view with reply & status),
 *         Lectures.tsx (inline doubt sidebar during lecture),
 *         TeacherDoubts.tsx (respond to student doubts),
 *         AdminDoubts.tsx (student, teacher, subject, status log)
 */

exports.createDoubt = async (doubtData) => {
  const { data, error } = await supabase.from('doubts').insert(doubtData).select().single();
  if (error) throw error;
  return data;
};

exports.getDoubtsByStudent = async (studentId) => {
  const { data, error } = await supabase
    .from('doubts')
    .select('*, profiles!teacher_id(id, name)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.getDoubtsByTeacher = async (teacherId) => {
  const { data, error } = await supabase
    .from('doubts')
    .select('*, profiles!student_id(id, name, email), courses(id, title)')
    .or(`teacher_id.eq.${teacherId},status.eq.pending`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.getPendingDoubts = async () => {
  const { data, error } = await supabase
    .from('doubts')
    .select('*, profiles!student_id(id, name, email), courses(id, title)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.getAllDoubts = async () => {
  const { data, error } = await supabase
    .from('doubts')
    .select('*, student:profiles!student_id(id, name, email), teacher:profiles!teacher_id(id, name, email), courses(id, title)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.updateDoubt = async (doubtId, updates) => {
  const { data, error } = await supabase.from('doubts').update(updates).eq('id', doubtId).select().single();
  if (error) throw error;
  return data;
};

exports.deleteDoubt = async (doubtId) => {
  const { error } = await supabase.from('doubts').delete().eq('id', doubtId);
  if (error) throw error;
  return true;
};

exports.resolveDoubt = async (doubtId, reply, teacherId) => {
  const { data, error } = await supabase
    .from('doubts')
    .update({ status: 'resolved', reply, teacher_id: teacherId, resolved_at: new Date().toISOString() })
    .eq('id', doubtId)
    .select()
    .single();
  if (error) throw error;
  return data;
};
