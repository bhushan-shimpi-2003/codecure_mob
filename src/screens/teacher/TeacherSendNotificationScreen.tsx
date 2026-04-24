import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { AppHeader } from "../../components/AppHeader";
import { notificationsApi, coursesApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import {
  Send,
  Users,
  BookOpen,
  Megaphone,
  Bell,
  AlertCircle,
  CheckCircle,
  Zap,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

// ─── Types ────────────────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: "new_lesson",
    label: "New Lesson",
    emoji: "📚",
    title: "New Lesson Published!",
    message: "A new lesson is now live in your course. Jump in and start learning!",
    type: "academy",
    color: "#2563EB",
    bg: "bg-blue-50",
    border: "border-blue-100",
    textColor: "text-blue-700",
  },
  {
    id: "assignment",
    label: "Assignment Due",
    emoji: "📝",
    title: "Assignment Reminder",
    message: "Don't forget! Your assignment submission deadline is approaching. Submit your work before time runs out.",
    type: "assignment",
    color: "#F59E0B",
    bg: "bg-amber-50",
    border: "border-amber-100",
    textColor: "text-amber-700",
  },
  {
    id: "exam",
    label: "Exam Alert",
    emoji: "🎯",
    title: "Upcoming Exam Notice",
    message: "Your exam is scheduled soon. Review your course materials and practice exercises to prepare well.",
    type: "admin",
    color: "#EF4444",
    bg: "bg-rose-50",
    border: "border-rose-100",
    textColor: "text-rose-700",
  },
  {
    id: "announcement",
    label: "Announcement",
    emoji: "📢",
    title: "Course Announcement",
    message: "Your instructor has an important update for you. Check the course for the latest details.",
    type: "info",
    color: "#7C3AED",
    bg: "bg-purple-50",
    border: "border-purple-100",
    textColor: "text-purple-700",
  },
  {
    id: "feedback",
    label: "Feedback Ready",
    emoji: "⭐",
    title: "Your Submission Has Been Graded!",
    message: "Great news! Your recent submission has been reviewed. Log in to see your score and instructor feedback.",
    type: "resolution",
    color: "#10B981",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    textColor: "text-emerald-700",
  },
  {
    id: "custom",
    label: "Custom",
    emoji: "✏️",
    title: "",
    message: "",
    type: "info",
    color: "#64748B",
    bg: "bg-slate-50",
    border: "border-slate-100",
    textColor: "text-slate-600",
  },
];

