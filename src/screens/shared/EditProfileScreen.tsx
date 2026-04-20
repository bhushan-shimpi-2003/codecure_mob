import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../api/endpoints";
import { User, Mail, Phone, Camera, Save } from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
import { AppHeader } from "../../components/AppHeader";

export default function EditProfileScreen({ navigation }: any) {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
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
        alert("Profile updated successfully!");
        navigation.goBack();
      } else {
        alert(getApiError(res.data));
      }
    } catch (e) {
      alert("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <AppHeader showBack role={user?.role} subtitle="Personal Settings" />
      <ScrollView contentContainerStyle={{ padding: 24 }}>

        <View className="items-center mb-10">
          <View className="relative">
            <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center border-4 border-white shadow-sm overflow-hidden">
               {user?.profile_picture ? (
                 <Image source={{ uri: user.profile_picture }} className="w-full h-full" />
               ) : (
                 <User size={48} color={COLORS.primary} />
               )}
            </View>
            <TouchableOpacity className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full border-2 border-white">
              <Camera size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="gap-6">
          <View>
            <Text className="text-slate-500 font-bold mb-2 ml-1">Full Name</Text>
            <Input 
              placeholder="Your Name" 
              value={name} 
              onChangeText={setName}
              leftIcon={<User size={18} color={COLORS.slate400} />}
            />
          </View>

          <View>
            <Text className="text-slate-500 font-bold mb-2 ml-1">Email Address</Text>
            <Input 
              placeholder="Your Email" 
              value={user?.email || ""} 
              editable={false}
              leftIcon={<Mail size={18} color={COLORS.slate400} />}
              className="bg-slate-50 opacity-60"
            />
            <Text className="text-[10px] text-slate-400 mt-1 ml-1 uppercase font-bold text-center">Email cannot be changed</Text>
          </View>

          <View>
            <Text className="text-slate-500 font-bold mb-2 ml-1">Phone Number</Text>
            <Input 
              placeholder="Your Phone Number" 
              value={phone} 
              onChangeText={setPhone}
               keyboardType="phone-pad"
              leftIcon={<Phone size={18} color={COLORS.slate400} />}
            />
          </View>

          <View className="mt-8">
            <Button 
              title="Save Changes" 
              onPress={handleSave} 
              isLoading={isSubmitting}
              leftIcon={<Save size={20} color="white" />}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
