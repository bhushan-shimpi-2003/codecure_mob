import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  style?: object;
  className?: string; // Additional classes for NativeWind
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 20,
  style,
  className = "",
}) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { width: width as any, height: height as any },
        animatedStyle,
        style,
      ]}
      className={`bg-slate-200 rounded-md ${className}`}
    />
  );
};
