import React from "react";
import { View, Text, TouchableOpacity, Image, useWindowDimensions } from "react-native";
import { GraduationCap, ChevronLeft, Menu, User, Bell } from "lucide-react-native";
import { COLORS } from "../utils/theme";
import { useAuth } from "../context/AuthContext";
import { Alert } from "react-native";
import { LogOut } from "lucide-react-native";
import { authApi } from "../api/endpoints";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showMenu?: boolean;
  showBell?: boolean;
  onMenuPress?: () => void;
  role?: string;
  navigation?: any;
}

export function AppHeader({ 
    title = "CodeCure", 
    subtitle, 
    showBack = false, 
    showMenu = true,
    showBell = true,
    onMenuPress,
    role = "Student",
    navigation,
}: AppHeaderProps) {
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const handleProfilePress = () => {
    if (!navigation) return;
    const roleLower = user?.role?.toLowerCase() || role.toLowerCase();
    if (roleLower === "teacher") {
      navigation.navigate("TeacherMain", { screen: "TeacherProfile" });
    } else if (roleLower === "admin") {
      navigation.navigate("AdminMain", { screen: "AdminProfile" });
    } else {
      navigation.navigate("StudentMain", { screen: "Profile" });
    }
  };

  return (
    <View className="bg-white border-b border-slate-100/50 z-50">
      <View 
        style={{ maxWidth: isTablet ? 1200 : undefined, alignSelf: "center", width: "100%" }}
        className="px-6 py-4 flex-row items-center justify-between"
      >
        <View className="flex-row items-center">
          {showBack ? (
            <TouchableOpacity 
              onPress={() => navigation?.goBack()}
              className="mr-4 w-10 h-10 items-center justify-center bg-slate-50/50 rounded-xl"
              activeOpacity={0.7}
            >
              <ChevronLeft size={22} color={COLORS.primary} strokeWidth={3} />
            </TouchableOpacity>
          ) : showMenu ? (
            <TouchableOpacity 
              onPress={onMenuPress}
              className="mr-4 w-10 h-10 items-center justify-center bg-slate-50/50 rounded-xl"
              activeOpacity={0.7}
            >
              <Menu size={22} color={COLORS.primary} strokeWidth={3} />
            </TouchableOpacity>
          ) : null}
          
          <View>
            <View className="flex-row items-center">
                <Text className="text-xl font-black tracking-tighter text-blue-600">{title}</Text>
                <Text className="text-xl font-black tracking-tighter text-slate-900 ml-1.5 pointer-events-none">Academy</Text>
            </View>
            {subtitle && <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</Text>}
          </View>
        </View>

        <View className="flex-row items-center gap-5">
            {showBell && (
                <TouchableOpacity className="relative">
                    <Bell size={22} color={COLORS.slate600} strokeWidth={2} />
                    <View className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white" />
                </TouchableOpacity>
            )}
            <TouchableOpacity 
                onPress={handleProfilePress}
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
    </View>
  );
}
