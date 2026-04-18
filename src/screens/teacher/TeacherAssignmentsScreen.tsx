import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  useWindowDimensions,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { assignmentsApi, coursesApi } from "../../api/endpoints";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
import { Skeleton } from "../../components/Skeleton";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { COLORS } from "../../utils/theme";
import {
  ClipboardList,
  Plus,
  Clock3,
  Trash2,
  BookOpen,
  ChevronDown,
} from "lucide-react-native";
import { TeacherScreenHeader } from "../../components/TeacherScreenHeader";
import { TeacherStatCard } from "../../components/TeacherStatCard";

export default function TeacherAssignmentsScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 30 : 24;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [coursePickerVisible, setCoursePickerVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const fetchData = async () => {
    setErrorMessage(null);
    try {
      const coursesRes = await coursesApi.teacherCourses();
      if (!isApiSuccess(coursesRes.data)) {
        setCourses([]);
        setAssignments([]);
        setErrorMessage(getApiError(coursesRes.data));
        return;
      }

      const courseList = extractApiData<any[]>(coursesRes.data, []);
      const normalizedCourses = Array.isArray(courseList) ? courseList : [];
      setCourses(normalizedCourses);

      if (normalizedCourses.length === 0) {
        setAssignments([]);
        return;
      }

      const assignmentCalls = await Promise.allSettled(
        normalizedCourses.map((course) => {
          const courseId = course?.id || course?._id;
          if (!courseId) {
            return Promise.resolve({ data: { success: true, data: [] } });
          }
          return assignmentsApi.byCourse(String(courseId));
        })
      );

      const mergedAssignments: any[] = [];
      assignmentCalls.forEach((result, index) => {
        if (result.status !== "fulfilled") return;
        if (!isApiSuccess(result.value.data)) return;

        const data = extractApiData<any[]>(result.value.data, []);
        const course = normalizedCourses[index];
        const courseTitle = course?.title || "Course";

        if (Array.isArray(data)) {
          data.forEach((item) => {
            mergedAssignments.push({
              ...item,
              __courseTitle: item?.courses?.title || courseTitle,
              __courseId: item?.course_id || course?.id || course?._id,
            });
          });
        }
      });

      mergedAssignments.sort(
        (a, b) =>
          new Date(b?.created_at || 0).getTime() -
          new Date(a?.created_at || 0).getTime()
      );

      setAssignments(mergedAssignments);
    } catch (e) {
      console.log("Error loading teacher assignments", e);
      setErrorMessage("Failed to load assignments");
      setAssignments([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      const fallbackCourseId = String(courses[0]?.id || courses[0]?._id || "");
      setSelectedCourseId(fallbackCourseId);
    }
  }, [courses, selectedCourseId]);

  const selectedCourseTitle = useMemo(() => {
    const match = courses.find((item) => String(item?.id || item?._id) === String(selectedCourseId));
    return match?.title || "Select course";
  }, [courses, selectedCourseId]);

  const totalCount = assignments.length;
  const upcomingCount = assignments.filter((item) => {
    if (!item?.due_date) return false;
    const due = new Date(item.due_date).getTime();
    return !Number.isNaN(due) && due >= Date.now();
  }).length;

  const formatDate = (value?: string) => {
    if (!value) return "No deadline";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "No deadline";
    return parsed.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCreate = async () => {
    if (!selectedCourseId || !title.trim()) {
      setErrorMessage("Course and title are required");
      return;
    }

    setErrorMessage(null);
    setIsCreating(true);

    try {
      const payload: any = {
        course_id: selectedCourseId,
        title: title.trim(),
      };

      if (description.trim()) payload.description = description.trim();
      if (dueDate.trim()) payload.due_date = dueDate.trim();

      const res = await assignmentsApi.create(payload);
      if (isApiSuccess(res.data)) {
        setCreateModalVisible(false);
        setTitle("");
        setDescription("");
        setDueDate("");
        fetchData();
      } else {
        setErrorMessage(getApiError(res.data));
      }
    } catch (e) {
      console.log("Error creating assignment", e);
      setErrorMessage("Failed to create assignment");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete assignment", "Are you sure you want to delete this assignment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await assignmentsApi.delete(id);
            if (isApiSuccess(res.data)) {
              fetchData();
            } else {
              setErrorMessage(getApiError(res.data));
            }
          } catch (e) {
            console.log("Error deleting assignment", e);
            setErrorMessage("Failed to delete assignment");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaWrapper>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: isTablet ? 32 : 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
          />
        }
      >
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }}>
          <TeacherScreenHeader
            badge="Teacher Workspace"
            title="Assignments"
            subtitle="Design tasks, set deadlines, and keep courses on track"
            actionIcon={<Plus size={22} color={COLORS.white} />}
            onActionPress={() => setCreateModalVisible(true)}
          />

          <View style={{ paddingHorizontal: horizontalPadding }} className="pt-1 pb-2 flex-row flex-wrap justify-between">
            <TeacherStatCard
              label="Total"
              value={totalCount}
              Icon={ClipboardList}
              tone="slate"
            />
            <TeacherStatCard
              label="Upcoming"
              value={upcomingCount}
              Icon={Clock3}
              tone="blue"
            />
          </View>

          {errorMessage ? (
            <View style={{ marginHorizontal: horizontalPadding }} className="mb-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <Text className="text-amber-700 text-sm font-semibold">{errorMessage}</Text>
            </View>
          ) : null}

          <View style={{ paddingHorizontal: horizontalPadding, paddingTop: 12 }}>
          {isLoading ? (
            <View className="gap-4">
              <Skeleton height={150} className="rounded-3xl" />
              <Skeleton height={150} className="rounded-3xl" />
            </View>
          ) : assignments.length === 0 ? (
            <View className="bg-white border border-slate-100 rounded-3xl p-8 items-center justify-center">
              <ClipboardList size={36} color={COLORS.slate300} />
              <Text className="text-slate-600 font-bold mt-3">No assignments found</Text>
              <Text className="text-slate-500 text-sm mt-1 text-center">
                Create your first assignment to get started.
              </Text>
            </View>
          ) : (
            assignments.map((item, index) => {
              const assignmentId = String(item?.id || item?._id || index);

              return (
                <View
                  key={assignmentId}
                  className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 mb-4"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                      <Text className="text-slate-900 text-base font-black" numberOfLines={1}>
                        {item?.title || "Untitled assignment"}
                      </Text>
                      <Text className="text-slate-500 text-sm mt-1" numberOfLines={2}>
                        {item?.description || "No description"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(assignmentId)}
                      className="bg-rose-50 p-2 rounded-lg"
                    >
                      <Trash2 size={16} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row mt-4 gap-3">
                    <View className="flex-row items-center flex-1">
                      <BookOpen size={14} color={COLORS.slate400} />
                      <Text className="text-xs text-slate-500 ml-1" numberOfLines={1}>
                        {item?.__courseTitle || "Course"}
                      </Text>
                    </View>
                    <View className="flex-row items-center flex-1">
                      <Clock3 size={14} color={COLORS.slate400} />
                      <Text className="text-xs text-slate-500 ml-1" numberOfLines={1}>
                        {formatDate(item?.due_date)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900/50 justify-end">
          <View className="bg-white rounded-t-[36px] p-6 h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-black text-slate-900">Create Assignment</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Text className="text-slate-500 font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-slate-500 font-bold mb-2 ml-1">Course</Text>
              <TouchableOpacity
                onPress={() => setCoursePickerVisible(true)}
                className="h-14 border border-slate-200 rounded-xl px-4 flex-row items-center justify-between bg-slate-50 mb-4"
              >
                <Text className="text-slate-900 font-medium" numberOfLines={1}>
                  {selectedCourseTitle}
                </Text>
                <ChevronDown size={18} color={COLORS.slate500} />
              </TouchableOpacity>

              <Input
                label="Title"
                placeholder="Assignment title"
                value={title}
                onChangeText={setTitle}
              />

              <Input
                label="Description"
                placeholder="Assignment instructions"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                style={{ textAlignVertical: "top" }}
              />

              <Input
                label="Due Date"
                placeholder="2026-05-10T10:00:00.000Z"
                value={dueDate}
                onChangeText={setDueDate}
              />

              <Button
                title="Create Assignment"
                isLoading={isCreating}
                onPress={handleCreate}
                className="mt-2"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={coursePickerVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setCoursePickerVisible(false)}
      >
        <View className="flex-1 bg-slate-900/40 items-center justify-center px-6">
          <View className="bg-white rounded-2xl w-full max-h-[70%] p-4">
            <Text className="text-slate-900 font-black text-base mb-3">Select Course</Text>

            <ScrollView>
              {courses.map((course, idx) => {
                const cid = String(course?.id || course?._id || idx);
                const selected = cid === selectedCourseId;
                return (
                  <TouchableOpacity
                    key={cid}
                    onPress={() => {
                      setSelectedCourseId(cid);
                      setCoursePickerVisible(false);
                    }}
                    className={`px-4 py-3 rounded-xl mb-2 border ${selected ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200"}`}
                  >
                    <Text className={`font-semibold ${selected ? "text-blue-700" : "text-slate-800"}`} numberOfLines={1}>
                      {course?.title || "Untitled course"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Button
              title="Close"
              variant="outline"
              className="mt-2"
              onPress={() => setCoursePickerVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
