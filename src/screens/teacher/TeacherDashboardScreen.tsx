import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, useWindowDimensions, Image } from "react-native";
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
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { extractApiData, isApiSuccess } from "../../api/response";
import { AppHeader } from "../../components/AppHeader";
import { useAuth } from "../../context/AuthContext";

export default function TeacherDashboardScreen({ navigation }: any) {
  const [courses, setCourses] = useState<any[]>([]);
  const [pendingDoubts, setPendingDoubts] = useState<any[]>([]);
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
        setCourses(extractApiData<any[]>(coursesRes.value.data, []));
      }
      if (doubtsRes.status === "fulfilled" && isApiSuccess(doubtsRes.value.data)) {
        const doubts = extractApiData<any[]>(doubtsRes.value.data, []);
        setPendingDoubts(doubts.filter(d => d.status !== "resolved" && d.is_resolved !== true));
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

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const totalStudents = useMemo(
    () => dashboardStats?.total_students || courses.reduce((sum, item) => sum + Number(item?.students_enrolled || 0), 0),
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
    <SafeAreaWrapper>
      <AppHeader navigation={navigation} role="Teacher" />
      <ScrollView
        className="flex-1 bg-[#F8FAFC]"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTeacherData(); }} />
        }
      >
        <View className="px-6 pt-6">
          <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2">TEACHER DASHBOARD</Text>
          <Text className="text-4xl font-black text-slate-900 leading-[44px]">Welcome back, {user?.name?.split(' ')[0] || "Professor"}.</Text>
          <Text className="text-slate-500 text-sm mt-3 leading-5">
            Your students have been busy! You have {pendingDoubts.length} pending doubts and {upcomingInterviews.length} interviews scheduled today.
          </Text>

          {/* Stats Grid */}
          <View className="flex-row flex-wrap justify-between mt-10">
            {/* Courses */}
            <TouchableOpacity 
              className="w-[47%] bg-white p-6 rounded-[32px] mb-6 shadow-sm border border-slate-50"
              onPress={() => navigation.navigate("TeacherCoursesTab")}
            >
              <View className="bg-blue-50 w-12 h-12 rounded-2xl items-center justify-center mb-4">
                 <BookOpen size={20} color="#2563EB" />
              </View>
              <Text className="text-3xl font-black text-slate-900">{courses.length < 10 ? `0${courses.length}` : courses.length}</Text>
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">COURSES</Text>
            </TouchableOpacity>

            {/* Students */}
            <TouchableOpacity className="w-[47%] bg-white p-6 rounded-[32px] mb-6 shadow-sm border border-slate-50">
              <View className="bg-indigo-50 w-12 h-12 rounded-2xl items-center justify-center mb-4">
                 <Users size={20} color="#4F46E5" />
              </View>
              <Text className="text-3xl font-black text-slate-900">{totalStudents}</Text>
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">STUDENTS</Text>
            </TouchableOpacity>

            {/* Doubts */}
            <TouchableOpacity 
              className="w-[47%] bg-white p-6 rounded-[32px] mb-6 shadow-sm border border-slate-50 relative overflow-hidden"
              onPress={() => navigation.navigate("TeacherDoubtsTab")}
            >
              <View className="absolute top-0 right-0 w-16 h-16 bg-[#FFE4E6] rounded-full -mr-8 -mt-8" />
              <View className="absolute top-3 right-3 w-2 h-2 bg-[#E11D48] rounded-full" />
              <View className="bg-rose-50 w-12 h-12 rounded-2xl items-center justify-center mb-4">
                 <HelpCircle size={20} color="#E11D48" />
              </View>
              <Text className="text-3xl font-black text-slate-900">{pendingDoubts.length < 10 ? `0${pendingDoubts.length}` : pendingDoubts.length}</Text>
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PENDING DOUBTS</Text>
            </TouchableOpacity>

            {/* Interviews */}
            <TouchableOpacity 
              className="w-[47%] bg-[#1D4ED8] p-6 rounded-[32px] mb-6 shadow-xl shadow-blue-200"
              onPress={() => navigation.navigate("TeacherCareerTab")}
            >
              <View className="bg-white/20 w-12 h-12 rounded-2xl items-center justify-center mb-4">
                 <Calendar size={20} color="white" />
              </View>
              <Text className="text-3xl font-black text-white">{upcomingInterviews.length < 10 ? `0${upcomingInterviews.length}` : upcomingInterviews.length}</Text>
              <Text className="text-[10px] font-black text-blue-100 uppercase tracking-widest">INTERVIEWS</Text>
            </TouchableOpacity>
          </View>

          {/* Publish Vacancy Quick Action */}
          <View className="mt-8 mb-6">
             <TouchableOpacity 
               className="bg-[#2D2E32] rounded-[40px] p-8 flex-row items-center justify-between"
               onPress={() => navigation.navigate("TeacherCareerTab", { screen: 'TeacherJobs' })}
             >
                <View className="flex-1 mr-4">
                   <Text className="text-white text-xl font-black mb-2">Publish Vacancy</Text>
                   <Text className="text-slate-400 text-xs leading-4">Find talent for your projects or industry partners.</Text>
                </View>
                <View className="bg-blue-600 w-14 h-14 rounded-2xl items-center justify-center">
                   <Bell size={24} color="white" />
                </View>
             </TouchableOpacity>
          </View>
 
          {/* Upcoming Interviews */}
          <View>
            <Text className="text-xl font-black text-slate-900 mb-6">Upcoming Interviews</Text>
            
            {upcomingInterviews.length > 0 ? (
               upcomingInterviews.map((interview, idx) => (
                 <View key={interview.id || idx} className="bg-white rounded-[32px] p-6 border border-slate-100 mb-4 flex-row items-center justify-between shadow-sm">
                    <View>
                       <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
                          {interview.time || "Scheduled"}
                       </Text>
                       <Text className="text-base font-black text-slate-900">{interview.title || "Technical Interview"}</Text>
                       <Text className="text-slate-400 text-xs font-bold mt-0.5">{interview.student_name || interview.profiles?.name || "Student"}</Text>
                    </View>
                    <TouchableOpacity className="bg-blue-50 px-4 py-2 rounded-xl">
                       <Text className="text-blue-600 font-bold text-xs">Join</Text>
                    </TouchableOpacity>
                 </View>
               ))
            ) : (
              <View className="bg-white rounded-[32px] p-8 border border-slate-100 mb-8 items-center">
                <Calendar size={24} color="#CBD5E1" />
                <Text className="text-slate-400 text-xs font-bold mt-3">No interviews scheduled today</Text>
              </View>
            )}
          </View>
 
          {/* Efficiency Card */}
          {dashboardStats ? (
            <View className="bg-indigo-600 rounded-[36px] p-8 mt-4 mb-10 overflow-hidden shadow-xl shadow-indigo-100">
               <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white text-lg font-black">{dashboardStats.top_course || "Curriculum Efficiency"}</Text>
               </View>
               
               <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-indigo-100 text-[10px] font-black uppercase tracking-widest">BATCH AVG. SCORE</Text>
                  <Text className="text-white text-xs font-black">{dashboardStats.avg_score || "0"}%</Text>
               </View>
               <View className="h-2 bg-indigo-800 rounded-full overflow-hidden mb-4">
                  <View className="h-full bg-cyan-400" style={{ width: `${dashboardStats.avg_score || 0}%` }} />
               </View>
               <Text className="text-indigo-100 text-[11px] font-medium leading-4">{dashboardStats.efficiency_note || "Your currect batch performance data."}</Text>
            </View>
          ) : (
            <View className="bg-slate-800 rounded-[36px] p-8 mt-4 mb-10 overflow-hidden">
               <Text className="text-slate-400 text-xs font-bold text-center">Dashboard performance metrics available after first assessment.</Text>
            </View>
          )}
 
          {/* Recent Student Activity - NOW AT LAST */}
          <View className="mt-6 mb-10">
            <View className="flex-row items-center justify-between mb-6">
               <Text className="text-xl font-black text-slate-900">Recent student activity</Text>
               <TouchableOpacity>
                 <Text className="text-xs font-black text-blue-600">View all</Text>
               </TouchableOpacity>
            </View>
 
            {activities.length > 0 ? (
              activities.map((item, idx) => (
                <View key={item.id || idx} className="flex-row mb-8">
                   <View className="items-center mr-4">
                      <View className={`w-10 h-10 rounded-full ${getActivityColorClass(item.type)} items-center justify-center z-10`}>
                         {getActivityIcon(item.type)}
                      </View>
                      {idx < activities.length - 1 && <View className="w-[1.5px] flex-1 bg-slate-100 my-1" />}
                   </View>
                   <View className="flex-1 bg-white p-5 rounded-[28px] shadow-sm border border-slate-50">
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-sm font-black text-slate-900 w-[70%]" numberOfLines={2}>{item.title || "Generic Activity"}</Text>
                        <Text className="text-[10px] font-black text-slate-400 uppercase">{item.time_ago || "RECENT"}</Text>
                      </View>
                      <Text className="text-xs text-slate-500 leading-4">{item.description}</Text>
                      
                      <View className="flex-row gap-2 mt-3">
                        {item.type === 'submission' && (item.status === 'pending' || !item.status) && (
                          <TouchableOpacity 
                            onPress={() => navigation.navigate("TeacherReviewSubmission", { submissionId: item.id })}
                            className="bg-blue-50 self-start px-3 py-1.5 rounded-lg"
                          >
                            <Text className="text-[9px] font-black text-blue-600 uppercase tracking-wider">REVIEW REQUIRED</Text>
                          </TouchableOpacity>
                        )}
                        {item.status === 'resolved' && (
                          <View className="bg-slate-100 self-start px-3 py-1.5 rounded-lg">
                             <Text className="text-[9px] font-black text-slate-500 uppercase tracking-wider">RESOLVED</Text>
                          </View>
                        )}
                        {item.status === 'graded' && (
                          <View className="bg-emerald-50 self-start px-3 py-1.5 rounded-lg">
                             <Text className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">GRADED</Text>
                          </View>
                        )}
                      </View>
                   </View>
                </View>
              ))
            ) : (
              <View className="bg-white rounded-[32px] p-8 border border-dashed border-slate-200 items-center">
                 <MessageSquare size={24} color="#CBD5E1" />
                 <Text className="text-slate-400 text-xs font-bold mt-3">No recent activity detected</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
