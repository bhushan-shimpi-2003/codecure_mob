import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { jobsApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Globe,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Zap
} from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";
import { LinearGradient } from "expo-linear-gradient";

export default function JobsScreen({ navigation }: any) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await jobsApi.list();
      if (isApiSuccess(res.data)) {
        setJobs(extractApiData<any[]>(res.data, []));
      }
    } catch (e) {
      console.log("Error fetching jobs", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleApply = async (url: string) => {
    if (!url) {
      Alert.alert("Note", "No application link provided for this listing.");
      return;
    }
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert("Error", "Could not open link.");
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} role="Student" />
      <ScrollView 
        className="flex-1 bg-[#F8FAFC]" 
        contentContainerStyle={{ paddingBottom: 60 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchJobs(); }} tintColor="#2563EB" />
        }
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
                 <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Back to Dashboard</Text>
                 <Text className="text-slate-900 text-sm font-black tracking-tight">Career Radar</Text>
              </View>
           </TouchableOpacity>

           {/* Header Section */}
           <View className="mb-10">
              <View className="flex-row items-center gap-2 mb-3">
                 <View className="bg-emerald-100 px-3 py-1 rounded-full">
                    <Text className="text-emerald-700 text-[10px] font-black uppercase tracking-widest">Opportunities</Text>
                 </View>
                 <Sparkles size={14} color="#10B981" />
              </View>
              <Text className="text-[40px] font-black text-slate-900 leading-[44px] tracking-tight">
                 Elite <Text className="text-blue-600">Vacancies</Text>
              </Text>
              <Text className="text-slate-400 text-base font-bold mt-2">Scale your career with our network of partner engineering teams.</Text>
           </View>

           {/* High-Level Stats */}
           <View className="flex-row justify-between mb-10">
              <View className="w-[48%] bg-white p-6 rounded-[36px] shadow-2xl shadow-slate-900/[0.03] border border-slate-50">
                 <View className="bg-emerald-50 w-12 h-12 rounded-2xl items-center justify-center mb-4">
                    <Briefcase size={20} color="#10B981" />
                 </View>
                 <Text className="text-3xl font-black text-slate-900 mb-0.5">{jobs.length}</Text>
                 <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Openings</Text>
              </View>
              <View className="w-[48%] bg-white p-6 rounded-[36px] shadow-2xl shadow-slate-900/[0.03] border border-slate-50">
                 <View className="bg-blue-50 w-12 h-12 rounded-2xl items-center justify-center mb-4">
                    <Globe size={20} color="#2563EB" />
                 </View>
                 <Text className="text-3xl font-black text-slate-900 mb-0.5">Global</Text>
                 <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tech Partners</Text>
              </View>
           </View>

           {/* Jobs List */}
           <View className="mb-10">
              {isLoading && !refreshing ? (
                <View className="py-20 items-center justify-center">
                   <ActivityIndicator size="large" color="#2563EB" />
                </View>
              ) : (
                <View className="gap-8">
                  {jobs.map((job) => (
                    <View key={job.id || job._id} className="bg-white rounded-[44px] p-8 border border-white shadow-2xl shadow-slate-900/[0.04]">
                      <View className="flex-row items-start justify-between mb-8">
                         <View className="w-16 h-16 rounded-[24px] bg-slate-50 items-center justify-center border border-slate-50 shadow-sm">
                            <Briefcase size={24} color="#64748B" />
                         </View>
                         <View className="bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                            <Text className="text-emerald-600 text-[9px] font-black uppercase tracking-widest">Apply Now</Text>
                         </View>
                      </View>
                      
                      <Text className="text-2xl font-black text-slate-900 mb-1 leading-tight tracking-tight">{job.title}</Text>
                      <Text className="text-blue-600 font-black text-sm mb-6">{job.company}</Text>
                      
                      {job.description && (
                        <Text className="text-slate-500 text-sm font-medium mb-8 leading-6" numberOfLines={3}>
                           {job.description}
                        </Text>
                      )}

                      <View className="flex-row items-center gap-6 mb-8 bg-slate-50/50 p-4 rounded-3xl">
                         <View className="flex-row items-center">
                            <MapPin size={14} color="#94A3B8" />
                            <Text className="text-xs font-black text-slate-500 ml-2">{job.location || "Remote"}</Text>
                         </View>
                         <View className="flex-row items-center">
                            <DollarSign size={14} color="#94A3B8" />
                            <Text className="text-xs font-black text-slate-500 ml-2">{job.salary || "Competitive"}</Text>
                         </View>
                      </View>

                      <TouchableOpacity 
                        activeOpacity={0.8}
                        onPress={() => handleApply(job.apply_url || job.application_link)}
                        className="overflow-hidden rounded-[28px] shadow-xl shadow-blue-100"
                      >
                         <LinearGradient
                           colors={['#2563EB', '#1D4ED8']}
                           start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                           className="py-6 flex-row items-center justify-center gap-3"
                         >
                            <Text className="text-white font-black text-[11px] uppercase tracking-[2px]">Quick Apply</Text>
                            <Zap size={14} color="white" fill="white" />
                         </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {jobs.length === 0 && (
                    <View className="items-center justify-center py-20 bg-slate-50 rounded-[44px] border border-dashed border-slate-200">
                       <Briefcase size={40} color="#CBD5E1" />
                       <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-4 text-center">No active openings right now</Text>
                    </View>
                  )}
                </View>
              )}
           </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
