const supabase = require('../config/supabaseClient');

/**
 * Lesson Model — maps to `lessons` table
 * Source: Lectures.tsx (video embed via youtube URL, title, notes, is_live badge)
 *         TeacherOverview.tsx (publish: title, youtube_url, notes)
 */

exports.getLessonsByCourse = async (courseId) => {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('lesson_order', { ascending: true });
  if (error) throw error;
  return data;
};

exports.getLessonById = async (lessonId) => {
  const { data, error } = await supabase.from('lessons').select('*').eq('id', lessonId).single();
  if (error) throw error;
  return data;
};

exports.getLatestLessonByCourse = async (courseId) => {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

exports.createLesson = async (lessonData) => {
  const { data, error } = await supabase.from('lessons').insert(lessonData).select().single();
  if (error) throw error;
  return data;
};

exports.updateLesson = async (lessonId, updates) => {
  const { data, error } = await supabase.from('lessons').update(updates).eq('id', lessonId).select().single();
  if (error) throw error;
  return data;
};

exports.deleteLesson = async (lessonId) => {
  const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
  if (error) throw error;
  return true;
};
