import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Linking,
  Alert,
  useWindowDimensions,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { interviewsApi } from "../../api/endpoints";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
import { Skeleton } from "../../components/Skeleton";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import {
  CalendarClock,
  ExternalLink,
  CircleCheckBig,
  CalendarPlus,
  User,
  ClipboardList,
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { TeacherScreenHeader } from "../../components/TeacherScreenHeader";
import { TeacherStatCard } from "../../components/TeacherStatCard";

function toIsoString(input: string) {
  const parsed = new Date(input);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return input;
}

export default function TeacherInterviewsScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 30 : 24;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const [interviews, setInterviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("Mock Interview");
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  const fetchInterviews = async () => {
    setErrorMessage(null);
    try {
      const res = await interviewsApi.teacherInterviews();
      const payload = res.data;
      if (isApiSuccess(payload)) {
        const data = extractApiData<any[]>(payload, []);
        setInterviews(Array.isArray(data) ? data : []);
      } else {
        setInterviews([]);
        setErrorMessage(getApiError(payload));
      }
    } catch (e) {
      console.log("Error loading teacher interviews", e);
      setInterviews([]);
      setErrorMessage("Failed to load interviews");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const { upcoming, completedCount } = useMemo(() => {
    const now = Date.now();
    const all = Array.isArray(interviews) ? interviews : [];

    const upcomingItems = all
      .filter((item) => {
        if (item?.status === "completed" || item?.status === "cancelled") return false;
        const scheduleTime = item?.scheduled_at ? new Date(item.scheduled_at).getTime() : 0;
        return scheduleTime >= now;
      })
      .sort(
        (a, b) =>
          new Date(a?.scheduled_at || 0).getTime() -
          new Date(b?.scheduled_at || 0).getTime()
      );

    const completeCount = all.filter((item) => item?.status === "completed").length;

    return {
      upcoming: upcomingItems,
      completedCount: completeCount,
    };
  }, [interviews]);

  const formatDateTime = (value?: string) => {
    if (!value) return "Not scheduled";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Not scheduled";
    return parsed.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openMeetingLink = async (url?: string) => {
    if (!url) {
      Alert.alert("Missing meeting link", "No meeting link has been attached yet.");
      return;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("Invalid link", "Could not open the meeting link.");
      return;
    }

    await Linking.openURL(url);
  };

  const scheduleInterview = async () => {
    if (!studentId.trim() || !scheduledAt.trim()) {
      setErrorMessage("Student ID and scheduled time are required");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload: any = {
        title: title.trim() || "Mock Interview",
        student_id: studentId.trim(),
        scheduled_at: toIsoString(scheduledAt.trim()),
        interview_type: "Technical Round",
      };

      if (courseId.trim()) payload.course_id = courseId.trim();
      if (meetingLink.trim()) payload.meeting_link = meetingLink.trim();

      const res = await interviewsApi.schedule(payload);
      if (isApiSuccess(res.data)) {
        setModalVisible(false);
        setTitle("Mock Interview");
        setStudentId("");
        setCourseId("");
        setScheduledAt("");
        setMeetingLink("");
        fetchInterviews();
      } else {
        setErrorMessage(getApiError(res.data));
      }
    } catch (e) {
      console.log("Error scheduling interview", e);
      setErrorMessage("Failed to schedule interview");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: isTablet ? 32 : 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchInterviews();
            }}
          />
        }
      >
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }}>
          <TeacherScreenHeader
            badge="Teacher Workspace"
            title="Interview Calendar"
            subtitle="Plan, conduct, and close mock sessions efficiently"
            actionIcon={<CalendarPlus size={22} color={COLORS.white} />}
            onActionPress={() => setModalVisible(true)}
          />

          <View style={{ paddingHorizontal: horizontalPadding }} className="pt-1 pb-2 flex-row flex-wrap justify-between">
            <TeacherStatCard
              label="Upcoming"
              value={upcoming.length}
              Icon={CalendarClock}
              tone="blue"
            />
            <TeacherStatCard
              label="Completed"
              value={completedCount}
              Icon={CircleCheckBig}
              tone="emerald"
            />
          </View>

          {errorMessage ? (
            <View style={{ marginHorizontal: horizontalPadding }} className="mb-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <Text className="text-amber-700 text-sm font-semibold">{errorMessage}</Text>
            </View>
          ) : null}

          <View style={{ paddingHorizontal: horizontalPadding, paddingTop: 12 }}>
          {isLoading ? (
            <View className="gap-4">
              <Skeleton height={160} className="rounded-3xl" />
              <Skeleton height={160} className="rounded-3xl" />
            </View>
          ) : upcoming.length === 0 ? (
            <View className="bg-white border border-slate-100 rounded-3xl p-8 items-center justify-center">
              <CalendarClock size={36} color={COLORS.slate300} />
              <Text className="text-slate-600 font-bold mt-3">No interviews scheduled</Text>
              <Text className="text-slate-500 text-sm mt-1 text-center">
                Use the plus button to schedule your next mock interview.
              </Text>
            </View>
          ) : (
            upcoming.map((item, index) => {
              const id = String(item?.id || item?._id || index);
              const student = item?.profiles || item?.student || {};

              return (
                <View
                  key={id}
                  className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 mb-4"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                      <Text className="text-slate-900 text-base font-black" numberOfLines={1}>
                        {item?.title || "Mock Interview"}
                      </Text>
                      <Text className="text-slate-500 text-sm mt-1">{formatDateTime(item?.scheduled_at)}</Text>
                    </View>
                    <View className="bg-blue-50 px-2 py-1 rounded-lg">
                      <Text className="text-[10px] font-black uppercase text-blue-700">
                        {item?.status || "scheduled"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row mt-4 gap-3">
                    <View className="flex-row items-center flex-1">
                      <User size={14} color={COLORS.slate400} />
                      <Text className="text-xs text-slate-500 ml-1" numberOfLines={1}>
                        {student?.name || student?.email || item?.student_id || "Student"}
                      </Text>
                    </View>
                    <View className="flex-row items-center flex-1">
                      <ClipboardList size={14} color={COLORS.slate400} />
                      <Text className="text-xs text-slate-500 ml-1" numberOfLines={1}>
                        {item?.interview_type || "Technical Round"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-3 mt-4">
                    <Button
                      title="Join"
                      className="flex-1 h-10"
                      textClassName="text-sm"
                      onPress={() => openMeetingLink(item?.meeting_link || item?.meet_link)}
                      leftIcon={<ExternalLink size={16} color={COLORS.white} />}
                    />
                    <Button
                      title="Mark Done"
                      variant="outline"
                      className="flex-1 h-10"
                      textClassName="text-sm"
                      onPress={async () => {
                        try {
                          const completeRes = await interviewsApi.complete(id, { score: 0, notes: "Completed" });
                          if (isApiSuccess(completeRes.data)) {
                            fetchInterviews();
                          } else {
                            setErrorMessage(getApiError(completeRes.data));
                          }
                        } catch (e) {
                          console.log("Error completing interview", e);
                          setErrorMessage("Failed to update interview status");
                        }
                      }}
                      leftIcon={<CircleCheckBig size={16} color={COLORS.slate700} />}
                    />
                  </View>
                </View>
              );
            })
          )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900/50 justify-end">
          <View className="bg-white rounded-t-[36px] p-6 h-[78%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-black text-slate-900">Schedule Interview</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text className="text-slate-500 font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Title"
                placeholder="Mock Interview"
                value={title}
                onChangeText={setTitle}
              />

              <Input
                label="Student ID"
                placeholder="Student UUID"
                value={studentId}
                onChangeText={setStudentId}
              />

              <Input
                label="Course ID (optional)"
                placeholder="Course UUID"
                value={courseId}
                onChangeText={setCourseId}
              />

              <Input
                label="Scheduled At"
                placeholder="2026-05-01T10:00:00.000Z"
                value={scheduledAt}
                onChangeText={setScheduledAt}
              />

              <Input
                label="Meeting Link (optional)"
                placeholder="https://meet.google.com/..."
                value={meetingLink}
                onChangeText={setMeetingLink}
              />

              <Button
                title="Create Interview"
                onPress={scheduleInterview}
                isLoading={isSubmitting}
                className="mt-2"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
