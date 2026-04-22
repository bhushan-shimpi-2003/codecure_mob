import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { interviewsApi, coursesApi, teacherApi, notificationsApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { 
  CalendarClock, 
  Video, 
  Clock, 
  Plus, 
  ChevronRight, 
  CheckCircle2,
  Calendar,
  User,
  ArrowRight,
  Filter,
  X,
  Briefcase,
  Sparkles,
  ArrowLeft
} from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";
import { LinearGradient } from "expo-linear-gradient";

export default function TeacherInterviewsScreen({ navigation }: any) {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [courseStudents, setCourseStudents] = useState<any[]>([]);
  const [isFetchingStudents, setIsFetchingStudents] = useState(false);
  const [showCourseList, setShowCourseList] = useState(false);
  const [showStudentList, setShowStudentList] = useState(false);
  const [selectedDate, setSelectedDate] = useState(6);
  const [selectedSlot, setSelectedSlot] = useState("");
  const timeSlots = ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"];
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const fetchInitialData = async () => {
    try {
      const interviewRes = await interviewsApi.teacherInterviews();
      if (isApiSuccess(interviewRes.data)) setInterviews(extractApiData<any[]>(interviewRes.data, []));
      const courseRes = await coursesApi.teacherCourses();
      if (isApiSuccess(courseRes.data)) setCourses(extractApiData<any[]>(courseRes.data, []));
    } catch (e) {
      console.log("Error fetching initial data", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchInitialData(); }, []);

  const handleCourseSelect = async (course: any) => {
    setSelectedCourseId(course.id);
    setShowCourseList(false);
    setStudentId(""); 
    setCourseStudents([]);
    setIsFetchingStudents(true);
    try {
      const res = await teacherApi.courseStudents(course.id);
      if (isApiSuccess(res.data)) setCourseStudents(extractApiData<any[]>(res.data, []));
    } catch (e) {
      console.log("Error fetching students", e);
    } finally {
      setIsFetchingStudents(false);
    }
  };

  const handleStudentSelect = (student: any) => { setStudentId(student.id); setShowStudentList(false); };
  const handleOpenLink = async (url: string) => { if (!url) return; try { await Linking.openURL(url); } catch (e) { Alert.alert("Error", "Could not open meeting link"); } };

  const handleSchedule = async () => {
    if (!studentId || !scheduledAt) { Alert.alert("Error", "Please select a student and slot"); return; }
    setIsScheduling(true);
    try {
      const res = await interviewsApi.schedule({
        title: `Technical Interview - ${courses.find(c => c.id === selectedCourseId)?.title || "Course"}`,
        student_id: studentId,
        scheduled_at: scheduledAt,
        interview_type: "Technical Round"
      });
      if (isApiSuccess(res.data)) {
        Alert.alert("Success", "Interview scheduled successfully");
        
        // Notify Student
        notificationsApi.send({
          user_id: studentId,
          title: 'Interview Scheduled!',
          message: `Your technical interview for ${courses.find(c => c.id === selectedCourseId)?.title || 'Course'} has been scheduled for ${new Date(scheduledAt).toLocaleString()}.`,
          type: 'info'
        });

        setStudentId(""); setScheduledAt(""); setSelectedCourseId(""); setCourseStudents([]); setSelectedSlot("");
        setShowScheduleModal(false);
        fetchInitialData();
      }
    } catch (e: any) { 
      console.log("Interview Schedule Error:", e.response?.data || e.message);
      Alert.alert("Error", "Scheduling failed. " + (e.response?.data?.message || "")); 
    }
    finally { setIsScheduling(false); }
  };

  const handleCompleteInterview = async (interviewId: string, studentId: string) => {
    Alert.alert(
      "Complete Session",
      "Assign a readiness score and final notes for this candidate.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Completion",
          onPress: async () => {
            try {
              setIsLoading(true);
              const res = await interviewsApi.complete(interviewId, {
                score: 85, // Default/Placeholder score
                notes: "Session successfully conducted. Candidate shows strong potential."
              });
              
              if (isApiSuccess(res.data)) {
                Alert.alert("Success", "Interview marked as completed.");
                
                // Notify Student
                notificationsApi.send({
                  user_id: studentId,
                  title: 'Interview Completed!',
                  message: 'Your recent technical interview has been evaluated. Check your feedback loop.',
                  type: 'success'
                });

                fetchInitialData();
              }
            } catch (e) {
              Alert.alert("Error", "Could not update session status");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    const dateStr = `2026-04-${selectedDate.toString().padStart(2, '0')}`;
    setScheduledAt(`${dateStr} ${slot}`);
  };

  const upcomingInterviews = useMemo(() => {
    return interviews.filter((i: any) => i.status !== 'completed').sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [interviews]);

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const selectedStudent = courseStudents.find(s => s.id === studentId);

  if (isLoading && !refreshing) {
    return (
      <SafeAreaWrapper bgWhite>
        <AppHeader navigation={navigation} role="Teacher" />
        <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-6">Initializing Hub...</Text>
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
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInitialData(); }} tintColor="#2563EB" />
        }
      >
        <View className="px-6 pt-10">
           {/* Header Section */}
           <View className="mb-10">
              <View className="flex-row items-center gap-2 mb-3">
                 <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-blue-700 text-[10px] font-black uppercase tracking-widest">Career Acceleration</Text>
                 </View>
                 <Sparkles size={14} color="#3B82F6" />
              </View>
              <Text className="text-[40px] font-black text-slate-900 leading-[44px] tracking-tight">
                 Interview <Text className="text-blue-600">Hub</Text>
              </Text>
              <Text className="text-slate-400 text-base font-bold mt-2">Scale student careers with scheduled sessions.</Text>
           </View>

           {/* High-Level Stats */}
           <View className="flex-row justify-between mb-10">
              <View className="w-[48%] bg-white p-6 rounded-[36px] shadow-2xl shadow-slate-900/[0.03] border border-slate-50">
                 <View className="bg-blue-50 w-12 h-12 rounded-2xl items-center justify-center mb-4">
                    <Calendar size={20} color="#2563EB" />
                 </View>
                 <Text className="text-3xl font-black text-slate-900 mb-0.5">{upcomingInterviews.length}</Text>
                 <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scheduled</Text>
              </View>
              <View className="w-[48%] bg-slate-900 p-6 rounded-[36px] shadow-2xl shadow-slate-900/10">
                 <View className="bg-white/10 w-12 h-12 rounded-2xl items-center justify-center mb-4">
                    <CheckCircle2 size={20} color="#3B82F6" />
                 </View>
                 <Text className="text-3xl font-black text-white mb-0.5">{interviews.length - upcomingInterviews.length}</Text>
                 <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</Text>
              </View>
           </View>

           {/* Actions Row */}
           <View className="flex-row justify-between mb-12">
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => setShowScheduleModal(true)} 
                className="w-[48%] bg-white rounded-[36px] p-6 shadow-2xl shadow-slate-900/[0.03] border border-slate-50"
              >
                 <LinearGradient
                   colors={['#10B981', '#059669']}
                   className="w-12 h-12 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-emerald-100"
                 >
                    <Plus size={20} color="white" />
                 </LinearGradient>
                 <Text className="text-sm font-black text-slate-900">Book Session</Text>
                 <Text className="text-[9px] font-black text-slate-400 mt-0.5 uppercase tracking-tighter">Schedule Now</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => navigation.navigate("TeacherCareerTab", { screen: 'TeacherJobsHome' })} 
                className="w-[48%] bg-white rounded-[36px] p-6 shadow-2xl shadow-slate-900/[0.03] border border-slate-50"
              >
                 <LinearGradient
                   colors={['#3B82F6', '#2563EB']}
                   className="w-12 h-12 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-blue-100"
                 >
                    <Briefcase size={20} color="white" />
                 </LinearGradient>
                 <Text className="text-sm font-black text-slate-900">Post Vacancy</Text>
                 <Text className="text-[9px] font-black text-slate-400 mt-0.5 uppercase tracking-tighter">Hiring Portal</Text>
              </TouchableOpacity>
           </View>

           {/* Upcoming Sessions List */}
           <View className="mb-10">
              <View className="flex-row items-center justify-between mb-8">
                 <Text className="text-2xl font-black text-slate-900">Upcoming Sessions</Text>
                 <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-[10px] font-black text-blue-700">{upcomingInterviews.length} TOTAL</Text>
                 </View>
              </View>

              {upcomingInterviews.map((item: any) => {
                const studentProfile = item.profiles || {};
                const interviewTitle = item.title ? (item.title.includes("-") ? item.title.split("-")[1].trim() : item.title) : "Technical Round";
                return (
                  <View key={item.id} className="bg-white rounded-[44px] p-8 border border-white shadow-2xl shadow-slate-900/[0.04] mb-8 overflow-hidden">
                    <View className="flex-row items-center justify-between mb-8">
                      <View className="flex-row items-center">
                         <View className="relative">
                           <Image 
                             source={{ uri: studentProfile.avatar_url || `https://ui-avatars.com/api/?name=${studentProfile.name || "S"}&background=random` }} 
                             className="w-16 h-16 rounded-[24px] bg-slate-50 border-2 border-slate-50" 
                           />
                           <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full" />
                         </View>
                         <View className="ml-4">
                            <Text className="text-lg font-black text-slate-900 tracking-tight">{studentProfile.name || "Student"}</Text>
                            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{interviewTitle}</Text>
                         </View>
                      </View>
                      <View className="bg-blue-50 px-3 py-1.5 rounded-full">
                         <Text className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Confirmed</Text>
                      </View>
                    </View>

                    <View className="bg-slate-50 rounded-[28px] p-5 mb-8 flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                         <View className="w-10 h-10 rounded-2xl bg-white items-center justify-center shadow-sm mr-4">
                            <CalendarClock size={18} color="#2563EB" />
                         </View>
                         <View>
                            <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Scheduled Time</Text>
                            <Text className="text-xs font-black text-slate-800">
                               {new Date(item.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(item.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </Text>
                         </View>
                      </View>
                      <ArrowRight size={16} color="#CBD5E1" />
                    </View>

                    <View className="flex-row gap-4">
                      <TouchableOpacity 
                        activeOpacity={0.8}
                        onPress={() => handleOpenLink(item.meeting_link)} 
                        className="flex-1 bg-blue-600 rounded-[28px] py-5 flex-row items-center justify-center shadow-xl shadow-blue-200"
                      >
                         <Video size={20} color="white" />
                         <Text className="text-white font-black text-xs ml-3 uppercase tracking-widest">Join Session</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        activeOpacity={0.8}
                        onPress={() => handleCompleteInterview(item.id, item.student_id)} 
                        className="w-20 bg-emerald-50 rounded-[28px] items-center justify-center border border-emerald-100"
                      >
                         <CheckCircle2 size={20} color="#10B981" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {upcomingInterviews.length === 0 && (
                <View className="items-center justify-center py-20 bg-slate-50 rounded-[44px] border border-dashed border-slate-200">
                   <CalendarClock size={40} color="#CBD5E1" />
                   <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-4">No sessions reserved</Text>
                </View>
              )}
           </View>
        </View>
      </ScrollView>

      {/* Scheduling Modal */}
      <Modal visible={showScheduleModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/60 justify-end">
           <View className="bg-[#F8FAFC] rounded-t-[56px] h-[92%] p-8">
              <View className="flex-row items-center justify-between mb-10">
                 <View>
                    <Text className="text-3xl font-black text-slate-900">New Session</Text>
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Interview Portal</Text>
                 </View>
                 <TouchableOpacity 
                   onPress={() => setShowScheduleModal(false)} 
                   className="bg-white w-14 h-14 rounded-3xl items-center justify-center shadow-2xl shadow-slate-900/[0.05] border border-slate-50"
                 >
                    <X size={24} color="#64748B" />
                 </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <View className="gap-10 pb-20">
                  <View>
                    <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Step 1: Select Track</Text>
                    <TouchableOpacity 
                      onPress={() => setShowCourseList(!showCourseList)} 
                      className="bg-white border border-slate-50 rounded-3xl px-6 py-5 flex-row items-center justify-between shadow-sm"
                    >
                       <Text className={`text-sm font-black ${selectedCourse ? "text-slate-900" : "text-slate-400"}`}>
                          {selectedCourse ? selectedCourse.title : "Choose a course track..."}
                       </Text>
                       <ChevronRight size={18} color="#94A3B8" />
                    </TouchableOpacity>
                    {showCourseList && (
                       <View className="mt-3 bg-white border border-slate-50 rounded-3xl overflow-hidden shadow-2xl z-10">
                          {courses.map((c: any) => (
                             <TouchableOpacity 
                               key={c.id} 
                               onPress={() => handleCourseSelect(c)} 
                               className={`p-5 border-b border-slate-50 ${selectedCourseId === c.id ? "bg-blue-50" : ""}`}
                             >
                                <Text className={`text-sm font-black ${selectedCourseId === c.id ? "text-blue-600" : "text-slate-700"}`}>{c.title}</Text>
                             </TouchableOpacity>
                          ))}
                       </View>
                    )}
                  </View>

                  {selectedCourseId && (
                    <View>
                      <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Step 2: Select Student</Text>
                      <TouchableOpacity 
                        onPress={() => setShowStudentList(!showStudentList)} 
                        disabled={isFetchingStudents} 
                        className="bg-white border border-slate-50 rounded-3xl px-6 py-5 flex-row items-center justify-between shadow-sm"
                      >
                         {isFetchingStudents ? (
                           <ActivityIndicator size="small" color="#2563EB" />
                         ) : (
                           <Text className={`text-sm font-black ${selectedStudent ? "text-slate-900" : "text-slate-400"}`}>
                              {selectedStudent ? selectedStudent.name : "Choose an enrolled student..."}
                           </Text>
                         )}
                         <ChevronRight size={18} color="#94A3B8" />
                      </TouchableOpacity>
                      {showStudentList && (
                         <View className="mt-3 bg-white border border-slate-50 rounded-3xl overflow-hidden shadow-2xl z-10">
                            {courseStudents.map((s: any) => (
                               <TouchableOpacity 
                                 key={s.id} 
                                 onPress={() => handleStudentSelect(s)} 
                                 className={`p-5 border-b border-slate-50 flex-row items-center ${studentId === s.id ? "bg-emerald-50" : ""}`}
                               >
                                  <View className="w-10 h-10 rounded-2xl bg-slate-50 items-center justify-center mr-4">
                                     <User size={18} color="#94A3B8" />
                                  </View>
                                  <View>
                                    <Text className={`text-sm font-black ${studentId === s.id ? "text-emerald-600" : "text-slate-700"}`}>{s.name}</Text>
                                    <Text className="text-[10px] text-slate-400 font-bold">{s.email}</Text>
                                  </View>
                               </TouchableOpacity>
                            ))}
                         </View>
                      )}
                    </View>
                  )}

                  <View>
                    <View className="flex-row items-center justify-between mb-8">
                      <Text className="text-2xl font-black text-slate-900">Step 3: Date & Time</Text>
                      <View className="flex-row">
                        <TouchableOpacity className="w-10 h-10 items-center justify-center"><ArrowLeft size={18} color="#0F172A" /></TouchableOpacity>
                        <TouchableOpacity className="w-10 h-10 items-center justify-center ml-2"><ArrowRight size={18} color="#0F172A" /></TouchableOpacity>
                      </View>
                    </View>
                    
                    <View className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-50">
                       <View className="flex-row justify-between mb-8">
                         {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map(d => (
                            <Text key={d} className="w-10 text-center text-[11px] font-black text-slate-300 uppercase tracking-widest">{d}</Text>
                         ))}
                       </View>
                       <View className="flex-row flex-wrap justify-between gap-y-5">
                         {[28, 29, 30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((day, i) => {
                           const isOtherMonth = i < 4;
                           const isSelected = day === selectedDate && !isOtherMonth;
                           return (
                             <TouchableOpacity 
                               key={i} 
                               onPress={() => !isOtherMonth && setSelectedDate(day)} 
                               className={`w-10 h-10 items-center justify-center rounded-[18px] ${isSelected ? "bg-blue-600 shadow-xl shadow-blue-200" : ""}`}
                             >
                               <Text className={`text-sm font-black ${isOtherMonth ? "text-slate-100" : isSelected ? "text-white" : "text-slate-600"}`}>{day}</Text>
                             </TouchableOpacity>
                           );
                         })}
                       </View>
                    </View>

                    <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-12 mb-6 ml-2">Available Slots</Text>
                    <View className="flex-row flex-wrap justify-between gap-y-4">
                      {timeSlots.map(slot => (
                        <TouchableOpacity 
                          key={slot} 
                          onPress={() => handleSlotSelect(slot)} 
                          className={`w-[48%] py-5 rounded-[28px] border-2 items-center justify-center ${selectedSlot === slot ? "bg-blue-50 border-blue-200" : "bg-white border-slate-50"}`}
                        >
                          <Text className={`text-sm font-black ${selectedSlot === slot ? "text-blue-700" : "text-slate-500"}`}>{slot}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity 
                    onPress={handleSchedule} 
                    disabled={isScheduling || !studentId || !selectedSlot} 
                    activeOpacity={0.8}
                    className="overflow-hidden rounded-[32px]"
                  >
                    <LinearGradient
                      colors={studentId && selectedSlot ? ['#1E293B', '#0F172A'] : ['#E2E8F0', '#CBD5E1']}
                      className="py-6 items-center justify-center flex-row gap-4"
                    >
                      {isScheduling ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Text className="text-white font-black text-sm uppercase tracking-widest">Reserve Professional Slot</Text>
                          <ArrowRight size={18} color="white" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
           </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
