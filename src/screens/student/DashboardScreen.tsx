import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { enrollmentsApi } from "../../api/endpoints";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { BookOpen, Trophy, Clock } from "lucide-react-native";
import { Skeleton } from "../../components/Skeleton";
import { COLORS } from "../../utils/theme";
import { extractApiData, isApiSuccess } from "../../api/response";

export default function DashboardScreen({ navigation }: any) {
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

  return (
    <SafeAreaWrapper>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="mb-8">
          <Text className="text-2xl font-bold text-slate-900 mb-1">
            Hi, {user?.name?.split(" ")[0]}! 👋
          </Text>
          <Text className="text-slate-500 font-medium">Ready to learn today?</Text>
        </View>

        {/* Stats Row */}
        <View className="flex-row justify-between mb-8">
          {[
            { label: "Enrolled", value: enrollments.length || 0, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-100" },
            { label: "Completed", value: 0, icon: Trophy, color: "text-amber-500", bg: "bg-amber-100" },
            { label: "Hours", value: 0, icon: Clock, color: "text-emerald-500", bg: "bg-emerald-100" },
          ].map((stat, idx) => (
            <TouchableOpacity 
              key={idx} 
              onPress={() => idx === 1 ? navigation.navigate("MockInterviews") : null}
              className="bg-white flex-1 mx-1.5 p-4 rounded-3xl items-center shadow-sm border border-slate-100"
            >
              <View className={`${stat.bg} p-2 rounded-full mb-2`}>
                <stat.icon size={20} className={stat.color} />
              </View>
              <Text className="text-2xl font-black text-slate-900">{stat.value}</Text>
              <Text className="text-xs font-semibold text-slate-500">{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-lg font-bold text-slate-900 mb-4">My Learning</Text>

        {isLoading ? (
          <View className="gap-4">
            <Skeleton height={140} className="rounded-3xl" />
            <Skeleton height={140} className="rounded-3xl" />
          </View>
        ) : enrollments.length === 0 ? (
          <View className="bg-white p-8 rounded-3xl border border-slate-100 items-center justify-center">
             <BookOpen size={48} color={COLORS.slate300} />
             <Text className="text-slate-600 font-medium mt-4 text-center">
               You haven't enrolled in any courses yet.
             </Text>
          </View>
        ) : (
          enrollments.map((enr, i) => {
            const courseRef = enr?.courses || enr?.course;
            const enrollmentId = enr?.id || enr?._id || i;

            return (
            <TouchableOpacity 
              key={enrollmentId} 
              onPress={() => courseRef?.slug && navigation.navigate("CourseDetail", { slug: courseRef.slug })}
              className="bg-white p-4 rounded-3xl mb-4 border border-slate-100 shadow-sm flex-row"
            >
               <View className="w-20 h-20 bg-slate-100 rounded-2xl mr-4" />
               <View className="flex-1 justify-center">
                  <Text className="font-bold text-slate-900 text-base" numberOfLines={2}>
                    {courseRef?.title || "Enrolled Course"}
                  </Text>
                  <View className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                    <View className="bg-blue-600 h-full" style={{ width: `${enr.progress || 0}%` }} />
                  </View>
                  <Text className="text-xs text-slate-500 font-semibold mt-1">{enr.progress || 0}% Complete</Text>
               </View>
            </TouchableOpacity>
          );
          })
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
}
