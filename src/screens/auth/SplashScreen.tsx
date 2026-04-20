import React, { useEffect } from "react";
import { View, Text, Image, StatusBar, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GraduationCap } from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

const { width, height } = Dimensions.get("window");

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Onboarding");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View className="flex-1 bg-[#004ac6] overflow-hidden">
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Main Gradient Background */}
      <LinearGradient
        colors={["#004ac6", "#2563eb"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Center Content */}
      <View className="flex-1 items-center justify-center px-8">
        <View className="items-center">
          {/* Logo Container */}
          <View className="mb-8 relative items-center justify-center">
            {/* Outer Glass Ring */}
            <View
              style={{
                position: "absolute",
                width: 150,
                height: 150,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.10)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.20)",
                transform: [{ scale: 1.15 }],
              }}
            />

            {/* Logo Box */}
            <View
              className="w-24 h-24 rounded-[32px] bg-white items-center justify-center"
              style={{
                shadowColor: "#2563eb",
                shadowOpacity: 0.45,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 10 },
                elevation: 18,
              }}
            >
              <GraduationCap size={58} color="#004ac6" fill="#004ac6" />
            </View>
          </View>

          {/* Title */}
          <Text className="text-white text-[36px] font-extrabold tracking-tight text-center">
            CodeCure Academy
          </Text>

          {/* Tagline */}
          <Text
            className="text-center mt-4 text-[#DBE1FF] text-sm uppercase font-semibold"
            style={{ letterSpacing: 3 }}
          >
            Learn. Build. Get Hired.
          </Text>
        </View>
      </View>

      {/* Bottom Branding */}
      <View className="absolute bottom-12 left-0 right-0 items-center opacity-60">
        <Text
          className="text-white/50 text-[10px] font-bold uppercase mb-2"
          style={{ letterSpacing: 3 }}
        >
          Powered by Intellect
        </Text>

        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.35)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: 50,
            height: 1,
          }}
        />
      </View>
    </View>
  );
}
