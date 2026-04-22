import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { AppHeader } from "../../components/AppHeader";
import { COLORS } from "../../utils/theme";
import {
  ChevronLeft,
  FileUp,
  Link,
  Clock,
  Layout,
  Save,
} from "lucide-react-native";
import { lessonsApi } from "../../api/endpoints";
import { isApiSuccess } from "../../api/response";

export default function TeacherCreateLessonScreen({ navigation, route }: any) {
  const { courseId } = route.params || {};
  const { width } = useWindowDimensions();
  
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState("45");
  const [isVisible, setIsVisible] = useState(true);
  const [category, setCategory] = useState("FRONTEND");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveLesson = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Lesson title is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        course_id: courseId,
        video_url: videoUrl.trim(),
        content: notes.trim(),
        duration: duration.trim(),
        category: category,
        status: isVisible ? "published" : "draft",
      };

      const res = await lessonsApi.create(payload);
      if (isApiSuccess(res.data)) {
        Alert.alert("Success", "Lesson created successfully", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert("Error", "Failed to create lesson");
      }
    } catch (e) {
      console.log("Error creating lesson", e);
      Alert.alert("Error", "Something went wrong while saving");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <AppHeader navigation={navigation} role="Teacher" />
      <ScrollView className="flex-1 bg-[#F8FAFC]" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center">
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">INSTRUCTOR</Text>
              <ChevronLeft size={12} color="#94A3B8" className="mx-2" />
              <Text className="text-[10px] font-black text-blue-600 uppercase tracking-wider">UPLOAD LESSON</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-3xl font-black text-slate-900 mb-2">Create Video Lesson</Text>
          <Text className="text-slate-500 text-sm leading-5 mb-10">
            Design an engaging learning experience for your students.
          </Text>

          {/* Form Card */}
          <View className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-50 mb-8">
            <View className="mb-8">
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 ml-1">LESSON TITLE</Text>
              <TextInput
                placeholder="e.g. Mastering Tailwind CSS Layouts"
                className="bg-slate-50 rounded-2xl px-5 py-4 text-slate-900 text-base"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View className="mb-8">
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 ml-1">VIDEO CONTENT</Text>
              <TouchableOpacity className="border-2 border-dashed border-slate-200 rounded-[32px] p-10 items-center justify-center bg-slate-50/50">
                 <View className="w-14 h-14 rounded-2xl bg-blue-100 items-center justify-center mb-4">
                    <FileUp size={24} color="#2563EB" />
                 </View>
                 <Text className="text-base font-black text-slate-900 text-center mb-1">Click to upload or drag and drop</Text>
                 <Text className="text-slate-400 text-xs font-medium text-center">MP4, MOV or MKV (Max 2GB)</Text>
              </TouchableOpacity>
              
              <View className="flex-row items-center my-6">
                 <View className="flex-1 h-[1px] bg-slate-100" />
                 <Text className="text-[9px] font-black text-slate-400 px-4 uppercase tracking-widest">OR PROVIDE URL</Text>
                 <View className="flex-1 h-[1px] bg-slate-100" />
              </View>

              <View className="bg-slate-50 rounded-2xl px-5 py-4 flex-row items-center">
                 <Link size={18} color="#94A3B8" />
                 <TextInput 
                   placeholder="YouTube, Vimeo or S3 URL"
                   className="flex-1 ml-3 text-slate-900 text-base"
                   placeholderTextColor="#94A3B8"
                   value={videoUrl}
                   onChangeText={setVideoUrl}
                 />
              </View>
            </View>

            <View>
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 ml-1">LESSON NOTES & RESOURCES</Text>
              <TextInput
                placeholder="Share key takeaways, links to source code, or additional reading material..."
                className="bg-slate-50 rounded-2xl px-5 py-5 text-slate-900 text-base h-40"
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>

          {/* Metadata Card */}
          <View className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-50 mb-8">
             <View className="mb-8">
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 ml-1">DURATION (MINUTES)</Text>
                <View className="bg-slate-50 rounded-2xl px-5 py-4 flex-row items-center">
                   <Clock size={18} color="#94A3B8" />
                   <TextInput 
                     placeholder="45"
                     className="flex-1 ml-3 text-slate-900 text-base"
                     placeholderTextColor="#94A3B8"
                     keyboardType="numeric"
                     value={duration}
                     onChangeText={setDuration}
                   />
                </View>
             </View>

             <View>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4 ml-1">LESSON CATEGORY</Text>
                <View className="flex-row flex-wrap gap-2">
                   {["FRONTEND", "BACKEND", "UI DESIGN"].map((cat) => (
                      <TouchableOpacity 
                        key={cat}
                        onPress={() => setCategory(cat)}
                        className={`px-6 py-3 rounded-2xl ${category === cat ? 'bg-blue-100' : 'bg-slate-100'}`}
                      >
                         <Text className={`text-[10px] font-black uppercase tracking-wider ${category === cat ? 'text-blue-600' : 'text-slate-500'}`}>
                           {cat}
                         </Text>
                      </TouchableOpacity>
                   ))}
                </View>
             </View>
          </View>

          {/* Publish Settings */}
          <View className="bg-blue-600 rounded-[40px] p-8 shadow-xl shadow-blue-200 mb-8">
             <View className="flex-row items-center justify-between mb-8">
                <View>
                   <Text className="text-white text-base font-black">Publish Settings</Text>
                   <Text className="text-blue-100 text-[11px] font-bold mt-0.5">Visible to students</Text>
                </View>
                <Switch 
                  value={isVisible}
                  onValueChange={setIsVisible}
                  trackColor={{ false: "#3B82F6", true: "#ffffff" }}
                  thumbColor={isVisible ? "#2563EB" : "#f4f3f4"}
                />
             </View>

             <TouchableOpacity 
               className="bg-white rounded-3xl py-5 items-center flex-row justify-center"
               onPress={handleSaveLesson}
               disabled={isSubmitting}
             >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <Text className="text-blue-600 font-black text-base">Save Lesson</Text>
                )}
             </TouchableOpacity>
             
             <Text className="text-blue-100 text-[8px] font-black uppercase text-center mt-4 tracking-widest">
               AUTO-SAVES TO DRAFTS EVERY 2 MINS
             </Text>
          </View>
          
          {/* Bottom Illustration placeholder */}
          <View className="h-40 bg-slate-900 rounded-[40px] overflow-hidden">
             <View className="absolute bottom-0 left-0 right-0 h-20 bg-blue-400 opacity-20" style={{ transform: [{ skewY: '-5deg' }, { translateY: 20 }] }} />
             <View className="absolute bottom-0 left-0 right-0 h-16 bg-blue-300 opacity-20" style={{ transform: [{ skewY: '8deg' }, { translateY: 10 }] }} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
