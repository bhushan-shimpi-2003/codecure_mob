import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { doubtsApi, notificationsApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { 
  MessageSquare, 
  CheckCircle2, 
  Video, 
  Paperclip, 
  Play, 
  ArrowRight,
  Clock,
  ChevronRight,
  Sparkles,
  Layers,
  Send
} from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";
import { LinearGradient } from "expo-linear-gradient";

export default function TeacherDoubtsScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const [doubts, setDoubts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [activeReplyText, setActiveReplyText] = useState("");
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved'>('pending');

  const fetchData = async () => {
    try {
      const res = await doubtsApi.teacherDoubts();
      if (isApiSuccess(res.data)) {
        setDoubts(extractApiData<any[]>(res.data, []));
      }
    } catch (e) {
      console.log("Error fetching doubts", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleResolve = async (id: string) => {
    if (!activeReplyText.trim()) {
      Alert.alert("Error", "Please enter a response.");
      return;
    }

    try {
      const res = await doubtsApi.resolve(id, activeReplyText.trim());
      if (isApiSuccess(res.data)) {
        Alert.alert("Success", "Query resolved successfully.");
        
        // Notify Student
        const doubt = doubts.find(d => (d.id || d._id) === id);
        const student = doubt?.profiles || doubt?.student;
        if (student) {
          notificationsApi.send({
            user_id: student.id || student._id,
            title: 'Doubt Resolved!',
            message: `Your instructor responded to your query: ${activeReplyText.substring(0, 50)}...`,
            type: 'resolution'
          });
        }

        setActiveReplyText("");
        setReplyingToId(null);
        fetchData();
      }
    } catch (e) {
      Alert.alert("Error", "Failed to resolve query.");
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredDoubts = useMemo(() => {
    return doubts.filter(d => {
      const isResolved = !!d.reply;
      return activeTab === 'pending' ? !isResolved : isResolved;
    });
  }, [doubts, activeTab]);

  const stats = {
    pending: doubts.filter(d => !d.reply).length,
    resolved: doubts.filter(d => !!d.reply).length
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaWrapper bgWhite>
        <AppHeader navigation={navigation} role="Teacher" />
        <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-6">Syncing Queries...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} role="Teacher" />
      <ScrollView 
        className="flex-1 bg-[#F8FAFC]" 
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#2563EB" />
        }
      >
        <View className="px-6 pt-10">
           {/* Header Section */}
           <View className="mb-10">
              <View className="flex-row items-center gap-2 mb-3">
                 <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-blue-700 text-[10px] font-black uppercase tracking-widest">Support Portal</Text>
                 </View>
                 <Sparkles size={14} color="#3B82F6" />
              </View>
              <Text className="text-[40px] font-black text-slate-900 leading-[44px] tracking-tight">
                 Student <Text className="text-blue-600">Doubts</Text>
              </Text>
              <Text className="text-slate-400 text-base font-bold mt-2">Clarify concepts and guide student logic.</Text>
           </View>

           {/* Stats Grid */}
           <View className="flex-row justify-between mb-10">
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => setActiveTab('pending')}
                className={`w-[48%] p-6 rounded-[36px] border-2 ${activeTab === 'pending' ? 'bg-white border-blue-50 shadow-2xl shadow-slate-900/[0.03]' : 'bg-slate-50/50 border-transparent'}`}
              >
                 <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-4 ${activeTab === 'pending' ? 'bg-blue-600 shadow-lg shadow-blue-200' : 'bg-slate-200'}`}>
                    <Clock size={20} color="white" />
                 </View>
                 <Text className={`text-3xl font-black ${activeTab === 'pending' ? 'text-slate-900' : 'text-slate-400'}`}>{stats.pending}</Text>
                 <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Pending</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => setActiveTab('resolved')}
                className={`w-[48%] p-6 rounded-[36px] border-2 ${activeTab === 'resolved' ? 'bg-white border-emerald-50 shadow-2xl shadow-slate-900/[0.03]' : 'bg-slate-50/50 border-transparent'}`}
              >
                 <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-4 ${activeTab === 'resolved' ? 'bg-emerald-600 shadow-lg shadow-emerald-200' : 'bg-slate-200'}`}>
                    <CheckCircle2 size={20} color="white" />
                 </View>
                 <Text className={`text-3xl font-black ${activeTab === 'resolved' ? 'text-slate-900' : 'text-slate-400'}`}>{stats.resolved}</Text>
                 <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Resolved</Text>
              </TouchableOpacity>
           </View>

           {/* Doubts Feed */}
           <View className="gap-8">
              {filteredDoubts.length > 0 ? (
                filteredDoubts.map((doubt) => {
                  const student = doubt.profiles || doubt.student || {};
                  const doubtId = doubt.id || doubt._id;
                  const isResolved = activeTab === 'resolved';

                  return (
                    <View key={doubtId} className="bg-white rounded-[44px] p-8 border border-white shadow-2xl shadow-slate-900/[0.04]">
                      <View className="flex-row items-center justify-between mb-8">
                        <View className="flex-row items-center">
                           <View className="relative">
                             <Image 
                               source={{ uri: student.avatar_url || `https://ui-avatars.com/api/?name=${student.name || 'S'}&background=random` }} 
                               className="w-16 h-16 rounded-[24px] bg-slate-50 border-2 border-slate-50"
                             />
                             <View className={`absolute -bottom-1 -right-1 w-6 h-6 border-4 border-white rounded-full ${isResolved ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                           </View>
                           <View className="ml-4">
                             <Text className="text-lg font-black text-slate-900 tracking-tight">{student.name || "Student"}</Text>
                             <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                               {doubt.courses?.title || "Python Programming"}
                             </Text>
                           </View>
                        </View>
                        <View className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                           <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                             {new Date(doubt.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                           </Text>
                        </View>
                      </View>

                      <View className="mb-4">
                        <Text className="text-xl font-black text-slate-900 mb-2 leading-7">{doubt.subject || "Course Query"}</Text>
                        <View className="bg-slate-50 rounded-[32px] p-6 border border-slate-100/50">
                          <Text className="text-sm text-slate-600 leading-6 font-bold italic">
                            "{doubt.description || doubt.query || "No description provided."}"
                          </Text>
                        </View>
                      </View>

                      {!isResolved ? (
                        <View className="gap-6">
                          <View className="bg-white border border-slate-100 rounded-[36px] p-6 shadow-inner">
                            <TextInput 
                              placeholder="Type your professional response..."
                              multiline
                              className="text-slate-900 text-sm h-32 text-start align-top font-bold"
                              placeholderTextColor="#CBD5E1"
                              value={doubtId === replyingToId ? activeReplyText : ""}
                              onChangeText={(txt) => {
                                setReplyingToId(doubtId);
                                setActiveReplyText(txt);
                              }}
                            />
                            <View className="flex-row justify-end gap-3 pt-5 border-t border-slate-50">
                               <TouchableOpacity className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100 shadow-sm">
                                  <Video size={18} color="#64748B" />
                               </TouchableOpacity>
                               <TouchableOpacity className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100 shadow-sm">
                                  <Paperclip size={18} color="#64748B" />
                               </TouchableOpacity>
                            </View>
                          </View>

                          <TouchableOpacity 
                            onPress={() => handleResolve(doubtId)}
                            disabled={!activeReplyText.trim()}
                            activeOpacity={0.8}
                            className="overflow-hidden rounded-[28px]"
                          >
                             <LinearGradient
                               colors={activeReplyText.trim() ? ['#1E293B', '#0F172A'] : ['#F1F5F9', '#E2E8F0']}
                               className="py-5 flex-row items-center justify-center gap-3"
                             >
                                <Text className={`font-black text-xs uppercase tracking-widest ${activeReplyText.trim() ? 'text-white' : 'text-slate-400'}`}>Dispatch Resolution</Text>
                                <Send size={16} color={activeReplyText.trim() ? "white" : "#94A3B8"} />
                             </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View className="bg-emerald-50 rounded-[36px] p-6 flex-row items-center justify-between border border-emerald-100">
                          <View className="flex-row items-center flex-1 pr-4">
                            <View className="w-12 h-12 rounded-2xl bg-white items-center justify-center mr-5 shadow-sm">
                              <CheckCircle2 size={20} color="#10B981" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-0.5">Resolution Sent</Text>
                              <Text className="text-xs text-emerald-600 font-bold" numberOfLines={1}>{doubt.reply || "No response text."}</Text>
                            </View>
                          </View>
                          <ChevronRight size={18} color="#10B981" />
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <View className="items-center justify-center py-24 bg-white rounded-[56px] border border-dashed border-slate-200">
                  <View className="w-24 h-24 bg-slate-50 rounded-full items-center justify-center mb-8">
                    <MessageSquare size={36} color="#CBD5E1" />
                  </View>
                  <Text className="text-slate-400 font-black text-xl tracking-tight">Inbox Synchronized</Text>
                  <Text className="text-slate-300 text-[10px] mt-2 font-black uppercase tracking-[2px]">No {activeTab} queries found</Text>
                </View>
              )}

              {/* Advanced Tools Banner */}
              <TouchableOpacity 
                activeOpacity={0.9}
                className="mt-8 rounded-[48px] overflow-hidden shadow-2xl shadow-blue-900/10"
              >
                 <LinearGradient
                   colors={['#1E293B', '#334155']}
                   start={{ x: 0, y: 0 }}
                   end={{ x: 1, y: 1 }}
                   className="p-10 relative"
                 >
                    <View className="relative z-10">
                       <View className="flex-row items-center gap-2 mb-4">
                          <View className="bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">
                             <Text className="text-blue-400 text-[9px] font-black uppercase tracking-widest">Advanced Tooling</Text>
                          </View>
                          <Layers size={14} color="#3B82F6" />
                       </View>
                       <Text className="text-white text-3xl font-black mb-2 tracking-tight">Video Resolution</Text>
                       <Text className="text-slate-400 text-sm leading-6 font-bold">Record a quick screen capture or voice note to explain complex logical concepts visually.</Text>
                       
                       <View className="flex-row items-center mt-10">
                          <TouchableOpacity className="bg-blue-600 px-8 py-4 rounded-[20px] flex-row items-center gap-3 shadow-lg shadow-blue-600/20">
                             <Play size={14} color="white" fill="white" />
                             <Text className="text-white font-black text-[11px] uppercase tracking-widest">Launch Studio</Text>
                          </TouchableOpacity>
                       </View>
                    </View>
                    <View className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full" />
                    <View className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/5 rounded-full" />
                 </LinearGradient>
              </TouchableOpacity>
           </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
