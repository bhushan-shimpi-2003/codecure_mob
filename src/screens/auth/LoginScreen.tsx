import React, { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  Alert,
} from "react-native";
import { Mail, Lock, GraduationCap } from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../api/endpoints";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { COLORS } from "../../utils/theme";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      const payload = res.data;
      if (isApiSuccess(payload)) {
        const data = extractApiData<any>(payload, {});
        const nextToken = data?.session?.access_token || data?.access_token || data?.token;
        const nextUser = data?.user || data;
        const normalizedUser =
          nextUser?.id || !nextUser?._id
            ? nextUser
            : { ...nextUser, id: nextUser._id };

        if (!nextToken || !normalizedUser?.id) {
          Alert.alert("Login Failed", "Invalid login response from server.");
          return;
        }

        // Hydrate context, root navigator automatically routes to Main due to state change
        await login(nextToken, normalizedUser);
      } else {
        Alert.alert("Login Failed", getApiError(payload));
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.error || "Could not connect to the server."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaWrapper bgWhite>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Image Area */}
          <View className="h-64 bg-blue-900 justify-end pb-8 px-6 rounded-b-[40px] overflow-hidden">
            <View className="absolute inset-0 bg-blue-900/60" />
            <View className="flex-row items-center gap-2 mb-2 relative z-10">
              <View className="bg-white/20 p-2 rounded-xl">
                <GraduationCap size={24} color="#FFF" />
              </View>
              <Text className="text-white font-bold text-xl tracking-tight">
                CodeCure Academy
              </Text>
            </View>
            <Text className="text-white text-3xl font-bold leading-tight relative z-10">
              Welcome back
            </Text>
            <Text className="text-blue-100 font-medium mt-1 relative z-10">
              Sign in to continue your learning journey
            </Text>
          </View>

          {/* Form Area */}
          <View className="px-6 pt-10 pb-8 flex-1">
            <Input
              label="Email Address"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={20} color={COLORS.slate400} />}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              isPassword
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={20} color={COLORS.slate400} />}
            />

            <View className="flex-row justify-end mb-8 mt-1">
              <Text className="text-blue-600 font-semibold">
                Forgot Password?
              </Text>
            </View>

            <Button title="Sign In" onPress={handleLogin} isLoading={isLoading} />

            <View className="flex-row justify-center mt-8">
              <Text className="text-slate-500 font-medium">
                Don't have an account?{" "}
              </Text>
              <Text
                className="text-blue-600 font-bold"
                onPress={() => navigation.navigate("Signup")}
              >
                Sign up
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}
