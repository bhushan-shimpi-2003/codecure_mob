import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { useAuth } from "../../context/AuthContext";
import { authApi, coursesApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { 
  LogOut,
  ChevronRight,
  Settings,
  Shield,
  HelpCircle,
  MessageSquare,
  BookOpen,
  Award,
  Users,
  Star,
  Bell,
  Sparkles,
  ArrowRight,
  Megaphone,
} from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";
import { LinearGradient } from "expo-linear-gradient";

export default function TeacherProfileScreen({ navigation }: any) {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.allSettled([
        authApi.me(),
        coursesApi.teacherCourses()
      ]);

      if (pRes.status === "fulfilled" && isApiSuccess(pRes.value.data)) {
        setProfile(extractApiData(pRes.value.data, null));
      }
      if (cRes.status === "fulfilled" && isApiSuccess(cRes.value.data)) {
        setCourses(extractApiData<any[]>(cRes.value.data, []));
      }
    } catch (e) {
      console.log("Error fetching profile data", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
    } catch (e) {
      console.log("Logout failed", e);
      Alert.alert("Error", "Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const LogoutModal = () => (
    <Modal
      visible={showLogoutModal}
      transparent
      animationType="fade"
      onRequestClose={() => !isLoggingOut && setShowLogoutModal(false)}
    >
      <View className="flex-1 bg-slate-900/60 justify-center items-center px-6">
        <View className="bg-white w-full rounded-[48px] overflow-hidden shadow-2xl border border-white/20">
          {/* Header Gradient */}
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            className="pt-12 pb-10 items-center justify-center"
          >
            <View className="w-20 h-20 bg-blue-600/20 rounded-full items-center justify-center border border-blue-500/30">
               <LogOut size={32} color="#3B82F6" />
            </View>
            <Text className="text-white text-2xl font-black mt-6 tracking-tight">End Session</Text>
            <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Professional Portal</Text>
          </LinearGradient>

          <View className="p-10 items-center">
            <Text className="text-slate-600 text-center leading-6 font-medium text-base">
              Are you sure you want to logout? You will need to re-authenticate to access your instructor dashboard.
            </Text>

            <View className="w-full mt-10 gap-4">
              <TouchableOpacity
                onPress={performLogout}
                disabled={isLoggingOut}
                activeOpacity={0.8}
                className="bg-blue-600 py-6 rounded-[32px] items-center justify-center shadow-lg shadow-blue-600/20 flex-row"
              >
                {isLoggingOut ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text className="text-white font-black text-sm uppercase tracking-widest">Logout Now</Text>
                    <ArrowRight size={16} color="white" className="ml-3" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                activeOpacity={0.7}
                className="py-6 rounded-[32px] items-center justify-center border border-slate-100"
              >
                <Text className="text-slate-400 font-black text-xs uppercase tracking-widest">Stay Logged In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const ProfileLink = ({ icon: Icon, title, subtitle, onPress, color = "#2563EB", isLast = false }: any) => (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center p-6 bg-white ${!isLast ? 'border-b border-slate-50' : ''}`}
    >
      <View className={`w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center mr-4`}>
         <Icon size={20} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-black text-slate-900">{title}</Text>
        {subtitle && <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{subtitle}</Text>}
      </View>
      <ChevronRight size={18} color="#CBD5E1" />
    </TouchableOpacity>
  );

  if (isLoading && !refreshing) {
    return (
      <SafeAreaWrapper bgWhite>
        <View className="flex-1 items-center justify-center">
           <ActivityIndicator size="large" color="#2563EB" />
           <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-6">Syncing Identity...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} role="Teacher" />
      <LogoutModal />
      <ScrollView 
        className="flex-1 bg-[#F8FAFC]" 
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#2563EB" />
        }
      >
        <View className="px-6 pt-10">
          
          {/* Profile Hero */}
          <View className="bg-white rounded-[44px] p-10 items-center border border-white shadow-2xl shadow-slate-900/[0.04] mb-10 overflow-hidden">
             <View className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16" />
             <View className="relative">
                <View className="w-32 h-32 rounded-full border-4 border-slate-50 overflow-hidden shadow-xl shadow-blue-900/10">
                    <Image 
                      source={{ uri: profile?.profile_picture || profile?.avatar || "https://i.pravatar.cc/300?u=instructor" }} 
                      className="w-full h-full" 
                    />
                </View>
                <View className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full border-4 border-white items-center justify-center shadow-lg">
                   <Award size={16} color="white" />
                </View>
             </View>
             <Text className="text-2xl font-black text-slate-900 mt-6">{profile?.name || "Professor"}</Text>
             <View className="bg-blue-50 px-3 py-1 rounded-full mt-2">
                <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Senior Instructor</Text>
             </View>
          </View>

          {/* Teacher Impact Section */}
          <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-6 ml-2">PROFESSIONAL IMPACT</Text>
          <View className="flex-row justify-between mb-10">
             <View className="w-[31%] bg-white p-5 rounded-[32px] items-center shadow-sm border border-slate-50">
                <Users size={18} color="#2563EB" />
                <Text className="text-lg font-black text-slate-900 mt-2">
                   {courses.reduce((acc, curr) => acc + (curr.students_enrolled || curr.enrollment_count || 0), 0)}+
                </Text>
                <Text className="text-[8px] font-black text-slate-400 uppercase">Mentees</Text>
             </View>
             <View className="w-[31%] bg-white p-5 rounded-[32px] items-center shadow-sm border border-slate-50">
                <Star size={18} color="#F59E0B" />
                <Text className="text-lg font-black text-slate-900 mt-2">4.9</Text>
                <Text className="text-[8px] font-black text-slate-400 uppercase">Rating</Text>
             </View>
             <View className="w-[31%] bg-white p-5 rounded-[32px] items-center shadow-sm border border-slate-50">
                <BookOpen size={18} color="#7C3AED" />
                <Text className="text-lg font-black text-slate-900 mt-2">{courses.length}</Text>
                <Text className="text-[8px] font-black text-slate-400 uppercase">Tracks</Text>
             </View>
          </View>

          {/* Account Settings Group */}
          <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-6 ml-2">IDENTITY & SECURITY</Text>
          <View className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-slate-50 mb-10">
            <ProfileLink 
              icon={Settings} 
              title="Edit Profile" 
              subtitle="Update Identity & Bio"
              onPress={() => navigation.navigate("EditProfile")} 
            />
            <ProfileLink 
              icon={Bell} 
              title="Notifications" 
              subtitle="Manage Alert Preferences"
              onPress={() => navigation.navigate("Notifications")} 
            />
            <ProfileLink 
              icon={Megaphone} 
              title="Send Announcement" 
              subtitle="Broadcast to Your Students"
              color="#2563EB"
              onPress={() => navigation.navigate("TeacherSendNotification")} 
            />
            <ProfileLink 
              icon={Shield} 
              title="Security" 
              subtitle="Password & Privacy"
              color="#10B981"
              onPress={() => navigation.navigate("EditProfile")} 
            />
            <ProfileLink 
              icon={Sparkles} 
              title="Teacher Rewards" 
              subtitle="Claim Instructor Perks"
              color="#F59E0B"
              isLast
            />
          </View>

          {/* Support Group */}
          <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-6 ml-2">RESOURCES</Text>
          <View className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-slate-50 mb-10">
            <ProfileLink 
              icon={HelpCircle} 
              title="Help & FAQ" 
              subtitle="Instructor Guidelines"
            />
            <ProfileLink 
              icon={MessageSquare} 
              title="Community Support" 
              subtitle="Connect with other Teachers"
              isLast
            />
          </View>

          <TouchableOpacity 
            onPress={() => {
              console.log("Logout button pressed");
              handleLogout();
            }}
            disabled={isLoggingOut}
            className={`bg-rose-50 rounded-[32px] py-6 flex-row items-center justify-center border border-rose-100 mb-10 ${isLoggingOut ? 'opacity-50' : ''}`}
          >
            {isLoggingOut ? (
                <ActivityIndicator color="#E11D48" size="small" />
            ) : (
                <>
                    <LogOut size={18} color="#E11D48" />
                    <Text className="text-rose-600 font-black text-xs uppercase tracking-widest ml-3">End Session</Text>
                </>
            )}
          </TouchableOpacity>

          <View className="items-center mb-10">
             <Text className="text-slate-300 text-[10px] font-black uppercase tracking-widest">CodeCure Instructor Portal v1.0.4</Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
