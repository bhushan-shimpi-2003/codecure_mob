const supabase = require('../config/supabaseClient');

/**
 * Module Model — maps to `modules` table
 * Source: AdminCourses.tsx (modules array per course: title, duration)
 *         CourseDetail.tsx (course.modules list rendered as numbered items)
 */

exports.getModulesByCourse = async (courseId) => {
  const { data, error } = await supabase
    .from('modules')
    .select('*, lessons(*)')
    .eq('course_id', courseId)
    .order('module_order', { ascending: true });
  if (error) throw error;
  return data;
};

exports.createModule = async (moduleData) => {
  const { data, error } = await supabase.from('modules').insert(moduleData).select().single();
  if (error) throw error;
  return data;
};

exports.updateModule = async (moduleId, updates) => {
  const { data, error } = await supabase.from('modules').update(updates).eq('id', moduleId).select().single();
  if (error) throw error;
  return data;
};

exports.deleteModule = async (moduleId) => {
  const { error } = await supabase.from('modules').delete().eq('id', moduleId);
  if (error) throw error;
  return true;
};
