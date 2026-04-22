import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { coursesApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { COLORS } from "../../utils/theme";
import { Users, PlayCircle, BookOpen, ArrowRight, Layers, Sparkles } from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";
import { LinearGradient } from "expo-linear-gradient";

export default function TeacherCoursesScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCourses = async () => {
    try {
      const res = await coursesApi.teacherCourses();
      if (isApiSuccess(res.data)) {
        setCourses(extractApiData<any[]>(res.data, []));
      }
    } catch (e) {
      console.log("Error loading teacher courses", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} role="Teacher" />
      <ScrollView 
        className="flex-1 bg-[#F8FAFC]" 
        contentContainerStyle={{ paddingBottom: 60 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCourses(); }} tintColor="#2563EB" />
        }
      >
        <View className="px-6 pt-10">
           {/* Header Section */}
           <View className="mb-10">
              <View className="flex-row items-center gap-2 mb-3">
                 <View className="bg-indigo-100 px-3 py-1 rounded-full">
                    <Text className="text-indigo-700 text-[10px] font-black uppercase tracking-widest">Curriculum Management</Text>
                 </View>
                 <Layers size={14} color="#6366F1" />
              </View>
              <Text className="text-[40px] font-black text-slate-900 leading-[44px] tracking-tight">
                 Course <Text className="text-blue-600">Lab</Text>
              </Text>
              <Text className="text-slate-400 text-base font-bold mt-2">Manage your active tracks and student progress.</Text>
           </View>

           {/* High-Level Stats */}
           <View className="flex-row justify-between mb-12">
              <View className="w-[48%] bg-white p-6 rounded-[36px] shadow-2xl shadow-slate-900/[0.03] border border-slate-50">
                 <View className="bg-blue-50 w-12 h-12 rounded-2xl items-center justify-center mb-4">
                    <Users size={20} color="#2563EB" />
                 </View>
                 <Text className="text-3xl font-black text-slate-900 mb-0.5">
                    {courses.reduce((acc, curr) => acc + (curr.students_enrolled || curr.enrollment_count || 0), 0)}
                 </Text>
                 <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Students</Text>
              </View>
              <View className="w-[48%] bg-white p-6 rounded-[36px] shadow-2xl shadow-slate-900/[0.03] border border-slate-50">
                 <View className="bg-purple-50 w-12 h-12 rounded-2xl items-center justify-center mb-4">
                    <BookOpen size={20} color="#7C3AED" />
                 </View>
                 <Text className="text-3xl font-black text-slate-900 mb-0.5">{courses.length}</Text>
                 <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tracks</Text>
              </View>
           </View>

           {isLoading ? (
             <View className="py-20 items-center justify-center">
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-6">Syncing Curriculum...</Text>
             </View>
           ) : (
             <View>
               {courses.map((course, index) => {
                 const courseId = course?.id || course?._id;
                 const studentCount = course?.students_enrolled || course?.enrollment_count || 0;
                 const moduleCount = course?.modules?.length || 0;
                 return (
                   <View key={courseId || index} className="bg-white rounded-[44px] overflow-hidden mb-10 shadow-2xl shadow-slate-900/[0.04] border border-white">
                     {/* Thumbnail Hero */}
                     <View className="h-64 relative">
                        <Image source={{ uri: course?.thumbnail || `https://picsum.photos/seed/${courseId}/800/600` }} className="w-full h-full" />
                        <LinearGradient
                          colors={['transparent', 'rgba(15, 23, 42, 0.9)']}
                          className="absolute inset-0 justify-end p-8"
                        >
                           <View className="flex-row items-center gap-2 mb-2">
                              <View className="bg-blue-600 px-3 py-1 rounded-full">
                                 <Text className="text-white text-[9px] font-black uppercase tracking-wider">{course?.level || "Beginner"}</Text>
                              </View>
                              <View className="bg-white/20 px-3 py-1 rounded-full border border-white/30 backdrop-blur-md">
                                 <Text className="text-white text-[9px] font-black uppercase tracking-wider">{course?.category || "Tech"}</Text>
                              </View>
                           </View>
                           <Text className="text-2xl font-black text-white leading-tight" numberOfLines={2}>{course?.title}</Text>
                        </LinearGradient>
                     </View>

                     {/* Stats Section */}
                     <View className="p-8">
                        <View className="flex-row items-center justify-between mb-10">
                           <View className="items-center">
                              <View className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center mb-2">
                                 <Users size={18} color="#64748B" />
                              </View>
                              <Text className="text-sm font-black text-slate-900">{studentCount}</Text>
                              <Text className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Students</Text>
                           </View>
                           <View className="items-center">
                              <View className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center mb-2">
                                 <Layers size={18} color="#64748B" />
                              </View>
                              <Text className="text-sm font-black text-slate-900">{moduleCount}</Text>
                              <Text className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Modules</Text>
                           </View>
                           <View className="items-center">
                              <View className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center mb-2">
                                 <PlayCircle size={18} color="#64748B" />
                              </View>
                              <Text className="text-sm font-black text-slate-900">{course?.lesson_count || 0}</Text>
                              <Text className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Lessons</Text>
                           </View>
                        </View>

                        {/* Actions */}
                        <View className="flex-row items-center gap-4">
                           <TouchableOpacity 
                             onPress={() => navigation.navigate("TeacherManageLessons", { courseId, courseTitle: course?.title })}
                             activeOpacity={0.8}
                             className="flex-1 overflow-hidden rounded-3xl"
                           >
                              <LinearGradient
                                colors={['#2563EB', '#1D4ED8']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="py-5 flex-row items-center justify-center gap-3"
                              >
                                 <Text className="text-white font-black text-xs uppercase tracking-widest">Manage Curriculum</Text>
                                 <ArrowRight size={16} color="white" />
                              </LinearGradient>
                           </TouchableOpacity>
                           <TouchableOpacity 
                             activeOpacity={0.7}
                             className="w-16 h-16 bg-slate-900 rounded-3xl items-center justify-center shadow-lg shadow-slate-900/20"
                           >
                              <PlayCircle size={24} color="white" />
                           </TouchableOpacity>
                        </View>
                     </View>
                   </View>
                 );
               })}

               {courses.length === 0 && (
                 <View className="py-20 items-center justify-center bg-white rounded-[48px] border border-dashed border-slate-200">
                    <View className="bg-slate-50 w-20 h-20 rounded-full items-center justify-center mb-6">
                       <BookOpen size={32} color="#CBD5E1" />
                    </View>
                    <Text className="text-slate-400 font-black text-xs uppercase tracking-widest">No active tracks found</Text>
                 </View>
               )}
             </View>
           )}

           <TouchableOpacity 
             activeOpacity={0.7}
             className="mt-6 border-2 border-dashed border-slate-200 rounded-[40px] py-10 items-center flex-row justify-center gap-4"
           >
              <Sparkles size={20} color="#94A3B8" />
              <Text className="text-slate-400 font-black text-sm uppercase tracking-widest">Request New Assignment</Text>
           </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
