import React, { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Mail, ArrowLeft } from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    setIsLoading(true);
    // Simulate reset logic
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert("Success", "Password reset instructions have been sent to your email.");
      navigation.goBack();
    }, 2000);
  };

  return (
    <SafeAreaWrapper bgWhite>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-surface"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="px-6 py-4 flex-row items-center bg-white/70">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
              <ArrowLeft size={24} color="#004ac6" />
            </TouchableOpacity>
            <Text className="text-lg font-bold tracking-tighter text-primary">Recovery Portal</Text>
          </View>

          <View className="px-6 pt-8 pb-12 items-center">
            {/* Illustration */}
            <View className="w-full aspect-[16/9] rounded-[32px] overflow-hidden mb-10 shadow-2xl shadow-primary/10">
              <Image 
                source={require("../../assets/stitch/forgot_password_screen_img.png")}
                className="w-full h-full"
                resizeMode="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(247, 249, 251, 0.4)"]}
                className="absolute inset-0"
              />
            </View>

            <View className="w-full items-center mb-10">
              <Text className="text-3xl font-bold tracking-tight text-on-surface mb-2">Lost Your Way?</Text>
              <Text className="text-on-surface-variant text-center font-medium opacity-80">
                Enter your registered email below to receive a secure password reset link.
              </Text>
            </View>

            {/* Form Card */}
            <View 
              className="w-full p-8 rounded-[32px] bg-white border border-white/40 shadow-2xl"
              style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 40, elevation: 8 }}
            >
              <View className="space-y-6">
                <Input
                  label="REGISTERED EMAIL"
                  placeholder="scholar@codecure.edu"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  leftIcon={<Mail size={18} color="#737686" />}
                />

                <Button 
                  title="Send Recovery Link" 
                  onPress={handleReset} 
                  isLoading={isLoading}
                  className="mt-4"
                />
              </View>

              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                className="mt-10 items-center"
              >
                <Text className="text-on-surface-variant text-sm font-medium">
                  Remembered your password? <Text className="text-primary font-bold">Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}
