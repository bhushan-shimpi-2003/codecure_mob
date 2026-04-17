import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from "react-native";
import { COLORS } from "../utils/theme";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  isLoading?: boolean;
  className?: string;
  textClassName?: string;
  leftIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = "primary",
  isLoading = false,
  className = "",
  textClassName = "",
  leftIcon,
  disabled,
  ...props
}) => {
  const getContainerStyles = () => {
    const base = "h-14 rounded-xl flex-row items-center justify-center px-6 ";
    switch (variant) {
      case "primary":   return base + "bg-blue-600 active:bg-blue-700 shadow-md shadow-blue-600/30 ";
      case "secondary": return base + "bg-slate-800 active:bg-slate-900 shadow-md shadow-slate-900/30 ";
      case "outline":   return base + "bg-transparent border-2 border-slate-200 active:bg-slate-50 ";
      case "ghost":     return base + "bg-transparent active:bg-slate-100 ";
    }
  };

  const getTextStyles = () => {
    const base = "text-base font-bold ";
    switch (variant) {
      case "primary":   return base + "text-white ";
      case "secondary": return base + "text-white ";
      case "outline":   return base + "text-slate-700 ";
      case "ghost":     return base + "text-slate-700 ";
    }
  };

  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className={`${getContainerStyles()} ${isDisabled ? "opacity-60" : ""} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === "outline" || variant === "ghost" ? COLORS.primary : COLORS.white} />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text className={`${getTextStyles()} ${textClassName}`}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};
