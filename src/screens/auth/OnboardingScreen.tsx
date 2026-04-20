import React from "react";
import { View, Text, TouchableOpacity, Image, Dimensions, StatusBar } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { GraduationCap, ArrowRight, Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function OnboardingScreen({ navigation }: Props) {
  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#2563EB", "#1E40AF", "#1E3A8A"]}
        className="flex-1"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Background blobs for depth */}
        <View className="absolute top-[-50] left-[-50] w-[300] h-[300] rounded-full bg-blue-400 opacity-20" />
        <View className="absolute bottom-[-100] right-[-100] w-[400] h-[400] rounded-full bg-blue-900 opacity-30" />

        <SafeAreaWrapper transparent>
          <View className="flex-1 px-8 pt-8 pb-12">
            {/* Top Logo Section */}
            <View className="flex-row items-center mb-16">
                <View className="bg-white/20 p-2.5 rounded-2xl mr-3 border border-white/30">
                   <GraduationCap size={28} color="#FFF" />
                </View>
                <View>
                    <Text className="text-2xl font-black tracking-tight text-white leading-tight">CodeCure</Text>
                    <Text className="text-xs font-black text-blue-200 uppercase tracking-[3px]">Academy</Text>
                </View>
            </View>

            {/* Illustration Area */}
            <View className="flex-1 justify-center items-center">
                <View className="w-full aspect-square relative items-center justify-center">
                    {/* Floating circular glow */}
                    <View className="absolute w-[90%] h-[90%] bg-white/5 rounded-full" />
                    
                    <View className="w-[75%] h-[75%] bg-white/10 rounded-[60px] items-center justify-center border border-white/20 shadow-2xl">
                       <GraduationCap size={100} color="white" opacity={0.9} />
                       
                       {/* Floating UI elements mockup */}
                       <View className="absolute -top-6 -right-6 bg-white p-4 rounded-3xl shadow-xl">
                          <Sparkles size={28} color="#2563EB" />
                       </View>
                       
                       <View className="absolute bottom-6 -left-6 bg-blue-500/80 p-3 rounded-2xl border border-white/40">
                          <Text className="text-white font-black text-[10px] uppercase tracking-widest">Expert Led</Text>
                       </View>
                    </View>
                </View>
            </View>

            {/* Content Section */}
            <View className="mt-8">
                <Text className="text-[38px] font-black text-white leading-[42px] tracking-tight mb-6">
                    Master Your{"\n"}
                    Coding Career
                </Text>
                <Text className="text-blue-100 text-[17px] font-medium leading-7 mb-12 opacity-90">
                    Step into the world of professional engineering with our expert-led modules and interactive projects.
                </Text>

                <TouchableOpacity 
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate("Login")}
                    className="w-full bg-white flex-row items-center justify-between p-6 rounded-[32px] shadow-2xl shadow-blue-900/50"
                >
                    <Text className="text-blue-700 text-lg font-black tracking-tight">Get Started</Text>
                    <View className="bg-blue-600 p-2 rounded-full">
                        <ArrowRight size={24} color="white" />
                    </View>
                </TouchableOpacity>
            </View>
          </View>
        </SafeAreaWrapper>
      </LinearGradient>
    </View>
  );
}
