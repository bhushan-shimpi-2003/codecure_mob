import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, useWindowDimensions, Image, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { doubtsApi, enrollmentsApi, notificationsApi } from "../../api/endpoints";
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
    ChevronLeft,
    Sparkles,
    Layers,
    Play,
    Video,
    Paperclip
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

        // Notify Teacher
        notificationsApi.send({
           role: 'teacher',
           title: 'New Student Doubt',
           message: `${user?.name || 'A student'} asked a question: ${description.substring(0, 50)}...`,
           type: 'doubt'
        });
      }
    } catch (e) {
      console.log("Post doubt error", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDoubtCard = (doubt: any) => {
    const isResolved = !!doubt.reply || String(doubt.status).toLowerCase() === "resolved";
    const courseTitle = doubt.courses?.title || doubt.course?.title || "Project Track";
    
    return (
        <View key={doubt.id} className="bg-white rounded-[44px] p-8 mb-8 border border-white shadow-2xl shadow-slate-900/[0.04]">
            <View className="flex-row items-center justify-between mb-8">
                <View className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{courseTitle}</Text>
                </View>
                <View className={`flex-row items-center gap-2 ${isResolved ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"} px-4 py-2 rounded-2xl border`}>
                    {isResolved ? <CheckCircle2 size={12} color="#10B981" /> : <Clock size={12} color="#D97706" />}
                    <Text className={`text-[10px] font-black uppercase tracking-widest ${isResolved ? "text-emerald-600" : "text-amber-600"}`}>
                        {isResolved ? "Resolved" : "Awaiting"}
                    </Text>
                </View>
            </View>

            <Text className="text-2xl font-black text-slate-900 mb-2 leading-tight tracking-tight">{doubt.subject || "Question"}</Text>
            <Text className="text-slate-400 text-base font-bold leading-6 mb-8">{doubt.description}</Text>

            {doubt.reply ? (
                <View className="bg-slate-900 rounded-[36px] p-8 relative overflow-hidden">
                    <View className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12" />
                    <View className="flex-row items-center gap-4 mb-6">
                        <View className="w-12 h-12 rounded-2xl bg-white/10 items-center justify-center border border-white/10">
                            <Image source={{ uri: "https://i.pravatar.cc/100?u=mentor" }} className="w-full h-full rounded-2xl" />
                        </View>
                        <View>
                            <Text className="text-white font-black text-xs uppercase tracking-widest">Mentor Response</Text>
                            <Text className="text-slate-400 text-[10px] font-bold uppercase">Technical Expert</Text>
                        </View>
                    </View>
                    <Text className="text-slate-300 italic leading-6 text-sm font-medium">
                        "{doubt.reply}"
                    </Text>
                </View>
            ) : (
                <View className="flex-row items-center gap-3 mt-2 pt-6 border-t border-slate-50">
                    <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center">
                       <Clock size={16} color="#94A3B8" />
                    </View>
                    <View>
                       <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Update</Text>
                       <Text className="text-slate-500 text-xs font-black uppercase tracking-wider">Awaiting Instructor Review</Text>
                    </View>
                </View>
            )}
        </View>
    );
  };

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} role={user?.role} />

      <ScrollView 
        className="flex-1 bg-[#F8FAFC]"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }}>
            
            <View className="px-6 pt-10 pb-12">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-blue-700 text-[10px] font-black uppercase tracking-widest">Scholar Support</Text>
                  </View>
                  <Sparkles size={14} color="#3B82F6" />
                </View>
                <Text className="text-[40px] font-black text-slate-900 leading-[44px] tracking-tight">
                    Your <Text className="text-blue-600">Doubts</Text>
                </Text>
                <Text className="text-slate-400 font-bold text-base mt-4 leading-6 max-w-[90%]">
                    Unblock your logical hurdles with direct access to industry veterans.
                </Text>
            </View>

            <View className="px-6 pb-32">
                {isLoading ? (
                    <View className="gap-8">
                        <Skeleton height={280} className="rounded-[48px]" />
                        <Skeleton height={280} className="rounded-[48px]" />
                    </View>
                ) : doubts.length > 0 ? (
                    doubts.map(doubt => renderDoubtCard(doubt))
                ) : (
                    <View className="items-center py-24 bg-white rounded-[56px] border border-dashed border-slate-200 mx-2">
                        <View className="w-24 h-24 bg-slate-50 rounded-full items-center justify-center mb-8">
                            <HelpCircle size={40} color="#CBD5E1" />
                        </View>
                        <Text className="text-slate-400 font-black text-xl tracking-tight">Clear horizon</Text>
                        <Text className="text-slate-300 text-[10px] mt-2 font-black uppercase tracking-[2px]">No active inquiries found</Text>
                    </View>
                )}
            </View>
        </View>
      </ScrollView>

      <TouchableOpacity 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.9}
        className="absolute bottom-24 right-8 w-20 h-20 bg-slate-900 rounded-[28px] items-center justify-center shadow-2xl shadow-slate-900/40"
      >
        <Plus size={36} color="white" />
      </TouchableOpacity>

      {/* Ask Doubt Modal Overhaul */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaWrapper bgWhite>
            <View className="flex-row items-center justify-between px-6 py-4">
                <TouchableOpacity onPress={() => setModalVisible(false)} className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center border border-slate-100">
                    <ChevronLeft size={24} color="#0F172A" strokeWidth={2.5} />
                </TouchableOpacity>
                <Text className="text-lg font-black text-slate-900">Inquiry Console</Text>
                <View className="w-12 h-12" />
            </View>

            <ScrollView className="flex-1 bg-[#F8FAFC]" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View className="px-8 pt-10 mb-10">
                    <View className="bg-blue-600 self-start px-4 py-1.5 rounded-full mb-6 shadow-lg shadow-blue-200">
                        <Text className="text-white text-[10px] font-black uppercase tracking-widest">Knowledge Bridge</Text>
                    </View>
                    <Text className="text-[34px] font-black text-slate-900 mb-4 leading-tight tracking-tight">Need some clarity?</Text>
                    <Text className="text-slate-400 font-bold text-base leading-6">
                        Describe your technical hurdle and our mentors will help you debug the logic.
                    </Text>
                </View>

                {/* Form Card */}
                <View className="mx-6 bg-white rounded-[48px] p-10 border border-white shadow-2xl shadow-slate-900/[0.04] mb-10">
                    <View className="mb-10">
                        <Text className="text-slate-900 font-black text-sm mb-4">Contextual Lesson</Text>
                        <TouchableOpacity className="bg-slate-50 h-16 rounded-2xl px-6 flex-row items-center justify-between border border-slate-100">
                            <Text className="text-slate-400 font-black text-xs">Select related curriculum track</Text>
                            <ChevronDown size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    <View className="mb-10">
                        <Text className="text-slate-900 font-black text-sm mb-4">Your Technical Query</Text>
                        <Input 
                            placeholder="Describe the logic issue or paste the console error..."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={8}
                            containerClassName="h-60 rounded-[32px] bg-slate-50 border-0 p-8"
                            inputClassName="h-full text-sm font-black text-slate-900 leading-6"
                        />
                    </View>

                    <View className="mb-12">
                        <Text className="text-slate-900 font-black text-sm mb-4">Evidence (Screenshots)</Text>
                        <TouchableOpacity className="border-2 border-slate-100 border-dashed rounded-[32px] py-12 items-center justify-center">
                            <View className="w-16 h-16 bg-blue-50 rounded-2xl items-center justify-center mb-4">
                                <ImageIcon size={28} color="#2563EB" />
                            </View>
                            <Text className="text-slate-900 font-black text-sm mb-1">Attach Source Image</Text>
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Max resolution: 4K</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                        onPress={handleCreateDoubt}
                        disabled={isSubmitting || !description}
                        activeOpacity={0.8}
                        className="w-full"
                    >
                       <LinearGradient
                          colors={description ? ['#1E293B', '#0F172A'] : ['#F1F5F9', '#E2E8F0']}
                          className="py-6 rounded-[28px] flex-row items-center justify-center gap-3"
                       >
                          {isSubmitting ? (
                              <ActivityIndicator color="white" />
                          ) : (
                              <>
                                  <Text className={`font-black text-sm uppercase tracking-widest ${description ? 'text-white' : 'text-slate-400'}`}>Dispatch Inquiry</Text>
                                  <Send size={18} color={description ? "white" : "#94A3B8"} />
                              </>
                          )}
                       </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Quick Tip Banner */}
                <View className="mx-6 bg-slate-900 rounded-[44px] p-10 flex-row items-center gap-8 mb-12 border border-slate-800">
                    <View className="w-16 h-16 bg-white/10 rounded-full items-center justify-center border border-white/10">
                        <Lightbulb size={32} color="#3B82F6" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-white font-black text-lg mb-2">Architect Tip</Text>
                        <Text className="text-slate-400 text-xs leading-5 font-bold">
                            Providing a clear screenshot of your console errors helps our mentors respond up to 2x faster.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaWrapper>
      </Modal>
    </SafeAreaWrapper>
  );
}
