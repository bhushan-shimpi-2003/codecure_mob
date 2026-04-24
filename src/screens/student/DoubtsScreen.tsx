import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, useWindowDimensions, Image, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { doubtsApi, enrollmentsApi } from "../../api/endpoints";
import { notifyTeacherNewDoubt } from "../../utils/notificationHelper";
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
    Paperclip,
    ExternalLink,
    X
} from "lucide-react-native";
import { COLORS, UPLOADS_URL } from "../../utils/theme";
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
  const [courseModalVisible, setCourseModalVisible] = useState(false);

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
    if (!description || !selectedCourse) {
      Alert.alert("Required", "Please select a course and describe your query");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { 
        title: title.trim() || "New Question", 
        description: description.trim(),
        course_id: selectedCourse?.course?.id || selectedCourse?.course_id || selectedCourse?.id || null,
      };

      const res = await doubtsApi.create(payload);
      if (isApiSuccess(res.data)) {
        setModalVisible(false);
        setTitle("");
        setDescription("");
        setSelectedCourse(null);
        fetchDoubts();
        notifyTeacherNewDoubt(user?.name || 'A Student', description.trim());
      } else {
        Alert.alert("Error", "Failed to post your doubt. Please try again.");
      }
    } catch (e: any) {
      console.log("Post doubt error", e?.response?.data || e);
      Alert.alert("Error", e?.response?.data?.message || "Failed to post doubt. Please try again.");
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

            <Text className="text-2xl font-black text-slate-900 mb-2 leading-tight tracking-tight">{doubt.title || "Question"}</Text>
            <Text className="text-slate-400 text-base font-bold leading-6 mb-8">{doubt.description}</Text>


            {doubt.reply ? (
                <View className="bg-slate-900 rounded-[36px] p-8 relative overflow-hidden">
                    <View className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12" />
                    <View className="flex-row items-center justify-between mb-6">
                        <View className="flex-row items-center gap-4">
                            <View className="w-12 h-12 rounded-2xl bg-white/10 items-center justify-center border border-white/10">
                                <Image source={{ uri: doubt.teacher?.avatar_url || `https://ui-avatars.com/api/?name=${doubt.teacher?.name || 'M'}&background=random` }} className="w-full h-full rounded-2xl" />
                            </View>
                            <View>
                                <Text className="text-white font-black text-xs uppercase tracking-widest">{doubt.teacher?.name || "Mentor Response"}</Text>
                                <Text className="text-slate-400 text-[10px] font-bold uppercase">Technical Expert</Text>
                            </View>
                        </View>
                        <View className="bg-white/10 px-3 py-1 rounded-full border border-white/10">
                          <Text className="text-white text-[8px] font-black uppercase tracking-widest">Verified</Text>
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
                        <TouchableOpacity 
                          onPress={() => setCourseModalVisible(true)}
                          className="bg-slate-50 h-16 rounded-2xl px-6 flex-row items-center justify-between border border-slate-100"
                        >
                            <Text className={`font-black text-xs ${selectedCourse ? 'text-slate-900' : 'text-slate-400'}`}>
                                {selectedCourse ? (selectedCourse.courses?.title || selectedCourse.course?.title || selectedCourse.title) : 'Select related curriculum track'}
                            </Text>
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


            </ScrollView>
        </SafeAreaWrapper>
      </Modal>

      {/* Course Picker Modal */}
      <Modal visible={courseModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-slate-900/60 justify-end">
           <View className="bg-white rounded-t-[44px] p-8 pb-12 h-[60%]">
              <View className="flex-row justify-between items-center mb-8">
                 <Text className="text-slate-900 text-xl font-black">Select Course</Text>
                 <TouchableOpacity onPress={() => setCourseModalVisible(false)} className="p-3 bg-slate-50 rounded-2xl">
                    <ChevronDown size={20} color="#0F172A" />
                 </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {enrollments.length > 0 ? enrollments.map((item) => (
                  <TouchableOpacity 
                    key={item.id}
                    onPress={() => { setSelectedCourse(item); setCourseModalVisible(false); }}
                    className={`p-6 rounded-[28px] mb-4 flex-row items-center justify-between ${selectedCourse?.id === item.id ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50 border border-slate-50'}`}
                  >
                     <View className="flex-1 mr-4">
                        <Text className={`font-black ${selectedCourse?.id === item.id ? 'text-blue-600' : 'text-slate-900'}`}>
                           {item.courses?.title || item.course?.title || item.title || 'Untitled Track'}
                        </Text>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                           Enrolled {item.enrolled_at || item.created_at ? new Date(item.enrolled_at || item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                        </Text>
                     </View>
                     <ChevronRight size={18} color={selectedCourse?.id === item.id ? "#2563EB" : "#94A3B8"} />
                  </TouchableOpacity>
                ))
 : (
                  <View className="items-center py-12">
                     <Layers size={40} color="#CBD5E1" />
                     <Text className="text-slate-400 font-bold mt-4">No enrollments found</Text>
                  </View>
                )}
              </ScrollView>
           </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
