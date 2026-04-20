import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
  useWindowDimensions,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { 
  Calendar, 
  Video, 
  Clock, 
  ChevronRight,
  ExternalLink,
  Award
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { Button } from "../../components/Button";
import { interviewsApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { Skeleton } from "../../components/Skeleton";
import { StudentScreenHeader } from "../../components/StudentScreenHeader";
import { StudentStatCard } from "../../components/StudentStatCard";
import { useAuth } from "../../context/AuthContext";
import { AppHeader } from "../../components/AppHeader";

export default function MockInterviewsScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 30 : 24;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const [interviews, setInterviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInterviews = async () => {
    try {
      const res = await interviewsApi.myInterviews();
      const payload = res.data;
      if (isApiSuccess(payload)) {
        const data = extractApiData<any[]>(payload, []);
        setInterviews(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.log("Error loading interviews", e);
      setInterviews([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInterviews();
  };

  const { upcoming, completed } = useMemo(() => {
    const now = Date.now();
    const all = Array.isArray(interviews) ? interviews : [];

    const nextUpcoming = all
      .filter((item) => {
        if (item?.status === "completed") return false;
        if (!item?.scheduled_at) return false;
        return new Date(item.scheduled_at).getTime() >= now;
      })
      .sort(
        (a, b) =>
          new Date(a?.scheduled_at || 0).getTime() -
          new Date(b?.scheduled_at || 0).getTime()
      );

    const completedItems = all
      .filter((item) => item?.status === "completed")
      .sort(
        (a, b) =>
          new Date(b?.scheduled_at || 0).getTime() -
          new Date(a?.scheduled_at || 0).getTime()
      );

    return {
      upcoming: nextUpcoming[0] || null,
      completed: completedItems,
    };
  }, [interviews]);

  const handleJoin = async (meetingLink?: string) => {
    if (!meetingLink) {
      Alert.alert("Missing link", "Meeting link is not available yet.");
      return;
    }

    const canOpen = await Linking.canOpenURL(meetingLink);
    if (!canOpen) {
      Alert.alert("Invalid link", "Could not open meeting link.");
      return;
    }

    await Linking.openURL(meetingLink);
  };

  const formatDate = (value?: string) => {
    if (!value) return "Date TBA";
    return new Date(value).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (value?: string) => {
    if (!value) return "Time TBA";
    return new Date(value).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const { user } = useAuth();

  return (
    <SafeAreaWrapper>
      <AppHeader role={user?.role} subtitle="Interviews" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: isTablet ? 34 : 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }}>
          <StudentScreenHeader
            badge="Student Workspace"
            title="Mock Interviews"
            subtitle="Practice under pressure and sharpen interview confidence"
          />

          <View style={{ paddingHorizontal: horizontalPadding }} className="pt-1 pb-2 flex-row flex-wrap justify-between">
            <StudentStatCard label="Upcoming" value={upcoming ? 1 : 0} Icon={Calendar} tone="blue" />
            <StudentStatCard label="Completed" value={completed.length} Icon={Award} tone="emerald" />
          </View>

          <View style={{ paddingHorizontal: horizontalPadding, paddingTop: 12 }}>
            <View className="mb-8">
              <Text className="text-sm font-black text-slate-500 uppercase tracking-wider mb-3">Upcoming Session</Text>
              {isLoading ? (
                <Skeleton height={180} className="rounded-[32px]" />
              ) : upcoming ? (
                <View className="bg-slate-900 p-6 rounded-[32px] shadow-xl">
                  <View className="flex-row justify-between items-start mb-6">
                    <View className="flex-1 mr-4">
                      <Text className="text-white text-xl font-black mb-1">{upcoming.title || "Upcoming Mock"}</Text>
                      <View className="flex-row items-center">
                        <Calendar size={14} color="rgba(255,255,255,0.6)" />
                        <Text className="text-white/60 text-xs font-bold ml-1">{formatDate(upcoming.scheduled_at)}</Text>
                        <View className="w-1 h-1 bg-white/30 rounded-full mx-2" />
                        <Clock size={14} color="rgba(255,255,255,0.6)" />
                        <Text className="text-white/60 text-xs font-bold ml-1">{formatTime(upcoming.scheduled_at)}</Text>
                      </View>
                    </View>
                    <View className="bg-blue-600 p-3 rounded-2xl">
                      <Video color="white" size={24} />
                    </View>
                  </View>

                  <Button
                    title="Join Meeting"
                    className="bg-white"
                    textClassName="text-slate-900"
                    onPress={() => handleJoin(upcoming.meeting_link)}
                    leftIcon={<ExternalLink size={18} color={COLORS.slate900} />}
                  />
                </View>
              ) : (
                <View className="bg-white p-8 rounded-[32px] border border-slate-100 items-center">
                  <Calendar size={32} color={COLORS.slate300} />
                  <Text className="text-slate-500 font-bold mt-4">No upcoming sessions scheduled.</Text>
                </View>
              )}
            </View>

            <Text className="text-sm font-black text-slate-500 uppercase tracking-wider mb-3">Past Interviews</Text>

            {completed.map((item, index) => (
              <View key={String(item?.id || item?._id || index)} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm mb-4 flex-row items-center">
                <View className="bg-emerald-50 w-14 h-14 rounded-2xl items-center justify-center mr-4">
                  <Award size={24} color={COLORS.success} />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-slate-900 text-base">{item.title}</Text>
                  <Text className="text-xs text-slate-500 font-bold uppercase mt-1">Score: {item?.score ?? "N/A"}/10</Text>
                </View>
                <TouchableOpacity className="bg-slate-50 p-2 rounded-xl">
                  <ChevronRight size={18} color={COLORS.slate300} />
                </TouchableOpacity>
              </View>
            ))}

            {!isLoading && completed.length === 0 ? (
              <View className="bg-white p-6 rounded-[32px] border border-slate-100 mb-4">
                <Text className="text-slate-500 font-medium text-center">No completed interviews yet.</Text>
              </View>
            ) : null}

            <TouchableOpacity className="mt-6 border-2 border-dashed border-slate-200 p-8 rounded-[32px] items-center justify-center bg-white">
              <Calendar size={32} color={COLORS.slate300} />
              <Text className="text-slate-500 font-bold mt-4">Your next schedule appears here</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
