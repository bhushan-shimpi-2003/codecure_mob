import React, { useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { coursesApi } from "../../api/endpoints";
import { CourseCard } from "../../components/CourseCard";
import { Input } from "../../components/Input";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { Search } from "lucide-react-native";
import { Skeleton } from "../../components/Skeleton";
import { COLORS } from "../../utils/theme";
import { extractApiData, isApiSuccess } from "../../api/response";

export default function CoursesScreen({ navigation }: any) {
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCourses = async () => {
    try {
      const res = await coursesApi.list();
      const payload = res.data;
      if (isApiSuccess(payload)) {
        const data = extractApiData<any[]>(payload, []);
        setCourses(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.log("Failed to load courses", e);
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

  const filtered = courses.filter((c) =>
    (c?.title || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaWrapper>
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-slate-900 mb-4">Explore Courses</Text>
        <Input
          placeholder="Search for courses..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={20} color={COLORS.slate400} />}
          className="mb-2"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item, index) => String(item?.id || item?._id || item?.slug || index)}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <CourseCard
            course={item}
              onPress={() => item?.slug && navigation.navigate("CourseDetail", { slug: item.slug })}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <View className="gap-6 mt-4">
              <Skeleton height={280} className="rounded-3xl" />
              <Skeleton height={280} className="rounded-3xl" />
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-slate-500 font-medium text-lg">No courses found.</Text>
            </View>
          )
        }
      />
    </SafeAreaWrapper>
  );
}
