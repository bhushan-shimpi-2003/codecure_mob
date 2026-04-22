import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
  Image,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { assignmentsApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { COLORS } from "../../utils/theme";
import { 
  ChevronLeft, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Circle,
  CheckCircle2,
  Clock,
} from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";

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

  return (
    <SafeAreaWrapper>
      <AppHeader navigation={navigation} role="Teacher" />
      <ScrollView
        className="flex-1 bg-[#F8FAFC]"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSubmissions(); }} />}
      >
        <View className="px-6 pt-6">
          <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center mb-6">
            <ChevronLeft size={16} color="#94A3B8" />
            <Text className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-wider">BACK TO LAB</Text>
          </TouchableOpacity>

          <Text className="text-3xl font-black text-slate-900 mb-2">{assignmentTitle || "Active Submissions"}</Text>
          
          <View className="flex-row items-center justify-between mb-8">
             <View className="flex-row items-center">
                <View className="bg-emerald-100 px-3 py-1 rounded-full mr-2">
                   <Text className="text-[10px] font-black text-emerald-600">{gradedCount} GRADED</Text>
                </View>
                <View className="bg-amber-100 px-3 py-1 rounded-full">
                   <Text className="text-[10px] font-black text-amber-600">{pendingCount} PENDING</Text>
                </View>
             </View>
             <View className="flex-row gap-2">
                <TouchableOpacity className="w-10 h-10 rounded-2xl bg-white border border-slate-100 items-center justify-center shadow-sm">
                   <Search size={18} color="#94A3B8" />
                </TouchableOpacity>
                <TouchableOpacity className="w-10 h-10 rounded-2xl bg-white border border-slate-100 items-center justify-center shadow-sm">
                   <Filter size={18} color="#94A3B8" />
                </TouchableOpacity>
             </View>
          </View>

          <View className="gap-4">
            {submissions.map((submission, idx) => {
              const student = submission.profiles || {};
              const isGraded = submission.score !== null;
              
              return (
                <TouchableOpacity 
                  key={submission.id || submission._id}
                  onPress={() => navigation.navigate("TeacherReviewSubmission", { submission })}
                  className="bg-white rounded-[32px] p-5 border border-slate-50 shadow-sm flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 rounded-2xl bg-slate-100 mr-4 overflow-hidden">
                       <Image 
                         source={{ uri: student.avatar_url || `https://ui-avatars.com/api/?name=${student.name || 'S'}&background=random` }} 
                         className="w-full h-full"
                       />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-black text-slate-900 mb-1">{student.name || "Anonymous Student"}</Text>
                      <View className="flex-row items-center">
                        <Clock size={10} color="#94A3B8" />
                        <Text className="text-[9px] font-bold text-slate-400 ml-1">
                          {isGraded ? `Graded: ${submission.score}/100` : `Submitted ${new Date(submission.created_at).toLocaleDateString()}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center">
                    {isGraded ? (
                      <CheckCircle2 size={20} color="#10B981" />
                    ) : (
                      <View className="w-10 h-10 rounded-2xl bg-blue-50 items-center justify-center">
                         <ArrowUpRight size={18} color="#2563EB" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {submissions.length === 0 && (
               <View className="items-center justify-center py-20">
                  <Circle size={40} color="#E2E8F0" />
                  <Text className="text-slate-400 font-bold mt-4">No submissions yet</Text>
               </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
