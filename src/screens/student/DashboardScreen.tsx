import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
  TextInput, 
  Image,
  useWindowDimensions,
  ActivityIndicator,
  Linking,
  Alert
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { 
  enrollmentsApi, 
  interviewsApi, 
  doubtsApi,
  assignmentsApi,
  coursesApi, 
  lessonsApi,
  jobsApi
} from "../../api/endpoints";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { 
  Search, 
  Play, 
  Calendar, 
  MessageSquare, 
  FileText,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Star,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  CheckCircle2,
  Bell
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import { extractApiData, isApiSuccess } from "../../api/response";
import { calculateProgress, getProgressString } from "../../utils/progress";
import { AppHeader } from "../../components/AppHeader";

const ProgressRing = ({ progress = 0, size = 60, strokeWidth = 5 }: { progress?: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View className="items-center justify-center">
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FFFFFF"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View className="absolute">
        <Text className="text-white font-black text-[10px]">{Math.round(progress)}%</Text>
      </View>
    </View>
  );
};

export default function DashboardScreen({ navigation }: any) {
  const { user, isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const CARD_WIDTH = width * 0.85;
  
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [lastAttended, setLastAttended] = useState<any>(null);
  const [upcomingEvent, setUpcomingEvent] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<any[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    if (!isAuthenticated) return;

    try {
      const results = await Promise.allSettled([
        enrollmentsApi.myEnrollments(),
        interviewsApi.myInterviews(),
        doubtsApi.myDoubts(),
        assignmentsApi.myAssignments(),
        coursesApi.list(),
        jobsApi.list()
      ]);

      const [enrRes, intRes, dbtRes, asgRes, crsRes, jobRes] = results;

        // 1. Enrollments & Last Attended
        if (enrRes.status === "fulfilled" && isApiSuccess(enrRes.value.data)) {
          const data = extractApiData<any[]>(enrRes.value.data, []);
          
          const enrichedEnr = await Promise.all(data.map(async (enr) => {
            const courseId = enr.courses?.id || enr.course?.id || enr.course_id;
            let lessonCount = 0;
            if (courseId) {
              try {
                const lessonsRes = await lessonsApi.byCourse(courseId);
                if (isApiSuccess(lessonsRes.data)) {
                  const lessonsData = extractApiData<any[]>(lessonsRes.data, []);
                  lessonCount = lessonsData.length;
                }
              } catch (e) {}
            }
            
            const tempEnr = { ...enr, lesson_count: lessonCount };
            return {
              ...tempEnr,
              percent: calculateProgress(tempEnr),
              displayStr: getProgressString(tempEnr)
            };
          }));

          const sorted = [...enrichedEnr].sort((a, b) => {
            const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
            const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
            return dateB - dateA;
          });

          setEnrollments(sorted);
          setLastAttended(sorted[0] || null);
        }

      // 2. Upcoming Events
      if (intRes.status === "fulfilled" && isApiSuccess(intRes.value.data)) {
        const interviews = extractApiData<any[]>(intRes.value.data, []);
        const futureEvs = interviews.filter(i => String(i.status).toLowerCase() !== "completed");
        setUpcomingEvent(futureEvs[0] || null);
      }

      // 3. Recommended Courses
      if (crsRes.status === "fulfilled" && isApiSuccess(crsRes.value.data)) {
        const allCourses = extractApiData<any[]>(crsRes.value.data, []);
        const enrolledIds = new Set(enrollments.map(e => e.course_id));
        const available = allCourses.filter(c => !enrolledIds.has(c.id || c._id));
        const shuffled = [...available].sort(() => 0.5 - Math.random());
        setRecommendedCourses(shuffled.slice(0, 3));
      }

      // 4. Combined Activities
      let combined: any[] = [];
      if (dbtRes.status === "fulfilled" && isApiSuccess(dbtRes.value.data)) {
        const doubts = extractApiData<any[]>(dbtRes.value.data, []).slice(0, 2);
        doubts.forEach(d => combined.push({
          title: d.reply ? "Mentor Responded" : "New Doubt Ticket",
          description: d.title || d.description || "Question about lesson",
          time_ago: "RECENT",
          type: "doubt",
          date: d.created_at,
        }));
      }

      if (asgRes.status === "fulfilled" && isApiSuccess(asgRes.value.data)) {
        const assignmentsData = extractApiData<any[]>(asgRes.value.data, []);
        const pending = assignmentsData.filter(a => !Array.isArray(a.submissions) || a.submissions.length === 0);
        setPendingAssignments(pending.slice(0, 3));

        const assignments = assignmentsData.slice(0, 2);
        assignments.forEach(a => combined.push({
          title: "Assignment Published",
          description: a.title,
          time_ago: "NEW",
          type: "submission",
          date: a.created_at,
        }));
      }

      // 5. Jobs
      if (jobRes.status === "fulfilled" && isApiSuccess(jobRes.value.data)) {
        const jobsData = extractApiData<any[]>(jobRes.value.data, []);
        setJobs(jobsData.slice(0, 3));
      }

      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivities(combined.slice(0, 4));

    } catch (e) {
      console.log("Dashboard sync error", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handlePlayLesson = (enr: any) => {
    const courseId = enr.courses?.id || enr.course?.id || enr.course_id;
    if (!courseId) return;
    navigation.navigate("Lesson", { 
      courseId, 
      progress: enr.percent || 0,
      courseTitle: enr.courses?.title || enr.course?.title
    });
  };

  const firstName = (user?.name || user?.email?.split("@")[0] || "Scholar").split(" ")[0];

  const getActivityIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'submission': return <FileText size={16} color="#2563EB" />;
      case 'doubt': return <MessageSquare size={16} color="#E11D48" />;
      default: return <Bell size={16} color="#64748B" />;
    }
  };

  const getActivityColorClass = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'submission': return 'bg-blue-100';
      case 'doubt': return 'bg-rose-100';
      default: return 'bg-slate-100';
    }
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaWrapper bgWhite>
        <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="mt-6 text-slate-400 font-black text-[10px] uppercase tracking-widest">Synchronizing Academy...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} role={user?.role} />

      <ScrollView 
        className="flex-1 bg-[#F8FAFC]"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-6 pt-10">
          
          {/* Welcome Header */}
          <View className="mb-10">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="bg-blue-100 px-3 py-1 rounded-full">
                <Text className="text-blue-700 text-[10px] font-black uppercase tracking-widest">Scholar Dashboard</Text>
              </View>
              <Sparkles size={14} color="#3B82F6" />
            </View>
            <Text className="text-[40px] font-black text-slate-900 leading-[44px] tracking-tight">
                Good Morning,
            </Text>
            <Text className="text-[40px] font-black text-blue-600 leading-[44px] tracking-tight">
                {firstName} <Text className="text-slate-900">👋</Text>
            </Text>
            <Text className="text-slate-400 text-base font-bold mt-3">Level up your technical mastery today.</Text>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-white px-6 py-5 rounded-[28px] mb-10 border border-slate-100 shadow-2xl shadow-slate-900/[0.03]">
            <Search size={20} color="#94A3B8" className="mr-4" />
            <TextInput 
              placeholder="Explore courses, mentors, or topics..."
              className="flex-1 text-slate-900 font-black text-[14px]"
              placeholderTextColor="#CBD5E1"
            />
          </View>

          {/* Last Attended / Hero */}
          {lastAttended ? (
            <TouchableOpacity 
              activeOpacity={0.9} 
              className="mb-12"
              onPress={() => handlePlayLesson(lastAttended)}
            >
              <LinearGradient
                colors={["#1E293B", "#0F172A"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                className="p-10 rounded-[48px] h-72 relative overflow-hidden shadow-2xl shadow-slate-900/20"
              >
                <View className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-blue-600/10" />
                <View className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5" />
                
                <View className="bg-blue-600 self-start px-4 py-1.5 rounded-full mb-6 border border-blue-500/30">
                  <Text className="text-white text-[9px] font-black uppercase tracking-widest">Resume Track</Text>
                </View>
                
                <Text className="text-white text-3xl font-black leading-tight w-3/4 mb-4" numberOfLines={2}>
                  {lastAttended.courses?.title || lastAttended.course?.title || "Mastery Track"}
                </Text>
                
                <View className="flex-row items-center justify-between mt-auto">
                    <View className="bg-white px-8 py-4 rounded-[20px] shadow-xl shadow-blue-900/20">
                        <Text className="text-slate-900 font-black text-xs uppercase tracking-widest">Play Lesson</Text>
                    </View>
                    <ProgressRing progress={lastAttended.percent || 0} size={64} strokeWidth={5} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={() => navigation.navigate("Courses")} 
              activeOpacity={0.9}
              className="mb-12 bg-blue-600 p-10 rounded-[48px] items-center shadow-2xl shadow-blue-200"
            >
                <BookOpen size={48} color="white" />
                <Text className="text-white font-black text-xl mt-6 uppercase tracking-widest">Explore Academy</Text>
            </TouchableOpacity>
          )}

          {/* Enrolled Courses */}
          <View className="mb-12">
            <View className="flex-row items-center justify-between mb-8 px-1">
               <View>
                  <Text className="text-2xl font-black text-slate-900">Your Tracks</Text>
                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Active Enrollments</Text>
               </View>
               <TouchableOpacity className="bg-blue-50 px-4 py-2 rounded-full" onPress={() => navigation.navigate("Assignments")}>
                  <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest">See All</Text>
               </TouchableOpacity>
            </View>

            {enrollments.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                {enrollments.map((enr, i) => (
                  <TouchableOpacity 
                    key={i}
                    activeOpacity={0.9}
                    onPress={() => handlePlayLesson(enr)}
                    className="bg-white rounded-[44px] p-8 mr-6 border border-white shadow-2xl shadow-slate-900/[0.04]"
                    style={{ width: CARD_WIDTH }}
                  >
                    <View className="flex-row items-center justify-between mb-8">
                        <View className="w-14 h-14 rounded-2xl bg-slate-50 items-center justify-center border border-slate-50 shadow-sm">
                           <BookOpen size={24} color="#2563EB" />
                        </View>
                        <View className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                           <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{Math.round(enr.percent)}%</Text>
                        </View>
                    </View>
                    
                    <Text className="text-2xl font-black text-slate-900 mb-2 h-16 leading-tight tracking-tight" numberOfLines={2}>
                       {enr.courses?.title || enr.course?.title || "Academy Track"}
                    </Text>
                    <Text className="text-[10px] text-slate-400 font-black uppercase mb-6 tracking-widest">{enr.displayStr}</Text>

                    <View className="w-full bg-slate-50 h-2 rounded-full overflow-hidden mb-8">
                      <View className="bg-blue-600 h-full rounded-full" style={{ width: `${enr.percent}%` }} />
                    </View>

                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                           <View className="bg-slate-900 w-10 h-10 rounded-2xl items-center justify-center mr-3 shadow-lg shadow-slate-200">
                              <Play size={14} color="white" fill="white" />
                           </View>
                           <Text className="text-slate-900 font-black text-[11px] uppercase tracking-widest">Continue</Text>
                        </View>
                        <ArrowRight size={18} color="#CBD5E1" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
                <View className="items-center py-16 bg-slate-50 rounded-[44px] border border-dashed border-slate-200">
                   <Layers size={40} color="#CBD5E1" />
                   <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-4">No active tracks</Text>
                </View>
            )}
          </View>

          {/* Upcoming Event */}
          {upcomingEvent && (
            <View className="mb-12">
              <View className="flex-row items-center justify-between mb-8 px-1">
                <Text className="text-2xl font-black text-slate-900">Upcoming Session</Text>
                <TouchableOpacity onPress={() => navigation.navigate("MockInterviews")}>
                   <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Calendar</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate("MockInterviews")}>
                <LinearGradient 
                   colors={["#2563EB", "#1D4ED8"]} 
                   start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                   className="p-10 rounded-[48px] relative overflow-hidden shadow-2xl shadow-blue-200"
                >
                  <View className="absolute -right-10 -bottom-10 opacity-10">
                    <Calendar size={180} color="white" />
                  </View>
                  <View className="flex-row items-center mb-6">
                    <View className="bg-white/20 px-3 py-1.5 rounded-xl mr-4 border border-white/30">
                        <Text className="text-white text-[9px] font-black uppercase tracking-widest">
                            {new Date(upcomingEvent.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                  </View>
                  <Text className="text-white text-3xl font-black mb-10 leading-tight w-2/3 tracking-tight">{upcomingEvent.title}</Text>
                  <View className="bg-white rounded-[24px] py-5 items-center shadow-xl">
                    <Text className="text-slate-900 font-black text-xs uppercase tracking-widest">Join Studio</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Pending Assignments */}
          {pendingAssignments.length > 0 && (
            <View className="mb-12">
               <View className="flex-row items-center justify-between mb-8 px-1">
                  <Text className="text-2xl font-black text-slate-900">Challenges</Text>
                  <TouchableOpacity onPress={() => navigation.navigate("Assignments")}>
                    <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest">View Lab</Text>
                  </TouchableOpacity>
               </View>
               <View className="gap-4">
                  {pendingAssignments.map((asg, i) => (
                    <TouchableOpacity 
                      key={i} 
                      onPress={() => navigation.navigate("Assignments")}
                      className="bg-white p-8 rounded-[40px] flex-row items-center border border-white shadow-2xl shadow-slate-900/[0.04]"
                    >
                       <View className="w-14 h-14 bg-indigo-50 rounded-2xl items-center justify-center mr-6">
                          <ClipboardList size={24} color="#4F46E5" />
                       </View>
                       <View className="flex-1">
                          <Text className="font-black text-slate-900 text-lg tracking-tight" numberOfLines={1}>{asg.title}</Text>
                          <Text className="text-slate-400 text-[10px] font-black uppercase mt-1 tracking-widest">Due: {asg.due_date ? new Date(asg.due_date).toLocaleDateString() : 'Next Week'}</Text>
                       </View>
                       <View className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center border border-slate-100 shadow-sm">
                          <ChevronRight size={18} color="#CBD5E1" />
                       </View>
                    </TouchableOpacity>
                  ))}
               </View>
            </View>
          )}

          {/* Jobs */}
          {jobs.length > 0 && (
            <View className="mb-12">
                <View className="flex-row items-center justify-between mb-8 px-1">
                   <View>
                      <Text className="text-2xl font-black text-slate-900">Career Radar</Text>
                      <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Partner Openings</Text>
                   </View>
                   <TouchableOpacity onPress={() => navigation.navigate("Jobs")}>
                      <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest">See All</Text>
                   </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                   {jobs.map((job, i) => (
                     <View 
                         key={i}
                         className="bg-white rounded-[48px] p-10 mr-6 border border-white shadow-2xl shadow-slate-900/[0.04]"
                         style={{ width: CARD_WIDTH }}
                     >
                         <View className="flex-row justify-between items-start mb-8">
                             <View className="w-16 h-16 bg-amber-50 rounded-[24px] items-center justify-center border border-amber-100 shadow-sm">
                                 <Star size={28} color="#F59E0B" fill="#F59E0B" />
                             </View>
                             <View className="bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                                 <Text className="text-emerald-600 text-[9px] font-black uppercase tracking-widest">Hiring</Text>
                             </View>
                         </View>
                         <Text className="text-2xl font-black text-slate-900 mb-2 h-16 leading-tight tracking-tight" numberOfLines={2}>{job.title}</Text>
                         <Text className="text-slate-400 font-black text-[10px] mb-8 uppercase tracking-[2px]">{job.company || 'Tech Solutions'} • {job.location || 'Remote'}</Text>
                         
                         <View className="gap-3">
                            <TouchableOpacity 
                                activeOpacity={0.8}
                                onPress={() => Linking.openURL(job.apply_url || job.application_link).catch(() => Alert.alert("Error", "Could not open link"))}
                                className="bg-slate-900 py-6 rounded-[24px] items-center shadow-xl shadow-slate-200"
                            >
                                <Text className="text-white font-black text-[11px] uppercase tracking-widest">Quick Apply</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => navigation.navigate("Jobs")}
                                className="bg-slate-50 py-5 rounded-[24px] items-center border border-slate-100"
                            >
                                <Text className="text-slate-500 font-black text-[10px] uppercase tracking-widest">View Opportunity</Text>
                            </TouchableOpacity>
                         </View>
                     </View>
                   ))}
                </ScrollView>
            </View>
          )}

          {/* Activity Feed */}
          <View className="mb-12">
            <View className="flex-row items-center justify-between mb-10 px-1">
               <View>
                  <Text className="text-2xl font-black text-slate-900">Pulse Feed</Text>
                  <Text className="text-slate-400 text-[11px] font-bold mt-0.5">Real-time academy updates</Text>
               </View>
               <Bell size={20} color="#CBD5E1" />
            </View>
            
            {activities.length > 0 ? (
              activities.map((item, idx) => (
                <View key={idx} className="flex-row mb-8">
                   <View className="items-center mr-5">
                      <View className={`w-12 h-12 rounded-2xl ${getActivityColorClass(item.type)} items-center justify-center z-10 border-4 border-white shadow-sm`}>
                         {getActivityIcon(item.type)}
                      </View>
                      {idx < activities.length - 1 && <View className="w-[2px] flex-1 bg-slate-100 my-2" />}
                   </View>
                   <View className="flex-1 pt-1">
                      <View className="flex-row justify-between items-start mb-2">
                         <Text className="text-sm font-black text-slate-900 flex-1 mr-2 leading-tight" numberOfLines={2}>
                            {item.title}
                         </Text>
                         <Text className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">
                            {item.time_ago}
                         </Text>
                      </View>
                      <Text className="text-xs text-slate-500 font-medium leading-4 mb-4">{item.description}</Text>
                   </View>
                </View>
              ))
            ) : (
              <View className="bg-slate-50 rounded-[44px] p-12 items-center justify-center border border-slate-100 border-dashed">
                 <Bell size={32} color="#E2E8F0" />
                 <Text className="text-slate-400 text-[10px] font-black mt-4 uppercase tracking-widest text-center">Nothing new to report</Text>
              </View>
            )}
          </View>

          {/* Recommended */}
          {recommendedCourses.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-8 px-1">
                 <Text className="text-2xl font-black text-slate-900">Next Mastery</Text>
                 <TouchableOpacity onPress={() => navigation.navigate("ExploreCourses")}>
                    <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Explore</Text>
                 </TouchableOpacity>
              </View>
              {recommendedCourses.map((course, idx) => (
                <TouchableOpacity 
                   key={idx}
                   activeOpacity={0.8}
                   onPress={() => navigation.navigate("CourseDetail", { idOrSlug: course.slug || course.id || course._id })}
                   className="bg-white p-6 rounded-[36px] mb-4 flex-row items-center border border-white shadow-2xl shadow-slate-900/[0.04]"
                >
                   <View className="w-20 h-20 bg-slate-50 rounded-[24px] overflow-hidden mr-5 border border-slate-50">
                      {course.thumbnail ? (
                        <Image source={{ uri: course.thumbnail }} className="w-full h-full" />
                      ) : (
                        <View className="flex-1 items-center justify-center">
                          <BookOpen size={28} color="#2563EB" />
                        </View>
                      )}
                   </View>
                   <View className="flex-1">
                      <Text className="font-black text-slate-900 text-[15px] leading-tight mb-2" numberOfLines={2}>{course.title}</Text>
                      <View className="flex-row items-center">
                         <Star size={12} color="#f59e0b" fill="#f59e0b" />
                         <Text className="text-slate-400 text-[10px] font-black ml-1 uppercase tracking-widest">4.9 • {course.category || "General"}</Text>
                      </View>
                   </View>
                   <View className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center border border-slate-100 shadow-sm">
                      <ChevronRight size={20} color="#CBD5E1" />
                   </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
