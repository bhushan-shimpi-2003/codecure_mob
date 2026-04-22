/** @jsxImportSource react */
import "react-native-gesture-handler";
import "./global.css";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./src/context/AuthContext";
import { NotificationProvider } from "./src/context/NotificationContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { vexo } from 'vexo-analytics';
// import 'expo-image-picker';

// Initialize Vexo at the root level, outside of any component
// Recommended to wrap in production-only check
if (__DEV__ === false && process.env.EXPO_PUBLIC_VEXO_API_KEY) {
  vexo(process.env.EXPO_PUBLIC_VEXO_API_KEY);
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
