import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { assignmentsApi, coursesApi } from "../../api/endpoints";
import { notifyStudentNewAssignment } from "../../utils/notificationHelper";
import { extractApiData, isApiSuccess } from "../../api/response";
import {
  Plus,
  Clock,
  Trash2,
  Calendar,
  CloudUpload,
  Edit2,
  ChevronDown,
  Layout,
  Code,
  Database,
  PenTool,
  Users,
  Sparkles,
  ArrowRight,
  Layers,
  X,
  BookOpen,
  ArrowLeft
} from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";
import { LinearGradient } from "expo-linear-gradient";

export default function TeacherAssignmentsScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [coursePickerVisible, setCoursePickerVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const fetchAll = async () => {
    try {
      const coursesRes = await coursesApi.teacherCourses();
      if (isApiSuccess(coursesRes.data)) {
        const courseList = extractApiData<any[]>(coursesRes.data, []);
        setCourses(courseList);
        if (courseList.length > 0 && !selectedCourseId) {
          setSelectedCourseId(String(courseList[0]?.id || courseList[0]?._id));
        }

        const allAssignments: any[] = [];
        await Promise.all(
          courseList.map(async (c) => {
            const aRes = await assignmentsApi.byCourse(String(c.id || c._id));
            if (isApiSuccess(aRes.data)) {
              const data = extractApiData<any[]>(aRes.data, []);
              data.forEach(a => allAssignments.push({ ...a, courseTitle: c.title }));
            }
          })
        );
        setAssignments(allAssignments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch (e) {
      console.log("Error fetching assignments", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !selectedCourseId) {
      Alert.alert("Error", "Please provide a title and select a course.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await assignmentsApi.create({
        course_id: selectedCourseId,
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate.trim(),
      });
      if (isApiSuccess(res.data)) {
        Alert.alert("Success", "Assignment created successfully");
        notifyStudentNewAssignment(title.trim(), dueDate);

        setTitle("");
        setDescription("");
        setDueDate("");
        fetchAll();
      }
    } catch (e: any) { 
      console.log("Assignment Create Error:", e.response?.data || e.message);
      Alert.alert("Error", "Failed to create assignment. " + (e.response?.data?.message || "")); 
    } finally {
      setIsCreating(false);
    }
  };

  const handleDateSelect = (day: number) => {
    setSelectedDay(day);
    const dateStr = `2026-04-${day.toString().padStart(2, '0')}`;
    setDueDate(dateStr);
    setShowDatePicker(false);
  };

  const getIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("python") || t.includes("algorithm") || t.includes("logic")) return <Code size={20} color="#2563EB" />;
    if (t.includes("database") || t.includes("sql") || t.includes("data")) return <Database size={20} color="#0891B2" />;
    return <PenTool size={20} color="#64748B" />;
  };

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} role="Teacher" />
      <ScrollView
        className="flex-1 bg-[#F8FAFC]"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor="#2563EB" />
        }
      >
        <View className="px-6 pt-10">
           {/* Header Section */}
           <View className="mb-10">
              <View className="flex-row items-center gap-2 mb-3">
                 <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-blue-700 text-[10px] font-black uppercase tracking-widest">Curriculum Control</Text>
                 </View>
                 <Sparkles size={14} color="#3B82F6" />
              </View>
              <Text className="text-[40px] font-black text-slate-900 leading-[44px] tracking-tight">
                 Assignment <Text className="text-blue-600">Lab</Text>
              </Text>
              <Text className="text-slate-400 text-base font-bold mt-2">Design, schedule, and oversee technical challenges.</Text>
           </View>

           {/* Stats Summary */}
           <View className="flex-row justify-between mb-10">
              <View className="w-[48%] bg-white p-6 rounded-[36px] shadow-2xl shadow-slate-900/[0.03] border border-slate-50">
                 <View className="bg-blue-50 w-12 h-12 rounded-2xl items-center justify-center mb-4">
                    <Layers size={20} color="#2563EB" />
                 </View>
                 <Text className="text-3xl font-black text-slate-900 mb-0.5">{assignments.length}</Text>
                 <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tasks</Text>
              </View>
              <View className="w-[48%] bg-white p-6 rounded-[36px] shadow-2xl shadow-slate-900/[0.03] border border-slate-50">
                 <View className="bg-emerald-50 w-12 h-12 rounded-2xl items-center justify-center mb-4">
                    <Users size={20} color="#10B981" />
                 </View>
                 <Text className="text-3xl font-black text-slate-900 mb-0.5">{courses.length}</Text>
                 <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Modules</Text>
              </View>
           </View>

           {/* Create Form Card */}
           <View className="bg-white rounded-[44px] p-8 shadow-2xl shadow-slate-900/[0.04] border border-white mb-12">
              <View className="flex-row items-center justify-between mb-8">
                 <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-[20px] bg-slate-900 items-center justify-center mr-4">
                       <Plus size={24} color="white" />
                    </View>
                    <View>
                       <Text className="text-xl font-black text-slate-900 tracking-tight">Create Challenge</Text>
                       <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">New Assignment</Text>
                    </View>
                 </View>
              </View>

              <View className="gap-8">
                 <View>
                    <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Assignment Title</Text>
                    <TextInput
                      placeholder="e.g. Advanced React Hooks Mastery"
                      className="bg-slate-50/50 border border-slate-100 rounded-3xl px-6 py-5 text-slate-900 text-[14px] font-black"
                      placeholderTextColor="#CBD5E1"
                      value={title}
                      onChangeText={setTitle}
                    />
                 </View>

                 <View>
                    <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Target Module</Text>
                    <TouchableOpacity 
                      activeOpacity={0.8}
                      onPress={() => setCoursePickerVisible(true)} 
                      className="bg-slate-50/50 border border-slate-100 rounded-3xl px-6 py-5 flex-row items-center justify-between"
                    >
                       <Text className="text-slate-900 text-sm font-black" numberOfLines={1}>
                          {courses.find(c => String(c.id || c._id) === selectedCourseId)?.title || "Select Module"}
                       </Text>
                       <ChevronDown size={18} color="#94A3B8" />
                    </TouchableOpacity>
                 </View>

                 <View className="flex-row justify-between">
                    <View className="w-full">
                       <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Submission Deadline</Text>
                       <TouchableOpacity 
                         activeOpacity={0.8}
                         onPress={() => setShowDatePicker(true)}
                         className="bg-slate-50/50 border border-slate-100 rounded-3xl px-6 py-5 flex-row items-center justify-between"
                       >
                          <Text className={`text-sm font-black ${dueDate ? "text-slate-900" : "text-slate-400"}`}>
                             {dueDate || "Select target date"}
                          </Text>
                          <Calendar size={18} color="#94A3B8" />
                       </TouchableOpacity>
                    </View>
                 </View>

                 <View>
                    <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Challenge Brief</Text>
                    <TextInput
                      placeholder="Detail the technical requirements..."
                      className="bg-slate-50/50 border border-slate-100 rounded-[36px] px-6 py-5 text-slate-900 text-sm font-black h-40"
                      placeholderTextColor="#CBD5E1"
                      multiline
                      textAlignVertical="top"
                      value={description}
                      onChangeText={setDescription}
                    />
                 </View>

                 <TouchableOpacity 
                   onPress={handleCreate}
                   disabled={isCreating}
                   activeOpacity={0.8}
                   className="overflow-hidden rounded-[28px] mt-4 shadow-xl shadow-blue-200"
                 >
                    <LinearGradient
                      colors={['#2563EB', '#1D4ED8']}
                      className="py-6 flex-row items-center justify-center gap-3"
                    >
                       {isCreating ? (
                         <ActivityIndicator size="small" color="white" />
                       ) : (
                         <>
                            <Text className="text-white font-black text-sm uppercase tracking-widest">Publish Challenge</Text>
                            <ArrowRight size={18} color="white" />
                         </>
                       )}
                    </LinearGradient>
                 </TouchableOpacity>
              </View>
           </View>

           {/* Active Submissions List */}
           <View className="mb-10">
              <View className="flex-row items-center justify-between mb-8">
                 <View>
                    <Text className="text-2xl font-black text-slate-900">Active Tasks</Text>
                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Managed Curriculum</Text>
                 </View>
                 <TouchableOpacity className="bg-blue-50 px-4 py-2 rounded-full">
                    <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest">View Archives</Text>
                 </TouchableOpacity>
              </View>

              <View className="gap-6">
                 {assignments.map((item, idx) => {
                   const aId = String(item.id || item._id);
                   return (
                     <TouchableOpacity 
                       key={aId} 
                       activeOpacity={0.9}
                       onPress={() => navigation.navigate("TeacherSubmissions", { assignmentId: aId, assignmentTitle: item.title })}
                       className="bg-white rounded-[40px] p-8 border border-white shadow-2xl shadow-slate-900/[0.04]"
                     >
                        <View className="flex-row items-start justify-between mb-8">
                           <View className="w-16 h-16 rounded-[24px] bg-slate-50 items-center justify-center border border-slate-50 shadow-sm">
                              {getIcon(item.title)}
                           </View>
                           <View className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                              <Text className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Review Pending</Text>
                           </View>
                        </View>
                        
                        <Text className="text-2xl font-black text-slate-900 mb-1 leading-tight tracking-tight">{item.title}</Text>
                        <Text className="text-blue-600 font-black text-sm mb-8">{item.courseTitle || "General Module"}</Text>
                        
                        <View className="flex-row items-center gap-6 mb-8 bg-slate-50/50 p-4 rounded-3xl">
                           <View className="flex-row items-center">
                              <Calendar size={14} color="#94A3B8" />
                              <Text className="text-xs font-black text-slate-500 ml-2">
                                 {item.due_date ? new Date(item.due_date).toLocaleDateString() : "No Deadline"}
                              </Text>
                           </View>
                           <View className="flex-row items-center">
                              <Users size={14} color="#94A3B8" />
                              <Text className="text-xs font-black text-slate-500 ml-2">Track Submissions</Text>
                           </View>
                        </View>

                        <TouchableOpacity 
                          activeOpacity={0.8}
                          onPress={() => navigation.navigate("TeacherSubmissions", { assignmentId: aId, assignmentTitle: item.title })}
                          className="bg-slate-900 rounded-[28px] py-6 items-center justify-center shadow-xl shadow-slate-200"
                        >
                          <Text className="text-white font-black text-[11px] uppercase tracking-[2px]">Grade Submissions</Text>
                        </TouchableOpacity>
                     </TouchableOpacity>
                   );
                 })}

                 {assignments.length === 0 && (
                   <View className="items-center justify-center py-20 bg-slate-50 rounded-[44px] border border-dashed border-slate-200">
                      <Layout size={40} color="#CBD5E1" />
                      <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-4">No assignments published</Text>
                   </View>
                 )}
              </View>
           </View>
        </View>
      </ScrollView>

      {/* Course Picker Modal */}
      <Modal visible={coursePickerVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
           <View className="bg-[#F8FAFC] rounded-t-[56px] h-[70%] p-8">
              <View className="flex-row items-center justify-between mb-10">
                 <View>
                    <Text className="text-3xl font-black text-slate-900">Select Module</Text>
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Curriculum Sync</Text>
                 </View>
                 <TouchableOpacity 
                   onPress={() => setCoursePickerVisible(false)} 
                   className="bg-white w-14 h-14 rounded-3xl items-center justify-center shadow-2xl shadow-slate-900/[0.05] border border-slate-50"
                 >
                    <X size={24} color="#64748B" />
                 </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                 <View className="gap-4 pb-20">
                    {courses.map((course) => {
                      const cid = String(course.id || course._id);
                      const selected = cid === selectedCourseId;
                      return (
                        <TouchableOpacity
                          key={cid}
                          activeOpacity={0.8}
                          onPress={() => {
                            setSelectedCourseId(cid);
                            setCoursePickerVisible(false);
                          }}
                          className={`p-6 rounded-[32px] border-2 flex-row items-center justify-between ${selected ? "bg-white border-blue-100 shadow-xl shadow-slate-100" : "bg-white border-transparent shadow-sm"}`}
                        >
                           <View className="flex-row items-center gap-4">
                              <View className={`w-12 h-12 rounded-2xl items-center justify-center ${selected ? 'bg-blue-600' : 'bg-slate-100'}`}>
                                 <BookOpen size={20} color={selected ? "white" : "#64748B"} />
                              </View>
                              <Text className={`font-black text-sm ${selected ? "text-blue-600" : "text-slate-700"}`}>
                                {course.title}
                              </Text>
                           </View>
                           {selected && (
                             <View className="bg-blue-600 w-6 h-6 rounded-full items-center justify-center">
                                <Plus size={14} color="white" style={{ transform: [{ rotate: '45deg' }] }} />
                             </View>
                           )}
                        </TouchableOpacity>
                      );
                    })}
                 </View>
              </ScrollView>
           </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
           <View className="bg-[#F8FAFC] rounded-t-[56px] h-[70%] p-8">
              <View className="flex-row items-center justify-between mb-10">
                 <View>
                    <Text className="text-3xl font-black text-slate-900">Step 3: Date</Text>
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Submission Deadline</Text>
                 </View>
                 <TouchableOpacity 
                   onPress={() => setShowDatePicker(false)} 
                   className="bg-white w-14 h-14 rounded-3xl items-center justify-center shadow-2xl shadow-slate-900/[0.05] border border-slate-50"
                 >
                    <X size={24} color="#64748B" />
                 </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <View className="gap-8 pb-20">
                  <View className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-50">
                     <View className="flex-row justify-between mb-8">
                       {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map(d => (
                          <Text key={d} className="w-10 text-center text-[11px] font-black text-slate-300 uppercase tracking-widest">{d}</Text>
                       ))}
                     </View>
                     <View className="flex-row flex-wrap justify-between gap-y-5">
                       {[28, 29, 30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((day, i) => {
                         const isOtherMonth = i < 4;
                         const isSelected = day === selectedDay && !isOtherMonth;
                         return (
                           <TouchableOpacity 
                             key={i} 
                             onPress={() => !isOtherMonth && handleDateSelect(day)} 
                             className={`w-10 h-10 items-center justify-center rounded-[18px] ${isSelected ? "bg-blue-600 shadow-xl shadow-blue-200" : ""}`}
                           >
                             <Text className={`text-sm font-black ${isOtherMonth ? "text-slate-100" : isSelected ? "text-white" : "text-slate-600"}`}>{day}</Text>
                           </TouchableOpacity>
                         );
                       })}
                     </View>
                  </View>
                </View>
              </ScrollView>
           </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
