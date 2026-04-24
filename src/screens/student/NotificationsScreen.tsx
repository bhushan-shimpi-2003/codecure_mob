import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { useNotifications } from "../../context/NotificationContext";
import { 
    Bell, 
    ChevronLeft, 
    Clock, 
    MessageSquare, 
    CheckCircle2, 
    AlertCircle,
    Trash2,
    CheckCircle,
    BellOff,
    Sparkles,
    Search
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { AppHeader } from "../../components/AppHeader";
import { useAuth } from "../../context/AuthContext";
import { Skeleton } from "../../components/Skeleton";
import { LinearGradient } from "expo-linear-gradient";

export default function NotificationsScreen({ navigation }: any) {
  const { user } = useAuth();
  const { notifications, isLoading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'doubt': return <MessageSquare size={18} color="#3B82F6" />;
      case 'assignment': return <CheckCircle2 size={18} color="#10B981" />;
      case 'alert': return <AlertCircle size={18} color="#F59E0B" />;
      default: return <Bell size={18} color="#6366F1" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'doubt': return 'bg-blue-50';
      case 'assignment': return 'bg-emerald-50';
      case 'alert': return 'bg-amber-50';
      default: return 'bg-indigo-50';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader 
        navigation={navigation} 
        role={user?.role} 
        title="Alerts" 
        showBell={false} 
        showBack={true}
      />

      <ScrollView 
        className="flex-1 bg-[#F8FAFC]"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        <View className="px-6 pt-8 pb-4 flex-row items-center justify-between">
            <View>
                <View className="flex-row items-center gap-2 mb-1">
                    <Text className="text-blue-600 font-black text-[10px] uppercase tracking-[2px]">Notification Center</Text>
                    <Sparkles size={12} color="#3B82F6" />
                </View>
                <Text className="text-[32px] font-black text-slate-900 leading-tight">Latest <Text className="text-blue-600">Pulse</Text></Text>
            </View>
            {notifications.length > 0 && (
                <TouchableOpacity 
                    onPress={markAllAsRead}
                    className="bg-white px-4 py-2 rounded-xl border border-slate-100 flex-row items-center gap-2"
                >
                    <CheckCircle size={14} color="#64748B" />
                    <Text className="text-slate-500 font-black text-[10px] uppercase">Mark all</Text>
                </TouchableOpacity>
            )}
        </View>

        <View className="px-6 pb-20">
            {isLoading && notifications.length === 0 ? (
                <View className="gap-4 mt-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} height={100} className="rounded-[32px]" />
                    ))}
                </View>
            ) : notifications.length > 0 ? (
                notifications.map((item) => (
                    <TouchableOpacity 
                        key={item.id || item._id}
                        onPress={() => markAsRead(item.id || item._id || "")}
                        className={`mb-4 p-5 rounded-[32px] border ${item.is_read ? 'bg-white border-slate-50' : 'bg-white border-blue-100 shadow-sm shadow-blue-900/5'}`}
                        activeOpacity={0.7}
                    >
                        <View className="flex-row gap-4">
                            <View className={`w-12 h-12 rounded-2xl items-center justify-center ${getBgColor(item.type)}`}>
                                {getIcon(item.type)}
                                {!item.is_read && (
                                    <View className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />
                                )}
                            </View>
                            <View className="flex-1">
                                <View className="flex-row justify-between items-start mb-1">
                                    <Text className={`text-sm font-black flex-1 mr-2 ${item.is_read ? 'text-slate-600' : 'text-slate-900'}`}>{item.title}</Text>
                                    <Text className="text-[10px] font-bold text-slate-400">{formatDate(item.created_at || item.createdAt || "")}</Text>
                                </View>
                                <Text className={`text-xs leading-5 ${item.is_read ? 'text-slate-400 font-medium' : 'text-slate-500 font-bold'}`} numberOfLines={2}>
                                    {item.message}
                                </Text>
                                
                                <View className="flex-row items-center justify-between mt-3">
                                    <View className="flex-row items-center gap-2">
                                        <View className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                            <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.type || 'system'}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity 
                                        onPress={() => deleteNotification(item.id || item._id || "")}
                                        className="p-2"
                                    >
                                        <Trash2 size={14} color="#CBD5E1" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))
            ) : (
                <View className="items-center justify-center py-20 mt-10 bg-white rounded-[44px] border border-dashed border-slate-200">
                    <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-6">
                        <BellOff size={32} color="#CBD5E1" />
                    </View>
                    <Text className="text-slate-400 font-black text-lg">All caught up!</Text>
                    <Text className="text-slate-300 text-[10px] mt-2 font-black uppercase tracking-widest">No new notifications</Text>
                </View>
            )}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
