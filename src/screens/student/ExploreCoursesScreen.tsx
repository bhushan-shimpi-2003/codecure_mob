import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl, useWindowDimensions, TouchableOpacity, TextInput, FlatList } from "react-native";
import { coursesApi, enrollmentsApi } from "../../api/endpoints";
import { CourseCard } from "../../components/CourseCard";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { Search, BookOpen, Layers, Sparkles, Filter, ChevronRight } from "lucide-react-native";
import { Skeleton } from "../../components/Skeleton";
import { COLORS } from "../../utils/theme";
import { extractApiData, isApiSuccess } from "../../api/response";
import { useAuth } from "../../context/AuthContext";
import { AppHeader } from "../../components/AppHeader";
import { Course, Enrollment } from "../../types";
import { AppNavigationProp } from "../../types/navigation";

export default function ExploreCoursesScreen({ navigation }: { navigation: AppNavigationProp }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All Courses");

  const CATEGORIES = ["All Courses", "Beginner", "Intermediate", "Advanced"];

  const fetchCourses = async () => {
    try {
      const [coursesRes, enrollmentsRes] = await Promise.allSettled([
        coursesApi.list(),
        enrollmentsApi.myEnrollments(),
      ]);

      if (coursesRes.status === "fulfilled" && isApiSuccess(coursesRes.value.data)) {
        setCourses(extractApiData<any[]>(coursesRes.value.data, []));
      }

      if (enrollmentsRes.status === "fulfilled" && isApiSuccess(enrollmentsRes.value.data)) {
        setEnrollments(extractApiData<any[]>(enrollmentsRes.value.data, []));
      }
    } catch (e) {
      console.log("Failed to load explore courses", e);
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
            const courseRef = enr?.course_details || (enr as any)?.course || (enr as any)?.courses;
            return String(courseRef?.id || courseRef?._id || "");
          })
          .filter(Boolean)
      ),
    [enrollments]
  );

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch = String(course?.title || "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "All Courses" || (course.level || "").toLowerCase() === activeCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [courses, search, activeCategory]);

  const { user } = useAuth();

  const renderHeader = useCallback(() => (
    <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }}>
      <View className="px-6 pt-10 mb-10">
        <View className="flex-row items-center gap-2 mb-4">
          <View className="bg-blue-100 px-4 py-1.5 rounded-full">
            <Text className="text-blue-700 text-[10px] font-black uppercase tracking-widest">Academy Catalog</Text>
          </View>
          <Sparkles size={14} color="#3B82F6" />
        </View>
        <Text className="text-[40px] font-black text-slate-900 leading-[44px] tracking-tight">
            Elevate Your{"\n"}
            <Text className="text-blue-600">Engineering</Text> Craft.
        </Text>
        <Text className="text-slate-400 mt-4 text-base font-bold leading-6 max-w-[90%]">
            Curated paths designed for the modern scholar. From foundational logic to distributed systems.
        </Text>
      </View>

      {/* Search & Filter Bar */}
      <View className="px-6 mb-10">
         <View className="flex-row items-center bg-white px-6 py-5 rounded-[28px] border border-slate-100 shadow-2xl shadow-slate-900/[0.03]">
            <Search size={20} color="#94A3B8" className="mr-4" />
            <TextInput 
              placeholder="Search for your next mastery..."
              className="flex-1 text-slate-900 font-black text-[14px]"
              placeholderTextColor="#CBD5E1"
              value={search}
              onChangeText={setSearch}
            />
            <View className="w-[1px] h-6 bg-slate-100 mx-4" />
            <Filter size={20} color="#64748B" />
         </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="mb-10"
        contentContainerStyle={{ paddingHorizontal: 24 }}
      >
        {CATEGORIES.map((cat: string) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setActiveCategory(cat)}
            className={`mr-4 px-8 py-4 rounded-[20px] border-2 ${activeCategory === cat ? 'bg-slate-900 border-slate-900 shadow-xl shadow-slate-200' : 'bg-white border-slate-50'}`}
          >
            <Text className={`font-black text-xs uppercase tracking-widest ${activeCategory === cat ? 'text-white' : 'text-slate-400'}`}>
                {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading && (
        <View className="px-6 gap-8 pb-10">
          <Skeleton height={400} className="rounded-[48px]" />
          <Skeleton height={400} className="rounded-[48px]" />
        </View>
      )}

      {!isLoading && filteredCourses.length === 0 && (
        <View className="mx-6 items-center justify-center py-24 bg-white border border-dashed border-slate-200 rounded-[56px]">
          <View className="w-24 h-24 bg-slate-50 rounded-full items-center justify-center mb-8">
            <Layers size={40} color="#CBD5E1" />
          </View>
          <Text className="text-slate-400 font-black text-xl tracking-tight">No content discovered</Text>
          <Text className="text-slate-300 text-[10px] mt-2 font-black uppercase tracking-[2px]">Refine your search parameters</Text>
        </View>
      )}
    </View>
  ), [shellMaxWidth, activeCategory, isLoading, filteredCourses, search]);

  const renderCourseItem = useCallback(({ item }: { item: Course }) => {
    const isEnrolled = enrolledCourseIds.has(String(item?.id || item?._id || ""));
    return (
      <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
        <CourseCard
          course={item}
          isEnrolled={isEnrolled}
          onPress={() => {
            const idOrSlug = item?.slug || item?.id || item?._id;
            if (idOrSlug) navigation.navigate("CourseDetail", { idOrSlug, isEnrolled });
          }}
        />
      </View>
    );
  }, [navigation, enrolledCourseIds]);

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} role={user?.role} />
      <FlatList
        data={isLoading ? [] : filteredCourses}
        renderItem={renderCourseItem}
        keyExtractor={(item) => String(item?.id || item?._id || item?.slug)}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1 bg-[#F8FAFC]"
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaWrapper>
  );
}
