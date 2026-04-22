import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { enrollmentsApi, adminApi, notificationsApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { Skeleton } from "../../components/Skeleton";
import { 
  Bell, 
  Calendar,
  Clock,
  ChevronRight,
  Quote
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { LinearGradient } from "expo-linear-gradient";

export default function AdminEnrollmentsScreen() {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [pendingRes, studentsRes] = await Promise.allSettled([
        enrollmentsApi.pendingRequests(),
        adminApi.getStudents(),
      ]);

      if (pendingRes.status === "fulfilled" && isApiSuccess(pendingRes.value.data)) {
        setPendingRequests(extractApiData<any[]>(pendingRes.value.data, []));
      }
      if (studentsRes.status === "fulfilled" && isApiSuccess(studentsRes.value.data)) {
        setStudents(extractApiData<any[]>(studentsRes.value.data, []));
      }
    } catch (e) {
      console.log("Error loading enrollment governance", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleResolve = async (requestId: string, status: "approved" | "rejected") => {
    try {
      const request = pendingRequests.find(r => (r.id || r._id) === requestId);
      const res = await enrollmentsApi.updateRequest(requestId, status);
      
      if (isApiSuccess(res.data)) {
        // Notify Student
        if (request) {
          notificationsApi.send({
            user_id: request.user_id || request.student_id || request.student?.id || request.student?._id,
            title: status === 'approved' ? 'Enrollment Approved!' : 'Enrollment Update',
            message: status === 'approved' 
              ? `Your request for "${request.course_title || 'the course'}" has been approved. You can start learning now!` 
              : `Your request for "${request.course_title || 'the course'}" was not approved at this time.`,
            type: status === 'approved' ? 'resolution' : 'admin'
          });
        }
        fetchData();
      }
    } catch (e) {
      console.log("Error resolving request", e);
    }
  };

  const RequestCard = ({ request }: any) => {
    const timeAgo = useMemo(() => {
      const date = new Date(request.createdAt || request.created_at || Date.now());
      const diff = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
      if (diff < 60) return `${diff}m ago`;
      if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
      return `${Math.floor(diff / 1440)}d ago`;
    }, [request.id]);

    return (
      <View className="bg-white rounded-[44px] p-8 border border-slate-50 shadow-sm mb-8">
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-row items-center">
             <View className="w-16 h-16 rounded-2xl bg-slate-900 overflow-hidden mr-4 shadow-sm">
                <Image source={{ uri: `https://i.pravatar.cc/150?u=${request.id || request._id}` }} className="w-full h-full" />
             </View>
             <View>
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-slate-900 font-black text-lg">{request?.student_name || 'Student'}</Text>
                  {request.priority === 'high' && (
                    <View className="bg-blue-100 px-3 py-1 rounded-lg">
                       <Text className="text-blue-600 text-[8px] font-black uppercase tracking-widest">High Priority</Text>
                    </View>
                  )}
                </View>
                <Text className="text-slate-400 text-xs font-bold">{request?.student_email || 'student@example.com'}</Text>
             </View>
          </View>
        </View>

        <View className="flex-row gap-2 mb-8">
           <View className="bg-slate-50 px-4 py-2 rounded-xl">
              <Text className="text-slate-600 text-[10px] font-black uppercase tracking-widest">{request?.course_title || 'New Course'}</Text>
           </View>
           <View className="bg-slate-50 px-4 py-2 rounded-xl">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Requested {timeAgo}</Text>
           </View>
        </View>

        <View className="bg-slate-50 p-6 rounded-[32px] mb-8">
           <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-4">Student Motivation</Text>
           <Text className="text-slate-600 text-sm italic leading-6">
             "{request.message || request.motivation || "I am highly motivated to join this course to advance my career in software development and master modern technologies."}"
           </Text>
        </View>

        <View className="flex-row gap-3">
           <TouchableOpacity 
             onPress={() => handleResolve(request.id || request._id, 'approved')}
             className="flex-[2] bg-blue-600 py-5 rounded-[24px] items-center shadow-lg shadow-blue-600/20"
           >
              <Text className="text-white font-black text-xs uppercase tracking-widest">Approve Enrollment</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             onPress={() => handleResolve(request.id || request._id, 'rejected')}
             className="flex-1 bg-slate-100 py-5 rounded-[24px] items-center"
           >
              <Text className="text-slate-400 font-black text-xs uppercase tracking-widest">Reject</Text>
           </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaWrapper bgWhite>
       {/* Header */}
       <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity className="p-2 bg-slate-100 rounded-full">
           <LinearGradient colors={['#3B82F6', '#1D4ED8']} className="w-10 h-10 rounded-full items-center justify-center">
              <Image source={{ uri: 'https://i.pravatar.cc/100?u=admin' }} className="w-8 h-8 rounded-full" />
           </LinearGradient>
        </TouchableOpacity>
        <Text className="text-blue-900 font-black text-lg">CodeCure Admin</Text>
        <TouchableOpacity className="p-2 bg-slate-50 rounded-xl relative">
           <Bell size={20} color={COLORS.primary} />
           <View className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1 bg-[#F8FAFC]"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-8 pt-8">
           <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-2">Enrollment Management</Text>
           <Text className="text-[44px] font-black text-slate-900 leading-[44px] tracking-tighter mb-4">Pending Requests</Text>
           <Text className="text-slate-400 text-sm leading-6 mb-10">
             Review and authorize student enrollments for the upcoming Python and Data Science cohorts.
           </Text>

           <View className="flex-row items-center bg-blue-100 self-start px-6 py-4 rounded-[20px] mb-10">
              <Calendar size={18} color="#2563EB" className="mr-3" />
              <Text className="text-blue-600 font-black text-sm uppercase tracking-widest">{pendingRequests.length} Pending</Text>
           </View>

           {isLoading ? (
             <View className="gap-8">
                <Skeleton height={400} className="rounded-[44px]" />
                <Skeleton height={200} className="rounded-[44px]" />
             </View>
           ) : pendingRequests.length === 0 ? (
             <View className="items-center py-20 bg-white rounded-[44px] border border-slate-100">
                <Text className="text-slate-400 font-bold">No pending requests at the moment</Text>
             </View>
           ) : (
             pendingRequests.map((req, idx) => (
               <RequestCard key={idx} request={req} />
             ))
           )}

           {/* Academy Growth Stat Card */}
           <LinearGradient
             colors={['#0047AB', '#002D72']}
             className="p-10 rounded-[44px] items-center"
           >
              <Text className="text-white text-4xl font-black mb-8">Academy Growth</Text>
              <Text className="text-blue-50/60 text-center text-sm leading-6 mb-12">
                Your approval speed has increased by 22% this week. Keep maintaining the intellectual flow of the academy.
              </Text>
              
              <View className="flex-row justify-between w-full">
                 <View className="items-center flex-1">
                    <Text className="text-white text-4xl font-black mb-1">{students.length.toLocaleString()}</Text>
                    <Text className="text-blue-100/40 text-[10px] font-black uppercase tracking-widest text-center">Active Scholars</Text>
                 </View>
                 <View className="items-center flex-1">
                    <Text className="text-white text-4xl font-black mb-1">98.2%</Text>
                    <Text className="text-blue-100/40 text-[10px] font-black uppercase tracking-widest text-center">Success Rate</Text>
                 </View>
              </View>
           </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
