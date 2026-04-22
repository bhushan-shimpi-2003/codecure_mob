import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { useAuth } from "../../context/AuthContext";
import { authApi, coursesApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { 
  Mail, 
  Phone, 
  Link2, 
  Code, 
  Edit2, 
  Star, 
  Users, 
  LogOut,
} from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";


export default function TeacherProfileScreen({ navigation }: any) {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        authApi.me(),
        coursesApi.teacherCourses()
      ]);

      if (isApiSuccess(pRes.data)) {
        setProfile(extractApiData(pRes.data, null));
      }
      if (isApiSuccess(cRes.data)) {
        setCourses(extractApiData<any[]>(cRes.data, []));
      }
    } catch (e) {
      console.log("Error fetching profile data", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await logout();
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading && !refreshing) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <AppHeader role="Teacher" navigation={navigation} />
      <ScrollView 
        className="flex-1 bg-[#F8FAFC]" 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        <View className="items-center pt-8 px-6">
          {/* Avatar Section */}
          <View className="relative">
            <View className="w-44 h-44 rounded-[48px] overflow-hidden border-4 border-white shadow-2xl">
              <Image 
                source={{ uri: profile?.avatar_url || "https://i.pravatar.cc/300?img=12" }} 
                className="w-full h-full bg-slate-200"
              />
            </View>
            <TouchableOpacity className="absolute bottom-1 right-1 w-12 h-12 bg-blue-600 rounded-2xl items-center justify-center border-4 border-white shadow-lg">
              <Edit2 size={18} color="white" />
            </TouchableOpacity>
          </View>

          {/* Identity */}
          <Text className="text-3xl font-black text-slate-900 mt-6">{profile?.name || "Professor"}</Text>
          <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mt-1">{profile?.role || "MENTOR"}</Text>
          
          <Text className="text-slate-500 text-center mt-5 leading-5 px-4 font-medium">
            {profile?.bio || "Expert educator at CodeCure Academy, dedicated to building the next generation of full-stack engineers."}
          </Text>
 
          {/* Stats Cards */}
          <View className="flex-row gap-4 mt-8">
             <View className="flex-1 bg-white rounded-[32px] p-6 items-center border border-slate-50 shadow-sm">
                <Text className="text-2xl font-black text-blue-600">{profile?.experience_years || "5+"}</Text>
                <Text className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1">Exp. Years</Text>
             </View>
             <View className="flex-1 bg-white rounded-[32px] p-6 items-center border border-slate-50 shadow-sm">
                <Text className="text-2xl font-black text-blue-600">{courses.length}</Text>
                <Text className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1">Total Courses</Text>
             </View>
          </View>
 
          {/* Rating Card */}
          <View className="w-full bg-blue-600 rounded-[36px] p-8 mt-4 shadow-xl shadow-blue-200 items-center">
             <Text className="text-4xl font-black text-white">{profile?.rating || "5.0"}</Text>
             <View className="flex-row gap-1 mt-1">
                {[1,2,3,4,5].map(i => <Star key={i} size={14} color="white" fill="white" />)}
             </View>
             <Text className="text-[10px] font-black text-blue-100 uppercase tracking-[1px] mt-2">Student Rating</Text>
          </View>
 
          {/* Skills Tags */}
          <View className="flex-row flex-wrap justify-center gap-2 mt-8">
            {(profile?.skills || ["Programming", "Logic", "Development"]).map((skill: any) => (
              <View key={skill} className="bg-blue-100 px-4 py-2 rounded-full">
                <Text className="text-[10px] font-black text-blue-700 uppercase">{skill}</Text>
              </View>
            ))}
          </View>
 
          {/* Schedule Button */}
          <TouchableOpacity className="w-full bg-blue-600 rounded-[28px] py-5 items-center justify-center mt-8 shadow-lg shadow-blue-200">
              <Text className="text-white font-black text-base">Update Status</Text>
          </TouchableOpacity>
 
          {/* Connect & Inquiries */}
          <View className="w-full bg-white rounded-[40px] p-8 mt-10 border border-slate-50 shadow-sm">
             <Text className="text-lg font-black text-slate-900 mb-6">Connect & Inquiries</Text>
             
             <View className="gap-6">
                <View className="flex-row items-center">
                   <View className="w-10 h-10 rounded-2xl bg-blue-50 items-center justify-center">
                      <Mail size={18} color="#2563EB" />
                   </View>
                   <View className="ml-4">
                      <Text className="text-[9px] font-black text-slate-400 uppercase">Email Address</Text>
                      <Text className="text-slate-900 font-bold text-sm">{profile?.email || "mentor@codecure.edu"}</Text>
                   </View>
                </View>
 
                <View className="flex-row items-center">
                   <View className="w-10 h-10 rounded-2xl bg-blue-50 items-center justify-center">
                      <Phone size={18} color="#2563EB" />
                   </View>
                   <View className="ml-4">
                      <Text className="text-[9px] font-black text-slate-400 uppercase">Direct Line</Text>
                      <Text className="text-slate-900 font-bold text-sm">{profile?.phone || "+91 (Mobile Only)"}</Text>
                   </View>
                </View>
 
                <View className="flex-row gap-3 mt-2">
                   <TouchableOpacity className="flex-1 bg-slate-50 rounded-2xl py-4 flex-row items-center justify-center">
                      <Link2 size={16} color="#475569" />
                      <Text className="text-slate-700 font-bold text-xs ml-2">LinkedIn</Text>
                   </TouchableOpacity>
                   <TouchableOpacity className="flex-1 bg-slate-50 rounded-2xl py-4 flex-row items-center justify-center">
                      <Code size={16} color="#475569" />
                      <Text className="text-slate-700 font-bold text-xs ml-2">GitHub</Text>
                   </TouchableOpacity>
                </View>
             </View>
          </View>

          {/* Current Courses */}
          <View className="w-full mt-10">
             <View className="flex-row items-center justify-between mb-6">
                <Text className="text-xl font-black text-slate-900">Current Courses</Text>
                <TouchableOpacity><Text className="text-[10px] font-black text-blue-600 uppercase">View All</Text></TouchableOpacity>
             </View>

             <View className="gap-4">
                {courses.slice(0, 2).map((course) => (
                  <View key={course.id || course._id} className="bg-white rounded-[32px] p-4 flex-row items-center border border-slate-50 shadow-sm">
                     <Image 
                       source={{ uri: course.image_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=200" }} 
                       className="w-16 h-16 rounded-2xl bg-slate-100"
                     />
                     <View className="flex-1 ml-4 pr-4">
                        <Text className="text-sm font-black text-slate-900" numberOfLines={1}>{course.title}</Text>
                        <View className="flex-row items-center mt-1">
                           <Users size={12} color="#94A3B8" />
                           <Text className="text-[10px] font-bold text-slate-400 ml-1.5">{course.enrolled_count || 0} Students enrolled</Text>
                        </View>
                        {/* Progress bar style */}
                        <View className="h-1 bg-slate-100 rounded-full mt-3 overflow-hidden">
                           <View className="h-full bg-blue-600 w-[60%]" />
                        </View>
                     </View>
                  </View>
                ))}
              </View>
           </View>

            {/* Pure Pressable Logout - New Architecture Friendly */}
            <View className="px-8 pb-40 pt-10">
                <Pressable 
                    onPress={handleLogout}
                    disabled={loggingOut}
                    style={({ pressed }) => ({
                        opacity: pressed || loggingOut ? 0.5 : 1,
                        backgroundColor: '#FEF2F2',
                        borderColor: '#FEE2E2',
                        borderWidth: 2,
                        paddingVertical: 20,
                        borderRadius: 30,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row'
                    })}
                >
                    {loggingOut ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                        <>
                            <LogOut size={20} color="#EF4444" strokeWidth={2.5} />
                            <Text className="text-red-500 font-black text-xs uppercase tracking-[2px] ml-3">Log Out</Text>
                        </>
                    )}
                </Pressable>
                <Text className="text-center text-slate-300 text-[10px] font-black uppercase tracking-widest mt-8">CodeCure Academy v1.2.4</Text>
            </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
