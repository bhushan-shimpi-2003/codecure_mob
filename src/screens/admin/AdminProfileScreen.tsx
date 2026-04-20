import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { User, Settings, ShieldCheck, LogOut, ChevronRight, Mail, Phone } from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { authApi } from "../../api/endpoints";
import { AppHeader } from "../../components/AppHeader";

export default function AdminProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  const displayName =
    String(
      user?.name ||
        (user as any)?.full_name ||
        (user as any)?.username ||
        (user?.email ? String(user.email).split("@")[0] : "Admin")
    ) || "Admin";

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await authApi.logout();
            await logout();
          } catch (e) {
            await logout();
          }
        },
      },
    ]);
  };

  const menuItems = [
    { icon: User, label: "Edit Profile", bg: "bg-blue-50", color: COLORS.primary },
    { icon: ShieldCheck, label: "Security", bg: "bg-emerald-50", color: COLORS.success },
    { icon: Settings, label: "Settings", bg: "bg-slate-50", color: COLORS.slate600 },
  ];

  return (
    <SafeAreaWrapper>
      <AppHeader role={user?.role} subtitle="Admin center" />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingTop: 16, paddingBottom: 24 }}>
        <View className="mb-4">
          <Text className="text-sm font-black text-blue-600 uppercase tracking-widest mb-1">Admin Panel</Text>
          <Text className="text-2xl font-black text-slate-900">Admin Profile</Text>
          <Text className="text-slate-500 mt-1">Manage your account and access controls</Text>
        </View>

        <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-5 items-center">
          <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center border-4 border-white shadow-sm overflow-hidden mb-4">
            {user?.profile_picture ? (
              <Image source={{ uri: user.profile_picture }} className="w-full h-full" />
            ) : (
              <User size={48} color={COLORS.primary} />
            )}
          </View>

          <Text className="text-xl font-bold text-slate-900">{displayName}</Text>
          <View className="bg-slate-900 px-3 py-1 rounded-full mt-2">
            <Text className="text-white text-xs font-bold uppercase tracking-wider">{user?.role || "Admin"}</Text>
          </View>
        </View>

        <View className="flex-row gap-3 mb-5">
          <View className="flex-1 bg-white rounded-2xl border border-slate-100 p-4">
            <Text className="text-xs text-slate-500 uppercase font-black tracking-wider">Role</Text>
            <View className="flex-row items-center mt-1">
              <ShieldCheck size={16} color={COLORS.primary} />
              <Text className="text-sm font-black text-slate-900 ml-2">{String(user?.role || "admin").toUpperCase()}</Text>
            </View>
          </View>
          <View className="flex-1 bg-white rounded-2xl border border-slate-100 p-4">
            <Text className="text-xs text-slate-500 uppercase font-black tracking-wider">Status</Text>
            <Text className="text-sm font-black text-emerald-600 mt-1">ACTIVE</Text>
          </View>
        </View>

        <View className="bg-white rounded-3xl p-5 mb-5 border border-slate-100 shadow-sm">
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

        <View className="bg-white rounded-3xl overflow-hidden mb-5 border border-slate-100 shadow-sm">
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => (idx === 0 ? navigation.navigate("EditProfile") : null)}
              className={`flex-row items-center p-4 ${idx !== menuItems.length - 1 ? "border-b border-slate-50" : ""}`}
            >
              <View className={`${item.bg} p-2 rounded-xl mr-4`}>
                <item.icon size={20} color={item.color} />
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
      </ScrollView>
    </SafeAreaWrapper>
  );
}
