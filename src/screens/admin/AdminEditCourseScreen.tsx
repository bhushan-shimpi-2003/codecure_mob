import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  Image,
  ActivityIndicator,
  Modal,
  Dimensions
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { coursesApi, adminApi, lessonsApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { 
  ChevronLeft, 
  Save, 
  Trash2, 
  Camera, 
  Plus, 
  Trash,
  X,
  Check,
  BookOpen,
  Activity,
  User,
  ChevronDown,
  Image as ImageIcon
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { AppHeader } from "../../components/AppHeader";
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get("window");

export default function AdminEditCourseScreen({ route, navigation }: any) {
  const { course } = route.params || {};
  
  const [activeTab, setActiveTab] = useState("Basic Info");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [previewUri, setPreviewUri] = useState<string | null>(course?.thumbnail || null);
  const [modules, setModules] = useState<any[]>([]);
  
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);

  const [formData, setFormData] = useState({
    title: course?.title || "",
    description: course?.description || "",
    price: String(course?.price || "0"),
    category: course?.category || "Development",
    status: course?.status === 'published' ? 'Published (Public)' : 'Draft (Hidden)',
    thumbnail: course?.thumbnail || "",
    instructorId: course?.instructor_id || ""
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const courseId = course.id || course._id;
      const [staffRes, lessonsRes, detailRes] = await Promise.allSettled([
        adminApi.getStaff(),
        lessonsApi.byCourse(courseId),
        coursesApi.detail(course.slug || courseId)
      ]);

      if (staffRes.status === "fulfilled" && isApiSuccess(staffRes.value.data)) {
        const staff = extractApiData<any[]>(staffRes.value.data, []);
        setTeachers(staff.filter(s => s.role === 'teacher'));
      }

      let fullCourse = course;
      if (detailRes.status === "fulfilled" && isApiSuccess(detailRes.value.data)) {
        fullCourse = extractApiData<any>(detailRes.value.data, course);
      }

      // Process modules and lessons
      const courseModules = Array.isArray(fullCourse?.modules) ? fullCourse.modules : [];
      let lessonsList: any[] = [];
      if (lessonsRes.status === "fulfilled" && isApiSuccess(lessonsRes.value.data)) {
        lessonsList = extractApiData<any[]>(lessonsRes.value.data, []);
      }

      // Map lessons to modules
      const enrichedModules = courseModules.map((mod: any) => {
        const modId = String(mod.id || mod._id);
        return {
          ...mod,
          lessons: lessonsList.filter((l: any) => String(l.module_id) === modId)
        };
      });

      setModules(enrichedModules);

    } catch (e) {
      console.log("Error loading edit data", e);
    } finally {
      setIsLoadingData(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPreviewUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Could not access image library");
    }
  };

  const handleSave = async () => {
    if (!formData.title) {
      Alert.alert("Error", "Course title is required");
      return;
    }

    setIsSaving(true);
    try {
      let payload: any;
      const isNewImage = previewUri && previewUri !== course.thumbnail;
      
      if (isNewImage) {
        payload = new FormData();
        payload.append('title', formData.title);
        payload.append('description', formData.description);
        payload.append('price', String(formData.price).replace(/,/g, ''));
        payload.append('category', formData.category || "Development");
        payload.append('status', formData.status.includes("Draft") ? "draft" : "published");
        payload.append('modules', JSON.stringify(modules));
        if (formData.instructorId) {
          payload.append('instructor_id', formData.instructorId);
        }
        
        const filename = previewUri!.split('/').pop() || 'thumbnail.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpg`;
        
        // @ts-ignore
        payload.append('thumbnail', { uri: previewUri, name: filename, type });
      } else {
        payload = {
          title: formData.title,
          description: formData.description,
          price: Number(String(formData.price).replace(/,/g, '')) || 0,
          category: formData.category || "Development",
          status: formData.status.includes("Draft") ? "draft" : "published",
          instructor_id: formData.instructorId || null,
          modules: modules
        };
      }
      
      const res = await coursesApi.update(course.id || course._id, payload);

      if (isApiSuccess(res.data)) {
        Alert.alert("Success", "Course and Curriculum updated successfully");
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert("Error", "Failed to update course");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this course permanently?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await coursesApi.delete(course.id || course._id);
              if (isApiSuccess(res.data)) {
                navigation.goBack();
              }
            } catch (e) {
              Alert.alert("Error", "Failed to delete course");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaWrapper bgWhite>
      {/* Header */}
      <View className="px-8 py-6 flex-row items-center justify-between border-b border-slate-50">
        <View className="flex-row items-center">
           <TouchableOpacity 
             onPress={() => navigation.goBack()}
             className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center mr-4"
           >
              <ChevronLeft size={24} color={COLORS.slate900} />
           </TouchableOpacity>
           <View>
              <Text className="text-2xl font-black text-slate-900">Edit Course</Text>
              <Text className="text-slate-400 text-xs font-bold mt-0.5">{course.title}</Text>
           </View>
        </View>

        <TouchableOpacity 
          onPress={handleDelete}
          className="w-12 h-12 bg-rose-50 rounded-2xl items-center justify-center"
        >
           <Trash2 size={20} color="#F43F5E" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="flex-row px-8 mt-8 border-b border-slate-100">
         {["Basic Info", "Curriculum & Modules"].map((tab) => (
           <TouchableOpacity 
             key={tab}
             onPress={() => setActiveTab(tab)}
             className={`mr-8 pb-4 ${activeTab === tab ? 'border-b-2 border-blue-600' : ''}`}
           >
              <Text className={`font-black text-sm ${activeTab === tab ? 'text-slate-900' : 'text-slate-400'}`}>{tab}</Text>
           </TouchableOpacity>
         ))}
      </View>

      <ScrollView className="flex-1 bg-[#F8FAFC]" contentContainerStyle={{ padding: 32 }}>
        {activeTab === "Basic Info" ? (
          <View className="bg-white p-10 rounded-[44px] shadow-sm border border-slate-50">
             {/* Course Title */}
             <View className="mb-8">
                <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest mb-3">Course Title</Text>
                <TextInput 
                  className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100 font-bold text-slate-900"
                  value={formData.title}
                  onChangeText={(t) => setFormData({...formData, title: t})}
                />
             </View>

             <View className="flex-row gap-6 mb-8">
                {/* Price */}
                <View className="flex-1">
                   <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest mb-3">Course Fee (₹)</Text>
                   <TextInput 
                     className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100 font-bold text-slate-900"
                     value={formData.price}
                     onChangeText={(t) => setFormData({...formData, price: t})}
                     keyboardType="numeric"
                   />
                </View>

                {/* Thumbnail */}
                <View className="flex-[1.5]">
                   <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest mb-3">Cinematic Thumbnail</Text>
                   <TouchableOpacity 
                     onPress={pickImage}
                     activeOpacity={0.7}
                     className="w-full h-24 bg-blue-50/20 rounded-3xl border-2 border-dashed border-blue-100 items-center justify-center overflow-hidden"
                   >
                      {previewUri ? (
                        <View className="w-full h-full relative">
                           <Image source={{ uri: previewUri }} className="w-full h-full" resizeMode="cover" />
                           <View className="absolute inset-0 bg-slate-900/40 items-center justify-center">
                              <Camera size={24} color="white" />
                              <Text className="text-white font-black text-[10px] uppercase tracking-widest mt-2">Change Asset</Text>
                           </View>
                        </View>
                      ) : (
                        <View className="items-center">
                           <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mb-3">
                              <ImageIcon size={24} color="#2563EB" />
                           </View>
                           <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest">Select Image</Text>
                           <Text className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mt-1">1280 × 720 Preferred</Text>
                        </View>
                      )}
                   </TouchableOpacity>
                </View>
             </View>

             <View className="flex-row gap-6 mb-8">
                {/* Status */}
                <View className="flex-1">
                   <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest mb-3">Status</Text>
                   <TouchableOpacity 
                     onPress={() => setShowStatusModal(true)}
                     className="bg-white p-6 rounded-2xl border border-blue-100 flex-row items-center justify-between"
                   >
                      <Text className="font-bold text-slate-900">{formData.status}</Text>
                      <ChevronDown size={18} color="#CBD5E1" />
                   </TouchableOpacity>
                </View>

                {/* Teacher */}
                <View className="flex-1">
                   <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest mb-3">Instructor</Text>
                   <TouchableOpacity 
                     onPress={() => setShowTeacherModal(true)}
                     className="bg-white p-6 rounded-2xl border border-blue-100 flex-row items-center justify-between"
                   >
                      <Text className="font-bold text-slate-900" numberOfLines={1}>
                        {formData.instructorId ? (teachers.find(t => (t.id || t._id) === formData.instructorId)?.name || 'Instructor') : '-- Select --'}
                      </Text>
                      <ChevronDown size={18} color="#CBD5E1" />
                   </TouchableOpacity>
                </View>
             </View>

             <View className="mb-8">
                <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest mb-3">Description</Text>
                <TextInput 
                  className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100 font-bold text-slate-900 h-40"
                  value={formData.description}
                  onChangeText={(t) => setFormData({...formData, description: t})}
                  multiline
                  textAlignVertical="top"
                />
             </View>

             <TouchableOpacity 
               onPress={handleSave}
               disabled={isSaving}
               className="bg-slate-900 p-8 rounded-[32px] flex-row items-center justify-center"
             >
                {isSaving ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-sm uppercase tracking-widest">Update Course</Text>}
             </TouchableOpacity>
          </View>
        ) : (
          <View>
             <View className="flex-row items-center justify-between mb-8">
                <View>
                   <Text className="text-2xl font-black text-slate-900">Curriculum Editor</Text>
                   <Text className="text-slate-400 text-xs font-bold mt-1">Manage existing modules and lessons</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setModules([...modules, { title: "New Module", lessons: [] }])}
                  className="bg-slate-900 px-6 py-4 rounded-2xl"
                >
                   <Text className="text-white font-black text-[10px] uppercase tracking-widest">Add Module</Text>
                </TouchableOpacity>
             </View>

             {modules.map((mod, mIdx) => (
                <View key={mIdx} className="bg-white p-8 rounded-[44px] mb-6 border border-slate-50 shadow-sm">
                   <View className="flex-row items-center justify-between mb-6">
                      <View className="flex-1 mr-4">
                         <TextInput 
                            className="text-xl font-black text-slate-900 p-0"
                            value={mod.title}
                            onChangeText={(t) => {
                               const next = [...modules];
                               next[mIdx].title = t;
                               setModules(next);
                            }}
                         />
                         <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest mt-1">Module {mIdx + 1}</Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => {
                           const next = [...modules];
                           next.splice(mIdx, 1);
                           setModules(next);
                        }}
                        className="w-10 h-10 bg-rose-50 rounded-xl items-center justify-center"
                      >
                         <X size={16} color="#F43F5E" />
                      </TouchableOpacity>
                   </View>

                   <View className="gap-3">
                      {mod.lessons?.map((lesson: any, lIdx: number) => (
                        <View key={lIdx} className="bg-slate-50 p-5 rounded-2xl flex-row items-center justify-between border border-slate-100">
                           <TextInput 
                              className="font-bold text-slate-900 p-0 text-sm flex-1 mr-4"
                              value={lesson.title}
                              onChangeText={(t) => {
                                 const next = [...modules];
                                 next[mIdx].lessons[lIdx].title = t;
                                 setModules(next);
                              }}
                           />
                           <TouchableOpacity onPress={() => {
                              const next = [...modules];
                              next[mIdx].lessons.splice(lIdx, 1);
                              setModules(next);
                           }}>
                              <X size={14} color="#94A3B8" />
                           </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity 
                        onPress={() => {
                           const next = [...modules];
                           if (!next[mIdx].lessons) next[mIdx].lessons = [];
                           next[mIdx].lessons.push({ title: "New Lesson", duration: "10:00" });
                           setModules(next);
                        }}
                        className="bg-blue-50/50 p-5 rounded-2xl border border-dashed border-blue-200 items-center justify-center"
                      >
                         <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest">Add Lesson</Text>
                      </TouchableOpacity>
                   </View>
                </View>
             ))}

             <TouchableOpacity 
               onPress={handleSave}
               disabled={isSaving}
               className="bg-blue-600 p-8 rounded-[32px] mt-12 flex-row items-center justify-center shadow-2xl shadow-blue-600/40"
             >
                {isSaving ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-sm uppercase tracking-widest">Save Curriculum</Text>}
             </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modals same as create screen */}
      <Modal visible={showStatusModal} transparent animationType="fade">
        <TouchableOpacity className="flex-1 bg-slate-900/50 justify-end" activeOpacity={1} onPress={() => setShowStatusModal(false)}>
           <View className="bg-white rounded-t-[44px] p-8 pb-12">
              <View className="flex-row justify-between items-center mb-8">
                 <Text className="text-slate-900 text-xl font-black">Visibility Status</Text>
                 <TouchableOpacity onPress={() => setShowStatusModal(false)} className="p-3 bg-slate-50 rounded-2xl">
                    <X size={20} color={COLORS.slate900} />
                 </TouchableOpacity>
              </View>
              {['Draft (Hidden)', 'Published (Public)'].map((status) => (
                <TouchableOpacity 
                  key={status}
                  onPress={() => { setFormData({...formData, status}); setShowStatusModal(false); }}
                  className={`p-6 rounded-[28px] mb-4 flex-row items-center justify-between ${formData.status === status ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50 border border-slate-50'}`}
                >
                   <Text className={`font-black ${formData.status === status ? 'text-blue-600' : 'text-slate-400'}`}>{status}</Text>
                   {formData.status === status && <Check size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
           </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showTeacherModal} transparent animationType="fade">
        <TouchableOpacity className="flex-1 bg-slate-900/50 justify-end" activeOpacity={1} onPress={() => setShowTeacherModal(false)}>
           <View className="bg-white rounded-t-[44px] p-8 pb-12 h-[60%]">
              <View className="flex-row justify-between items-center mb-8">
                 <Text className="text-slate-900 text-xl font-black">Instructor Assignment</Text>
                 <TouchableOpacity onPress={() => setShowTeacherModal(false)} className="p-3 bg-slate-50 rounded-2xl">
                    <X size={20} color={COLORS.slate900} />
                 </TouchableOpacity>
              </View>
              <ScrollView>
                {teachers.map((teacher) => (
                  <TouchableOpacity 
                    key={teacher.id || teacher._id}
                    onPress={() => { setFormData({...formData, instructorId: teacher.id || teacher._id}); setShowTeacherModal(false); }}
                    className={`p-6 rounded-[28px] mb-4 flex-row items-center justify-between ${formData.instructorId === (teacher.id || teacher._id) ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50 border border-slate-50'}`}
                  >
                     <View>
                        <Text className={`font-black ${formData.instructorId === (teacher.id || teacher._id) ? 'text-blue-600' : 'text-slate-900'}`}>{teacher.name}</Text>
                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{teacher.email}</Text>
                     </View>
                     {formData.instructorId === (teacher.id || teacher._id) && <Check size={20} color={COLORS.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
           </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaWrapper>
  );
}
