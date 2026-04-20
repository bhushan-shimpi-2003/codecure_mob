import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
  TextInput, 
  Image,
  Dimensions,
  ActivityIndicator
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
  ChevronRight
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import { COLORS } from "../../utils/theme";
import { extractApiData, isApiSuccess } from "../../api/response";
import { calculateProgress, getProgressString } from "../../utils/progress";
import { AppHeader } from "../../components/AppHeader";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;

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
          stroke="#E2E8F0"
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
        <Text className="text-white font-bold text-[10px]">{progress}%</Text>
      </View>
    </View>
  );
};

interface ActivityItemProps {
  title: string;
  subtitle: string;
  time: string;
  icon: any;
  iconColor: string;
  iconBg: string;
}

const ActivityItem = ({ title, subtitle, time, icon: Icon, iconColor, iconBg }: ActivityItemProps) => (
  <View className="bg-white rounded-[32px] p-5 mb-3 flex-row items-center border border-slate-50 shadow-sm">
    <View className={`${iconBg} w-12 h-12 rounded-2xl items-center justify-center mr-4`}>
       <Icon size={20} color={iconColor} />
    </View>
    <View className="flex-1">
      <Text className="text-[15px] font-bold text-slate-800 leading-tight">{title}</Text>
      <Text className="text-slate-400 text-xs mt-1 font-medium">{subtitle}</Text>
    </View>
    <Text className="text-[10px] font-extrabold text-slate-300 uppercase tracking-tighter">{time}</Text>
  </View>
);

