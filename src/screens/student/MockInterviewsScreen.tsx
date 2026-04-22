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
  ActivityIndicator
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
  Bell,
  Sparkles,
  Shield,
  Star,
  Users
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
      <AppHeader navigation={navigation} role={user?.role} />

      <ScrollView 
        className="flex-1 bg-[#F8FAFC]"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }} className="pb-32">
            
            {/* Hero Section */}
            <View className="px-6 pt-10 pb-12">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-blue-700 text-[10px] font-black uppercase tracking-widest">Preparation Command</Text>
                  </View>
                  <Sparkles size={14} color="#3B82F6" />
                </View>
                <Text className="text-[40px] font-black text-slate-900 leading-[44px] tracking-tight mb-4">
                    Career <Text className="text-blue-600">Forge</Text>
                </Text>
                <Text className="text-slate-400 font-bold text-base leading-6 max-w-[90%] mb-10">
                    Refine your technical delivery and communication under simulated pressure.
                </Text>

                {upcoming ? (
                    <TouchableOpacity activeOpacity={0.9} onPress={() => handleJoin(upcoming.meeting_link)} className="mb-4">
                      <LinearGradient
                        colors={["#1E293B", "#0F172A"]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        className="p-10 rounded-[56px] relative overflow-hidden shadow-2xl shadow-slate-900/30"
                      >
                        <View className="absolute -top-10 -right-10 w-48 h-48 bg-blue-600/10 rounded-full" />
                        <View className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full" />
                        
                        <View className="flex-row items-center gap-6 mb-10">
                             <View className="w-20 h-20 rounded-[28px] overflow-hidden shadow-2xl border-4 border-slate-800">
                                 <Image source={{ uri: "https://i.pravatar.cc/200?u=mentor" }} className="w-full h-full" resizeMode="cover" />
                             </View>
                             <View className="flex-1">
                                 <Text className="text-white text-2xl font-black mb-1 leading-tight tracking-tight">Mock with {upcoming.interviewer_name || "Elena Ross"}</Text>
                                 <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest">Lead Engineer @ FAANG</Text>
                             </View>
                        </View>

                        <View className="flex-row gap-4 mb-10">
                            <View className="flex-row items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                                <Calendar size={16} color="white" />
                                <Text className="text-white font-black text-xs uppercase tracking-widest">{new Date(upcoming.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</Text>
                            </View>
                            <View className="flex-row items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                                <Clock size={16} color="white" />
                                <Text className="text-white font-black text-xs uppercase tracking-widest">{new Date(upcoming.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                        </View>

                        <View className="bg-white py-6 rounded-[28px] items-center shadow-2xl shadow-blue-900/20">
                            <Text className="text-slate-900 font-black text-sm uppercase tracking-widest">Enter Studio</Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <View className="bg-white rounded-[56px] p-16 border border-dashed border-slate-200 items-center">
                        <View className="w-24 h-24 bg-slate-50 rounded-full items-center justify-center mb-8">
                           <Calendar size={40} color="#CBD5E1" />
                        </View>
                        <Text className="text-slate-400 font-black text-xl tracking-tight">Horizon clear</Text>
                        <Text className="text-slate-300 text-[10px] mt-2 font-black uppercase tracking-[2px]">No sessions scheduled for today</Text>
                    </View>
                )}
            </View>

            {/* Preparation Insights */}
            <View className="px-6 mb-16">
                <View className="flex-row items-center justify-between mb-10 px-2">
                   <View>
                      <Text className="text-2xl font-black text-slate-900 tracking-tight">Readiness Pulse</Text>
                      <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">AI-Driven Analysis</Text>
                   </View>
                   <TrendingUp size={24} color="#94A3B8" />
                </View>
                
                <View className="flex-row gap-6">
                    <View className="flex-1 bg-white p-10 rounded-[48px] border border-white shadow-2xl shadow-slate-900/[0.04] min-h-[180px] justify-between">
                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Confidence</Text>
                        <Text className="text-5xl font-black text-blue-600 mb-6 tracking-tighter">84%</Text>
                        <View className="h-2 bg-slate-50 rounded-full overflow-hidden mb-3">
                            <View className="h-full bg-blue-600 rounded-full" style={{ width: '84%' }} />
                        </View>
                        <Text className="text-[9px] text-slate-400 font-black uppercase tracking-widest">+12% vs average</Text>
                    </View>

                    <View className="flex-[1.2] bg-slate-900 p-10 rounded-[48px] shadow-2xl shadow-slate-900/10 relative overflow-hidden">
                         <View className="absolute -right-8 -bottom-8 opacity-10">
                             <Brain size={160} color="white" />
                         </View>
                         <Text className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Target focus</Text>
                         <Text className="text-white font-black text-2xl mb-4 leading-tight tracking-tight">System Design Patterns</Text>
                         <View className="flex-row flex-wrap gap-2 mb-8">
                             {['B-Trees', 'DP'].map(tag => (
                                 <View key={tag} className="bg-white/10 px-4 py-2 rounded-2xl border border-white/5">
                                     <Text className="text-white text-[9px] font-black uppercase tracking-widest">{tag}</Text>
                                 </View>
                             ))}
                         </View>
                         <TouchableOpacity className="flex-row items-center">
                             <Text className="text-blue-400 font-black text-[10px] uppercase tracking-widest mr-2">Review Intel</Text>
                             <ArrowRight size={14} color="#60A5FA" />
                         </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* History Section */}
            <View className="px-6">
                <View className="flex-row justify-between items-end mb-10 px-2">
                    <View>
                        <Text className="text-2xl font-black text-slate-900 tracking-tight">Session History</Text>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Professional Audit Log</Text>
                    </View>
                    <TouchableOpacity><Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest">Export Report</Text></TouchableOpacity>
                </View>

                {isLoading ? (
                   <View className="gap-6">
                      <Skeleton height={140} className="rounded-[40px]" />
                      <Skeleton height={140} className="rounded-[40px]" />
                   </View>
                ) : completed.length > 0 ? (
                    completed.map((item, i) => (
                        <TouchableOpacity key={item.id} className="bg-white rounded-[44px] p-8 mb-6 border border-white shadow-2xl shadow-slate-900/[0.04] flex-row items-center">
                            <View className="w-16 h-16 bg-slate-50 rounded-[24px] items-center justify-center mr-6 border border-slate-50">
                                {i % 2 === 0 ? <Code2 size={28} color="#0F172A" /> : <Shield size={28} color="#0F172A" />}
                            </View>
                            <View className="flex-1 pr-4">
                                <Text className="text-xl font-black text-slate-900 mb-1 leading-tight tracking-tight" numberOfLines={1}>{item.title}</Text>
                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3" numberOfLines={1}>Oct 12 • 45m Session</Text>
                                <View className="flex-row items-center gap-2">
                                   <Star size={12} color="#F59E0B" fill="#F59E0B" />
                                   <Text className="text-slate-500 font-bold text-xs italic" numberOfLines={1}>"Excellent logic depth..."</Text>
                                </View>
                            </View>
                            <View className="items-end">
                                <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Audit Score</Text>
                                <Text className="text-3xl font-black text-slate-900 tracking-tighter">{item.score || '9.2'}</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View className="items-center py-16 bg-white rounded-[48px] border border-white shadow-sm mx-2">
                        <Award size={48} color="#E2E8F0" />
                        <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-6">First audit pending</Text>
                    </View>
                )}
            </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
