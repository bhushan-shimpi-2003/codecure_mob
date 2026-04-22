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
import { jobsApi, notificationsApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  ChevronRight, 
  Globe,
  Plus,
  X,
  Sparkles,
  ArrowRight,
  Search,
  Layers,
  ArrowLeft
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
        
        // Notify Students
        notificationsApi.send({
          role: 'student',
          title: 'New Career Opportunity!',
          message: `${company} just posted a new position: ${title.trim()}. Check it out now!`,
          type: 'job'
        });

        setTitle(""); setCompany(""); setLocation(""); setSalary(""); setDescription(""); setSkills(""); setLink("");
        setShowPostModal(false);
        fetchJobs();
      }
    } catch (e: any) { 
      console.log("Job Publish Error:", e.response?.data || e.message);
      Alert.alert("Error", "Failed to publish vacancy. " + (e.response?.data?.message || "")); 
    }
    finally { setIsSubmitting(false); }
  };

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} role="Teacher" />
      <ScrollView 
        className="flex-1 bg-[#F8FAFC]" 
        contentContainerStyle={{ paddingBottom: 60 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchJobs(); }} tintColor="#2563EB" />
        }
      >
        <View className="px-6 pt-10">
           {/* Header Section */}
           <View className="mb-10">
              <View className="flex-row items-center gap-2 mb-3">
                 <View className="bg-emerald-100 px-3 py-1 rounded-full">
                    <Text className="text-emerald-700 text-[10px] font-black uppercase tracking-widest">Careers Portal</Text>
                 </View>
                 <Sparkles size={14} color="#10B981" />
              </View>
              <Text className="text-[40px] font-black text-slate-900 leading-[44px] tracking-tight">
                 Post <Text className="text-blue-600">Vacancies</Text>
              </Text>
              <Text className="text-slate-400 text-base font-bold mt-2">Scale your team and find elite student talent.</Text>
           </View>

           {/* High-Level Stats */}
           <View className="flex-row justify-between mb-10">
              <View className="w-[48%] bg-white p-6 rounded-[36px] shadow-2xl shadow-slate-900/[0.03] border border-slate-50">
                 <View className="bg-emerald-50 w-12 h-12 rounded-2xl items-center justify-center mb-4">
                    <Briefcase size={20} color="#10B981" />
                 </View>
                 <Text className="text-3xl font-black text-slate-900 mb-0.5">{jobs.length}</Text>
                 <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Jobs</Text>
              </View>
              <View className="w-[48%] bg-white p-6 rounded-[36px] shadow-2xl shadow-slate-900/[0.03] border border-slate-50">
                 <View className="bg-blue-50 w-12 h-12 rounded-2xl items-center justify-center mb-4">
                    <Globe size={20} color="#2563EB" />
                 </View>
                 <Text className="text-3xl font-black text-slate-900 mb-0.5">{jobs.filter(j => j.is_active).length}</Text>
                 <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Published</Text>
              </View>
           </View>

           {/* Call to Action */}
           <TouchableOpacity 
             activeOpacity={0.9}
             onPress={() => setShowPostModal(true)} 
             className="mb-12 overflow-hidden rounded-[44px]"
           >
              <LinearGradient
                colors={['#1E293B', '#0F172A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-10 flex-row items-center justify-between"
              >
                 <View className="flex-row items-center">
                    <View className="w-16 h-16 bg-white/10 rounded-3xl items-center justify-center mr-5 border border-white/10">
                       <Plus size={28} color="white" />
                    </View>
                    <View>
                       <Text className="text-white text-xl font-black tracking-tight">Post New Job</Text>
                       <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mt-0.5">Scale Talent</Text>
                    </View>
                 </View>
                 <View className="w-12 h-12 bg-white/5 rounded-full items-center justify-center border border-white/5">
                    <ChevronRight size={22} color="white" />
                 </View>
              </LinearGradient>
           </TouchableOpacity>

           {/* Active Postings List */}
           <View className="mb-10">
              <View className="flex-row items-center justify-between mb-8">
                 <Text className="text-2xl font-black text-slate-900">Active Postings</Text>
                 <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Live Now</Text>
                 </View>
              </View>

              {isLoading && !refreshing ? (
                <View className="py-20 items-center justify-center">
                   <ActivityIndicator size="large" color="#2563EB" />
                </View>
              ) : (
                <View className="gap-8">
                  {jobs.map((job) => {
                    const skillsArr = Array.isArray(job.skills) ? job.skills : (job.skills?.split(",") || []);
                    return (
                      <View key={job.id || job._id} className="bg-white rounded-[44px] p-8 border border-white shadow-2xl shadow-slate-900/[0.04]">
                        <View className="flex-row items-start justify-between mb-8">
                           <View className="w-16 h-16 rounded-[24px] bg-slate-50 items-center justify-center border border-slate-50 shadow-sm">
                              <Briefcase size={24} color="#64748B" />
                           </View>
                           <View className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                              <Text className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{job.type || "Full Time"}</Text>
                           </View>
                        </View>
                        
                        <Text className="text-2xl font-black text-slate-900 mb-1 leading-tight tracking-tight">{job.title}</Text>
                        <Text className="text-blue-600 font-black text-sm mb-8">{job.company}</Text>
                        
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

                        <View className="flex-row flex-wrap gap-2 mb-10">
                           {skillsArr.slice(0, 3).map((s: string, sIdx: number) => (
                             <View key={sIdx} className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                               <Text className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{s.trim()}</Text>
                             </View>
                           ))}
                        </View>

                        <TouchableOpacity 
                          activeOpacity={0.8}
                          onPress={() => handleOpenLink(job.application_link)}
                          className="bg-slate-900 rounded-[28px] py-6 items-center justify-center shadow-xl shadow-slate-200"
                        >
                          <Text className="text-white font-black text-[11px] uppercase tracking-[2px]">Review Application</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                   {jobs.length === 0 && (
                     <View className="items-center justify-center py-20 bg-slate-50 rounded-[44px] border border-dashed border-slate-200">
                        <Briefcase size={40} color="#CBD5E1" />
                        <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-4">No active vacancies</Text>
                     </View>
                   )}
                </View>
              )}
           </View>
        </View>
      </ScrollView>

      <Modal visible={showPostModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/60 justify-end">
           <View className="bg-[#F8FAFC] rounded-t-[56px] h-[92%] p-8">
              <View className="flex-row items-center justify-between mb-10">
                 <View>
                    <Text className="text-3xl font-black text-slate-900">New Vacancy</Text>
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Hiring Portal</Text>
                 </View>
                 <TouchableOpacity 
                   onPress={() => setShowPostModal(false)} 
                   className="bg-white w-14 h-14 rounded-3xl items-center justify-center shadow-2xl shadow-slate-900/[0.05] border border-slate-50"
                 >
                    <X size={24} color="#64748B" />
                 </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                 <View className="gap-8 pb-20">
                    <View>
                       <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Job Title</Text>
                       <TextInput 
                         placeholder="e.g. Senior Frontend Engineer" 
                         className="bg-white border border-slate-50 rounded-3xl px-8 py-6 text-slate-900 text-[14px] font-black shadow-sm" 
                         placeholderTextColor="#CBD5E1" 
                         value={title} 
                         onChangeText={setTitle} 
                       />
                    </View>
                    <View>
                       <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Company Name</Text>
                       <TextInput 
                         placeholder="e.g. TechFlow Systems" 
                         className="bg-white border border-slate-50 rounded-3xl px-8 py-6 text-slate-900 text-[14px] font-black shadow-sm" 
                         placeholderTextColor="#CBD5E1" 
                         value={company} 
                         onChangeText={setCompany} 
                       />
                    </View>
                    <View className="flex-row justify-between">
                       <View className="w-[48%]">
                          <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Location</Text>
                          <TextInput 
                            placeholder="e.g. Remote" 
                            className="bg-white border border-slate-50 rounded-3xl px-6 py-6 text-slate-900 text-[14px] font-black shadow-sm" 
                            placeholderTextColor="#CBD5E1" 
                            value={location} 
                            onChangeText={setLocation} 
                          />
                       </View>
                       <View className="w-[48%]">
                          <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Salary</Text>
                          <TextInput 
                            placeholder="e.g. $120k+" 
                            className="bg-white border border-slate-50 rounded-3xl px-6 py-6 text-slate-900 text-[14px] font-black shadow-sm" 
                            placeholderTextColor="#CBD5E1" 
                            value={salary} 
                            onChangeText={setSalary} 
                          />
                       </View>
                    </View>
                    <View>
                       <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Job Description</Text>
                       <TextInput 
                         placeholder="Describe the role responsibilities..." 
                         className="bg-white border border-slate-50 rounded-[40px] px-8 py-6 text-slate-900 text-[14px] font-black h-48 shadow-sm" 
                         placeholderTextColor="#CBD5E1" 
                         multiline 
                         textAlignVertical="top" 
                         value={description} 
                         onChangeText={setDescription} 
                       />
                    </View>
                    <View>
                       <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Required Skills</Text>
                       <TextInput 
                         placeholder="React, Tailwind, Node.js" 
                         className="bg-white border border-slate-50 rounded-3xl px-8 py-6 text-slate-900 text-[14px] font-black shadow-sm" 
                         placeholderTextColor="#CBD5E1" 
                         value={skills} 
                         onChangeText={setSkills} 
                       />
                    </View>

                    <View>
                       <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Application Link</Text>
                       <TextInput 
                         placeholder="e.g. https://careers.techflow.com/apply" 
                         className="bg-white border border-slate-50 rounded-3xl px-8 py-6 text-slate-900 text-[14px] font-black shadow-sm" 
                         placeholderTextColor="#CBD5E1" 
                         value={link} 
                         onChangeText={setLink} 
                         autoCapitalize="none"
                         keyboardType="url"
                       />
                    </View>
                    
                    <TouchableOpacity 
                      onPress={handlePublish} 
                      disabled={isSubmitting} 
                      activeOpacity={0.8}
                      className="overflow-hidden rounded-[32px] mt-6"
                    >
                      <LinearGradient
                        colors={['#2563EB', '#1D4ED8']}
                        className="py-6 items-center justify-center flex-row gap-4"
                      >
                         {isSubmitting ? (
                           <ActivityIndicator size="small" color="white" />
                         ) : (
                           <>
                              <Text className="text-white font-black text-sm uppercase tracking-widest">Publish Elite Listing</Text>
                              <ArrowRight size={18} color="white" />
                           </>
                         )}
                      </LinearGradient>
                    </TouchableOpacity>
                 </View>
              </ScrollView>
           </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
