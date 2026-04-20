import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, useWindowDimensions, Alert } from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { coursesApi, enrollmentsApi, lessonsApi } from "../../api/endpoints";
import { 
  PlayCircle,
  Lock,
  ChevronRight,
  BookOpen, 
  Star,
  CheckCircle2,
  User,
  Clock
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
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

  const isStudent = user?.role === "student";

  const normalize = (value: any) => String(value || "").trim().toLowerCase();

  const matchesCourseRef = (courseRef: any, targetCourse: any, targetIdOrSlug: any) => {
    const targetId = normalize(targetCourse?.id || targetCourse?._id);
    const targetSlug = normalize(targetCourse?.slug || targetIdOrSlug);
    const refId = normalize(courseRef?.id || courseRef?._id || courseRef?.course_id);
    const refSlug = normalize(courseRef?.slug);

    if (targetId && refId && targetId === refId) return true;
    if (targetSlug && refSlug && targetSlug === refSlug) return true;
    if (targetSlug && refId && targetSlug === refId) return true;
    if (targetId && refSlug && targetId === refSlug) return true;

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
              const lessonsData = extractApiData<any[]>(lessonsRes.data, []);
              setCourseLessons(Array.isArray(lessonsData) ? lessonsData : []);
            } else {
              setCourseLessons([]);
            }
          } catch (lessonsError) {
            console.log("Error loading lessons by course", lessonsError);
            setCourseLessons([]);
          }
        } else {
          setCourseLessons([]);
        }

        if (isStudent && data) {
          const [enrollmentsRes, requestsRes] = await Promise.allSettled([
            enrollmentsApi.myEnrollments(),
            enrollmentsApi.myRequests(),
          ]);

          let enrolledDetected = false;
          let pendingEnrollmentDetected = false;
          let requestDetected = false;
          let matchedEnr = null;

          if (
            enrollmentsRes.status === "fulfilled" &&
            isApiSuccess(enrollmentsRes.value.data)
          ) {
            const enrollmentList = extractApiData<any[]>(enrollmentsRes.value.data, []);
            const matchedEnrollments = (Array.isArray(enrollmentList) ? enrollmentList : []).filter((item) => {
              const courseRef = item?.courses || item?.course || { id: item?.course_id };
              return matchesCourseRef(courseRef, data, idOrSlug);
            });

            matchedEnr = matchedEnrollments.find((item) => {
              const studentStatus = normalize(item?.student_status || item?.status);
              return studentStatus === "active" || studentStatus === "approved";
            });

            enrolledDetected = !!matchedEnr;

            pendingEnrollmentDetected =
              !enrolledDetected &&
              matchedEnrollments.some((item) => {
                const studentStatus = normalize(item?.student_status || item?.status);
                return studentStatus === "pending" || studentStatus === "inactive";
              });
          }

          if (
            !enrolledDetected &&
            requestsRes.status === "fulfilled" &&
            isApiSuccess(requestsRes.value.data)
          ) {
            const requestList = extractApiData<any[]>(requestsRes.value.data, []);
            requestDetected = (Array.isArray(requestList) ? requestList : []).some((item) => {
              const status = normalize(item?.status);
              if (status === "rejected" || status === "cancelled") return false;
              const courseRef = item?.courses || item?.course || { id: item?.course_id };
              return matchesCourseRef(courseRef, data, idOrSlug);
            });
          }

          setIsEnrolled(enrolledDetected);
          setEnrollmentItem(matchedEnr);
          setEnrollmentRequested(!enrolledDetected && (pendingEnrollmentDetected || requestDetected));
        }
      }
    } catch (e) {
      console.log("Error loading course detail", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (idOrSlug) {
      fetchCourseDetail();
    }
  }, [idOrSlug]);

  const lessonCount = useMemo(
    () =>
      Array.isArray(course?.modules)
        ? course.modules.reduce((sum: number, mod: any) => {
            const count = Array.isArray(mod?.lessons) ? mod.lessons.length : 0;
            return sum + count;
          }, 0)
        : 0,
    [course]
  );

  const curriculumModules = useMemo(() => {
    const modules = Array.isArray(course?.modules) ? course.modules : [];
    const lessons = Array.isArray(courseLessons) ? courseLessons : [];

    if (lessons.length === 0) {
      return modules;
    }

    const moduleIds = new Set(
      modules.map((item: any) => String(item?.id || item?._id || "")).filter(Boolean)
    );

    const normalizedModules = modules.map((mod: any) => {
      const modId = String(mod?.id || mod?._id || "");
      const embeddedLessons = Array.isArray(mod?.lessons) ? mod.lessons : [];
      const moduleLessons = lessons.filter(
        (lesson) => String(lesson?.module_id || "") === modId
      );

      const merged = [...embeddedLessons];
      const seenIds = new Set(
        embeddedLessons
          .map((lesson: any) => String(lesson?.id || lesson?._id || ""))
          .filter(Boolean)
      );

      moduleLessons.forEach((lesson) => {
        const lessonId = String(lesson?.id || lesson?._id || "");
        if (!lessonId || !seenIds.has(lessonId)) {
          merged.push(lesson);
          if (lessonId) seenIds.add(lessonId);
        }
      });

      return {
        ...mod,
        lessons: merged,
      };
    });

    const usedLessonIds = new Set(
      normalizedModules
        .flatMap((mod: any) => (Array.isArray(mod?.lessons) ? mod.lessons : []))
        .map((lesson: any) => String(lesson?.id || lesson?._id || ""))
        .filter(Boolean)
    );

    const unassignedLessons = lessons.filter((lesson) => {
      const lessonId = String(lesson?.id || lesson?._id || "");
      const moduleId = String(lesson?.module_id || "");

      if (lessonId && usedLessonIds.has(lessonId)) return false;
      if (moduleId && moduleIds.has(moduleId)) return false;
      return true;
    });

    if (unassignedLessons.length > 0 || normalizedModules.length === 0) {
      return [
        ...normalizedModules,
        {
          id: "__general_lessons__",
          title: "General Lessons",
          lessons: unassignedLessons.length > 0 ? unassignedLessons : lessons,
        },
      ];
    }

    return normalizedModules;
  }, [course, courseLessons]);

  const resolvedLessonCount =
    Array.isArray(courseLessons) && courseLessons.length > 0 ? courseLessons.length : lessonCount;

  const moduleCount = Array.isArray(course?.modules) ? course.modules.length : 0;
  const studentCount = Number(course?.students_enrolled || 0);

  const currentProgressPercent = useMemo(() => calculateProgress(enrollmentItem), [enrollmentItem]);
  const currentProgressText = useMemo(() => getProgressString(enrollmentItem), [enrollmentItem]);

  const handleEnroll = async () => {
    if (!isStudent) return;

    try {
      setIsLoading(true);
      const courseId = course?.id || course?._id;
      if (!courseId) {
        alert("Course ID missing");
        return;
      }

      const res = await enrollmentsApi.request(courseId);
      if (isApiSuccess(res.data)) {
        setEnrollmentRequested(true);
        alert("Enrollment request submitted. You can access lessons after approval.");
      } else {
        alert(getApiError(res.data));
      }
    } catch (e) {
      alert("Failed to request enrollment");
    } finally {
      setIsLoading(false);
    }
  };

  if (!idOrSlug) {
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

  const hasLessonAccess = !isStudent || isEnrolled;

  return (
    <SafeAreaWrapper>
      <AppHeader showBack role={user?.role} subtitle="Course Overview" />
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

        <View className="-mt-8 bg-slate-100 rounded-t-[40px]">
          <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center", paddingHorizontal: horizontalPadding, paddingTop: 24, paddingBottom: 8 }}>
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
                <View className="bg-blue-100 px-3 py-1 rounded-full mr-2">
                  <Text className="text-blue-600 text-xs font-bold">{course?.category || "Development"}</Text>
                </View>
                <View className="flex-row items-center">
                  <Star size={14} color={COLORS.warning} fill={COLORS.warning} />
                  <Text className="text-slate-900 font-bold ml-1 text-xs">4.8</Text>
                </View>
            </View>
            {isEnrolled && (
                <View className="bg-emerald-100 px-3 py-1 rounded-full">
                    <Text className="text-emerald-700 text-[10px] font-black uppercase tracking-wider">{currentProgressPercent}% Done</Text>
                </View>
            )}
          </View>

          <Text className="text-2xl font-black text-slate-900 mb-2">{course?.title}</Text>
          <Text className="text-slate-500 text-sm leading-5 mb-6">{course?.description}</Text>

          {/* Enrolled Progress Bar */}
          {isEnrolled && (
            <View className="bg-white p-6 rounded-[34px] border border-slate-200 mb-8 shadow-sm">
                <View className="flex-row justify-between items-end mb-3">
                    <View>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-1">Your Progress</Text>
                        <Text className="text-xl font-black text-slate-900">{currentProgressPercent}%</Text>
                    </View>
                    <Text className="text-blue-600 font-bold text-xs uppercase">{currentProgressText}</Text>
                </View>
                <View className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <View 
                        className="h-full bg-blue-600 rounded-full" 
                        style={{ width: `${currentProgressPercent}%` }} 
                    />
                </View>
            </View>
          )}

          {/* Stats */}
          <View className="flex-row bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-8">
            <View className="flex-1 items-center border-r border-slate-100">
              <BookOpen size={20} color={COLORS.accent} className="mb-1" />
              <Text className="text-xs text-slate-400 font-bold uppercase">Lessons</Text>
              <Text className="text-sm font-black text-slate-900">{resolvedLessonCount}</Text>
            </View>
            <View className="flex-1 items-center">
              <User size={20} color={COLORS.secondary} className="mb-1" />
              <Text className="text-xs text-slate-400 font-bold uppercase">Students</Text>
              <Text className="text-sm font-black text-slate-900">{studentCount}</Text>
            </View>
          </View>

          <Text className="text-lg font-bold text-slate-900 mb-4">Curriculum</Text>
          
          {/* Modules List */}
          <View className="gap-4 mb-8">
            {curriculumModules.length > 0 ? (
              curriculumModules.map((mod: any, i: number) => (
                <View key={String(mod?.id || mod?._id || i)} className="gap-3">
                  <Text className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">
                    {mod?.title || "Course Lessons"}
                  </Text>
                  {mod.lessons && mod.lessons.map((lesson: any, lIdx: number) => {
                    const isPreviewLesson = Boolean(lesson?.is_free_preview);
                    const canOpenLesson = hasLessonAccess || isPreviewLesson;

                    // Check if lesson is completed in the enrollment object
                    const isLessonDone = Array.isArray(enrollmentItem?.completed_lessons) && 
                        enrollmentItem.completed_lessons.includes(String(lesson.id || lesson._id));

                    return (
                      <TouchableOpacity
                        key={String(lesson?.id || lesson?._id || lIdx)}
                        onPress={() => {
                          if (!canOpenLesson) {
                            Alert.alert(
                              "Enrollment required",
                              "Enroll in this course to view all lesson videos."
                            );
                            return;
                          }

                          navigation.navigate("Lesson", {
                            lessonId: lesson.id || lesson._id,
                            lesson,
                            courseId: course.id || course._id,
                            courseTitle: course.title,
                            videoUrl: lesson.video_url,
                            lessonTitle: lesson.title,
                            progress: currentProgressPercent
                          });
                        }}
                        className={`p-4 rounded-3xl border flex-row items-center ${isLessonDone ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100'}`}
                      >
                        <View className={`${isLessonDone ? 'bg-emerald-100' : 'bg-slate-50'} w-10 h-10 rounded-2xl items-center justify-center mr-4`}>
                          {isLessonDone ? (
                              <CheckCircle2 size={20} color="#059669" />
                          ) : (
                              <PlayCircle size={20} color={COLORS.primary} />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className={`font-bold ${isLessonDone ? 'text-emerald-900' : 'text-slate-900'}`}>{lesson.title}</Text>
                          <View className="flex-row items-center mt-1">
                            <Text className="text-xs text-slate-400">{lesson.duration || "10m"}</Text>
                            {isPreviewLesson ? (
                              <View className="ml-2 bg-blue-50 px-2 py-[2px] rounded-full border border-blue-100">
                                <Text className="text-[10px] font-black uppercase text-blue-600">Preview</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                        {hasLessonAccess ? (
                          isLessonDone ? (
                            <View className="bg-emerald-200/50 p-1 rounded-full">
                                <CheckCircle2 size={14} color="#059669" />
                            </View>
                          ) : (
                            <ChevronRight size={18} color={COLORS.slate300} />
                          )
                        ) : isPreviewLesson ? (
                          <PlayCircle size={18} color={COLORS.primary} />
                        ) : (
                          <Lock size={18} color={COLORS.slate300} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))
            ) : (
              <View className="bg-white p-8 rounded-3xl border border-dashed border-slate-300 items-center">
                <Text className="text-slate-400 font-bold">Curriculum coming soon!</Text>
              </View>
            )}
          </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View className="bg-white border-t border-slate-100">
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center", paddingHorizontal: horizontalPadding, paddingVertical: 20 }} className="flex-row items-center">
          <View className="flex-1">
            <Text className="text-slate-400 text-xs font-bold uppercase">
              {isStudent && isEnrolled ? "Status" : "Price"}
            </Text>
            <Text className={`text-2xl font-black ${isStudent && isEnrolled ? "text-emerald-600" : "text-slate-900"}`}>
              {isStudent && isEnrolled ? "Enrolled" : `₹${course?.price || "Free"}`}
            </Text>
          </View>
          <Button
            title={
              isStudent
                ? isEnrolled
                  ? "Continue Learning"
                  : enrollmentRequested
                    ? "Requested"
                    : "Enroll Now"
                : "Course Access"
            }
            className="flex-[1.5]"
            onPress={() => {
                if (isEnrolled) {
                    navigation.navigate("Lesson", { 
                        courseId: course.id || course._id, 
                        courseTitle: course.title,
                        progress: currentProgressPercent
                    });
                } else {
                    handleEnroll();
                }
            }}
            disabled={isStudent ? (!isEnrolled && enrollmentRequested) : true}
          />
        </View>
      </View>
    </SafeAreaWrapper>
  );
}
