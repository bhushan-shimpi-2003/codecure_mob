import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, useWindowDimensions, RefreshControl } from "react-native";
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
  Bell,
  Pencil,
  BookOpen,
  Medal,
  Shield,
  Layout,
  Share2,
  Flame,
  Zap,
  Star,
  Search,
  MoreVertical
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { authApi, enrollmentsApi } from "../../api/endpoints";
import { AppHeader } from "../../components/AppHeader";
import { LinearGradient } from "expo-linear-gradient";
import { extractApiData, isApiSuccess } from "../../api/response";
import { useFocusEffect } from "@react-navigation/native";

export default function ProfileScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const { user, logout } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfileData = useCallback(async () => {
    try {
      const res = await enrollmentsApi.myEnrollments();
      if (isApiSuccess(res.data)) {
        setEnrollments(extractApiData<any[]>(res.data, []));
      }
    } catch (e) {
      console.log("Error loading profile stats", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
        fetchProfileData();
    }, [fetchProfileData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

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
              await logout();
            }
          } 
        }
      ]
    );
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "Scholar";
  const displayEmail = user?.email || "alex.thorne@codecure.edu";

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader role={user?.role} subtitle="Account Center" />

      <ScrollView 
        className="flex-1 bg-[#F8FAFC]" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }} className="pb-24">
            
            {/* Top Profile Card Upgrade */}
            <View className="px-6 pt-10 pb-8">
                <View className="bg-white rounded-[48px] p-8 border border-white shadow-2xl shadow-slate-900/[0.03] overflow-hidden">
                    <View className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full opacity-50" />
                    
                    <View className="flex-row items-center gap-6 mb-8">
                        <View className="relative">
                            <View className="w-24 h-24 rounded-full border-4 border-slate-50 overflow-hidden">
                                <Image source={{ uri: user?.profile_picture || "https://i.pravatar.cc/300?u=alex" }} className="w-full h-full" />
                            </View>
                            <TouchableOpacity 
                                onPress={() => navigation.navigate("EditProfile")}
                                className="absolute -bottom-1 -right-1 w-9 h-9 bg-blue-600 rounded-full border-4 border-white items-center justify-center"
                            >
                                <Pencil size={12} color="white" strokeWidth={3} />
                            </TouchableOpacity>
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{getGreeting()}</Text>
                            <Text className="text-2xl font-black text-slate-900 mb-1" numberOfLines={1}>{displayName}</Text>
                            <View className="flex-row items-center gap-2">
                                <View className="w-2 h-2 rounded-full bg-emerald-500" />
                                <Text className="text-slate-400 font-bold text-xs uppercase tracking-wider">{user?.role || "Student"}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Quick Badges Gallery */}
                    <View className="flex-row gap-3 mb-8">
                        <View className="flex-1 bg-blue-50 px-4 py-3 rounded-2xl flex-row items-center justify-center gap-2">
                             <Flame size={14} color="#2563EB" strokeWidth={3} />
                             <Text className="text-blue-700 font-black text-xs">7 DAY STREAK</Text>
                        </View>
                        <View className="flex-1 bg-amber-50 px-4 py-3 rounded-2xl flex-row items-center justify-center gap-2">
                             <Star size={14} color="#D97706" fill="#D97706" />
                             <Text className="text-amber-700 font-black text-xs">TOP 5%</Text>
                        </View>
                    </View>

                    <TouchableOpacity 
                        onPress={() => navigation.navigate("EditProfile")}
                        className="bg-slate-950 py-5 rounded-[24px] items-center mb-2 active:scale-[0.98] transition-all"
                    >
                        <Text className="text-white font-black text-xs uppercase tracking-widest">Manage Account</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Redesigned Stat Cards with Modern Aesthetics */}
            <View className="flex-row px-6 gap-6 mb-12">
                <View className="flex-1 bg-white p-6 rounded-[40px] border border-slate-50 shadow-sm overflow-hidden">
                    <View className="bg-blue-50 w-12 h-12 rounded-2xl items-center justify-center mb-6">
                        <BookOpen size={20} color="#2563EB" strokeWidth={2.5} />
                    </View>
                    <Text className="text-3xl font-black text-slate-900 mb-1">{enrollments.length}</Text>
                    <Text className="text-slate-400 font-black text-[10px] uppercase tracking-wider">Courses</Text>
                </View>

                <View className="flex-1 bg-white p-6 rounded-[40px] border border-slate-50 shadow-sm overflow-hidden">
                    <View className="bg-amber-50 w-12 h-12 rounded-2xl items-center justify-center mb-6">
                        <Zap size={20} color="#D97706" fill="#D97706" />
                    </View>
                    <Text className="text-3xl font-black text-slate-900 mb-1">450</Text>
                    <Text className="text-slate-400 font-black text-[10px] uppercase tracking-wider">Cure Points</Text>
                </View>
            </View>

            {/* Account Settings with Section Headers */}
            <View className="px-6 mb-12">
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-6 ml-4">Preferences & Policy</Text>
                
                <View className="bg-white rounded-[44px] overflow-hidden border border-slate-50 shadow-sm px-2">
                    {[
                        { title: "Privacy & Security", subtitle: "Manage your data and security", icon: Shield, color: "bg-blue-50", iconColor: "#2563EB" },
                        { title: "Subscription", subtitle: "Active • Pro Annual Plan", icon: CreditCard, color: "bg-emerald-50", iconColor: "#059669" },
                        { title: "Settings", subtitle: "Theme and notification settings", icon: Layout, color: "bg-indigo-50", iconColor: "#4F46E5" }
                    ].map((item, i) => (
                        <TouchableOpacity 
                            key={i} 
                            className={`flex-row items-center p-6 ${i !== 2 ? "border-b border-slate-50" : ""}`}
                            activeOpacity={0.7}
                        >
                            <View className={`${item.color} w-12 h-12 rounded-2xl items-center justify-center mr-6`}>
                                <item.icon size={20} color={item.iconColor} strokeWidth={2.5} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-900 font-black text-sm mb-0.5">{item.title}</Text>
                                <Text className="text-slate-400 font-bold text-[10px]" numberOfLines={1}>{item.subtitle}</Text>
                            </View>
                            <ChevronRight size={16} color={COLORS.slate300} />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Invite Banner - More Subtle Design */}
            <View className="px-6 mb-12">
                <LinearGradient
                    colors={['#2563EB', '#1D4ED8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="rounded-[44px] p-10 overflow-hidden relative shadow-xl shadow-blue-900/30"
                >
                    <View className="z-10">
                        <Text className="text-white text-2xl font-black mb-2 leading-tight">Elevate your team</Text>
                        <Text className="text-white/70 font-bold text-xs leading-5 mb-8">
                            Refer a fellow developer and get 1 month of CodeCure Pro for free.
                        </Text>
                        <TouchableOpacity className="bg-white px-8 py-4 rounded-[18px] self-start flex-row items-center shadow-lg">
                            <Text className="text-blue-900 font-black text-xs mr-2">SHARING LINK</Text>
                            <Share2 size={14} color="#1E3A8A" />
                        </TouchableOpacity>
                    </View>

                    {/* Minimalist Shapes */}
                    <View style={{ transform: [{ rotate: '45deg' }] }} className="absolute -right-16 -top-16 w-48 h-48 bg-white/5 rounded-[40px]" />
                </LinearGradient>
            </View>

            {/* Large Logout Trigger */}
            <View className="px-10 mb-20">
                <TouchableOpacity 
                    onPress={handleLogout}
                    className="flex-row items-center justify-center border-2 border-red-50 py-6 rounded-[32px] bg-red-50/20"
                >
                    <LogOut size={20} color="#EF4444" strokeWidth={2.5} className="mr-3" />
                    <Text className="text-red-500 font-black text-xs uppercase tracking-widest">Sign out of Academy</Text>
                </TouchableOpacity>
                <Text className="text-center text-slate-300 text-[10px] font-black uppercase tracking-widest mt-8">CodeCure v1.2.4 • Build 882</Text>
            </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
