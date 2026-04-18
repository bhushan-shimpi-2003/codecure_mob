-- ============================================================
-- CODECURE ACADEMY - SUPABASE DATABASE SCHEMA
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================


-- ============================================================
-- STEP 1: CREATE ENUM TYPES
-- ============================================================
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE student_status AS ENUM ('active', 'inactive', 'pending', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE assignment_status AS ENUM ('locked', 'pending', 'submitted', 'graded');
CREATE TYPE doubt_status AS ENUM ('pending', 'resolved');
CREATE TYPE interview_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE transaction_type AS ENUM ('credit', 'debit');
CREATE TYPE feedback_type AS ENUM ('teacher_rating', 'platform_feedback', 'complaint');
CREATE TYPE course_status AS ENUM ('active', 'draft');


-- ============================================================
-- STEP 2: PROFILES TABLE (linked to Supabase Auth)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role user_role DEFAULT 'student'::user_role NOT NULL,
  profile_picture TEXT DEFAULT 'no-photo.jpg',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'New User'),
    new.email,
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'student'::user_role)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ============================================================
-- STEP 3: COURSES TABLE
-- ============================================================
CREATE TABLE public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  level TEXT DEFAULT 'Beginner',
  duration TEXT,
  category TEXT,
  thumbnail TEXT DEFAULT 'no-course-photo.jpg',
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status course_status DEFAULT 'draft' NOT NULL,
  rating NUMERIC DEFAULT 0,
  students_enrolled INTEGER DEFAULT 0,
  features TEXT[],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- ============================================================
-- STEP 4: MODULES TABLE (Course Curriculum)
-- ============================================================
CREATE TABLE public.modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  duration TEXT,
  module_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- ============================================================
-- STEP 5: LESSONS TABLE (Video Content)
-- ============================================================
CREATE TABLE public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT,
  content TEXT,
  lesson_order INTEGER NOT NULL DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT false,
  is_live BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- ============================================================
-- STEP 6: BATCHES TABLE
-- ============================================================
CREATE TABLE public.batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- ============================================================
-- STEP 7: ENROLLMENTS TABLE
-- ============================================================
CREATE TABLE public.enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  progress INTEGER DEFAULT 0,
  student_status student_status DEFAULT 'pending' NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  payment_id TEXT,
  amount_paid NUMERIC DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(student_id, course_id)
);


-- ============================================================
-- STEP 8: ENROLLMENT REQUESTS TABLE
-- ============================================================
CREATE TABLE public.enrollment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE(student_id, course_id)
);


-- ============================================================
-- STEP 9: ASSIGNMENTS TABLE
-- ============================================================
CREATE TABLE public.assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- ============================================================
-- STEP 10: ASSIGNMENT SUBMISSIONS TABLE
-- ============================================================
CREATE TABLE public.assignment_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status assignment_status DEFAULT 'pending' NOT NULL,
  score TEXT,
  submission_url TEXT,
  feedback TEXT,
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  UNIQUE(assignment_id, student_id)
);


-- ============================================================
-- STEP 11: DOUBTS TABLE
-- ============================================================
CREATE TABLE public.doubts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT,
  status doubt_status DEFAULT 'pending' NOT NULL,
  reply TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  resolved_at TIMESTAMPTZ
);


-- ============================================================
-- STEP 12: MOCK INTERVIEWS TABLE
-- ============================================================
CREATE TABLE public.mock_interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  interview_type TEXT DEFAULT 'Technical Round',
  scheduled_at TIMESTAMPTZ NOT NULL,
  meet_link TEXT,
  status interview_status DEFAULT 'scheduled' NOT NULL,
  score TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- ============================================================
-- STEP 13: JOB OPENINGS TABLE
-- ============================================================
CREATE TABLE public.job_openings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  salary TEXT,
  apply_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- ============================================================
-- STEP 14: TRANSACTIONS TABLE (Finance)
-- ============================================================
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type transaction_type NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  related_enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  related_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- ============================================================
-- STEP 15: FEEDBACK TABLE
-- ============================================================
CREATE TABLE public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target TEXT NOT NULL,
  target_teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  type feedback_type NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- ============================================================
-- STEP 16: CONTACT MESSAGES TABLE
-- ============================================================
CREATE TABLE public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- ============================================================
-- STEP 17: PLATFORM SETTINGS TABLE
-- ============================================================
CREATE TABLE public.platform_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Pre-seed default settings
INSERT INTO public.platform_settings (key, value, description) VALUES
  ('allow_student_registration', 'true', 'Open public signup endpoints'),
  ('auto_approve_enrollments', 'false', 'Bypass manual admin verification for paid courses'),
  ('instructor_course_creation', 'false', 'Allow teachers to create new courses independently'),
  ('email_alerts_admin', 'true', 'Receive daily summary reports'),
  ('slack_discord_webhooks', 'true', 'Push system alerts to comms channels');


-- ============================================================
-- STEP 18: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- STEP 19: PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX idx_courses_slug ON public.courses(slug);
CREATE INDEX idx_modules_course ON public.modules(course_id);
CREATE INDEX idx_lessons_course ON public.lessons(course_id);
CREATE INDEX idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX idx_enrollment_requests_student ON public.enrollment_requests(student_id);
CREATE INDEX idx_assignments_course ON public.assignments(course_id);
CREATE INDEX idx_assignment_subs_student ON public.assignment_submissions(student_id);
CREATE INDEX idx_doubts_student ON public.doubts(student_id);
CREATE INDEX idx_doubts_teacher ON public.doubts(teacher_id);
CREATE INDEX idx_interviews_student ON public.mock_interviews(student_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_feedback_student ON public.feedback(student_id);
