import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { 
  Play, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  MessageCircle,
  Clock
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { Button } from "../../components/Button";
import { lessonsApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { Skeleton } from "../../components/Skeleton";

export default function LessonScreen({ route, navigation }: any) {
  const { lessonId, courseTitle, lessonTitle, videoUrl } = route.params || { 
    courseTitle: "Course Content",
    lessonTitle: "Untitled Lesson",
    videoUrl: null
  };
  const [completed, setCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(!!lessonId);
  const [lesson, setLesson] = useState<any>(null);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await lessonsApi.detail(String(lessonId));
        if (isApiSuccess(res.data)) {
          const data = extractApiData<any>(res.data, null);
          setLesson(data);
        }
      } catch (e) {
        console.log("Error loading lesson", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId]);

  const activeTitle = lesson?.title || lessonTitle;
  const activeCourseTitle = lesson?.course?.title || courseTitle;
  const activeVideoUrl = lesson?.video_url || videoUrl;
  const activeDescription =
    lesson?.description ||
    "In this lesson, we will cover the basics of the CodeCure Academy platform. You will learn how to navigate through your courses, track your progress, and interact with mentors using the doubt system.";
  const activeDuration = lesson?.duration || "15 Minutes";

  return (
    <SafeAreaWrapper>
      {/* Video Player Placeholder */}
      <View className="aspect-video bg-slate-900 justify-center items-center">
        <Play size={48} color="white" fill="white" />
        <Text className="text-white/60 text-xs font-bold mt-4 uppercase tracking-widest">
          {activeVideoUrl ? "Streaming from Source" : "Video Player Placeholder"}
        </Text>
        {activeVideoUrl && <Text className="text-white/40 text-[10px] mt-1">{activeVideoUrl}</Text>}
      </View>

      <View className="flex-1 bg-white">
        <View className="p-6 border-b border-slate-50">
          <Text className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">{activeCourseTitle}</Text>
          <Text className="text-xl font-black text-slate-900 mb-2">{activeTitle}</Text>
          <View className="flex-row items-center">
            <Clock size={14} color={COLORS.slate400} />
            <Text className="text-slate-400 text-xs font-bold ml-1 uppercase">{activeDuration}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24 }}>
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

          <Text className="text-slate-900 font-bold text-lg mb-4">Resources</Text>
          <TouchableOpacity className="bg-slate-50 p-4 rounded-2xl flex-row items-center mb-10">
            <View className="bg-blue-100 p-2 rounded-xl mr-4">
              <FileText size={20} color={COLORS.primary} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-slate-900">Platform_Guide.pdf</Text>
              <Text className="text-xs text-slate-400">PDF • 2.4 MB</Text>
            </View>
            <ChevronRight size={18} color={COLORS.slate300} />
          </TouchableOpacity>

          <Button 
            title={completed ? "Completed" : "Mark as Complete"} 
            variant={completed ? "secondary" : "primary"}
            onPress={() => setCompleted(!completed)}
            leftIcon={completed ? <CheckCircle2 size={20} color={COLORS.success} /> : undefined}
          />
        </ScrollView>
      </View>

      {/* Navigation Footer */}
      <View className="flex-row border-t border-slate-100 p-4 bg-white justify-between items-center">
        <TouchableOpacity className="flex-row items-center">
          <ChevronLeft size={20} color={COLORS.slate400} />
          <Text className="text-slate-400 font-bold ml-1 uppercase">Prev</Text>
        </TouchableOpacity>
        
        <View className="flex-row items-center bg-slate-100 px-4 py-2 rounded-full">
          <Text className="text-xs font-black text-slate-600">Lesson 1 of 12</Text>
        </View>

        <TouchableOpacity className="flex-row items-center">
          <Text className="text-blue-600 font-bold mr-1 uppercase">Next</Text>
          <ChevronRight size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </SafeAreaWrapper>
  );
}
