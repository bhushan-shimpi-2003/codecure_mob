import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { adminApi } from "../../api/endpoints";
import { 
  Users, 
  BarChart3, 
  Settings, 
  Briefcase, 
  CreditCard,
  ChevronRight,
  UserCheck,
  TrendingUp
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { Skeleton } from "../../components/Skeleton";
import { extractApiData } from "../../api/response";

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalStaff: 0,
    totalRevenue: 0,
    pendingInquiries: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const [studentsRes, staffRes, txRes, feedbackRes] = await Promise.allSettled([
        adminApi.getStudents(),
        adminApi.getStaff(),
        adminApi.getTransactions(),
        adminApi.getFeedback(),
      ]);

      const students =
        studentsRes.status === "fulfilled"
          ? extractApiData<any[]>(studentsRes.value.data, [])
          : [];
      const staff =
        staffRes.status === "fulfilled"
          ? extractApiData<any[]>(staffRes.value.data, [])
          : [];
      const transactions =
        txRes.status === "fulfilled"
          ? extractApiData<any[]>(txRes.value.data, [])
          : [];
      const feedback =
        feedbackRes.status === "fulfilled"
          ? extractApiData<any[]>(feedbackRes.value.data, [])
          : [];

      const revenue = (Array.isArray(transactions) ? transactions : []).reduce(
        (sum, tx) => sum + Number(tx?.amount || 0),
        0
      );

      setStats({
        totalStudents: Array.isArray(students) ? students.length : 0,
        totalStaff: Array.isArray(staff) ? staff.length : 0,
        totalRevenue: revenue,
        pendingInquiries: Array.isArray(feedback)
          ? feedback.filter((item) => !item?.resolved && item?.status !== "resolved").length
          : 0,
      });
    } catch (e) {
      console.log("Error loading admin stats", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const adminActions = [
    { label: "Manage Faculty", icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Student Records", icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Transactions", icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "System Settings", icon: Settings, color: "text-slate-600", bg: "bg-slate-50" },
  ];

  return (
    <SafeAreaWrapper>
      <ScrollView 
        contentContainerStyle={{ padding: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchStats();}} />}
      >
        <View className="mb-8">
          <Text className="text-sm font-black text-blue-600 uppercase tracking-widest mb-1">Admin Panel</Text>
          <Text className="text-2xl font-black text-slate-900">Console Overview</Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap justify-between mb-8">
          {[
            { label: "Students", value: String(stats.totalStudents), icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
            {
              label: "Revenue",
              value: `₹${stats.totalRevenue >= 100000 ? `${(stats.totalRevenue / 100000).toFixed(1)}L` : stats.totalRevenue}`,
              icon: TrendingUp,
              color: "text-emerald-600",
              bg: "bg-emerald-100",
            },
            { label: "Staff", value: String(stats.totalStaff), icon: BarChart3, color: "text-purple-600", bg: "bg-purple-100" },
            { label: "Inquiries", value: String(stats.pendingInquiries), icon: BarChart3, color: "text-amber-600", bg: "bg-amber-100" },
          ].map((stat, i) => (
            <View key={i} className="w-[47%] bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm mb-4">
              <View className={`${stat.bg} w-10 h-10 rounded-2xl items-center justify-center mb-3`}>
                <stat.icon size={20} className={stat.color} />
              </View>
              <Text className="text-xl font-black text-slate-900">{stat.value}</Text>
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text className="text-lg font-bold text-slate-900 mb-4">Core Management</Text>
        
        <View className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm mb-8">
          {adminActions.map((action, i) => (
            <TouchableOpacity 
              key={i}
              className={`flex-row items-center p-5 ${i !== adminActions.length - 1 ? 'border-b border-slate-50' : ''}`}
            >
              <View className={`${action.bg} p-2 rounded-xl mr-4`}>
                <action.icon size={20} className={action.color} />
              </View>
              <Text className="flex-1 font-bold text-slate-700">{action.label}</Text>
              <ChevronRight size={18} color={COLORS.slate300} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Reports Section can be added here */}
      </ScrollView>
    </SafeAreaWrapper>
  );
}
