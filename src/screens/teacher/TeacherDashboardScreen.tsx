import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, useWindowDimensions, Image, ActivityIndicator, Alert, Linking } from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { coursesApi, doubtsApi, interviewsApi, teacherApi } from "../../api/endpoints";
import { 
  BookOpen, 
  Users, 
  HelpCircle, 
  Calendar,
  ChevronRight,
  Code,
  CheckCircle2,
  Video,
  Bell,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  Clock
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { extractApiData, isApiSuccess } from "../../api/response";
import { AppHeader } from "../../components/AppHeader";
import { useAuth } from "../../context/AuthContext";
import { Course, Doubt } from "../../types";
import { AppNavigationProp } from "../../types/navigation";
import { LinearGradient } from "expo-linear-gradient";

export default function TeacherDashboardScreen({ navigation }: { navigation: AppNavigationProp }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [pendingDoubts, setPendingDoubts] = useState<Doubt[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const { user } = useAuth();

  const fetchTeacherData = async () => {
    try {
      const [coursesRes, doubtsRes, interviewsRes, activityRes, statsRes] = await Promise.allSettled([
        coursesApi.teacherCourses(),
        doubtsApi.teacherDoubts(),
        interviewsApi.teacherInterviews(),
        teacherApi.activity(),
        teacherApi.stats(),
      ]);

      if (coursesRes.status === "fulfilled" && isApiSuccess(coursesRes.value.data)) {
        setCourses(extractApiData<Course[]>(coursesRes.value.data, []));
      }
      if (doubtsRes.status === "fulfilled" && isApiSuccess(doubtsRes.value.data)) {
        const doubts = extractApiData<Doubt[]>(doubtsRes.value.data, []);
        // Simplified: If no reply, it's pending.
        setPendingDoubts(doubts.filter(d => !d.reply));
      }
      if (interviewsRes.status === "fulfilled" && isApiSuccess(interviewsRes.value.data)) {
        const interviews = extractApiData<any[]>(interviewsRes.value.data, []);
        setUpcomingInterviews(interviews.filter(i => i.status === "scheduled" || i.status === "pending"));
      }
      if (activityRes.status === "fulfilled" && isApiSuccess(activityRes.value.data)) {
        setActivities(extractApiData<any[]>(activityRes.value.data, []));
      }
      if (statsRes.status === "fulfilled" && isApiSuccess(statsRes.value.data)) {
        setDashboardStats(extractApiData(statsRes.value.data, null));
      }
    } catch (e) {
      console.log("Error loading dashboard", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleCompleteSession = async (interviewId: string, studentId: string) => {
    Alert.alert(
      "Session Outcome",
      "Finalize this session and notify the candidate?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm Completion", 
          onPress: async () => {
            try {
              setIsLoading(true);
              const res = await interviewsApi.complete(interviewId, {
                score: 80,
                notes: "Session completed. Review feedback in the career portal."
              });
              if (isApiSuccess(res.data)) {
                Alert.alert("Success", "Session archived successfully.");
                fetchTeacherData();
              }
            } catch (e) {
              Alert.alert("Error", "Could not complete session.");
            } finally {
              setIsLoading(false);
            }
          } 
        }
      ]
    );
  };

  const handleOpenLink = async (url: string) => {
    if (!url) {
      Alert.alert("Notice", "Meeting link not yet available for this session.");
      return;
    }
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert("Error", "Could not open meeting link.");
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const totalStudents = useMemo(
    () => dashboardStats?.total_students || courses.reduce((sum: number, item: Course) => sum + Number(item?.students_enrolled || 0), 0),
    [courses, dashboardStats]
  );

  const getActivityIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'submission': return <Code size={16} color="#2563EB" />;
      case 'doubt': return <HelpCircle size={16} color="#E11D48" />;
      case 'quiz': return <CheckCircle2 size={16} color="#10B981" />;
      default: return <Bell size={16} color="#64748B" />;
    }
  };

  const getActivityColorClass = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'submission': return 'bg-blue-100';
      case 'doubt': return 'bg-rose-100';
      case 'quiz': return 'bg-emerald-100';
      default: return 'bg-slate-100';
    }
  };

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} role="Teacher" />
      <ScrollView
        className="flex-1 bg-[#F8FAFC]"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTeacherData(); }} tintColor="#2563EB" />
        }
      >
        <View className="px-6 pt-10">
           {/* Welcome Section */}
           <View className="mb-10">
              <View className="flex-row items-center gap-2 mb-3">
                 <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-blue-700 text-[10px] font-black uppercase tracking-widest">Instructor Dashboard</Text>
                 </View>
                 <Sparkles size={14} color="#3B82F6" />
              </View>
              <Text className="text-[40px] font-black text-slate-900 leading-[44px] tracking-tight">
                 Teacher <Text className="text-blue-600">Hub</Text>
              </Text>
              <Text className="text-slate-400 text-base font-bold mt-2">Welcome back, {user?.name?.split(' ')[0] || "Professor"}.</Text>
           </View>

           {/* Stats Grid */}
           <View className="flex-row flex-wrap justify-between">
              {/* Courses Card */}
              <TouchableOpacity 
                onPress={() => navigation.navigate("TeacherCoursesTab")}
                activeOpacity={0.9}
                className="w-[48%] bg-white p-6 rounded-[36px] mb-4 shadow-2xl shadow-slate-900/[0.03] border border-slate-50"
              >
                 <View className="bg-blue-50 w-12 h-12 rounded-2xl items-center justify-center mb-6">
                    <BookOpen size={20} color="#2563EB" />
                 </View>
                 <Text className="text-3xl font-black text-slate-900 mb-1">{courses.length < 10 ? `0${courses.length}` : courses.length}</Text>
                 <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tracks</Text>
              </TouchableOpacity>

              {/* Students Card */}
              <View className="w-[48%] bg-white p-6 rounded-[36px] mb-4 shadow-2xl shadow-slate-900/[0.03] border border-slate-50">
                 <View className="bg-indigo-50 w-12 h-12 rounded-2xl items-center justify-center mb-6">
                    <Users size={20} color="#4F46E5" />
                 </View>
                 <Text className="text-3xl font-black text-slate-900 mb-1">{totalStudents}</Text>
                 <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Enrolled</Text>
              </View>

              {/* Doubts Card */}
              <TouchableOpacity 
                onPress={() => navigation.navigate("TeacherDoubtsTab")}
                activeOpacity={0.9}
                className="w-[48%] bg-white p-6 rounded-[36px] mb-4 shadow-2xl shadow-slate-900/[0.03] border border-slate-50 relative overflow-hidden"
              >
                 <View className="bg-rose-50 w-12 h-12 rounded-2xl items-center justify-center mb-6">
                    <HelpCircle size={20} color="#E11D48" />
                 </View>
                 <Text className="text-3xl font-black text-slate-900 mb-1">{pendingDoubts.length < 10 ? `0${pendingDoubts.length}` : pendingDoubts.length}</Text>
                 <View className="flex-row items-center gap-1">
                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Doubts</Text>
                    {pendingDoubts.length > 0 && <View className="w-1.5 h-1.5 bg-rose-500 rounded-full" />}
                 </View>
              </TouchableOpacity>

              {/* Interviews Card */}
              <TouchableOpacity 
                onPress={() => navigation.navigate("TeacherCareerTab")}
                activeOpacity={0.9}
                className="w-[48%] bg-slate-900 p-6 rounded-[36px] mb-4 shadow-2xl shadow-slate-900/10"
              >
                 <View className="bg-white/10 w-12 h-12 rounded-2xl items-center justify-center mb-6">
                    <Calendar size={20} color="#3B82F6" />
                 </View>
                 <Text className="text-3xl font-black text-white mb-1">{upcomingInterviews.length < 10 ? `0${upcomingInterviews.length}` : upcomingInterviews.length}</Text>
                 <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interviews</Text>
              </TouchableOpacity>
           </View>

           {/* Quick Actions / Highlights */}
           <View className="mt-8 mb-10">
              <LinearGradient
                colors={['#1E293B', '#0F172A']}
                className="rounded-[40px] p-8 overflow-hidden"
              >
                 <View className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16" />
                 <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-4">
                       <Text className="text-white text-xl font-black mb-2">Publish Vacancy</Text>
                       <Text className="text-slate-400 text-xs font-bold leading-4">Find top talent for your industry partners.</Text>
                       <TouchableOpacity 
                         onPress={() => navigation.navigate("TeacherCareerTab", { screen: 'TeacherJobsHome' })}
                         className="bg-blue-600 self-start px-5 py-2.5 rounded-full mt-6"
                       >
                          <Text className="text-white font-black text-[10px] uppercase tracking-widest">Broadcast Now</Text>
                       </TouchableOpacity>
                    </View>
                    <View className="bg-white/5 w-20 h-20 rounded-[32px] items-center justify-center border border-white/10">
                       <Bell size={28} color="white" />
                    </View>
                 </View>
              </LinearGradient>
           </View>

           {/* Upcoming Schedule */}
           <View className="mb-10">
              <View className="flex-row items-center justify-between mb-6">
                 <Text className="text-2xl font-black text-slate-900">Today's Schedule</Text>
                 <TouchableOpacity onPress={() => navigation.navigate("TeacherCareerTab")}>
                    <Text className="text-xs font-black text-blue-600">View Calendar</Text>
                 </TouchableOpacity>
              </View>

              {upcomingInterviews.length > 0 ? (
                upcomingInterviews.map((interview, idx) => (
                  <View key={interview.id || idx} className="bg-white rounded-[32px] p-6 border border-slate-50 mb-4 flex-row items-center shadow-2xl shadow-slate-900/[0.02]">
                     <View className="bg-slate-50 w-14 h-14 rounded-2xl items-center justify-center mr-4">
                        <Clock size={20} color="#64748B" />
                        <Text className="text-[8px] font-black text-slate-400 uppercase mt-1">{interview.time?.split(' ')[1] || "AM"}</Text>
                     </View>
                     <View className="flex-1">
                        <Text className="text-sm font-black text-slate-900 mb-0.5">{interview.title || "Technical Interview"}</Text>
                        <View className="flex-row items-center gap-1.5">
                           <View className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                           <Text className="text-slate-400 text-[11px] font-bold">{interview.student_name || interview.profiles?.name || "Student Session"}</Text>
                        </View>
                     </View>
                     <View className="flex-row gap-2">
                       <TouchableOpacity 
                         onPress={() => handleOpenLink(interview.meeting_link)}
                         className="bg-slate-900 px-5 py-3 rounded-2xl"
                       >
                          <Text className="text-white font-black text-[10px] uppercase tracking-wider">Join</Text>
                       </TouchableOpacity>
                       <TouchableOpacity 
                         onPress={() => handleCompleteSession(interview.id, interview.student_id || interview.profiles?.id)}
                         className="bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-100"
                       >
                          <CheckCircle2 size={16} color="#10B981" />
                       </TouchableOpacity>
                     </View>
                  </View>
                ))
              ) : (
                <View className="bg-white rounded-[40px] p-10 border border-slate-50 items-center justify-center">
                   <View className="bg-slate-50 w-16 h-16 rounded-full items-center justify-center mb-4">
                      <Calendar size={24} color="#CBD5E1" />
                   </View>
                   <Text className="text-slate-400 text-xs font-black text-center uppercase tracking-widest">No sessions scheduled</Text>
                </View>
              )}
           </View>

           {/* Activity Feed */}
           <View className="mb-10">
              <View className="flex-row items-center justify-between mb-8">
                 <View>
                    <Text className="text-2xl font-black text-slate-900">Student Pulse</Text>
                    <Text className="text-slate-400 text-[11px] font-bold mt-0.5">Real-time interaction feed</Text>
                 </View>
                 <TouchableOpacity>
                    <ArrowUpRight size={20} color="#CBD5E1" />
                 </TouchableOpacity>
              </View>

              {activities.length > 0 ? (
                activities.slice(0, 5).map((item, idx) => (
                  <View key={item.id || idx} className="flex-row mb-8">
                     <View className="items-center mr-5">
                        <View className={`w-12 h-12 rounded-2xl ${getActivityColorClass(item.type)} items-center justify-center z-10 border-4 border-white shadow-sm`}>
                           {getActivityIcon(item.type)}
                        </View>
                        {idx < activities.length - 1 && <View className="w-[2px] flex-1 bg-slate-100 my-2" />}
                     </View>
                     <View className="flex-1 pt-1">
                        <View className="flex-row justify-between items-start mb-2">
                           <Text className="text-sm font-black text-slate-900 flex-1 mr-2 leading-tight" numberOfLines={2}>
                              {item.title || "Curriculum Update"}
                           </Text>
                           <Text className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">
                              {item.time_ago || "Recent"}
                           </Text>
                        </View>
                        <Text className="text-xs text-slate-500 font-medium leading-4 mb-4">{item.description}</Text>
                        
                        <View className="flex-row gap-2">
                          {item.type === 'submission' && (item.status === 'pending' || !item.status) && (
                            <TouchableOpacity 
                              onPress={() => navigation.navigate("TeacherReviewSubmission", { submissionId: item.id })}
                              className="bg-blue-600 px-4 py-2 rounded-xl"
                            >
                               <Text className="text-[9px] font-black text-white uppercase tracking-widest">Review Work</Text>
                            </TouchableOpacity>
                          )}
                          {item.status === 'resolved' && (
                             <View className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                <Text className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Resolved</Text>
                             </View>
                          )}
                        </View>
                     </View>
                  </View>
                ))
              ) : (
                <View className="bg-slate-50 rounded-[40px] p-12 items-center justify-center border border-slate-100 border-dashed">
                   <MessageSquare size={32} color="#E2E8F0" />
                   <Text className="text-slate-400 text-xs font-black mt-4 uppercase tracking-widest">All caught up</Text>
                </View>
              )}
           </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
