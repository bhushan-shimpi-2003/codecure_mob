import React from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
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
import { COLORS } from "../utils/theme";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
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

            {/* Shared & Student Stack Screens */}
            <Stack.Screen 
              name="CourseDetail" 
              component={CourseDetailScreen} 
              options={{ headerShown: true, title: "Course Details" }}
            />
            <Stack.Screen 
              name="Lesson" 
              component={LessonScreen} 
              options={{ headerShown: true, title: "Lesson Player" }}
            />
            <Stack.Screen 
              name="Assignments" 
              component={AssignmentsScreen} 
              options={{ headerShown: true, title: "My Assignments" }}
            />
            <Stack.Screen 
              name="MockInterviews" 
              component={MockInterviewsScreen} 
              options={{ headerShown: true, title: "Mock Interviews" }}
            />
            <Stack.Screen
              name="TeacherDoubts"
              component={TeacherDoubtsScreen}
              options={{ headerShown: true, title: "Teacher Doubts" }}
            />
            <Stack.Screen
              name="TeacherAssignments"
              component={TeacherAssignmentsScreen}
              options={{ headerShown: true, title: "Teacher Assignments" }}
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen} 
              options={{ headerShown: true, title: "Edit Your Profile" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
