import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, useWindowDimensions, Alert } from "react-native";
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
  MessageSquare
} from "lucide-react-native";
import { COLORS, UPLOADS_URL } from "../../utils/theme";
import { Skeleton } from "../../components/Skeleton";
import { Button } from "../../components/Button";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
import { useAuth } from "../../context/AuthContext";
import { calculateProgress, getProgressString } from "../../utils/progress";
import { AppHeader } from "../../components/AppHeader";

export default function CourseDetailScreen({ route, navigation }: any) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 30 : 24;
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

  const fetchCourseDetail = async () => {
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
  };

  useEffect(() => { if (idOrSlug) fetchCourseDetail(); }, [idOrSlug]);

  const curriculumModules = useMemo(() => {
    const modules = Array.isArray(course?.modules) ? course.modules : [];
    const lessonsFromState = Array.isArray(courseLessons) ? courseLessons : [];
    
    return modules.map((mod: any) => {
      const modId = String(mod?.id || mod?._id || "");
      
      // If we have lessons from the courseLessons state, use those
      const lessonsForThisModule = lessonsFromState.filter(
        (l: any) => String(l?.module_id || "") === modId
      );
      
      // Fallback: If state lessons are empty, use embedded lessons if they exist
      const finalLessons = lessonsForThisModule.length > 0 
        ? lessonsForThisModule 
        : (Array.isArray(mod.lessons) ? mod.lessons : []);
        
      return {
        ...mod,
        lessons: finalLessons
      };
    });
  }, [course, courseLessons]);

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

  if (isLoading) return <SafeAreaWrapper><Skeleton height={250} /><View className="p-6"><Skeleton height={30} width="80%" className="mb-4" /><Skeleton height={100} /></View></SafeAreaWrapper>;

  const imageUrl = course?.thumbnail && course.thumbnail !== "no-course-photo.jpg" 
    ? course.thumbnail.startsWith("http") ? course.thumbnail : `${UPLOADS_URL}/${course.thumbnail}` 
    : null;

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader showBack role={user?.role} subtitle="Course Overview" />
      <ScrollView className="bg-[#F8FAFC]">
        {/* Dark Hero Card */}
        <View className="px-5 pt-5 pb-8">
            <LinearGradient
                colors={['#0F172A', '#1E293B']}
                className="rounded-[44px] overflow-hidden p-8 shadow-2xl shadow-slate-900/40"
            >
                {imageUrl && <Image source={{ uri: imageUrl }} className="absolute inset-0 opacity-20" resizeMode="cover" />}
                <View className="flex-row items-center gap-2 mb-6">
                    <View className="bg-blue-600 px-3 py-1.5 rounded-xl"><Text className="text-white text-[10px] font-black uppercase tracking-widest">{course?.category || "Design"}</Text></View>
                    <View className="bg-slate-700/50 px-3 py-1.5 rounded-xl border border-white/10"><Text className="text-white/80 text-[10px] font-black uppercase tracking-widest">{course?.level || "Advanced"}</Text></View>
                    <View className="bg-slate-700/50 px-3 py-1.5 rounded-xl border border-white/10"><Text className="text-white/80 text-[10px] font-black uppercase tracking-widest">{course?.duration || "10 Weeks"}</Text></View>
                </View>

                <Text className="text-4xl font-black text-white leading-[46px] mb-6">{course?.title}</Text>
                
                <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center border-2 border-white/20">
                        <User size={20} color="white" />
                    </View>
                    <View className="ml-3">
                        <Text className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Instructor</Text>
                        <Text className="text-white font-black text-sm">{(course as any)?.profiles?.name || "Alex Thorne"}</Text>
                    </View>
                </View>
            </LinearGradient>
        </View>

        <View className="px-6">
            {/* About Section */}
            <Text className="text-[22px] font-black text-slate-900 mb-4">About this course</Text>
            <Text className="text-slate-500 text-[15px] leading-7 mb-10">
                {course?.description || "Elevate your career with our comprehensive mastery program. This isn't just a course; it's a deep dive into the psychological and technical foundations of world-class product standards."}
            </Text>

            {/* Progress Card */}
            {isEnrolled && (
                <View className="bg-white p-7 rounded-[40px] border border-slate-100 shadow-sm mb-12">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-slate-900 font-black text-base">Your Progress</Text>
                        <Text className="text-blue-600 font-black text-2xl">{currentProgressPercent}%</Text>
                    </View>
                    <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                        <View className="h-full bg-blue-600 rounded-full" style={{ width: `${currentProgressPercent}%` }} />
                    </View>
                    <Text className="text-slate-400 text-xs font-bold">{completedCount} of {totalLessons} lessons completed</Text>
                </View>
            )}

            {/* Curriculum */}
            <Text className="text-[22px] font-black text-slate-900 mb-6">Course Content</Text>
            <View className="gap-4 mb-12">
                {curriculumModules.map((mod: any, idx: number) => {
                    const modId = String(mod?.id || mod?._id || idx);
                    const isExpanded = expandedModules.has(modId);
                    return (
                        <View key={modId} className="bg-white rounded-[34px] border border-slate-100 overflow-hidden shadow-sm">
                            <TouchableOpacity 
                                onPress={() => toggleModule(modId)}
                                className="p-6 flex-row items-center"
                                activeOpacity={0.7}
                            >
                                <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center mr-4">
                                    <Text className="text-blue-600 font-black text-lg">{idx + 1}</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest mb-1">Module {idx + 1}</Text>
                                    <Text className="text-slate-900 font-black text-base leading-5" numberOfLines={1}>{mod.title}</Text>
                                </View>
                                <View className="flex-row items-center gap-3">
                                    <Text className="text-slate-400 text-[10px] font-bold uppercase">{mod.lessons?.length || 0} lessons</Text>
                                    {isEnrolled ? (
                                        <ChevronDown size={20} color={COLORS.slate400} />
                                    ) : (
                                        <Lock size={18} color={COLORS.slate300} />
                                    )}
                                </View>
                            </TouchableOpacity>

                            {isExpanded && isEnrolled && (
                                <View className="px-6 pb-6 pt-2 border-t border-slate-50">
                                    {mod.lessons?.map((lesson: any, lIdx: number) => {
                                        const isDone = Array.isArray(enrollmentItem?.completed_lessons) && enrollmentItem.completed_lessons.includes(String(lesson.id || lesson._id));
                                        return (
                                            <TouchableOpacity 
                                                key={lesson.id || lIdx}
                                                onPress={() => navigation.navigate("Lesson", { lesson, courseId: course.id, courseTitle: course.title })}
                                                className="flex-row items-center py-4 rounded-2xl bg-slate-50 px-4 mb-2"
                                            >
                                                {isDone ? (
                                                    <View className="bg-emerald-100 p-1 rounded-full mr-3"><CheckCircle size={14} color="#059669" /></View>
                                                ) : (
                                                    <PlayCircle size={18} color={COLORS.primary} className="mr-3" />
                                                )}
                                                <Text className={`flex-1 text-sm font-bold ${isDone ? 'text-emerald-700' : 'text-slate-700'}`}>{lesson.title}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    );
                })}
            </View>

            {/* Pricing Section */}
            <View className="bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm mb-12">
                <Text className="text-slate-400 text-xs font-black uppercase tracking-[3px] mb-2">Lifetime Access</Text>
                <View className="flex-row items-end gap-3 mb-8">
                    <Text className="text-[44px] font-black text-slate-900 leading-[44px] tracking-tighter">₹{course?.price || 1999}</Text>
                    <Text className="text-xl font-bold text-slate-300 line-through mb-1">₹{Math.floor((course?.price || 1999) * 1.5)}</Text>
                </View>

                <View className="gap-5 mb-10">
                    {[
                        { icon: CheckCircle, text: "Industry Recognized Certificate", color: "#2563EB" },
                        { icon: Zap, text: "Lifetime Updates & Access", color: "#2563EB" },
                        { icon: MessageSquare, text: "Private Student Community", color: "#2563EB" }
                    ].map((item, i) => (
                        <View key={i} className="flex-row items-center gap-4">
                            <item.icon size={20} color={item.color} />
                            <Text className="text-slate-600 font-bold text-[15px]">{item.text}</Text>
                        </View>
                    ))}
                </View>

                {isEnrolled ? (
                    <Button 
                        title="Continue Learning" 
                        className="py-5" 
                        onPress={() => navigation.navigate("Courses")}
                    />
                ) : (
                    <View className="gap-3">
                        <Button 
                             title={enrollmentRequested ? "Request Pending" : "Request Enrollment"} 
                             disabled={enrollmentRequested}
                             className="py-5" 
                             onPress={handleEnroll} 
                        />
                        <TouchableOpacity className="py-5 bg-white border border-blue-600 rounded-[28px] items-center flex-row justify-center">
                            <PlayCircle size={20} color={COLORS.primary} className="mr-2" />
                            <Text className="text-blue-600 font-black text-[15px] uppercase tracking-widest">Watch Intro Video</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Quote */}
            <View className="bg-slate-100/50 p-10 rounded-[44px] mb-12 border border-slate-100">
                <Text className="text-slate-600 font-bold italic text-center text-sm leading-6 mb-4">
                    "This course completely redefined how I approach product architecture and engineering leadership."
                </Text>
                <Text className="text-slate-400 text-[10px] font-black text-center uppercase tracking-widest">
                    — SARAH J., SENIOR ENGINEER @ FLOW
                </Text>
            </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

