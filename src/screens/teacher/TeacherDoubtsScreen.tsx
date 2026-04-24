import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  useWindowDimensions,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { doubtsApi, coursesApi } from "../../api/endpoints";
import { notifyStudentDoubtResolved } from "../../utils/notificationHelper";
import { extractApiData, isApiSuccess } from "../../api/response";
import { 
  MessageSquare, 
  CheckCircle2, 
  Video, 
  Paperclip, 
  Play, 
  Clock,
  ChevronRight,
  Sparkles,
  Layers,
  Send,
  Search,
  Filter,
  X,
  Check,
  BookOpen,
  ExternalLink
} from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, UPLOADS_URL } from "../../utils/theme";

export default function TeacherDoubtsScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const [doubts, setDoubts] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [activeReplyText, setActiveReplyText] = useState("");
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved'>('pending');
  
  // New Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);

  const fetchData = async () => {
    try {
      const [doubtsRes, coursesRes] = await Promise.all([
        doubtsApi.teacherDoubts(),
        coursesApi.teacherCourses()
      ]);

      if (isApiSuccess(doubtsRes.data)) {
        setDoubts(extractApiData<any[]>(doubtsRes.data, []));
      }
      if (isApiSuccess(coursesRes.data)) {
        setCourses(extractApiData<any[]>(coursesRes.data, []));
      }
    } catch (e) {
      console.log("Error fetching data", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleResolve = async (id: string) => {
    if (!activeReplyText.trim()) {
      Alert.alert("Error", "Please enter a response.");
      return;
    }

    try {
      const res = await doubtsApi.resolve(id, activeReplyText.trim());
      if (isApiSuccess(res.data)) {
        Alert.alert("Success", "Query resolved successfully.");

        // Identify student from the doubt and notify them silently
        const doubt = doubts.find((d: any) => (d.id || d._id) === id);
        const student = doubt?.profiles || doubt?.student;
        const sid = typeof student === 'object'
          ? (student?.id || student?._id)
          : (student || doubt?.student_id || doubt?.user_id);
        if (sid) notifyStudentDoubtResolved(sid, activeReplyText.trim());

        setActiveReplyText("");
        setReplyingToId(null);
        fetchData();
      }
    } catch (e) {
      Alert.alert("Error", "Failed to resolve query.");
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredDoubts = useMemo(() => {
    return doubts.filter(d => {
      // Tab filter
      const isResolved = !!d.reply;
      const matchesTab = activeTab === 'pending' ? !isResolved : isResolved;
      if (!matchesTab) return false;

      // Course filter
      if (selectedCourseId && d.course_id !== selectedCourseId) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const title = (d.subject || d.title || "").toLowerCase();
        const desc = (d.description || d.query || "").toLowerCase();
        const studentName = (d.profiles?.name || d.student?.name || "").toLowerCase();
        if (!title.includes(query) && !desc.includes(query) && !studentName.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [doubts, activeTab, selectedCourseId, searchQuery]);

  const stats = {
    pending: doubts.filter(d => !d.reply).length,
    resolved: doubts.filter(d => !!d.reply).length
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaWrapper bgWhite>
        <AppHeader navigation={navigation} role="Teacher" />
        <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-6">Syncing Queries...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} role="Teacher" title="Academy" subtitle="Doubts" />
      
      <ScrollView 
        className="flex-1 bg-[#F8FAFC]" 
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#2563EB" />
        }
      >
        <View className="px-6 pt-10">
           {/* Header Section */}
           <View className="mb-8">
              <View className="flex-row items-center gap-2 mb-3">
                 <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-blue-700 text-[10px] font-black uppercase tracking-widest">Support Portal</Text>
                 </View>
                 <Sparkles size={14} color="#3B82F6" />
              </View>
              <Text className="text-[40px] font-black text-slate-900 leading-[44px] tracking-tight">
                 Student <Text className="text-blue-600">Doubts</Text>
              </Text>
              <Text className="text-slate-400 text-sm font-bold mt-2">Clarify concepts and guide student logic.</Text>
           </View>

           {/* Search & Course Filter */}
           <View className="flex-row gap-3 mb-8">
              <View className="flex-1 bg-white h-14 rounded-2xl border border-slate-100 shadow-sm flex-row items-center px-4">
                 <Search size={18} color="#94A3B8" />
                 <TextInput 
                   placeholder="Search doubts or students..."
                   className="flex-1 ml-3 font-bold text-slate-900 text-sm"
                   placeholderTextColor="#CBD5E1"
                   value={searchQuery}
                   onChangeText={setSearchQuery}
                 />
                 {searchQuery.length > 0 && (
                   <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <X size={16} color="#94A3B8" />
                   </TouchableOpacity>
                 )}
              </View>
              <TouchableOpacity 
                onPress={() => setShowCourseModal(true)}
                className={`w-14 h-14 rounded-2xl items-center justify-center shadow-sm border ${selectedCourseId ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-100'}`}
              >
                 <Filter size={20} color={selectedCourseId ? 'white' : '#64748B'} />
              </TouchableOpacity>
           </View>

           {/* Stats Grid */}
           <View className="flex-row justify-between mb-8">
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => setActiveTab('pending')}
                className={`w-[48%] p-5 rounded-[32px] border-2 ${activeTab === 'pending' ? 'bg-white border-blue-50 shadow-xl shadow-slate-900/[0.03]' : 'bg-slate-50/50 border-transparent'}`}
              >
                 <View className={`w-10 h-10 rounded-xl items-center justify-center mb-3 ${activeTab === 'pending' ? 'bg-blue-600 shadow-lg shadow-blue-200' : 'bg-slate-200'}`}>
                    <Clock size={18} color="white" />
                 </View>
                 <Text className={`text-2xl font-black ${activeTab === 'pending' ? 'text-slate-900' : 'text-slate-400'}`}>{stats.pending}</Text>
                 <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => setActiveTab('resolved')}
                className={`w-[48%] p-5 rounded-[32px] border-2 ${activeTab === 'resolved' ? 'bg-white border-emerald-50 shadow-xl shadow-slate-900/[0.03]' : 'bg-slate-50/50 border-transparent'}`}
              >
                 <View className={`w-10 h-10 rounded-xl items-center justify-center mb-3 ${activeTab === 'resolved' ? 'bg-emerald-600 shadow-lg shadow-emerald-200' : 'bg-slate-200'}`}>
                    <CheckCircle2 size={18} color="white" />
                 </View>
                 <Text className={`text-2xl font-black ${activeTab === 'resolved' ? 'text-slate-900' : 'text-slate-400'}`}>{stats.resolved}</Text>
                 <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resolved</Text>
              </TouchableOpacity>
           </View>

           {/* Doubts Feed */}
           <View className="gap-6">
              {filteredDoubts.length > 0 ? (
                filteredDoubts.map((doubt) => {
                  const student = doubt.profiles || doubt.student || {};
                  const doubtId = doubt.id || doubt._id;
                  const isResolved = !!doubt.reply;

                  return (
                    <View key={doubtId} className="bg-white rounded-[40px] p-7 border border-white shadow-2xl shadow-slate-900/[0.04]">
                      <View className="flex-row items-center justify-between mb-6">
                        <View className="flex-row items-center">
                           <View className="relative">
                             <Image 
                               source={{ uri: student.avatar_url || `https://ui-avatars.com/api/?name=${student.name || 'S'}&background=random` }} 
                               className="w-14 h-14 rounded-[20px] bg-slate-50 border-2 border-slate-50"
                             />
                             <View className={`absolute -bottom-1 -right-1 w-5 h-5 border-[3px] border-white rounded-full ${isResolved ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                           </View>
                           <View className="ml-4">
                             <Text className="text-base font-black text-slate-900 tracking-tight">{student.name || "Student"}</Text>
                             <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5" numberOfLines={1}>
                               {doubt.courses?.title || "Python Programming"}
                             </Text>
                           </View>
                        </View>
                        <View className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                           <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                             {new Date(doubt.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                           </Text>
                        </View>
                      </View>

                      <View className="mb-4">
                        <Text className="text-lg font-black text-slate-900 mb-2 leading-6">{doubt.subject || doubt.title || "Course Query"}</Text>
                        <View className="bg-slate-50/50 rounded-[24px] p-5 border border-slate-100/50">
                          <Text className="text-sm text-slate-600 leading-6 font-bold italic">
                            "{doubt.description || doubt.query || "No description provided."}"
                          </Text>


                        </View>
                      </View>

                      {activeTab === 'pending' ? (
                        <View className="gap-5">
                          <View className="bg-white border border-slate-100 rounded-[28px] p-5 shadow-inner">
                            <TextInput 
                              placeholder="Type your professional response..."
                              multiline
                              className="text-slate-900 text-sm h-28 text-start align-top font-bold"
                              placeholderTextColor="#CBD5E1"
                              value={doubtId === replyingToId ? activeReplyText : ""}
                              onChangeText={(txt) => {
                                setReplyingToId(doubtId);
                                setActiveReplyText(txt);
                              }}
                            />
                            <View className="flex-row justify-end gap-3 pt-4 border-t border-slate-50">
                               <TouchableOpacity className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100 shadow-sm">
                                  <Video size={16} color="#64748B" />
                               </TouchableOpacity>
                               <TouchableOpacity className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100 shadow-sm">
                                  <Paperclip size={16} color="#64748B" />
                               </TouchableOpacity>
                            </View>
                          </View>

                          <TouchableOpacity 
                            onPress={() => handleResolve(doubtId)}
                            disabled={!activeReplyText.trim()}
                            activeOpacity={0.8}
                            className="overflow-hidden rounded-[24px]"
                          >
                             <LinearGradient
                               colors={activeReplyText.trim() ? ['#1E293B', '#0F172A'] : ['#F1F5F9', '#E2E8F0']}
                               className="py-4 flex-row items-center justify-center gap-3"
                             >
                                <Text className={`font-black text-xs uppercase tracking-widest ${activeReplyText.trim() ? 'text-white' : 'text-slate-400'}`}>Dispatch Resolution</Text>
                                <Send size={14} color={activeReplyText.trim() ? "white" : "#94A3B8"} />
                             </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <>
                          <View className="bg-emerald-50 rounded-[28px] p-5 flex-row items-center justify-between border border-emerald-100">
                            <View className="flex-row items-center flex-1 pr-4">
                              <View className="w-10 h-10 rounded-xl bg-white items-center justify-center mr-4 shadow-sm">
                                <CheckCircle2 size={18} color="#10B981" />
                              </View>
                              <View className="flex-1">
                                <Text className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-0.5">Resolution Sent</Text>
                                <Text className="text-xs text-emerald-600 font-bold" numberOfLines={1}>{doubt.reply || "No response text."}</Text>
                              </View>
                            </View>
                            <ChevronRight size={16} color="#10B981" />
                          </View>
                          
                          {doubt.teacher && (
                            <View className="mt-4 flex-row items-center justify-end">
                              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Resolved By:</Text>
                              <View className="bg-slate-100 px-3 py-1 rounded-full">
                                <Text className="text-[9px] font-black text-slate-600">{doubt.teacher.name || "Instructor"}</Text>
                              </View>
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  );
                })
              ) : (
                <View className="items-center justify-center py-24 bg-white rounded-[48px] border border-dashed border-slate-200">
                  <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-6">
                    <MessageSquare size={32} color="#CBD5E1" />
                  </View>
                  <Text className="text-slate-400 font-black text-lg tracking-tight">Inbox Synchronized</Text>
                  <Text className="text-slate-300 text-[10px] mt-2 font-black uppercase tracking-[2px]">No {activeTab} queries found</Text>
                </View>
              )}

              {/* Advanced Tools Banner */}
              <TouchableOpacity 
                activeOpacity={0.9}
                className="mt-4 rounded-[40px] overflow-hidden shadow-2xl shadow-blue-900/10"
              >
                 <LinearGradient
                   colors={['#1E293B', '#334155']}
                   start={{ x: 0, y: 0 }}
                   end={{ x: 1, y: 1 }}
                   className="p-8 relative"
                 >
                    <View className="relative z-10">
                       <View className="flex-row items-center gap-2 mb-3">
                          <View className="bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">
                             <Text className="text-blue-400 text-[9px] font-black uppercase tracking-widest">Advanced Tooling</Text>
                          </View>
                          <Layers size={12} color="#3B82F6" />
                       </View>
                       <Text className="text-white text-2xl font-black mb-1 tracking-tight">Video Resolution</Text>
                       <Text className="text-slate-400 text-xs leading-5 font-bold">Record a quick screen capture or voice note to explain complex concepts.</Text>
                       
                       <View className="flex-row items-center mt-8">
                          <TouchableOpacity className="bg-blue-600 px-6 py-3.5 rounded-2xl flex-row items-center gap-2.5 shadow-lg shadow-blue-600/20">
                             <Play size={12} color="white" fill="white" />
                             <Text className="text-white font-black text-[10px] uppercase tracking-widest">Launch Studio</Text>
                          </TouchableOpacity>
                       </View>
                    </View>
                    <View className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600/10 rounded-full" />
                    <View className="absolute -bottom-16 -left-16 w-48 h-48 bg-blue-500/5 rounded-full" />
                 </LinearGradient>
              </TouchableOpacity>
           </View>
        </View>
      </ScrollView>

      {/* Course Filter Modal */}
      <Modal visible={showCourseModal} transparent animationType="fade">
        <TouchableOpacity 
          className="flex-1 bg-slate-900/60 justify-end" 
          activeOpacity={1} 
          onPress={() => setShowCourseModal(false)}
        >
          <View className="bg-white rounded-t-[44px] p-8 pb-12 max-h-[70%]">
             <View className="flex-row justify-between items-center mb-8">
                <View>
                   <Text className="text-2xl font-black text-slate-900">Filter by Course</Text>
                   <Text className="text-slate-400 text-xs font-bold mt-1">Select a course to see specific doubts</Text>
                </View>
                <TouchableOpacity onPress={() => setShowCourseModal(false)} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center">
                   <X size={20} color={COLORS.slate900} />
                </TouchableOpacity>
             </View>

             <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity 
                  onPress={() => { setSelectedCourseId(null); setShowCourseModal(false); }}
                  className={`p-6 rounded-[28px] mb-4 flex-row items-center justify-between ${selectedCourseId === null ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50'}`}
                >
                   <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-xl bg-white items-center justify-center mr-4">
                         <BookOpen size={18} color={selectedCourseId === null ? COLORS.primary : COLORS.slate400} />
                      </View>
                      <Text className={`font-black ${selectedCourseId === null ? 'text-blue-600' : 'text-slate-900'}`}>All Courses</Text>
                   </View>
                   {selectedCourseId === null && <Check size={20} color={COLORS.primary} />}
                </TouchableOpacity>

                {courses.map((course) => (
                  <TouchableOpacity 
                    key={course.id || course._id}
                    onPress={() => { setSelectedCourseId(course.id || course._id); setShowCourseModal(false); }}
                    className={`p-6 rounded-[28px] mb-4 flex-row items-center justify-between ${selectedCourseId === (course.id || course._id) ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50'}`}
                  >
                     <View className="flex-row items-center flex-1 pr-4">
                        <View className="w-10 h-10 rounded-xl bg-white items-center justify-center mr-4">
                           <BookOpen size={18} color={selectedCourseId === (course.id || course._id) ? COLORS.primary : COLORS.slate400} />
                        </View>
                        <Text className={`font-black flex-1 ${selectedCourseId === (course.id || course._id) ? 'text-blue-600' : 'text-slate-900'}`} numberOfLines={1}>
                          {course.title}
                        </Text>
                     </View>
                     {selectedCourseId === (course.id || course._id) && <Check size={20} color={COLORS.primary} />}
                  </TouchableOpacity>
                ))}
             </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaWrapper>
  );
}
