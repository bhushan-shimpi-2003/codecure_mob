import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { Star, GraduationCap } from "lucide-react-native";
import { UPLOADS_URL, COLORS } from "../utils/theme";

interface Course {
  id: string;
  slug: string;
  title: string;
  thumbnail: string;
  level: string;
  price: number | null;
}

interface CourseCardProps {
  course: Course;
  onPress: () => void;
  isEnrolled?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onPress, isEnrolled = false }) => {
  const imageUrl =
    course.thumbnail && course.thumbnail !== "no-course-photo.jpg"
      ? course.thumbnail.startsWith("http")
        ? course.thumbnail
        : `${UPLOADS_URL}/${course.thumbnail}`
      : null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm mb-6 h-[330px]"
    >
      {/* Thumbnail */}
      <View className="h-44 bg-slate-100 w-full items-center justify-center relative">
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <GraduationCap size={48} color={COLORS.slate300} />
        )}
        
        {/* Level Badge */}
        <View className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full shadow-sm">
          <Text className="text-blue-700 text-xs font-bold capitalize">
            {course.level || "Beginner"}
          </Text>
        </View>

        {isEnrolled ? (
          <View className="absolute top-4 right-4 bg-emerald-600 px-3 py-1 rounded-full shadow-sm">
            <Text className="text-white text-[10px] font-black uppercase tracking-wider">Enrolled</Text>
          </View>
        ) : null}
      </View>

      {/* Content */}
      <ScrollView
        className="p-5 flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <Text
          className="text-lg font-bold text-slate-900 mb-3"
          numberOfLines={2}
        >
          {course.title}
        </Text>

        <View className="flex-row items-center gap-4 mb-4">
          <View className="flex-row items-center">
            <Star size={16} color={COLORS.warning} fill={COLORS.warning} />
            <Text className="text-slate-600 text-sm font-medium ml-1">4.8</Text>
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-between pt-4 border-t border-slate-100">
          {isEnrolled ? (
            <Text className="text-lg font-extrabold text-emerald-600">Enrolled</Text>
          ) : (
            <Text className="text-xl font-extrabold text-slate-900">
              {course.price ? `₹${course.price}` : "Free"}
            </Text>
          )}
          <View className="bg-blue-50 px-4 py-2 rounded-full">
             <Text className="text-blue-700 text-sm font-bold">Details</Text>
          </View>
        </View>
      </ScrollView>
    </TouchableOpacity>
  );
};
