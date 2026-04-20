import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, useWindowDimensions } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { 
  User, 
  Settings, 
  ShieldCheck, 
  LogOut, 
  ChevronRight, 
  Mail, 
  Phone,
  CreditCard,
  Bell
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { authApi } from "../../api/endpoints";
import { StudentScreenHeader } from "../../components/StudentScreenHeader";
import { StudentStatCard } from "../../components/StudentStatCard";
import { AppHeader } from "../../components/AppHeader";

export default function ProfileScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 30 : 24;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const { user, logout } = useAuth();
  const displayName =
    String(
      user?.name ||
        (user as any)?.full_name ||
        (user as any)?.username ||
        (user?.email ? String(user.email).split("@")[0] : "Student")
    ) || "Student";

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
          onPress: async () => {
            try {
              await authApi.logout();
              await logout();
            } catch (e) {
              // Even if API fails, clear local session
              await logout();
            }
          } 
        }
      ]
    );
  };

  const menuItems = [
    { icon: User, label: "Edit Profile", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: ShieldCheck, label: "Security", color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: Bell, label: "Notifications", color: "text-amber-600", bg: "bg-amber-50" },
    { icon: CreditCard, label: "Payments", color: "text-purple-600", bg: "bg-purple-50" },
    { icon: Settings, label: "Settings", color: "text-slate-600", bg: "bg-slate-50" },
  ];

  return (
    <SafeAreaWrapper>
      <AppHeader role={user?.role} subtitle="Account Center" />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: isTablet ? 34 : 24 }}>
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }}>
          <StudentScreenHeader
            badge="Student Workspace"
            title="Profile"
            subtitle="Keep your account details accurate and learning-ready"
          />

          <View style={{ paddingHorizontal: horizontalPadding }} className="pt-1 pb-2 flex-row flex-wrap justify-between">
            <StudentStatCard label="Role" value={String(user?.role || "student").toUpperCase()} Icon={ShieldCheck} tone="blue" />
            <StudentStatCard label="Status" value="Active" Icon={User} tone="emerald" />
          </View>

          <View style={{ paddingHorizontal: horizontalPadding, paddingTop: 12 }}>
            <View className="items-center mb-7 bg-white border border-slate-100 rounded-3xl p-6">
              <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center border-4 border-white shadow-sm overflow-hidden mb-4">
                {user?.profile_picture ? (
                  <Image
                    source={{ uri: user.profile_picture }}
                    className="w-full h-full"
                  />
                ) : (
                  <User size={48} color={COLORS.primary} />
                )}
              </View>
              <Text className="text-xl font-bold text-slate-900">{displayName}</Text>
              <View className="bg-blue-600 px-3 py-1 rounded-full mt-2">
                <Text className="text-white text-xs font-bold uppercase tracking-wider">{user?.role || "Student"}</Text>
              </View>
            </View>

            <View className="bg-white rounded-3xl p-5 mb-6 border border-slate-100 shadow-sm">
              <View className="flex-row items-center mb-4">
                <View className="bg-slate-50 p-2 rounded-xl mr-4">
                  <Mail size={18} color={COLORS.slate500} />
                </View>
                <View>
                  <Text className="text-xs font-semibold text-slate-400">Email Address</Text>
                  <Text className="text-sm font-bold text-slate-900">{user?.email}</Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <View className="bg-slate-50 p-2 rounded-xl mr-4">
                  <Phone size={18} color={COLORS.slate500} />
                </View>
                <View>
                  <Text className="text-xs font-semibold text-slate-400">Phone Number</Text>
                  <Text className="text-sm font-bold text-slate-900">{user?.phone || "+91 98765 43210"}</Text>
                </View>
              </View>
            </View>

            <View className="bg-white rounded-3xl overflow-hidden mb-6 border border-slate-100 shadow-sm">
              {menuItems.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => (idx === 0 ? navigation.navigate("EditProfile") : null)}
                  className={`flex-row items-center p-4 ${idx !== menuItems.length - 1 ? "border-b border-slate-50" : ""}`}
                >
                  <View className={`${item.bg} p-2 rounded-xl mr-4`}>
                    <item.icon size={20} className={item.color} />
                  </View>
                  <Text className="flex-1 font-bold text-slate-700">{item.label}</Text>
                  <ChevronRight size={18} color={COLORS.slate300} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center justify-center p-4 rounded-3xl bg-red-50 border border-red-100"
            >
              <LogOut size={20} color={COLORS.error} className="mr-2" />
              <Text className="text-red-500 font-bold text-base">Log Out</Text>
            </TouchableOpacity>

            <Text className="text-center text-slate-400 text-xs mt-8">CodeCure Academy v1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
