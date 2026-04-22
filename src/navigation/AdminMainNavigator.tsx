import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  LayoutGrid,
  GraduationCap,
  Users,
  Settings,
  CreditCard,
} from "lucide-react-native";
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import AdminTransactionsScreen from "../screens/admin/AdminTransactionsScreen";
import AdminStaffScreen from "../screens/admin/AdminStaffScreen";
import AdminContentScreen from "../screens/admin/AdminContentScreen";
import AdminEditCourseScreen from "../screens/admin/AdminEditCourseScreen";
import AdminProfileScreen from "../screens/admin/AdminProfileScreen";
import { COLORS } from "../utils/theme";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AdminAcademyStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 400
      }}
    >
      <Stack.Screen name="AdminAcademyHome" component={AdminContentScreen} />
      <Stack.Screen name="AdminEditCourse" component={AdminEditCourseScreen} />
    </Stack.Navigator>
  );
}

export default function AdminMainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.slate400,
        tabBarShowLabel: true,
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
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AdminTransactions"
        component={AdminTransactionsScreen}
        options={{
          title: "Ledger",
          tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AdminAcademy"
        component={AdminAcademyStack}
        options={{
          title: "Academy",
          tabBarIcon: ({ color, size }) => <GraduationCap color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AdminStaff"
        component={AdminStaffScreen}
        options={{
          title: "Users",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
