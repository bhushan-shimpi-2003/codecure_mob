import React, { useEffect, useState, useMemo } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Image, Dimensions } from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { adminApi, enrollmentsApi, coursesApi, jobsApi } from "../../api/endpoints";
import { 
  Users, 
  Search,
  Bell,
  BarChart3, 
  Settings, 
  Briefcase, 
  CreditCard,
  ChevronRight,
  UserCheck,
  TrendingUp,
  FileText,
  Clock,
  Zap,
  Check,
  X,
  Info
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { Skeleton } from "../../components/Skeleton";
import { extractApiData, isApiSuccess } from "../../api/response";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function AdminDashboardScreen({ navigation }: any) {
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [studentsRes, staffRes, txRes, requestsRes, coursesRes, jobsRes] = await Promise.allSettled([
        adminApi.getStudents(),
        adminApi.getStaff(),
        adminApi.getTransactions(),
        enrollmentsApi.pendingRequests(),
        coursesApi.adminAll(),
        jobsApi.list()
      ]);

      if (studentsRes.status === "fulfilled") setStudents(extractApiData<any[]>(studentsRes.value.data, []));
      if (staffRes.status === "fulfilled") setStaff(extractApiData<any[]>(staffRes.value.data, []));
      if (txRes.status === "fulfilled") setTransactions(extractApiData<any[]>(txRes.value.data, []));
      if (requestsRes.status === "fulfilled") setPendingRequests(extractApiData<any[]>(requestsRes.value.data, []));
      if (coursesRes.status === "fulfilled") setCourses(extractApiData<any[]>(coursesRes.value.data, []));
      if (jobsRes.status === "fulfilled") setJobs(extractApiData<any[]>(jobsRes.value.data, []));

    } catch (e) {
      console.log("Error loading dashboard data", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const revenue = transactions.reduce((sum, tx) => sum + Number(tx?.amount || 0), 0);
    const activeCourses = courses.filter(c => c.status === 'active').length;
    
    // Group transactions by month for trends
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const currentMonth = new Date().getMonth();
    const last6Months = Array.from({length: 6}, (_, i) => {
      const d = new Date();
      d.setMonth(currentMonth - (5 - i));
      return { 
        month: monthNames[d.getMonth()], 
        count: 0,
        index: d.getMonth()
      };
    });

    transactions.forEach(tx => {
      const date = new Date(tx.createdAt || tx.created_at || Date.now());
      const txMonth = date.getMonth();
      const trendMonth = last6Months.find(m => m.index === txMonth);
      if (trendMonth) trendMonth.count++;
    });

    const maxCount = Math.max(...last6Months.map(m => m.count), 1);
    const trendData = last6Months.map(m => ({
      m: m.month,
      h: Math.max((m.count / maxCount) * 100, 10),
      c: m.index === currentMonth ? 'bg-blue-600' : 'bg-blue-200'
    }));

    return {
      totalStudents: students.length,
      totalTeachers: staff.filter(s => s.role === 'teacher').length,
      revenue: revenue,
      pending: pendingRequests.length,
      activeBatches: activeCourses,
      jobOpenings: jobs.length,
      trendData
    };
  }, [students, staff, transactions, pendingRequests, courses, jobs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const StatCard = ({ icon: Icon, label, value, trend, color, bg }: any) => (
    <View className="bg-white p-6 rounded-[40px] border border-slate-50 shadow-sm mb-5 relative overflow-hidden">
      <View className="flex-row items-center justify-between mb-4">
        <View className={`${bg} p-4 rounded-3xl`}>
          <Icon size={24} color={color} />
        </View>
        {trend && (
          <View className="bg-emerald-50 px-3 py-1 rounded-full">
            <Text className="text-emerald-600 text-[10px] font-black">{trend}</Text>
          </View>
        )}
      </View>
      <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</Text>
      <Text className="text-3xl font-black text-slate-900">{value}</Text>
    </View>
  );

  return (
    <SafeAreaWrapper bgWhite>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-50">
        <Text className="text-lg font-black text-slate-900">Dashboard Overview</Text>
        <View className="flex-row items-center gap-4">
          <TouchableOpacity className="p-2 bg-slate-50 rounded-full">
            <Search size={20} color={COLORS.slate600} />
          </TouchableOpacity>
          <TouchableOpacity className="p-2 bg-slate-50 rounded-full">
            <Bell size={20} color={COLORS.slate600} />
            <View className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1 bg-[#F8FAFC]"
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-10 px-4">
           <View className="bg-blue-50 px-4 py-1.5 rounded-full self-start mb-4">
              <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Overview</Text>
           </View>
           <Text className="text-[44px] font-black text-slate-900 leading-[48px] tracking-tighter">
              Admin <Text className="text-blue-600">Console</Text>
           </Text>
           <Text className="text-slate-400 text-base font-medium mt-2">Monitor your academy's growth and health.</Text>
        </View>
        {isLoading ? (
          <View className="gap-5">
            <Skeleton height={150} className="rounded-[40px]" />
            <Skeleton height={150} className="rounded-[40px]" />
            <Skeleton height={300} className="rounded-[40px]" />
          </View>
        ) : (
          <>
            {/* Quick Stats Grid */}
            <StatCard 
              icon={Users} 
              label="Total Students" 
              value={stats.totalStudents.toLocaleString()} 
              trend="+12%" 
              color="#2563EB" 
              bg="bg-blue-50" 
            />
            <StatCard 
              icon={Briefcase} 
              label="Total Teachers" 
              value={stats.totalTeachers.toLocaleString()} 
              trend="Stable" 
              color="#0891B2" 
              bg="bg-cyan-50" 
            />
            <StatCard 
              icon={TrendingUp} 
              label="Revenue This Month" 
              value={`₹${stats.revenue.toLocaleString()}`} 
              trend="+8.4%" 
              color="#059669" 
              bg="bg-emerald-50" 
            />
            <StatCard 
              icon={FileText} 
              label="Pending Enrollments" 
              value={stats.pending.toString()} 
              trend="High" 
              color="#E11D48" 
              bg="bg-rose-50" 
            />

            {/* Enrollment Trends Derived Chart */}
            <View className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-sm mb-8">
              <View className="flex-row justify-between items-start mb-8">
                <View>
                  <Text className="text-xl font-black text-slate-900">Enrollment Trends</Text>
                  <Text className="text-slate-400 text-xs font-bold mt-1">Active student registrations</Text>
                </View>
                <View className="bg-slate-50 px-4 py-2 rounded-2xl">
                  <Text className="text-slate-600 text-[10px] font-black uppercase">Last 6 Months</Text>
                </View>
              </View>
              
              <View className="flex-row items-end justify-between h-40 px-2">
                {stats.trendData.map((bar, i) => (
                  <View key={i} className="items-center">
                    <View className={`${bar.c} w-8 rounded-t-xl`} style={{ height: `${bar.h}%` }} />
                    <Text className="text-[10px] font-black text-slate-400 mt-3">{bar.m}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Recent Transactions */}
            <View className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-sm mb-8">
              <View className="flex-row justify-between items-center mb-8">
                <Text className="text-xl font-black text-slate-900">Recent Transactions</Text>
                <TouchableOpacity onPress={() => {}}>
                  <Text className="text-blue-600 text-xs font-black">View All</Text>
                </TouchableOpacity>
              </View>
              
              <View className="gap-6">
                {transactions.slice(0, 3).map((tx, i) => (
                  <View key={i} className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center mr-4">
                        <Text className="text-blue-600 font-black">{(tx?.user_name || 'TX').substring(0, 2).toUpperCase()}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 font-black text-sm" numberOfLines={1}>{tx?.course_name || 'Course Payment'}</Text>
                        <Text className="text-slate-400 text-[10px] font-bold uppercase mt-1">{tx?.user_name || 'Anonymous'}</Text>
                      </View>
                    </View>
                    <View className="items-end ml-4">
                      <Text className="text-slate-900 font-black text-sm">₹{tx?.amount || 0}</Text>
                      <Text className="text-slate-400 text-[10px] font-bold uppercase mt-1">
                        {new Date(tx.createdAt || tx.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                ))}
                {transactions.length === 0 && (
                  <Text className="text-center text-slate-400 italic py-4">No recent transactions</Text>
                )}
              </View>
            </View>

            {/* Latest Requests */}
            <View className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-sm mb-8">
              <Text className="text-xl font-black text-slate-900 mb-8">Latest Requests</Text>
              <View className="gap-6 mb-8">
                {pendingRequests.slice(0, 2).map((req, i) => (
                  <View key={i} className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 rounded-2xl bg-slate-900 items-center justify-center mr-4">
                         <Image source={{ uri: `https://i.pravatar.cc/100?u=${req.id || i}` }} className="w-full h-full rounded-2xl" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 font-black text-sm">{req?.student_name || 'User'}</Text>
                        <Text className="text-slate-400 text-[10px] font-bold uppercase mt-1">Applied for {req?.course_title || 'Course'}</Text>
                      </View>
                    </View>
                    <View className="flex-row gap-3">
                      <TouchableOpacity 
                        onPress={() => navigation.navigate('AdminEnrollments')}
                        className="p-2 border border-slate-100 rounded-lg"
                      >
                        <Check size={16} color="#10B981" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => navigation.navigate('AdminEnrollments')}
                        className="p-2 border border-slate-100 rounded-lg"
                      >
                        <X size={16} color="#F43F5E" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                {pendingRequests.length === 0 && (
                   <Text className="text-center text-slate-400 italic">No pending requests</Text>
                )}
              </View>
              <TouchableOpacity 
                onPress={() => navigation.navigate('AdminEnrollments')}
                className="bg-slate-50 py-4 rounded-2xl items-center"
              >
                <Text className="text-slate-600 font-black text-xs uppercase tracking-widest">Manage All Requests</Text>
              </TouchableOpacity>
            </View>

            {/* Academy Pulse */}
            <LinearGradient
              colors={['#0047AB', '#002D72']}
              className="p-8 rounded-[44px] mb-8 shadow-xl shadow-blue-900/20"
            >
              <Text className="text-white text-xl font-black mb-8">Academy Pulse</Text>
              
              <View className="gap-6">
                <View>
                  <View className="flex-row justify-between mb-3">
                    <Text className="text-blue-100/60 text-[10px] font-black uppercase tracking-widest">Active Batches</Text>
                    <Text className="text-white font-black">{stats.activeBatches}</Text>
                  </View>
                  <View className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <View className="h-full bg-white w-[70%]" />
                  </View>
                </View>

                <View className="flex-row justify-between items-center py-4 border-y border-white/5">
                  <Text className="text-blue-100/60 text-[10px] font-black uppercase tracking-widest">Live Classes</Text>
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                    <Text className="text-white font-black">{Math.ceil(stats.activeBatches / 3)}</Text>
                  </View>
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-blue-100/60 text-[10px] font-black uppercase tracking-widest">Job Openings</Text>
                  <Text className="text-white font-black">{stats.jobOpenings}</Text>
                </View>

                <TouchableOpacity className="bg-white/10 py-4 rounded-3xl items-center border border-white/10 mt-4">
                  <Text className="text-white font-black text-xs uppercase tracking-widest">View Full Report</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Upgrade Alert */}
            <View className="bg-[#086788] p-8 rounded-[44px] mb-8">
              <Text className="text-white text-xl font-black mb-4 uppercase tracking-tighter">Upgrade Alert</Text>
              <Text className="text-blue-50/60 text-xs font-medium leading-5 mb-8">
                System update scheduled for 12:00 AM UTC. Please finalize all pending records.
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity className="flex-1 bg-white/20 py-4 rounded-2xl items-center border border-white/10">
                  <Text className="text-white font-black text-xs uppercase tracking-widest">Acknowledge</Text>
                </TouchableOpacity>
                <TouchableOpacity className="p-4 bg-white/20 rounded-2xl border border-white/10">
                   <Info size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity 
        onPress={() => navigation.navigate('AdminAcademy')}
        className="absolute bottom-28 right-6 w-16 h-16 bg-blue-600 rounded-3xl items-center justify-center shadow-xl shadow-blue-600/40"
        style={{ elevation: 8 }}
      >
        <Zap size={28} color="white" fill="white" />
      </TouchableOpacity>
    </SafeAreaWrapper>
  );
}
