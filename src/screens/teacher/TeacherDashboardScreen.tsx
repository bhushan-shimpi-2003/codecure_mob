import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, useWindowDimensions } from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { assignmentsApi, coursesApi, doubtsApi, interviewsApi } from "../../api/endpoints";
import { 
  GraduationCap, 
  FileText, 
  HelpCircle, 
  CalendarClock,
  ChevronRight,
  BookOpenCheck,
  CirclePlay,
  MessageCircleWarning,
  UserCheck
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { Button } from "../../components/Button";
import { Skeleton } from "../../components/Skeleton";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
import { TeacherScreenHeader } from "../../components/TeacherScreenHeader";
import { TeacherStatCard } from "../../components/TeacherStatCard";
import { AppHeader } from "../../components/AppHeader";
import { useAuth } from "../../context/AuthContext";

export default function TeacherDashboardScreen({ navigation }: any) {
  const [courses, setCourses] = useState<any[]>([]);
  const [pendingDoubts, setPendingDoubts] = useState<any[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 30 : 24;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const fetchTeacherData = async () => {
    setErrorMessage(null);

    try {
      const [coursesRes, doubtsRes, interviewsRes] = await Promise.allSettled([
        coursesApi.teacherCourses(),
        doubtsApi.teacherDoubts(),
        interviewsApi.teacherInterviews(),
      ]);

      let nextCourses: any[] = [];

      if (coursesRes.status === "fulfilled" && isApiSuccess(coursesRes.value.data)) {
        const coursesData = extractApiData<any[]>(coursesRes.value.data, []);
        nextCourses = Array.isArray(coursesData) ? coursesData : [];
      }

      if (doubtsRes.status === "fulfilled" && isApiSuccess(doubtsRes.value.data)) {
        const doubtsData = extractApiData<any[]>(doubtsRes.value.data, []);
        const unresolved = (Array.isArray(doubtsData) ? doubtsData : []).filter(
          (item) => item?.status !== "resolved"
        );
        setPendingDoubts(unresolved);
      } else {
        setPendingDoubts([]);
      }

      if (interviewsRes.status === "fulfilled" && isApiSuccess(interviewsRes.value.data)) {
        const interviewsData = extractApiData<any[]>(interviewsRes.value.data, []);
        const now = Date.now();
        const upcoming = (Array.isArray(interviewsData) ? interviewsData : [])
          .filter((item) => {
            if (item?.status === "completed" || item?.status === "cancelled") return false;
            const time = item?.scheduled_at ? new Date(item.scheduled_at).getTime() : 0;
            return time >= now;
          })
          .sort(
            (a, b) =>
              new Date(a?.scheduled_at || 0).getTime() -
              new Date(b?.scheduled_at || 0).getTime()
          );
        setUpcomingInterviews(upcoming);
      } else {
        setUpcomingInterviews([]);
      }

      if (nextCourses.length > 0) {
        const assignmentCalls = await Promise.allSettled(
          nextCourses.map((course) => {
            const courseId = course?.id || course?._id;
            if (!courseId) {
              return Promise.resolve({ data: { success: true, data: [] } });
            }
            return assignmentsApi.byCourse(String(courseId));
          })
        );

        const assignmentsCount = assignmentCalls.reduce((sum, result) => {
          if (result.status !== "fulfilled") return sum;
          if (!isApiSuccess(result.value.data)) return sum;
          const data = extractApiData<any[]>(result.value.data, []);
          return sum + (Array.isArray(data) ? data.length : 0);
        }, 0);

        setTotalAssignments(assignmentsCount);
      } else {
        setTotalAssignments(0);
      }

      setCourses(nextCourses);

      const failedCall =
        (coursesRes.status === "fulfilled" && !isApiSuccess(coursesRes.value.data) && getApiError(coursesRes.value.data)) ||
        (doubtsRes.status === "fulfilled" && !isApiSuccess(doubtsRes.value.data) && getApiError(doubtsRes.value.data)) ||
        (interviewsRes.status === "fulfilled" && !isApiSuccess(interviewsRes.value.data) && getApiError(interviewsRes.value.data));

      if (failedCall) {
        setErrorMessage(failedCall);
      }
    } catch (e) {
      console.log("Error loading teacher data", e);
      setErrorMessage("Failed to refresh teacher dashboard data");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const totalStudents = useMemo(
    () =>
      courses.reduce((sum, item) => sum + Number(item?.students_enrolled || 0), 0),
    [courses]
  );

  const stats = [
    { label: "My Courses", value: courses.length, icon: GraduationCap, tone: "blue" as const },
    { label: "Students", value: totalStudents, icon: UserCheck, tone: "emerald" as const },
    {
      label: "Assignments",
      value: totalAssignments,
      icon: FileText,
      tone: "amber" as const,
      onPress: () => navigation.navigate("TeacherAssignments"),
    },
    {
      label: "Open Doubts",
      value: pendingDoubts.length,
      icon: HelpCircle,
      tone: "violet" as const,
      onPress: () => navigation.navigate("TeacherDoubts"),
    },
  ];

  const formatDate = (value?: string) => {
    if (!value) return "Not scheduled";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Not scheduled";
    return parsed.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const { user } = useAuth();

  return (
    <SafeAreaWrapper>
      <AppHeader role={user?.role || "Teacher"} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: isTablet ? 36 : 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchTeacherData();
            }}
          />
        }
      >
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }}>
          <TeacherScreenHeader
            badge="Faculty Dashboard"
            title="Education Hub"
            subtitle="Track classes, learner load, and live teaching queues"
          />

          <View
            style={{
              paddingHorizontal: horizontalPadding,
              paddingTop: 12,
            }}
          >

            {errorMessage ? (
          <View className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-6">
            <Text className="text-amber-700 font-bold text-xs uppercase tracking-wider">Data Notice</Text>
            <Text className="text-amber-700 text-sm mt-1">{errorMessage}</Text>
          </View>
        ) : null}

        {/* Stats Row */}
        <View className="flex-row flex-wrap justify-between mb-8">
          {stats.map((stat, i) => (
            <TeacherStatCard
              key={i}
              label={stat.label}
              value={stat.value}
              Icon={stat.icon}
              tone={stat.tone}
              onPress={stat.onPress}
            />
          ))}
        </View>

        <Text className="text-lg font-bold text-slate-900 mb-4">My Courses</Text>
        
        {isLoading ? (
          <Skeleton height={200} className="rounded-[32px]" />
        ) : courses.length === 0 ? (
          <View className="bg-white p-8 rounded-[32px] border border-slate-100 items-center justify-center">
            <Text className="text-slate-500 font-medium">You haven't created any courses yet.</Text>
          </View>
        ) : (
          courses.map((course) => (
            <TouchableOpacity 
              key={String(course?.id || course?._id || course?.slug)}
              onPress={() => {
                const idOrSlug = course?.slug || course?.id || course?._id;
                if (idOrSlug) {
                  navigation.navigate("CourseDetail", { idOrSlug });
                }
              }}
              className="bg-white p-5 rounded-[32px] mb-4 border border-slate-100 shadow-sm flex-row items-center"
            >
              <View className="bg-slate-100 w-16 h-16 rounded-2xl mr-4 items-center justify-center">
                <BookOpenCheck size={24} color={COLORS.primary} />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-900 text-base" numberOfLines={1}>{course.title}</Text>
                <Text className="text-xs text-slate-400 font-bold uppercase mt-1">
                  {Number(course?.students_enrolled || 0)} Students enrolled
                </Text>
              </View>
              <ChevronRight size={18} color={COLORS.slate300} />
            </TouchableOpacity>
          ))
        )}

        <View className="flex-row items-center justify-between mt-6 mb-4">
          <Text className="text-lg font-bold text-slate-900">Teaching Queue</Text>
          <TouchableOpacity onPress={() => navigation.navigate("TeacherDoubts")}>
            <Text className="text-xs font-black text-blue-600 uppercase">View Doubts</Text>
          </TouchableOpacity>
        </View>
        {isLoading ? (
          <Skeleton height={180} className="rounded-[32px] mb-4" />
        ) : (
          <View className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden mb-6">
            <View className="px-5 py-4 border-b border-slate-50 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <MessageCircleWarning size={16} color={COLORS.warning} />
                <Text className="text-slate-900 font-bold ml-2">Pending Doubts</Text>
              </View>
              <Text className="text-xs font-black text-slate-500 uppercase">{pendingDoubts.length}</Text>
            </View>

            {pendingDoubts.slice(0, 3).map((item, idx) => (
              <View
                key={String(item?.id || item?._id || idx)}
                className={`px-5 py-3 ${idx !== Math.min(pendingDoubts.length, 3) - 1 ? "border-b border-slate-50" : ""}`}
              >
                <Text className="text-slate-900 font-bold text-sm" numberOfLines={1}>
                  {item?.subject || "Untitled doubt"}
                </Text>
                <Text className="text-slate-500 text-xs mt-1" numberOfLines={1}>
                  {item?.description || "No description"}
                </Text>
              </View>
            ))}

            {pendingDoubts.length === 0 ? (
              <View className="px-5 py-4">
                <Text className="text-slate-500 text-sm">No pending doubts right now.</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate("TeacherDoubts")}
                className="px-5 py-3 border-t border-slate-50"
              >
                <Text className="text-xs font-black text-blue-600 uppercase">Open full doubts queue</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isLoading ? (
          <Skeleton height={140} className="rounded-[32px] mb-8" />
        ) : (
          <View className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden mb-8">
            <View className="px-5 py-4 border-b border-slate-50 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <CalendarClock size={16} color={COLORS.primary} />
                <Text className="text-slate-900 font-bold ml-2">Upcoming Interviews</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate("TeacherInterviews")}>
                <Text className="text-xs font-black text-blue-600 uppercase">{upcomingInterviews.length} View</Text>
              </TouchableOpacity>
            </View>

            {upcomingInterviews.slice(0, 3).map((item, idx) => (
              <View
                key={String(item?.id || item?._id || idx)}
                className={`px-5 py-3 ${idx !== Math.min(upcomingInterviews.length, 3) - 1 ? "border-b border-slate-50" : ""}`}
              >
                <Text className="text-slate-900 font-bold text-sm" numberOfLines={1}>
                  {item?.title || "Mock Interview"}
                </Text>
                <Text className="text-slate-500 text-xs mt-1">{formatDate(item?.scheduled_at)}</Text>
              </View>
            ))}

            {upcomingInterviews.length === 0 ? (
              <View className="px-5 py-4">
                <Text className="text-slate-500 text-sm">No upcoming interviews scheduled.</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate("TeacherInterviews")}
                className="px-5 py-3 border-t border-slate-50"
              >
                <Text className="text-xs font-black text-blue-600 uppercase">Manage interviews</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text className="text-lg font-bold text-slate-900 mt-6 mb-4">Quick Actions</Text>
        <View className="flex-row gap-4">
          <TouchableOpacity
            onPress={() => {
              const firstCourse = courses[0];
              const idOrSlug = firstCourse?.slug || firstCourse?.id || firstCourse?._id;
              if (idOrSlug) {
                navigation.navigate("CourseDetail", { idOrSlug });
              }
            }}
            className="flex-1 bg-blue-600 p-4 rounded-3xl items-center"
          >
            <CirclePlay color="white" size={24} className="mb-1" />
            <Text className="text-white font-bold text-xs uppercase">Open Course</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("TeacherAssignments")}
            className="flex-1 bg-slate-900 p-4 rounded-3xl items-center"
          >
            <FileText color="white" size={24} className="mb-1" />
            <Text className="text-white font-bold text-xs uppercase">Assignments</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-3 mt-6">
          <Button title="Refresh Dashboard" className="flex-1" onPress={fetchTeacherData} />
          <Button
            title="Submissions"
            variant="outline"
            className="flex-1"
            onPress={() => navigation.navigate("TeacherSubmissions")}
          />
        </View>

        <Button
          title="Profile"
          variant="ghost"
          className="mt-3"
          onPress={() => navigation.navigate("EditProfile")}
        />
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
