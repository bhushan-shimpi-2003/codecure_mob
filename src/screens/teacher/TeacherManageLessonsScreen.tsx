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
import { COLORS } from "../../utils/theme";
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
} from "lucide-react-native";
import { coursesApi, lessonsApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";


export default function TeacherManageLessonsScreen({ navigation, route }: any) {
  const { courseId, courseTitle: initialTitle } = route.params || {};
  const { width } = useWindowDimensions();
  
  const [course, setCourse] = useState<any>(null);
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
      // First try fetching by ID (might be slug in route but usually we pass ID)
      const res = await coursesApi.detail(courseId);
      if (isApiSuccess(res.data)) {
        const data = extractApiData<any>(res.data, null);
        setCourse(data);
        if (data.modules && data.modules.length > 0) {
          setModules(data.modules);
          // Expand first module by default
          setExpandedModules({ [data.modules[0].id || data.modules[0]._id]: true });
        }
      }

      const lessonRes = await lessonsApi.byCourse(courseId);
      if (isApiSuccess(lessonRes.data)) {
        const lessonData = extractApiData<any[]>(lessonRes.data, []);
        setLessons(lessonData);
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
    
    setIsSubmitting(true);
    try {
      const payload = {
        title: newLessonTitle,
        course_id: courseId,
        module_id: moduleId,
        video_url: newLessonVideoUrl,
        duration: newLessonDuration,
        content: newLessonNotes,
        status: "published",
      };
      
      const res = await lessonsApi.create(payload);
      if (isApiSuccess(res.data)) {
        Alert.alert("Success", "Lesson published successfully");
        setNewLessonTitle("");
        setNewLessonVideoUrl("");
        setNewLessonDuration("");
        setNewLessonNotes("");
        fetchCourseData(); // Refresh
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
      const res = await coursesApi.addModule(courseId, { title: newModuleTitle });
      if (isApiSuccess(res.data)) {
        Alert.alert("Success", "Module added successfully");
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
      <SafeAreaWrapper>
        <AppHeader role="Teacher" navigation={navigation} />
        <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="mt-4 text-slate-500 font-bold">Loading curriculum...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  // Stats derived from data
  const stats = [
    { label: "Total Lessons", value: lessons.length || 0, icon: PlayCircle, color: "#1D4ED8" },
    { label: "Course Modules", value: modules.length || 0, icon: Hourglass, color: "#1D4ED8" },
    { label: "Active Students", value: course?.students_enrolled || 0, icon: Users, color: "#1D4ED8" },
  ];

  return (
    <SafeAreaWrapper>
      <AppHeader role="Teacher" navigation={navigation} />
      <ScrollView className="flex-1 bg-[#F8FAFC]" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-6">
          <Text className="text-[10px] font-black text-blue-600 uppercase tracking-[2px] mb-1">
            CURRICULUM MANAGEMENT
          </Text>
          <Text className="text-4xl font-black text-slate-900 mb-2">{course?.title || "Manage"}</Text>
          <Text className="text-4xl font-black text-slate-900 mb-4">Lessons</Text>
          <Text className="text-slate-500 text-sm leading-5 mb-8">
            Organize your teaching path. Add new modules, upload high-quality video content, and manage your students' learning journey.
          </Text>

          {/* Stats Cards */}
          <View className="gap-4 mb-10">
            {stats.map((stat, idx) => (
              <View 
                key={idx} 
                className="bg-white p-6 rounded-[32px] flex-row items-center shadow-sm border border-slate-50"
                style={idx === 1 ? { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' } : {}}
              >
                <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${idx === 1 ? 'bg-white' : 'bg-slate-50'}`}>
                  <stat.icon size={20} color={stat.color} />
                </View>
                <View>
                  <Text className="text-2xl font-black text-slate-900">{stat.value}</Text>
                  <Text className="text-slate-500 text-xs font-bold">{stat.label}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Modules List */}
          <View className="mb-6">
            {modules.length === 0 && (
              <View className="bg-white rounded-[32px] p-8 items-center border border-dashed border-slate-200">
                <Text className="text-slate-500 font-bold mb-4">No modules found for this course.</Text>
                <TouchableOpacity 
                   className="bg-blue-600 px-6 py-3 rounded-2xl"
                   onPress={() => navigation.navigate("TeacherCreateLesson", { courseId })}
                >
                   <Text className="text-white font-black">Add First Lesson</Text>
                </TouchableOpacity>
              </View>
            )}

            {modules.map((module) => {
              const moduleId = module.id || module._id;
              const moduleLessons = lessons.filter(l => l.module_id === moduleId || l.module === moduleId);
              const isExpanded = expandedModules[moduleId];

              return (
                <View key={moduleId} className="bg-white rounded-[32px] overflow-hidden mb-4 shadow-sm border border-slate-50">
                  <TouchableOpacity 
                    activeOpacity={0.7}
                    onPress={() => toggleModule(moduleId)}
                    className="p-5 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 rounded-2xl bg-blue-600 items-center justify-center mr-4">
                        <PlayCircle size={24} color="white" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-black text-slate-900">{module.title}</Text>
                        <Text className="text-slate-400 text-[10px] font-bold uppercase mt-0.5">
                           {moduleLessons.length} Lessons • {module.duration || "N/A"}
                        </Text>
                      </View>
                    </View>
                    {isExpanded ? <ChevronUp size={20} color="#94A3B8" /> : <ChevronDown size={20} color="#94A3B8" />}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View className="px-5 pb-5">
                      {moduleLessons.map((lesson, lIdx) => {
                        const isUploading = lesson.status === "uploading" || lesson.isUploading;
                        const videoLink = lesson.video_url || lesson.youtube_url || "";
                        
                        return (
                          <View key={lesson.id || lesson._id} className={`rounded-3xl p-4 mb-3 border ${isUploading ? 'bg-[#F0F7FF] border-blue-50' : 'bg-[#F8FAFC] border-transparent'}`}>
                            <View className="flex-row items-center justify-between mb-2">
                              <View className="flex-row items-center flex-1">
                                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 border ${isUploading ? 'bg-blue-100 border-blue-200' : 'bg-white border-slate-100'}`}>
                                  {isUploading ? <UploadCloud size={14} color="#2563EB" /> : <Text className="text-[10px] font-black text-slate-400">{String(lIdx + 1).padStart(2, '0')}</Text>}
                                </View>
                                <View className="flex-1">
                                  <Text className="text-sm font-black text-slate-900" numberOfLines={1}>{lesson.title}</Text>
                                  {isUploading ? (
                                    <Text className="text-blue-600 text-[9px] font-black uppercase">UPLOADING... {lesson.progress || uploadingProgress}%</Text>
                                  ) : (
                                    <View className="flex-row items-center mt-1">
                                      <PlayCircle size={12} color="#94A3B8" />
                                      <Text className="text-slate-400 text-[10px] font-bold ml-1">{lesson.duration || "00:00"}</Text>
                                      {videoLink ? (
                                        <>
                                          <View className="w-1 h-1 rounded-full bg-slate-300 mx-2" />
                                          <LinkIcon size={10} color="#94A3B8" />
                                          <Text className="text-slate-400 text-[10px] font-medium ml-1" numberOfLines={1}>{videoLink}</Text>
                                        </>
                                      ) : null}
                                    </View>
                                  )}
                                </View>
                              </View>
                              {!isUploading && (
                                <TouchableOpacity 
                                  onPress={() => navigation.navigate("TeacherEditLesson", { lesson, courseId })}
                                  className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center"
                                >
                                  <Edit3 size={14} color="#2563EB" />
                                </TouchableOpacity>
                              )}
                              {isUploading && (
                                <TouchableOpacity>
                                  <X size={16} color="#94A3B8" />
                                </TouchableOpacity>
                              )}
                            </View>
                            
                            {isUploading && (
                              <View className="h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                                 <View className="h-full bg-blue-600" style={{ width: `${lesson.progress || uploadingProgress}%` }} />
                              </View>
                            )}

                            {/* Option to add/edit link even while uploading or if missing */}
                            {(!videoLink || isUploading) && (
                               <View className="mt-3 flex-row items-center bg-white/50 rounded-xl px-3 py-2 border border-slate-100">
                                  <LinkIcon size={12} color="#94A3B8" className="mr-2" />
                                  <TextInput 
                                    placeholder="Add/Edit Video Link"
                                    className="flex-1 text-[11px] text-slate-600 h-6 p-0"
                                    placeholderTextColor="#94A3B8"
                                    defaultValue={videoLink}
                                    onSubmitEditing={(e) => {
                                       // In a real app, you'd call an update lesson API here
                                       Alert.alert("Link Updated", "Lesson video link has been saved.");
                                    }}
                                  />
                                </View>
                            )}
                          </View>
                        );
                      })}

                      {/* New Video Lesson Form */}
                      <View className="border-2 border-dashed border-slate-200 rounded-[32px] p-6 items-center mt-4">
                         <View className="w-14 h-14 rounded-full bg-blue-50 items-center justify-center mb-4">
                            <UploadCloud size={24} color="#2563EB" />
                         </View>
                         <Text className="text-base font-black text-slate-900 mb-1">New Video Lesson</Text>
                         <Text className="text-slate-400 text-[11px] font-medium text-center mb-6">
                           Provide video details for this module
                         </Text>

                         <View className="w-full gap-3">
                            <View>
                              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">LESSON TITLE</Text>
                              <TextInput 
                                placeholder="e.g. Master the Debugger"
                                className="bg-slate-50 rounded-xl px-4 py-3 text-slate-900 text-sm"
                                placeholderTextColor="#94A3B8"
                                value={newLessonTitle}
                                onChangeText={setNewLessonTitle}
                              />
                            </View>

                            <View>
                              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">VIDEO URL / LINK</Text>
                              <View className="bg-slate-50 rounded-xl px-4 py-3 flex-row items-center">
                                 <LinkIcon size={16} color="#94A3B8" className="mr-2" />
                                 <TextInput 
                                   placeholder="YouTube/Vimeo or Video URL"
                                   className="flex-1 text-slate-900 text-sm"
                                   placeholderTextColor="#94A3B8"
                                   value={newLessonVideoUrl}
                                   onChangeText={setNewLessonVideoUrl}
                                 />
                              </View>
                            </View>
                            
                            <View className="flex-row gap-3">
                               <View className="flex-1">
                                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">DURATION</Text>
                                  <TextInput 
                                    placeholder="MM:SS"
                                    className="bg-slate-50 rounded-xl px-4 py-3 text-slate-900 text-sm text-center"
                                    placeholderTextColor="#94A3B8"
                                    value={newLessonDuration}
                                    onChangeText={setNewLessonDuration}
                                  />
                               </View>
                               <View className="flex-1">
                                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">ACCESS TYPE</Text>
                                  <View className="bg-slate-50 rounded-xl px-4 py-3 flex-row items-center justify-between">
                                     <Text className="text-slate-900 text-sm">Public</Text>
                                     <Lock size={14} color="#94A3B8" />
                                  </View>
                               </View>
                            </View>

                            <View>
                              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">TEACHER NOTES</Text>
                              <TextInput 
                                placeholder="Add key takeaways or resource links..."
                                className="bg-slate-50 rounded-xl px-4 py-4 text-slate-900 text-sm h-24"
                                placeholderTextColor="#94A3B8"
                                multiline
                                textAlignVertical="top"
                                value={newLessonNotes}
                                onChangeText={setNewLessonNotes}
                              />
                            </View>

                            <View className="flex-row gap-3 mt-2">
                               <TouchableOpacity 
                                 className="flex-1 bg-blue-600 rounded-2xl py-4 items-center shadow-md shadow-blue-200"
                                 onPress={() => handlePublishLesson(moduleId)}
                                 disabled={isSubmitting}
                               >
                                  {isSubmitting ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white font-black text-sm">Publish Lesson</Text>}
                               </TouchableOpacity>
                               <TouchableOpacity className="flex-1 bg-slate-200 rounded-2xl py-4 items-center shadow-sm">
                                  <Text className="text-slate-700 font-black text-sm">Save Draft</Text>
                               </TouchableOpacity>
                            </View>
                         </View>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Fallback lessons without modules */}
            {lessons.filter(l => !l.module_id && !l.module).length > 0 && (
               <View className="bg-white rounded-[32px] overflow-hidden mb-4 shadow-sm border border-slate-50">
                  <View className="p-5 flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mr-4">
                        <FileText size={24} color="#94A3B8" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-black text-slate-900">Uncategorized Lessons</Text>
                        <Text className="text-slate-400 text-[10px] font-bold uppercase mt-0.5">
                           {lessons.filter(l => !l.module_id && !l.module).length} Lessons
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="px-5 pb-5">
                     {lessons.filter(l => !l.module_id && !l.module).map((lesson, lIdx) => (
                        <View key={lesson.id || lesson._id} className="bg-[#F8FAFC] rounded-3xl p-4 flex-row items-center justify-between mb-3">
                           <View className="flex-row items-center flex-1">
                             <View className="w-10 h-10 rounded-full bg-white items-center justify-center mr-3 border border-slate-100">
                               <Text className="text-[10px] font-black text-slate-400">{String(lIdx + 1).padStart(2, '0')}</Text>
                             </View>
                             <View className="flex-1">
                               <Text className="text-sm font-black text-slate-900">{lesson.title}</Text>
                             </View>
                           </View>
                           <TouchableOpacity 
                              onPress={() => navigation.navigate("TeacherEditLesson", { lesson, courseId })}
                              className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center"
                           >
                              <Edit3 size={14} color="#2563EB" />
                           </TouchableOpacity>
                        </View>
                     ))}
                  </View>
               </View>
            )}
            
            {showModuleInput ? (
               <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50 mt-4">
                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">NEW MODULE TITLE</Text>
                  <TextInput 
                    placeholder="e.g. Intermediate Concepts"
                    className="bg-slate-50 rounded-xl px-4 py-3 text-slate-900 text-sm mb-4"
                    placeholderTextColor="#94A3B8"
                    value={newModuleTitle}
                    onChangeText={setNewModuleTitle}
                    autoFocus
                  />
                  <View className="flex-row gap-3">
                     <TouchableOpacity 
                        className="flex-1 bg-blue-600 rounded-2xl py-3 items-center"
                        onPress={handleAddModule}
                        disabled={isAddingModule}
                     >
                        {isAddingModule ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white font-black text-sm">Add Module</Text>}
                     </TouchableOpacity>
                     <TouchableOpacity 
                        className="flex-1 bg-slate-100 rounded-2xl py-3 items-center"
                        onPress={() => setShowModuleInput(false)}
                     >
                        <Text className="text-slate-500 font-black text-sm">Cancel</Text>
                     </TouchableOpacity>
                  </View>
               </View>
            ) : (
               <TouchableOpacity 
                  className="border border-slate-200 rounded-3xl py-4 items-center mt-4 flex-row justify-center bg-slate-50/50"
                  onPress={() => setShowModuleInput(true)}
               >
                  <Plus size={18} color="#94A3B8" className="mr-2" />
                  <Text className="text-slate-500 font-black text-sm">Add New Module Track</Text>
               </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
