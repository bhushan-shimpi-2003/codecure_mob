import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, useWindowDimensions } from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { doubtsApi } from "../../api/endpoints";
import { MessageSquare, Plus, MessageCircle, Clock, CheckCircle2, CircleAlert } from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Skeleton } from "../../components/Skeleton";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
import { StudentScreenHeader } from "../../components/StudentScreenHeader";
import { StudentStatCard } from "../../components/StudentStatCard";

export default function DoubtsScreen({ route, navigation }: any) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 30 : 24;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const [doubts, setDoubts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const courseIdFromRoute = route?.params?.courseId || route?.params?.course_id;
  const lessonIdFromRoute = route?.params?.lessonId || route?.params?.lesson_id;
  const prefillTitleFromRoute = String(route?.params?.prefillTitle || "");
  const prefillDescriptionFromRoute = String(route?.params?.prefillDescription || "");

  const fetchDoubts = async () => {
    setErrorMessage(null);
    try {
      const res = await doubtsApi.myDoubts();
      const payload = res.data;
      if (isApiSuccess(payload)) {
        const data = extractApiData<any[]>(payload, []);
        setDoubts(Array.isArray(data) ? data : []);
      } else {
        setDoubts([]);
        setErrorMessage(getApiError(payload));
      }
    } catch (e) {
      console.log("Error loading doubts", e);
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

  useEffect(() => {
    if (prefillTitleFromRoute) {
      setTitle(prefillTitleFromRoute);
    }
    if (prefillDescriptionFromRoute) {
      setDescription(prefillDescriptionFromRoute);
    }

    if (route?.params?.openComposer) {
      setModalVisible(true);
      navigation?.setParams?.({ openComposer: false });
    }
  }, [prefillTitleFromRoute, prefillDescriptionFromRoute, route?.params?.openComposer, navigation]);

  const handleCreateDoubt = async () => {
    if (!title || !description) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const payload: any = { subject: title, description };
      if (courseIdFromRoute) payload.course_id = courseIdFromRoute;
      if (lessonIdFromRoute) payload.lesson_id = lessonIdFromRoute;

      const res = await doubtsApi.create(payload);
      if (isApiSuccess(res.data)) {
        setModalVisible(false);
        setTitle("");
        setDescription("");
        fetchDoubts();
      } else {
        setErrorMessage(getApiError(res.data));
      }
    } catch (e) {
      setErrorMessage("Failed to post doubt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolvedCount = doubts.filter((item) => item?.status === "resolved").length;
  const pendingCount = doubts.length - resolvedCount;

  return (
    <SafeAreaWrapper>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: isTablet ? 34 : 24 }}
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
          <StudentScreenHeader
            badge="Student Workspace"
            title="My Doubts"
            subtitle="Ask better questions and get faster mentor guidance"
            actionIcon={<Plus size={22} color="white" />}
            onActionPress={() => setModalVisible(true)}
          />

          <View style={{ paddingHorizontal: horizontalPadding }} className="pt-1 pb-2 flex-row flex-wrap justify-between">
            <StudentStatCard label="Total" value={doubts.length} Icon={MessageSquare} tone="slate" />
            <StudentStatCard label="Resolved" value={resolvedCount} Icon={CheckCircle2} tone="emerald" />
            <StudentStatCard label="Pending" value={pendingCount} Icon={CircleAlert} tone="amber" />
          </View>

          {errorMessage ? (
            <View style={{ marginHorizontal: horizontalPadding }} className="mb-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <Text className="text-amber-700 text-sm font-semibold">{errorMessage}</Text>
            </View>
          ) : null}

          <View style={{ paddingHorizontal: horizontalPadding, paddingTop: 12 }}>
            {isLoading ? (
              <View className="gap-4">
                <Skeleton height={150} className="rounded-3xl" />
                <Skeleton height={150} className="rounded-3xl" />
                <Skeleton height={150} className="rounded-3xl" />
              </View>
            ) : doubts.length === 0 ? (
              <View className="items-center justify-center py-16 bg-white border border-slate-100 rounded-3xl">
                <View className="bg-slate-100 p-6 rounded-full mb-4">
                  <MessageSquare size={40} color={COLORS.slate300} />
                </View>
                <Text className="text-slate-500 font-semibold text-center px-6">
                  No doubts asked yet. Post your first question to get mentor help.
                </Text>
              </View>
            ) : (
              doubts.map((doubt, i) => (
                <View key={String(doubt?.id || doubt?._id || i)} className="bg-white p-5 rounded-3xl mb-4 border border-slate-100 shadow-sm">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 mr-2">
                      <Text className="font-black text-slate-900 text-base">{doubt.subject || doubt.title || "Untitled Doubt"}</Text>
                      <Text className="text-slate-500 text-sm mt-1" numberOfLines={2}>{doubt.description}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded-lg ${doubt.status === "resolved" ? "bg-emerald-100" : "bg-amber-100"}`}>
                      <Text className={`text-[10px] font-bold uppercase tracking-wider ${doubt.status === "resolved" ? "text-emerald-600" : "text-amber-600"}`}>
                        {doubt.status || "Pending"}
                      </Text>
                    </View>
                  </View>

                  {doubt.reply ? (
                    <View className="bg-slate-50 p-3 rounded-2xl mt-4 border-l-4 border-blue-500">
                      <Text className="text-xs font-bold text-blue-600 mb-1">Mentor Reply:</Text>
                      <Text className="text-slate-600 text-sm leading-5">{doubt.reply}</Text>
                    </View>
                  ) : null}

                  <View className="flex-row items-center mt-4">
                    <MessageCircle size={14} color={COLORS.slate400} />
                    <Text className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Tracked</Text>
                    <View className="w-1 h-1 bg-slate-200 rounded-full mx-2" />
                    <Clock size={14} color={COLORS.slate400} />
                    <Text className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Latest update</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Ask Doubt Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900/45 justify-end">
          <View className="bg-white rounded-t-[40px] p-8 h-[70%] shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-black text-slate-900">Ask a Doubt</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text className="text-slate-400 font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {lessonIdFromRoute ? (
                <View className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-4">
                  <Text className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                    This doubt will be linked to the current lesson
                  </Text>
                </View>
              ) : null}

              <Text className="text-slate-500 font-bold mb-2 ml-1">Title</Text>
              <Input 
                placeholder="What's your doubt about?" 
                value={title}
                onChangeText={setTitle}
                className="mb-4"
              />

              <Text className="text-slate-500 font-bold mb-2 ml-1">Detail Description</Text>
              <Input 
                placeholder="Explain what problem you are facing..." 
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                style={{ textAlignVertical: 'top' }}
                className="mb-8"
              />

              <Button 
                title="Post Doubt" 
                onPress={handleCreateDoubt}
                isLoading={isSubmitting}
                disabled={!title || !description}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
