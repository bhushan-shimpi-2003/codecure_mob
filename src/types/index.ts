export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
  skills?: string[];
  bio?: string;
  phone?: string;
  auth_token?: string;
}

export interface Course {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string;
  price: number;
  category: string;
  instructor_id: string;
  instructor_name?: string;
  students_enrolled?: number;
  rating?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
}

export interface Module {
  id: string;
  _id?: string;
  course_id: string;
  title: string;
  order: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  _id?: string;
  module_id: string;
  course_id: string;
  title: string;
  content?: string;
  video_url?: string;
  duration: string;
  order: number;
  is_completed?: boolean;
}

export interface Enrollment {
  id: string;
  _id?: string;
  user_id: string;
  course_id: string;
  status: 'pending' | 'active' | 'completed';
  progress: number;
  completed_lessons?: string[];
  course_details?: Course;
}

export interface Doubt {
  id: string;
  _id?: string;
  user_id: string;
  course_id: string;
  lesson_id?: string;
  question: string;
  status: 'open' | 'resolved';
  reply?: string;
  created_at: string;
}

export interface Job {
  id: string;
  _id?: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  tags?: string[];
  created_at: string;
}
