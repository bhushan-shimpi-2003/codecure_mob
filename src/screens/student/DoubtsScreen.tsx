import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal } from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { doubtsApi } from "../../api/endpoints";
import { MessageSquare, Plus, MessageCircle, Clock, CheckCircle2 } from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Skeleton } from "../../components/Skeleton";
import { extractApiData, isApiSuccess } from "../../api/response";

export default function DoubtsScreen({ route }: any) {
  const [doubts, setDoubts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const courseIdFromRoute = route?.params?.courseId || route?.params?.course_id;
  const lessonIdFromRoute = route?.params?.lessonId || route?.params?.lesson_id;

  const fetchDoubts = async () => {
    try {
      const res = await doubtsApi.myDoubts();
      const payload = res.data;
      if (isApiSuccess(payload)) {
        const data = extractApiData<any[]>(payload, []);
        setDoubts(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.log("Error loading doubts", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, []);

  const handleCreateDoubt = async () => {
    if (!title || !description) return;
    setIsSubmitting(true);
    try {
      const payload: any = { title, description };
      if (courseIdFromRoute) payload.course_id = courseIdFromRoute;
      if (lessonIdFromRoute) payload.lesson_id = lessonIdFromRoute;

      const res = await doubtsApi.create(payload);
      if (isApiSuccess(res.data)) {
        setModalVisible(false);
        setTitle("");
        setDescription("");
        fetchDoubts();
      }
    } catch (e) {
      alert("Failed to post doubt");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <View className="flex-1">
        <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-slate-900">My Doubts</Text>
          <TouchableOpacity 
            onPress={() => setModalVisible(true)}
            className="bg-blue-600 p-2 rounded-2xl"
          >
            <Plus color="white" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchDoubts();}} />}
        >
          {isLoading ? (
            <View className="gap-4">
              <Skeleton height={150} className="rounded-3xl" />
              <Skeleton height={150} className="rounded-3xl" />
              <Skeleton height={150} className="rounded-3xl" />
            </View>
          ) : doubts.length === 0 ? (
            <View className="items-center justify-center py-20">
              <View className="bg-slate-100 p-6 rounded-full mb-4">
                <MessageSquare size={48} color={COLORS.slate300} />
              </View>
              <Text className="text-slate-500 font-medium text-center">No doubts asked yet. Have a question? Ask our mentors!</Text>
            </View>
          ) : (
            doubts.map((doubt, i) => (
              <View key={String(doubt?.id || doubt?._id || i)} className="bg-white p-5 rounded-3xl mb-4 border border-slate-100 shadow-sm">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 mr-2">
                    <Text className="font-black text-slate-900 text-base">{doubt.title}</Text>
                    <Text className="text-slate-500 text-sm mt-1" numberOfLines={2}>{doubt.description}</Text>
                  </View>
                  <View className={`px-2 py-1 rounded-lg ${doubt.status === 'resolved' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    <Text className={`text-[10px] font-bold uppercase tracking-wider ${doubt.status === 'resolved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {doubt.status || 'Pending'}
                    </Text>
                  </View>
                </View>

                {doubt.reply && (
                  <View className="bg-slate-50 p-3 rounded-2xl mt-4 border-l-4 border-blue-500">
                    <Text className="text-xs font-bold text-blue-600 mb-1">Mentor Reply:</Text>
                    <Text className="text-slate-600 text-sm leading-5">{doubt.reply}</Text>
                  </View>
                )}

                <View className="flex-row items-center mt-4">
                  <MessageCircle size={14} color={COLORS.slate400} />
                  <Text className="text-[10px] font-bold text-slate-400 ml-1 uppercase">1 Update</Text>
                  <View className="w-1 h-1 bg-slate-200 rounded-full mx-2" />
                  <Clock size={14} color={COLORS.slate400} />
                  <Text className="text-[10px] font-bold text-slate-400 ml-1 uppercase">2h ago</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Ask Doubt Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900/50 justify-end">
          <View className="bg-white rounded-t-[40px] p-8 h-[70%] shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-black text-slate-900">Ask a Doubt</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text className="text-slate-400 font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
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
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
