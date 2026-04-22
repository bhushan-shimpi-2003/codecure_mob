import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  Image,
  ActivityIndicator
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { coursesApi } from "../../api/endpoints";
import { isApiSuccess } from "../../api/response";
import { ChevronLeft, Save, Trash2, Camera, Plus, Trash } from "lucide-react-native";
import { COLORS } from "../../utils/theme";

export default function AdminEditCourseScreen({ route, navigation }: any) {
  const { course } = route.params || {};
  
  const [formData, setFormData] = useState({
    title: course?.title || "",
    description: course?.description || "",
    price: String(course?.price || ""),
    category: course?.category || "",
    status: course?.status || "active"
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.title || !formData.price) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      const res = await coursesApi.update(course.id || course._id, formData);
      if (isApiSuccess(res.data)) {
        Alert.alert("Success", "Course updated successfully");
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert("Error", "Failed to update course");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this course permanently?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await coursesApi.delete(course.id || course._id);
              if (isApiSuccess(res.data)) {
                navigation.goBack();
              }
            } catch (e) {
              Alert.alert("Error", "Failed to delete course");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaWrapper bgWhite>
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-50">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <ChevronLeft size={24} color={COLORS.slate900} />
        </TouchableOpacity>
        <Text className="text-lg font-black text-slate-900">Edit Course</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving} className="p-2">
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Save size={24} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-6 bg-[#F8FAFC]">
        <View className="mb-10">
           <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mb-6">Course Thumbnail</Text>
           <TouchableOpacity className="w-full h-48 bg-slate-200 rounded-[32px] items-center justify-center overflow-hidden border-2 border-dashed border-slate-300">
              {course?.thumbnail ? (
                <Image source={{ uri: course.thumbnail }} className="w-full h-full" />
              ) : (
                <Camera size={32} color={COLORS.slate400} />
              )}
           </TouchableOpacity>
        </View>

        <View className="gap-8">
           <View>
              <Text className="text-slate-900 font-black text-sm mb-3">Course Title</Text>
              <TextInput 
                className="bg-white p-5 rounded-2xl border border-slate-100 font-bold text-slate-900"
                value={formData.title}
                onChangeText={(t) => setFormData({...formData, title: t})}
                placeholder="Enter course title"
              />
           </View>

           <View>
              <Text className="text-slate-900 font-black text-sm mb-3">Description</Text>
              <TextInput 
                className="bg-white p-5 rounded-2xl border border-slate-100 font-bold text-slate-900 h-32"
                value={formData.description}
                onChangeText={(t) => setFormData({...formData, description: t})}
                placeholder="Enter course description"
                multiline
                textAlignVertical="top"
              />
           </View>

           <View className="flex-row gap-4">
              <View className="flex-1">
                 <Text className="text-slate-900 font-black text-sm mb-3">Price (₹)</Text>
                 <TextInput 
                   className="bg-white p-5 rounded-2xl border border-slate-100 font-bold text-slate-900"
                   value={formData.price}
                   onChangeText={(t) => setFormData({...formData, price: t})}
                   placeholder="19,999"
                   keyboardType="numeric"
                 />
              </View>
              <View className="flex-1">
                 <Text className="text-slate-900 font-black text-sm mb-3">Category</Text>
                 <TextInput 
                   className="bg-white p-5 rounded-2xl border border-slate-100 font-bold text-slate-900"
                   value={formData.category}
                   onChangeText={(t) => setFormData({...formData, category: t})}
                   placeholder="Development"
                 />
              </View>
           </View>

           <TouchableOpacity 
             onPress={handleDelete}
             className="bg-rose-50 p-6 rounded-[28px] flex-row items-center justify-center border border-rose-100 mt-10 mb-20"
           >
              <Trash2 size={20} color="#F43F5E" className="mr-3" />
              <Text className="text-rose-600 font-black text-sm uppercase tracking-widest">Delete Course</Text>
           </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
