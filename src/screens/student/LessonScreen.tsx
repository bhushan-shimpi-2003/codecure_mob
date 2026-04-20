import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, Platform, Modal, Alert, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { 
  Play, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  MessageSquare,
  Clock
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { doubtsApi, lessonsApi, enrollmentsApi } from "../../api/endpoints";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
import { parseCompletedLessons } from "../../utils/progress";
import { Skeleton } from "../../components/Skeleton";

export default function LessonScreen({ route, navigation }: any) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 30 : 24;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const { lessonId, lesson: lessonFromRoute, courseId, courseTitle, lessonTitle, videoUrl } = route.params || { 
    courseTitle: "Course Content",
    lessonTitle: "Untitled Lesson",
    videoUrl: null
  };
  const [completed, setCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lesson, setLesson] = useState<any>(lessonFromRoute || null);
  const [lessonList, setLessonList] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  
  const [doubtModalVisible, setDoubtModalVisible] = useState(false);
  const [doubtTitle, setDoubtTitle] = useState("");
  const [doubtDescription, setDoubtDescription] = useState("");
  const [isSubmittingDoubt, setIsSubmittingDoubt] = useState(false);
  const [doubtError, setDoubtError] = useState<string | null>(null);

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
    if (raw.includes("youtube.com/embed") || raw.includes("youtube-nocookie.com/embed")) return raw;
    const youtubeMatch = raw.match(/^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?"']{11}).*/i);
    if (youtubeMatch?.[1]) return `https://www.youtube-nocookie.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1`;
    if (raw.includes("vimeo.com/") && !raw.includes("player.vimeo.com/video/")) {
      const id = raw.split("vimeo.com/")[1]?.split(/[?#/]/)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return raw;
  };

  const buildEmbedHtml = (embedUrl: string) => {
    const safeUrl = embedUrl.replace(/"/g, "%22");
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" /><style>html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #0f172a; overflow: hidden; } .wrap { width: 100%; height: 100%; } iframe { width: 100%; height: 100%; border: 0; }</style></head><body><div class="wrap"><iframe src="${safeUrl}" title="Lesson Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div></body></html>`;
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
          setLessonList(sorted);

          let activeLesson = sorted.find(item => String(item?.id || item?._id) === String(lessonId));
          if (!activeLesson && sorted.length > 0 && !lessonId) {
             const progressPercent = Number(route.params?.progress || 0);
             const targetIndex = Math.min(Math.floor((progressPercent / 100) * sorted.length), sorted.length - 1);
             activeLesson = sorted[targetIndex];
          }
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
    let newCompleted = [...parseCompletedLessons(enrollment.completed_lessons)];
    
    if (completed) {
      newCompleted = newCompleted.filter(id => String(id) !== currentId);
    } else {
      if (!newCompleted.includes(currentId)) newCompleted.push(currentId);
    }

    try {
      const enrollmentId = enrollment.id || enrollment._id;
      const tLessons = lessonList.length > 0 ? lessonList.length : 1;
      let newProgress = Math.round((newCompleted.length / tLessons) * 100);
      newProgress = Math.min(100, Math.max(0, newProgress));

      const res = await enrollmentsApi.update(enrollmentId, { 
        completed_lessons: newCompleted,
        progress: newProgress
      });
      
      if (isApiSuccess(res.data)) {
        setCompleted(!completed);
        setEnrollment({ ...enrollment, completed_lessons: newCompleted, progress: newProgress });
      } else {
        Alert.alert("Sync Error", "Could not update lesson progress.");
      }
    } catch (e) {
      Alert.alert("Error", "Check your connection and try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const activeTitle = lesson?.title || lessonTitle;
  const activeCourseTitle = lesson?.course?.title || lesson?.courses?.title || courseTitle;
  const activeVideoUrl = normalizeVideoUrl(lesson?.video_url || lesson?.youtube_url || String(videoUrl || ""));
  const activeEmbedUrl = toEmbedVideoUrl(activeVideoUrl);
  const activeDescription = lesson?.description || lesson?.content || "In this lesson, we cover industry-standard practices on the CodeCure platform.";
  const currentLessonId = String(lesson?.id || lesson?._id || lessonId || "");
  const currentLessonIndex = lessonList.findIndex(item => String(item?.id || item?._id) === currentLessonId);
  const totalLessons = lessonList.length || 1;
  const lessonPosition = currentLessonIndex >= 0 ? currentLessonIndex + 1 : 1;
  const canGoPrev = currentLessonIndex > 0;
  const canGoNext = currentLessonIndex >= 0 && currentLessonIndex < lessonList.length - 1;

  const goToLesson = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= lessonList.length) return;
    const target = lessonList[targetIndex];
    navigation.replace("Lesson", {
      lessonId: target?.id || target?._id,
      lesson: target,
      courseId: courseId || target?.course_id,
      courseTitle: activeCourseTitle,
      videoUrl: normalizeVideoUrl(target?.video_url || target?.youtube_url || ""),
      lessonTitle: target?.title,
    });
  };

  const handleAskDoubt = () => {
    setDoubtTitle(activeTitle ? `Doubt about: ${activeTitle}` : "");
    setDoubtError(null);
    setDoubtModalVisible(true);
  };

  const submitDoubt = async () => {
    if (!doubtTitle.trim() || !doubtDescription.trim()) {
      setDoubtError("Please fill in both fields.");
      return;
    }
    setIsSubmittingDoubt(true);
    try {
      const res = await doubtsApi.create({
        subject: doubtTitle,
        description: doubtDescription,
        course_id: String(courseId),
        lesson_id: currentLessonId
      });
      if (isApiSuccess(res.data)) {
        setDoubtModalVisible(false);
        setDoubtDescription("");
        Alert.alert("Success", "Doubt submitted.");
      }
    } catch {
      setDoubtError("Failed to submit.");
    } finally {
      setIsSubmittingDoubt(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <View className="aspect-video bg-slate-900 overflow-hidden">
        {activeEmbedUrl ? (
          (Platform.OS === "ios" || Platform.OS === "android") ? (
            <WebView source={{ html: buildEmbedHtml(activeEmbedUrl) }} className="flex-1" allowsFullscreenVideo javaScriptEnabled />
          ) : (
            <View className="flex-1">
              {React.createElement("iframe" as any, {
                src: activeEmbedUrl,
                style: { width: "100%", height: "100%", border: "0" },
                allowFullScreen: true,
              } as any)}
            </View>
          )
        ) : (
          <View className="flex-1 justify-center items-center">
            <Play size={48} color="white" fill="white" />
            <Text className="text-white/60 text-xs font-bold mt-4 uppercase tracking-widest text-center px-6">No Video Linked for this Lesson</Text>
          </View>
        )}
      </View>

      <View className="flex-1 bg-white">
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }}>
          <View style={{ paddingHorizontal: horizontalPadding, paddingVertical: 18 }} className="border-b border-slate-50">
            <Text className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">{activeCourseTitle}</Text>
            <Text className="text-xl font-black text-slate-900 mb-2">{activeTitle}</Text>
            <View className="flex-row items-center">
              <Clock size={14} color={COLORS.slate400} />
              <Text className="text-slate-400 text-xs font-bold ml-1 uppercase">{lesson?.duration || "15m"}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingVertical: 24 }} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View className="gap-4 mb-8"><Skeleton height={24} width="50%" /><Skeleton height={90} /></View>
          ) : (
            <>
              <Text className="text-slate-900 font-bold text-lg mb-4">About this lesson</Text>
              <Text className="text-slate-500 leading-6 mb-8">{activeDescription}</Text>
            </>
          )}

          <Button 
            title={completed ? "Completed" : "Mark as Complete"} 
            variant={completed ? "secondary" : "primary"}
            onPress={toggleComplete}
            isLoading={isSyncing}
            leftIcon={completed ? <CheckCircle2 size={20} color={COLORS.success} /> : undefined}
          />

          <Button
            title="Ask Doubt For This Lesson"
            variant="outline"
            className="mt-3"
            textClassName="text-xs"
            leftIcon={<MessageSquare size={14} color={COLORS.slate700} />}
            onPress={handleAskDoubt}
          />
          </ScrollView>
        </View>
      </View>

      <View className="border-t border-slate-100 bg-white">
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center", paddingHorizontal: horizontalPadding, paddingVertical: 12 }} className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => goToLesson(currentLessonIndex - 1)} disabled={!canGoPrev}>
            <View className="flex-row items-center">
                <ChevronLeft size={20} color={canGoPrev ? COLORS.slate600 : COLORS.slate400} />
                <Text className={`${canGoPrev ? "text-slate-700" : "text-slate-400"} font-bold ml-1 uppercase`}>Prev</Text>
            </View>
          </TouchableOpacity>
          <View className="bg-slate-100 px-4 py-2 rounded-full">
            <Text className="text-xs font-black text-slate-600">Lesson {lessonPosition} of {totalLessons}</Text>
          </View>
          <TouchableOpacity onPress={() => goToLesson(currentLessonIndex + 1)} disabled={!canGoNext}>
            <View className="flex-row items-center">
                <Text className={`${canGoNext ? "text-blue-600" : "text-slate-400"} font-bold mr-1 uppercase`}>Next</Text>
                <ChevronRight size={20} color={canGoNext ? COLORS.primary : COLORS.slate400} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={doubtModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-slate-900/45 justify-end">
          <View className="bg-white rounded-t-[34px] p-6 h-[68%]">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-black text-slate-900">Ask Doubt</Text>
              <TouchableOpacity onPress={() => setDoubtModalVisible(false)}><Text className="text-slate-400 font-bold">Close</Text></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Input placeholder="Doubt Title" value={doubtTitle} onChangeText={setDoubtTitle} className="mb-4" />
              <Input placeholder="Describe your doubt..." value={doubtDescription} onChangeText={setDoubtDescription} multiline numberOfLines={6} className="mb-8" />
              <Button title="Submit Doubt" onPress={submitDoubt} isLoading={isSubmittingDoubt} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
