import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
  useWindowDimensions,
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { 
  Calendar, 
  Video, 
  Clock, 
  ChevronRight,
  ExternalLink,
  Award,
  TrendingUp,
  Brain,
  ArrowRight,
  Code2,
  Terminal,
  Zap,
  Layout,
  Menu,
  Bell
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { Button } from "../../components/Button";
import { interviewsApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { Skeleton } from "../../components/Skeleton";
import { useAuth } from "../../context/AuthContext";
import { AppHeader } from "../../components/AppHeader";
import { LinearGradient } from "expo-linear-gradient";

export default function MockInterviewsScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const [interviews, setInterviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInterviews = useCallback(async () => {
    try {
      const res = await interviewsApi.myInterviews();
      if (isApiSuccess(res.data)) {
        setInterviews(extractApiData<any[]>(res.data, []));
      }
    } catch (e) {
      console.log("Error loading interviews", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
        fetchInterviews();
    }, [fetchInterviews])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchInterviews();
  };

  const { upcoming, completed } = useMemo(() => {
    const all = Array.isArray(interviews) ? interviews : [];
    const upc = all.filter(i => String(i.status).toLowerCase() !== "completed").sort((a,b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    const comp = all.filter(i => String(i.status).toLowerCase() === "completed").sort((a,b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
    return { upcoming: upc[0] || null, completed: comp };
  }, [interviews]);

  const handleJoin = async (link?: string) => {
    if (!link) return Alert.alert("Missing link", "Meeting link is not available yet.");
    const canOpen = await Linking.canOpenURL(link);
    if (canOpen) await Linking.openURL(link);
  };

  const { user } = useAuth();

  return (
    <SafeAreaWrapper bgWhite>
      {/* Premium Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white">
          <View className="flex-row items-center gap-4">
              <TouchableOpacity><Menu size={22} color={COLORS.primary} strokeWidth={2.5} /></TouchableOpacity>
              <Text className="text-xl font-black tracking-tighter text-blue-600">CodeCure Academy</Text>
          </View>
          <View className="w-10 h-10 rounded-full border-2 border-blue-100 overflow-hidden">
              <Image source={{ uri: user?.profile_picture || "https://i.pravatar.cc/150?u=codecure" }} className="w-full h-full" />
          </View>
      </View>

      <ScrollView 
        className="flex-1 bg-[#F8FAFC]"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }} className="pb-24">
            
            {/* Hero: Upcoming Session */}
            <View className="px-6 pt-10 pb-12">
                <View className="flex flex-col gap-2 mb-6">
                    <Text className="text-slate-400 font-black tracking-[0.05em] text-[10px] uppercase">UPCOMING SESSION</Text>
                    <Text className="text-3xl font-black text-slate-900 tracking-tight">Ace your next round</Text>
                </View>

                {upcoming ? (
                    <View className="bg-white rounded-[40px] p-8 border border-slate-50 shadow-2xl shadow-blue-900/[0.04] relative overflow-hidden">
                        <View className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/5 rounded-full" />
                        
                        <View className="flex-row items-center gap-6 mb-8">
                             <View className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-4 border-blue-50">
                                 <Image source={{ uri: "https://i.pravatar.cc/200?u=mentor" }} className="w-full h-full" resizeMode="cover" />
                             </View>
                             <View className="flex-1">
                                 <Text className="text-xl font-black text-slate-900 mb-1">Mock with {upcoming.interviewer_name || "Elena Ross"}</Text>
                                 <Text className="text-slate-400 font-bold text-xs">Senior Frontend Engineer @ TechGiant</Text>
                             </View>
                        </View>

                        <View className="flex-row gap-3 mb-8">
                            <View className="flex-row items-center gap-2 bg-slate-50 px-5 py-2 rounded-full border border-slate-100">
                                <Calendar size={14} color={COLORS.primary} strokeWidth={2.5} />
                                <Text className="text-slate-600 font-black text-[11px] uppercase">{new Date(upcoming.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</Text>
                            </View>
                            <View className="flex-row items-center gap-2 bg-slate-50 px-5 py-2 rounded-full border border-slate-100">
                                <Clock size={14} color={COLORS.primary} strokeWidth={2.5} />
                                <Text className="text-slate-600 font-black text-[11px] uppercase">{new Date(upcoming.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            onPress={() => handleJoin(upcoming.meeting_link)}
                            className="bg-blue-600 py-5 rounded-[24px] items-center shadow-xl shadow-blue-900/30"
                        >
                            <Text className="text-white font-black text-sm uppercase tracking-widest">Join Meeting</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="bg-white rounded-[40px] p-10 border border-slate-100 border-dashed items-center">
                        <Calendar size={48} color={COLORS.slate200} />
                        <Text className="text-slate-400 font-bold mt-4">No upcoming sessions</Text>
                    </View>
                )}
            </View>

            {/* Preparation Insights */}
            <View className="px-6 mb-12">
                <Text className="text-xl font-black text-slate-900 mb-6">Preparation Insights</Text>
                
                <View className="flex-row gap-6 mb-6">
                    {/* Confidence Score Card */}
                    <View className="flex-1 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm min-h-[160px] justify-between">
                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence Level</Text>
                        <Text className="text-4xl font-black text-blue-600">84%</Text>
                        <View className="h-3 bg-slate-100 rounded-full overflow-hidden">
                            <View className="h-full bg-blue-600 rounded-full" style={{ width: '84%' }} />
                        </View>
                        <Text className="text-[10px] text-slate-400 font-bold mt-2 leading-4">You're 12% higher than the class average.</Text>
                    </View>

                    {/* Focus Area Card */}
                    <View className="flex-[1.5] bg-blue-600 p-8 rounded-[40px] shadow-xl shadow-blue-900/20 relative overflow-hidden">
                         <View className="absolute -right-6 -bottom-6 opacity-20">
                             <Brain size={120} color="white" />
                         </View>
                         <Text className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">Recommended Focus</Text>
                         <Text className="text-white font-black text-lg mb-4">Data Structures & Algorithms</Text>
                         <View className="flex-row flex-wrap gap-2 mb-6">
                             {['B-Trees', 'DP', 'System Design'].map(tag => (
                                 <View key={tag} className="bg-white/20 px-3 py-1.5 rounded-full">
                                     <Text className="text-white text-[10px] font-bold">{tag}</Text>
                                 </View>
                             ))}
                         </View>
                         <TouchableOpacity className="flex-row items-center">
                             <Text className="text-white font-black text-xs mr-2">Review Materials</Text>
                             <ArrowRight size={14} color="white" />
                         </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* History Section */}
            <View className="px-6">
                <View className="flex-row justify-between items-end mb-8 ml-2">
                    <View>
                        <Text className="text-xl font-black text-slate-900">Interview History</Text>
                        <Text className="text-slate-400 font-bold text-xs mt-1">Review feedback from past sessions</Text>
                    </View>
                    <TouchableOpacity><Text className="text-blue-600 font-black text-xs uppercase">See All</Text></TouchableOpacity>
                </View>

                {completed.length > 0 ? (
                    completed.map((item, i) => (
                        <View key={item.id} className="bg-white rounded-[40px] p-6 mb-6 border border-slate-50 shadow-sm flex-row items-center">
                            <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 ${i % 2 === 0 ? 'bg-indigo-100' : 'bg-cyan-100'}`}>
                                {i % 2 === 0 ? <Code2 size={24} color="#4F46E5" /> : <Terminal size={24} color="#0891B2" />}
                            </View>
                            <View className="flex-1 pr-4">
                                <Text className="text-lg font-black text-slate-900 mb-1" numberOfLines={1}>{item.title}</Text>
                                <Text className="text-slate-400 font-bold text-xs" numberOfLines={1}>Mentor: Marcus Thorne • Oct 12</Text>
                                <Text className="text-slate-500 italic text-[11px] mt-2" numberOfLines={1}>"Excellent approach to scalability..."</Text>
                            </View>
                            <View className="items-end gap-2">
                                <View className="items-end">
                                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Score</Text>
                                    <Text className="text-xl font-black text-slate-900">{item.score || '9.2'}</Text>
                                </View>
                                <View className="w-8 h-8 rounded-full border border-blue-100 items-center justify-center">
                                    <TrendingUp size={14} color={COLORS.primary} />
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                    <View className="items-center py-10">
                        <Award size={48} color={COLORS.slate200} />
                        <Text className="text-slate-400 font-bold mt-4">Complete your first mock interview</Text>
                    </View>
                )}
            </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
