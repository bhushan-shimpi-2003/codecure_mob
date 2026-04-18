import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, useWindowDimensions } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { enrollmentsApi } from "../../api/endpoints";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { BookOpen, Trophy, Clock, ClipboardList, Video, Sparkles } from "lucide-react-native";
import { Skeleton } from "../../components/Skeleton";
import { COLORS } from "../../utils/theme";
import { extractApiData, isApiSuccess } from "../../api/response";
import { StudentScreenHeader } from "../../components/StudentScreenHeader";
import { StudentStatCard } from "../../components/StudentStatCard";

export default function DashboardScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 30 : 24;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await enrollmentsApi.myEnrollments();
      const payload = res.data;
      if (isApiSuccess(payload)) {
        const data = extractApiData<any[]>(payload, []);
        setEnrollments(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.log("Failed to fetch dashboard", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const completionAvg =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce((sum, item) => sum + Number(item?.progress || 0), 0) / enrollments.length
        )
      : 0;

  const firstName = user?.name?.split(" ")[0] || "Learner";

  return (
    <SafeAreaWrapper>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: isTablet ? 34 : 24 }}
      >
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }}>
          <StudentScreenHeader
            badge="Student Workspace"
            title={`Welcome, ${firstName}`}
            subtitle="Track progress, continue your courses, and stay interview-ready"
            actionIcon={<Sparkles size={20} color="white" />}
            onActionPress={() => navigation.navigate("Courses")}
          />

          <View style={{ paddingHorizontal: horizontalPadding }} className="pt-1 pb-2 flex-row flex-wrap justify-between">
            <StudentStatCard label="Enrolled" value={enrollments.length || 0} Icon={BookOpen} tone="blue" />
            <StudentStatCard label="Progress" value={`${completionAvg}%`} Icon={Trophy} tone="amber" />
            <StudentStatCard label="Live Track" value={enrollments.length > 0 ? "On" : "Off"} Icon={Clock} tone="emerald" />
          </View>

          <View style={{ paddingHorizontal: horizontalPadding, paddingTop: 10 }}>
            <Text className="text-sm font-black text-slate-500 uppercase tracking-wider mb-3">Quick Access</Text>
            <View className="flex-row gap-3 mb-7">
              <TouchableOpacity
                onPress={() => navigation.navigate("Assignments")}
                className="flex-1 bg-slate-900 p-4 rounded-3xl items-center"
              >
                <ClipboardList size={20} color="white" />
                <Text className="text-white font-bold text-xs uppercase mt-2">Assignments</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("MockInterviews")}
                className="flex-1 bg-blue-600 p-4 rounded-3xl items-center"
              >
                <Video size={20} color="white" />
                <Text className="text-white font-bold text-xs uppercase mt-2">Interviews</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-sm font-black text-slate-500 uppercase tracking-wider mb-3">My Learning Path</Text>

            {isLoading ? (
              <View className="gap-4">
                <Skeleton height={140} className="rounded-3xl" />
                <Skeleton height={140} className="rounded-3xl" />
              </View>
            ) : enrollments.length === 0 ? (
              <View className="bg-white p-8 rounded-3xl border border-slate-100 items-center justify-center">
                <BookOpen size={42} color={COLORS.slate300} />
                <Text className="text-slate-600 font-semibold mt-4 text-center">
                  You have no active enrollments yet. Explore courses to begin.
                </Text>
              </View>
            ) : (
              enrollments.map((enr, i) => {
                const courseRef = enr?.courses || enr?.course;
                const enrollmentId = enr?.id || enr?._id || i;

                return (
                  <TouchableOpacity
                    key={enrollmentId}
                    onPress={() => {
                      const idOrSlug = courseRef?.slug || courseRef?.id || courseRef?._id;
                      if (idOrSlug) {
                        navigation.navigate("CourseDetail", { idOrSlug, isEnrolled: true });
                      }
                    }}
                    className="bg-white p-5 rounded-3xl mb-4 border border-slate-100 shadow-sm"
                  >
                    <Text className="font-black text-slate-900 text-base" numberOfLines={1}>
                      {courseRef?.title || "Enrolled Course"}
                    </Text>
                    <Text className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Continue where you left off</Text>

                    <View className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                      <View className="bg-blue-600 h-full" style={{ width: `${enr.progress || 0}%` }} />
                    </View>

                    <View className="flex-row items-center justify-between mt-3">
                      <Text className="text-xs text-slate-500 font-bold">{enr.progress || 0}% complete</Text>
                      <Text className="text-xs text-blue-600 font-black uppercase">Open course</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
