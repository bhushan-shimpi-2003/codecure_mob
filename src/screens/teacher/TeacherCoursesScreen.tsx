import React, { useEffect, useMemo, useState } from "react";
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
import { Users, PlayCircle, BookOpen, ArrowRight } from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";

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
    <SafeAreaWrapper>
      <AppHeader navigation={navigation} role="Teacher" />
      <ScrollView className="flex-1 bg-[#F8FAFC]" contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCourses(); }} />}>
        <View className="px-6 pt-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">CURRICULUM ENGINE</Text>
            <View className="bg-emerald-100 px-3 py-1 rounded-full"><Text className="text-[9px] font-black text-emerald-600">LIVE TRACKING</Text></View>
          </View>
          <Text className="text-4xl font-black text-slate-900 mb-6">Course Lab</Text>
          <View className="flex-row justify-between mb-10">
            <View className="w-[48%] bg-white p-5 rounded-[32px] shadow-sm border border-slate-50">
              <View className="bg-blue-50 w-10 h-10 rounded-2xl items-center justify-center mb-3"><Users size={18} color="#2563EB" /></View>
              <Text className="text-2xl font-black text-slate-900">{courses.reduce((acc, curr) => acc + (curr.students_enrolled || curr.enrollment_count || 0), 0)}</Text>
              <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TOTAL STUDENTS</Text>
            </View>
            <View className="w-[48%] bg-white p-5 rounded-[32px] shadow-sm border border-slate-50">
              <View className="bg-purple-50 w-10 h-10 rounded-2xl items-center justify-center mb-3"><BookOpen size={18} color="#7C3AED" /></View>
              <Text className="text-2xl font-black text-slate-900">{courses.length}</Text>
              <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ACTIVE TRACKS</Text>
            </View>
          </View>
          {isLoading ? (
            <View className="py-20 items-center justify-center"><ActivityIndicator size="large" color="#2563EB" /><Text className="text-slate-400 font-bold mt-4">Syncing Curriculum...</Text></View>
          ) : (
            <View>
              {courses.map((course, index) => {
                const courseId = course?.id || course?._id;
                const studentCount = course?.students_enrolled || course?.enrollment_count || 0;
                const moduleCount = course?.modules?.length || 0;
                return (
                  <View key={courseId || index} className="bg-white rounded-[40px] overflow-hidden mb-8 shadow-sm border border-slate-50">
                    <View className="h-56 relative">
                      <Image source={{ uri: course?.thumbnail || `https://picsum.photos/seed/${courseId}/800/400` }} className="w-full h-full" />
                      <View className="absolute inset-0 bg-black/20" />
                      <View className="absolute top-6 left-6 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30">
                        <Text className="text-[9px] font-bold text-white uppercase tracking-wider">{course?.level || "Beginner"}</Text>
                      </View>
                      <View className="absolute bottom-6 left-6 right-6">
                        <Text className="text-2xl font-black text-white" numberOfLines={2}>{course?.title}</Text>
                      </View>
                    </View>
                    <View className="p-8">
                      <View className="flex-row items-center justify-between mb-8">
                        <View className="flex-row items-center">
                          <View className="w-10 h-10 rounded-2xl bg-blue-50 items-center justify-center mr-3"><Users size={16} color="#2563EB" /></View>
                          <View>
                            <Text className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">STUDENTS</Text>
                            <Text className="text-sm font-black text-slate-900">{studentCount}</Text>
                          </View>
                        </View>
                        <View className="flex-row items-center">
                          <View className="w-10 h-10 rounded-2xl bg-purple-50 items-center justify-center mr-3"><BookOpen size={16} color="#7C3AED" /></View>
                          <View>
                            <Text className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">MODULES</Text>
                            <Text className="text-sm font-black text-slate-900">{moduleCount}</Text>
                          </View>
                        </View>
                        <View className="flex-row items-center">
                          <View className="w-10 h-10 rounded-2xl bg-orange-50 items-center justify-center mr-3"><PlayCircle size={16} color="#EA580C" /></View>
                          <View>
                            <Text className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">LESSONS</Text>
                            <Text className="text-sm font-black text-slate-900">{course?.lesson_count || 0}</Text>
                          </View>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-3">
                        <TouchableOpacity onPress={() => navigation.navigate("TeacherManageLessons", { courseId, courseTitle: course?.title })} className="flex-1 bg-slate-900 rounded-[24px] py-4 items-center flex-row justify-center shadow-lg shadow-slate-200">
                          <Text className="text-white font-black text-xs uppercase tracking-widest mr-2">Manage</Text>
                          <ArrowRight size={14} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity className="w-14 h-14 bg-slate-50 rounded-[24px] items-center justify-center border border-slate-100">
                           <PlayCircle size={20} color="#64748B" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
              {courses.length === 0 && (
                <View className="py-20 items-center justify-center bg-white rounded-[40px] border border-dashed border-slate-200">
                  <BookOpen size={48} color="#E2E8F0" />
                  <Text className="text-slate-400 font-bold mt-4">No active curriculum found</Text>
                </View>
              )}
            </View>
          )}
          <TouchableOpacity className="mt-6 border-2 border-dashed border-slate-200 rounded-[32px] py-6 items-center">
            <Text className="text-slate-400 font-black text-sm uppercase tracking-widest">Request New Track Assignment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
