import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { coursesApi } from "../../api/endpoints";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
import { Skeleton } from "../../components/Skeleton";
import { BookOpenCheck, Trash2, ExternalLink } from "lucide-react-native";
import { Button } from "../../components/Button";
import { COLORS } from "../../utils/theme";

export default function AdminContentScreen({ navigation }: any) {
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchCourses = async () => {
    setErrorMessage(null);
    try {
      const res = await coursesApi.adminAll();
      if (isApiSuccess(res.data)) {
        const data = extractApiData<any[]>(res.data, []);
        setCourses(Array.isArray(data) ? data : []);
      } else {
        setCourses([]);
        setErrorMessage(getApiError(res.data));
      }
    } catch (e) {
      console.log("Error loading content audit", e);
      setCourses([]);
      setErrorMessage("Failed to load course audit data");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const stats = useMemo(() => {
    const total = courses.length;
    const active = courses.filter((item) => item?.status === "active").length;
    const draft = courses.filter((item) => item?.status === "draft").length;
    return { total, active, draft };
  }, [courses]);

  const deleteCourse = (id: string) => {
    Alert.alert("Delete course", "Do you want to permanently delete this course?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await coursesApi.delete(id);
            if (isApiSuccess(res.data)) {
              fetchCourses();
            } else {
              setErrorMessage(getApiError(res.data));
            }
          } catch (e) {
            console.log("Error deleting course", e);
            setErrorMessage("Failed to delete course");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaWrapper>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchCourses();
            }}
          />
        }
      >
        <View className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-black text-slate-900">Content Oversight</Text>
          <Text className="text-slate-500 mt-1">Audit and moderate courses across the platform</Text>
        </View>

        <View className="px-6 pt-2 pb-4 flex-row gap-3">
          <View className="flex-1 bg-white rounded-2xl border border-slate-100 p-4">
            <Text className="text-xs text-slate-500 uppercase font-black tracking-wider">Total</Text>
            <Text className="text-2xl font-black text-slate-900 mt-1">{stats.total}</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl border border-slate-100 p-4">
            <Text className="text-xs text-slate-500 uppercase font-black tracking-wider">Active</Text>
            <Text className="text-2xl font-black text-emerald-600 mt-1">{stats.active}</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl border border-slate-100 p-4">
            <Text className="text-xs text-slate-500 uppercase font-black tracking-wider">Draft</Text>
            <Text className="text-2xl font-black text-amber-600 mt-1">{stats.draft}</Text>
          </View>
        </View>

        {errorMessage ? (
          <View className="mx-6 mb-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Text className="text-amber-700 text-sm font-semibold">{errorMessage}</Text>
          </View>
        ) : null}

        <View style={{ padding: 24, paddingTop: 12 }}>
          {isLoading ? (
            <View className="gap-4">
              <Skeleton height={150} className="rounded-3xl" />
              <Skeleton height={150} className="rounded-3xl" />
            </View>
          ) : courses.length === 0 ? (
            <View className="bg-white border border-slate-100 rounded-3xl p-8 items-center justify-center">
              <BookOpenCheck size={36} color={COLORS.slate300} />
              <Text className="text-slate-600 font-bold mt-3">No courses found</Text>
            </View>
          ) : (
            courses.map((course, index) => {
              const courseId = String(course?.id || course?._id || index);
              const idOrSlug = course?.slug || course?.id || course?._id;
              return (
                <View key={courseId} className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 mb-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                      <Text className="text-slate-900 text-base font-black" numberOfLines={1}>
                        {course?.title || "Untitled course"}
                      </Text>
                      <Text className="text-slate-500 text-sm mt-1" numberOfLines={2}>
                        {course?.description || "No description"}
                      </Text>
                      <View className="mt-3 self-start px-2 py-1 rounded-lg bg-slate-100">
                        <Text className="text-slate-700 text-[10px] font-black uppercase">{course?.status || "unknown"}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => deleteCourse(courseId)}
                      className="bg-rose-50 p-2 rounded-lg"
                    >
                      <Trash2 size={16} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>

                  <Button
                    title="Open Course"
                    className="mt-4 h-10"
                    textClassName="text-xs"
                    leftIcon={<ExternalLink size={14} color={COLORS.white} />}
                    onPress={() => {
                      if (idOrSlug) {
                        navigation.navigate("CourseDetail", { idOrSlug });
                      }
                    }}
                  />
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
