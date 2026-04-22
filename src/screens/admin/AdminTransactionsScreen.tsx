import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { adminApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { Skeleton } from "../../components/Skeleton";
import { 
  Search, 
  MoreVertical,
  Download,
  CreditCard,
  RotateCcw,
  ArrowUpRight,
  TrendingUp,
  ArrowDownRight
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { LinearGradient } from "expo-linear-gradient";

const TABS = ["All", "Enrollments", "Refunds", "Payouts"];

export default function AdminTransactionsScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("All");

  const fetchData = async () => {
    try {
      const res = await adminApi.getTransactions();
      if (isApiSuccess(res.data)) {
        setTransactions(extractApiData<any[]>(res.data, []));
      }
    } catch (e) {
      console.log("Error loading transactions", e);
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

  const stats = useMemo(() => {
    const total = transactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    
    // Calculate trend (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const currentPeriod = transactions.filter(tx => new Date(tx.createdAt || tx.created_at) >= thirtyDaysAgo);
    const previousPeriod = transactions.filter(tx => {
      const d = new Date(tx.createdAt || tx.created_at);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    });

    const currentSum = currentPeriod.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const previousSum = previousPeriod.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    let trend = 0;
    if (previousSum > 0) {
      trend = ((currentSum - previousSum) / previousSum) * 100;
    } else if (currentSum > 0) {
      trend = 100;
    }

    return {
      total,
      trend: trend.toFixed(1),
      isPositiveTrend: trend >= 0
    };
  }, [transactions]);

  const groupedTransactions = useMemo(() => {
    const filtered = activeTab === "All" ? transactions : 
      activeTab === "Enrollments" ? transactions.filter(t => (t.type || "").toLowerCase() === 'enrollment' || (t.amount > 0 && !t.type)) :
      activeTab === "Refunds" ? transactions.filter(t => (t.type || "").toLowerCase() === 'refund') :
      transactions.filter(t => (t.type || "").toLowerCase() === 'payout');

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const groups: { [key: string]: any[] } = {
      "Today": [],
      "Yesterday": [],
      "Earlier": []
    };

    filtered.forEach(tx => {
      const date = new Date(tx.createdAt || tx.created_at).toDateString();
      if (date === today) groups["Today"].push(tx);
      else if (date === yesterday) groups["Yesterday"].push(tx);
      else groups["Earlier"].push(tx);
    });

    return groups;
  }, [transactions, activeTab]);

  const TransactionCard = ({ tx }: any) => {
    const isPositive = Number(tx.amount) >= 0;
    const type = tx.type || (isPositive ? 'Enrollment' : 'Payout');
    const Icon = type === 'Refund' ? RotateCcw : (isPositive ? CreditCard : ArrowUpRight);
    const color = type === 'Refund' ? '#F43F5E' : (isPositive ? '#3B82F6' : '#64748B');
    const bg = type === 'Refund' ? 'bg-rose-50' : (isPositive ? 'bg-blue-50' : 'bg-slate-100');

    return (
      <View className="bg-white rounded-[44px] p-8 border border-slate-50 shadow-sm mb-6">
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-row items-center flex-1">
            <View className={`${bg} w-14 h-14 rounded-2xl items-center justify-center mr-4`}>
               <Icon size={24} color={color} />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 font-black text-base" numberOfLines={1}>
                {tx.title || `${type}: ${tx.course_name || 'Platform Service'}`}
              </Text>
              <Text className="text-slate-400 text-xs font-bold mt-1">
                {type === 'Payout' ? 'Instructor: ' : 'Student: '}
                <Text className="text-blue-600">{tx.user_name || tx.student_name || 'Anonymous'}</Text>
              </Text>
            </View>
          </View>
          <View className="items-end ml-4">
             <Text className={`text-xl font-black ${isPositive ? 'text-emerald-500' : 'text-slate-900'}`}>
                {isPositive ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString()}
             </Text>
             <View className={`px-3 py-1 rounded-full mt-2 ${isPositive ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                <Text className={`text-[8px] font-black uppercase ${isPositive ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {tx.status || 'COMPLETED'}
                </Text>
             </View>
          </View>
        </View>

        <View className="flex-row items-center justify-between mb-8">
           <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
             {new Date(tx.createdAt || tx.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Ref: #{tx.id?.substring(0, 8).toUpperCase() || tx._id?.substring(0, 8).toUpperCase() || 'TRX-99210'}
           </Text>
        </View>

        <TouchableOpacity className="bg-slate-50 py-5 rounded-[24px] flex-row items-center justify-center border border-slate-100">
           <Download size={16} color={COLORS.slate600} className="mr-3" />
           <Text className="text-slate-600 font-black text-xs uppercase tracking-widest">Download Invoice</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaWrapper bgWhite>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity className="p-2 bg-slate-50 rounded-xl" onPress={() => fetchData()}>
           <TrendingUp size={24} color={COLORS.slate900} />
        </TouchableOpacity>
        <Text className="text-slate-900 font-black text-lg">Financial Ledger</Text>
        <View className="flex-row gap-3">
           <TouchableOpacity className="p-2 bg-slate-50 rounded-xl">
              <Search size={20} color={COLORS.slate900} />
           </TouchableOpacity>
           <TouchableOpacity className="p-2 bg-slate-50 rounded-xl">
              <MoreVertical size={20} color={COLORS.slate900} />
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
              <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Financials</Text>
           </View>
           <Text className="text-[44px] font-black text-slate-900 leading-[48px] tracking-tighter">
              Financial <Text className="text-blue-600">Ledger</Text>
           </Text>
           <Text className="text-slate-400 text-base font-medium mt-2">Track all platform revenue and payouts.</Text>
        </View>

        <View className="mb-10">
           <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Total Platform Revenue</Text>
           <View className="flex-row items-center">
              <Text className="text-[52px] font-black text-slate-900">₹{stats.total.toLocaleString()}</Text>
              <View className={`flex-row items-center ml-4 px-2 py-1 rounded-lg ${stats.isPositiveTrend ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                 {stats.isPositiveTrend ? <TrendingUp size={12} color="#10B981" /> : <ArrowDownRight size={12} color="#F43F5E" />}
                 <Text className={`${stats.isPositiveTrend ? 'text-emerald-500' : 'text-rose-500'} font-black text-xs ml-1`}>{stats.trend}%</Text>
              </View>
           </View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-10">
           {TABS.map((tab) => (
             <TouchableOpacity 
               key={tab} 
               onPress={() => setActiveTab(tab)}
               className="mr-6 items-center"
             >
                <Text className={`font-black text-sm mb-2 ${activeTab === tab ? 'text-slate-900' : 'text-slate-400'}`}>{tab}</Text>
                {activeTab === tab && <View className="h-1 w-6 bg-blue-600 rounded-full" />}
             </TouchableOpacity>
           ))}
        </ScrollView>

        {isLoading ? (
          <View className="gap-6">
             <Skeleton height={280} className="rounded-[44px]" />
             <Skeleton height={280} className="rounded-[44px]" />
          </View>
        ) : (
          <>
            {Object.entries(groupedTransactions).map(([groupName, txs]) => (
              txs.length > 0 && (
                <View key={groupName} className="mb-8">
                   <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-6">{groupName}</Text>
                   {txs.map((tx, idx) => (
                     <TransactionCard key={`${groupName}-${idx}`} tx={tx} />
                   ))}
                </View>
              )
            ))}
            {transactions.length === 0 && (
              <View className="items-center py-20 bg-white rounded-[44px] border border-slate-100">
                <Text className="text-slate-400 font-bold">No transactions found</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
}
