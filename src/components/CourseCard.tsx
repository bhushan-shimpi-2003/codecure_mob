import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Star, GraduationCap } from "lucide-react-native";
import { UPLOADS_URL, COLORS } from "../utils/theme";

interface Course {
  id: string;
  slug: string;
  title: string;
  thumbnail?: string;
  level?: string;
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

  const instructorName = (course as any)?.profiles?.name || (course as any)?.instructor?.name || "Expert Mentor";
  const duration = (course as any)?.duration || "12h + Content";
  const rating = (course as any)?.rating || 4.8;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-sm mb-6 p-2"
    >
      {/* Thumbnail Container */}
      <View className="h-56 bg-slate-100 w-full rounded-[34px] overflow-hidden relative">
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="flex-1 items-center justify-center bg-slate-900">
             <GraduationCap size={48} color="white" />
             <Text className="text-white font-black text-xs uppercase mt-2">{course.level || "Beginner"}</Text>
          </View>
        )}
        
        {/* Rating Floating Badge */}
        <View className="absolute top-4 right-4 bg-white/95 px-3 py-1 rounded-full flex-row items-center shadow-sm">
           <Text className="text-slate-900 text-[11px] font-black mr-1">{rating}</Text>
           <Star size={10} color={COLORS.warning} fill={COLORS.warning} />
        </View>

        {isEnrolled ? (
          <View className="absolute top-4 left-4 bg-emerald-600 px-3 py-1 rounded-full shadow-sm">
            <Text className="text-white text-[10px] font-black uppercase tracking-wider">Mastering</Text>
          </View>
        ) : null}
      </View>

      {/* Content */}
      <View className="p-5 px-3">
        <View className="flex-row justify-between items-start mb-2">
            <Text className="text-xl font-black text-slate-900 flex-1 mr-2" numberOfLines={1}>
                {course.title}
            </Text>
            {/* Small subtle rating on text side too? No, keep it clean like screenshot */}
        </View>
        
        <Text className="text-slate-400 text-xs font-medium leading-5 mb-5" numberOfLines={2}>
            {(course as any).description || "Master industry-standard practices, high-concurrency patterns, and modern architecture with CodeCure."}
        </Text>

        {/* Footer */}
        <View className="flex-row items-center justify-between pt-1">
          <View className="flex-row items-center">
            <Text className="text-slate-500 text-[11px] font-bold uppercase tracking-tight">{duration} • </Text>
            <Text className="text-slate-900 text-[11px] font-black uppercase tracking-tight">{instructorName}</Text>
          </View>
          
          <TouchableOpacity 
            onPress={onPress}
            className={`px-6 py-2 rounded-2xl ${isEnrolled ? 'bg-emerald-50' : 'bg-slate-100'}`}
          >
             <Text className={`text-[11px] font-black uppercase tracking-widest ${isEnrolled ? 'text-emerald-600' : 'text-blue-600'}`}>
                {isEnrolled ? 'View' : 'Enroll'}
             </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

