import React from "react";
import { View, Text, TouchableOpacity, Image, useWindowDimensions } from "react-native";
import { GraduationCap, ChevronLeft, Menu, User } from "lucide-react-native";
import { COLORS } from "../utils/theme";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  role?: string;
  roleIcon?: any;
}

export function AppHeader({ 
    title = "CodeCure Academy", 
    subtitle, 
    showBack = false, 
    role = "Student",
    roleIcon: Icon = GraduationCap 
}: AppHeaderProps) {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <View className="bg-white border-b border-slate-100 z-50">
      <View 
        style={{ maxWidth: isTablet ? 1200 : undefined, alignSelf: "center", width: "100%" }}
        className="px-6 py-4 flex-row items-center justify-between"
      >
        <View className="flex-row items-center">
          {showBack ? (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="mr-3 w-10 h-10 items-center justify-center"
              activeOpacity={0.7}
            >
              <ChevronLeft size={24} color={COLORS.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              className="mr-3 w-10 h-10 items-center justify-center"
              activeOpacity={0.7}
            >
              <Menu size={24} color={COLORS.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
          
          <View className="flex-row items-center">
            <Text className="text-xl font-black tracking-tighter text-blue-600">CodeCure</Text>
            <Text className="text-xl font-black tracking-tighter text-slate-800 ml-1.5">Academy</Text>
          </View>
        </View>

        <TouchableOpacity 
            onPress={() => navigation.navigate("Profile")}
            className="w-10 h-10 rounded-full border-2 border-slate-100 overflow-hidden bg-slate-50 items-center justify-center shadow-sm"
        >
            {user?.profile_picture ? (
                <Image source={{ uri: user.profile_picture }} className="w-full h-full" />
            ) : (
                <User size={20} color={COLORS.slate400} />
            )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

