import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, RefreshControl, useWindowDimensions } from "react-native";
import { coursesApi, enrollmentsApi } from "../../api/endpoints";
import { CourseCard } from "../../components/CourseCard";
import { Input } from "../../components/Input";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { Search, BookOpen, Layers } from "lucide-react-native";
import { Skeleton } from "../../components/Skeleton";
import { COLORS } from "../../utils/theme";
import { extractApiData, isApiSuccess } from "../../api/response";
import { StudentScreenHeader } from "../../components/StudentScreenHeader";
import { StudentStatCard } from "../../components/StudentStatCard";

export default function ExploreCoursesScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 30 : 24;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCourses = async () => {
    try {
      const [coursesRes, enrollmentsRes] = await Promise.allSettled([
        coursesApi.list(),
        enrollmentsApi.myEnrollments(),
      ]);

      if (coursesRes.status === "fulfilled") {
        const payload = coursesRes.value.data;
        if (isApiSuccess(payload)) {
          const data = extractApiData<any[]>(payload, []);
          setCourses(Array.isArray(data) ? data : []);
        } else {
          setCourses([]);
        }
      } else {
        setCourses([]);
      }

      if (enrollmentsRes.status === "fulfilled") {
        const payload = enrollmentsRes.value.data;
        if (isApiSuccess(payload)) {
          const data = extractApiData<any[]>(payload, []);
          setEnrollments(Array.isArray(data) ? data : []);
        } else {
          setEnrollments([]);
        }
      } else {
        setEnrollments([]);
      }
    } catch (e) {
      console.log("Failed to load explore courses", e);
      setCourses([]);
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

  const enrolledCourseIds = useMemo(
    () =>
      new Set(
        enrollments
          .map((enr) => {
            const courseRef = enr?.courses || enr?.course;
            return String(courseRef?.id || courseRef?._id || "");
          })
          .filter(Boolean)
      ),
    [enrollments]
  );

  const notEnrolledCourses = useMemo(
    () =>
      courses.filter((course) => {
        const courseId = String(course?.id || course?._id || "");
        return courseId ? !enrolledCourseIds.has(courseId) : true;
      }),
    [courses, enrolledCourseIds]
  );

  const filteredCourses = useMemo(
    () =>
      notEnrolledCourses.filter((course) =>
        String(course?.title || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [notEnrolledCourses, search]
  );

  const gridItemWidth = "48.5%";

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
            title="Courses"
            subtitle="Browse courses not enrolled yet and filter quickly"
          />

          <View style={{ paddingHorizontal: horizontalPadding }} className="pt-1 pb-2 flex-row flex-wrap justify-between">
            <StudentStatCard label="Available" value={notEnrolledCourses.length} Icon={BookOpen} tone="blue" />
            <StudentStatCard label="Filtered" value={filteredCourses.length} Icon={Layers} tone="slate" />
          </View>

          <View style={{ paddingHorizontal: horizontalPadding, paddingTop: 12 }}>
            <Input
              placeholder="Filter courses..."
              value={search}
              onChangeText={setSearch}
              leftIcon={<Search size={20} color={COLORS.slate400} />}
            />

            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-black text-slate-500 uppercase tracking-widest">Available Courses</Text>
              <Text className="text-[11px] font-black text-slate-500 uppercase tracking-wider">{filteredCourses.length}</Text>
            </View>
            <Text className="text-slate-400 text-xs mb-2">Only courses you are not enrolled in are listed here</Text>

            {isLoading ? (
              <View className="flex-row flex-wrap justify-between mt-2">
                <View style={{ width: gridItemWidth }}>
                  <Skeleton height={280} className="rounded-3xl" />
                </View>
                <View style={{ width: gridItemWidth }}>
                  <Skeleton height={280} className="rounded-3xl" />
                </View>
              </View>
            ) : filteredCourses.length === 0 ? (
              <View className="flex-1 items-center justify-center py-10 bg-white border border-slate-100 rounded-3xl">
                <Text className="text-slate-500 font-semibold text-center">No courses match your filter.</Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {filteredCourses.map((item, index) => (
                  <View key={String(item?.id || item?._id || item?.slug || index)} style={{ width: gridItemWidth }}>
                    <CourseCard
                      course={item}
                      onPress={() => {
                        const idOrSlug = item?.slug || item?.id || item?._id;
                        if (idOrSlug) {
                          navigation.navigate("CourseDetail", { idOrSlug, isEnrolled: false });
                        }
                      }}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
