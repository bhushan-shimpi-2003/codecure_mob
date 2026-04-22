import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, useWindowDimensions, Alert, ActivityIndicator, Platform } from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { useAuth } from "../../context/AuthContext";
import { authApi, notificationsApi } from "../../api/endpoints";
import { User as UserIcon, Mail, Phone, Camera, Save, ShieldCheck, Key, AtSign, Eye, EyeOff, Lock } from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { Input } from "../../components/Input";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
import { AppHeader } from "../../components/AppHeader";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const shellMaxWidth = isTablet ? 700 : undefined;

  const { user, updateUser } = useAuth();
  
  // Profile state
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your photos to update your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        handleUploadImage(selectedImage.uri);
      }
    } catch (e) {
      console.log("ImagePicker Error:", e);
      Alert.alert("Error", "Failed to open image picker. If you are on web, please ensure your browser supports this feature.");
    }
  };

  const handleUploadImage = async (uri: string) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpg`;

      // For web compatibility, we might need a different approach for FormData
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('avatar', blob, filename);
      } else {
        // @ts-ignore
        formData.append('avatar', { uri, name: filename, type });
      }

      const res = await authApi.updateAvatar(formData);
      if (isApiSuccess(res.data)) {
        const data = extractApiData<any>(res.data, {});
        const profilePicture = data.profile_picture || data.avatar;
        
        if (user) {
          updateUser({ ...user, profile_picture: profilePicture });
        }
        Alert.alert("Success", "Profile picture updated successfully.");
      } else {
        Alert.alert("Upload Failed", getApiError(res.data));
      }
    } catch (e) {
      console.log("Upload Error:", e);
      Alert.alert("Error", "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
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

        notificationsApi.send({
          user_id: user?.id || user?._id,
          title: 'Security Update',
          message: 'Your account profile information was recently updated.',
          type: 'maintenance'
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

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Alert.alert("Required", "Please fill in all password fields.");
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert("Error", "New passwords do not match.");
    }
    if (newPassword.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters long.");
    }

    setIsUpdatingPassword(true);
    try {
      const res = await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });

      if (isApiSuccess(res.data)) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        notificationsApi.send({
          user_id: user?.id || user?._id,
          title: 'Security Alert',
          message: 'Your account password was successfully changed.',
          type: 'maintenance'
        });

        Alert.alert("Success", "Your password has been changed successfully.");
      } else {
        Alert.alert("Failed", getApiError(res.data));
      }
    } catch (e) {
      Alert.alert("Error", "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} showBack role={user?.role} subtitle="Identity Management" />
      
      <ScrollView 
        className="flex-1 bg-[#F8FAFC]" 
        contentContainerStyle={{ paddingBottom: 100 }} 
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
                    <View className="w-32 h-32 rounded-full border-4 border-slate-50 overflow-hidden shadow-xl shadow-blue-900/10 bg-slate-50">
                        {isUploading ? (
                          <View className="w-full h-full items-center justify-center bg-slate-50">
                             <ActivityIndicator color={COLORS.primary} />
                          </View>
                        ) : (
                          <Image 
                            source={{ uri: user?.profile_picture || "https://ui-avatars.com/api/?name=" + (user?.name || "User") + "&background=random" }} 
                            className="w-full h-full" 
                          />
                        )}
                    </View>
                    <TouchableOpacity 
                        onPress={handlePickImage}
                        disabled={isUploading}
                        activeOpacity={0.8}
                        className="absolute bottom-0 right-0 w-11 h-11 bg-blue-600 rounded-full border-4 border-white items-center justify-center shadow-lg"
                    >
                        <Camera size={16} color="white" />
                    </TouchableOpacity>
                </View>
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mt-6">Profile Photo</Text>
                <Text className="text-slate-900 font-black text-sm mt-1 uppercase">ID: #CC-{user?.id?.substring(0,6) || "8821"}</Text>
            </View>

            {/* Basic Info Section */}
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-6 ml-2">BASIC INFORMATION</Text>
            <View className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-50 mb-10">
              <View className="gap-8">
                  <View>
                      <View className="flex-row items-center justify-between mb-4 px-2">
                          <Text className="text-slate-900 font-extrabold text-[15px]">Full Legal Name</Text>
                          <UserIcon size={16} color="#CBD5E1" />
                      </View>
                      <Input 
                          placeholder="e.g. Alex Thorne" 
                          value={name} 
                          onChangeText={setName}
                          containerClassName="rounded-[24px] h-[64px] bg-slate-50 border-slate-100 border"
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
                          containerClassName="rounded-[24px] h-[64px] bg-slate-50 border-slate-100 border"
                      />
                  </View>
              </View>

              <TouchableOpacity 
                  onPress={handleSaveProfile} 
                  disabled={isSubmitting}
                  className="mt-10 overflow-hidden rounded-[28px] shadow-lg shadow-blue-500/20"
              >
                  <LinearGradient
                      colors={['#2563EB', '#1D4ED8']}
                      className="py-5 flex-row items-center justify-center gap-3"
                  >
                      {isSubmitting ? (
                          <ActivityIndicator color="white" size="small" />
                      ) : (
                          <>
                              <Save size={18} color="white" />
                              <Text className="text-white font-black text-xs uppercase tracking-widest">Save Changes</Text>
                          </>
                      )}
                  </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Security Section */}
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-6 ml-2">SECURITY & PASSWORD</Text>
            <View className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-50 mb-10">
              <View className="gap-8">
                  <View>
                      <View className="flex-row items-center justify-between mb-4 px-2">
                          <Text className="text-slate-900 font-extrabold text-[15px]">Current Password</Text>
                          <Lock size={16} color="#CBD5E1" />
                      </View>
                      <View className="relative">
                        <Input 
                            placeholder="••••••••" 
                            value={currentPassword} 
                            onChangeText={setCurrentPassword}
                            secureTextEntry={!showPasswords}
                            containerClassName="rounded-[24px] h-[64px] bg-slate-50 border-slate-100 border pr-14"
                        />
                        <TouchableOpacity 
                          onPress={() => setShowPasswords(!showPasswords)}
                          className="absolute right-6 top-5"
                        >
                          {showPasswords ? <EyeOff size={20} color="#94A3B8" /> : <Eye size={20} color="#94A3B8" />}
                        </TouchableOpacity>
                      </View>
                  </View>

                  <View>
                      <View className="flex-row items-center justify-between mb-4 px-2">
                          <Text className="text-slate-900 font-extrabold text-[15px]">New Password</Text>
                          <Key size={16} color="#CBD5E1" />
                      </View>
                      <Input 
                          placeholder="Min. 6 characters" 
                          value={newPassword} 
                          onChangeText={setNewPassword}
                          secureTextEntry={!showPasswords}
                          containerClassName="rounded-[24px] h-[64px] bg-slate-50 border-slate-100 border"
                      />
                  </View>

                  <View>
                      <View className="flex-row items-center justify-between mb-4 px-2">
                          <Text className="text-slate-900 font-extrabold text-[15px]">Confirm New Password</Text>
                          <ShieldCheck size={16} color="#CBD5E1" />
                      </View>
                      <Input 
                          placeholder="Re-enter new password" 
                          value={confirmPassword} 
                          onChangeText={setConfirmPassword}
                          secureTextEntry={!showPasswords}
                          containerClassName="rounded-[24px] h-[64px] bg-slate-50 border-slate-100 border"
                      />
                  </View>
              </View>

              <TouchableOpacity 
                  onPress={handleUpdatePassword} 
                  disabled={isUpdatingPassword}
                  className="mt-10 bg-slate-900 rounded-[28px] py-5 items-center justify-center shadow-lg shadow-slate-900/10 flex-row gap-3"
              >
                  {isUpdatingPassword ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <ShieldCheck size={18} color="white" />
                      <Text className="text-white font-black text-xs uppercase tracking-widest">Update Security</Text>
                    </>
                  )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
                onPress={() => navigation.goBack()}
                className="py-6 rounded-[28px] border-2 border-slate-100 items-center mb-20"
            >
                <Text className="text-slate-400 font-black text-xs uppercase tracking-widest">Discard Changes</Text>
            </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
