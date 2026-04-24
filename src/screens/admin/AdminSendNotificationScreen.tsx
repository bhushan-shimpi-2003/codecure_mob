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
  Bell,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Zap,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

// ─── Data ─────────────────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: "general", emoji: "📢", label: "General", title: "Platform Announcement", message: "We have important updates regarding the platform. Please check the latest details in your dashboard.", type: "general" },
  { id: "assignment", emoji: "📝", label: "Assignment", title: "New Assignment Published", message: "A new assignment has been added to your course. Please review the requirements and due date.", type: "assignment" },
  { id: "course", emoji: "📚", label: "Course", title: "Course Content Update", message: "New material has been uploaded to your enrolled course. Happy learning!", type: "course" },
  { id: "job", emoji: "💼", label: "Job Alert", title: "New Job Vacancy", message: "A new job opening matching your profile has been posted. Visit the Jobs section to apply.", type: "job" },
  { id: "interview", emoji: "🎤", label: "Interview", title: "Mock Interview Scheduled", message: "Your mock interview session has been scheduled. Prepare your tools and check the meet link.", type: "interview" },
  { id: "custom", emoji: "✏️", label: "Custom", title: "", message: "", type: "general" },
];

const ROLES = [
  { label: "All Users", value: "all", icon: Users, color: "#64748B" },
  { label: "Students", value: "student", icon: User, color: "#2563EB" },
  { label: "Teachers", value: "teacher", icon: Shield, color: "#7C3AED" },
];

