import React from "react";
import { View, Text, TouchableOpacity, Image, useWindowDimensions } from "react-native";
import { GraduationCap, ChevronLeft, Menu, User, Bell } from "lucide-react-native";
import { COLORS } from "../utils/theme";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
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
  const { unreadCount } = useNotifications();
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
          {showBack && (
            <TouchableOpacity 
              onPress={() => navigation?.goBack()}
              className="mr-4 w-10 h-10 items-center justify-center bg-slate-50/50 rounded-xl"
              activeOpacity={0.7}
            >
              <ChevronLeft size={22} color={COLORS.primary} strokeWidth={3} />
            </TouchableOpacity>
          )}
          
          <View className="w-10 h-10 bg-blue-600 rounded-xl items-center justify-center mr-3 shadow-sm shadow-blue-600/30">
            <GraduationCap size={22} color="white" />
          </View>
          
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
                <TouchableOpacity 
                  className="relative"
                  onPress={() => navigation?.navigate("Notifications")}
                >
                    <Bell size={22} color={COLORS.slate600} strokeWidth={2} />
                    {unreadCount > 0 && (
                      <View className="absolute -top-1 -right-1 bg-rose-500 rounded-full h-4 w-4 items-center justify-center border-2 border-white">
                        <Text className="text-white text-[8px] font-black">{unreadCount > 9 ? '9+' : unreadCount}</Text>
                      </View>
                    )}
                </TouchableOpacity>
            )}
        </View>
      </View>
    </View>
  );
}
