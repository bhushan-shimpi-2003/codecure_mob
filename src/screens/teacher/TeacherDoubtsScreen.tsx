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
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { doubtsApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { 
  MessageSquare, 
  CheckCircle2, 
  Video, 
  Paperclip, 
  Play, 
  Trash2, 
  Edit3,
  Search,
  Filter,
  ArrowRight,
  Clock,
  ChevronRight,
  User,
} from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";

export default function TeacherDoubtsScreen() {
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
    return doubts.filter(d => activeTab === 'pending' ? !d.is_resolved : d.is_resolved);
  }, [doubts, activeTab]);

  const stats = {
    pending: doubts.filter(d => !d.is_resolved).length,
    resolved: doubts.filter(d => d.is_resolved).length
  };

  if (isLoading) {
    return (
      <SafeAreaWrapper>
        <AppHeader navigation={navigation} role="Teacher" />
        <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-slate-400 font-bold mt-4">Loading Queries...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <AppHeader navigation={navigation} role="Teacher" />
      <ScrollView 
        className="flex-1 bg-[#F8FAFC]" 
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        <View className="px-6 pt-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">INTELLECTUAL SUPPORT</Text>
            <TouchableOpacity className="bg-white p-2 rounded-full shadow-sm border border-slate-100"><Filter size={14} color="#64748B" /></TouchableOpacity>
          </View>
          <Text className="text-4xl font-black text-slate-900 mb-8">Doubt Hub</Text>

          {/* Stats Cards */}
          <View className="flex-row justify-between mb-10">
            <TouchableOpacity 
              onPress={() => setActiveTab('pending')}
              className={`w-[48%] p-6 rounded-[32px] border ${activeTab === 'pending' ? 'bg-white border-blue-100 shadow-sm' : 'bg-slate-50 border-slate-100'}`}
            >
              <View className={`w-10 h-10 rounded-xl items-center justify-center mb-4 ${activeTab === 'pending' ? 'bg-blue-600' : 'bg-slate-200'}`}>
                <Clock size={18} color="white" />
              </View>
              <Text className={`text-2xl font-black ${activeTab === 'pending' ? 'text-slate-900' : 'text-slate-400'}`}>{stats.pending}</Text>
              <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">WAITING</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setActiveTab('resolved')}
              className={`w-[48%] p-6 rounded-[32px] border ${activeTab === 'resolved' ? 'bg-white border-emerald-100 shadow-sm' : 'bg-slate-50 border-slate-100'}`}
            >
              <View className={`w-10 h-10 rounded-xl items-center justify-center mb-4 ${activeTab === 'resolved' ? 'bg-emerald-600' : 'bg-slate-200'}`}>
                <CheckCircle2 size={18} color="white" />
              </View>
              <Text className={`text-2xl font-black ${activeTab === 'resolved' ? 'text-slate-900' : 'text-slate-400'}`}>{stats.resolved}</Text>
              <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">RESOLVED</Text>
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
                  <View key={doubtId} className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-50">
                    <View className="flex-row items-center justify-between mb-8">
                      <View className="flex-row items-center">
                        <View className="relative">
                          <Image 
                            source={{ uri: student.avatar_url || `https://ui-avatars.com/api/?name=${student.name || 'S'}` }} 
                            className="w-14 h-14 rounded-[20px] bg-slate-50"
                          />
                          <View className={`absolute -bottom-1 -right-1 w-5 h-5 border-4 border-white rounded-full ${isResolved ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                        </View>
                        <View className="ml-4">
                          <Text className="text-base font-black text-slate-900">{student.name || "Student"}</Text>
                          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-tight" numberOfLines={1}>
                            {doubt.courses?.title || "Python Programming"}
                          </Text>
                        </View>
                      </View>
                      <View className="bg-slate-50 px-3 py-1.5 rounded-xl">
                        <Text className="text-[9px] font-black text-slate-400 uppercase">
                          {new Date(doubt.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                    </View>

                    <View className="bg-slate-50/50 rounded-[32px] p-6 mb-8 border border-slate-100/50">
                      <Text className="text-sm text-slate-600 leading-6 font-medium italic">
                        "{doubt.query}"
                      </Text>
                    </View>

                    {!isResolved ? (
                      <View className="gap-6">
                        <View className="bg-white border border-slate-100 rounded-[32px] p-5 shadow-inner">
                          <TextInput 
                            placeholder="Share your expertise..."
                            multiline
                            className="text-slate-900 text-sm h-32 text-start align-top"
                            placeholderTextColor="#94A3B8"
                            value={doubtId === replyingToId ? activeReplyText : ""}
                            onChangeText={(txt) => {
                              setReplyingToId(doubtId);
                              setActiveReplyText(txt);
                            }}
                          />
                          <View className="flex-row justify-end gap-2 pt-4 border-t border-slate-50">
                             <TouchableOpacity className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100">
                                <Video size={16} color="#64748B" />
                             </TouchableOpacity>
                             <TouchableOpacity className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100">
                                <Paperclip size={16} color="#64748B" />
                             </TouchableOpacity>
                          </View>
                        </View>

                        <TouchableOpacity 
                          onPress={() => handleResolve(doubtId)}
                          disabled={!activeReplyText.trim()}
                          className={`rounded-[24px] py-6 flex-row items-center justify-center shadow-lg ${activeReplyText.trim() ? 'bg-slate-900 shadow-slate-200' : 'bg-slate-100'}`}
                        >
                          <Text className={`font-black text-xs uppercase tracking-widest mr-2 ${activeReplyText.trim() ? 'text-white' : 'text-slate-400'}`}>Dispatch Answer</Text>
                          <ArrowRight size={16} color={activeReplyText.trim() ? "white" : "#94A3B8"} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View className="bg-emerald-50 rounded-[32px] p-6 flex-row items-center justify-between border border-emerald-100">
                        <View className="flex-row items-center flex-1 pr-4">
                          <View className="w-10 h-10 rounded-full bg-white items-center justify-center mr-4 shadow-sm">
                            <CheckCircle2 size={18} color="#10B981" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">RESOLUTION SENT</Text>
                            <Text className="text-xs text-emerald-600 mt-1" numberOfLines={1}>{doubt.response || "No response text."}</Text>
                          </View>
                        </View>
                        <ChevronRight size={16} color="#10B981" />
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View className="items-center justify-center py-24 bg-white rounded-[48px] border border-dashed border-slate-200">
                <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-6">
                  <MessageSquare size={32} color="#CBD5E1" />
                </View>
                <Text className="text-slate-400 font-black text-lg">Empty Inbox</Text>
                <Text className="text-slate-300 text-xs mt-2 font-bold uppercase tracking-widest">No {activeTab} queries</Text>
              </View>
            )}

            {/* Quick Draft Section */}
            <TouchableOpacity className="mt-8 bg-[#1E293B] rounded-[40px] p-10 relative overflow-hidden shadow-2xl">
              <View className="relative z-10">
                <Text className="text-blue-400 text-[10px] font-black uppercase tracking-[3px] mb-4">SMART TOOLS</Text>
                <Text className="text-white text-2xl font-black mb-2">Video Resolution</Text>
                <Text className="text-slate-400 text-sm leading-6">Record a quick screen capture or voice note to explain complex logical concepts visually.</Text>
                <View className="flex-row items-center mt-8">
                  <View className="bg-blue-600 px-6 py-3 rounded-full flex-row items-center">
                    <Play size={12} color="white" fill="white" className="mr-2" />
                    <Text className="text-white font-black text-[10px] uppercase tracking-widest">Launch Studio</Text>
                  </View>
                </View>
              </View>
              <View className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full" />
              <View className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/5 rounded-full" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
