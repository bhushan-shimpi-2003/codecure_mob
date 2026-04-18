const supabase = require('../config/supabaseClient');

/**
 * Course Model — maps to `courses` table
 * Source: Courses.tsx (title, level, duration, rating, students, price, image)
 *         CourseDetail.tsx (+ description, modules, features)
 *         AdminCourses.tsx (CRUD with modules, status, price)
 *         TeacherClasses.tsx (assigned courses with batch, progress)
 */

exports.getAllPublishedCourses = async () => {
  const { data, error } = await supabase
    .from('courses')
    .select('*, profiles!instructor_id(id, name, profile_picture)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.getCourseById = async (courseId) => {
  const { data, error } = await supabase
    .from('courses')
    .select('*, profiles!instructor_id(id, name, profile_picture)')
    .eq('id', courseId)
    .single();
  if (error) throw error;
  return data;
};

exports.getCourseBySlug = async (slug) => {
  const { data, error } = await supabase
    .from('courses')
    .select('*, profiles!instructor_id(id, name, profile_picture)')
    .eq('slug', slug)
    .single();
  if (error) throw error;
  return data;
};

exports.getCoursesByInstructor = async (instructorId) => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.getAllCourses = async () => {
  const { data, error } = await supabase
    .from('courses')
    .select('*, profiles!instructor_id(id, name, email), modules(*, lessons(*)), enrollments(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  
  // map the enrollments array to count
  const mappedData = data.map(course => ({
    ...course,
    enrollment_count: course.enrollments ? course.enrollments.length : 0
  }));
  return mappedData;
};

exports.createCourse = async (courseData) => {
  const { data, error } = await supabase.from('courses').insert(courseData).select().single();
  if (error) throw error;
  return data;
};

exports.updateCourse = async (courseId, updates) => {
  const { data, error } = await supabase
    .from('courses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', courseId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

exports.deleteCourse = async (courseId) => {
  const { error } = await supabase.from('courses').delete().eq('id', courseId);
  if (error) throw error;
  return true;
};
