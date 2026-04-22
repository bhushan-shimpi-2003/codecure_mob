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
      className="bg-white rounded-[48px] overflow-hidden border border-white shadow-2xl shadow-slate-900/[0.03] mb-8 p-3"
    >
      {/* Thumbnail Container */}
      <View className="h-60 bg-slate-50 w-full rounded-[38px] overflow-hidden relative">
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="flex-1 items-center justify-center bg-slate-900">
             <GraduationCap size={48} color="white" />
             <Text className="text-white font-black text-xs uppercase mt-3 tracking-widest">{course.level || "Beginner"}</Text>
          </View>
        )}
        
        {/* Rating Floating Badge */}
        <View className="absolute top-5 right-5 bg-white px-4 py-2 rounded-2xl flex-row items-center shadow-lg">
           <Text className="text-slate-900 text-xs font-black mr-1.5">{rating}</Text>
           <Star size={12} color="#F59E0B" fill="#F59E0B" />
        </View>

        {isEnrolled ? (
          <View className="absolute top-5 left-5 bg-blue-600 px-4 py-2 rounded-2xl shadow-lg">
            <Text className="text-white text-[10px] font-black uppercase tracking-[2px]">Enrolled</Text>
          </View>
        ) : null}
      </View>

      {/* Content */}
      <View className="p-6">
        <View className="flex-row justify-between items-start mb-3">
            <Text className="text-2xl font-black text-slate-900 flex-1 leading-tight tracking-tight" numberOfLines={2}>
                {course.title}
            </Text>
        </View>
        
        <Text className="text-slate-400 text-sm font-bold leading-6 mb-8" numberOfLines={2}>
            {(course as any).description || "Master industry-standard practices, high-concurrency patterns, and modern architecture with CodeCure."}
        </Text>

        {/* Footer */}
        <View className="flex-row items-center justify-between pt-2 border-t border-slate-50">
          <View>
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Lead Instructor</Text>
            <Text className="text-slate-900 text-xs font-black uppercase tracking-tight">{instructorName}</Text>
          </View>
          
          <TouchableOpacity 
            onPress={onPress}
            className="bg-slate-900 px-8 py-4 rounded-2xl shadow-lg shadow-slate-200"
          >
             <Text className="text-white text-[11px] font-black uppercase tracking-widest">
                {isEnrolled ? 'Open' : 'Enroll'}
             </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

