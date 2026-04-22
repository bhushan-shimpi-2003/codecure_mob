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
import { COLORS } from "../../utils/theme";
import {
  ChevronLeft,
  Code,
  FileText,
  MessageSquare,
  Award,
  Send,
  ExternalLink,
} from "lucide-react-native";
import { assignmentsApi } from "../../api/endpoints";
import { isApiSuccess } from "../../api/response";

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
    <SafeAreaWrapper>
      <AppHeader navigation={navigation} role="Teacher" />
      <ScrollView className="flex-1 bg-[#F8FAFC]" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center">
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SUBMISSIONS</Text>
              <ChevronLeft size={10} color="#94A3B8" className="mx-2" />
              <Text className="text-[10px] font-black text-blue-600 uppercase tracking-widest">REVIEW</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-3xl font-black text-slate-900 mb-6 leading-9">Evaluation Console</Text>

          {/* Student Profile Card */}
          <View className="bg-white rounded-[40px] p-6 shadow-sm border border-slate-50 mb-8 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Image 
                source={{ uri: student.avatar_url || `https://ui-avatars.com/api/?name=${student.name || 'S'}` }}
                className="w-16 h-16 rounded-3xl"
              />
              <View className="ml-4">
                <Text className="text-lg font-black text-slate-900">{student.name || "Student Name"}</Text>
                <Text className="text-slate-400 text-xs font-bold mt-0.5">Submitted 2 hours ago</Text>
              </View>
            </View>
            <View className="bg-blue-50 px-4 py-2 rounded-2xl">
               <Text className="text-blue-600 text-[10px] font-black uppercase">IN REVIEW</Text>
            </View>
          </View>

          {/* Submission Assets */}
          <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-4 ml-1">SUBMISSION ASSETS</Text>
          <View className="gap-3 mb-8">
            <TouchableOpacity className="bg-white rounded-3xl p-5 border border-slate-50 shadow-sm flex-row items-center">
              <View className="w-10 h-10 rounded-2xl bg-slate-900 items-center justify-center mr-4">
                 <Code size={20} color="white" />
              </View>
              <View className="flex-1">
                 <Text className="text-sm font-black text-slate-900">GitHub Repository</Text>
                 <Text className="text-slate-400 text-[10px] font-medium" numberOfLines={1}>{submission?.submission_url || "github.com/student/mastery-task"}</Text>
              </View>
              <ExternalLink size={14} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity className="bg-white rounded-3xl p-5 border border-slate-50 shadow-sm flex-row items-center">
              <View className="w-10 h-10 rounded-2xl bg-blue-600 items-center justify-center mr-4">
                 <FileText size={20} color="white" />
              </View>
              <View className="flex-1">
                 <Text className="text-sm font-black text-slate-900">Project Documentation</Text>
                 <Text className="text-slate-400 text-[10px] font-medium">Google Drive • PDF</Text>
              </View>
              <ExternalLink size={14} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Submission Note */}
          <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-4 ml-1">SUBMISSION NOTE</Text>
          <View className="bg-white rounded-[32px] p-7 shadow-sm border border-slate-50 mb-8">
             <Text className="text-slate-500 text-sm leading-6">
                "{submission?.comment || "I focused on implementing useMemo and useCallback for the data filtering logic. I also added a virtualized list component to handle the 10k+ rows efficiently. Looking forward to your feedback on the memoization patterns!"}"
             </Text>
          </View>

          {/* Evaluate Card */}
          <View className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-50">
             <Text className="text-xl font-black text-slate-900 mb-6">Evaluate Submission</Text>
             
             <View className="mb-8">
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">SCORE (0-100)</Text>
                <View className="bg-slate-50 rounded-2xl p-6 flex-row items-center justify-center">
                  <TextInput 
                    placeholder="95"
                    className="text-3xl font-black text-slate-900 text-center w-20"
                    placeholderTextColor="#CBD5E1"
                    keyboardType="numeric"
                    value={score}
                    onChangeText={setScore}
                  />
                  <Text className="text-slate-300 text-xl font-bold ml-2">/ 100</Text>
                </View>
             </View>

             <View className="mb-8">
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">TEACHER COMMENTS</Text>
                <TextInput 
                  placeholder="Write detailed feedback for the student..."
                  className="bg-slate-50 rounded-3xl p-6 text-slate-900 text-sm h-40"
                  placeholderTextColor="#94A3B8"
                  multiline
                  textAlignVertical="top"
                  value={comments}
                  onChangeText={setComments}
                />
             </View>

             <View className="mb-10">
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 ml-1">QUICK TAGS</Text>
                <View className="flex-row flex-wrap gap-2">
                   {["CLEAN CODE", "NEEDS OPTIMIZATION", "EXCELLENT DOCS", "LOGIC ERROR"].map(tag => (
                      <TouchableOpacity 
                        key={tag} 
                        onPress={() => toggleTag(tag)}
                        className={`px-4 py-2.5 rounded-2xl ${selectedTags.includes(tag) ? 'bg-blue-600' : 'bg-slate-100'}`}
                      >
                         <Text className={`text-[9px] font-black uppercase ${selectedTags.includes(tag) ? 'text-white' : 'text-slate-500'}`}>
                           {tag}
                         </Text>
                      </TouchableOpacity>
                   ))}
                </View>
             </View>

             <TouchableOpacity 
                onPress={handleGrade}
                disabled={isSubmitting}
                className="bg-blue-600 rounded-[28px] py-6 flex-row items-center justify-center shadow-lg shadow-blue-200"
             >
                {isSubmitting ? (
                   <ActivityIndicator size="small" color="white" />
                ) : (
                   <>
                      <Text className="text-white font-black text-base mr-2">Submit Grade</Text>
                      <Send size={18} color="white" />
                   </>
                )}
             </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
