import React, { useEffect, useState, useMemo, useCallback } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  useWindowDimensions, 
  Platform, 
  Modal, 
  Alert, 
  ActivityIndicator,
  Image,
  TextInput
} from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { 
  Play, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  MessageSquare,
  Clock,
  Settings,
  Maximize2,
  Volume2,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
  Info,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Layers,
  Video,
  Paperclip,
  Send,
  MoreVertical
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { doubtsApi, lessonsApi, enrollmentsApi, coursesApi } from "../../api/endpoints";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
import { parseCompletedLessons } from "../../utils/progress";
import { Skeleton } from "../../components/Skeleton";
import { AppHeader } from "../../components/AppHeader";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../context/AuthContext";

export default function LessonScreen({ route, navigation }: any) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const { lessonId, lesson: lessonFromRoute, courseId, courseTitle, lessonTitle, videoUrl } = route.params || {};
  
  const [completed, setCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lesson, setLesson] = useState<any>(lessonFromRoute || null);
  const [allCourseLessons, setAllCourseLessons] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [isAboutExpanded, setIsAboutExpanded] = useState(true);
  
  const [doubtModalVisible, setDoubtModalVisible] = useState(false);
  const [doubtTitle, setDoubtTitle] = useState("");
  const [doubtDescription, setDoubtDescription] = useState("");
  const [isSubmittingDoubt, setIsSubmittingDoubt] = useState(false);
  const [doubtError, setDoubtError] = useState<string | null>(null);

  // Video Normalization
  const normalizeVideoUrl = (value?: string) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (raw.includes("<iframe") && raw.includes("src=")) {
      const srcMatch = raw.match(/src=["']([^"']+)["']/i);
      if (srcMatch?.[1]) return srcMatch[1].trim();
    }
    return raw;
  };

  const toEmbedVideoUrl = (value?: string) => {
    const raw = normalizeVideoUrl(value);
    if (!raw) return "";

    if (raw.includes("/embed/")) {
        try {
            const url = new URL(raw);
            url.searchParams.set("rel", "0");
            url.searchParams.set("modestbranding", "1");
            url.searchParams.set("playsinline", "1");
            url.searchParams.set("enablejsapi", "1");
            return url.toString();
        } catch (e) {
            const separator = raw.includes("?") ? "&" : "?";
            return `${raw}${separator}rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
        }
    }
    
    const youtubeMatch = raw.match(/^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?"']{11}).*/i);
    if (youtubeMatch?.[1]) {
        return `https://www.youtube-nocookie.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=http://localhost:19006`;
    }
    
    if (raw.includes("vimeo.com/") && !raw.includes("player.vimeo.com/video/")) {
      const id = raw.split("vimeo.com/")[1]?.split(/[?#/]/)[0];
      if (id) return `https://player.vimeo.com/video/${id}?badge=0&autopause=0&player_id=0&app_id=58479`;
    }
    return raw;
  };

  const buildEmbedHtml = (embedUrl: string) => {
    const safeUrl = embedUrl.replace(/"/g, "%22");
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" /><style>html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #0f172a; overflow: hidden; } .wrap { width: 100%; height: 100%; } iframe { width: 100%; height: 100%; border: 0; }</style></head><body><div class="wrap"><iframe src="${safeUrl}" title="Lesson Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen playsinline></iframe></div></body></html>`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) {
        setIsLoading(false);
        return;
      }

      try {
        const [lessonsRes, enrollmentsRes] = await Promise.all([
          lessonsApi.byCourse(String(courseId)),
          enrollmentsApi.myEnrollments()
        ]);

        if (isApiSuccess(lessonsRes.data)) {
          const data = extractApiData<any[]>(lessonsRes.data, []);
          const sorted = [...data].sort((a, b) => Number(a?.lesson_order || 0) - Number(b?.lesson_order || 0));
          setAllCourseLessons(sorted);

          const currentId = String(lessonId || lessonFromRoute?.id || lessonFromRoute?._id || "");
          let activeLesson = sorted.find(item => String(item?.id || item?._id) === currentId);
          if (activeLesson) setLesson(activeLesson);
        }

        if (isApiSuccess(enrollmentsRes.data)) {
          const enrList = extractApiData<any[]>(enrollmentsRes.data, []);
          const matched = enrList.find(e => 
            String(e.course_id) === String(courseId) || 
            String(e.course?.id || e.course?._id) === String(courseId) ||
            String(e.courses?.id || e.courses?._id) === String(courseId)
          );
          if (matched) {
            setEnrollment(matched);
            const currentId = String(lesson?.id || lesson?._id || lessonId || "");
            const parsedCompleted = parseCompletedLessons(matched.completed_lessons);
            setCompleted(parsedCompleted.includes(currentId));
          }
        }
      } catch (e) {
        console.log("Error loading lesson data", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [courseId, lessonId]);

  const toggleComplete = async () => {
    if (!enrollment || isSyncing) return;
    
    const currentId = String(lesson?.id || lesson?._id || lessonId || "");
    if (!currentId) return;

    setIsSyncing(true);
    let newCompletedList = [...parseCompletedLessons(enrollment.completed_lessons)];
    
    if (completed) {
        newCompletedList = newCompletedList.filter(id => String(id) !== currentId);
    } else {
        if (!newCompletedList.includes(currentId)) newCompletedList.push(currentId);
    }

    try {
      const enrollmentId = enrollment.id || enrollment._id;
      const tLessons = allCourseLessons.length > 0 ? allCourseLessons.length : 1;
      let newProgress = Math.round((newCompletedList.length / tLessons) * 100);
      newProgress = Math.min(100, Math.max(0, newProgress));

      const res = await enrollmentsApi.update(enrollmentId, { 
        completed_lessons: newCompletedList,
        progress: newProgress
      });
      
      if (isApiSuccess(res.data)) {
        setCompleted(!completed);
        setEnrollment({ ...enrollment, completed_lessons: newCompletedList, progress: newProgress });
      }
    } catch (e) {
      Alert.alert("Error", "Could not update progress.");
    } finally {
      setIsSyncing(false);
    }
  };

  const activeTitle = lesson?.title || lessonTitle || "Untitled Lesson";
  const activeCourseTitle = lesson?.course?.title || lesson?.courses?.title || courseTitle || "Course";
  const activeVideoUrl = normalizeVideoUrl(lesson?.video_url || lesson?.youtube_url || String(videoUrl || ""));
  const activeEmbedUrl = toEmbedVideoUrl(activeVideoUrl);
  const activeDescription = lesson?.description || lesson?.content || "In this comprehensive lesson, we dive deep into the core technical and aesthetic foundations of modern development standards.";
  
  const moduleLessons = useMemo(() => {
    if (!lesson?.module_id) return allCourseLessons;
    return allCourseLessons.filter(l => String(l.module_id) === String(lesson.module_id));
  }, [allCourseLessons, lesson?.module_id]);

  const moduleProgress = useMemo(() => {
    if (moduleLessons.length === 0) return 0;
    const completedList = parseCompletedLessons(enrollment?.completed_lessons);
    const doneCount = moduleLessons.filter(l => completedList.includes(String(l.id || l._id))).length;
    return {
        percent: Math.round((doneCount / moduleLessons.length) * 100),
        count: doneCount,
        total: moduleLessons.length
    };
  }, [moduleLessons, enrollment?.completed_lessons]);

  const currentLessonIndex = allCourseLessons.findIndex(item => String(item?.id || item?._id) === String(lesson?.id || lesson?._id || lessonId));
  const canGoPrev = currentLessonIndex > 0;
  const canGoNext = currentLessonIndex >= 0 && currentLessonIndex < allCourseLessons.length - 1;
  const nextLesson = canGoNext ? allCourseLessons[currentLessonIndex + 1] : null;

  const goToLesson = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= allCourseLessons.length) return;
    const target = allCourseLessons[targetIndex];
    navigation.replace("Lesson", {
      lessonId: target?.id || target?._id,
      lesson: target,
      courseId: courseId || target?.course_id,
      courseTitle: activeCourseTitle,
    });
  };

  const submitDoubt = async () => {
    if (!doubtTitle.trim() || !doubtDescription.trim()) {
      setDoubtError("Please fill in all fields.");
      return;
    }
    setIsSubmittingDoubt(true);
    try {
      const res = await doubtsApi.create({
        subject: doubtTitle,
        description: doubtDescription,
        course_id: String(courseId),
        lesson_id: String(lesson?.id || lesson?._id || lessonId)
      });
      if (isApiSuccess(res.data)) {
        setDoubtModalVisible(false);
        setDoubtDescription("");
        Alert.alert("Success", "Your doubt has been submitted to the instructor.");
      }
    } catch {
      setDoubtError("Failed to submit doubt.");
    } finally {
      setIsSubmittingDoubt(false);
    }
  };

  if (isLoading) return <SafeAreaWrapper bgWhite><AppHeader navigation={navigation} showBack /><View className="p-10"><Skeleton height={280} className="rounded-[48px] mb-10"/><Skeleton height={40} width="80%" className="mb-6"/><Skeleton height={150} className="rounded-[32px]"/></View></SafeAreaWrapper>;

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} showBack role={user?.role} />
      
      <ScrollView className="bg-[#F8FAFC]" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Cinematic Video Container */}
        <View className="px-5 pt-8 pb-10">
            <View className="bg-slate-900 rounded-[56px] overflow-hidden aspect-video shadow-2xl shadow-slate-900/30 relative border-8 border-slate-900">
                {activeEmbedUrl ? (
                    (Platform.OS === 'web') ? (
                        <View className="flex-1">
                            {React.createElement("iframe" as any, {
                                src: activeEmbedUrl,
                                style: { width: "100%", height: "100%", border: "0" },
                                allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
                                allowFullScreen: true,
                            } as any)}
                        </View>
                    ) : (
                        <WebView 
                            source={{ html: buildEmbedHtml(activeEmbedUrl) }} 
                            className="flex-1" 
                            allowsFullscreenVideo 
                            javaScriptEnabled 
                            scrollEnabled={false}
                        />
                    )
                ) : (
                    <View className="flex-1 justify-center items-center bg-slate-900">
                        <View className="w-20 h-20 bg-white/5 rounded-full items-center justify-center border border-white/5">
                           <Play size={40} color="white" fill="rgba(255,255,255,0.1)" />
                        </View>
                        <Text className="text-white/40 text-[10px] font-black uppercase tracking-[4px] mt-6">Ready to stream</Text>
                    </View>
                )}
                
                {/* Visual Overlays */}
                <View className="absolute top-6 right-6 flex-row gap-3">
                    <View className="bg-black/60 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-md">
                        <Text className="text-white text-[9px] font-black uppercase tracking-widest">1080p</Text>
                    </View>
                </View>

                <View className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                    <View className="h-full bg-blue-600 w-1/3 shadow-2xl shadow-blue-500" />
                </View>
            </View>
        </View>

        <View className="px-8">
            {/* Contextual Header */}
            <View className="flex-row items-center gap-2 mb-6">
                <View className="bg-blue-600 self-start px-4 py-2 rounded-2xl shadow-lg shadow-blue-200">
                    <Text className="text-white text-[10px] font-black uppercase tracking-widest">Phase {currentLessonIndex + 1}</Text>
                </View>
                {lesson?.is_free_preview && (
                    <View className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex-row items-center">
                        <Sparkles size={12} color="#3B82F6" className="mr-2" />
                        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Preview Mode</Text>
                    </View>
                )}
            </View>

            <Text className="text-[34px] font-black text-slate-900 leading-[40px] tracking-tight mb-4">{activeTitle}</Text>
            <Text className="text-slate-400 font-bold text-base leading-7 mb-10">{activeDescription.substring(0, 150)}...</Text>

            {/* Completion Terminal */}
            <TouchableOpacity 
                onPress={toggleComplete}
                disabled={isSyncing}
                activeOpacity={0.9}
                className="mb-12"
            >
                <LinearGradient
                   colors={completed ? ['#10B981', '#059669'] : ['#1E293B', '#0F172A']}
                   start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                   className="p-8 rounded-[40px] flex-row items-center justify-between shadow-2xl shadow-slate-900/20"
                >
                   <View className="flex-row items-center gap-4">
                       <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center border border-white/10">
                          {isSyncing ? <ActivityIndicator color="white" /> : (completed ? <CheckCircle2 size={28} color="white" /> : <Award size={28} color="white" />)}
                       </View>
                       <View>
                          <Text className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Status Protocol</Text>
                          <Text className="text-white text-xl font-black">{completed ? "Goal Achieved" : "Mark as Mastered"}</Text>
                       </View>
                   </View>
                   <ChevronRight size={24} color="white" />
                </LinearGradient>
            </TouchableOpacity>

            {/* Curriculum Progress */}
            <View className="bg-white p-10 rounded-[48px] border border-white shadow-2xl shadow-slate-900/[0.04] mb-12">
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                       <Text className="text-slate-900 font-black text-xl tracking-tight">Phase Mastery</Text>
                       <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Current Module</Text>
                    </View>
                    <Text className="text-blue-600 font-black text-3xl">{moduleProgress ? (moduleProgress as any).percent : 0}%</Text>
                </View>
                <View className="h-2.5 bg-slate-50 rounded-full overflow-hidden mb-4">
                    <View className="h-full bg-blue-600 rounded-full" style={{ width: `${moduleProgress ? (moduleProgress as any).percent : 0}%` }} />
                </View>
                <Text className="text-slate-400 text-xs font-bold">
                    Successfully decoded {moduleProgress ? (moduleProgress as any).count : 0} of {moduleProgress ? (moduleProgress as any).total : 0} core lessons.
                </Text>
            </View>

            {/* Curriculum Intel Accordion */}
            <View className="bg-white rounded-[48px] overflow-hidden border border-white shadow-2xl shadow-slate-900/[0.04]">
                <TouchableOpacity 
                    onPress={() => setIsAboutExpanded(!isAboutExpanded)}
                    className="p-8 flex-row justify-between items-center"
                >
                    <View className="flex-row items-center gap-4">
                       <View className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center">
                          <Info size={24} color="#0F172A" />
                       </View>
                       <Text className="text-xl font-black text-slate-900">Module Intel</Text>
                    </View>
                    {isAboutExpanded ? <ChevronUp size={20} color="#94A3B8" /> : <ChevronDown size={20} color="#94A3B8" />}
                </TouchableOpacity>
                
                {isAboutExpanded && (
                    <View className="px-10 pb-10">
                        <Text className="text-slate-500 font-bold text-base leading-7 mb-10">{activeDescription}</Text>
                        
                        <View className="gap-6 mb-10">
                            {["Industry-standard design patterns", "Performance optimization guides", "Scalable architectural blueprints"].map((dot, i) => (
                                <View key={i} className="flex-row items-start gap-5">
                                    <View className="w-6 h-6 rounded-full bg-blue-50 items-center justify-center mt-0.5">
                                       <CheckCircle size={14} color="#2563EB" />
                                    </View>
                                    <Text className="text-slate-700 font-black text-sm leading-6 flex-1">{dot}</Text>
                                </View>
                            ))}
                        </View>

                        <View className="flex-row gap-4">
                            <View className="flex-1 bg-slate-50 p-6 rounded-[32px] items-center border border-slate-100">
                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Air Time</Text>
                                <Text className="text-slate-900 font-black text-sm">{lesson?.duration || "12m 45s"}</Text>
                            </View>
                            <View className="flex-1 bg-slate-50 p-6 rounded-[32px] items-center border border-slate-100">
                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Complexity</Text>
                                <Text className="text-slate-900 font-black text-sm">{lesson?.difficulty || "L4 Advanced"}</Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </View>
      </ScrollView>

      {/* Floating Inquiry Trigger */}
      <TouchableOpacity 
        onPress={() => {
            setDoubtTitle(`Doubt in: ${activeTitle}`);
            setDoubtModalVisible(true);
        }}
        activeOpacity={0.9}
        className="absolute bottom-28 right-8 w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center shadow-2xl shadow-blue-900/40"
      >
        <MessageSquare size={28} color="white" />
      </TouchableOpacity>

      {/* Persistent Navigation Interface */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-white/95 px-8 pt-4 pb-10 flex-row justify-between items-center backdrop-blur-md">
          <TouchableOpacity onPress={() => goToLesson(currentLessonIndex - 1)} disabled={!canGoPrev}>
             <View className="flex-row items-center">
                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${canGoPrev ? "bg-slate-50" : "bg-transparent"}`}>
                   <ChevronLeft size={20} color={canGoPrev ? "#0F172A" : "#E2E8F0"} />
                </View>
                <Text className={`${canGoPrev ? "text-slate-900" : "text-slate-200"} font-black uppercase text-[10px] tracking-widest`}>Previous</Text>
             </View>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => goToLesson(currentLessonIndex + 1)} disabled={!canGoNext}>
             <View className="flex-row items-center">
                <Text className={`${canGoNext ? "text-blue-600" : "text-slate-200"} font-black mr-3 uppercase text-[10px] tracking-widest`}>
                    {nextLesson ? `Next: ${nextLesson.title.substring(0, 10)}...` : "Terminal"}
                </Text>
                <View className={`w-10 h-10 rounded-xl items-center justify-center ${canGoNext ? "bg-blue-50" : "bg-transparent"}`}>
                   <ChevronRight size={20} color={canGoNext ? "#2563EB" : "#E2E8F0"} />
                </View>
             </View>
          </TouchableOpacity>
      </View>

      {/* Support Console Modal */}
      <Modal visible={doubtModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-slate-900/60 justify-end">
          <View className="bg-white rounded-t-[56px] p-10 shadow-2xl">
            <View className="flex-row justify-between items-center mb-10">
              <View>
                  <Text className="text-3xl font-black text-slate-900 tracking-tight">Support Console</Text>
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Instructor Direct Access</Text>
              </View>
              <TouchableOpacity onPress={() => setDoubtModalVisible(false)} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center">
                  <ChevronDown size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} className="mb-8">
              <View className="mb-6">
                 <Text className="text-slate-900 font-black text-sm mb-4">Query Protocol</Text>
                 <Input 
                    placeholder="Briefly state your hurdle..." 
                    value={doubtTitle} 
                    onChangeText={setDoubtTitle} 
                    containerClassName="h-16 rounded-2xl bg-slate-50 border-0 px-6"
                    inputClassName="text-sm font-black text-slate-900"
                 />
              </View>
              <View className="mb-8">
                 <Text className="text-slate-900 font-black text-sm mb-4">Technical Details</Text>
                 <Input 
                    placeholder="Describe the logic issue in detail..." 
                    value={doubtDescription} 
                    onChangeText={setDoubtDescription} 
                    multiline 
                    numberOfLines={6} 
                    containerClassName="h-44 rounded-3xl bg-slate-50 border-0 p-6"
                    inputClassName="text-sm font-black text-slate-900 leading-6"
                 />
              </View>
              {doubtError && <Text className="text-rose-500 text-[10px] font-black uppercase tracking-widest mb-6">{doubtError}</Text>}
              
              <TouchableOpacity 
                onPress={submitDoubt}
                disabled={isSubmittingDoubt || !doubtDescription}
                activeOpacity={0.9}
              >
                <LinearGradient
                    colors={['#1E293B', '#0F172A']}
                    className="py-6 rounded-[28px] flex-row items-center justify-center gap-3"
                >
                    {isSubmittingDoubt ? <ActivityIndicator color="white" /> : (
                        <>
                           <Text className="text-white font-black text-sm uppercase tracking-widest">Dispatch Inquiry</Text>
                           <Send size={18} color="white" />
                        </>
                    )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
