import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  CalendarDays,
  User,
} from "lucide-react-native";
import TeacherDashboardScreen from "../screens/teacher/TeacherDashboardScreen";
import TeacherCoursesScreen from "../screens/teacher/TeacherCoursesScreen";
import TeacherSubmissionsScreen from "../screens/teacher/TeacherSubmissionsScreen";
import TeacherInterviewsScreen from "../screens/teacher/TeacherInterviewsScreen";
import TeacherProfileScreen from "../screens/teacher/TeacherProfileScreen";
import { COLORS } from "../utils/theme";

const Tab = createBottomTabNavigator();

export default function TeacherMainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: COLORS.teacherGreen,
        tabBarInactiveTintColor: COLORS.slate400,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: COLORS.slate100,
          height: 68,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 10,
          shadowColor: COLORS.teacherGreen,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
        },
        tabBarItemStyle: {
          borderRadius: 14,
          marginHorizontal: 2,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter",
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="TeacherDashboard"
        component={TeacherDashboardScreen}
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="TeacherCourses"
        component={TeacherCoursesScreen}
        options={{
          title: "Courses",
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="TeacherSubmissions"
        component={TeacherSubmissionsScreen}
        options={{
          title: "Submissions",
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="TeacherInterviews"
        component={TeacherInterviewsScreen}
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="TeacherProfile"
        component={TeacherProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
