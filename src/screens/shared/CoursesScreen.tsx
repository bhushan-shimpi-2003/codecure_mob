import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, RefreshControl, useWindowDimensions } from "react-native";
import { enrollmentsApi } from "../../api/endpoints";
import { CourseCard } from "../../components/CourseCard";
import { Input } from "../../components/Input";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { Search, BookOpen, CheckCircle2 } from "lucide-react-native";
import { Skeleton } from "../../components/Skeleton";
import { COLORS } from "../../utils/theme";
import { extractApiData, isApiSuccess } from "../../api/response";
import { StudentScreenHeader } from "../../components/StudentScreenHeader";
import { StudentStatCard } from "../../components/StudentStatCard";

export default function CoursesScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 30 : 24;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCourses = async () => {
    try {
      const enrollmentsRes = await enrollmentsApi.myEnrollments();
      const payload = enrollmentsRes.data;
      if (isApiSuccess(payload)) {
        const data = extractApiData<any[]>(payload, []);
        setEnrollments(Array.isArray(data) ? data : []);
      } else {
        setEnrollments([]);
      }
    } catch (e) {
      console.log("Failed to load courses", e);
      setEnrollments([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  const gridItemWidth = "48.5%";

  const enrolledCourses = enrollments
    .map((enr) => ({
      enrollment: enr,
      course: enr?.courses || enr?.course,
    }))
    .filter((entry) => entry.course)
    .filter((entry) =>
      String(entry.course?.title || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  const activeEnrolledCount = useMemo(
    () =>
      enrollments.filter((item) => {
        const status = String(item?.student_status || item?.status || "").toLowerCase();
        return status === "active" || status === "approved";
      }).length,
    [enrollments]
  );

  return (
    <SafeAreaWrapper>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: isTablet ? 34 : 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }}>
          <StudentScreenHeader
            badge="Student Workspace"
            title="My Courses"
            subtitle="Track and continue your enrolled learning paths"
          />

          <View style={{ paddingHorizontal: horizontalPadding }} className="pt-1 pb-2 flex-row flex-wrap justify-between">
            <StudentStatCard label="Enrolled" value={enrollments.length} Icon={BookOpen} tone="blue" />
            <StudentStatCard label="Active" value={activeEnrolledCount} Icon={CheckCircle2} tone="emerald" />
          </View>

          <View style={{ paddingHorizontal: horizontalPadding, paddingTop: 12 }}>
            <Input
              placeholder="Search courses..."
              value={search}
              onChangeText={setSearch}
              leftIcon={<Search size={20} color={COLORS.slate400} />}
            />

            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-black text-slate-500 uppercase tracking-widest">Enrolled Courses</Text>
              <Text className="text-[11px] font-black text-blue-600 uppercase tracking-wider">{enrolledCourses.length}</Text>
            </View>
            <Text className="text-slate-400 text-xs mb-3">Courses approved for your learning path</Text>
            {isLoading ? (
              <View className="flex-row flex-wrap justify-between mt-2 mb-4">
                <View style={{ width: gridItemWidth }}>
                  <Skeleton height={280} className="rounded-3xl" />
                </View>
                <View style={{ width: gridItemWidth }}>
                  <Skeleton height={280} className="rounded-3xl" />
                </View>
              </View>
            ) : enrollments.length === 0 ? (
              <View className="bg-white rounded-2xl border border-slate-100 px-4 py-4 mb-4">
                <Text className="text-slate-500 text-sm">You are not enrolled yet. Explore and request access below.</Text>
              </View>
            ) : enrolledCourses.length === 0 ? (
              <View className="bg-white rounded-2xl border border-slate-100 px-4 py-4 mb-4">
                <Text className="text-slate-500 text-sm">No enrolled course matches your search.</Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {enrolledCourses.map((entry, i) => {
                  const enr = entry.enrollment;
                  const courseRef = entry.course;
                  const idOrSlug = courseRef?.slug || courseRef?.id || courseRef?._id;
                  return (
                    <View key={String(enr?.id || enr?._id || i)} style={{ width: gridItemWidth }}>
                      <CourseCard
                        course={courseRef || { title: "Enrolled Course" }}
                        isEnrolled
                        onPress={() => {
                          if (idOrSlug) {
                            navigation.navigate("CourseDetail", { idOrSlug, isEnrolled: true });
                          }
                        }}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
