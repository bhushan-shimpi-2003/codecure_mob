import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  TeacherMain: undefined;
  AdminMain: undefined;
  Login: undefined;
  Signup: undefined;
  Dashboard: undefined;
  ExploreCourses: undefined;
  Courses: undefined;
  CourseDetail: { slug?: string; idOrSlug?: string; courseId?: string; isEnrolled?: boolean };
  Lesson: { lessonId: string; courseId: string };
  Assignments: undefined;
  MockInterviews: undefined;
  TeacherDashboard: undefined;
  TeacherCoursesTab: undefined;
  TeacherDoubtsTab: undefined;
  TeacherCareerTab: { screen?: string } | undefined;
  TeacherReviewSubmission: { submissionId: string };
  EditProfile: undefined;
  Profile: undefined;
};

export type AppNavigationProp = NativeStackNavigationProp<RootStackParamList>;
