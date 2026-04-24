import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl, useWindowDimensions, TouchableOpacity, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { enrollmentsApi, coursesApi, lessonsApi } from "../../api/endpoints";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { 
    Search, 
    BookOpen, 
    Clock, 
    PlayCircle, 
    Trophy, 
    BarChart3, 
    ChevronRight, 
    Layers, 
    Bell, 
    Plus,
    CheckCircle2,
    ArrowRight
} from "lucide-react-native";
import { Skeleton } from "../../components/Skeleton";
import { COLORS, UPLOADS_URL } from "../../utils/theme";
import { extractApiData, isApiSuccess } from "../../api/response";
import { useAuth } from "../../context/AuthContext";
import { AppHeader } from "../../components/AppHeader";
import { LinearGradient } from "expo-linear-gradient";
import { parseCompletedLessons } from "../../utils/progress";

export default function CoursesScreen({ navigation }: any) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const [activeTab, setActiveTab] = useState("in-progress");
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<any[]>([]);
  const [nextLessonsMap, setNextLessonsMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [enrollRes, recRes] = await Promise.all([
        enrollmentsApi.myEnrollments(),
        coursesApi.list()
      ]);

      if (isApiSuccess(enrollRes.data)) {
        const enrData = extractApiData<any[]>(enrollRes.data, []);
        setEnrollments(enrData);
        
        // Fetch next lesson titles for active enrollments
        const activeEnr = enrData.filter(e => (e.progress || 0) < 100);
        const lessonTitles: Record<string, string> = {};
        
        await Promise.all(activeEnr.map(async (enr) => {
            const courseId = enr.courses?.id || enr.course?.id || enr.course_id;
            if (courseId) {
                try {
                    const lRes = await lessonsApi.byCourse(courseId);
                    if (isApiSuccess(lRes.data)) {
                        const lessons = extractApiData<any[]>(lRes.data, []);
                        const completedIds = parseCompletedLessons(enr.completed_lessons).map(id => String(id));
                        const next = lessons.find(l => !completedIds.includes(String(l.id || l._id)));
                        if (next) lessonTitles[String(courseId)] = next.title;
                    }
                } catch (e) {}
            }
        }));
        setNextLessonsMap(lessonTitles);
      }

      if (isApiSuccess(recRes.data)) {
        setRecommendedCourses(extractApiData<any[]>(recRes.data, []).slice(0, 3));
      }
    } catch (e) {
      console.log("Failed to load dashboard", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
        fetchDashboardData();
    }, [fetchDashboardData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const filteredEnrollments = useMemo(() => {
    if (activeTab === "in-progress") return enrollments.filter(e => (e.progress || 0) < 100);
    if (activeTab === "completed") return enrollments.filter(e => (e.progress || 0) >= 100);
    return []; // Saved logic can be added later
  }, [enrollments, activeTab]);

  const renderActiveCard = (enr: any) => {
    const course = enr.courses || enr.course;
    const courseId = course?.id || course?._id || enr.course_id;
    const progress = enr.progress || 0;
    const nextLesson = nextLessonsMap[String(courseId)];
    const thumbnail = (typeof course?.thumbnail === 'string' && course.thumbnail !== "no-course-photo.jpg" && !course.thumbnail.includes('[object Object]'))
        ? (course.thumbnail.startsWith("http") ? course.thumbnail : `${UPLOADS_URL}/${course.thumbnail}`) 
        : null;

    return (
        <View key={enr.id} className="bg-white rounded-[48px] p-2 mb-8 shadow-2xl shadow-slate-900/[0.04] border border-slate-50">
            <View className="h-64 rounded-[40px] overflow-hidden bg-slate-50 relative">
                {thumbnail && <Image source={{ uri: thumbnail }} className="w-full h-full" resizeMode="contain" />}
                <View className="absolute top-6 left-6">
                    <View className="bg-blue-600 px-4 py-1.5 rounded-full border border-white/20">
                        <Text className="text-white text-[10px] font-black uppercase tracking-widest">{course?.level || "Advanced"}</Text>
                    </View>
                </View>
            </View>
            <View className="p-8">
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="flex-1 text-[22px] font-black text-slate-900 leading-tight mr-4">{course?.title}</Text>
                    <View className="w-14 h-14 rounded-full border-2 border-blue-600 items-center justify-center">
                        <Text className="text-blue-600 font-bold text-[13px]">{progress}%</Text>
                    </View>
                </View>
                
                <View className="mb-8">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Next Lesson</Text>
                    <Text className="text-slate-600 font-bold text-sm" numberOfLines={1}>{nextLesson || "Ready to start"}</Text>
                </View>

                <TouchableOpacity 
                    onPress={() => navigation.navigate("CourseDetail", { idOrSlug: course?.slug || courseId, isEnrolled: true })}
                    className="bg-blue-600 py-5 rounded-3xl flex-row items-center justify-center shadow-xl shadow-blue-900/30"
                >
                    <Text className="text-white font-black text-xs uppercase tracking-widest mr-3">Continue Learning</Text>
                    <ArrowRight size={16} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
  };

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} role={user?.role} subtitle="My Library" />

      <ScrollView className="flex-1 bg-[#F8FAFC]" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }}>
            

             {/* Hero Header */}
                      <View className="px-6 pt-8 mb-8">
                        <View className="bg-blue-50 px-3 py-1 rounded-lg self-start mb-4">
                          <Text className="text-blue-600 font-extrabold text-[10px] uppercase tracking-widest">Learning</Text>
                        </View>
                        <Text className="text-[34px] font-black text-slate-900 leading-tight">
                           My
                            <Text className="text-blue-600"> Courses</Text> 
                        </Text>
                        <Text className="text-slate-500 mt-4 text-[15px] leading-6 max-w-[90%]">
                            Pick up right where you left off.
                        </Text>
                      </View>

            {/* Premium Segmented Control */}
            <View className="px-6 mb-10">
                <View className="bg-slate-200/50 p-1.5 rounded-[24px] flex-row">
                    {["in-progress", "completed", "saved"].map((tab) => (
                        <TouchableOpacity 
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            className={`flex-1 py-3 rounded-[18px] items-center ${activeTab === tab ? 'bg-white shadow-sm shadow-slate-400/20' : ''}`}
                        >
                            <Text className={`capitalize font-black text-xs ${activeTab === tab ? "text-blue-600" : "text-slate-400"}`}>
                                {tab.replace("-", " ")}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Courses List */}
            <View className="px-6">
                {isLoading ? (
                    <View className="gap-8"><Skeleton height={380} className="rounded-[48px]" /><Skeleton height={380} className="rounded-[48px]" /></View>
                ) : filteredEnrollments.length > 0 ? (
                    filteredEnrollments.map(enr => renderActiveCard(enr))
                ) : (
                    <View className="items-center py-10">
                        <BookOpen size={48} color={COLORS.slate200} />
                        <Text className="text-slate-400 font-bold mt-4">No {activeTab.replace("-", " ")} courses found.</Text>
                    </View>
                )}

                {/* Browse Card */}
                <TouchableOpacity 
                    onPress={() => navigation.navigate("CoursesTab")}
                    className="bg-transparent border-2 border-slate-200 border-dashed rounded-[48px] py-12 items-center mb-12"
                >
                    <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-6">
                        <Plus size={32} color={COLORS.primary} />
                    </View>
                    <Text className="text-slate-900 font-black text-xl mb-2">Browse more courses</Text>
                    <Text className="text-slate-400 font-bold text-center px-10 mb-6">Explore our catalog to start something new today.</Text>
                    <Text className="text-blue-600 font-black text-xs uppercase tracking-widest">Explore Pathways</Text>
                </TouchableOpacity>
            </View>

            {/* Recommendations Section */}
            <View className="px-6 pb-20">
                <View className="flex-row items-center justify-between mb-8">
                    <View>
                        <Text className="text-2xl font-black text-slate-900">Recommended for You</Text>
                        <Text className="text-slate-400 font-bold text-xs mt-1">Based on your interest in Engineering</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate("CoursesTab")}><Text className="text-blue-600 font-black text-xs uppercase">View All</Text></TouchableOpacity>
                </View>

                {recommendedCourses.map((course, i) => {
                    const thumb = (typeof course?.thumbnail === 'string' && course.thumbnail !== "no-course-photo.jpg" && !course.thumbnail.includes('[object Object]'))
                        ? (course.thumbnail.startsWith("http") ? course.thumbnail : `${UPLOADS_URL}/${course.thumbnail}`) 
                        : null;
                    return (
                        <View key={course.id || i} className="bg-white rounded-[48px] p-6 mb-8 border border-slate-100 shadow-sm">
                           <View className="h-56 rounded-[34px] overflow-hidden bg-slate-100 mb-6">
                               {thumb && <Image source={{ uri: thumb }} className="w-full h-full" resizeMode="cover" />}
                           </View>
                           <View className="flex-row items-center gap-2 mb-4">
                                <View className="bg-blue-100 px-3 py-1 rounded-full"><Text className="text-blue-600 text-[10px] font-black uppercase">NEW COURSE</Text></View>
                                <View className="bg-yellow-100 px-3 py-1 rounded-full"><Text className="text-yellow-600 text-[10px] font-black uppercase">BESTSELLER</Text></View>
                           </View>
                           <Text className="text-2xl font-black text-slate-900 mb-4">{course.title}</Text>
                           <Text className="text-slate-500 text-sm leading-6 mb-8" numberOfLines={3}>{course.description || "Master the latest industry standards with our expert-led pathways."}</Text>
                           <View className="flex-row gap-3">
                               <TouchableOpacity className="flex-1 py-4 bg-slate-50 rounded-2xl items-center border border-slate-100">
                                   <Text className="text-slate-600 font-black text-xs uppercase tracking-widest">Quick Preview</Text>
                               </TouchableOpacity>
                               <TouchableOpacity 
                                    onPress={() => navigation.navigate("CourseDetail", { idOrSlug: course.slug || course.id })}
                                    className="flex-1 py-4 bg-blue-600 rounded-2xl items-center shadow-lg shadow-blue-900/30"
                                >
                                   <Text className="text-white font-black text-xs uppercase tracking-widest">Enroll Now</Text>
                               </TouchableOpacity>
                           </View>
                        </View>
                    );
                })}
            </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
