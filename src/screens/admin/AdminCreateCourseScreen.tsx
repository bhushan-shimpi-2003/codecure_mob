import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  Modal,
  Dimensions
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { coursesApi, adminApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { 
  ChevronLeft, 
  Save, 
  Upload, 
  Layout, 
  BookOpen, 
  Activity, 
  User, 
  Info,
  ChevronDown,
  Camera,
  Image as ImageIcon,
  Check,
  X
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { AppHeader } from "../../components/AppHeader";
import * as ImagePicker from 'expo-image-picker';
import { Image as RNImage } from "react-native";

const { width } = Dimensions.get("window");

export default function AdminCreateCourseScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState("Basic Info");
  const [isSaving, setIsSaving] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCourseInfo, setCreatedCourseInfo] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "0",
    category: "Development",
    status: "Draft (Hidden)",
    thumbnail: "",
    instructorId: ""
  });

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
        setFormData({ ...formData, thumbnail: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert("Error", "Could not access image library");
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await adminApi.getStaff();
      if (isApiSuccess(res.data)) {
        const staff = extractApiData<any[]>(res.data, []);
        setTeachers(staff.filter(s => s.role === 'teacher'));
      }
    } catch (e) {
      console.log("Error fetching teachers", e);
    } finally {
      setIsLoadingTeachers(false);
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
      
      if (previewUri) {
        // Use FormData for image upload
        payload = new FormData();
        payload.append('title', formData.title);
        payload.append('description', formData.description);
        payload.append('price', String(formData.price).replace(/,/g, ''));
        payload.append('category', formData.category);
        payload.append('status', formData.status.includes("Draft") ? "draft" : "active");
        payload.append('modules', JSON.stringify(modules));
        if (formData.instructorId) {
          payload.append('instructor_id', formData.instructorId);
        }
        
        const filename = previewUri.split('/').pop() || 'thumbnail.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpg`;
        
        // @ts-ignore
        payload.append('thumbnail', { uri: previewUri, name: filename, type });
      } else {
        // Regular JSON payload
        payload = {
          ...formData,
          price: Number(String(formData.price).replace(/,/g, '')) || 0,
          status: formData.status.includes("Draft") ? "draft" : "active",
          instructor_id: formData.instructorId || null,
          modules: modules
        };
      }
      
      const res = await coursesApi.create(payload);
      if (isApiSuccess(res.data)) {
        const course = extractApiData<any>(res.data, null);
        const instructor = teachers.find(t => (t.id || t._id) === formData.instructorId);
        
        setCreatedCourseInfo({
          title: course?.title || formData.title,
          instructorName: instructor?.name || "Self"
        });
        
        setShowSuccessModal(true);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to create course");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaWrapper bgWhite>
      {/* Header aligned with screenshot */}
      <View className="px-8 py-6 flex-row items-center justify-between border-b border-slate-50">
        <View className="flex-row items-center">
           <TouchableOpacity 
             onPress={() => navigation.goBack()}
             className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center mr-4"
           >
              <ChevronLeft size={24} color={COLORS.slate900} />
           </TouchableOpacity>
           <View>
              <View className="flex-row items-center gap-2">
                 <Layout size={20} color={COLORS.slate900} />
                 <Text className="text-2xl font-black text-slate-900">New Course</Text>
              </View>
              <Text className="text-slate-400 text-xs font-bold mt-0.5">{" > New Course [new]"}</Text>
           </View>
        </View>
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
                <View className="flex-row items-center mb-3">
                   <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest">Course Title</Text>
                </View>
                <TextInput 
                  className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100 font-bold text-slate-900"
                  value={formData.title}
                  onChangeText={(t) => setFormData({...formData, title: t})}
                  placeholder="New Course"
                />
             </View>

             <View className="flex-row gap-6 mb-8">
                {/* Course Fee */}
                <View className="flex-1">
                   <View className="flex-row items-center mb-3 gap-2">
                      <Text className="text-blue-600 font-black text-xl">₹</Text>
                      <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest">Course Fee (₹)</Text>
                   </View>
                   <TextInput 
                     className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100 font-bold text-slate-900"
                     value={formData.price}
                     onChangeText={(t) => setFormData({...formData, price: t})}
                     keyboardType="numeric"
                   />
                </View>

                {/* Cover Image */}
                <View className="flex-[1.5]">
                   <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest mb-3">Cinematic Thumbnail</Text>
                   <TouchableOpacity 
                     onPress={pickImage}
                     activeOpacity={0.7}
                     className="w-full h-24 bg-blue-50/20 rounded-3xl border-2 border-dashed border-blue-100 items-center justify-center overflow-hidden"
                   >
                      {previewUri ? (
                        <View className="w-full h-full relative">
                           <RNImage source={{ uri: previewUri }} className="w-full h-full" resizeMode="cover" />
                           <View className="absolute inset-0 bg-slate-900/40 items-center justify-center opacity-0 hover:opacity-100">
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
                   <View className="flex-row items-center mb-3 gap-2">
                      <Activity size={14} color="#2563EB" />
                      <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest">Status</Text>
                   </View>
                   <TouchableOpacity 
                     onPress={() => setShowStatusModal(true)}
                     className="bg-white p-6 rounded-2xl border border-blue-100 flex-row items-center justify-between"
                   >
                      <Text className="font-bold text-slate-900">{formData.status}</Text>
                      <ChevronDown size={18} color="#CBD5E1" />
                   </TouchableOpacity>
                </View>

                {/* Assign Teacher */}
                <View className="flex-1">
                   <View className="flex-row items-center mb-3 gap-2">
                      <User size={14} color="#2563EB" />
                      <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest">Assign Teacher</Text>
                   </View>
                   <TouchableOpacity 
                     onPress={() => setShowTeacherModal(true)}
                     className="bg-white p-6 rounded-2xl border border-blue-100 flex-row items-center justify-between"
                   >
                      <Text className={`font-bold ${formData.instructorId ? 'text-slate-900' : 'text-slate-400'}`} numberOfLines={1}>
                        {formData.instructorId ? (teachers.find(t => (t.id || t._id) === formData.instructorId)?.name || 'Instructor') : '-- Select Instructor --'}
                      </Text>
                      <ChevronDown size={18} color="#CBD5E1" />
                   </TouchableOpacity>
                </View>
             </View>

             {/* Description */}
             <View>
                <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest mb-3">Course Description</Text>
                <TextInput 
                  className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100 font-bold text-slate-900 h-40"
                  value={formData.description}
                  onChangeText={(t) => setFormData({...formData, description: t})}
                  placeholder="Detailed description of what students will learn..."
                  multiline
                  textAlignVertical="top"
                />
             </View>

             {/* Bottom Save Action for Basic Info */}
             <TouchableOpacity 
               onPress={handleSave}
               disabled={isSaving}
               className="bg-slate-900 p-8 rounded-[32px] mt-12 flex-row items-center justify-center shadow-2xl shadow-slate-900/20"
             >
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Save size={20} color="white" className="mr-3" />
                    <Text className="text-white font-black text-sm uppercase tracking-widest">Create Course</Text>
                  </>
                )}
             </TouchableOpacity>
          </View>
        ) : (
          <View>
             {/* Curriculum Builder */}
             <View className="flex-row items-center justify-between mb-8">
                <View>
                   <Text className="text-2xl font-black text-slate-900">Course Architect</Text>
                   <Text className="text-slate-400 text-xs font-bold mt-1">Design your learning journey</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setModules([...modules, { title: "New Module", lessons: [] }])}
                  className="bg-slate-900 px-6 py-4 rounded-2xl"
                >
                   <Text className="text-white font-black text-[10px] uppercase tracking-widest">Add Module</Text>
                </TouchableOpacity>
             </View>

             {modules.length === 0 ? (
                <View className="bg-white p-20 rounded-[44px] items-center justify-center border border-slate-50 shadow-sm">
                   <BookOpen size={48} color="#E2E8F0" />
                   <Text className="text-slate-400 font-bold mt-6 text-center">Your curriculum is a blank canvas.{"\n"}Start adding modules to build your course.</Text>
                </View>
             ) : (
                modules.map((mod, mIdx) => (
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
                         {mod.lessons.map((lesson: any, lIdx: number) => (
                           <View key={lIdx} className="bg-slate-50 p-5 rounded-2xl flex-row items-center justify-between border border-slate-100">
                              <View className="flex-1 mr-4">
                                 <TextInput 
                                    className="font-bold text-slate-900 p-0 text-sm"
                                    value={lesson.title}
                                    onChangeText={(t) => {
                                       const next = [...modules];
                                       next[mIdx].lessons[lIdx].title = t;
                                       setModules(next);
                                    }}
                                    placeholder="Lesson Title"
                                 />
                              </View>
                              <TouchableOpacity 
                                onPress={() => {
                                   const next = [...modules];
                                   next[mIdx].lessons.splice(lIdx, 1);
                                   setModules(next);
                                }}
                              >
                                 <X size={14} color="#94A3B8" />
                              </TouchableOpacity>
                           </View>
                         ))}
                         <TouchableOpacity 
                           onPress={() => {
                              const next = [...modules];
                              next[mIdx].lessons.push({ title: "New Lesson", duration: "10:00" });
                              setModules(next);
                           }}
                           className="bg-blue-50/50 p-5 rounded-2xl border border-dashed border-blue-200 items-center justify-center"
                         >
                            <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest">Add Lesson</Text>
                         </TouchableOpacity>
                      </View>
                   </View>
                ))
             )}

             {/* Bottom Save Action */}
             <TouchableOpacity 
               onPress={handleSave}
               disabled={isSaving}
               className="bg-blue-600 p-8 rounded-[32px] mt-12 flex-row items-center justify-center shadow-2xl shadow-blue-600/40"
             >
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Save size={20} color="white" className="mr-3" />
                    <Text className="text-white font-black text-sm uppercase tracking-widest">Deploy Curriculum</Text>
                  </>
                )}
             </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Status Selection Modal */}
      <Modal visible={showStatusModal} transparent animationType="fade">
        <TouchableOpacity className="flex-1 bg-slate-900/50 justify-end" activeOpacity={1} onPress={() => setShowStatusModal(false)}>
           <View className="bg-white rounded-t-[44px] p-8 pb-12">
              <View className="flex-row justify-between items-center mb-8">
                 <Text className="text-slate-900 text-xl font-black">Visibility Status</Text>
                 <TouchableOpacity onPress={() => setShowStatusModal(false)} className="p-3 bg-slate-50 rounded-2xl">
                    <X size={20} color={COLORS.slate900} />
                 </TouchableOpacity>
              </View>
              {['Draft (Hidden)', 'Active (Public)'].map((status) => (
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

      {/* Teacher Selection Modal */}
      <Modal visible={showTeacherModal} transparent animationType="fade">
        <TouchableOpacity className="flex-1 bg-slate-900/50 justify-end" activeOpacity={1} onPress={() => setShowTeacherModal(false)}>
           <View className="bg-white rounded-t-[44px] p-8 pb-12 h-[60%]">
              <View className="flex-row justify-between items-center mb-8">
                 <Text className="text-slate-900 text-xl font-black">Assign Instructor</Text>
                 <TouchableOpacity onPress={() => setShowTeacherModal(false)} className="p-3 bg-slate-50 rounded-2xl">
                    <X size={20} color={COLORS.slate900} />
                 </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {teachers.length === 0 ? (
                  <Text className="text-center text-slate-400 font-bold py-10">No instructors found</Text>
                ) : (
                  teachers.map((teacher) => (
                    <TouchableOpacity 
                      key={teacher.id || teacher._id}
                      onPress={() => { setFormData({...formData, instructorId: teacher.id || teacher._id}); setShowTeacherModal(false); }}
                      className={`p-6 rounded-[28px] mb-4 flex-row items-center justify-between ${formData.instructorId === (teacher.id || teacher._id) ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50 border border-slate-50'}`}
                    >
                       <View className="flex-row items-center">
                          <View className="w-10 h-10 rounded-xl bg-white items-center justify-center mr-4">
                             <User size={18} color={COLORS.slate400} />
                          </View>
                          <View>
                            <Text className={`font-black ${formData.instructorId === (teacher.id || teacher._id) ? 'text-blue-600' : 'text-slate-900'}`}>{teacher.name}</Text>
                            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{teacher.email}</Text>
                          </View>
                       </View>
                       {formData.instructorId === (teacher.id || teacher._id) && <Check size={20} color={COLORS.primary} />}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
           </View>
        </TouchableOpacity>
      </Modal>
      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="slide">
        <View className="flex-1 bg-slate-900/60 items-center justify-center px-8">
           <View className="bg-white w-full rounded-[48px] p-10 items-center shadow-2xl">
              <View className="w-24 h-24 bg-emerald-50 rounded-full items-center justify-center mb-8">
                 <Check size={48} color="#10B981" />
              </View>
              
              <Text className="text-2xl font-black text-slate-900 text-center mb-2">Course Published!</Text>
              <Text className="text-slate-400 font-bold text-center mb-8 px-4">
                 "{createdCourseInfo?.title}" is now live and a notification has been dispatched to {createdCourseInfo?.instructorName}.
              </Text>
              
              <TouchableOpacity 
                onPress={() => { setShowSuccessModal(false); navigation.goBack(); }}
                className="bg-slate-900 w-full py-6 rounded-[28px] items-center shadow-xl shadow-slate-900/20"
              >
                 <Text className="text-white font-black text-sm uppercase tracking-widest">Return to Dashboard</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
