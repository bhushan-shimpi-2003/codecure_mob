import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  useWindowDimensions,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { doubtsApi } from "../../api/endpoints";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
import { Skeleton } from "../../components/Skeleton";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import {
  MessageCircleWarning,
  CircleCheckBig,
  Clock3,
  User,
  BookOpen,
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { TeacherScreenHeader } from "../../components/TeacherScreenHeader";
import { TeacherStatCard } from "../../components/TeacherStatCard";

export default function TeacherDoubtsScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 30 : 24;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const [doubts, setDoubts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDoubtId, setSelectedDoubtId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDoubts = async () => {
    setErrorMessage(null);
    try {
      const res = await doubtsApi.teacherDoubts();
      const payload = res.data;
      if (isApiSuccess(payload)) {
        const data = extractApiData<any[]>(payload, []);
        setDoubts(Array.isArray(data) ? data : []);
      } else {
        setDoubts([]);
        setErrorMessage(getApiError(payload));
      }
    } catch (e) {
      console.log("Error loading teacher doubts", e);
      setDoubts([]);
      setErrorMessage("Failed to load doubts");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, []);

  const pendingCount = useMemo(
    () => doubts.filter((item) => item?.status !== "resolved").length,
    [doubts]
  );

  const openResolveModal = (doubtId: string) => {
    setSelectedDoubtId(doubtId);
    setReply("");
    setModalVisible(true);
  };

  const handleResolveDoubt = async () => {
    if (!selectedDoubtId || !reply.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await doubtsApi.resolve(selectedDoubtId, reply.trim());
      if (isApiSuccess(res.data)) {
        setModalVisible(false);
        setSelectedDoubtId(null);
        setReply("");
        fetchDoubts();
      } else {
        setErrorMessage(getApiError(res.data));
      }
    } catch (e) {
      console.log("Error resolving doubt", e);
      setErrorMessage("Failed to resolve doubt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolveSelectedTitle = useMemo(() => {
    const match = doubts.find((item) => String(item?.id || item?._id) === String(selectedDoubtId));
    return match?.subject || "Selected Doubt";
  }, [doubts, selectedDoubtId]);

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
              fetchDoubts();
            }}
          />
        }
      >
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }}>
          <TeacherScreenHeader
            badge="Teacher Workspace"
            title="Doubts Queue"
            subtitle="Respond quickly and keep learner confidence high"
          />

          <View style={{ paddingHorizontal: horizontalPadding }} className="pt-1 pb-2 flex-row flex-wrap justify-between">
            <TeacherStatCard
              label="Total"
              value={doubts.length}
              Icon={MessageCircleWarning}
              tone="slate"
            />
            <TeacherStatCard
              label="Pending"
              value={pendingCount}
              Icon={Clock3}
              tone="amber"
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
              <Skeleton height={170} className="rounded-3xl" />
              <Skeleton height={170} className="rounded-3xl" />
            </View>
          ) : doubts.length === 0 ? (
            <View className="bg-white border border-slate-100 rounded-3xl p-8 items-center justify-center">
              <MessageCircleWarning size={36} color={COLORS.slate300} />
              <Text className="text-slate-600 font-bold mt-3">No doubts to review</Text>
            </View>
          ) : (
            doubts.map((item, index) => {
              const doubtId = String(item?.id || item?._id || index);
              const isResolved = item?.status === "resolved";
              const student = item?.profiles || item?.student || {};
              const course = item?.courses || item?.course || {};

              return (
                <View
                  key={doubtId}
                  className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 mb-4"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                      <Text className="text-slate-900 text-base font-black" numberOfLines={1}>
                        {item?.subject || "Untitled doubt"}
                      </Text>
                      <Text className="text-slate-600 text-sm mt-1" numberOfLines={3}>
                        {item?.description || "No description"}
                      </Text>
                    </View>
                    <View className={`px-2 py-1 rounded-lg ${isResolved ? "bg-emerald-100" : "bg-amber-100"}`}>
                      <Text className={`text-[10px] font-black uppercase ${isResolved ? "text-emerald-700" : "text-amber-700"}`}>
                        {isResolved ? "Resolved" : "Pending"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row mt-4 gap-3">
                    <View className="flex-row items-center flex-1">
                      <User size={14} color={COLORS.slate400} />
                      <Text className="text-xs text-slate-500 ml-1" numberOfLines={1}>
                        {student?.name || student?.email || "Student"}
                      </Text>
                    </View>
                    <View className="flex-row items-center flex-1">
                      <BookOpen size={14} color={COLORS.slate400} />
                      <Text className="text-xs text-slate-500 ml-1" numberOfLines={1}>
                        {course?.title || "General"}
                      </Text>
                    </View>
                  </View>

                  {item?.reply ? (
                    <View className="bg-slate-50 rounded-2xl px-3 py-3 mt-4 border-l-4 border-blue-500">
                      <Text className="text-xs font-black text-blue-600 uppercase">Teacher reply</Text>
                      <Text className="text-slate-700 text-sm mt-1">{item.reply}</Text>
                    </View>
                  ) : null}

                  <View className="flex-row items-center justify-between mt-4">
                    <View className="flex-row items-center">
                      <Clock3 size={14} color={COLORS.slate400} />
                      <Text className="text-xs text-slate-500 ml-1">{isResolved ? "Resolved" : "Awaiting response"}</Text>
                    </View>

                    {!isResolved ? (
                      <Button
                        title="Resolve"
                        className="h-10 px-4"
                        textClassName="text-sm"
                        onPress={() => openResolveModal(doubtId)}
                        leftIcon={<CircleCheckBig size={16} color={COLORS.white} />}
                      />
                    ) : null}
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
          <View className="bg-white rounded-t-[36px] p-6 h-[62%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-slate-900 text-lg font-black">Resolve Doubt</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text className="text-slate-500 font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-slate-500 text-sm mb-3" numberOfLines={2}>
              {resolveSelectedTitle}
            </Text>

            <Input
              label="Reply"
              placeholder="Write your answer for the student"
              value={reply}
              onChangeText={setReply}
              multiline
              numberOfLines={6}
              style={{ textAlignVertical: "top" }}
            />

            <Button
              title="Submit Resolution"
              onPress={handleResolveDoubt}
              isLoading={isSubmitting}
              disabled={!reply.trim()}
              className="mt-2"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