const CATEGORIES = [
  { label: "General", value: "general", dot: "bg-slate-500" },
  { label: "Assignment", value: "assignment", dot: "bg-blue-500" },
  { label: "Course", value: "course", dot: "bg-purple-500" },
  { label: "Doubt", value: "doubt", dot: "bg-amber-500" },
  { label: "Job", value: "job", dot: "bg-emerald-500" },
  { label: "Interview", value: "interview", dot: "bg-rose-500" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSendNotificationScreen({ navigation, route }: any) {
  const params = route?.params || {};

  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [title, setTitle] = useState(TEMPLATES[0].title);
  const [message, setMessage] = useState(TEMPLATES[0].message);
  const [targetRole, setTargetRole] = useState(params.targetRole || "all");
  const [targetUserId, setTargetUserId] = useState(params.targetUser || "");
  const [useSpecificUser, setUseSpecificUser] = useState(!!params.targetUser);
  const [category, setCategory] = useState("general");
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSelectTemplate = (tpl: typeof TEMPLATES[0]) => {
    setSelectedTemplate(tpl);
    if (tpl.id !== "custom") {
      setTitle(tpl.title);
      setMessage(tpl.message);
      setCategory(tpl.type);
    } else {
      setTitle("");
      setMessage("");
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Missing Fields", "Please fill in both title and message.");
      return;
    }
    if (useSpecificUser && !targetUserId.trim()) {
      Alert.alert("Missing Recipient", "Please enter a user ID or email.");
      return;
    }

    setIsSending(true);
    try {
      const res = await notificationsApi.send({
        title: title.trim(),
        message: message.trim(),
        role: !useSpecificUser && targetRole !== "all" ? targetRole : undefined,
        user_id: useSpecificUser ? targetUserId.trim() : undefined,
        type: category,
      });

      if (isApiSuccess(res.data)) {
        setSent(true);
        setTimeout(() => {
          setSent(false);
          navigation.goBack();
        }, 1800);
      } else {
        Alert.alert("Failed", "Notification dispatch was unsuccessful.");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to send notification. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaWrapper bgWhite>
        <View className="flex-1 items-center justify-center bg-[#F8FAFC] px-10">
          <View className="w-24 h-24 rounded-full bg-purple-100 items-center justify-center mb-6">
            <CheckCircle size={44} color="#7C3AED" />
          </View>
          <Text className="text-3xl font-black text-slate-900 tracking-tight text-center">Dispatched!</Text>
          <Text className="text-slate-400 text-sm font-bold mt-3 text-center leading-6">
            Your notification has been broadcast successfully.
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} showBack />
      <ScrollView
        className="flex-1 bg-[#F8FAFC]"
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="mb-10">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="bg-purple-100 px-3 py-1 rounded-full">
              <Text className="text-purple-700 text-[10px] font-black uppercase tracking-widest">Admin Tools</Text>
            </View>
            <Zap size={14} color="#7C3AED" />
          </View>
          <Text className="text-[38px] font-black text-slate-900 leading-[42px] tracking-tight">
            {"Broadcast\n"}<Text className="text-purple-600">Center</Text>
          </Text>
          <Text className="text-slate-400 text-sm font-bold mt-2 leading-5">
            Dispatch platform-wide alerts to any audience segment.
          </Text>
        </View>

        {/* Quick Templates */}
        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-5 ml-1">Quick Templates</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
          className="mb-10"
        >
          {TEMPLATES.map((tpl) => {
            const isActive = selectedTemplate.id === tpl.id;
            return (
              <TouchableOpacity
                key={tpl.id}
                onPress={() => handleSelectTemplate(tpl)}
                activeOpacity={0.8}
                className={`px-5 py-4 rounded-[28px] border-2 min-w-[110px] items-center ${
                  isActive ? "bg-slate-900 border-slate-900" : "bg-white border-slate-100"
                }`}
              >
                <Text className="text-2xl mb-2">{tpl.emoji}</Text>
                <Text className={`text-[10px] font-black uppercase tracking-wider ${isActive ? "text-white" : "text-slate-500"}`}>
                  {tpl.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Target Audience */}
        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-5 ml-1">Target Audience</Text>
        <View className="bg-white rounded-[40px] p-6 border border-slate-50 shadow-sm mb-10">
          <View className="flex-row gap-3 mb-5">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const isActive = !useSpecificUser && targetRole === r.value;
              return (
                <TouchableOpacity
                  key={r.value}
                  onPress={() => { setTargetRole(r.value); setUseSpecificUser(false); }}
                  activeOpacity={0.8}
                  className={`flex-1 py-4 rounded-[24px] border-2 items-center ${
                    isActive ? "bg-purple-600 border-purple-600" : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <Icon size={18} color={isActive ? "white" : r.color} />
                  <Text className={`text-[10px] font-black uppercase tracking-wider mt-2 ${isActive ? "text-white" : "text-slate-500"}`}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={() => setUseSpecificUser(!useSpecificUser)}
            activeOpacity={0.8}
            className={`flex-row items-center p-5 rounded-[24px] border-2 ${useSpecificUser ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-100"}`}
          >
            <User size={18} color={useSpecificUser ? "#F59E0B" : "#94A3B8"} />
            <Text className={`font-black text-sm ml-3 flex-1 ${useSpecificUser ? "text-amber-700" : "text-slate-500"}`}>
              Specific User (by ID or Email)
            </Text>
            <View className={`w-5 h-5 rounded-full border-2 ${useSpecificUser ? "bg-amber-500 border-amber-500" : "border-slate-300"}`} />
          </TouchableOpacity>

          {useSpecificUser && (
            <View className="mt-4">
              <TextInput
                value={targetUserId}
                onChangeText={setTargetUserId}
                placeholder="user@example.com or user_id"
                placeholderTextColor="#CBD5E1"
                autoCapitalize="none"
                className="bg-slate-50 border border-slate-100 rounded-[20px] px-6 py-4 text-slate-900 font-bold text-sm"
              />
            </View>
          )}
        </View>

        {/* Category */}
        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-5 ml-1">Category</Text>
        <View className="flex-row flex-wrap gap-3 mb-10">
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              onPress={() => setCategory(cat.value)}
              activeOpacity={0.8}
              className={`px-6 py-4 rounded-[20px] border-2 flex-row items-center gap-2 ${
                category === cat.value ? "bg-slate-900 border-slate-900" : "bg-white border-slate-100"
              }`}
            >
              <View className={`w-2 h-2 rounded-full ${cat.dot}`} />
              <Text className={`text-[11px] font-black uppercase tracking-wider ${category === cat.value ? "text-white" : "text-slate-500"}`}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Message Composer */}
        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-5 ml-1">Message Composer</Text>
        <View className="bg-white rounded-[40px] p-8 border border-slate-50 shadow-sm mb-6">
          <View className="mb-6">
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Platform Maintenance Scheduled"
              placeholderTextColor="#CBD5E1"
              className="bg-slate-50 border border-slate-100 rounded-[24px] px-6 py-5 text-slate-900 font-bold text-sm"
            />
          </View>
          <View>
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Message Body</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Write your notification message..."
              placeholderTextColor="#CBD5E1"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-slate-50 border border-slate-100 rounded-[24px] px-6 py-5 text-slate-900 font-bold text-sm h-36"
            />
          </View>
        </View>

        {/* Preview Toggle */}
        <TouchableOpacity
          onPress={() => setShowPreview(!showPreview)}
          activeOpacity={0.8}
          className="flex-row items-center justify-between bg-white border border-slate-100 rounded-[32px] px-8 py-5 mb-6 shadow-sm"
        >
          <View className="flex-row items-center gap-3">
            <Bell size={18} color="#64748B" />
            <Text className="text-slate-700 font-black text-sm">Preview Notification</Text>
          </View>
          {showPreview ? <ChevronUp size={18} color="#94A3B8" /> : <ChevronDown size={18} color="#94A3B8" />}
        </TouchableOpacity>

        {showPreview && (
          <View className="bg-white border border-slate-100 rounded-[32px] p-6 mb-8 shadow-sm">
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-10 h-10 rounded-2xl bg-purple-600 items-center justify-center">
                <Bell size={18} color="white" />
              </View>
              <View>
                <Text className="text-slate-900 font-black text-sm">{title || "Notification Title"}</Text>
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">CodeCure Admin • Just now</Text>
              </View>
            </View>
            <Text className="text-slate-600 text-sm font-medium leading-5">
              {message || "Your message will appear here."}
            </Text>
          </View>
        )}

        {/* Send Button */}
        <TouchableOpacity
          onPress={handleSend}
          disabled={isSending || !title || !message}
          activeOpacity={0.85}
          className="overflow-hidden rounded-[32px] shadow-xl shadow-purple-200 mt-4"
        >
          <LinearGradient
            colors={title && message ? ["#7C3AED", "#6D28D9"] : ["#E2E8F0", "#CBD5E1"]}
            className="py-7 flex-row items-center justify-center gap-4"
          >
            {isSending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text className={`font-black text-sm uppercase tracking-widest ${title && message ? "text-white" : "text-slate-400"}`}>
                  Dispatch Alert
                </Text>
                <Send size={18} color={title && message ? "white" : "#94A3B8"} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
