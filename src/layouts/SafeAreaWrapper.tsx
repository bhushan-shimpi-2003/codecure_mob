import React from "react";
import { StatusBar, ViewProps, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
        transparent && { backgroundColor: "transparent" },
        style
      ]}
      {...props}
    >
      <StatusBar barStyle={statusBarStyle} backgroundColor={statusBarBg} translucent={transparent} />
      {children}
    </SafeAreaView>
  );
};
