/** @jsxImportSource react */
import React from "react";
import { View, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import TeacherMainNavigator from "./TeacherMainNavigator";
import AdminMainNavigator from "./AdminMainNavigator";
import CourseDetailScreen from "../screens/shared/CourseDetailScreen";
import LessonScreen from "../screens/student/LessonScreen";
import AssignmentsScreen from "../screens/student/AssignmentsScreen";
import MockInterviewsScreen from "../screens/student/MockInterviewsScreen";
import TeacherDoubtsScreen from "../screens/teacher/TeacherDoubtsScreen";
import TeacherAssignmentsScreen from "../screens/teacher/TeacherAssignmentsScreen";
import EditProfileScreen from "../screens/shared/EditProfileScreen";
import AdminEnrollmentsScreen from "../screens/admin/AdminEnrollmentsScreen";
import AdminPulseScreen from "../screens/admin/AdminPulseScreen";
import NotificationsScreen from "../screens/shared/NotificationsScreen";
import AdminSendNotificationScreen from "../screens/admin/AdminSendNotificationScreen";
import { COLORS } from "../utils/theme";

const Stack = createNativeStackNavigator();

// Simple loading screen component for registration as a Stack.Screen
function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 400,
        gestureEnabled: true,
        gestureDirection: 'horizontal'
      }}
    >
      {isLoading ? (
        <Stack.Screen
          name="Loading"
          component={LoadingScreen}
          options={{ animationTypeForReplace: "pop" }}
        />
      ) : !isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          {/* Conditional Entry based on Role */}
          {user?.role === "admin" ? (
            <Stack.Screen name="AdminMain" component={AdminMainNavigator} />
          ) : user?.role === "teacher" ? (
            <Stack.Screen name="TeacherMain" component={TeacherMainNavigator} />
          ) : (
            <Stack.Screen name="StudentMain" component={MainNavigator} />
          )}

          {/* Global screens */}
          <Stack.Screen
            name="TeacherDoubts"
            component={TeacherDoubtsScreen}
            options={{ headerShown: false, title: "Teacher Doubts" }}
          />
          <Stack.Screen
            name="TeacherAssignments"
            component={TeacherAssignmentsScreen}
            options={{ headerShown: false, title: "Teacher Assignments" }}
          />
          <Stack.Screen
            name="AdminEnrollments"
            component={AdminEnrollmentsScreen}
            options={{ headerShown: false, title: "Enrollment Requests" }}
          />
          <Stack.Screen
            name="AdminPulse"
            component={AdminPulseScreen}
            options={{ headerShown: false, title: "Platform Pulse" }}
          />
          <Stack.Screen 
            name="EditProfile" 
            component={EditProfileScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Notifications" 
            component={NotificationsScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminSendNotification" 
            component={AdminSendNotificationScreen} 
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
