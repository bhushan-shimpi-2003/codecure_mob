import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  ActivityIndicator 
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { AppHeader } from "../../components/AppHeader";
import { useNotifications } from "../../context/NotificationContext";
import { 
  Bell, 
  CheckCircle2, 
  MessageSquare, 
  AlertCircle, 
  Info, 
  Clock,
  Trash2,
  Check
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";

export default function NotificationsScreen({ navigation }: any) {
  const { notifications, unreadCount, isLoading, error, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteNotification(id);
    setDeletingId(null);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'course': return <MessageSquare size={20} color="#3B82F6" />;
      case 'assignment': return <CheckCircle2 size={20} color="#10B981" />;
      case 'message': return <MessageSquare size={20} color="#2563EB" />;
      case 'doubt': return <MessageSquare size={20} color="#0EA5E9" />;
      case 'resolution': return <CheckCircle2 size={20} color="#059669" />;
      case 'alert': return <AlertCircle size={20} color="#F59E0B" />;
      case 'system': return <AlertCircle size={20} color="#A855F7" />;
      case 'admin': return <Bell size={20} color="#F43F5E" />;
      default: return <Info size={20} color="#64748B" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'course': return 'bg-blue-50';
      case 'assignment': return 'bg-emerald-50';
      case 'message': return 'bg-blue-50';
      case 'doubt': return 'bg-sky-50';
      case 'resolution': return 'bg-emerald-50';
      case 'alert': return 'bg-amber-50';
      case 'system': return 'bg-purple-50';
      case 'admin': return 'bg-rose-50';
      default: return 'bg-slate-50';
    }
  };

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} title="Notifications" subtitle="Stay Updated" showBack />
      
      <ScrollView 
        className="flex-1 bg-[#F8FAFC]"
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchNotifications} />}
      >
        <View className="mb-10 px-4">
           <View className="bg-blue-50 px-4 py-1.5 rounded-full self-start mb-4">
              <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest">In-App Alerts</Text>
           </View>
           <Text className="text-[44px] font-black text-slate-900 leading-[48px] tracking-tighter">
              Your <Text className="text-blue-600">Alerts</Text>
           </Text>
           <Text className="text-slate-400 text-base font-medium mt-2">Manage your recent activity and updates.</Text>
        </View>

        {error && (
          <View className="bg-red-50 border border-red-200 rounded-[24px] p-4 mb-6">
            <Text className="text-red-600 font-semibold text-sm">{error}</Text>
          </View>
        )}

        {unreadCount > 0 && (
          <TouchableOpacity 
            onPress={markAllAsRead}
            className="flex-row items-center justify-center bg-white border border-slate-100 py-4 rounded-[24px] mb-8 shadow-sm"
          >
            <Check size={16} color={COLORS.primary} className="mr-2" />
            <Text className="text-blue-600 font-black text-xs uppercase tracking-widest">Mark all as read</Text>
          </TouchableOpacity>
        )}

        {isLoading && notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="text-slate-400 font-semibold mt-4">Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20 bg-white rounded-[44px] border border-dashed border-slate-200">
             <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-6">
                <Bell size={32} color="#CBD5E1" />
             </View>
             <Text className="text-slate-400 font-black text-lg">No Notifications</Text>
             <Text className="text-slate-300 text-xs mt-2 font-bold uppercase tracking-widest text-center px-10">We'll let you know when something happens!</Text>
          </View>
        ) : (
          <View className="gap-4">
            {notifications.map((item) => (
              <View 
                key={item.id || item._id} 
                className={`bg-white rounded-[32px] border ${!item.is_read ? 'border-blue-100 shadow-md' : 'border-slate-50 opacity-80'} overflow-hidden`}
              >
                <TouchableOpacity 
                  onPress={() => markAsRead(item.id || item._id || "")}
                  className="flex-row items-start p-6"
                >
                  <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${getBgColor(item.type)}`}>
                    {getIcon(item.type)}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className={`text-base font-black ${!item.is_read ? 'text-slate-900' : 'text-slate-500'}`}>{item.title}</Text>
                      {!item.is_read && <View className="w-2 h-2 bg-blue-600 rounded-full" />}
                    </View>
                    <Text className="text-slate-400 text-sm leading-5 mb-3">{item.message}</Text>
                    <View className="flex-row items-center">
                      <Clock size={12} color="#94A3B8" className="mr-1" />
                      <Text className="text-[10px] font-bold text-slate-400 uppercase">
                        {new Date(item.created_at || item.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => handleDelete(item.id || item._id || "")}
                  disabled={deletingId === (item.id || item._id)}
                  className="border-t border-slate-100 px-6 py-3 flex-row items-center justify-center active:bg-red-50"
                >
                  {deletingId === (item.id || item._id) ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <>
                      <Trash2 size={14} color="#EF4444" />
                      <Text className="text-red-500 font-semibold text-xs ml-2 uppercase">Delete</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
}
