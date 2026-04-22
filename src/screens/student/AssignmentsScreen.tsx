import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, useWindowDimensions, Image, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { assignmentsApi } from "../../api/endpoints";
import { 
    FileText, 
    Clock, 
    CheckCircle2, 
    Link as LinkIcon, 
    Send, 
    ChevronLeft, 
    UploadCloud, 
    CheckCircle,
    Info,
    GraduationCap,
    MessageSquare,
    History,
    ArrowRight,
    Sparkles,
    Layers,
    ChevronRight,
    Trophy,
    Shield,
    Calendar
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Skeleton } from "../../components/Skeleton";
import { extractApiData, isApiSuccess, getApiError } from "../../api/response";
import { useAuth } from "../../context/AuthContext";
import { AppHeader } from "../../components/AppHeader";
import { LinearGradient } from "expo-linear-gradient";

export default function AssignmentsScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await assignmentsApi.myAssignments();
      if (isApiSuccess(res.data)) {
        setAssignments(extractApiData<any[]>(res.data, []));
      }
    } catch (e) {
      console.log("Error loading assignments", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
        fetchAssignments();
    }, [fetchAssignments])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
  };

  const handleSubmit = async () => {
    if (!submissionUrl) return;
    const assignmentId = selectedAssignment?.id || selectedAssignment?._id;
    if (!assignmentId) return;

    setIsSubmitting(true);
    try {
      const res = await assignmentsApi.submit(assignmentId, submissionUrl);
      if (isApiSuccess(res.data)) {
        setSelectedAssignment(null);
        setSubmissionUrl("");
        fetchAssignments();
      }
    } catch (e) {
      console.log("Submit error", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAssignmentCard = (item: any) => {
    const isSubmitted = Array.isArray(item?.submissions) && item.submissions.length > 0;
    const moduleName = item.courses?.title || item.course?.title || "Project Track";
    const dueDate = item.due_date ? new Date(item.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : "Sunday";

    return (
        <TouchableOpacity 
            key={item.id} 
            onPress={() => setSelectedAssignment(item)}
            activeOpacity={0.9}
            className="bg-white rounded-[44px] p-8 mb-8 border border-white shadow-2xl shadow-slate-900/[0.04]"
        >
            <View className="flex-row items-center justify-between mb-8">
                <View className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{moduleName}</Text>
                </View>
                <View className={`flex-row items-center gap-2 ${isSubmitted ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"} px-4 py-2 rounded-2xl border`}>
                    {isSubmitted ? <CheckCircle2 size={12} color="#10B981" /> : <Clock size={12} color="#D97706" />}
                    <Text className={`text-[10px] font-black uppercase tracking-widest ${isSubmitted ? "text-emerald-600" : "text-amber-600"}`}>
                        {isSubmitted ? "Completed" : "Pending"}
                    </Text>
                </View>
            </View>

            <Text className="text-3xl font-black text-slate-900 mb-2 leading-tight tracking-tight">{item.title}</Text>
            <Text className="text-slate-400 text-base font-bold leading-6 mb-8" numberOfLines={2}>{item.description}</Text>

            <View className="flex-row items-center justify-between border-t border-slate-50 pt-8">
                <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100">
                       <Calendar size={16} color="#64748B" />
                    </View>
                    <View>
                       <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline</Text>
                       <Text className="text-slate-900 text-xs font-black">{dueDate}</Text>
                    </View>
                </View>
                <View className="bg-slate-900 px-6 py-4 rounded-2xl shadow-lg shadow-slate-200">
                    <Text className="text-white font-black text-[11px] uppercase tracking-widest">Open Lab</Text>
                </View>
            </View>
        </TouchableOpacity>
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
                    <Text className="text-blue-700 text-[10px] font-black uppercase tracking-widest">Mastery Challenges</Text>
                  </View>
                  <Sparkles size={14} color="#3B82F6" />
                </View>
                <Text className="text-[40px] font-black text-slate-900 leading-[44px] tracking-tight">
                   Project <Text className="text-blue-600">Lab</Text>
                </Text>
                <Text className="text-slate-400 font-bold text-base mt-4 leading-6 max-w-[90%]">
                    Demonstrate your technical depth and receive architect-level feedback on your code.
                </Text>
            </View>

            <View className="px-6 pb-32">
                {isLoading ? (
                    <View className="gap-8">
                       <Skeleton height={280} className="rounded-[48px]" />
                       <Skeleton height={280} className="rounded-[48px]" />
                    </View>
                ) : assignments.length > 0 ? (
                    assignments.map(item => renderAssignmentCard(item))
                ) : (
                    <View className="items-center py-24 bg-white rounded-[56px] border border-dashed border-slate-200">
                        <View className="w-24 h-24 bg-slate-50 rounded-full items-center justify-center mb-8">
                           <FileText size={40} color="#CBD5E1" />
                        </View>
                        <Text className="text-slate-400 font-black text-xl tracking-tight">No challenges found</Text>
                        <Text className="text-slate-300 text-[10px] mt-2 font-black uppercase tracking-[2px]">Your project queue is clear</Text>
                    </View>
                )}
            </View>
        </View>
      </ScrollView>

      {/* Assignment Submission Modal */}
      <Modal visible={!!selectedAssignment} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaWrapper bgWhite>
            <View className="flex-row items-center justify-between px-6 py-4">
                <TouchableOpacity onPress={() => setSelectedAssignment(null)} className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center border border-slate-100">
                    <ChevronLeft size={24} color="#0F172A" strokeWidth={2.5} />
                </TouchableOpacity>
                <Text className="text-lg font-black text-slate-900">Project Console</Text>
                <View className="w-12 h-12" />
            </View>

            <ScrollView className="flex-1 bg-[#F8FAFC]" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View className="px-8 pt-10 mb-10">
                    <View className="bg-blue-600 self-start px-4 py-1.5 rounded-full mb-6 shadow-lg shadow-blue-200">
                        <Text className="text-white text-[10px] font-black uppercase tracking-widest">Active Sprint</Text>
                    </View>
                    <Text className="text-[34px] font-black text-slate-900 mb-4 leading-tight tracking-tight">{selectedAssignment?.title}</Text>
                    <Text className="text-slate-400 font-bold text-base leading-6">
                        {selectedAssignment?.description}
                    </Text>
                </View>

                {/* Requirements Card */}
                <View className="mx-6 bg-white rounded-[48px] p-10 border border-white shadow-2xl shadow-slate-900/[0.04] mb-10">
                    <View className="flex-row items-center gap-4 mb-10">
                        <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center shadow-sm">
                           <Shield size={24} color="#2563EB" />
                        </View>
                        <Text className="text-slate-900 font-black text-xl tracking-tight">Compliance Check</Text>
                    </View>

                    {[
                        "Public GitHub repository with clear commit history.",
                        "Architectural diagram or high-level project overview.",
                        "Fully responsive layouts across all device breakpoints."
                    ].map((req, i) => (
                        <View key={i} className="flex-row items-start gap-4 mb-8">
                            <View className="w-6 h-6 rounded-full bg-emerald-50 items-center justify-center mt-0.5 border border-emerald-100">
                               <CheckCircle2 size={14} color="#10B981" />
                            </View>
                            <Text className="flex-1 text-slate-600 font-black text-sm leading-6">{req}</Text>
                        </View>
                    ))}

                    <View className="mt-6 pt-10 border-t border-slate-50">
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Submission Endpoint (URL)</Text>
                        <View className="flex-row items-center bg-slate-50 rounded-[24px] px-6 py-5 border border-slate-100">
                           <LinkIcon size={18} color="#94A3B8" className="mr-4" />
                           <Input 
                               placeholder="https://github.com/..."
                               value={submissionUrl}
                               onChangeText={setSubmissionUrl}
                               containerClassName="flex-1 h-8 bg-transparent border-0 p-0"
                               inputClassName="text-sm font-black text-slate-900"
                           />
                        </View>
                    </View>
                </View>

                {/* Status Dashboard */}
                <View className="mx-6 flex-row justify-between mb-10">
                   <View className="w-[48%] bg-slate-900 rounded-[36px] p-8 shadow-2xl shadow-slate-900/10">
                      <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">Weight</Text>
                      <Text className="text-white text-3xl font-black mb-1">15%</Text>
                      <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Final Score</Text>
                   </View>
                   <View className="w-[48%] bg-white rounded-[36px] p-8 border border-white shadow-2xl shadow-slate-900/[0.04]">
                      <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Deadline</Text>
                      <Text className="text-slate-900 text-2xl font-black mb-1">48h</Text>
                      <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Remaining</Text>
                   </View>
                </View>

                {/* Finalize Action */}
                <View className="mx-6 bg-white rounded-[56px] p-12 items-center border border-dashed border-slate-200">
                    <Trophy size={48} color="#CBD5E1" className="mb-6" />
                    <Text className="text-slate-900 font-black text-2xl mb-2 tracking-tight">Finalize Build</Text>
                    <Text className="text-slate-400 text-center font-bold text-sm mb-10 leading-5">Our architects will audit your code for patterns, security, and performance.</Text>
                    
                    <TouchableOpacity 
                        onPress={handleSubmit}
                        disabled={isSubmitting || !submissionUrl}
                        activeOpacity={0.8}
                        className="w-full"
                    >
                        <LinearGradient
                           colors={submissionUrl ? ['#1E293B', '#0F172A'] : ['#F1F5F9', '#E2E8F0']}
                           className="py-6 rounded-[28px] flex-row items-center justify-center gap-3"
                        >
                           {isSubmitting ? (
                               <ActivityIndicator color="white" />
                           ) : (
                               <>
                                   <Text className={`font-black text-sm uppercase tracking-widest ${submissionUrl ? 'text-white' : 'text-slate-400'}`}>Dispatch Work</Text>
                                   <Send size={18} color={submissionUrl ? "white" : "#94A3B8"} />
                               </>
                           )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaWrapper>
      </Modal>
    </SafeAreaWrapper>
  );
}
