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
import {
  FileUp,
  Link,
  Clock,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Shield,
  Layers,
  CheckCircle2
} from "lucide-react-native";
import { lessonsApi } from "../../api/endpoints";
import { isApiSuccess } from "../../api/response";
import { LinearGradient } from "expo-linear-gradient";

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
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} role="Teacher" />
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
                 <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Back to Management</Text>
                 <Text className="text-slate-900 text-sm font-black tracking-tight">Curriculum Lab</Text>
              </View>
           </TouchableOpacity>

           {/* Header Section */}
           <View className="mb-10">
              <View className="flex-row items-center gap-2 mb-3">
                 <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-blue-700 text-[10px] font-black uppercase tracking-widest">Resource Creator</Text>
                 </View>
                 <Sparkles size={14} color="#3B82F6" />
              </View>
              <Text className="text-[40px] font-black text-slate-900 leading-[44px] tracking-tight">
                 Create Video <Text className="text-blue-600">Lesson</Text>
              </Text>
              <Text className="text-slate-400 text-base font-bold mt-2">Design an engaging learning experience for your students.</Text>
           </View>

           {/* Core Details Card */}
           <View className="bg-white rounded-[44px] p-8 border border-white shadow-2xl shadow-slate-900/[0.04] mb-8">
              <View className="mb-10">
                 <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Lesson Identity</Text>
                 <TextInput
                   placeholder="e.g. Mastering Advanced React Hooks"
                   className="bg-slate-50 border border-slate-100 rounded-3xl px-6 py-5 text-slate-900 text-base font-black shadow-inner"
                   placeholderTextColor="#CBD5E1"
                   value={title}
                   onChangeText={setTitle}
                 />
              </View>

              <View className="mb-10">
                 <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Video Asset</Text>
                 <TouchableOpacity 
                   activeOpacity={0.8}
                   className="border-2 border-dashed border-slate-100 rounded-[36px] p-10 items-center justify-center bg-slate-50/50"
                 >
                    <View className="w-16 h-16 rounded-2xl bg-blue-50 items-center justify-center mb-4 shadow-sm">
                       <FileUp size={28} color="#2563EB" />
                    </View>
                    <Text className="text-base font-black text-slate-900 text-center mb-1">Click to stream asset</Text>
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest text-center">MP4, MOV (Max 2GB)</Text>
                 </TouchableOpacity>
                 
                 <View className="flex-row items-center my-8">
                    <View className="flex-1 h-[1px] bg-slate-100" />
                    <Text className="text-[9px] font-black text-slate-300 px-4 uppercase tracking-[2px]">OR PROVIDE URL</Text>
                    <View className="flex-1 h-[1px] bg-slate-100" />
                 </View>

                 <View className="bg-white border border-slate-100 rounded-2xl px-6 py-5 flex-row items-center shadow-sm">
                    <Link size={18} color="#2563EB" />
                    <TextInput 
                      placeholder="YouTube, Vimeo or S3 URL"
                      className="flex-1 ml-4 text-slate-900 text-sm font-black"
                      placeholderTextColor="#CBD5E1"
                      value={videoUrl}
                      onChangeText={setVideoUrl}
                    />
                 </View>
              </View>

              <View>
                 <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Resource Brief & Notes</Text>
                 <TextInput
                   placeholder="Share key takeaways, source code, or reading material..."
                   className="bg-slate-50 border border-slate-100 rounded-[36px] px-8 py-8 text-slate-900 text-sm font-bold h-48 shadow-inner"
                   placeholderTextColor="#CBD5E1"
                   multiline
                   textAlignVertical="top"
                   value={notes}
                   onChangeText={setNotes}
                 />
              </View>
           </View>

           {/* Metadata & Categories Card */}
           <View className="bg-white rounded-[44px] p-8 border border-white shadow-2xl shadow-slate-900/[0.04] mb-8">
              <View className="mb-10">
                 <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Duration Allocation</Text>
                 <View className="bg-slate-50 border border-slate-100 rounded-3xl px-6 py-5 flex-row items-center">
                    <Clock size={20} color="#2563EB" />
                    <TextInput 
                      placeholder="45"
                      className="flex-1 ml-4 text-slate-900 text-base font-black"
                      placeholderTextColor="#CBD5E1"
                      keyboardType="numeric"
                      value={duration}
                      onChangeText={setDuration}
                    />
                    <Text className="text-slate-400 font-black text-xs uppercase tracking-widest">Minutes</Text>
                 </View>
              </View>

              <View>
                 <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Subject Category</Text>
                 <View className="flex-row flex-wrap gap-3">
                    {["FRONTEND", "BACKEND", "UI DESIGN"].map((cat) => (
                       <TouchableOpacity 
                         key={cat}
                         activeOpacity={0.8}
                         onPress={() => setCategory(cat)}
                         className={`px-6 py-4 rounded-2xl border-2 ${category === cat ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-100'}`}
                       >
                          <Text className={`text-[10px] font-black uppercase tracking-widest ${category === cat ? 'text-white' : 'text-slate-400'}`}>
                            {cat}
                          </Text>
                       </TouchableOpacity>
                    ))}
                 </View>
              </View>
           </View>

           {/* Visibility & Actions */}
           <View className="bg-slate-900 rounded-[48px] p-10 shadow-2xl shadow-slate-900/20 mb-8 overflow-hidden">
              <View className="flex-row items-center justify-between mb-10">
                 <View className="flex-row items-center gap-4">
                    <View className="w-12 h-12 rounded-2xl bg-white/10 items-center justify-center">
                       <Shield size={22} color="white" />
                    </View>
                    <View>
                       <Text className="text-white text-lg font-black tracking-tight">Public Release</Text>
                       <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Visible to all students</Text>
                    </View>
                 </View>
                 <Switch 
                   value={isVisible}
                   onValueChange={setIsVisible}
                   trackColor={{ false: "#1e293b", true: "#2563eb" }}
                   thumbColor={isVisible ? "#ffffff" : "#64748b"}
                 />
              </View>

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleSaveLesson}
                disabled={isSubmitting}
                className="overflow-hidden rounded-[32px] shadow-xl shadow-slate-900"
              >
                 <LinearGradient
                   colors={['#ffffff', '#f8fafc']}
                   className="py-6 flex-row items-center justify-center gap-4"
                 >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#2563EB" />
                    ) : (
                      <>
                         <Text className="text-slate-900 font-black text-sm uppercase tracking-widest">Publish Academy Resource</Text>
                         <ArrowRight size={20} color="#2563EB" />
                      </>
                    )}
                 </LinearGradient>
              </TouchableOpacity>
              
              <View className="flex-row items-center justify-center mt-6 gap-2">
                 <CheckCircle2 size={12} color="#94A3B8" />
                 <Text className="text-slate-500 text-[9px] font-black uppercase tracking-[2px]">Auto-saved to cloud sync</Text>
              </View>
           </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
