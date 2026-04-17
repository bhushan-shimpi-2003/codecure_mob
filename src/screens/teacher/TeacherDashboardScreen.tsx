import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { coursesApi } from "../../api/endpoints";
import { 
  GraduationCap, 
  FileText, 
  HelpCircle, 
  Video,
  ChevronRight,
  BookOpenCheck,
  CirclePlay
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { Skeleton } from "../../components/Skeleton";
import { extractApiData, isApiSuccess } from "../../api/response";

export default function TeacherDashboardScreen() {
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTeacherData = async () => {
    try {
      const res = await coursesApi.teacherCourses();
      const payload = res.data;
      if (isApiSuccess(payload)) {
        const data = extractApiData<any[]>(payload, []);
        setCourses(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.log("Error loading teacher data", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const stats = [
    { label: "My Courses", value: courses.length, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Students", value: "450+", icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Assignments", value: "12", icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Doubts", value: "3", icon: HelpCircle, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <SafeAreaWrapper>
      <ScrollView 
        contentContainerStyle={{ padding: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchTeacherData();}} />}
      >
        <View className="mb-8">
          <Text className="text-sm font-black text-emerald-600 uppercase tracking-widest mb-1">Faculty Dashboard</Text>
          <Text className="text-2xl font-black text-slate-900">Education Hub</Text>
        </View>

        {/* Stats Row */}
        <View className="flex-row flex-wrap justify-between mb-8">
          {stats.map((stat, i) => (
            <View key={i} className="w-[47%] bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm mb-4">
              <View className={`${stat.bg} w-10 h-10 rounded-2xl items-center justify-center mb-3`}>
                <stat.icon size={20} className={stat.color} />
              </View>
              <Text className="text-xl font-black text-slate-900">{stat.value}</Text>
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text className="text-lg font-bold text-slate-900 mb-4">My Courses</Text>
        
        {isLoading ? (
          <Skeleton height={200} className="rounded-[32px]" />
        ) : courses.length === 0 ? (
          <View className="bg-white p-8 rounded-[32px] border border-slate-100 items-center justify-center">
            <Text className="text-slate-500 font-medium">You haven't created any courses yet.</Text>
          </View>
        ) : (
          courses.map((course) => (
            <TouchableOpacity 
              key={String(course?.id || course?._id || course?.slug)}
              className="bg-white p-5 rounded-[32px] mb-4 border border-slate-100 shadow-sm flex-row items-center"
            >
              <View className="bg-slate-100 w-16 h-16 rounded-2xl mr-4 items-center justify-center">
                <BookOpenCheck size={24} color={COLORS.primary} />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-900 text-base" numberOfLines={1}>{course.title}</Text>
                <Text className="text-xs text-slate-400 font-bold uppercase mt-1">124 Students enrolled</Text>
              </View>
              <ChevronRight size={18} color={COLORS.slate300} />
            </TouchableOpacity>
          ))
        )}

        <Text className="text-lg font-bold text-slate-900 mt-6 mb-4">Quick Actions</Text>
        <View className="flex-row gap-4">
          <TouchableOpacity className="flex-1 bg-blue-600 p-4 rounded-3xl items-center">
            <CirclePlay color="white" size={24} className="mb-1" />
            <Text className="text-white font-bold text-xs uppercase">New Lesson</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-slate-900 p-4 rounded-3xl items-center">
            <FileText color="white" size={24} className="mb-1" />
            <Text className="text-white font-bold text-xs uppercase">Assignment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
