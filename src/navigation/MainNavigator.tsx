/** @jsxImportSource react */
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LayoutDashboard, BookOpen, User, MessageSquare, Layers } from "lucide-react-native";
import DashboardScreen from "../screens/student/DashboardScreen";
import JobsScreen from "../screens/student/JobsScreen";
import AssignmentsScreen from "../screens/student/AssignmentsScreen";
import MockInterviewsScreen from "../screens/student/MockInterviewsScreen";
import CoursesScreen from "../screens/shared/CoursesScreen";
import ExploreCoursesScreen from "../screens/student/ExploreCoursesScreen";
import ProfileScreen from "../screens/shared/ProfileScreen";
import DoubtsScreen from "../screens/student/DoubtsScreen";
import CourseDetailScreen from "../screens/shared/CourseDetailScreen";
import LessonScreen from "../screens/student/LessonScreen";
import { COLORS } from "../utils/theme";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Component Definitions ───────────────────────────────────────────────────

function DashboardStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 400
      }}
    >
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="Lesson" component={LessonScreen} />
      <Stack.Screen name="Jobs" component={JobsScreen} />
      <Stack.Screen name="Assignments" component={AssignmentsScreen} />
      <Stack.Screen name="MockInterviews" component={MockInterviewsScreen} />
    </Stack.Navigator>
  );
}

function MyCoursesStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 400
      }}
    >
      <Stack.Screen name="MyCoursesHome" component={CoursesScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="Lesson" component={LessonScreen} />
    </Stack.Navigator>
  );
}

function ExploreStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 400
      }}
    >
      <Stack.Screen name="ExploreHome" component={ExploreCoursesScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="Lesson" component={LessonScreen} />
    </Stack.Navigator>
  );
}

// ─── Main Navigator ──────────────────────────────────────────────────────────

export default function MainNavigator() {
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
        name="DashboardTab"
        component={DashboardStack}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="MyCoursesTab"
        component={MyCoursesStack}
        options={{
          title: "My Courses",
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="CoursesTab"
        component={ExploreStack}
        options={{
          title: "Courses",
          tabBarIcon: ({ color, size }) => <Layers color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Doubts"
        component={DoubtsScreen}
        options={{
          title: "Doubts",
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