export default function DashboardScreen({ navigation }: any) {
  const { user, isAuthenticated } = useAuth();
  
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
          
          // Fetch lesson counts for each enrollment to fix 0 total issue
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
              } catch (e) {
                console.log(`Failed to fetch lessons for ${courseId}`, e);
              }
            }
            
            const tempEnr = {
                ...enr,
                // Add the count directly to a known fallback field
                lesson_count: lessonCount
            };

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
          title: d.is_resolved ? "Doubt Resolved" : "New Doubt Ticket",
          subtitle: d.subject || d.description || "Question about lesson",
          time: "RECENT",
          date: d.created_at,
          icon: MessageSquare,
          iconColor: d.is_resolved ? "#22c55e" : "#0EA5E9",
          iconBg: "bg-blue-50"
        }));
      }

      if (asgRes.status === "fulfilled" && isApiSuccess(asgRes.value.data)) {
        const assignmentsData = extractApiData<any[]>(asgRes.value.data, []);
        const pending = assignmentsData.filter(a => !Array.isArray(a.submissions) || a.submissions.length === 0);
        setPendingAssignments(pending.slice(0, 3));

        const assignments = assignmentsData.slice(0, 2);
        assignments.forEach(a => combined.push({
          title: "New Assignment",
          subtitle: a.title,
          time: "NEW",
          date: a.created_at,
          icon: ClipboardList,
          iconColor: "#6366f1",
          iconBg: "bg-indigo-50"
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

  const firstName = user?.name?.split(" ")[0] || "Scholar";

  if (isLoading && !refreshing) {
    return (
      <SafeAreaWrapper bgWhite>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Refreshing Sync...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader role={user?.role} />

      <ScrollView 
        className="flex-1 bg-slate-50/30"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6 pb-12">
          
          <View className="mb-6">
            <Text className="text-3xl font-black text-slate-900 tracking-tight">Good Morning,</Text>
            <Text className="text-3xl font-black text-slate-900 tracking-tight">{firstName} 👋</Text>
            <Text className="text-slate-500 font-medium text-base mt-1">Ready to tackle some code today?</Text>
          </View>

          <View className="flex-row items-center bg-slate-100/80 px-4 py-3 rounded-2xl mb-8 border border-slate-200/50">
            <Search size={20} color="#94A3B8" className="mr-3" />
            <TextInput 
              placeholder="Search for courses, mentors, or topics"
              className="flex-1 text-slate-800 font-medium text-sm"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {lastAttended ? (
            <TouchableOpacity 
              activeOpacity={0.9} 
              className="mb-10"
              onPress={() => handlePlayLesson(lastAttended)}
            >
              <LinearGradient
                colors={["#0052D4", "#6FB1FC"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                className="p-8 rounded-[40px] h-60 relative overflow-hidden shadow-2xl shadow-blue-400/30"
              >
                <View className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10" />
                <View className="bg-white/20 self-start px-3 py-1 rounded-full mb-4 border border-white/30">
                  <Text className="text-white text-[10px] font-black uppercase tracking-widest">Resume Learning</Text>
                </View>
                <Text className="text-white text-2xl font-black leading-tight w-2/3 mb-6" numberOfLines={2}>
                  {lastAttended.courses?.title || lastAttended.course?.title || "Enrolled Course"}
                </Text>
                <View className="flex-row items-center justify-between mt-auto">
                    <View className="bg-white px-6 py-3 rounded-full shadow-xl shadow-blue-900/20">
                        <Text className="text-blue-700 font-black text-sm">Play Next Lesson</Text>
                    </View>
                    <ProgressRing progress={lastAttended.percent || 0} size={50} strokeWidth={4} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation.navigate("Courses")} className="mb-10 bg-blue-600 p-8 rounded-[40px] items-center">
                <BookOpen size={40} color="white" />
                <Text className="text-white font-bold mt-4">Browse Our Courses</Text>
            </TouchableOpacity>
          )}

          <View className="mb-10">
            <Text className="text-lg font-black text-slate-900 mb-4 px-1">Enrolled Courses</Text>
            {enrollments.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 4, paddingRight: 20 }}>
                {enrollments.map((enr, i) => (
                  <TouchableOpacity 
                    key={i}
                    activeOpacity={0.9}
                    onPress={() => handlePlayLesson(enr)}
                    className="bg-white rounded-[40px] p-6 mr-4 border border-slate-100 shadow-xl shadow-slate-200/40"
                    style={{ width: CARD_WIDTH }}
                  >
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="bg-blue-50 p-3 rounded-2xl"><BookOpen size={20} color="#2563EB" /></View>
                        <Text className="text-blue-600 font-black text-sm">{enr.percent}%</Text>
                    </View>
                    
                    <Text className="text-lg font-black text-slate-900 mb-1 h-14" numberOfLines={2}>{enr.courses?.title || enr.course?.title || "Course Track"}</Text>
                    <Text className="text-[10px] text-slate-400 font-bold uppercase mb-3">{enr.displayStr}</Text>

                    <View className="w-full bg-slate-100 h-[6px] rounded-full overflow-hidden mb-6">
                      <View className="bg-blue-600 h-full" style={{ width: `${enr.percent}%` }} />
                    </View>
                    <View className="flex-row items-center">
                        <View className="bg-slate-50 w-10 h-10 rounded-full items-center justify-center mr-3">
                           <Play size={16} color="#2563EB" fill="#2563EB" />
                        </View>
                        <Text className="text-slate-400 font-bold text-xs uppercase tracking-wider">Play Next</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
                <View className="px-1"><Text className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No active enrollments</Text></View>
            )}
          </View>

          {upcomingEvent && (
            <View className="mb-10">
              <View className="flex-row items-center justify-between mb-4 px-1">
                <Text className="text-lg font-black text-slate-900">Upcoming Mock Interview</Text>
                <TouchableOpacity onPress={() => navigation.navigate("MockInterviews")}>
                   <Text className="text-blue-600 font-bold text-xs uppercase">View All</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate("MockInterviews")}>
                <LinearGradient 
                   colors={["#004AC6", "#2563EB"]} 
                   start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                   className="p-8 rounded-[40px] relative overflow-hidden shadow-xl shadow-blue-500/20"
                >
                  <View className="absolute -right-10 -bottom-10 opacity-10">
                    <Calendar size={180} color="white" />
                  </View>
                  <View className="flex-row items-center mb-4">
                    <View className="bg-white/20 p-2 rounded-xl mr-3">
                        <Calendar size={16} color="white" />
                    </View>
                    <Text className="text-white text-[10px] font-black uppercase tracking-[2px]">
                        {new Date(upcomingEvent.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text className="text-white text-xl font-black mb-10 leading-tight w-2/3">{upcomingEvent.title}</Text>
                  <View className="bg-white rounded-2xl py-4 items-center shadow-lg">
                    <Text className="text-blue-700 font-black text-sm uppercase tracking-widest">Join Meeting</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {pendingAssignments.length > 0 && (
            <View className="mb-10">
               <View className="flex-row items-center justify-between mb-4 px-1">
                  <Text className="text-lg font-black text-slate-900">Pending Assignments</Text>
                  <TouchableOpacity onPress={() => navigation.navigate("Assignments")}>
                    <Text className="text-blue-600 font-bold text-xs uppercase">All Tasks</Text>
                  </TouchableOpacity>
               </View>
               {pendingAssignments.map((asg, i) => (
                  <TouchableOpacity 
                    key={i} 
                    onPress={() => navigation.navigate("Assignments")}
                    className="bg-white p-6 rounded-[32px] mb-4 flex-row items-center border border-slate-50 shadow-sm"
                  >
                     <View className="w-12 h-12 bg-indigo-50 rounded-2xl items-center justify-center mr-4">
                        <ClipboardList size={22} color="#4F46E5" />
                     </View>
                     <View className="flex-1">
                        <Text className="font-black text-slate-800 text-[15px]" numberOfLines={1}>{asg.title}</Text>
                        <Text className="text-slate-400 text-xs font-bold mt-1 uppercase">Due: {asg.due_date ? new Date(asg.due_date).toLocaleDateString() : 'Next Week'}</Text>
                     </View>
                     <ChevronRight size={18} color="#CBD5E1" />
                  </TouchableOpacity>
               ))}
            </View>
          )}

          {jobs.length > 0 && (
            <View className="mb-10">
               <Text className="text-lg font-black text-slate-900 mb-4 px-1">Career Opportunities</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 4, paddingRight: 20 }}>
                  {jobs.map((job, i) => (
                    <TouchableOpacity 
                        key={i}
                        className="bg-white rounded-[40px] p-8 mr-4 border border-slate-100 shadow-xl shadow-slate-200/40"
                        style={{ width: CARD_WIDTH }}
                    >
                        <View className="flex-row justify-between items-start mb-6">
                            <View className="w-14 h-14 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100">
                                <Star size={24} color="#F59E0B" fill="#F59E0B" />
                            </View>
                            <View className="bg-emerald-50 px-3 py-1 rounded-full">
                                <Text className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">New</Text>
                            </View>
                        </View>
                        <Text className="text-xl font-black text-slate-900 mb-2 h-14" numberOfLines={2}>{job.title}</Text>
                        <Text className="text-slate-400 font-bold text-xs mb-8 uppercase tracking-wider">{job.company || 'Tech Solutions'} • {job.location || 'Remote'}</Text>
                        <TouchableOpacity className="bg-slate-900 py-4 rounded-2xl items-center">
                            <Text className="text-white font-black text-xs uppercase tracking-widest">Apply Now</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
               </ScrollView>
            </View>
          )}

          <View className="mb-10">
            <Text className="text-lg font-black text-slate-900 mb-4 px-1">Recent Activity</Text>
            {activities.length > 0 ? activities.map((act, i) => (
              <ActivityItem key={i} {...act} />
            )) : (
              <View className="bg-white p-8 rounded-[32px] items-center justify-center border border-slate-50">
                <Text className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Quiet for now</Text>
              </View>
            )}
          </View>

          {recommendedCourses.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-black text-slate-900 mb-4 px-1">Recommended for You</Text>
              {recommendedCourses.map((course, idx) => (
                <TouchableOpacity 
                   key={idx}
                   activeOpacity={0.8}
                   onPress={() => navigation.navigate("CourseDetail", { idOrSlug: course.slug })}
                   className="bg-white p-4 rounded-[32px] mb-4 flex-row items-center border border-slate-50 shadow-sm"
                >
                   <View className="w-16 h-16 bg-blue-50 rounded-2xl overflow-hidden mr-4">
                      {course.thumbnail ? (
                        <Image source={{ uri: course.thumbnail }} className="w-full h-full" />
                      ) : (
                        <View className="flex-1 items-center justify-center">
                          <BookOpen size={24} color="#2563EB" />
                        </View>
                      )}
                   </View>
                   <View className="flex-1">
                      <Text className="font-bold text-slate-800 text-[15px]" numberOfLines={1}>{course.title}</Text>
                      <View className="flex-row items-center mt-1">
                         <Star size={12} color="#f59e0b" fill="#f59e0b" />
                         <Text className="text-slate-400 text-[11px] font-bold ml-1 uppercase">4.8 • {course.category || "Design"}</Text>
                      </View>
                   </View>
                   <ChevronRight size={20} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
