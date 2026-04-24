/** @jsxImportSource react */
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  MessageCircle,
  CalendarDays,
  User,
  LayoutGrid,
} from "lucide-react-native";
import TeacherDashboardScreen from "../screens/teacher/TeacherDashboardScreen";
import TeacherCoursesScreen from "../screens/teacher/TeacherCoursesScreen";
import TeacherManageLessonsScreen from "../screens/teacher/TeacherManageLessonsScreen";
import TeacherCreateLessonScreen from "../screens/teacher/TeacherCreateLessonScreen";
import TeacherEditLessonScreen from "../screens/teacher/TeacherEditLessonScreen";
import TeacherReviewSubmissionScreen from "../screens/teacher/TeacherReviewSubmissionScreen";
import TeacherSubmissionsScreen from "../screens/teacher/TeacherSubmissionsScreen";
import TeacherAssignmentsScreen from "../screens/teacher/TeacherAssignmentsScreen";
import TeacherDoubtsScreen from "../screens/teacher/TeacherDoubtsScreen";
import TeacherInterviewsScreen from "../screens/teacher/TeacherInterviewsScreen";
import TeacherJobsScreen from "../screens/teacher/TeacherJobsScreen";
import TeacherProfileScreen from "../screens/teacher/TeacherProfileScreen";
import TeacherSendNotificationScreen from "../screens/teacher/TeacherSendNotificationScreen";
import CourseDetailScreen from "../screens/shared/CourseDetailScreen";
import LessonScreen from "../screens/student/LessonScreen";
import { COLORS } from "../utils/theme";
import { Briefcase } from "lucide-react-native";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Component Definitions ───────────────────────────────────────────────────

function TeacherDashboardStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 400
      }}
    >
      <Stack.Screen name="TeacherDashboardHome" component={TeacherDashboardScreen} />
      <Stack.Screen name="TeacherSubmissions" component={TeacherSubmissionsScreen} />
      <Stack.Screen name="TeacherReviewSubmission" component={TeacherReviewSubmissionScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="Lesson" component={LessonScreen} />
      <Stack.Screen name="TeacherSendNotification" component={TeacherSendNotificationScreen} />
    </Stack.Navigator>
  );
}

function TeacherCoursesStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 400
      }}
    >
      <Stack.Screen name="TeacherCoursesHome" component={TeacherCoursesScreen} />
      <Stack.Screen name="TeacherManageLessons" component={TeacherManageLessonsScreen} />
      <Stack.Screen name="TeacherCreateLesson" component={TeacherCreateLessonScreen} />
      <Stack.Screen name="TeacherEditLesson" component={TeacherEditLessonScreen} />
      <Stack.Screen name="TeacherSubmissions" component={TeacherSubmissionsScreen} />
      <Stack.Screen name="TeacherReviewSubmission" component={TeacherReviewSubmissionScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="Lesson" component={LessonScreen} />
    </Stack.Navigator>
  );
}

function TeacherAssignmentsStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 400
      }}
    >
      <Stack.Screen name="TeacherAssignmentsHome" component={TeacherAssignmentsScreen} />
      <Stack.Screen name="TeacherSubmissions" component={TeacherSubmissionsScreen} />
      <Stack.Screen name="TeacherReviewSubmission" component={TeacherReviewSubmissionScreen} />
    </Stack.Navigator>
  );
}

function TeacherCareerStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 400
      }}
    >
      <Stack.Screen name="TeacherInterviewsHome" component={TeacherInterviewsScreen} />
      <Stack.Screen name="TeacherJobsHome" component={TeacherJobsScreen} />
    </Stack.Navigator>
  );
}

// ─── Main Navigator ──────────────────────────────────────────────────────────

export default function TeacherMainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.slate400,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: COLORS.slate100,
          height: 85,
          paddingBottom: 20,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      <Tab.Screen
        name="TeacherDashboardTab"
        component={TeacherDashboardStack}
        options={{
          title: "Hub",
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="TeacherCoursesTab"
        component={TeacherCoursesStack}
        options={{
          title: "Courses",
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="TeacherAssignmentsTab"
        component={TeacherAssignmentsStack}
        options={{
          title: "Lab",
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="TeacherDoubtsTab"
        component={TeacherDoubtsScreen}
        options={{
          title: "Doubts",
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="TeacherCareerTab"
        component={TeacherCareerStack}
        options={{
          title: "Career",
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="TeacherProfile"
        component={TeacherProfileScreen}
        options={{
          title: "Me",
          tabBarIcon: ({ color, size }) => <User color={color} size={22} />,
        }}
      />
    </Tab.Navigator>
  );
}
