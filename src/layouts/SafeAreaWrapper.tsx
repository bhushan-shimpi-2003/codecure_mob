import React from "react";
import { SafeAreaView, StatusBar, ViewProps, Platform } from "react-native";
import { COLORS } from "../utils/theme";

interface SafeAreaWrapperProps extends ViewProps {
  children: React.ReactNode;
  bgWhite?: boolean;
  transparent?: boolean;
}

export const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  bgWhite = false,
  transparent = false,
  className = "",
  style,
  ...props
}) => {
  const bgColorClass = transparent ? "bg-transparent" : (bgWhite ? "bg-white" : "bg-slate-50");
  const statusBarStyle = bgWhite ? "dark-content" : "dark-content";
  const statusBarBg = transparent ? "transparent" : (bgWhite ? COLORS.white : COLORS.slate50);

  return (
    <SafeAreaView
      className={`flex-1 ${bgColorClass} ${className}`}
      style={[
        { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
        transparent && { backgroundColor: "transparent" },
        style
      ]}
      {...props}
    >
      <StatusBar barStyle={statusBarStyle} backgroundColor={statusBarBg} />
      {children}
    </SafeAreaView>
  );
};
