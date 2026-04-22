import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, RefreshControl, useWindowDimensions, TouchableOpacity } from "react-native";
import { coursesApi, enrollmentsApi } from "../../api/endpoints";
import { CourseCard } from "../../components/CourseCard";
import { Input } from "../../components/Input";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { Search, BookOpen, Layers } from "lucide-react-native";
import { Skeleton } from "../../components/Skeleton";
import { COLORS } from "../../utils/theme";
import { extractApiData, isApiSuccess } from "../../api/response";
import { StudentStatCard } from "../../components/StudentStatCard";
import { useAuth } from "../../context/AuthContext";
import { AppHeader } from "../../components/AppHeader";
import { Course, Enrollment } from "../../types";
import { AppNavigationProp } from "../../types/navigation";
import { FlatList } from "react-native-gesture-handler";

export default function ExploreCoursesScreen({ navigation }: { navigation: AppNavigationProp }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 30 : 24;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
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

  const CATEGORIES = ["All Courses", "Beginner", "Intermediate", "Advanced"];
  const [activeCategory, setActiveCategory] = useState("All Courses");

  const filteredByCategory = useMemo(() => {
    if (activeCategory === "All Courses") return notEnrolledCourses;
    return notEnrolledCourses.filter(c => (c.level || "").toLowerCase() === activeCategory.toLowerCase());
  }, [notEnrolledCourses, activeCategory]);

  const finalFiltered = useMemo(
    () =>
      filteredByCategory.filter((course) =>
        String(course?.title || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [filteredByCategory, search]
  );

  const featuredCourse = useMemo(() => finalFiltered[0], [finalFiltered]);
  const otherCourses = useMemo(() => finalFiltered.slice(1), [finalFiltered]);

  const { user } = useAuth();

  const renderHeader = useCallback(() => (
    <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }}>
      <View className="px-6 pt-8 mb-8">
        <View className="bg-blue-50 px-3 py-1 rounded-lg self-start mb-4">
          <Text className="text-blue-600 font-extrabold text-[10px] uppercase tracking-widest">Learning Catalog</Text>
        </View>
        <Text className="text-[34px] font-black text-slate-900 leading-tight">
            Elevate your{"\n"}
            <Text className="text-blue-600">Engineering</Text> craft.
        </Text>
        <Text className="text-slate-500 mt-4 text-[15px] leading-6 max-w-[90%]">
            Curated paths designed for the modern scholar. From foundational logic to distributed systems.
        </Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="mb-8"
        contentContainerStyle={{ paddingHorizontal: 24 }}
      >
        {CATEGORIES.map((cat: string) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setActiveCategory(cat)}
            className={`mr-3 px-6 py-3 rounded-2xl border ${activeCategory === cat ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-200' : 'bg-slate-100 border-slate-100'}`}
          >
            <Text className={`font-black text-xs ${activeCategory === cat ? 'text-white' : 'text-slate-500'}`}>
                {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading && (
        <View className="px-6 gap-6">
          <Skeleton height={350} className="rounded-[40px]" />
          <Skeleton height={250} className="rounded-[40px]" />
        </View>
      )}

      {!isLoading && finalFiltered.length === 0 && (
        <View className="mx-6 items-center justify-center py-20 bg-white border border-slate-100 rounded-[40px]">
          <Layers size={48} color={COLORS.slate200} />
          <Text className="text-slate-400 font-bold mt-4">No content matches this criteria</Text>
        </View>
      )}
    </View>
  ), [shellMaxWidth, activeCategory, isLoading, finalFiltered]);

  const renderCourseItem = useCallback(({ item }: { item: Course }) => (
    <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
      <CourseCard
        course={item}
        onPress={() => {
          const idOrSlug = item?.slug || item?.id || item?._id;
          if (idOrSlug) navigation.navigate("CourseDetail", { idOrSlug, isEnrolled: false });
        }}
      />
    </View>
  ), [navigation]);

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} role={user?.role} subtitle="Catalog" />
      <FlatList
        data={isLoading ? [] : finalFiltered}
        renderItem={renderCourseItem}
        keyExtractor={(item) => String(item?.id || item?._id || item?.slug)}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: isTablet ? 34 : 24 }}
        className="flex-1"
      />
    </SafeAreaWrapper>
  );
}

