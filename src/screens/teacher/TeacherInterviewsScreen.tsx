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
import { interviewsApi, coursesApi, teacherApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { useNavigation } from "@react-navigation/native";
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
} from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";

export default function TeacherInterviewsScreen() {
  const navigation = useNavigation<any>();
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
        setStudentId(""); setScheduledAt(""); setSelectedCourseId(""); setCourseStudents([]); setSelectedSlot("");
        setShowScheduleModal(false);
        fetchInitialData();
      }
    } catch (e) { Alert.alert("Error", "Scheduling failed"); }
    finally { setIsScheduling(false); }
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

  if (isLoading) {
    return (
      <SafeAreaWrapper>
        <AppHeader role="Teacher" />
        <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-slate-400 font-bold mt-4">Initializing Hub...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <AppHeader role="Teacher" />
      <ScrollView className="flex-1 bg-[#F8FAFC]" contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInitialData(); }} />}>
        <View className="px-6 pt-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">CAREER ACCELERATION</Text>
            <TouchableOpacity className="bg-slate-100 p-2 rounded-full"><Filter size={14} color="#64748B" /></TouchableOpacity>
          </View>
          <Text className="text-4xl font-black text-slate-900 mb-6">Interview Hub</Text>
          <View className="flex-row justify-between mb-10">
            <View className="w-[48%] bg-white p-5 rounded-[32px] shadow-sm border border-slate-50">
              <View className="bg-blue-50 w-10 h-10 rounded-2xl items-center justify-center mb-3"><Calendar size={18} color="#2563EB" /></View>
              <Text className="text-2xl font-black text-slate-900">{upcomingInterviews.length}</Text>
              <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SCHEDULED</Text>
            </View>
            <View className="w-[48%] bg-[#1D4ED8] p-5 rounded-[32px] shadow-xl shadow-blue-100">
              <View className="bg-white/20 w-10 h-10 rounded-2xl items-center justify-center mb-3"><CheckCircle2 size={18} color="white" /></View>
              <Text className="text-2xl font-black text-white">{interviews.length - upcomingInterviews.length}</Text>
              <Text className="text-[9px] font-black text-blue-100 uppercase tracking-widest">COMPLETED</Text>
            </View>
          </View>

          <View className="flex-row justify-between mb-12">
            <TouchableOpacity onPress={() => setShowScheduleModal(true)} className="w-[48%] bg-white rounded-[32px] p-6 shadow-sm border border-slate-50">
               <View className="w-12 h-12 bg-emerald-600 rounded-2xl items-center justify-center mb-3 shadow-lg shadow-emerald-100"><Plus size={20} color="white" /></View>
               <Text className="text-sm font-black text-slate-900">Book Session</Text>
               <Text className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">SCHEDULE INTERVIEW</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("TeacherJobsHome")} className="w-[48%] bg-white rounded-[32px] p-6 shadow-sm border border-slate-50">
               <View className="w-12 h-12 bg-blue-600 rounded-2xl items-center justify-center mb-3 shadow-lg shadow-blue-100"><Briefcase size={20} color="white" /></View>
               <Text className="text-sm font-black text-slate-900">Post Vacancy</Text>
               <Text className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">CREATE JOB POST</Text>
            </TouchableOpacity>
          </View>

          <Modal visible={showScheduleModal} animationType="slide" transparent={true}>
            <View className="flex-1 bg-black/60 justify-end">
               <View className="bg-[#F8FAFC] rounded-t-[48px] h-[90%] p-8">
                  <View className="flex-row items-center justify-between mb-8">
                     <View>
                        <Text className="text-3xl font-black text-slate-900">New Session</Text>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">INTERVIEW PORTAL</Text>
                     </View>
                     <TouchableOpacity onPress={() => setShowScheduleModal(false)} className="bg-white w-12 h-12 rounded-2xl items-center justify-center shadow-sm border border-slate-100"><X size={20} color="#64748B" /></TouchableOpacity>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                    <View className="gap-8 pb-10">
                      <View>
                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">SELECT COURSE</Text>
                        <TouchableOpacity onPress={() => setShowCourseList(!showCourseList)} className="bg-white border border-slate-100 rounded-2xl px-5 py-4 flex-row items-center justify-between shadow-sm">
                           <Text className={`text-sm ${selectedCourse ? "text-slate-900 font-bold" : "text-slate-400"}`}>{selectedCourse ? selectedCourse.title : "Choose a course..."}</Text>
                           <ChevronRight size={16} color="#94A3B8" />
                        </TouchableOpacity>
                        {showCourseList && (
                           <View className="mt-2 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-lg z-10">
                              {courses.map((c: any) => (
                                 <TouchableOpacity key={c.id} onPress={() => handleCourseSelect(c)} className={`p-4 border-b border-slate-50 ${selectedCourseId === c.id ? "bg-blue-50" : ""}`}>
                                    <Text className={`text-sm ${selectedCourseId === c.id ? "text-blue-600 font-black" : "text-slate-600 font-bold"}`}>{c.title}</Text>
                                 </TouchableOpacity>
                              ))}
                           </View>
                        )}
                      </View>
                      {selectedCourseId ? (
                        <View>
                          <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">SELECT STUDENT</Text>
                          <TouchableOpacity onPress={() => setShowStudentList(!showStudentList)} disabled={isFetchingStudents} className="bg-white border border-slate-100 rounded-2xl px-5 py-4 flex-row items-center justify-between shadow-sm">
                             {isFetchingStudents ? <ActivityIndicator size="small" color="#2563EB" /> : <Text className={`text-sm ${selectedStudent ? "text-slate-900 font-bold" : "text-slate-400"}`}>{selectedStudent ? selectedStudent.name : "Choose a student..."}</Text>}
                             <ChevronRight size={16} color="#94A3B8" />
                          </TouchableOpacity>
                          {showStudentList && (
                             <View className="mt-2 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-lg z-10">
                                {courseStudents.map((s: any) => (
                                   <TouchableOpacity key={s.id} onPress={() => handleStudentSelect(s)} className={`p-4 border-b border-slate-50 flex-row items-center ${studentId === s.id ? "bg-emerald-50" : ""}`}>
                                      <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center mr-3"><User size={14} color="#94A3B8" /></View>
                                      <View>
                                        <Text className={`text-sm ${studentId === s.id ? "text-emerald-600 font-black" : "text-slate-600 font-bold"}`}>{s.name}</Text>
                                        <Text className="text-[9px] text-slate-400">{s.email}</Text>
                                      </View>
                                   </TouchableOpacity>
                                ))}
                             </View>
                          )}
                        </View>
                      ) : null}
                      <View>
                        <View className="flex-row items-center justify-between mb-8">
                          <Text className="text-xl font-black text-slate-900">Select Date & Time</Text>
                          <View className="flex-row">
                            <TouchableOpacity className="p-2"><ChevronRight size={20} color="#0F172A" style={{ transform: [{ rotate: "180deg" }] }} /></TouchableOpacity>
                            <TouchableOpacity className="p-2 ml-2"><ChevronRight size={20} color="#0F172A" /></TouchableOpacity>
                          </View>
                        </View>
                        <View className="flex-row justify-between mb-6">
                          {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map(d => <Text key={d} className="w-9 text-center text-[11px] font-black text-slate-400">{d}</Text>)}
                        </View>
                        <View className="flex-row flex-wrap justify-between gap-y-4">
                          {[28, 29, 30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((day, i) => {
                            const isOtherMonth = i < 4;
                            const isSelected = day === selectedDate && !isOtherMonth;
                            return (
                              <TouchableOpacity key={i} onPress={() => !isOtherMonth && setSelectedDate(day)} className={`w-9 h-9 items-center justify-center rounded-full ${isSelected ? "bg-blue-600 shadow-md shadow-blue-200" : ""}`}>
                                <Text className={`text-[13px] font-bold ${isOtherMonth ? "text-slate-200" : isSelected ? "text-white" : "text-slate-600"}`}>{day}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-10 mb-6">AVAILABLE TIME SLOTS</Text>
                        <View className="flex-row flex-wrap justify-between gap-y-4">
                          {timeSlots.map(slot => (
                            <TouchableOpacity key={slot} onPress={() => handleSlotSelect(slot)} className={`w-[48%] py-5 rounded-[24px] border items-center justify-center ${selectedSlot === slot ? "bg-blue-100 border-blue-200" : "bg-white border-slate-100"}`}>
                              <Text className={`text-[13px] font-black ${selectedSlot === slot ? "text-blue-900" : "text-slate-600"}`}>{slot}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      <TouchableOpacity onPress={handleSchedule} disabled={isScheduling || !studentId || !selectedSlot} className={`rounded-[32px] py-6 items-center justify-center shadow-lg flex-row ${studentId && selectedSlot ? "bg-slate-900 shadow-slate-200" : "bg-slate-200"}`}>
                        {isScheduling ? <ActivityIndicator size="small" color="white" /> : (
                          <>
                            <Text className="text-white font-black text-sm mr-2 uppercase tracking-widest">RESERVE SLOT</Text>
                            <ArrowRight size={16} color="white" />
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
               </View>
            </View>
          </Modal>

          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-black text-slate-900">Upcoming Sessions</Text>
            <View className="bg-blue-100 px-3 py-1 rounded-full"><Text className="text-[10px] font-black text-blue-600">{upcomingInterviews.length} TOTAL</Text></View>
          </View>
          <View>
            {upcomingInterviews.map((item: any) => {
              const studentProfile = item.profiles || {};
              const interviewTitle = item.title ? (item.title.includes("-") ? item.title.split("-")[1].trim() : item.title) : "Technical Round";
              return (
                <View key={item.id} className="bg-white rounded-[40px] p-7 border border-slate-50 shadow-sm mb-6 overflow-hidden">
                  <View className="flex-row items-center justify-between mb-8">
                    <View className="flex-row items-center">
                       <View className="relative">
                         <Image source={{ uri: studentProfile.avatar_url || `https://ui-avatars.com/api/?name=${studentProfile.name || "S"}` }} className="w-14 h-14 rounded-[20px] bg-slate-50" />
                         <View className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full" />
                       </View>
                       <View className="ml-4">
                          <Text className="text-base font-black text-slate-900">{studentProfile.name || "Student"}</Text>
                          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{interviewTitle}</Text>
                       </View>
                    </View>
                    <View className="bg-blue-50 px-3 py-1.5 rounded-xl"><Text className="text-[9px] font-black text-blue-600 uppercase">LIVE NOW</Text></View>
                  </View>
                  <View className="bg-slate-50/50 rounded-3xl p-5 mb-6 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                       <View className="w-9 h-9 rounded-2xl bg-white items-center justify-center shadow-sm mr-4"><Calendar size={16} color="#475569" /></View>
                       <View>
                          <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SCHEDULED TIME</Text>
                          <Text className="text-xs font-black text-slate-700">{new Date(item.scheduled_at).toLocaleDateString()} - {new Date(item.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
                       </View>
                    </View>
                    <Clock size={16} color="#CBD5E1" />
                  </View>
                  <View className="flex-row items-center">
                     <TouchableOpacity onPress={() => handleOpenLink(item.meeting_link)} className="flex-1 bg-blue-600 rounded-[24px] py-5 flex-row items-center justify-center mr-3 shadow-lg shadow-blue-200">
                        <Video size={18} color="white" /><Text className="text-white font-black text-xs ml-2 uppercase tracking-widest">Join Session</Text>
                     </TouchableOpacity>
                     <View className="w-16 h-16 bg-slate-50 rounded-[24px] items-center justify-center border border-slate-100"><ChevronRight size={24} color="#94A3B8" /></View>
                  </View>
                </View>
              );
            })}
            {upcomingInterviews.length === 0 ? (
               <View className="items-center justify-center py-20 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-100">
                  <CalendarClock size={40} color="#E2E8F0" />
                  <Text className="text-slate-400 font-bold mt-4">No sessions reserved</Text>
               </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
