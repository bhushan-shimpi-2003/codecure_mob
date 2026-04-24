import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  LayoutAnimation,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { AppHeader } from "../../components/AppHeader";
import {
  PlayCircle,
  Hourglass,
  Users,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  X,
  Plus,
  Clock,
  Lock,
  FileText,
  Link as LinkIcon,
  Edit3,
  Sparkles,
  ArrowLeft,
  Layers,
  ArrowRight,
  BookOpen
} from "lucide-react-native";
import { coursesApi, lessonsApi } from "../../api/endpoints";
import { notifyStudentNewLesson, notifyStudentNewModule } from "../../utils/notificationHelper";
import { extractApiData, isApiSuccess } from "../../api/response";
import { LinearGradient } from "expo-linear-gradient";

export default function TeacherManageLessonsScreen({ navigation, route }: any) {
  const { courseId, courseTitle: initialTitle } = route.params || {};
  const { width } = useWindowDimensions();
  
  const [course, setCourse] = useState<any>(null);
  const [realCourseId, setRealCourseId] = useState("");
  const [lessons, setLessons] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [uploadingProgress, setUploadingProgress] = useState(88);

  // Form states
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState("");
  const [newLessonDuration, setNewLessonDuration] = useState("");
  const [newLessonNotes, setNewLessonNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Module form state
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [showModuleInput, setShowModuleInput] = useState(false);

  const fetchCourseData = async () => {
    if (!courseId) return;
    setIsLoading(true);
    try {
      const res = await coursesApi.detail(courseId);
      if (isApiSuccess(res.data)) {
        const data = extractApiData<any>(res.data, null);
        setCourse(data);
        const actualId = data?._id || data?.id || courseId;
        setRealCourseId(actualId);

        if (data.modules && data.modules.length > 0) {
          setModules(data.modules);
          setExpandedModules({ [data.modules[0].id || data.modules[0]._id]: true });
        }

        const lessonRes = await lessonsApi.byCourse(actualId);
        if (isApiSuccess(lessonRes.data)) {
          const lessonData = extractApiData<any[]>(lessonRes.data, []);
          setLessons(lessonData);
        }
      }
    } catch (e) {
      console.log("Error fetching course data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const toggleModule = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedModules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePublishLesson = async (moduleId?: string) => {
    if (!newLessonTitle.trim()) {
      Alert.alert("Error", "Please enter a lesson title");
      return;
    }
    
    const usableCourseId = realCourseId || courseId;
    // Guard: UUID format check — slugs (non-UUID) will cause 500
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(usableCourseId)) {
      Alert.alert("Error", "Course ID is not ready yet. Please wait a moment and try again.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        title: newLessonTitle.trim(),
        course_id: usableCourseId,
        module_id: moduleId || null,
        video_url: newLessonVideoUrl.trim() || null,
        content: newLessonNotes.trim() || null,
        duration: newLessonDuration.trim() || null,
        lesson_order: lessons.length + 1,
        is_live: false,
        is_free_preview: false,
      };
      
      const res = await lessonsApi.create(payload);
      if (isApiSuccess(res.data)) {
        Alert.alert("Success", "Lesson published successfully");
        notifyStudentNewLesson(newLessonTitle.trim(), course?.title || 'your course');

        setNewLessonTitle("");
        setNewLessonVideoUrl("");
        setNewLessonDuration("");
        setNewLessonNotes("");
        fetchCourseData();
      } else {
        Alert.alert("Error", "Failed to publish lesson");
      }
    } catch (e) {
      console.log("Error publishing lesson", e);
      Alert.alert("Error", "Something went wrong while publishing");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) {
      Alert.alert("Error", "Module title is required");
      return;
    }

    setIsAddingModule(true);
    try {
      const res = await coursesApi.addModule(realCourseId || courseId, { 
        title: newModuleTitle.trim(),
        course_id: realCourseId || courseId,
        module_order: modules.length,
        duration: null,
      });
      if (isApiSuccess(res.data)) {
        Alert.alert("Success", "Module added successfully");
        notifyStudentNewModule(newModuleTitle.trim(), course?.title || 'your course');


        setNewModuleTitle("");
        setShowModuleInput(false);
        fetchCourseData();
      } else {
        Alert.alert("Error", "Failed to add module");
      }
    } catch (e) {
      console.log("Error adding module", e);
      Alert.alert("Error", "Something went wrong while adding module");
    } finally {
      setIsAddingModule(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaWrapper bgWhite>
        <AppHeader role="Teacher" navigation={navigation} />
        <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="mt-6 text-slate-400 font-black text-[10px] uppercase tracking-widest">Loading curriculum...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader role="Teacher" navigation={navigation} />
      <ScrollView 
        className="flex-1 bg-[#F8FAFC]" 
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
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
                 <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Back to Dashboard</Text>
                 <Text className="text-slate-900 text-sm font-black tracking-tight">Curriculum Control</Text>
              </View>
           </TouchableOpacity>

           {/* Header Section */}
           <View className="mb-10">
              <View className="flex-row items-center gap-2 mb-3">
                 <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-blue-700 text-[10px] font-black uppercase tracking-widest">Mastery Tracking</Text>
                 </View>
                 <Sparkles size={14} color="#3B82F6" />
              </View>
              <Text className="text-[40px] font-black text-slate-900 leading-[44px] tracking-tight">
                 Manage <Text className="text-blue-600">Lessons</Text>
              </Text>
              <Text className="text-slate-400 text-base font-bold mt-2">{course?.title || "Course Curriculum"}</Text>
           </View>

           {/* Stats Summary Grid */}
           <View className="flex-row justify-between mb-12">
              <View className="w-[31%] bg-white p-5 rounded-[32px] shadow-2xl shadow-slate-900/[0.03] border border-slate-50 items-center">
                 <View className="bg-blue-50 w-10 h-10 rounded-2xl items-center justify-center mb-3">
                    <PlayCircle size={18} color="#2563EB" />
                 </View>
                 <Text className="text-xl font-black text-slate-900">{lessons.length}</Text>
                 <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Lessons</Text>
              </View>
              <View className="w-[31%] bg-white p-5 rounded-[32px] shadow-2xl shadow-slate-900/[0.03] border border-slate-50 items-center">
                 <View className="bg-emerald-50 w-10 h-10 rounded-2xl items-center justify-center mb-3">
                    <Layers size={18} color="#10B981" />
                 </View>
                 <Text className="text-xl font-black text-slate-900">{modules.length}</Text>
                 <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Modules</Text>
              </View>
              <View className="w-[31%] bg-white p-5 rounded-[32px] shadow-2xl shadow-slate-900/[0.03] border border-slate-50 items-center">
                 <View className="bg-amber-50 w-10 h-10 rounded-2xl items-center justify-center mb-3">
                    <Users size={18} color="#F59E0B" />
                 </View>
                 <Text className="text-xl font-black text-slate-900">{course?.students_enrolled || 0}</Text>
                 <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Enrolled</Text>
              </View>
           </View>

           {/* Modules Accordion */}
           <View className="mb-10">
              {modules.length === 0 && (
                <View className="bg-white rounded-[44px] p-10 items-center border border-dashed border-slate-200">
                   <BookOpen size={40} color="#CBD5E1" />
                   <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-4 text-center">No curriculum paths defined yet</Text>
                   <TouchableOpacity 
                      className="mt-8 bg-blue-600 px-8 py-4 rounded-2xl shadow-xl shadow-blue-200"
                      onPress={() => navigation.navigate("TeacherCreateLesson", { courseId: realCourseId || courseId })}
                   >
                      <Text className="text-white font-black text-xs uppercase tracking-widest">Add First Lesson</Text>
                   </TouchableOpacity>
                </View>
              )}

              {modules.map((module) => {
                const moduleId = module.id || module._id;
                const moduleLessons = lessons.filter(l => l.module_id === moduleId || l.module === moduleId);
                const isExpanded = expandedModules[moduleId];

                return (
                  <View key={moduleId} className="bg-white rounded-[44px] overflow-hidden mb-6 shadow-2xl shadow-slate-900/[0.04] border border-white">
                    <TouchableOpacity 
                      activeOpacity={0.9}
                      onPress={() => toggleModule(moduleId)}
                      className={`p-8 flex-row items-center justify-between ${isExpanded ? 'bg-slate-50/50' : 'bg-white'}`}
                    >
                      <View className="flex-row items-center flex-1 pr-4">
                        <View className="w-14 h-14 rounded-[20px] bg-slate-900 items-center justify-center mr-5 shadow-lg shadow-slate-200">
                          <Layers size={24} color="white" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-xl font-black text-slate-900 tracking-tight">{module.title}</Text>
                          <Text className="text-slate-400 text-[10px] font-black uppercase mt-1 tracking-widest">
                             {moduleLessons.length} Modules • {module.duration || "Self-Paced"}
                          </Text>
                        </View>
                      </View>
                      <View className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm border border-slate-50">
                        {isExpanded ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View className="px-8 pb-8 pt-4">
                        <View className="gap-4">
                          {moduleLessons.map((lesson, lIdx) => {
                            const isUploading = lesson.status === "uploading" || lesson.isUploading;
                            const videoLink = lesson.video_url || lesson.youtube_url || "";
                            
                            return (
                              <View key={lesson.id || lesson._id} className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
                                <View className="flex-row items-start justify-between">
                                  <View className="flex-row items-center flex-1 pr-4">
                                    <View className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center mr-4 border border-slate-100 shadow-sm">
                                       <Text className="text-slate-400 font-black text-xs">{String(lIdx + 1).padStart(2, '0')}</Text>
                                    </View>
                                    <View className="flex-1">
                                      <Text className="text-base font-black text-slate-900 tracking-tight" numberOfLines={1}>{lesson.title}</Text>
                                      <View className="flex-row items-center mt-1">
                                         <Clock size={12} color="#94A3B8" />
                                         <Text className="text-slate-400 text-[10px] font-black uppercase ml-1 tracking-tight">{lesson.duration || "15:00"}</Text>
                                         <View className="w-1 h-1 bg-slate-200 rounded-full mx-3" />
                                         <LinkIcon size={12} color="#2563EB" />
                                         <Text className="text-blue-600 text-[10px] font-black uppercase ml-1 tracking-tight">Video Linked</Text>
                                      </View>
                                    </View>
                                  </View>
                                  <TouchableOpacity 
                                    onPress={() => navigation.navigate("TeacherEditLesson", { lesson, courseId: realCourseId || courseId })}
                                    className="w-10 h-10 rounded-2xl bg-slate-50 items-center justify-center border border-slate-100 shadow-sm"
                                  >
                                    <Edit3 size={16} color="#64748B" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            );
                          })}

                          {/* Inline Lesson Publisher */}
                          <View className="bg-slate-50/50 rounded-[40px] p-8 mt-6 border border-slate-100 border-dashed">
                             <View className="flex-row items-center gap-4 mb-8">
                                <View className="w-12 h-12 rounded-2xl bg-blue-600 items-center justify-center shadow-lg shadow-blue-200">
                                   <Plus size={24} color="white" />
                                </View>
                                <View>
                                   <Text className="text-lg font-black text-slate-900">Publish New Lesson</Text>
                                   <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Streamline Education</Text>
                                </View>
                             </View>

                             <View className="gap-6">
                                <View>
                                   <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Lesson Title</Text>
                                   <TextInput 
                                     placeholder="e.g. Advanced State Management"
                                     className="bg-white border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 text-sm font-black shadow-sm"
                                     placeholderTextColor="#CBD5E1"
                                     value={newLessonTitle}
                                     onChangeText={setNewLessonTitle}
                                   />
                                </View>

                                <View className="flex-row justify-between gap-4">
                                   <View className="flex-1">
                                      <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Video Resource</Text>
                                      <View className="bg-white border border-slate-100 rounded-2xl px-6 py-4 flex-row items-center shadow-sm">
                                         <LinkIcon size={14} color="#94A3B8" />
                                         <TextInput 
                                           placeholder="URL"
                                           className="flex-1 text-slate-900 text-xs font-black ml-3"
                                           placeholderTextColor="#CBD5E1"
                                           value={newLessonVideoUrl}
                                           onChangeText={setNewLessonVideoUrl}
                                         />
                                      </View>
                                   </View>
                                   <View className="w-[35%]">
                                      <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Length</Text>
                                      <TextInput 
                                        placeholder="MM:SS"
                                        className="bg-white border border-slate-100 rounded-2xl px-4 py-4 text-slate-900 text-xs font-black text-center shadow-sm"
                                        placeholderTextColor="#CBD5E1"
                                        value={newLessonDuration}
                                        onChangeText={setNewLessonDuration}
                                      />
                                   </View>
                                </View>

                                <TouchableOpacity 
                                  activeOpacity={0.8}
                                  onPress={() => handlePublishLesson(moduleId)}
                                  disabled={isSubmitting}
                                  className="overflow-hidden rounded-[24px] mt-2 shadow-xl shadow-blue-200"
                                >
                                   <LinearGradient
                                     colors={['#2563EB', '#1D4ED8']}
                                     className="py-5 flex-row items-center justify-center gap-3"
                                   >
                                      {isSubmitting ? (
                                        <ActivityIndicator size="small" color="white" />
                                      ) : (
                                        <>
                                           <Text className="text-white font-black text-xs uppercase tracking-widest">Publish Resource</Text>
                                           <ArrowRight size={16} color="white" />
                                        </>
                                      )}
                                   </LinearGradient>
                                </TouchableOpacity>
                             </View>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Module Creator */}
              {showModuleInput ? (
                <View className="bg-white rounded-[44px] p-8 shadow-2xl shadow-slate-900/[0.05] border border-white mt-4">
                   <Text className="text-xl font-black text-slate-900 mb-6">Create New Module Track</Text>
                   <View className="mb-8">
                      <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Module Identity</Text>
                      <TextInput 
                        placeholder="e.g. Intermediate Algorithms"
                        className="bg-slate-50 border border-slate-100 rounded-3xl px-6 py-5 text-slate-900 text-sm font-black"
                        placeholderTextColor="#CBD5E1"
                        value={newModuleTitle}
                        onChangeText={setNewModuleTitle}
                        autoFocus
                      />
                   </View>
                   <View className="flex-row gap-4">
                      <TouchableOpacity 
                         activeOpacity={0.8}
                         className="flex-1 overflow-hidden rounded-[24px]"
                         onPress={handleAddModule}
                         disabled={isAddingModule}
                      >
                         <LinearGradient colors={['#1E293B', '#0F172A']} className="py-5 items-center">
                            {isAddingModule ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white font-black text-xs uppercase tracking-widest">Confirm Module</Text>}
                         </LinearGradient>
                      </TouchableOpacity>
                      <TouchableOpacity 
                         activeOpacity={0.8}
                         className="flex-1 bg-slate-100 rounded-[24px] py-5 items-center"
                         onPress={() => setShowModuleInput(false)}
                      >
                         <Text className="text-slate-500 font-black text-xs uppercase tracking-widest">Cancel</Text>
                      </TouchableOpacity>
                   </View>
                </View>
              ) : (
                <TouchableOpacity 
                   activeOpacity={0.9}
                   onPress={() => setShowModuleInput(true)}
                   className="bg-white rounded-[32px] p-8 items-center border border-dashed border-slate-200 mt-4 flex-row justify-center"
                >
                   <Plus size={20} color="#94A3B8" />
                   <Text className="text-slate-400 font-black text-xs uppercase tracking-widest ml-3">Add New Curriculum Track</Text>
                </TouchableOpacity>
              )}
           </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
