import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, useWindowDimensions, Alert } from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../api/endpoints";
import { User, Mail, Phone, Camera, Save, ArrowLeft, ShieldCheck, Key, AtSign } from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
import { AppHeader } from "../../components/AppHeader";
import { LinearGradient } from "expo-linear-gradient";

export default function EditProfileScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const shellMaxWidth = isTablet ? 700 : undefined;

  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
        return Alert.alert("Required", "Please provide your full name.");
    }
    setIsSubmitting(true);
    try {
      const res = await authApi.updateProfile({ name, phone });
      if (isApiSuccess(res.data)) {
        const data = extractApiData<any>(res.data, {});
        const nextUser = data?.user || data;

        updateUser({
          ...user!,
          ...nextUser,
          name,
          phone,
        });
        Alert.alert("Success", "Your professional profile has been updated.");
        navigation.goBack();
      } else {
        Alert.alert("Update Failed", getApiError(res.data));
      }
    } catch (e) {
        Alert.alert("Error", "Connect error while updating profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader showBack role={user?.role} subtitle="Identity Management" />
      
      <ScrollView 
        className="flex-1 bg-[#F8FAFC]" 
        contentContainerStyle={{ paddingBottom: 60 }} 
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }} className="px-6 pt-10">
            
            {/* Page Title & Context */}
            <View className="mb-10">
                <Text className="text-[34px] font-black text-slate-900 tracking-tight leading-tight">
                    Edit <Text className="text-blue-600">Profile</Text>
                </Text>
                <Text className="text-slate-400 font-bold text-sm mt-2">Manage your public identity and contact details.</Text>
            </View>

            {/* Avatar Hero Module */}
            <View className="bg-white rounded-[44px] p-10 items-center border border-white shadow-2xl shadow-slate-900/[0.04] mb-10 overflow-hidden">
                <View className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16" />
                <View className="relative">
                    <View className="w-32 h-32 rounded-full border-4 border-slate-50 overflow-hidden shadow-xl shadow-blue-900/10">
                        <Image source={{ uri: user?.profile_picture || "https://i.pravatar.cc/300?u=alex" }} className="w-full h-full" />
                    </View>
                    <TouchableOpacity 
                        className="absolute bottom-0 right-0 w-11 h-11 bg-blue-600 rounded-full border-4 border-white items-center justify-center shadow-lg"
                    >
                        <Camera size={16} color="white" />
                    </TouchableOpacity>
                </View>
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mt-6">Profile Photo</Text>
                <Text className="text-slate-900 font-black text-sm mt-1 uppercase">Student ID: #CC-{user?.id?.substring(0,6) || "8821"}</Text>
            </View>

            {/* Input Fields Section */}
            <View className="gap-8 px-2">
                <View>
                    <View className="flex-row items-center justify-between mb-4 px-2">
                        <Text className="text-slate-900 font-extrabold text-[15px]">Legal Name</Text>
                        <User size={16} color="#CBD5E1" />
                    </View>
                    <Input 
                        placeholder="e.g. Alex Thorne" 
                        value={name} 
                        onChangeText={setName}
                        containerClassName="rounded-[24px] h-[64px] bg-white border-[#F1F5F9] border"
                    />
                </View>

                <View>
                    <View className="flex-row items-center justify-between mb-4 px-2">
                        <Text className="text-slate-900 font-extrabold text-[15px]">Primary Email</Text>
                        <Mail size={16} color="#CBD5E1" />
                    </View>
                    <View className="bg-slate-100/50 border border-slate-200/40 rounded-[24px] h-16 px-6 flex-row items-center gap-4">
                        <AtSign size={20} color="#94A3B8" />
                        <View className="flex-1">
                            <Text className="text-slate-400 font-bold text-base">{user?.email}</Text>
                        </View>
                        <ShieldCheck size={18} color="#10B981" />
                    </View>
                    <Text className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-3 ml-4">Account UID linked to email address</Text>
                </View>

                <View>
                    <View className="flex-row items-center justify-between mb-4 px-2">
                        <Text className="text-slate-900 font-extrabold text-[15px]">Contact Number</Text>
                        <Phone size={16} color="#CBD5E1" />
                    </View>
                    <Input 
                        placeholder="+1 (555) 000-0000" 
                        value={phone} 
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        containerClassName="rounded-[24px] h-[64px] bg-white border-[#F1F5F9] border"
                    />
                </View>
            </View>

            {/* Action Group */}
            <View className="mt-14 px-2">
                <TouchableOpacity 
                    onPress={handleSave} 
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                    className="overflow-hidden rounded-[28px] shadow-2xl shadow-blue-500/30"
                >
                    <LinearGradient
                        colors={['#2563EB', '#1D4ED8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="py-6 flex-row items-center justify-center gap-3"
                    >
                        {isSubmitting ? (
                            <Text className="text-white font-black text-sm uppercase tracking-widest">Saving Changes...</Text>
                        ) : (
                            <>
                                <Save size={18} color="white" />
                                <Text className="text-white font-black text-sm uppercase tracking-widest">Update Profile</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    className="mt-6 py-6 rounded-[28px] border-2 border-slate-100 items-center"
                >
                    <Text className="text-slate-400 font-black text-xs uppercase tracking-widest">Discard Changes</Text>
                </TouchableOpacity>
            </View>

        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
