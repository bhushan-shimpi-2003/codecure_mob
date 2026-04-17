import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TextInputProps,
  TouchableOpacity,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { COLORS } from "../utils/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  isPassword = false,
  className = "",
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View className={`w-full mb-4 ${className}`}>
      {label && (
        <Text className="text-sm font-semibold text-slate-700 mb-1.5 ml-1">
          {label}
        </Text>
      )}

      <View
        className={`w-full h-14 flex-row items-center px-4 bg-slate-50 border rounded-xl overflow-hidden ${
          error
            ? "border-red-400 bg-red-50"
            : isFocused
            ? "border-blue-500 bg-white"
            : "border-slate-200"
        }`}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}

        <TextInput
          className="flex-1 h-full text-base text-slate-900 font-medium"
          placeholderTextColor={COLORS.slate400}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !isPasswordVisible}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            className="p-2 -mr-2"
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={COLORS.slate500} />
            ) : (
              <Eye size={20} color={COLORS.slate500} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text className="text-xs font-medium text-red-500 mt-1.5 ml-1">
          {error}
        </Text>
      )}
    </View>
  );
};
