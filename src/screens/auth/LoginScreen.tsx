import React, { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  Alert,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Mail, Lock, GraduationCap, ArrowRight } from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../api/endpoints";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { COLORS } from "../../utils/theme";

const { width } = Dimensions.get("window");

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
          showsVerticalScrollIndicator={false}
        >
          {/* Header Image Area with decorative elements */}
          <View className="h-72 bg-blue-600 justify-end pb-10 px-6 rounded-b-[48px] overflow-hidden">
            {/* Decorative background shapes */}
            <View 
              className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 rounded-full opacity-30" 
              style={{ transform: [{ scale: 1.5 }] }}
            />
            <View 
              className="absolute top-20 -left-10 w-24 h-24 bg-blue-400 rounded-full opacity-20" 
            />
            
            <View className="flex-row items-center gap-2 mb-4 relative z-10">
              <View className="bg-white/20 p-2.5 rounded-2xl">
                <GraduationCap size={28} color="#FFF" />
              </View>
              <Text className="text-white font-bold text-2xl tracking-tight">
                CodeCure
              </Text>
            </View>
            <Text className="text-white text-4xl font-extrabold leading-tight relative z-10">
              Welcome{"\n"}Back!
            </Text>
            <Text className="text-blue-100/80 font-medium mt-2 text-base relative z-10">
              Unlock your coding potential with us.
            </Text>
          </View>

          {/* Form Area */}
          <View className="px-6 pt-12 pb-8 flex-1">
            <View className="space-y-1 mb-8">
              <Text className="text-slate-900 text-2xl font-bold">Sign In</Text>
              <Text className="text-slate-500 font-medium">Please enter your details to continue</Text>
            </View>

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

            <TouchableOpacity className="self-end mb-8">
              <Text className="text-blue-600 font-bold">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <Button 
              title="Sign In" 
              onPress={handleLogin} 
              isLoading={isLoading}
              className="mt-2"
              leftIcon={<ArrowRight size={20} color="white" />}
            />

            <View className="flex-row justify-center mt-10">
              <Text className="text-slate-500 font-medium text-base">
                New to CodeCure?{" "}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                <Text className="text-blue-600 font-bold text-base">
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}
