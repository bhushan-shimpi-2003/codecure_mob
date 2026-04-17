import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, FlatList } from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { coursesApi, enrollmentsApi } from "../../api/endpoints";
import { 
  PlayCircle,
  Lock,
  ChevronRight,
  Clock,
  BookOpen, 
  Star,
  CheckCircle2,
  User
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { Skeleton } from "../../components/Skeleton";
import { Button } from "../../components/Button";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";

export default function CourseDetailScreen({ route, navigation }: any) {
  const { slug } = route.params;
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const fetchCourseDetail = async () => {
    try {
      const res = await coursesApi.detail(slug);
      const payload = res.data;
      if (isApiSuccess(payload)) {
        const data = extractApiData<any>(payload, null);
        setCourse(data);
      }
    } catch (e) {
      console.log("Error loading course detail", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchCourseDetail();
    }
  }, [slug]);

  const handleEnroll = async () => {
    try {
      setIsLoading(true);
      const courseId = course?.id || course?._id;
      if (!courseId) {
        alert("Course ID missing");
        return;
      }

      const res = await enrollmentsApi.request(courseId);
      if (isApiSuccess(res.data)) {
        setIsEnrolled(true);
        alert("Enrollment requested successfully!");
      } else {
        alert(getApiError(res.data));
      }
    } catch (e) {
      alert("Failed to request enrollment");
    } finally {
      setIsLoading(false);
    }
  };

  if (!slug) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-slate-500 font-bold text-center">Invalid course selection. Please go back and try again.</Text>
          <Button title="Go Back" className="mt-4" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaWrapper>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaWrapper>
        <Skeleton height={250} />
        <View className="p-6">
          <Skeleton height={30} width="80%" className="mb-4" />
          <Skeleton height={20} width="40%" className="mb-8" />
          <Skeleton height={100} className="mb-8" />
          <Skeleton height={60} className="mb-4" />
          <Skeleton height={60} />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <ScrollView>
        {/* Banner */}
        <View className="h-64 bg-slate-900 justify-center items-center">
          {course?.thumbnail ? (
            <Image source={{ uri: course.thumbnail }} className="w-full h-full opacity-60" />
          ) : (
            <PlayCircle size={64} color="white" />
          )}
          <TouchableOpacity 
            className="absolute bg-white/20 p-4 rounded-full border border-white/30"
          >
            <PlayCircle size={32} color="white" />
          </TouchableOpacity>
        </View>

        <View className="p-6 -mt-8 bg-slate-50 rounded-t-[40px]">
          <View className="flex-row items-center mb-2">
            <View className="bg-blue-100 px-3 py-1 rounded-full mr-2">
              <Text className="text-blue-600 text-xs font-bold">{course?.category || "Development"}</Text>
            </View>
            <View className="flex-row items-center">
              <Star size={14} color={COLORS.warning} fill={COLORS.warning} />
              <Text className="text-slate-900 font-bold ml-1 text-xs">4.8</Text>
            </View>
          </View>

          <Text className="text-2xl font-black text-slate-900 mb-2">{course?.title}</Text>
          <Text className="text-slate-500 text-sm leading-5 mb-6">{course?.description}</Text>

          {/* Stats */}
          <View className="flex-row bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-8">
            <View className="flex-1 items-center border-r border-slate-100">
              <Clock size={20} color={COLORS.primary} className="mb-1" />
              <Text className="text-xs text-slate-400 font-bold uppercase">Duration</Text>
              <Text className="text-sm font-black text-slate-900">12h 40m</Text>
            </View>
            <View className="flex-1 items-center border-r border-slate-100">
              <BookOpen size={20} color={COLORS.accent} className="mb-1" />
              <Text className="text-xs text-slate-400 font-bold uppercase">Lessons</Text>
              <Text className="text-sm font-black text-slate-900">48</Text>
            </View>
            <View className="flex-1 items-center">
              <User size={20} color={COLORS.secondary} className="mb-1" />
              <Text className="text-xs text-slate-400 font-bold uppercase">Students</Text>
              <Text className="text-sm font-black text-slate-900">1.2k</Text>
            </View>
          </View>

          <Text className="text-lg font-bold text-slate-900 mb-4">Curriculum</Text>
          
          {/* Modules List */}
          <View className="gap-4 mb-8">
            {course.modules && course.modules.length > 0 ? (
              course.modules.map((mod: any, i: number) => (
                <View key={String(mod?.id || mod?._id || i)} className="gap-3">
                  <Text className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">
                    Module {i + 1}: {mod.title}
                  </Text>
                  {mod.lessons && mod.lessons.map((lesson: any, lIdx: number) => (
                    <TouchableOpacity 
                      key={String(lesson?.id || lesson?._id || lIdx)}
                      onPress={() => navigation.navigate("Lesson", { 
                        lessonId: lesson.id || lesson._id,
                        courseTitle: course.title,
                        videoUrl: lesson.video_url,
                        lessonTitle: lesson.title
                      })}
                      className="bg-white p-4 rounded-3xl border border-slate-100 flex-row items-center"
                    >
                      <View className="bg-slate-50 w-10 h-10 rounded-2xl items-center justify-center mr-4">
                        <PlayCircle size={20} color={COLORS.primary} />
                      </View>
                      <View className="flex-1">
                        <Text className="font-bold text-slate-900">{lesson.title}</Text>
                        <Text className="text-xs text-slate-400">{lesson.duration || "10m"}</Text>
                      </View>
                      {isEnrolled ? (
                        <CheckCircle2 size={18} color={COLORS.success} />
                      ) : (
                        <Lock size={18} color={COLORS.slate300} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            ) : (
              <View className="bg-white p-8 rounded-3xl border border-dashed border-slate-300 items-center">
                <Text className="text-slate-400 font-bold">Curriculum coming soon!</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View className="p-6 bg-white border-t border-slate-100 flex-row items-center">
        <View className="flex-1">
          <Text className="text-slate-400 text-xs font-bold uppercase">Price</Text>
          <Text className="text-2xl font-black text-slate-900">₹{course?.price || "Free"}</Text>
        </View>
        <Button 
          title="Enroll Now" 
          className="flex-[1.5]" 
          onPress={handleEnroll}
          disabled={isEnrolled}
        />
      </View>
    </SafeAreaWrapper>
  );
}
