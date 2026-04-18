import React from "react";
import { View, Text, TouchableOpacity, useWindowDimensions } from "react-native";

interface TeacherScreenHeaderProps {
  badge: string;
  title: string;
  subtitle: string;
  actionIcon?: React.ReactNode;
  onActionPress?: () => void;
}

export function TeacherScreenHeader({
  badge,
  title,
  subtitle,
  actionIcon,
  onActionPress,
}: TeacherScreenHeaderProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <View className="mx-6 mt-4 mb-4 bg-white border border-slate-100 rounded-3xl px-5 py-4 shadow-sm flex-row items-center justify-between">
      <View className="flex-1 pr-4">
        <Text className="text-[10px] font-black text-blue-600 uppercase tracking-[2px] mb-1">{badge}</Text>
        <Text className={`${isTablet ? "text-[30px]" : "text-2xl"} font-black text-slate-900`}>{title}</Text>
        <Text className="text-slate-500 mt-1 text-sm">{subtitle}</Text>
      </View>

      {actionIcon && onActionPress ? (
        <TouchableOpacity
          onPress={onActionPress}
          className={`${isTablet ? "p-4" : "p-3"} bg-slate-900 rounded-2xl`}
          activeOpacity={0.85}
        >
          {actionIcon}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
