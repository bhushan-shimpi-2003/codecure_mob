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
import { useAuth } from "../../context/AuthContext";
import { AppHeader } from "../../components/AppHeader";

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

  const { user } = useAuth();

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader role={user?.role} subtitle="Workplace" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: isTablet ? 34 : 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }}>
          
          <View className="px-6 pt-8 mb-4">
             <View className="bg-emerald-50 px-3 py-1 rounded-lg self-start mb-4">
                <Text className="text-emerald-600 font-extrabold text-[10px] uppercase tracking-widest">Active Workplace</Text>
             </View>
             <Text className="text-[34px] font-black text-slate-900 leading-tight">
                My{"\n"}
                <Text className="text-blue-600">Learning</Text> Paths.
            </Text>
          </View>

          <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
            <Input
              placeholder="Search your courses..."
              value={search}
              onChangeText={setSearch}
              leftIcon={<Search size={20} color={COLORS.slate400} />}
            />

            <View className="flex-row items-center justify-between mb-4 mt-2">
              <Text className="text-xs font-black text-slate-500 uppercase tracking-widest">Enrolled Courses</Text>
              <View className="bg-blue-600 px-2 py-0.5 rounded-md">
                <Text className="text-[10px] font-black text-white uppercase tracking-wider">{enrolledCourses.length}</Text>
              </View>
            </View>

            {isLoading ? (
                <View className="gap-6">
                    <Skeleton height={280} className="rounded-[40px]" />
                    <Skeleton height={280} className="rounded-[40px]" />
                </View>
            ) : enrollments.length === 0 ? (
              <View className="bg-white rounded-[40px] border border-slate-100 p-10 items-center justify-center">
                <BookOpen size={48} color={COLORS.slate200} />
                <Text className="text-slate-500 font-bold mt-4 text-center">You haven't joined any courses yet. Check the catalog!</Text>
              </View>
            ) : enrolledCourses.length === 0 ? (
              <View className="bg-white rounded-[40px] border border-slate-100 p-10 items-center justify-center">
                <Text className="text-slate-400 font-bold text-center">No match found in your library.</Text>
              </View>
            ) : (
              <View>
                {enrolledCourses.map((entry, i) => {
                  const enr = entry.enrollment;
                  const courseRef = entry.course;
                  const idOrSlug = courseRef?.slug || courseRef?.id || courseRef?._id;
                  return (
                      <CourseCard
                        key={String(enr?.id || enr?._id || i)}
                        course={courseRef || { title: "Enrolled Course" }}
                        isEnrolled
                        onPress={() => {
                          if (idOrSlug) {
                            navigation.navigate("CourseDetail", { idOrSlug, isEnrolled: true });
                          }
                        }}
                      />
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

