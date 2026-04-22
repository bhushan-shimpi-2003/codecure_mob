import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { assignmentsApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { 
  ChevronLeft, 
  Search, 
  Filter, 
  ArrowUpRight, 
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowLeft
} from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";
import { LinearGradient } from "expo-linear-gradient";

export default function TeacherSubmissionsScreen({ navigation, route }: any) {
  const { assignmentId, assignmentTitle } = route.params || {};
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubmissions = async () => {
    if (!assignmentId) return;
    try {
      const res = await assignmentsApi.submissionsByAssignment(assignmentId);
      if (isApiSuccess(res.data)) {
        setSubmissions(extractApiData<any[]>(res.data, []));
      }
    } catch (e) {
      console.log("Error fetching submissions", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [assignmentId]);

  const gradedCount = submissions.filter(s => s.score !== null).length;
  const pendingCount = submissions.length - gradedCount;

  if (isLoading && !refreshing) {
     return (
       <SafeAreaWrapper bgWhite>
         <AppHeader navigation={navigation} role="Teacher" />
         <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-6">Loading Submissions...</Text>
         </View>
       </SafeAreaWrapper>
     );
  }

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} role="Teacher" />
      <ScrollView
        className="flex-1 bg-[#F8FAFC]"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSubmissions(); }} tintColor="#2563EB" />
        }
      >
        <View className="px-6 pt-10">
           {/* Back Action */}
           <TouchableOpacity 
             onPress={() => navigation.goBack()} 
             className="flex-row items-center mb-10"
           >
              <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-sm border border-slate-50 mr-4">
                 <ArrowLeft size={18} color="#64748B" />
              </View>
              <View>
                 <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Return to Lab</Text>
                 <Text className="text-slate-900 text-sm font-black tracking-tight">Assignment Console</Text>
              </View>
           </TouchableOpacity>

           {/* Header Section */}
           <View className="mb-10">
              <View className="flex-row items-center gap-2 mb-3">
                 <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-blue-700 text-[10px] font-black uppercase tracking-widest">Review Portal</Text>
                 </View>
                 <Sparkles size={14} color="#3B82F6" />
              </View>
              <Text className="text-[34px] font-black text-slate-900 leading-[40px] tracking-tight">
                 {assignmentTitle || "Submissions"}
              </Text>
           </View>

           {/* Stats Ribbon */}
           <View className="flex-row items-center justify-between mb-10 bg-white p-6 rounded-[36px] shadow-2xl shadow-slate-900/[0.03] border border-slate-50">
              <View className="flex-row items-center gap-6">
                 <View className="items-center">
                    <Text className="text-2xl font-black text-emerald-600">{gradedCount}</Text>
                    <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Graded</Text>
                 </View>
                 <View className="w-[1px] h-8 bg-slate-100" />
                 <View className="items-center">
                    <Text className="text-2xl font-black text-amber-500">{pendingCount}</Text>
                    <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending</Text>
                 </View>
              </View>
              <View className="flex-row gap-3">
                 <TouchableOpacity className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center border border-slate-100">
                    <Search size={18} color="#64748B" />
                 </TouchableOpacity>
                 <TouchableOpacity className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center border border-slate-100">
                    <Filter size={18} color="#64748B" />
                 </TouchableOpacity>
              </View>
           </View>

           {/* Submission Feed */}
           <View className="gap-6">
              {submissions.map((submission, idx) => {
                const student = submission.profiles || {};
                const isGraded = submission.score !== null;
                
                return (
                  <TouchableOpacity 
                    key={submission.id || submission._id}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate("TeacherReviewSubmission", { submission })}
                    className="bg-white rounded-[40px] p-6 border border-white shadow-2xl shadow-slate-900/[0.04] flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center flex-1 pr-4">
                       <View className="w-16 h-16 rounded-[24px] bg-slate-50 border-2 border-slate-50 mr-4 overflow-hidden shadow-sm">
                          <Image 
                            source={{ uri: student.avatar_url || `https://ui-avatars.com/api/?name=${student.name || 'S'}&background=random` }} 
                            className="w-full h-full"
                          />
                       </View>
                       <View className="flex-1">
                          <Text className="text-lg font-black text-slate-900 tracking-tight" numberOfLines={1}>{student.name || "Student"}</Text>
                          <View className="flex-row items-center mt-1">
                             <Clock size={12} color="#94A3B8" />
                             <Text className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-tight">
                               {isGraded ? `Score: ${submission.score}/100` : `Posted ${new Date(submission.created_at).toLocaleDateString()}`}
                             </Text>
                          </View>
                       </View>
                    </View>
                    
                    <View className="items-center">
                       {isGraded ? (
                         <View className="w-12 h-12 rounded-2xl bg-emerald-50 items-center justify-center border border-emerald-100 shadow-sm">
                            <CheckCircle2 size={22} color="#10B981" />
                         </View>
                       ) : (
                         <View className="w-12 h-12 rounded-2xl bg-blue-600 items-center justify-center shadow-lg shadow-blue-200">
                            <ArrowUpRight size={22} color="white" />
                         </View>
                       )}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {submissions.length === 0 && (
                <View className="items-center justify-center py-20 bg-slate-50 rounded-[44px] border border-dashed border-slate-200">
                   <Layers size={40} color="#CBD5E1" />
                   <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-4">No submissions received</Text>
                </View>
              )}
           </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
