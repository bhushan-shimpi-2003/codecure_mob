import React from "react";
import { View, Text, TouchableOpacity, useWindowDimensions } from "react-native";

interface StudentScreenHeaderProps {
  badge: string;
  title: string;
  subtitle: string;
  actionIcon?: React.ReactNode;
  onActionPress?: () => void;
}

export function StudentScreenHeader({
  badge,
  title,
  subtitle,
  actionIcon,
  onActionPress,
}: StudentScreenHeaderProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <View className="mx-6 mt-4 mb-4 bg-blue-600 rounded-3xl px-5 py-5 flex-row items-center justify-between overflow-hidden">
      <View className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/15" />
      <View className="absolute -bottom-10 -left-8 w-24 h-24 rounded-full bg-blue-500/40" />

      <View className="flex-1 pr-4">
        <Text className="text-[10px] font-black text-blue-100 uppercase tracking-[2px] mb-1">{badge}</Text>
        <Text className={`${isTablet ? "text-[30px]" : "text-[26px]"} font-black text-white`}>{title}</Text>
        <Text className="text-blue-100 mt-1 text-sm">{subtitle}</Text>
      </View>

      {actionIcon && onActionPress ? (
        <TouchableOpacity
          onPress={onActionPress}
          className={`${isTablet ? "p-4" : "p-3"} bg-white/20 rounded-2xl border border-white/40`}
          activeOpacity={0.85}
        >
          {actionIcon}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
