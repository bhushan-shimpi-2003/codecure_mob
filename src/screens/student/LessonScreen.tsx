import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, Platform, Modal, Alert } from "react-native";
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
import { doubtsApi, lessonsApi } from "../../api/endpoints";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
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
  const [isLoading, setIsLoading] = useState(!!courseId);
  const [lesson, setLesson] = useState<any>(lessonFromRoute || null);
  const [lessonList, setLessonList] = useState<any[]>([]);
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
      if (srcMatch?.[1]) {
        return srcMatch[1].trim();
      }
    }

    return raw;
  };

  const toEmbedVideoUrl = (value?: string) => {
    const raw = normalizeVideoUrl(value);
    if (!raw) return "";

    if (raw.includes("youtube.com/embed") || raw.includes("youtube-nocookie.com/embed")) {
      return raw;
    }

    const youtubeMatch = raw.match(
      /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?"']{11}).*/i
    );

    if (youtubeMatch?.[1]) {
      return `https://www.youtube-nocookie.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1`;
    }

    if (raw.includes("vimeo.com/") && !raw.includes("player.vimeo.com/video/")) {
      const id = raw.split("vimeo.com/")[1]?.split(/[?#/]/)[0];
      if (id) {
        return `https://player.vimeo.com/video/${id}`;
      }
    }

    return raw;
  };

  const buildEmbedHtml = (embedUrl: string) => {
    const safeUrl = embedUrl.replace(/"/g, "%22");
    return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #0f172a;
        overflow: hidden;
      }
      .wrap {
        width: 100%;
        height: 100%;
      }
      iframe {
        width: 100%;
        height: 100%;
        border: 0;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <iframe
        src="${safeUrl}"
        title="Lesson Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
    </div>
  </body>
</html>`;
  };

  useEffect(() => {
    const fetchLesson = async () => {
      if (!courseId) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await lessonsApi.byCourse(String(courseId));
        if (isApiSuccess(res.data)) {
          const data = extractApiData<any[]>(res.data, []);
          const list = Array.isArray(data) ? data : [];
          const sorted = [...list].sort(
            (a, b) => Number(a?.lesson_order || 0) - Number(b?.lesson_order || 0)
          );
          setLessonList(sorted);

          const active = sorted.find(
            (item) => String(item?.id || item?._id) === String(lessonId)
          );

          if (active) {
            setLesson(active);
          } else if (sorted.length > 0 && !lessonId) {
            setLesson(sorted[0]);
          }
        }
      } catch (e) {
        console.log("Error loading lesson", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLesson();
  }, [courseId, lessonId]);

  const activeTitle = lesson?.title || lessonTitle;
  const activeCourseTitle = lesson?.course?.title || lesson?.courses?.title || courseTitle;
  const activeVideoUrl = normalizeVideoUrl(lesson?.video_url || lesson?.youtube_url || String(videoUrl || ""));
  const activeEmbedUrl = toEmbedVideoUrl(activeVideoUrl);
  const activeDescription =
    lesson?.description ||
    lesson?.content ||
    lesson?.notes ||
    "In this lesson, we will cover the basics of the CodeCure Academy platform. You will learn how to navigate through your courses, track your progress, and interact with mentors using the doubt system.";
  const activeDuration = lesson?.duration || "15 Minutes";
  const canUseNativeWebView = Platform.OS === "ios" || Platform.OS === "android";
  const canUseWebIframe = Platform.OS === "web";
  const currentLessonId = String(lesson?.id || lesson?._id || lessonId || "");
  const currentLessonIndex = lessonList.findIndex(
    (item) => String(item?.id || item?._id) === currentLessonId
  );
  const totalLessons = lessonList.length || 1;
  const lessonPosition = currentLessonIndex >= 0 ? currentLessonIndex + 1 : 1;
  const canGoPrev = currentLessonIndex > 0;
  const canGoNext = currentLessonIndex >= 0 && currentLessonIndex < lessonList.length - 1;

  const goToLesson = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= lessonList.length) return;
    const target = lessonList[targetIndex];
    const targetId = String(target?.id || target?._id || "");
    if (!targetId) return;

    navigation.replace("Lesson", {
      lessonId: targetId,
      lesson: target,
      courseId: courseId || target?.course_id || target?.courses?.id,
      courseTitle: activeCourseTitle,
      videoUrl: normalizeVideoUrl(target?.video_url || target?.youtube_url || ""),
      lessonTitle: target?.title,
    });
  };

  const handleAskDoubt = () => {
    if (!doubtTitle.trim()) {
      setDoubtTitle(activeTitle ? `Doubt about: ${activeTitle}` : "");
    }
    setDoubtError(null);
    setDoubtModalVisible(true);
  };

  const submitDoubt = async () => {
    const subject = doubtTitle.trim();
    const description = doubtDescription.trim();

    if (!subject || !description) {
      setDoubtError("Please enter both title and description.");
      return;
    }

    setIsSubmittingDoubt(true);
    setDoubtError(null);

    try {
      const linkedCourseId = String(courseId || lesson?.course_id || lesson?.course?.id || lesson?.courses?.id || "");
      const linkedLessonId = String(lesson?.id || lesson?._id || lessonId || "");
      const payload: any = { subject, description };

      if (linkedCourseId) payload.course_id = linkedCourseId;
      if (linkedLessonId) payload.lesson_id = linkedLessonId;

      const res = await doubtsApi.create(payload);
      if (isApiSuccess(res.data)) {
        setDoubtModalVisible(false);
        setDoubtDescription("");
        Alert.alert("Doubt submitted", "Your doubt has been posted for mentor review.");
      } else {
        setDoubtError(getApiError(res.data));
      }
    } catch (error) {
      setDoubtError("Failed to submit doubt.");
    } finally {
      setIsSubmittingDoubt(false);
    }
  };

  return (
    <SafeAreaWrapper>
      {/* Lesson Video Header */}
      <View className="aspect-video bg-slate-900 overflow-hidden">
        {activeEmbedUrl ? (
          canUseNativeWebView ? (
            <WebView
              source={{ html: buildEmbedHtml(activeEmbedUrl) }}
              className="flex-1"
              allowsFullscreenVideo
              javaScriptEnabled
              domStorageEnabled
              mediaPlaybackRequiresUserAction={false}
            />
          ) : canUseWebIframe ? (
            <View className="flex-1">
              {React.createElement("iframe" as any, {
                src: activeEmbedUrl,
                title: "Lesson Video",
                style: { width: "100%", height: "100%", border: "0" },
                allow:
                  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
                allowFullScreen: true,
              } as any)}
            </View>
          ) : (
            <View className="flex-1 justify-center items-center px-6">
              <Play size={40} color="white" fill="white" />
              <Text className="text-white/70 text-xs font-bold mt-3 uppercase tracking-widest text-center">
                Embedded player is not supported on this platform.
              </Text>
            </View>
          )
        ) : (
          <View className="flex-1 justify-center items-center">
            <Play size={48} color="white" fill="white" />
            <Text className="text-white/60 text-xs font-bold mt-4 uppercase tracking-widest">
              No Video Linked
            </Text>
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
              <Text className="text-slate-400 text-xs font-bold ml-1 uppercase">{activeDuration}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingVertical: 24 }}>
          {isLoading ? (
            <View className="gap-4 mb-8">
              <Skeleton height={24} width="50%" />
              <Skeleton height={90} />
            </View>
          ) : (
            <>
              <Text className="text-slate-900 font-bold text-lg mb-4">About this lesson</Text>
              <Text className="text-slate-500 leading-6 mb-8">{activeDescription}</Text>
            </>
          )}

          <Button 
            title={completed ? "Completed" : "Mark as Complete"} 
            variant={completed ? "secondary" : "primary"}
            onPress={() => setCompleted(!completed)}
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

      {/* Navigation Footer */}
      <View className="border-t border-slate-100 bg-white">
        <View
          style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center", paddingHorizontal: horizontalPadding, paddingVertical: 12 }}
          className="flex-row justify-between items-center"
        >
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => goToLesson(currentLessonIndex - 1)}
            disabled={!canGoPrev}
          >
            <ChevronLeft size={20} color={canGoPrev ? COLORS.slate600 : COLORS.slate400} />
            <Text className={`${canGoPrev ? "text-slate-700" : "text-slate-400"} font-bold ml-1 uppercase`}>Prev</Text>
          </TouchableOpacity>

          <View className="flex-row items-center bg-slate-100 px-4 py-2 rounded-full">
            <Text className="text-xs font-black text-slate-600">Lesson {lessonPosition} of {totalLessons}</Text>
          </View>

          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => goToLesson(currentLessonIndex + 1)}
            disabled={!canGoNext}
          >
            <Text className={`${canGoNext ? "text-blue-600" : "text-slate-400"} font-bold mr-1 uppercase`}>Next</Text>
            <ChevronRight size={20} color={canGoNext ? COLORS.primary : COLORS.slate400} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={doubtModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDoubtModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900/45 justify-end">
          <View className="bg-white rounded-t-[34px] p-6 h-[68%]">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-black text-slate-900">Ask Doubt</Text>
              <TouchableOpacity onPress={() => setDoubtModalVisible(false)}>
                <Text className="text-slate-400 font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-4">
                <Text className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  Linked to this lesson
                </Text>
              </View>

              {doubtError ? (
                <View className="mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <Text className="text-amber-700 text-sm font-semibold">{doubtError}</Text>
                </View>
              ) : null}

              <Text className="text-slate-500 font-bold mb-2 ml-1">Title</Text>
              <Input
                placeholder="What's your doubt about?"
                value={doubtTitle}
                onChangeText={setDoubtTitle}
                className="mb-4"
              />

              <Text className="text-slate-500 font-bold mb-2 ml-1">Detail Description</Text>
              <Input
                placeholder="Explain what problem you are facing..."
                value={doubtDescription}
                onChangeText={setDoubtDescription}
                multiline
                numberOfLines={6}
                style={{ textAlignVertical: "top" }}
                className="mb-8"
              />

              <Button
                title="Submit Doubt"
                onPress={submitDoubt}
                isLoading={isSubmittingDoubt}
                disabled={!doubtTitle.trim() || !doubtDescription.trim()}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
