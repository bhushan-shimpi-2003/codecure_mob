import React, { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Mail, Lock, User, Phone, GraduationCap } from "lucide-react-native";
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

export default function SignupScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSignup = async () => {
    if (!name || !phone || !email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.signup({ name, email, password, phone });
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
          Alert.alert("Signup Failed", "Invalid signup response from server.");
          return;
        }

        await login(nextToken, normalizedUser);
      } else {
        Alert.alert("Signup Failed", getApiError(payload));
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
          <View className="h-48 bg-blue-900 justify-end pb-8 px-6 rounded-b-[40px] overflow-hidden">
             <View className="absolute inset-0 bg-blue-900/60" />
            <Text className="text-white text-3xl font-bold leading-tight relative z-10">
              Create Account
            </Text>
            <Text className="text-blue-100 font-medium mt-1 relative z-10">
              Join thousands of learners today
            </Text>
          </View>

          <View className="px-6 pt-8 pb-8 flex-1">
            <Input
              label="Full Name"
              placeholder="e.g. John Doe"
              value={name}
              onChangeText={setName}
              leftIcon={<User size={20} color={COLORS.slate400} />}
            />

            <Input
              label="Mobile Number"
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              leftIcon={<Phone size={20} color={COLORS.slate400} />}
            />

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
              placeholder="Create a password"
              isPassword
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={20} color={COLORS.slate400} />}
            />

            <Button
              title="Create Account"
              onPress={handleSignup}
              isLoading={isLoading}
              className="mt-4"
            />

            <View className="flex-row justify-center mt-8">
              <Text className="text-slate-500 font-medium">
                Already have an account?{" "}
              </Text>
              <Text
                className="text-blue-600 font-bold"
                onPress={() => navigation.navigate("Login")}
              >
                Sign in
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}
