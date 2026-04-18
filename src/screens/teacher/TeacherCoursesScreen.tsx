import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
  useWindowDimensions,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { coursesApi, lessonsApi } from "../../api/endpoints";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
import { Skeleton } from "../../components/Skeleton";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { COLORS } from "../../utils/theme";
import { BookOpenCheck, Plus, Trash2, Layers, PlayCircle, Video, Pencil } from "lucide-react-native";
import { TeacherScreenHeader } from "../../components/TeacherScreenHeader";
import { TeacherStatCard } from "../../components/TeacherStatCard";

export default function TeacherCoursesScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 30 : 24;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLessonLoading, setIsLessonLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [moduleModalVisible, setModuleModalVisible] = useState(false);
  const [lessonModalVisible, setLessonModalVisible] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState("Selected Course");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDuration, setModuleDuration] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [isUpdatingLesson, setIsUpdatingLesson] = useState(false);

  const fetchCourses = async () => {
    setErrorMessage(null);
    try {
      const res = await coursesApi.teacherCourses();
      if (isApiSuccess(res.data)) {
        const data = extractApiData<any[]>(res.data, []);
        setCourses(Array.isArray(data) ? data : []);
      } else {
        setCourses([]);
        setErrorMessage(getApiError(res.data));
      }
    } catch (e) {
      console.log("Error loading teacher courses", e);
      setCourses([]);
      setErrorMessage("Failed to load courses");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const totalStudents = useMemo(
    () => courses.reduce((sum, item) => sum + Number(item?.students_enrolled || 0), 0),
    [courses]
  );

  const normalizeVideoUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";

    if (trimmed.includes("<iframe") && trimmed.includes("src=")) {
      const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
      if (srcMatch?.[1]) {
        return srcMatch[1].trim();
      }
    }

    return trimmed;
  };

  const fetchLessons = async (courseId: string) => {
    if (!courseId) {
      setLessons([]);
      return;
    }

    setIsLessonLoading(true);
    try {
      const res = await lessonsApi.byCourse(courseId);
      if (isApiSuccess(res.data)) {
        const data = extractApiData<any[]>(res.data, []);
        const list = Array.isArray(data) ? data : [];
        const sorted = [...list].sort(
          (a, b) => Number(a?.lesson_order || 0) - Number(b?.lesson_order || 0)
        );
        setLessons(sorted);
      } else {
        setLessons([]);
        setErrorMessage(getApiError(res.data));
      }
    } catch (e) {
      console.log("Error loading lessons", e);
      setLessons([]);
      setErrorMessage("Failed to load lessons");
    } finally {
      setIsLessonLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!title.trim() || !description.trim()) {
      setErrorMessage("Title and description are required");
      return;
    }

    setErrorMessage(null);
    setIsCreating(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        price: Number(price || 0),
        status: "active",
      };

      const res = await coursesApi.create(payload);
      if (isApiSuccess(res.data)) {
        setCreateModalVisible(false);
        setTitle("");
        setDescription("");
        setPrice("0");
        fetchCourses();
      } else {
        setErrorMessage(getApiError(res.data));
      }
    } catch (e) {
      console.log("Error creating course", e);
      setErrorMessage("Failed to create course");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    Alert.alert("Delete course", "This will remove the course and related content. Continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await coursesApi.delete(courseId);
            if (isApiSuccess(res.data)) {
              fetchCourses();
            } else {
              setErrorMessage(getApiError(res.data));
            }
          } catch (e) {
            console.log("Error deleting course", e);
            setErrorMessage("Failed to delete course");
          }
        },
      },
    ]);
  };

  const handleAddModule = async () => {
    if (!selectedCourseId || !moduleTitle.trim()) {
      setErrorMessage("Module title is required");
      return;
    }

    setErrorMessage(null);
    setIsAddingModule(true);
    try {
      const res = await coursesApi.addModule(selectedCourseId, {
        title: moduleTitle.trim(),
        duration: moduleDuration.trim() || null,
      });

      if (isApiSuccess(res.data)) {
        setModuleModalVisible(false);
        setModuleTitle("");
        setModuleDuration("");
      } else {
        setErrorMessage(getApiError(res.data));
      }
    } catch (e) {
      console.log("Error adding module", e);
      setErrorMessage("Failed to add module");
    } finally {
      setIsAddingModule(false);
    }
  };

  const openLessonsModal = (course: any, courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedCourseTitle(course?.title || "Selected Course");
    setEditingLessonId(null);
    setLessonTitle("");
    setLessonVideoUrl("");
    setLessonContent("");
    setLessonModalVisible(true);
    fetchLessons(courseId);
  };

  const startEditLesson = (lesson: any) => {
    const lessonId = String(lesson?.id || lesson?._id || "");
    if (!lessonId) return;

    setEditingLessonId(lessonId);
    setLessonTitle(lesson?.title || "");
    setLessonVideoUrl(normalizeVideoUrl(lesson?.video_url || lesson?.youtube_url || ""));
    setLessonContent(lesson?.content || lesson?.description || lesson?.notes || "");
  };

  const cancelLessonEdit = () => {
    setEditingLessonId(null);
    setLessonTitle("");
    setLessonVideoUrl("");
    setLessonContent("");
  };

  const handleOpenVideo = async (url?: string) => {
    if (!url) {
      Alert.alert("Missing video link", "This lesson does not have a video URL yet.");
      return;
    }

    const normalizedUrl = normalizeVideoUrl(url);
    const canOpen = await Linking.canOpenURL(normalizedUrl);
    if (!canOpen) {
      Alert.alert("Invalid link", "Could not open this video URL.");
      return;
    }

    await Linking.openURL(normalizedUrl);
  };

  const handleSaveLesson = async () => {
    if (!selectedCourseId || !lessonTitle.trim() || !lessonVideoUrl.trim()) {
      setErrorMessage("Lesson title and video link are required");
      return;
    }

    setErrorMessage(null);
    if (editingLessonId) {
      setIsUpdatingLesson(true);
    } else {
      setIsAddingLesson(true);
    }
    try {
      const normalizedVideoUrl = normalizeVideoUrl(lessonVideoUrl);
      const payload: any = {
        title: lessonTitle.trim(),
        video_url: normalizedVideoUrl,
      };

      if (lessonContent.trim()) {
        payload.content = lessonContent.trim();
      }

      const res = editingLessonId
        ? await lessonsApi.update(editingLessonId, payload)
        : await lessonsApi.create({
            ...payload,
            course_id: selectedCourseId,
            lesson_order: lessons.length,
          });

      if (isApiSuccess(res.data)) {
        setEditingLessonId(null);
        setLessonTitle("");
        setLessonVideoUrl("");
        setLessonContent("");
        fetchLessons(selectedCourseId);
      } else {
        setErrorMessage(getApiError(res.data));
      }
    } catch (e) {
      console.log("Error saving lesson", e);
      setErrorMessage(editingLessonId ? "Failed to update lesson" : "Failed to create lesson");
    } finally {
      setIsAddingLesson(false);
      setIsUpdatingLesson(false);
    }
  };

  const handleDeleteLesson = (lessonId: string) => {
    Alert.alert("Delete lesson", "Do you want to delete this lesson?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await lessonsApi.delete(lessonId);
            if (isApiSuccess(res.data)) {
              if (selectedCourseId) {
                fetchLessons(selectedCourseId);
              }
            } else {
              setErrorMessage(getApiError(res.data));
            }
          } catch (e) {
            console.log("Error deleting lesson", e);
            setErrorMessage("Failed to delete lesson");
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
              fetchCourses();
            }}
          />
        }
      >
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }}>
          <TeacherScreenHeader
            badge="Teacher Workspace"
            title="Course Studio"
            subtitle="Build curricula, attach lessons, and ship learning journeys"
            actionIcon={<Plus size={22} color={COLORS.white} />}
            onActionPress={() => setCreateModalVisible(true)}
          />

          <View style={{ paddingHorizontal: horizontalPadding }} className="pt-1 pb-2 flex-row flex-wrap justify-between">
            <TeacherStatCard
              label="Courses"
              value={courses.length}
              Icon={BookOpenCheck}
              tone="slate"
            />
            <TeacherStatCard
              label="Students"
              value={totalStudents}
              Icon={Video}
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
          ) : courses.length === 0 ? (
            <View className="bg-white border border-slate-100 rounded-3xl p-8 items-center justify-center">
              <BookOpenCheck size={36} color={COLORS.slate300} />
              <Text className="text-slate-600 font-bold mt-3">No courses yet</Text>
              <Text className="text-slate-500 text-sm mt-1 text-center">
                Create your first course and start publishing lessons.
              </Text>
            </View>
          ) : (
            courses.map((course, index) => {
              const courseId = String(course?.id || course?._id || index);
              const idOrSlug = course?.slug || course?.id || course?._id;
              return (
                <View
                  key={courseId}
                  className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 mb-4"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                      <Text className="text-slate-900 text-base font-black" numberOfLines={1}>
                        {course?.title || "Untitled course"}
                      </Text>
                      <Text className="text-slate-500 text-sm mt-1" numberOfLines={2}>
                        {course?.description || "No description"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteCourse(courseId)}
                      className="bg-rose-50 p-2 rounded-lg"
                    >
                      <Trash2 size={16} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row mt-4 items-center justify-between">
                    <Text className="text-xs text-slate-500 font-bold uppercase">
                      {Number(course?.students_enrolled || 0)} students
                    </Text>
                    <View className="flex-row gap-2">
                      <Button
                        title="Lessons"
                        variant="outline"
                        className="h-10 px-3"
                        textClassName="text-xs"
                        leftIcon={<Video size={14} color={COLORS.slate700} />}
                        onPress={() => openLessonsModal(course, courseId)}
                      />
                      <Button
                        title="Module"
                        variant="outline"
                        className="h-10 px-3"
                        textClassName="text-xs"
                        leftIcon={<Layers size={14} color={COLORS.slate700} />}
                        onPress={() => {
                          setSelectedCourseId(courseId);
                          setModuleModalVisible(true);
                        }}
                      />
                      <Button
                        title="Open"
                        className="h-10 px-4"
                        textClassName="text-xs"
                        onPress={() => {
                          if (idOrSlug) {
                            navigation.navigate("CourseDetail", { idOrSlug });
                          }
                        }}
                      />
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
          <View className="bg-white rounded-t-[36px] p-6 h-[78%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-black text-slate-900">Create Course</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Text className="text-slate-500 font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Title"
                placeholder="Course title"
                value={title}
                onChangeText={setTitle}
              />

              <Input
                label="Description"
                placeholder="Course description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                style={{ textAlignVertical: "top" }}
              />

              <Input
                label="Price"
                placeholder="0"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />

              <Button
                title="Create Course"
                isLoading={isCreating}
                onPress={handleCreateCourse}
                className="mt-2"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={moduleModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModuleModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900/50 justify-end">
          <View className="bg-white rounded-t-[36px] p-6 h-[56%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-black text-slate-900">Add Module</Text>
              <TouchableOpacity onPress={() => setModuleModalVisible(false)}>
                <Text className="text-slate-500 font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Module Title"
              placeholder="Introduction"
              value={moduleTitle}
              onChangeText={setModuleTitle}
            />

            <Input
              label="Duration (optional)"
              placeholder="2h 15m"
              value={moduleDuration}
              onChangeText={setModuleDuration}
            />

            <Button
              title="Add Module"
              isLoading={isAddingModule}
              onPress={handleAddModule}
              className="mt-2"
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={lessonModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLessonModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900/50 justify-end">
          <View className="bg-white rounded-t-[36px] p-6 h-[86%]">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-1 pr-3">
                <Text className="text-lg font-black text-slate-900">Manage Lessons</Text>
                <Text className="text-slate-500 text-xs mt-1" numberOfLines={1}>{selectedCourseTitle}</Text>
              </View>
              <TouchableOpacity onPress={() => setLessonModalVisible(false)}>
                <Text className="text-slate-500 font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Lesson Title"
                placeholder="Introduction to Course"
                value={lessonTitle}
                onChangeText={setLessonTitle}
              />

              <Input
                label="Video Link"
                placeholder="https://youtube.com/... or iframe embed code"
                value={lessonVideoUrl}
                onChangeText={setLessonVideoUrl}
              />

              <Input
                label="Lesson Notes (optional)"
                placeholder="Add summary or context for students"
                value={lessonContent}
                onChangeText={setLessonContent}
                multiline
                numberOfLines={4}
                style={{ textAlignVertical: "top" }}
              />

              <Button
                title={editingLessonId ? "Update Lesson" : "Add Lesson"}
                isLoading={isAddingLesson || isUpdatingLesson}
                onPress={handleSaveLesson}
                className="mt-1"
                leftIcon={<Plus size={14} color={COLORS.white} />}
              />
              {editingLessonId ? (
                <Button
                  title="Cancel Edit"
                  variant="ghost"
                  className="mt-2"
                  onPress={cancelLessonEdit}
                />
              ) : null}

              <Text className="text-xs font-black text-slate-500 uppercase tracking-widest mt-6 mb-3">Existing Lessons</Text>

              {isLessonLoading ? (
                <View className="gap-3">
                  <Skeleton height={92} className="rounded-2xl" />
                  <Skeleton height={92} className="rounded-2xl" />
                </View>
              ) : lessons.length === 0 ? (
                <View className="bg-slate-50 border border-slate-100 rounded-2xl p-5 items-center">
                  <BookOpenCheck size={24} color={COLORS.slate300} />
                  <Text className="text-slate-500 text-sm font-bold mt-2">No lessons yet</Text>
                </View>
              ) : (
                lessons.map((lesson, index) => {
                  const lessonId = String(lesson?.id || lesson?._id || index);
                  const videoLink = normalizeVideoUrl(lesson?.video_url || lesson?.youtube_url || "");
                  return (
                    <View key={lessonId} className="bg-white border border-slate-100 rounded-2xl p-4 mb-3">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 mr-3">
                          <Text className="text-slate-900 font-black" numberOfLines={1}>{lesson?.title || `Lesson ${index + 1}`}</Text>
                          <Text className="text-slate-500 text-xs mt-1" numberOfLines={1}>{videoLink || "No video link"}</Text>
                        </View>
                        <View className="flex-row gap-2">
                          <TouchableOpacity
                            onPress={() => startEditLesson(lesson)}
                            className="bg-blue-50 p-2 rounded-lg"
                          >
                            <Pencil size={14} color={COLORS.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteLesson(lessonId)}
                            className="bg-rose-50 p-2 rounded-lg"
                          >
                            <Trash2 size={14} color={COLORS.error} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View className="flex-row gap-2 mt-3">
                        <Button
                          title="Open Video"
                          variant="outline"
                          className="flex-1 h-10"
                          textClassName="text-xs"
                          leftIcon={<PlayCircle size={14} color={COLORS.slate700} />}
                          onPress={() => handleOpenVideo(videoLink)}
                          disabled={!videoLink}
                        />
                        <Button
                          title="Preview"
                          className="flex-1 h-10"
                          textClassName="text-xs"
                          onPress={() =>
                            navigation.navigate("Lesson", {
                              lessonId,
                              lesson,
                              courseId: selectedCourseId,
                              courseTitle: selectedCourseTitle,
                              videoUrl: videoLink,
                              lessonTitle: lesson?.title,
                            })
                          }
                        />
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
