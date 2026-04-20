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
  Image
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
  HelpCircle
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
  const horizontalPadding = isTablet ? 30 : 24;
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

    // If it's already an embed link (from any source), we keep it but ensure inline params are present
    if (raw.includes("/embed/")) {
        try {
            const url = new URL(raw);
            url.searchParams.set("rel", "0");
            url.searchParams.set("modestbranding", "1");
            url.searchParams.set("playsinline", "1");
            url.searchParams.set("enablejsapi", "1");
            return url.toString();
        } catch (e) {
            // Fallback for malformed URLs that still contain /embed/
            const separator = raw.includes("?") ? "&" : "?";
            return `${raw}${separator}rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
        }
    }
    
    // Convert standard YouTube links to nocookie embed
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

  if (isLoading) return <SafeAreaWrapper><AppHeader showBack /><Skeleton height={250} /><View className="p-6"><Skeleton height={30} width="60%" className="mb-4"/><Skeleton height={150}/></View></SafeAreaWrapper>;

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader showBack role={user?.role} subtitle="Active Lesson" />
      
      <ScrollView className="bg-[#F8FAFC]" showsVerticalScrollIndicator={false}>
        {/* Premium Video Player Container */}
        <View className="px-5 pt-4 pb-6">
            <View className="bg-slate-900 rounded-[40px] overflow-hidden aspect-video shadow-2xl shadow-slate-900/40 relative">
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
                        />
                    )
                ) : (
                    <View className="flex-1 justify-center items-center">
                        <Play size={48} color="white" fill="rgba(255,255,255,0.2)" />
                        <Text className="text-white/40 text-[10px] font-black uppercase tracking-[3px] mt-4">Video Processing</Text>
                    </View>
                )}
                
                {/* Custom Overlay Decorations */}
                <View className="absolute top-4 right-4 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                    <Text className="text-white text-[10px] font-black">1080p HD</Text>
                </View>
                
                <View className="absolute bottom-4 left-0 right-0 px-6 flex-row items-center justify-between pointer-events-none">
                   <View className="flex-row items-center gap-4">
                       <Play size={18} color="white" fill="white" />
                       <Volume2 size={18} color="white" />
                       <Text className="text-white/80 text-[11px] font-bold">04:12 / 12:45</Text>
                   </View>
                   <View className="flex-row items-center gap-4">
                       <Settings size={18} color="white" />
                       <Maximize2 size={18} color="white" />
                   </View>
                </View>
            </View>
        </View>

        <View className="px-6">
            {/* Badges & Title */}
            <View className="flex-row items-center gap-2 mb-4">
                <View className="bg-blue-600/10 px-4 py-1.5 rounded-full border border-blue-600/5">
                    <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Lesson {currentLessonIndex + 1}</Text>
                </View>
                {lesson?.is_free_preview && (
                    <View className="bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/5 flex-row items-center">
                        <CheckCircle size={10} color={COLORS.success} className="mr-2" />
                        <Text className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">Free Preview</Text>
                    </View>
                )}
            </View>

            <Text className="text-3xl font-black text-slate-900 leading-[40px] mb-4">{activeTitle}</Text>
            <Text className="text-slate-500 text-[15px] leading-7 mb-8">{activeDescription.substring(0, 150)}...</Text>

            {/* Module Progress Card */}
            <View className="bg-white p-7 rounded-[40px] border border-slate-100 shadow-sm mb-6">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-slate-900 font-black text-base">Module Progress</Text>
                    <Text className="text-blue-600 font-black text-lg">{moduleProgress ? (moduleProgress as any).percent : 0}%</Text>
                </View>
                <View className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                    <View className="h-full bg-blue-600 rounded-full" style={{ width: `${moduleProgress ? (moduleProgress as any).percent : 0}%` }} />
                </View>
                <Text className="text-slate-400 text-xs font-bold">
                    {moduleProgress ? (moduleProgress as any).count : 0} of {moduleProgress ? (moduleProgress as any).total : 0} lessons completed
                </Text>
            </View>

            {/* Mark as Complete Button */}
            <TouchableOpacity 
                onPress={toggleComplete}
                disabled={isSyncing}
                activeOpacity={0.8}
                className={`py-5 rounded-3xl items-center shadow-xl mb-10 shadow-blue-900/20 ${completed ? 'bg-emerald-500' : 'bg-blue-600'}`}
            >
                {isSyncing ? (
                    <ActivityIndicator color="white" size="small" />
                ) : (
                    <View className="flex-row items-center">
                        {completed && <CheckCircle size={20} color="white" className="mr-2" />}
                        <Text className="text-white font-black text-base uppercase tracking-widest">
                            {completed ? "Completed" : "Mark as Complete"}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Accordion: About this Lesson */}
            <View className="bg-slate-50 rounded-[44px] overflow-hidden mb-12 border border-slate-100">
                <TouchableOpacity 
                    onPress={() => setIsAboutExpanded(!isAboutExpanded)}
                    className="p-7 flex-row justify-between items-center"
                >
                    <Text className="text-xl font-black text-slate-900">About this Lesson</Text>
                    {isAboutExpanded ? <ChevronUp size={24} color={COLORS.slate900} /> : <ChevronDown size={24} color={COLORS.slate900} />}
                </TouchableOpacity>
                
                {isAboutExpanded && (
                    <View className="px-7 pb-8">
                        <Text className="text-slate-500 leading-7 mb-8">{activeDescription}</Text>
                        
                        <View className="gap-5 mb-8">
                            {["Core technical foundations", "Practical implementation guides", "Optimized workflow patterns"].map((dot, i) => (
                                <View key={i} className="flex-row items-start gap-4">
                                    <View className="mt-1.5"><CheckCircle size={16} color={COLORS.primary} /></View>
                                    <Text className="text-slate-700 font-bold text-[15px]">{dot}</Text>
                                </View>
                            ))}
                        </View>

                        <View className="flex-row gap-3">
                            <View className="flex-1 bg-white p-5 rounded-3xl border border-slate-100 items-center">
                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Duration</Text>
                                <Text className="text-slate-900 font-black text-sm">{lesson?.duration || "12m 45s"}</Text>
                            </View>
                            <View className="flex-1 bg-white p-5 rounded-3xl border border-slate-100 items-center">
                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Difficulty</Text>
                                <Text className="text-slate-900 font-black text-sm">{lesson?.difficulty || "Intermediate"}</Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </View>
      </ScrollView>

      {/* Ask Doubt Floating Button */}
      <TouchableOpacity 
        onPress={() => {
            setDoubtTitle(`Doubt in: ${activeTitle}`);
            setDoubtModalVisible(true);
        }}
        className="absolute bottom-24 right-6 w-14 h-14 bg-blue-600 rounded-2xl items-center justify-center shadow-2xl shadow-blue-900/50"
      >
        <HelpCircle size={28} color="white" />
      </TouchableOpacity>

      {/* Prev/Next Navigation */}
      <View className="border-t border-slate-100 bg-white py-4 px-6 flex-row justify-between items-center">
          <TouchableOpacity onPress={() => goToLesson(currentLessonIndex - 1)} disabled={!canGoPrev}>
             <View className="flex-row items-center">
                <ChevronLeft size={20} color={canGoPrev ? COLORS.slate400 : COLORS.slate200} />
                <Text className={`${canGoPrev ? "text-slate-400" : "text-slate-200"} font-bold ml-2 uppercase text-[11px] tracking-widest`}>Previous Lesson</Text>
             </View>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => goToLesson(currentLessonIndex + 1)} disabled={!canGoNext}>
             <View className="flex-row items-center">
                <Text className={`${canGoNext ? "text-blue-600" : "text-slate-200"} font-black mr-2 uppercase text-[11px] tracking-widest`}>
                    {nextLesson ? `Next: ${nextLesson.title.substring(0, 10)}` : "Next Lesson"}
                </Text>
                <ChevronRight size={20} color={canGoNext ? COLORS.primary : COLORS.slate200} />
             </View>
          </TouchableOpacity>
      </View>

      {/* Doubt Modal */}
      <Modal visible={doubtModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-slate-900/60 justify-end">
          <View className="bg-white rounded-t-[44px] p-8 shadow-2xl">
            <View className="flex-row justify-between items-center mb-8">
              <View>
                  <Text className="text-2xl font-black text-slate-900">Ask Doubt</Text>
                  <Text className="text-slate-400 text-xs font-bold mt-1">Our instructors typically reply within 24h</Text>
              </View>
              <TouchableOpacity onPress={() => setDoubtModalVisible(false)} className="bg-slate-100 p-2 rounded-full">
                  <ChevronDown size={20} color={COLORS.slate600} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} className="mb-6">
              <Input placeholder="What is your question about?" value={doubtTitle} onChangeText={setDoubtTitle} className="mb-4" />
              <Input placeholder="Describe your issue in detail..." value={doubtDescription} onChangeText={setDoubtDescription} multiline numberOfLines={6} className="mb-6" />
              {doubtError && <Text className="text-red-500 text-xs font-bold mb-4">{doubtError}</Text>}
              <Button title="Submit Question" onPress={submitDoubt} isLoading={isSubmittingDoubt} className="py-5" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
