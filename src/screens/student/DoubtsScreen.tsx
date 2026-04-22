import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, useWindowDimensions, Image, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { doubtsApi, enrollmentsApi } from "../../api/endpoints";
import { 
    MessageSquare, 
    Plus, 
    MessageCircle, 
    Clock, 
    CheckCircle2, 
    CircleAlert,
    HelpCircle,
    ChevronDown,
    ArrowUpRight,
    Search,
    CheckCircle,
    RotateCcw,
    Send,
    Image as ImageIcon,
    Lightbulb,
    ChevronRight,
    ChevronLeft
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Skeleton } from "../../components/Skeleton";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
import { useAuth } from "../../context/AuthContext";
import { AppHeader } from "../../components/AppHeader";
import { LinearGradient } from "expo-linear-gradient";

export default function DoubtsScreen({ route, navigation }: any) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const [doubts, setDoubts] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();

  const fetchDoubts = useCallback(async () => {
    try {
      const [doubtsRes, enrollmentsRes] = await Promise.all([
        doubtsApi.myDoubts(),
        enrollmentsApi.myEnrollments()
      ]);
      
      if (isApiSuccess(doubtsRes.data)) {
        setDoubts(extractApiData<any[]>(doubtsRes.data, []));
      }
      if (isApiSuccess(enrollmentsRes.data)) {
        setEnrollments(extractApiData<any[]>(enrollmentsRes.data, []));
      }
    } catch (e) {
      console.log("Error loading doubts", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
        fetchDoubts();
    }, [fetchDoubts])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoubts();
  };

  const handleCreateDoubt = async () => {
    if (!description) return;
    setIsSubmitting(true);
    try {
      const res = await doubtsApi.create({ 
          subject: title || "New Question", 
          description,
          course_id: selectedCourse?.course?.id || selectedCourse?.course_id
      });
      if (isApiSuccess(res.data)) {
        setModalVisible(false);
        setTitle("");
        setDescription("");
        setSelectedCourse(null);
        fetchDoubts();
      }
    } catch (e) {
      console.log("Post doubt error", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDoubtCard = (doubt: any) => {
    const isResolved = String(doubt.status).toLowerCase() === "resolved";
    const courseTitle = doubt.courses?.title || doubt.course?.title || "General";
    
    return (
        <View key={doubt.id} className="bg-white rounded-[40px] p-8 mb-6 border border-slate-100 shadow-2xl shadow-slate-900/[0.02]">
            <View className="flex-row items-center justify-between mb-6">
                <View className="bg-blue-50 px-4 py-1.5 rounded-full">
                    <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest">{courseTitle}</Text>
                </View>
                <View className={`flex-row items-center gap-2 ${isResolved ? "bg-emerald-50" : "bg-amber-50"} px-4 py-1.5 rounded-full`}>
                    {isResolved ? <CheckCircle size={10} color="#059669" /> : <View className="w-2 h-2 rounded-full bg-amber-500" />}
                    <Text className={`text-[10px] font-black uppercase tracking-widest ${isResolved ? "text-emerald-600" : "text-amber-600"}`}>
                        {isResolved ? "Resolved" : "Pending"}
                    </Text>
                </View>
            </View>

            <Text className="text-xl font-black text-slate-900 mb-4 leading-7">{doubt.subject}</Text>
            <Text className="text-slate-500 text-sm leading-6 mb-8">{doubt.description}</Text>

            {doubt.reply ? (
                <View className="bg-slate-50 rounded-[34px] p-6 border border-slate-50 relative">
                    <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-l-full" />
                    <View className="flex-row items-center gap-3 mb-4">
                        <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                            <Image source={{ uri: "https://i.pravatar.cc/100?u=mentor" }} className="w-full h-full" />
                        </View>
                        <View>
                            <Text className="text-slate-900 font-black text-xs uppercase tracking-widest">Mentor Response</Text>
                            <Text className="text-slate-400 text-[10px] font-bold">12:30 PM Yesterday</Text>
                        </View>
                    </View>
                    <Text className="text-slate-600 italic leading-6 text-sm">
                        "{doubt.reply}"
                    </Text>
                </View>
            ) : (
                <View className="flex-row items-center gap-2 mt-2">
                    <Clock size={14} color={COLORS.slate400} />
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Awaiting Instructor</Text>
                </View>
            )}
        </View>
    );
  };

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} showMenu role={user?.role} subtitle="Support Desk" />

      <ScrollView 
        className="flex-1 bg-[#F8FAFC]"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }}>
            
            <View className="px-6 pt-10 pb-8">
                <Text className="text-blue-600 text-[10px] font-black uppercase tracking-[3px] mb-2">Learning Support</Text>
                <Text className="text-4xl font-black text-slate-900 mb-4">Your <Text className="text-blue-600">Doubts</Text> </Text>
                <Text className="text-slate-400 font-bold text-sm leading-6">
                    Track your inquiries and teacher responses as you master the curriculum.
                </Text>
            </View>

            <View className="px-6 pb-24">
                {isLoading ? (
                    <View className="gap-8">
                        <Skeleton height={240} className="rounded-[40px]" />
                        <Skeleton height={200} className="rounded-[40px]" />
                    </View>
                ) : doubts.length > 0 ? (
                    doubts.map(doubt => renderDoubtCard(doubt))
                ) : (
                    <View className="items-center py-20 bg-white rounded-[44px] border border-slate-100 border-dashed mx-2">
                        <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-6">
                            <HelpCircle size={32} color={COLORS.slate300} />
                        </View>
                        <Text className="text-slate-900 font-black text-xl mb-2">No doubts yet</Text>
                        <Text className="text-slate-400 text-center px-10 leading-6">When you have a question about a lesson, it will appear here.</Text>
                    </View>
                )}
            </View>
        </View>
      </ScrollView>

      <TouchableOpacity 
        onPress={() => setModalVisible(true)}
        className="absolute bottom-24 right-6 w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center shadow-2xl shadow-blue-900/50"
      >
        <Plus size={32} color="white" />
      </TouchableOpacity>

      {/* Ask Doubt Modal Overhaul */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaWrapper bgWhite>
            <View className="flex-row items-center justify-between px-6 py-4">
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <ChevronLeft size={24} color={COLORS.primary} strokeWidth={2.5} />
                </TouchableOpacity>
                <Text className="text-lg font-black text-slate-900">CodeCure Academy</Text>
                <View className="w-10 h-10 rounded-full bg-slate-900 items-center justify-center">
                    <Text className="text-white font-black text-xs">{(user?.name || "U")[0]}</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-8 pt-6" showsVerticalScrollIndicator={false}>
                <View className="mb-10">
                    <View className="bg-blue-100/50 px-4 py-1.5 rounded-full self-start mb-4">
                        <Text className="text-blue-600 text-[10px] font-black uppercase tracking-[2px]">Support Desk</Text>
                    </View>
                    <Text className="text-[34px] font-black text-slate-900 mb-4 leading-tight">Need some clarity?</Text>
                    <Text className="text-slate-500 font-bold text-base leading-6">
                        Describe your challenge and our mentors will help you debug it.
                    </Text>
                </View>

                {/* Form Card */}
                <View className="bg-white rounded-[44px] p-8 border border-slate-100 shadow-2xl shadow-slate-900/[0.04] mb-8">
                    <View className="mb-8">
                        <Text className="text-slate-900 font-black text-sm mb-4">Related Lesson</Text>
                        <TouchableOpacity className="bg-slate-50 h-16 rounded-2xl px-6 flex-row items-center justify-between border border-slate-100">
                            <Text className="text-slate-400 font-bold">Select the lesson you're working on</Text>
                            <ChevronDown size={20} color={COLORS.slate400} />
                        </TouchableOpacity>
                    </View>

                    <View className="mb-8">
                        <Text className="text-slate-900 font-black text-sm mb-4">Your Question</Text>
                        <Input 
                            placeholder="What specific part are you struggling with? Paste error messages if any..."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={8}
                            containerClassName="h-56 rounded-[34px] bg-slate-50 border-0 p-6"
                            inputClassName="h-full text-sm leading-6"
                        />
                    </View>

                    <View className="mb-10">
                        <Text className="text-slate-900 font-black text-sm mb-4">Supporting Visuals</Text>
                        <TouchableOpacity className="border-2 border-slate-200 border-dashed rounded-[34px] py-10 items-center justify-center">
                            <View className="w-12 h-12 bg-blue-100 rounded-2xl items-center justify-center mb-4">
                                <ImageIcon size={24} color={COLORS.primary} />
                            </View>
                            <Text className="text-slate-900 font-black text-sm mb-1">Upload Screenshot</Text>
                            <Text className="text-slate-400 text-[10px] font-bold">PNG, JPG or GIF up to 5MB</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                        onPress={handleCreateDoubt}
                        disabled={isSubmitting || !description}
                        className="bg-blue-600 py-6 rounded-[30px] flex-row items-center justify-center shadow-xl shadow-blue-900/30 active:opacity-90"
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <View className="flex-row items-center">
                                <Text className="text-white font-black text-base uppercase tracking-widest mr-3">Send Your Doubt</Text>
                                <Send size={20} color="white" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Quick Tip Banner */}
                <View className="bg-slate-50 rounded-[34px] p-8 flex-row items-center gap-6 mb-12 border border-slate-100">
                    <View className="w-14 h-14 bg-blue-100 rounded-full items-center justify-center">
                        <Lightbulb size={28} color={COLORS.primary} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-slate-900 font-black text-base mb-1">Quick Tip</Text>
                        <Text className="text-slate-500 text-xs leading-5 font-bold">
                            Providing a clear screenshot of your code and the console error helps our mentors respond up to 2x faster.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaWrapper>
      </Modal>
    </SafeAreaWrapper>
  );
}
