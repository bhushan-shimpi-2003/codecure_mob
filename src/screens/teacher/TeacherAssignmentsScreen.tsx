import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { assignmentsApi, coursesApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { COLORS } from "../../utils/theme";
import {
  ClipboardList,
  Plus,
  Clock,
  Trash2,
  BookOpen,
  Calendar,
  CloudUpload,
  Edit2,
  ChevronDown,
  Layout,
  Code,
  Database,
  PenTool,
  Users,
} from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";

export default function TeacherAssignmentsScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [coursePickerVisible, setCoursePickerVisible] = useState(false);

  const fetchAll = async () => {
    try {
      const coursesRes = await coursesApi.teacherCourses();
      if (isApiSuccess(coursesRes.data)) {
        const courseList = extractApiData<any[]>(coursesRes.data, []);
        setCourses(courseList);
        if (courseList.length > 0 && !selectedCourseId) {
          setSelectedCourseId(String(courseList[0]?.id || courseList[0]?._id));
        }

        // Fetch assignments for the first course initially or all
        const allAssignments: any[] = [];
        await Promise.all(
          courseList.map(async (c) => {
            const aRes = await assignmentsApi.byCourse(String(c.id || c._id));
            if (isApiSuccess(aRes.data)) {
              const data = extractApiData<any[]>(aRes.data, []);
              data.forEach(a => allAssignments.push({ ...a, courseTitle: c.title }));
            }
          })
        );
        setAssignments(allAssignments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch (e) {
      console.log("Error fetching assignments", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !selectedCourseId) {
      Alert.alert("Error", "Please provide a title and select a course.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await assignmentsApi.create({
        course_id: selectedCourseId,
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate.trim(),
      });
      if (isApiSuccess(res.data)) {
        Alert.alert("Success", "Assignment published successfully");
        setTitle("");
        setDescription("");
        setDueDate("");
        fetchAll();
      }
    } catch (e) {
      Alert.alert("Error", "Failed to create assignment");
    } finally {
      setIsCreating(false);
    }
  };

  const getIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("python") || t.includes("algorithm") || t.includes("logic")) return <Code size={20} color="#2563EB" />;
    if (t.includes("database") || t.includes("sql") || t.includes("data")) return <Database size={20} color="#0891B2" />;
    return <PenTool size={20} color="#64748B" />;
  };

  const getBorderColor = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("python")) return "#2563EB";
    if (t.includes("database")) return "#0891B2";
    return "#94A3B8";
  };

  return (
    <SafeAreaWrapper>
      <AppHeader navigation={navigation} role="Teacher" />
      <ScrollView
        className="flex-1 bg-[#F8FAFC]"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} />}
      >
        <View className="px-6 pt-6">
          <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1">MANAGEMENT CONSOLE</Text>
          <Text className="text-4xl font-black text-slate-900 mb-2">Assignment Lab</Text>
          <Text className="text-slate-500 text-sm leading-5 mb-8">
            Design, schedule, and oversee student performance through curated technical challenges.
          </Text>

          {/* Create Form Card */}
          <View className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-50 mb-10">
            <View className="flex-row items-center mb-6">
              <View className="w-10 h-10 rounded-2xl bg-blue-600 items-center justify-center mr-3">
                <Plus size={20} color="white" />
              </View>
              <Text className="text-lg font-black text-slate-900">Create Assignment</Text>
            </View>

            <View className="gap-6">
              <View>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">ASSIGNMENT TITLE</Text>
                <TextInput
                  placeholder="e.g. Advanced React Hooks Mastery"
                  className="bg-slate-50 rounded-2xl px-5 py-4 text-slate-900 text-sm font-medium"
                  placeholderTextColor="#94A3B8"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">DESCRIPTION</Text>
                <TextInput
                  placeholder="Detail the technical requirements..."
                  className="bg-slate-50 rounded-3xl px-5 py-4 text-slate-900 text-sm h-32"
                  placeholderTextColor="#94A3B8"
                  multiline
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">DUE DATE</Text>
                  <View className="bg-slate-50 rounded-2xl px-5 py-4 flex-row items-center">
                    <TextInput
                      placeholder="mm/dd/yy"
                      className="flex-1 text-slate-900 text-sm"
                      placeholderTextColor="#94A3B8"
                      value={dueDate}
                      onChangeText={setDueDate}
                    />
                    <Calendar size={14} color="#94A3B8" />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">MODULE</Text>
                  <TouchableOpacity 
                    onPress={() => setCoursePickerVisible(true)} 
                    className="bg-slate-50 rounded-2xl px-5 py-4 flex-row items-center justify-between"
                  >
                    <Text className="text-slate-900 text-xs font-medium" numberOfLines={1}>
                      {courses.find(c => String(c.id || c._id) === selectedCourseId)?.title || "Select Module"}
                    </Text>
                    <ChevronDown size={14} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">ATTACHMENTS</Text>
                <TouchableOpacity className="border-2 border-dashed border-slate-100 rounded-3xl p-6 items-center justify-center bg-slate-50/30">
                  <CloudUpload size={20} color="#94A3B8" />
                  <Text className="text-slate-400 text-[11px] font-medium mt-2">Drop PDF or ZIP files here</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                onPress={handleCreate}
                disabled={isCreating}
                className="bg-blue-600 rounded-[20px] py-5 items-center justify-center shadow-lg shadow-blue-200"
              >
                {isCreating ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white font-black text-sm">PUBLISH ASSIGNMENT</Text>}
              </TouchableOpacity>
            </View>
          </View>

          {/* Active Submissions Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <Text className="text-xl font-black text-slate-900">Active Submissions</Text>
              <View className="bg-blue-100 px-2 py-0.5 rounded-full ml-3">
                <Text className="text-[10px] font-black text-blue-600">{assignments.length}</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text className="text-blue-600 text-[11px] font-black">View Archived</Text>
            </TouchableOpacity>
          </View>

          {/* Assignment List */}
          <View className="gap-6">
            {assignments.map((item, idx) => {
              const aId = String(item.id || item._id);
              return (
                <TouchableOpacity 
                  key={aId} 
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate("TeacherSubmissions", { assignmentId: aId, assignmentTitle: item.title })}
                  className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-50 flex-row"
                >
                  <View className="w-1.5" style={{ backgroundColor: getBorderColor(item.title) }} />
                  <View className="flex-1 p-6 flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center mr-4">
                        {getIcon(item.title)}
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-black text-slate-900 leading-5 mb-1" numberOfLines={1}>{item.title}</Text>
                        <View className="flex-row items-center">
                          <Calendar size={12} color="#94A3B8" />
                          <Text className="text-[10px] font-bold text-slate-400 ml-1">
                            {item.due_date ? new Date(item.due_date).toLocaleDateString() : "No deadline"}
                          </Text>
                          <View className="flex-row items-center ml-4">
                             <Users size={12} color="#2563EB" />
                             <Text className="text-[10px] font-black text-blue-600 ml-1">Pending Reviews</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center">
                       <Edit2 size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Empty State Illustration Placeholder */}
            <View className="border-2 border-dashed border-slate-100 rounded-[40px] p-10 items-center justify-center mt-4">
               <View className="w-16 h-16 rounded-full bg-slate-50 items-center justify-center mb-4">
                  <Layout size={24} color="#CBD5E1" />
               </View>
               <Text className="text-slate-400 text-center text-xs font-medium leading-5 px-6">
                 Plan your curriculum ahead.{"\n"}Submissions automatically sync here.
               </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Course Picker Modal */}
      <Modal
        visible={coursePickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCoursePickerVisible(false)}
      >
        <View className="flex-1 bg-slate-900/50 justify-end">
          <View className="bg-white rounded-t-[40px] p-8 h-[60%]">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-xl font-black text-slate-900">Select Module</Text>
              <TouchableOpacity onPress={() => setCoursePickerVisible(false)}>
                <Text className="text-blue-600 font-bold">Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {courses.map((course) => {
                const cid = String(course.id || course._id);
                const selected = cid === selectedCourseId;
                return (
                  <TouchableOpacity
                    key={cid}
                    onPress={() => {
                      setSelectedCourseId(cid);
                      setCoursePickerVisible(false);
                    }}
                    className={`p-5 rounded-3xl mb-3 border ${selected ? "bg-blue-50 border-blue-100" : "bg-slate-50 border-transparent"}`}
                  >
                    <Text className={`font-bold ${selected ? "text-blue-600" : "text-slate-700"}`}>
                      {course.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}

