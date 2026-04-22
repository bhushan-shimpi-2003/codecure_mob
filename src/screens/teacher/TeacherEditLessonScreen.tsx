import React, { useState, useEffect } from "react";
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
  Trash2,
} from "lucide-react-native";
import { lessonsApi } from "../../api/endpoints";
import { isApiSuccess } from "../../api/response";

export default function TeacherEditLessonScreen({ navigation, route }: any) {
  const { lesson, courseId } = route.params || {};
  const { width } = useWindowDimensions();
  
  const [title, setTitle] = useState(lesson?.title || "");
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url || lesson?.youtube_url || "");
  const [notes, setNotes] = useState(lesson?.content || "");
  const [duration, setDuration] = useState(lesson?.duration || "45");
  const [isVisible, setIsVisible] = useState(lesson?.status === "published");
  const [category, setCategory] = useState(lesson?.category || "FRONTEND");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateLesson = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Lesson title is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        video_url: videoUrl.trim(),
        content: notes.trim(),
        duration: duration.trim(),
        category: category,
        status: isVisible ? "published" : "draft",
      };

      const res = await lessonsApi.update(lesson.id || lesson._id, payload);
      if (isApiSuccess(res.data)) {
        Alert.alert("Success", "Lesson updated successfully", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert("Error", "Failed to update lesson");
      }
    } catch (e) {
      console.log("Error updating lesson", e);
      Alert.alert("Error", "Something went wrong while saving");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLesson = async () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to permanently delete this lesson? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            setIsDeleting(true);
            try {
              const res = await lessonsApi.delete(lesson.id || lesson._id);
              if (isApiSuccess(res.data)) {
                navigation.goBack();
              } else {
                Alert.alert("Error", "Failed to delete lesson");
              }
            } catch (e) {
              console.log("Error deleting lesson", e);
              Alert.alert("Error", "Something went wrong while deleting");
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaWrapper>
      <AppHeader navigation={navigation} role="Teacher" />
      <ScrollView className="flex-1 bg-[#F8FAFC]" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-6">
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center">
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">INSTRUCTOR</Text>
              <ChevronLeft size={12} color="#94A3B8" className="mx-2" />
              <Text className="text-[10px] font-black text-blue-600 uppercase tracking-wider">EDIT LESSON</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleDeleteLesson} 
              disabled={isDeleting}
              className="w-10 h-10 rounded-2xl bg-rose-50 items-center justify-center border border-rose-100"
            >
              {isDeleting ? <ActivityIndicator size="small" color="#E11D48" /> : <Trash2 size={18} color="#E11D48" />}
            </TouchableOpacity>
          </View>

          <Text className="text-3xl font-black text-slate-900 mb-2">Refine Curriculum</Text>
          <Text className="text-slate-500 text-sm leading-5 mb-10">
            Update lesson details, adjust duration, or change visibility for your students.
          </Text>

          {/* Form Card */}
          <View className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-50 mb-8">
            <View className="mb-8">
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 ml-1">LESSON TITLE</Text>
              <TextInput
                placeholder="e.g. Master the Debugger"
                className="bg-slate-50 rounded-2xl px-5 py-4 text-slate-900 text-base font-black"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View className="mb-8">
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 ml-1">VIDEO URL / LINK</Text>
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
                placeholder="Share key takeaways, links to source code..."
                className="bg-slate-50 rounded-2xl px-5 py-5 text-slate-900 text-sm h-40"
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
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 ml-1">DURATION (MM:SS)</Text>
                <View className="bg-slate-50 rounded-2xl px-5 py-4 flex-row items-center">
                   <Clock size={18} color="#94A3B8" />
                   <TextInput 
                     placeholder="e.g. 15:45"
                     className="flex-1 ml-3 text-slate-900 text-base"
                     placeholderTextColor="#94A3B8"
                     value={duration}
                     onChangeText={setDuration}
                   />
                </View>
             </View>

             <View>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4 ml-1">CATEGORY</Text>
                <View className="flex-row flex-wrap gap-2">
                   {["FRONTEND", "BACKEND", "UI DESIGN", "LOGIC"].map((cat) => (
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

          {/* Save Button */}
          <View className="bg-blue-600 rounded-[40px] p-8 shadow-xl shadow-blue-200 mb-8">
             <View className="flex-row items-center justify-between mb-8">
                <View>
                   <Text className="text-white text-base font-black">Visibility Status</Text>
                   <Text className="text-blue-100 text-[11px] font-bold mt-0.5">Published and active</Text>
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
               onPress={handleUpdateLesson}
               disabled={isSubmitting}
             >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <>
                    <Save size={18} color="#2563EB" className="mr-2" />
                    <Text className="text-blue-600 font-black text-base">Update Lesson</Text>
                  </>
                )}
             </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
