import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { coursesApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { Skeleton } from "../../components/Skeleton";
import { 
  Search, 
  Bell, 
  Menu, 
  Filter, 
  Plus, 
  Pencil, 
  BarChart3, 
  RotateCcw,
  LayoutGrid
} from "lucide-react-native";
import { COLORS, UPLOADS_URL } from "../../utils/theme";
import { LinearGradient } from "expo-linear-gradient";

const CATEGORIES = ["All Courses", "Development", "Data Science", "UI/UX Design", "Cybersecurity", "Cloud Computing"];

export default function AdminContentScreen({ navigation }: any) {
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All Courses");

  const fetchCourses = async () => {
    try {
      const res = await coursesApi.adminAll();
      if (isApiSuccess(res.data)) {
        const data = extractApiData<any[]>(res.data, []);
        setCourses(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.log("Error loading content", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    if (activeCategory === "All Courses") return courses;
    return courses.filter(c => (c.category || "").toLowerCase() === activeCategory.toLowerCase());
  }, [courses, activeCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  const AdminCourseCard = ({ course }: any) => {
    const imageUrl = course.thumbnail && course.thumbnail !== "no-course-photo.jpg"
      ? course.thumbnail.startsWith("http") ? course.thumbnail : `${UPLOADS_URL}/${course.thumbnail}`
      : null;

    return (
      <View className="bg-white rounded-[44px] overflow-hidden border border-slate-50 shadow-sm mb-8">
        {/* Large Thumbnail */}
        <View className="h-64 bg-slate-100 relative">
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center bg-slate-900">
               <Text className="text-white font-black opacity-20">NO PREVIEW</Text>
            </View>
          )}
          
          <LinearGradient 
            colors={['transparent', 'rgba(0,0,0,0.4)']} 
            className="absolute inset-0"
          />

          <View className="absolute top-6 left-6 bg-blue-600 px-4 py-2 rounded-xl">
            <Text className="text-white text-[10px] font-black uppercase tracking-widest">Featured</Text>
          </View>
        </View>

        {/* Info */}
        <View className="p-8">
          <View className="flex-row justify-between items-center mb-4">
             <Text className="text-blue-600 text-xs font-black uppercase tracking-widest">{course.category || "Development"}</Text>
             <Text className="text-blue-600 text-2xl font-black">₹{course.price || "19,999"}</Text>
          </View>

          <Text className="text-3xl font-black text-slate-900 leading-[38px] mb-4">
            {course.title}
          </Text>

          <Text className="text-slate-400 text-sm leading-6 mb-8" numberOfLines={2}>
            {course.description || "Master complex systems and modern architecture with industry experts."}
          </Text>

          <View className="flex-row items-center justify-between border-t border-slate-50 pt-8">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-slate-100 mr-3 overflow-hidden">
                <Image source={{ uri: 'https://i.pravatar.cc/100?u=instructor' }} className="w-full h-full" />
              </View>
              <Text className="text-slate-900 font-bold text-sm">{(course as any).instructor_name || "Dr. Alex Rivera"}</Text>
            </View>

            <TouchableOpacity 
              className="bg-slate-100 px-6 py-4 rounded-[24px] flex-row items-center"
              onPress={() => navigation.navigate('AdminEditCourse', { course })}
            >
              <Pencil size={16} color={COLORS.slate900} className="mr-2" />
              <Text className="text-slate-900 font-black text-xs uppercase tracking-widest">Edit Course</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaWrapper bgWhite>
      {/* Custom Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity className="p-2 bg-slate-50 rounded-xl">
          <Menu size={24} color={COLORS.slate900} />
        </TouchableOpacity>
        <Text className="text-blue-900 font-black text-lg">CodeCure Admin</Text>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity className="p-2 bg-slate-50 rounded-xl">
            <Search size={20} color={COLORS.slate900} />
          </TouchableOpacity>
          <View className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm">
             <Image source={{ uri: 'https://i.pravatar.cc/100?u=admin' }} className="w-full h-full" />
          </View>
        </View>
      </View>

      <ScrollView 
        className="flex-1 bg-[#F8FAFC]"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-8 pt-8 mb-10">
           <View className="bg-blue-50 px-4 py-1.5 rounded-full self-start mb-4">
              <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Curriculum</Text>
           </View>
           <Text className="text-[44px] font-black text-slate-900 leading-[48px] tracking-tighter">
              Course <Text className="text-blue-600">Academy</Text>
           </Text>
           <Text className="text-slate-400 text-base font-medium mt-2">Manage curriculum, instructors, and track course performance.</Text>
        </View>

        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mb-8"
          contentContainerStyle={{ paddingHorizontal: 32 }}
        >
          {CATEGORIES.map((cat, i) => (
            <TouchableOpacity 
              key={i} 
              onPress={() => setActiveCategory(cat)}
              className={`mr-3 px-6 py-3 rounded-2xl border ${activeCategory === cat ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-200' : 'bg-slate-100 border-slate-100'}`}
            >
              <Text className={`font-black text-xs ${activeCategory === cat ? 'text-white' : 'text-slate-500'}`}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity className="p-3 bg-slate-100 rounded-2xl">
             <Filter size={18} color={COLORS.slate400} />
          </TouchableOpacity>
        </ScrollView>

        <View className="px-6">
          {isLoading ? (
             <View className="gap-8">
               <Skeleton height={400} className="rounded-[44px]" />
               <Skeleton height={400} className="rounded-[44px]" />
             </View>
          ) : filteredCourses.length === 0 ? (
            <View className="items-center py-20 bg-white rounded-[44px] border border-slate-100">
               <Text className="text-slate-400 font-bold">No courses found in this category</Text>
            </View>
          ) : (
            filteredCourses.map((course, idx) => (
              <AdminCourseCard key={idx} course={course} />
            ))
          )}

          {/* Bottom Inventory Card */}
          <View className="bg-white rounded-[44px] p-10 border border-blue-100 shadow-sm mb-8 border-dashed items-center">
             <View className="w-14 h-14 bg-blue-600 rounded-2xl items-center justify-center mb-6 shadow-xl shadow-blue-600/30">
                <BarChart3 size={24} color="white" />
             </View>
             <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Total Inventory</Text>
             <Text className="text-[52px] font-black text-blue-900 leading-[52px] mb-4">{courses.length}</Text>
             <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-[2px] mb-8">Active courses across 6 categories</Text>
             
             <TouchableOpacity className="flex-row items-center border-b border-blue-600 pb-1">
                <Text className="text-blue-600 font-black text-xs uppercase tracking-widest mr-2">View Full Report</Text>
                <Plus size={14} color="#2563EB" />
             </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
