import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { AppHeader } from "../../components/AppHeader";
import {
  Code,
  FileText,
  Award,
  Send,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  Clock,
  Layers,
  CheckCircle2
} from "lucide-react-native";
import { assignmentsApi, notificationsApi } from "../../api/endpoints";
import { isApiSuccess } from "../../api/response";
import { LinearGradient } from "expo-linear-gradient";

export default function TeacherReviewSubmissionScreen({ navigation, route }: any) {
  const { submission } = route.params || {};
  const student = submission?.profiles || {};
  
  const [score, setScore] = useState(String(submission?.score ?? ""));
  const [comments, setComments] = useState(submission?.feedback || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleGrade = async () => {
    if (!score.trim()) {
      Alert.alert("Error", "Please provide a score.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await assignmentsApi.gradeSubmission(submission.id || submission._id, {
        score: parseInt(score),
        feedback: comments.trim(),
      });
      if (isApiSuccess(res.data)) {
        Alert.alert("Success", "Submission graded successfully", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);

        notificationsApi.send({
          user_id: student.id || student._id,
          title: 'Assignment Graded!',
          message: `Your submission has been reviewed. Score: ${score}/100. Feedback: ${comments.trim().substring(0, 50)}...`,
          type: 'assignment'
        });
      }
    } catch (e) {
      Alert.alert("Error", "Failed to submit grade");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
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
                 <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Back to List</Text>
                 <Text className="text-slate-900 text-sm font-black tracking-tight">Review Queue</Text>
              </View>
           </TouchableOpacity>

           {/* Header Section */}
           <View className="mb-10">
              <View className="flex-row items-center gap-2 mb-3">
                 <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-blue-700 text-[10px] font-black uppercase tracking-widest">Evaluation Desk</Text>
                 </View>
                 <Sparkles size={14} color="#3B82F6" />
              </View>
              <Text className="text-[40px] font-black text-slate-900 leading-[44px] tracking-tight">
                 Review <Text className="text-blue-600">Console</Text>
              </Text>
           </View>

           {/* Student Profile Card */}
           <View className="bg-white rounded-[44px] p-8 border border-white shadow-2xl shadow-slate-900/[0.04] mb-12">
              <View className="flex-row items-center justify-between mb-8">
                 <View className="flex-row items-center">
                    <View className="relative">
                       <Image 
                         source={{ uri: student.avatar_url || `https://ui-avatars.com/api/?name=${student.name || 'S'}&background=random` }}
                         className="w-20 h-20 rounded-[32px] bg-slate-50 border-4 border-slate-50"
                       />
                       <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full items-center justify-center border-4 border-white">
                          <CheckCircle2 size={10} color="white" />
                       </View>
                    </View>
                    <View className="ml-6">
                       <Text className="text-2xl font-black text-slate-900 tracking-tight">{student.name || "Student"}</Text>
                       <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Awaiting Review</Text>
                    </View>
                 </View>
                 <View className="bg-slate-50 p-4 rounded-3xl items-center border border-slate-100">
                    <Clock size={16} color="#64748B" />
                    <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">2h ago</Text>
                 </View>
              </View>

              {/* Submission Note */}
              <View className="bg-slate-50 rounded-[36px] p-8 border border-slate-100/50">
                 <Text className="text-sm text-slate-600 leading-6 font-bold italic">
                    "{submission?.comment || "I focused on implementing advanced logic patterns. Looking forward to your feedback!"}"
                 </Text>
              </View>
           </View>

           {/* Assets Section */}
           <View className="mb-12">
              <View className="flex-row items-center justify-between mb-6">
                 <Text className="text-xl font-black text-slate-900">Submission Assets</Text>
                 <Layers size={18} color="#94A3B8" />
              </View>
              <View className="gap-4">
                 <TouchableOpacity 
                   activeOpacity={0.8}
                   className="bg-white rounded-[32px] p-6 border border-white shadow-xl shadow-slate-900/[0.02] flex-row items-center"
                 >
                    <View className="w-14 h-14 rounded-2xl bg-slate-900 items-center justify-center mr-5 shadow-lg shadow-slate-200">
                       <Code size={24} color="white" />
                    </View>
                    <View className="flex-1">
                       <Text className="text-base font-black text-slate-900">GitHub Repository</Text>
                       <Text className="text-slate-400 text-[11px] font-bold mt-0.5" numberOfLines={1}>{submission?.submission_url || "github.com/codecure/mastery-task"}</Text>
                    </View>
                    <ExternalLink size={18} color="#94A3B8" />
                 </TouchableOpacity>

                 <TouchableOpacity 
                   activeOpacity={0.8}
                   className="bg-white rounded-[32px] p-6 border border-white shadow-xl shadow-slate-900/[0.02] flex-row items-center"
                 >
                    <View className="w-14 h-14 rounded-2xl bg-blue-600 items-center justify-center mr-5 shadow-lg shadow-blue-100">
                       <FileText size={24} color="white" />
                    </View>
                    <View className="flex-1">
                       <Text className="text-base font-black text-slate-900">Project Documentation</Text>
                       <Text className="text-slate-400 text-[11px] font-bold mt-0.5">Asset Hub • PDF Documentation</Text>
                    </View>
                    <ExternalLink size={18} color="#94A3B8" />
                 </TouchableOpacity>
              </View>
           </View>

           {/* Evaluation Section */}
           <View className="bg-white rounded-[56px] p-10 border border-white shadow-2xl shadow-slate-900/[0.05] mb-12">
              <View className="flex-row items-center gap-3 mb-10">
                 <View className="w-12 h-12 rounded-2xl bg-blue-50 items-center justify-center">
                    <Award size={24} color="#2563EB" />
                 </View>
                 <Text className="text-2xl font-black text-slate-900 tracking-tight">Grade Submission</Text>
              </View>
              
              <View className="mb-10">
                 <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Numerical Score (0-100)</Text>
                 <View className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 flex-row items-center justify-center">
                   <TextInput 
                     placeholder="95"
                     className="text-5xl font-black text-slate-900 text-center w-24"
                     placeholderTextColor="#CBD5E1"
                     keyboardType="numeric"
                     value={score}
                     onChangeText={setScore}
                   />
                   <Text className="text-slate-300 text-3xl font-black ml-3">/ 100</Text>
                 </View>
              </View>

              <View className="mb-10">
                 <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Instructor Feedback</Text>
                 <TextInput 
                   placeholder="Share detailed technical critiques..."
                   className="bg-slate-50 border border-slate-100 rounded-[40px] p-8 text-slate-900 text-sm font-bold h-48"
                   placeholderTextColor="#CBD5E1"
                   multiline
                   textAlignVertical="top"
                   value={comments}
                   onChangeText={setComments}
                 />
              </View>

              <View className="mb-12">
                 <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Proficiency Tags</Text>
                 <View className="flex-row flex-wrap gap-3">
                    {["CLEAN CODE", "NEEDS OPTIMIZATION", "EXCELLENT DOCS", "LOGIC ERROR"].map(tag => (
                       <TouchableOpacity 
                         key={tag} 
                         activeOpacity={0.8}
                         onPress={() => toggleTag(tag)}
                         className={`px-6 py-3.5 rounded-2xl border-2 ${selectedTags.includes(tag) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-100'}`}
                       >
                          <Text className={`text-[10px] font-black uppercase tracking-widest ${selectedTags.includes(tag) ? 'text-white' : 'text-slate-400'}`}>
                            {tag}
                          </Text>
                       </TouchableOpacity>
                    ))}
                 </View>
              </View>

              <TouchableOpacity 
                 onPress={handleGrade}
                 disabled={isSubmitting}
                 activeOpacity={0.8}
                 className="overflow-hidden rounded-[32px] shadow-xl shadow-blue-200"
              >
                 <LinearGradient
                   colors={['#1E293B', '#0F172A']}
                   className="py-7 flex-row items-center justify-center gap-4"
                 >
                    {isSubmitting ? (
                       <ActivityIndicator size="small" color="white" />
                    ) : (
                       <>
                          <Text className="text-white font-black text-base uppercase tracking-widest">Publish Grade</Text>
                          <Send size={20} color="white" />
                       </>
                    )}
                 </LinearGradient>
              </TouchableOpacity>
           </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
