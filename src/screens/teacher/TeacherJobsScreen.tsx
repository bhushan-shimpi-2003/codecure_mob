import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { jobsApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  ChevronRight, 
  Globe,
  Plus,
  X,
} from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";

export default function TeacherJobsScreen({ navigation }: any) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  
  // Form states
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [link, setLink] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleOpenLink = async (url: string) => {
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

  const handlePublish = async () => {
    if (!title.trim() || !company.trim()) {
      Alert.alert("Error", "Please fill in the job title and company.");
      return;
    }
    setIsSubmitting(true);
    try {
      const skillsArray = skills.split(",").map(s => s.trim()).filter(s => s !== "");
      const res = await jobsApi.create({
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        salary: salary.trim(),
        description: description.trim(),
        skills: skillsArray,
        application_link: link.trim(),
        is_active: isActive,
      });
      if (isApiSuccess(res.data)) {
        Alert.alert("Success", "Job vacancy published successfully");
        setTitle(""); setCompany(""); setLocation(""); setSalary(""); setDescription(""); setSkills(""); setLink("");
        setShowPostModal(false);
        fetchJobs();
      }
    } catch (e) { Alert.alert("Error", "Failed to publish vacancy"); }
    finally { setIsSubmitting(false); }
  };

  return (
    <SafeAreaWrapper>
      <AppHeader navigation={navigation} role="Teacher" />
      <ScrollView className="flex-1 bg-[#F8FAFC]" contentContainerStyle={{ paddingBottom: 60 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchJobs(); }} />}>
        <View className="px-6 pt-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">CAREERS PORTAL</Text>
            <View className="bg-blue-100 px-3 py-1 rounded-full">
              <Text className="text-[9px] font-black text-blue-600">LIVE PORTAL</Text>
            </View>
          </View>
          <Text className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Post Vacancies</Text>

          <View className="flex-row justify-between mb-8">
            <View className="w-[48%] bg-white p-6 rounded-[32px] shadow-sm border border-slate-50">
              <View className="bg-emerald-50 w-10 h-10 rounded-2xl items-center justify-center mb-3">
                <Briefcase size={18} color="#10B981" />
              </View>
              <Text className="text-2xl font-black text-slate-900">{jobs.length}</Text>
              <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ACTIVE JOBS</Text>
            </View>
            <View className="w-[48%] bg-white p-6 rounded-[32px] shadow-sm border border-slate-50">
              <View className="bg-blue-50 w-10 h-10 rounded-2xl items-center justify-center mb-3">
                <Globe size={18} color="#2563EB" />
              </View>
              <Text className="text-2xl font-black text-slate-900">{jobs.filter(j => j.is_active).length}</Text>
              <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PUBLISHED</Text>
            </View>
          </View>

          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => setShowPostModal(true)} 
            className="mb-12"
          >
            <LinearGradient
              colors={["#0F172A", "#334155"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-[40px] p-8 flex-row items-center justify-between shadow-xl shadow-slate-300"
            >
              <View className="flex-row items-center">
                <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center mr-4 border border-white/10">
                  <Plus size={24} color="white" />
                </View>
                <View>
                  <Text className="text-white text-lg font-black tracking-tight">Post New Job</Text>
                  <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">CREATING OPPORTUNITIES</Text>
                </View>
              </View>
              <View className="w-10 h-10 bg-white/5 rounded-full items-center justify-center">
                <ChevronRight size={20} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <View className="flex-row items-center justify-between mb-8">
            <View>
              <Text className="text-3xl font-black text-slate-900">Active Postings</Text>
              <View className="w-12 h-1.5 bg-blue-600 rounded-full mt-2" />
            </View>
            <View className="bg-blue-50 px-3 py-1 rounded-full">
              <Text className="text-[10px] font-black text-blue-600 uppercase">SYNCHRONIZED</Text>
            </View>
          </View>

          <View className="gap-8">
            {jobs.map((job) => {
              const skillsArr = Array.isArray(job.skills) ? job.skills : (job.skills?.split(",") || []);
              const isBackend = job.title?.toLowerCase().includes('backend');
              const isMobile = job.title?.toLowerCase().includes('mobile') || job.title?.toLowerCase().includes('android') || job.title?.toLowerCase().includes('ios');
              
              return (
                <View key={job.id || job._id} className="bg-white rounded-[40px] p-8 border border-slate-50 shadow-xl shadow-slate-200/40">
                  <View className="flex-row items-start justify-between mb-6">
                    <View className={`w-14 h-14 rounded-2xl items-center justify-center ${isBackend ? 'bg-indigo-50' : isMobile ? 'bg-blue-50' : 'bg-slate-50'}`}>
                      {isBackend ? <Globe size={22} color="#4F46E5" /> : isMobile ? <Briefcase size={22} color="#2563EB" /> : <Briefcase size={22} color="#64748B" />}
                    </View>
                    <View className="bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                      <Text className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{job.type || "FULL TIME"}</Text>
                    </View>
                  </View>
                  
                  <Text className="text-2xl font-black text-slate-900 mb-1 leading-tight tracking-tight">{job.title}</Text>
                  <Text className="text-blue-600 font-extrabold text-sm mb-6">{job.company}</Text>
                  
                  <View className="flex-row items-center gap-6 mb-6">
                    <View className="flex-row items-center">
                      <MapPin size={14} color="#94A3B8" />
                      <Text className="text-xs font-bold text-slate-400 ml-2">{job.location || "Remote"}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <DollarSign size={14} color="#94A3B8" />
                      <Text className="text-xs font-bold text-slate-400 ml-2">{job.salary || "Competitive"}</Text>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap gap-2 mb-8">
                    {skillsArr.slice(0, 3).map((s: string, sIdx: number) => (
                      <View key={sIdx} className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                        <Text className="text-[9px] font-black text-slate-500 uppercase">{s.trim()}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => handleOpenLink(job.application_link)}
                    className="bg-slate-900 rounded-[24px] py-5 items-center justify-center shadow-lg shadow-slate-200"
                  >
                    <Text className="text-white font-black text-[11px] uppercase tracking-[2px]">View Details</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
             {jobs.length === 0 && !isLoading && (
               <View className="items-center justify-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                  <Briefcase size={40} color="#CBD5E1" /><Text className="text-slate-400 font-bold mt-4">No active vacancies found</Text>
               </View>
             )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={showPostModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/60 justify-end">
           <View className="bg-[#F8FAFC] rounded-t-[48px] h-[90%] p-8">
              <View className="flex-row items-center justify-between mb-8">
                 <View>
                    <Text className="text-3xl font-black text-slate-900">New Vacancy</Text>
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">HIRING PORTAL</Text>
                 </View>
                 <TouchableOpacity onPress={() => setShowPostModal(false)} className="bg-white w-12 h-12 rounded-2xl items-center justify-center shadow-sm border border-slate-100"><X size={20} color="#64748B" /></TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                 <View className="gap-6 pb-20">
                    <View>
                       <Text className="text-[11px] font-black text-slate-500 mb-2 ml-1 uppercase">Job Title</Text>
                       <TextInput placeholder="e.g. Senior Frontend Engineer" className="bg-white border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 text-[13px] font-bold shadow-sm" placeholderTextColor="#94A3B8" value={title} onChangeText={setTitle} />
                    </View>
                    <View>
                       <Text className="text-[11px] font-black text-slate-500 mb-2 ml-1 uppercase">Company Name</Text>
                       <TextInput placeholder="e.g. TechFlow Systems" className="bg-white border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 text-[13px] font-bold shadow-sm" placeholderTextColor="#94A3B8" value={company} onChangeText={setCompany} />
                    </View>
                    <View className="flex-row justify-between">
                       <View className="w-[48%]">
                          <Text className="text-[11px] font-black text-slate-500 mb-2 ml-1 uppercase">Location</Text>
                          <TextInput placeholder="e.g. Remote" className="bg-white border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 text-[13px] font-bold shadow-sm" placeholderTextColor="#94A3B8" value={location} onChangeText={setLocation} />
                       </View>
                       <View className="w-[48%]">
                          <Text className="text-[11px] font-black text-slate-500 mb-2 ml-1 uppercase">Salary</Text>
                          <TextInput placeholder="e.g. $120k+" className="bg-white border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 text-[13px] font-bold shadow-sm" placeholderTextColor="#94A3B8" value={salary} onChangeText={setSalary} />
                       </View>
                    </View>
                    <View>
                       <Text className="text-[11px] font-black text-slate-500 mb-2 ml-1 uppercase">Description</Text>
                       <TextInput placeholder="Describe the role responsibilities..." className="bg-white border border-slate-100 rounded-3xl px-6 py-5 text-slate-900 text-[13px] font-bold h-36 shadow-sm" placeholderTextColor="#94A3B8" multiline textAlignVertical="top" value={description} onChangeText={setDescription} />
                    </View>
                    <View>
                       <Text className="text-[11px] font-black text-slate-500 mb-2 ml-1 uppercase">Required Skills</Text>
                       <TextInput placeholder="React, Tailwind, Node.js" className="bg-white border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 text-[13px] font-bold shadow-sm" placeholderTextColor="#94A3B8" value={skills} onChangeText={setSkills} />
                    </View>
                    <View>
                       <Text className="text-[11px] font-black text-slate-500 mb-2 ml-1 uppercase">Application Link</Text>
                       <TextInput placeholder="https://careers.company.com/apply" className="bg-white border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 text-[13px] font-bold shadow-sm" placeholderTextColor="#94A3B8" value={link} onChangeText={setLink} />
                    </View>
                    <TouchableOpacity onPress={handlePublish} disabled={isSubmitting} className="bg-blue-600 rounded-[28px] py-6 items-center justify-center shadow-xl shadow-blue-200 mt-4">
                      {isSubmitting ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white font-black text-sm uppercase tracking-widest">Publish Listing</Text>}
                    </TouchableOpacity>
                 </View>
              </ScrollView>
           </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
