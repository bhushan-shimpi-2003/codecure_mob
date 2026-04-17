import React from "react";
import { SafeAreaView, StatusBar, ViewProps, Platform } from "react-native";
import { COLORS } from "../utils/theme";

interface SafeAreaWrapperProps extends ViewProps {
  children: React.ReactNode;
  bgWhite?: boolean;
}

export const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  bgWhite = false,
  className = "",
  style,
  ...props
}) => {
  const bgColorClass = bgWhite ? "bg-white" : "bg-slate-50";
  const statusBarStyle = bgWhite ? "dark-content" : "dark-content";
  const statusBarBg = bgWhite ? COLORS.white : COLORS.slate50;

  return (
    <SafeAreaView
      className={`flex-1 ${bgColorClass} ${className}`}
      style={[{ paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }, style]}
      {...props}
    >
      <StatusBar barStyle={statusBarStyle} backgroundColor={statusBarBg} />
      {children}
    </SafeAreaView>
  );
};
