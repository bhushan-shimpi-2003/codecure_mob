import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, ScrollView, TouchableOpacity, Image, useWindowDimensions, Alert, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { coursesApi, enrollmentsApi, lessonsApi } from "../../api/endpoints";
import { 
  PlayCircle,
  Lock,
  ChevronRight,
  ChevronDown,
  BookOpen, 
  Star,
  CheckCircle2,
  User,
  Clock,
  CheckCircle,
  Award,
  Zap,
  MessageSquare,
  Sparkles,
  ChevronUp,
  Shield,
  Trophy,
  Users,
  Layout,
  ArrowRight,
  Play
} from "lucide-react-native";
import { COLORS, UPLOADS_URL } from "../../utils/theme";
import { Skeleton } from "../../components/Skeleton";
import { Button } from "../../components/Button";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
import { useAuth } from "../../context/AuthContext";
import { calculateProgress, getProgressString, parseCompletedLessons } from "../../utils/progress";
import { AppHeader } from "../../components/AppHeader";

export default function CourseDetailScreen({ route, navigation }: any) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const idOrSlug = route?.params?.idOrSlug || route?.params?.slug;
  const [course, setCourse] = useState<any>(null);
  const [courseLessons, setCourseLessons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(Boolean(route?.params?.isEnrolled));
  const [enrollmentItem, setEnrollmentItem] = useState<any>(null);
  const [enrollmentRequested, setEnrollmentRequested] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const isStudent = user?.role === "student";

  const normalize = (value: any) => String(value || "").trim().toLowerCase();

  const matchesCourseRef = (courseRef: any, targetCourse: any, targetIdOrSlug: any) => {
    const targetId = normalize(targetCourse?.id || targetCourse?._id);
    const targetSlug = normalize(targetCourse?.slug || targetIdOrSlug);
    const refId = normalize(courseRef?.id || courseRef?._id || courseRef?.course_id);
    const refSlug = normalize(courseRef?.slug);
    if (targetId && refId && targetId === refId) return true;
    if (targetSlug && refSlug && targetSlug === refSlug) return true;
    return false;
  };

  const fetchCourseDetail = useCallback(async () => {
    try {
      const res = await coursesApi.detail(String(idOrSlug));
      const payload = res.data;
      if (isApiSuccess(payload)) {
        const data = extractApiData<any>(payload, null);
        setCourse(data);
        const courseId = data?.id || data?._id;
        if (courseId) {
          try {
            const lessonsRes = await lessonsApi.byCourse(String(courseId));
            if (isApiSuccess(lessonsRes.data)) {
              setCourseLessons(extractApiData<any[]>(lessonsRes.data, []));
            }
          } catch (e) {}
        }
        if (isStudent && data) {
          const [enrollmentsRes, requestsRes] = await Promise.allSettled([
            enrollmentsApi.myEnrollments(),
            enrollmentsApi.myRequests(),
          ]);
          if (enrollmentsRes.status === "fulfilled" && isApiSuccess(enrollmentsRes.value.data)) {
            const list = extractApiData<any[]>(enrollmentsRes.value.data, []);
            const matched = list.find(item => matchesCourseRef(item?.courses || item?.course || {id: item?.course_id}, data, idOrSlug));
            if (matched) {
                const status = normalize(matched?.student_status || matched?.status);
                setIsEnrolled(status === "active" || status === "approved");
                setEnrollmentItem(matched);
            }
          }
          if (requestsRes.status === "fulfilled" && isApiSuccess(requestsRes.value.data)) {
            const list = extractApiData<any[]>(requestsRes.value.data, []);
            setEnrollmentRequested(list.some(item => {
                const status = normalize(item?.status);
                return (status === "pending" || status === "approved") && matchesCourseRef(item?.courses || item?.course || {id: item?.course_id}, data, idOrSlug);
            }));
          }
        }
      }
    } catch (e) {} finally { setIsLoading(false); }
  }, [idOrSlug, isStudent]);

  useFocusEffect(
    useCallback(() => {
        if (idOrSlug) fetchCourseDetail();
    }, [idOrSlug, fetchCourseDetail])
  );

  const curriculumModules = useMemo(() => {
    const modules = Array.isArray(course?.modules) ? course.modules : [];
    const lessonsFromState = Array.isArray(courseLessons) ? courseLessons : [];
    
    return modules.map((mod: any) => {
      const modId = String(mod?.id || mod?._id || "");
      const lessonsForThisModule = lessonsFromState.filter(
        (l: any) => String(l?.module_id || "") === modId
      );
      const finalLessons = lessonsForThisModule.length > 0 
        ? lessonsForThisModule 
        : (Array.isArray(mod.lessons) ? mod.lessons : []);
        
      return {
        ...mod,
        lessons: finalLessons
      };
    });
  }, [course, courseLessons]);

  useEffect(() => {
    if (isEnrolled && curriculumModules.length > 0 && expandedModules.size === 0) {
      const firstModId = String(curriculumModules[0]?.id || curriculumModules[0]?._id || "0");
      setExpandedModules(new Set([firstModId]));
    }
  }, [isEnrolled, curriculumModules]);

  const toggleModule = (id: string) => {
    const next = new Set(expandedModules);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedModules(next);
  };

  const handleEnroll = async () => {
    if (!isStudent) return;
    try {
      setIsLoading(true);
      const res = await enrollmentsApi.request(course?.id || course?._id);
      if (isApiSuccess(res.data)) {
         setEnrollmentRequested(true);
         Alert.alert("Success", "Enrollment request submitted!");
      }
    } catch (e) {} finally { setIsLoading(false); }
  };

  const currentProgressPercent = useMemo(() => calculateProgress(enrollmentItem), [enrollmentItem]);
  const completedCount = useMemo(() => Array.isArray(enrollmentItem?.completed_lessons) ? enrollmentItem.completed_lessons.length : 0, [enrollmentItem]);
  const totalLessons = useMemo(() => courseLessons.length || (curriculumModules.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0)), [courseLessons, curriculumModules]);

  if (isLoading) return <SafeAreaWrapper bgWhite><AppHeader navigation={navigation} showBack /><View className="p-10"><Skeleton height={320} className="rounded-[56px] mb-10"/><Skeleton height={40} width="80%" className="mb-6"/><Skeleton height={200} className="rounded-[40px]"/></View></SafeAreaWrapper>;

  const imageUrl = course?.thumbnail && course.thumbnail !== "no-course-photo.jpg" 
    ? course.thumbnail.startsWith("http") ? course.thumbnail : `${UPLOADS_URL}/${course.thumbnail}` 
    : null;

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} showBack role={user?.role} />
      <ScrollView className="bg-[#F8FAFC]" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Cinematic Header Section */}
        <View className="px-5 pt-8 pb-12">
            <LinearGradient
                colors={['#1E293B', '#0F172A']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                className="rounded-[56px] overflow-hidden p-10 shadow-2xl shadow-slate-900/30 min-h-[440px] relative"
            >
                {imageUrl && <Image source={{ uri: imageUrl }} className="absolute inset-0 opacity-10" resizeMode="cover" />}
                
                <View className="flex-row items-center gap-3 mb-10">
                    <View className="bg-blue-600 px-4 py-2 rounded-2xl shadow-lg shadow-blue-200">
                        <Text className="text-white text-[10px] font-black uppercase tracking-widest">{course?.category || "Mastery"}</Text>
                    </View>
                    <View className="bg-white/5 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-md">
                        <Text className="text-white text-[10px] font-black uppercase tracking-widest">{course?.level || "L4 Advanced"}</Text>
                    </View>
                </View>

                <Text className="text-[44px] font-black text-white leading-[50px] tracking-tight mb-8">{course?.title}</Text>
                
                <View className="flex-row items-center justify-between mt-auto">
                    <View className="flex-row items-center gap-4">
                        <View className="w-14 h-14 rounded-[20px] bg-white/10 items-center justify-center border border-white/10">
                            <User size={28} color="white" />
                        </View>
                        <View>
                            <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest">Architect</Text>
                            <Text className="text-white font-black text-lg">{(course as any)?.profiles?.name || "Expert Mentor"}</Text>
                        </View>
                    </View>
                    
                    {isEnrolled && (
                        <TouchableOpacity 
                            onPress={() => {
                                const firstLesson = curriculumModules[0]?.lessons?.[0];
                                if (firstLesson) navigation.navigate("Lesson", { lesson: firstLesson, courseId: course.id, courseTitle: course.title });
                            }}
                            activeOpacity={0.9}
                            className="bg-white px-8 py-5 rounded-[24px] shadow-2xl shadow-blue-900/40"
                        >
                            <View className="flex-row items-center gap-3">
                                {currentProgressPercent === 100 ? <Trophy size={18} color="#0F172A" /> : <Play size={18} color="#0F172A" fill="#0F172A" />}
                                <Text className="text-slate-900 font-black text-xs uppercase tracking-widest">{currentProgressPercent === 100 ? "Review" : "Continue"}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>
        </View>

        <View className="px-8">
            {/* Core Statistics Ribbon */}
            <View className="flex-row justify-between mb-16">
               {[
                  { label: "Lessons", value: totalLessons, icon: BookOpen },
                  { label: "Rating", value: "4.9", icon: Star },
                  { label: "Enrolled", value: "2.4k", icon: Users }
               ].map((stat, i) => (
                  <View key={i} className="items-center">
                     <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-50 shadow-sm mb-3">
                        <stat.icon size={20} color="#64748B" />
                     </View>
                     <Text className="text-slate-900 font-black text-lg tracking-tight">{stat.value}</Text>
                     <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{stat.label}</Text>
                  </View>
               ))}
            </View>

            {/* Curriculum Intel Section */}
            <View className="mb-16">
               <View className="flex-row items-center gap-2 mb-4">
                  <View className="bg-blue-100 px-3 py-1 rounded-full">
                     <Text className="text-blue-700 text-[10px] font-black uppercase tracking-widest">Course Overview</Text>
                  </View>
                  <Sparkles size={14} color="#3B82F6" />
               </View>
               <Text className="text-[34px] font-black text-slate-900 leading-[40px] tracking-tight mb-6">Master the craft.</Text>
               <Text className="text-slate-400 font-bold text-base leading-8">
                  {course?.description || "Elevate your technical depth with our comprehensive mastery program. This isn't just a course; it's a deep dive into the industry-standard patterns used by world-class engineering teams."}
               </Text>
            </View>

            {/* Interactive Syllabus */}
            <View className="mb-16">
               <View className="flex-row items-center justify-between mb-10 px-2">
                  <View>
                     <Text className="text-2xl font-black text-slate-900 tracking-tight">Curriculum Path</Text>
                     <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Structured Learning Modules</Text>
                  </View>
                  <Layout size={20} color="#94A3B8" />
               </View>
               
               <View className="gap-6">
                {curriculumModules.map((mod: any, idx: number) => {
                    const modId = String(mod?.id || mod?._id || idx);
                    const isExpanded = expandedModules.has(modId);
                    return (
                        <View key={modId} className="bg-white rounded-[44px] border border-white shadow-2xl shadow-slate-900/[0.03] overflow-hidden">
                            <TouchableOpacity 
                                onPress={() => isEnrolled && toggleModule(modId)}
                                className="p-8 flex-row items-center"
                                activeOpacity={0.8}
                            >
                                <View className="w-14 h-14 bg-slate-50 rounded-[20px] items-center justify-center mr-6 border border-slate-50">
                                    <Text className="text-slate-900 font-black text-xl">{idx + 1}</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest mb-1">Module {idx + 1}</Text>
                                    <Text className="text-slate-900 font-black text-lg tracking-tight leading-6" numberOfLines={2}>{mod.title}</Text>
                                </View>
                                <View className="ml-4 items-center">
                                    {isEnrolled ? (
                                        <View className="bg-slate-50 w-10 h-10 rounded-xl items-center justify-center">
                                           {isExpanded ? <ChevronUp size={20} color="#0F172A" /> : <ChevronDown size={20} color="#0F172A" />}
                                        </View>
                                    ) : (
                                        <Lock size={20} color="#E2E8F0" />
                                    )}
                                </View>
                            </TouchableOpacity>

                            {isExpanded && isEnrolled && (
                                <View className="px-8 pb-8 pt-2 border-t border-slate-50 bg-slate-50/30">
                                    {mod.lessons?.map((lesson: any, lIdx: number) => {
                                        const completed = parseCompletedLessons(enrollmentItem?.completed_lessons);
                                        const lessonId = String(lesson.id || lesson._id || "");
                                        const isDone = completed.some(id => String(id) === lessonId);
                                        
                                        return (
                                            <TouchableOpacity 
                                                key={lesson.id || lIdx}
                                                onPress={() => navigation.navigate("Lesson", { lesson, courseId: course.id, courseTitle: course.title })}
                                                className="flex-row items-center py-5 bg-white rounded-3xl px-6 mb-3 border border-white shadow-sm"
                                            >
                                                <View className={`w-8 h-8 rounded-full items-center justify-center mr-4 ${isDone ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                                                   {isDone ? <CheckCircle2 size={16} color="#10B981" /> : <PlayCircle size={16} color="#2563EB" />}
                                                </View>
                                                <View className="flex-1">
                                                    <Text className={`text-sm font-black tracking-tight ${isDone ? 'text-slate-400' : 'text-slate-900'}`}>{lesson.title}</Text>
                                                    <View className="flex-row items-center gap-3 mt-1">
                                                       <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lesson.duration || "12:00"}</Text>
                                                       <View className="w-1 h-1 rounded-full bg-slate-200" />
                                                       <Text className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Video Lesson</Text>
                                                    </View>
                                                </View>
                                                <ArrowRight size={14} color="#CBD5E1" />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    );
                })}
               </View>
            </View>

            {/* Pricing / Enrollment Protocol */}
            {!isEnrolled && (
                <View className="mb-16">
                    <LinearGradient
                       colors={['#2563EB', '#1E40AF']}
                       start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                       className="p-12 rounded-[56px] shadow-2xl shadow-blue-900/30"
                    >
                        <Text className="text-white/60 text-[10px] font-black uppercase tracking-[4px] mb-4">Investment protocol</Text>
                        <View className="flex-row items-end gap-3 mb-10">
                            <Text className="text-6xl font-black text-white tracking-tighter">₹{course?.price || 1999}</Text>
                            <Text className="text-xl font-bold text-white/30 line-through mb-2">₹{Math.floor((course?.price || 1999) * 1.8)}</Text>
                        </View>

                        <View className="gap-6 mb-12">
                            {[
                                { icon: Trophy, text: "Official CodeCure Certification" },
                                { icon: Zap, text: "Lifetime Curriculum Updates" },
                                { icon: Users, text: "Peer-to-Peer Review Network" }
                            ].map((item, i) => (
                                <View key={i} className="flex-row items-center gap-5">
                                    <View className="w-10 h-10 bg-white/10 rounded-2xl items-center justify-center border border-white/10">
                                       <item.icon size={20} color="white" />
                                    </View>
                                    <Text className="text-white font-black text-[15px] tracking-tight">{item.text}</Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity 
                           onPress={handleEnroll} 
                           disabled={enrollmentRequested}
                           activeOpacity={0.9}
                        >
                           <View className="bg-white py-6 rounded-[28px] items-center shadow-2xl">
                              <Text className="text-blue-600 font-black text-sm uppercase tracking-widest">
                                 {enrollmentRequested ? "Awaiting Approval" : "Request Mastery Track"}
                              </Text>
                           </View>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            )}

            {/* Social Proof Quote */}
            <View className="bg-slate-900 p-12 rounded-[56px] items-center shadow-2xl shadow-slate-900/10">
                <Text className="text-white text-3xl font-black mb-8">"</Text>
                <Text className="text-white font-black text-xl text-center leading-9 mb-10 italic tracking-tight">
                    "The curriculum depth here is unparalleled. It's the difference between being a coder and an architect."
                </Text>
                <View className="flex-row items-center gap-4">
                   <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center border border-white/10">
                      <User size={20} color="white" />
                   </View>
                   <View>
                      <Text className="text-white font-black text-sm uppercase tracking-widest">Marcus Thorne</Text>
                      <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Engineering Director @ Flow</Text>
                   </View>
                </View>
            </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
