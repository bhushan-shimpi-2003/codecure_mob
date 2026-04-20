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
    ArrowRight
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
    const moduleName = item.courses?.title || item.course?.title || "Frontend Module 04";
    const dueDate = item.due_date ? new Date(item.due_date).toLocaleDateString() : "Next Sunday";

    return (
        <TouchableOpacity 
            key={item.id} 
            onPress={() => setSelectedAssignment(item)}
            activeOpacity={0.8}
            className="bg-white rounded-[40px] p-8 mb-6 border border-slate-50 shadow-2xl shadow-slate-900/[0.03]"
        >
            <View className="flex-row items-center justify-between mb-6">
                <View className="bg-slate-100 px-4 py-1.5 rounded-full">
                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{moduleName}</Text>
                </View>
                <View className={`flex-row items-center gap-2 ${isSubmitted ? "bg-emerald-50" : "bg-amber-50"} px-4 py-1.5 rounded-full`}>
                    {isSubmitted ? <CheckCircle size={10} color="#059669" /> : <Clock size={10} color="#D97706" />}
                    <Text className={`text-[10px] font-black uppercase tracking-widest ${isSubmitted ? "text-emerald-600" : "text-amber-600"}`}>
                        {isSubmitted ? "Submitted" : "Pending"}
                    </Text>
                </View>
            </View>

            <Text className="text-2xl font-black text-slate-900 mb-2">{item.title}</Text>
            <Text className="text-slate-400 text-sm leading-6 mb-8" numberOfLines={2}>{item.description}</Text>

            <View className="flex-row items-center justify-between border-t border-slate-50 pt-6">
                <View className="flex-row items-center gap-2">
                    <Clock size={14} color={COLORS.slate400} />
                    <Text className="text-slate-400 text-xs font-bold">Due: {dueDate}</Text>
                </View>
                <View className="flex-row items-center">
                    <Text className="text-blue-600 font-black text-xs uppercase tracking-widest mr-2">Open Assignment</Text>
                    <ArrowRight size={14} color={COLORS.primary} strokeWidth={3} />
                </View>
            </View>
        </TouchableOpacity>
    );
  };

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader showMenu role={user?.role} subtitle="Student Hub" />

      <ScrollView 
        className="flex-1 bg-[#F8FAFC]"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }}>
            
            <View className="px-6 pt-10 pb-8">
                <Text className="text-blue-600 text-[10px] font-black uppercase tracking-[3px] mb-2">Student Workflow</Text>
                <Text className="text-4xl font-black text-slate-900 mb-4">Assignments</Text>
                <Text className="text-slate-400 font-bold text-sm leading-6">
                    Demonstrate your skills and get professional feedback on your projects.
                </Text>
            </View>

            <View className="px-6 pb-24">
                {isLoading ? (
                    <View className="gap-8"><Skeleton height={200} className="rounded-[40px]" /><Skeleton height={200} className="rounded-[40px]" /></View>
                ) : assignments.length > 0 ? (
                    assignments.map(item => renderAssignmentCard(item))
                ) : (
                    <View className="items-center py-20 bg-white rounded-[44px] border border-slate-100 border-dashed">
                        <FileText size={48} color={COLORS.slate200} />
                        <Text className="text-slate-400 font-bold mt-4">No assignments found.</Text>
                    </View>
                )}
            </View>
        </View>
      </ScrollView>

      {/* Assignment Submission Modal */}
      <Modal visible={!!selectedAssignment} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaWrapper bgWhite>
            <View className="flex-row items-center px-6 py-4">
                <TouchableOpacity onPress={() => setSelectedAssignment(null)}>
                    <ChevronLeft size={24} color={COLORS.primary} strokeWidth={3} />
                </TouchableOpacity>
                <Text className="ml-4 text-lg font-black text-slate-900">CodeCure Academy</Text>
            </View>

            <ScrollView className="flex-1 pt-6" showsVerticalScrollIndicator={false}>
                <View className="px-8 mb-10">
                    <View className="bg-blue-100/50 px-4 py-1.5 rounded-full self-start mb-4">
                        <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Frontend Module 04</Text>
                    </View>
                    <Text className="text-3xl font-black text-slate-900 mb-4 leading-tight">{selectedAssignment?.title}</Text>
                    <Text className="text-slate-500 font-bold text-sm leading-6">
                        {selectedAssignment?.description}
                    </Text>
                </View>

                {/* Requirements Card */}
                <View className="mx-6 bg-white rounded-[44px] p-8 border border-slate-50 shadow-2xl shadow-slate-900/[0.04] mb-8">
                    <View className="flex-row items-center gap-3 mb-8">
                        <FileText size={20} color={COLORS.primary} />
                        <Text className="text-slate-900 font-black text-base">Submission Requirements</Text>
                    </View>

                    {[
                        "Include a link to a public GitHub repository or a hosted preview link.",
                        "Provide a screenshot of your layout's mobile view for verification.",
                        "Ensure all media queries are optimized for modern breakpoints."
                    ].map((req, i) => (
                        <View key={i} className="flex-row items-start gap-4 mb-6">
                            <CheckCircle size={18} color={COLORS.primary} className="mt-0.5" />
                            <Text className="flex-1 text-slate-600 font-bold text-sm leading-5">{req}</Text>
                        </View>
                    ))}

                    <View className="mt-4">
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Github / Drive Link</Text>
                        <Input 
                            placeholder="https://github.com/username/project"
                            value={submissionUrl}
                            onChangeText={setSubmissionUrl}
                            containerClassName="h-16 rounded-2xl bg-slate-50 border-0 px-6"
                            inputClassName="text-sm"
                        />
                    </View>
                </View>

                {/* Due Date Card */}
                <View className="mx-6 bg-blue-600 rounded-[34px] p-8 mb-8 shadow-xl shadow-blue-900/30">
                    <Text className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-2">Due Date</Text>
                    <Text className="text-white text-2xl font-black mb-6">Tomorrow, 11:59 PM</Text>
                    <View className="h-2 bg-white/20 rounded-full overflow-hidden mb-3">
                        <View className="h-full bg-white w-3/4 rounded-full" />
                    </View>
                    <Text className="text-white/80 text-[10px] font-bold">75% of your class has already submitted.</Text>
                </View>

                {/* Visual Proof */}
                <View className="mx-6 bg-white rounded-[34px] p-8 border border-slate-50 mb-8 items-center">
                    <Text className="self-start text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">Visual Proof</Text>
                    <TouchableOpacity className="w-full border-2 border-slate-100 border-dashed rounded-[34px] py-10 items-center">
                        <UploadCloud size={32} color={COLORS.slate300} />
                        <Text className="text-slate-900 font-black text-sm mt-3">Upload Image</Text>
                        <Text className="text-slate-400 text-[10px] font-bold mt-1">PNG, JPG up to 10MB</Text>
                    </TouchableOpacity>
                </View>

                {/* Actions */}
                <View className="mx-6 bg-slate-50 rounded-[44px] p-10 items-center mb-12">
                    <Text className="text-slate-900 font-black text-xl mb-2">Ready to finalize?</Text>
                    <Text className="text-slate-400 text-center font-bold text-xs mb-8">You can revise your submission until the deadline.</Text>
                    <TouchableOpacity 
                        onPress={handleSubmit}
                        disabled={isSubmitting || !submissionUrl}
                        className="w-full bg-blue-600 py-6 rounded-[30px] flex-row items-center justify-center shadow-xl shadow-blue-900/40"
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <View className="flex-row items-center">
                                <Text className="text-white font-black text-base uppercase tracking-widest mr-3">Submit Assignment</Text>
                                <Send size={20} color="white" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Details / Legend */}
                <View className="px-10 pb-20 gap-10">
                    <View className="flex-row items-center gap-6">
                        <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center">
                            <GraduationCap size={24} color={COLORS.primary} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-900 font-black mb-1">Grade Weight</Text>
                            <Text className="text-slate-400 text-xs font-bold leading-5">This assignment accounts for 15% of your final course score.</Text>
                        </View>
                    </View>
                    <View className="flex-row items-center gap-6">
                        <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center">
                            <MessageSquare size={24} color={COLORS.primary} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-900 font-black mb-1">Peer Review</Text>
                            <Text className="text-slate-400 text-xs font-bold leading-5">Assignments are reviewed by 2 of your peers and 1 mentor.</Text>
                        </View>
                    </View>
                    <View className="flex-row items-center gap-6">
                        <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center">
                            <History size={24} color={COLORS.primary} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-900 font-black mb-1">Fast Grading</Text>
                            <Text className="text-slate-400 text-xs font-bold leading-5">Average turnaround for grades is 48 hours post-submission.</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaWrapper>
      </Modal>
    </SafeAreaWrapper>
  );
}
