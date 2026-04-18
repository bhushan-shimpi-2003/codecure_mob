import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  LayoutDashboard,
  UserCheck,
  UserCog,
  BookOpenCheck,
  Activity,
  User,
} from "lucide-react-native";
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import AdminEnrollmentsScreen from "../screens/admin/AdminEnrollmentsScreen";
import AdminStaffScreen from "../screens/admin/AdminStaffScreen";
import AdminContentScreen from "../screens/admin/AdminContentScreen";
import AdminPulseScreen from "../screens/admin/AdminPulseScreen";
import AdminProfileScreen from "../screens/admin/AdminProfileScreen";
import { COLORS } from "../utils/theme";

const Tab = createBottomTabNavigator();

export default function AdminMainNavigator() {
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
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          elevation: 10,
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter",
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AdminEnrollments"
        component={AdminEnrollmentsScreen}
        options={{
          title: "Enroll",
          tabBarIcon: ({ color, size }) => <UserCheck color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AdminStaff"
        component={AdminStaffScreen}
        options={{
          title: "Staff",
          tabBarIcon: ({ color, size }) => <UserCog color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AdminContent"
        component={AdminContentScreen}
        options={{
          title: "Content",
          tabBarIcon: ({ color, size }) => <BookOpenCheck color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AdminPulse"
        component={AdminPulseScreen}
        options={{
          title: "Pulse",
          tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
