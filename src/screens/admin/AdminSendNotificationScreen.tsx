import React, { useState } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { AppHeader } from "../../components/AppHeader";
import { notificationsApi } from "../../api/endpoints";
import { isApiSuccess } from "../../api/response";
import { 
  Send, 
  Users, 
  User, 
  Shield, 
  Megaphone,
  Layout,
  ChevronDown
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";

const ROLES = [
  { label: "Everyone", value: "all", icon: <Users size={18} color="#64748B" /> },
  { label: "Students Only", value: "student", icon: <User size={18} color="#2563EB" /> },
  { label: "Teachers Only", value: "teacher", icon: <Shield size={18} color="#7C3AED" /> },
  { label: "Specific User", value: "user", icon: <Megaphone size={18} color="#F59E0B" /> },
];

const CATEGORIES = [
  { label: "Information", value: "info", color: "bg-blue-500" },
  { label: "Urgent Alert", value: "admin", color: "bg-rose-500" },
  { label: "Success Update", value: "resolution", color: "bg-emerald-500" },
  { label: "Maintenance", value: "maintenance", color: "bg-slate-700" },
];

export default function AdminSendNotificationScreen({ navigation }: any) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState("all");
  const [targetUser, setTargetUser] = useState("");
  const [category, setCategory] = useState("info");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!title || !message) {
      Alert.alert("Error", "Please provide both title and message.");
      return;
    }

    if (targetRole === "user" && !targetUser) {
      Alert.alert("Error", "Please provide the User Email or ID.");
      return;
    }

    setIsSending(true);
    try {
      const res = await notificationsApi.send({
        title,
        message,
        role: targetRole === "all" ? undefined : (targetRole === "user" ? undefined : targetRole),
        user_id: targetRole === "user" ? targetUser : undefined,
        type: category
      });

      if (isApiSuccess(res.data)) {
        Alert.alert("Success", "Custom notification dispatched!");
        setTitle("");
        setMessage("");
        setTargetUser("");
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert("Error", "Failed to dispatch notification.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} title="Broadcast" subtitle="Admin Tools" showBack />
      
      <ScrollView 
        className="flex-1 bg-[#F8FAFC]"
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
      >
        <View className="mb-10 px-4">
           <View className="bg-purple-50 px-4 py-1.5 rounded-full self-start mb-4">
              <Text className="text-purple-600 text-[10px] font-black uppercase tracking-widest">Admin Tools</Text>
           </View>
           <Text className="text-[44px] font-black text-slate-900 leading-[48px] tracking-tighter">
              Create <Text className="text-purple-600">Custom</Text>
           </Text>
           <Text className="text-slate-400 text-base font-medium mt-2">Design and dispatch personalized platform alerts.</Text>
        </View>

        <View className="bg-white rounded-[44px] p-8 shadow-sm border border-slate-50 mb-8">
          <Text className="text-slate-900 font-black text-lg mb-6">Target Audience</Text>
          <View className="gap-3">
            {ROLES.map((role) => (
              <TouchableOpacity 
                key={role.value}
                onPress={() => setTargetRole(role.value)}
                className={`flex-row items-center p-5 rounded-[24px] border ${targetRole === role.value ? 'bg-purple-50 border-purple-100' : 'bg-slate-50 border-slate-50'}`}
              >
                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 bg-white shadow-sm shadow-slate-100`}>
                  {role.icon}
                </View>
                <Text className={`font-black text-sm ${targetRole === role.value ? 'text-purple-900' : 'text-slate-500'}`}>{role.label}</Text>
                {targetRole === role.value && (
                  <View className="ml-auto w-6 h-6 bg-purple-600 rounded-full items-center justify-center">
                    <Layout size={12} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {targetRole === "user" && (
            <View className="mt-6 animate-in fade-in duration-500">
               <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3 ml-2">Recipient Email or ID</Text>
               <TextInput 
                 placeholder="e.g. user@example.com or user_123"
                 value={targetUser}
                 onChangeText={setTargetUser}
                 className="bg-slate-50 p-6 rounded-[24px] font-bold text-slate-900 border border-slate-100"
                 placeholderTextColor="#94A3B8"
                 autoCapitalize="none"
               />
            </View>
          )}
        </View>

        <View className="bg-white rounded-[44px] p-8 shadow-sm border border-slate-50 mb-8">
          <Text className="text-slate-900 font-black text-lg mb-6">Notification Category</Text>
          <View className="flex-row flex-wrap gap-3">
             {CATEGORIES.map((cat) => (
               <TouchableOpacity 
                 key={cat.value}
                 onPress={() => setCategory(cat.value)}
                 className={`px-6 py-4 rounded-2xl border ${category === cat.value ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-100'}`}
               >
                 <View className="flex-row items-center">
                    <View className={`w-2 h-2 rounded-full mr-3 ${cat.color}`} />
                    <Text className={`font-black text-[10px] uppercase tracking-widest ${category === cat.value ? 'text-white' : 'text-slate-500'}`}>{cat.label}</Text>
                 </View>
               </TouchableOpacity>
             ))}
          </View>
        </View>

        <View className="bg-white rounded-[44px] p-8 shadow-sm border border-slate-50 mb-10">
          <Text className="text-slate-900 font-black text-lg mb-6">Content</Text>
          
          <View className="mb-6">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3 ml-2">Notification Title</Text>
            <TextInput 
              placeholder="e.g. Platform Maintenance"
              value={title}
              onChangeText={setTitle}
              className="bg-slate-50 p-6 rounded-[24px] font-bold text-slate-900 border border-slate-100"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View>
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3 ml-2">Message Body</Text>
            <TextInput 
              placeholder="What would you like to say?"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              className="bg-slate-50 p-6 rounded-[24px] font-bold text-slate-900 border border-slate-100 h-40 text-start align-top"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleSend}
          disabled={isSending || !title || !message}
          className={`rounded-[32px] py-6 flex-row items-center justify-center shadow-xl ${isSending || !title || !message ? 'bg-slate-200' : 'bg-purple-600 shadow-purple-200'}`}
        >
          {isSending ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white font-black text-sm uppercase tracking-widest mr-3">Dispatch Custom Alert</Text>
              <Send size={18} color="white" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