const TARGETS = [
  { label: "All Students", value: "student", icon: Users, desc: "Broadcast to every enrolled student" },
  { label: "All Teachers", value: "teacher", icon: Sparkles, desc: "Notify all instructors" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeacherSendNotificationScreen({ navigation }: any) {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [targetRole, setTargetRole] = useState("student");
  const [title, setTitle] = useState(TEMPLATES[0].title);
  const [message, setMessage] = useState(TEMPLATES[0].message);
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    coursesApi.teacherCourses().then((res) => {
      if (isApiSuccess(res.data)) {
        setCourses(extractApiData<any[]>(res.data, []));
      }
    }).catch(() => {});
  }, []);

  const handleSelectTemplate = (tpl: typeof TEMPLATES[0]) => {
    setSelectedTemplate(tpl);
    if (tpl.id !== "custom") {
      setTitle(tpl.title);
      setMessage(tpl.message);
    } else {
      setTitle("");
      setMessage("");
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Missing Fields", "Please provide both a title and message.");
      return;
    }

    setIsSending(true);
    try {
      const res = await notificationsApi.send({
        role: targetRole,
        title: title.trim(),
        message: message.trim(),
        type: selectedTemplate.type,
      });

      if (isApiSuccess(res.data)) {
        setSent(true);
        setTimeout(() => {
          setSent(false);
          navigation.goBack();
        }, 1800);
      } else {
        // Non-200 response
        Alert.alert(
          "Permission Required",
          "Only admin accounts can send broadcast notifications. Please ask your admin to send this message, or contact support to enable teacher broadcasts.",
          [{ text: "OK" }]
        );
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 403) {
        Alert.alert(
          "Admin Permission Required",
          "Broadcast notifications require admin privileges. Your message has been composed — ask your platform admin to send it, or enable teacher broadcasting in the backend settings.",
          [{ text: "Understood" }]
        );
      } else {
        Alert.alert("Error", "Failed to send notification. Please try again.");
      }
    } finally {
      setIsSending(false);
    }
  };

  // ─── Sent Success View ───────────────────────────────────────────────────

  if (sent) {
    return (
      <SafeAreaWrapper bgWhite>
        <View className="flex-1 items-center justify-center bg-[#F8FAFC] px-10">
          <View className="w-24 h-24 rounded-full bg-emerald-100 items-center justify-center mb-6">
            <CheckCircle size={44} color="#10B981" />
          </View>
          <Text className="text-3xl font-black text-slate-900 tracking-tight text-center">Dispatched!</Text>
          <Text className="text-slate-400 text-sm font-bold mt-3 text-center leading-6">
            Your notification has been sent to all {targetRole === "student" ? "students" : "teachers"}.
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  // ─── Main View ───────────────────────────────────────────────────────────

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
            <View className="bg-blue-100 px-3 py-1 rounded-full">
              <Text className="text-blue-700 text-[10px] font-black uppercase tracking-widest">Broadcast</Text>
            </View>
            <Megaphone size={14} color="#2563EB" />
          </View>
          <Text className="text-[38px] font-black text-slate-900 leading-[42px] tracking-tight">
            Notify {"\n"}<Text className="text-blue-600">Students</Text>
          </Text>
          <Text className="text-slate-400 text-sm font-bold mt-2 leading-5">
            Send announcements, reminders, and alerts to your class.
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
                  isActive ? "bg-slate-900 border-slate-900" : `${tpl.bg} ${tpl.border}`
                }`}
              >
                <Text className="text-2xl mb-2">{tpl.emoji}</Text>
                <Text
                  className={`text-[10px] font-black uppercase tracking-wider ${
                    isActive ? "text-white" : tpl.textColor
                  }`}
                >
                  {tpl.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Target Audience */}
        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-5 ml-1">Target Audience</Text>
        <View className="flex-row gap-4 mb-10">
          {TARGETS.map((t) => {
            const Icon = t.icon;
            const isActive = targetRole === t.value;
            return (
              <TouchableOpacity
                key={t.value}
                onPress={() => setTargetRole(t.value)}
                activeOpacity={0.8}
                className={`flex-1 p-6 rounded-[32px] border-2 items-center ${
                  isActive ? "bg-blue-600 border-blue-600" : "bg-white border-slate-100"
                }`}
              >
                <Icon size={22} color={isActive ? "white" : "#94A3B8"} />
                <Text className={`text-xs font-black mt-3 ${isActive ? "text-white" : "text-slate-500"}`}>
                  {t.label}
                </Text>
                <Text className={`text-[9px] font-bold mt-1 text-center ${isActive ? "text-blue-100" : "text-slate-300"}`}>
                  {t.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Message Composer */}
        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-5 ml-1">Message Composer</Text>
        <View className="bg-white rounded-[40px] p-8 border border-slate-50 shadow-sm mb-6">
          <View className="mb-6">
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Notification Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. New Lesson Available!"
              placeholderTextColor="#CBD5E1"
              className="bg-slate-50 border border-slate-100 rounded-[24px] px-6 py-5 text-slate-900 font-bold text-sm"
            />
          </View>
          <View>
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Message Body</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Write your announcement here..."
              placeholderTextColor="#CBD5E1"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-slate-50 border border-slate-100 rounded-[24px] px-6 py-5 text-slate-900 font-bold text-sm h-36"
            />
          </View>
        </View>

        {/* Live Preview Toggle */}
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

        {/* Preview Card */}
        {showPreview && (
          <View className="bg-white border border-slate-100 rounded-[32px] p-6 mb-8 shadow-sm">
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-10 h-10 rounded-2xl bg-blue-600 items-center justify-center">
                <Bell size={18} color="white" />
              </View>
              <View>
                <Text className="text-slate-900 font-black text-sm">{title || "Notification Title"}</Text>
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">CodeCure Academy • Just now</Text>
              </View>
            </View>
            <Text className="text-slate-600 text-sm font-medium leading-5">
              {message || "Your message will appear here."}
            </Text>
          </View>
        )}

        {/* Info Banner */}
        <View className="flex-row items-start gap-3 bg-amber-50 border border-amber-100 rounded-[24px] p-5 mb-10">
          <AlertCircle size={18} color="#F59E0B" />
          <Text className="text-amber-700 text-xs font-bold flex-1 leading-5">
            Teacher notifications require admin-enabled broadcast access. If you receive a permissions error, contact your admin to whitelist your account.
          </Text>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          onPress={handleSend}
          disabled={isSending || !title || !message}
          activeOpacity={0.85}
          className="overflow-hidden rounded-[32px] shadow-xl shadow-blue-200"
        >
          <LinearGradient
            colors={title && message ? ["#2563EB", "#1D4ED8"] : ["#E2E8F0", "#CBD5E1"]}
            className="py-7 flex-row items-center justify-center gap-4"
          >
            {isSending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text className={`font-black text-sm uppercase tracking-widest ${title && message ? "text-white" : "text-slate-400"}`}>
                  Send Notification
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
