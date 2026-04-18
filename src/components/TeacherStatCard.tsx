import React from "react";
import { View, Text, TouchableOpacity, useWindowDimensions } from "react-native";
import type { LucideIcon } from "lucide-react-native";

interface TeacherStatCardProps {
  label: string;
  value: string | number;
  Icon: LucideIcon;
  tone?: "blue" | "emerald" | "amber" | "violet" | "slate";
  onPress?: () => void;
}

const toneMap = {
  blue: {
    iconWrap: "bg-blue-50",
    iconColor: "text-blue-600",
    value: "text-blue-700",
  },
  emerald: {
    iconWrap: "bg-emerald-50",
    iconColor: "text-emerald-600",
    value: "text-emerald-700",
  },
  amber: {
    iconWrap: "bg-amber-50",
    iconColor: "text-amber-600",
    value: "text-amber-700",
  },
  violet: {
    iconWrap: "bg-violet-50",
    iconColor: "text-violet-600",
    value: "text-violet-700",
  },
  slate: {
    iconWrap: "bg-slate-100",
    iconColor: "text-slate-600",
    value: "text-slate-800",
  },
};

export function TeacherStatCard({
  label,
  value,
  Icon,
  tone = "blue",
  onPress,
}: TeacherStatCardProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const cardWidth = width >= 1100 ? "31.5%" : "47%";
  const t = toneMap[tone];

  return (
    <TouchableOpacity
      className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-4"
      style={{ width: cardWidth, padding: isTablet ? 18 : 16 }}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.85}
    >
      <View className={`${t.iconWrap} ${isTablet ? "w-11 h-11" : "w-10 h-10"} rounded-2xl items-center justify-center mb-3`}>
        <Icon size={isTablet ? 20 : 18} className={t.iconColor} />
      </View>
      <Text className={`${isTablet ? "text-2xl" : "text-xl"} font-black ${t.value}`}>{value}</Text>
      <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{label}</Text>
    </TouchableOpacity>
  );
}
