import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Linking,
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
import { ClipboardCheck, ExternalLink, CheckCircle2 } from "lucide-react-native";
import { TeacherScreenHeader } from "../../components/TeacherScreenHeader";
import { TeacherStatCard } from "../../components/TeacherStatCard";

export default function TeacherSubmissionsScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 30 : 24;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [targetSubmissionId, setTargetSubmissionId] = useState<string | null>(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

  const fetchCourses = async () => {
    const res = await coursesApi.teacherCourses();
    if (!isApiSuccess(res.data)) {
      throw new Error(getApiError(res.data));
    }

    const courseList = extractApiData<any[]>(res.data, []);
    const normalized = Array.isArray(courseList) ? courseList : [];
    setCourses(normalized);

    if (normalized.length > 0 && !selectedCourseId) {
      setSelectedCourseId(String(normalized[0]?.id || normalized[0]?._id || ""));
    }

    return normalized;
  };

  const fetchAssignments = async (courseId: string) => {
    if (!courseId) {
      setAssignments([]);
      return [];
    }

    const res = await assignmentsApi.byCourse(courseId);
    if (!isApiSuccess(res.data)) {
      throw new Error(getApiError(res.data));
    }

    const assignmentList = extractApiData<any[]>(res.data, []);
    const normalized = Array.isArray(assignmentList) ? assignmentList : [];
    setAssignments(normalized);

    if (normalized.length > 0) {
      const candidate = String(normalized[0]?.id || normalized[0]?._id || "");
      setSelectedAssignmentId((prev) => prev || candidate);
    } else {
      setSelectedAssignmentId("");
      setSubmissions([]);
    }

    return normalized;
  };

  const fetchSubmissions = async (assignmentId: string) => {
    if (!assignmentId) {
      setSubmissions([]);
      return;
    }

    const res = await assignmentsApi.submissionsByAssignment(assignmentId);
    if (!isApiSuccess(res.data)) {
      throw new Error(getApiError(res.data));
    }

    const submissionList = extractApiData<any[]>(res.data, []);
    setSubmissions(Array.isArray(submissionList) ? submissionList : []);
  };

  const fetchAll = async () => {
    setErrorMessage(null);
    try {
      const loadedCourses = await fetchCourses();
      const effectiveCourseId =
        selectedCourseId ||
        String(loadedCourses?.[0]?.id || loadedCourses?.[0]?._id || "");

      if (effectiveCourseId) {
        const loadedAssignments = await fetchAssignments(effectiveCourseId);
        const effectiveAssignmentId =
          selectedAssignmentId ||
          String(loadedAssignments?.[0]?.id || loadedAssignments?.[0]?._id || "");

        if (effectiveAssignmentId) {
          await fetchSubmissions(effectiveAssignmentId);
        }
      }
    } catch (e: any) {
      console.log("Error loading teacher submissions", e);
      setErrorMessage(e?.message || "Failed to load submissions");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;

    const run = async () => {
      setErrorMessage(null);
      try {
        const loadedAssignments = await fetchAssignments(selectedCourseId);
        const nextAssignmentId =
          loadedAssignments.length > 0
            ? String(loadedAssignments[0]?.id || loadedAssignments[0]?._id || "")
            : "";
        setSelectedAssignmentId(nextAssignmentId);
      } catch (e: any) {
        console.log("Error loading assignments", e);
        setErrorMessage(e?.message || "Failed to load assignments");
      }
    };

    run();
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedAssignmentId) {
      setSubmissions([]);
      return;
    }

    const run = async () => {
      setErrorMessage(null);
      try {
        await fetchSubmissions(selectedAssignmentId);
      } catch (e: any) {
        console.log("Error loading submissions", e);
        setErrorMessage(e?.message || "Failed to load submissions");
      }
    };

    run();
  }, [selectedAssignmentId]);

  const selectedAssignmentTitle = useMemo(() => {
    const item = assignments.find(
      (assignment) => String(assignment?.id || assignment?._id) === String(selectedAssignmentId)
    );
    return item?.title || "Select assignment";
  }, [assignments, selectedAssignmentId]);

  const gradedCount = useMemo(
    () => submissions.filter((item) => item?.score !== null && item?.score !== undefined).length,
    [submissions]
  );

  const pendingCount = useMemo(
    () => submissions.length - gradedCount,
    [submissions.length, gradedCount]
  );

  const handleOpenUrl = async (url?: string) => {
    if (!url) {
      Alert.alert("Missing submission link", "This submission does not contain a link.");
      return;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("Invalid link", "Could not open submission link.");
      return;
    }

    await Linking.openURL(url);
  };

  const handleGrade = async () => {
    if (!targetSubmissionId) return;

    const numericScore = Number(score);
    if (Number.isNaN(numericScore)) {
      setErrorMessage("Enter a valid score");
      return;
    }

    setErrorMessage(null);
    setIsSubmittingGrade(true);
    try {
      const res = await assignmentsApi.gradeSubmission(targetSubmissionId, {
        score: numericScore,
        feedback: feedback.trim(),
      });

      if (isApiSuccess(res.data)) {
        setGradeModalVisible(false);
        setTargetSubmissionId(null);
        setScore("");
        setFeedback("");
        fetchSubmissions(selectedAssignmentId);
      } else {
        setErrorMessage(getApiError(res.data));
      }
    } catch (e) {
      console.log("Error grading submission", e);
      setErrorMessage("Failed to grade submission");
    } finally {
      setIsSubmittingGrade(false);
    }
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
              fetchAll();
            }}
          />
        }
      >
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }}>
          <TeacherScreenHeader
            badge="Teacher Workspace"
            title="Submissions"
            subtitle="Review learner work and deliver quality feedback"
          />

          <View style={{ paddingHorizontal: horizontalPadding }} className="pt-1 pb-2 flex-row flex-wrap justify-between">
            <TeacherStatCard
              label="Total"
              value={submissions.length}
              Icon={ClipboardCheck}
              tone="slate"
            />
            <TeacherStatCard
              label="Graded"
              value={gradedCount}
              Icon={CheckCircle2}
              tone="emerald"
            />
          </View>

          {submissions.length > 0 ? (
            <View style={{ paddingHorizontal: horizontalPadding }} className="pb-2 -mt-1">
              <View className="bg-white border border-slate-100 rounded-2xl px-4 py-3 flex-row items-center justify-between">
                <Text className="text-slate-600 text-xs font-bold uppercase tracking-wider">Pending grading</Text>
                <Text className="text-amber-600 font-black">{pendingCount}</Text>
              </View>
            </View>
          ) : null}

          {errorMessage ? (
            <View style={{ marginHorizontal: horizontalPadding }} className="mb-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <Text className="text-amber-700 text-sm font-semibold">{errorMessage}</Text>
            </View>
          ) : null}

          <View style={{ paddingHorizontal: horizontalPadding }} className="pt-2 pb-3">
            <Text className="text-xs text-slate-500 uppercase font-black tracking-wider mb-2">Course</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {courses.map((course, idx) => {
                const courseId = String(course?.id || course?._id || idx);
                const active = courseId === selectedCourseId;
                return (
                  <TouchableOpacity
                    key={courseId}
                    onPress={() => setSelectedCourseId(courseId)}
                    className={`px-4 py-2 rounded-full mr-2 border ${active ? "bg-blue-600 border-blue-600" : "bg-white border-slate-200"}`}
                  >
                    <Text className={`text-xs font-bold ${active ? "text-white" : "text-slate-600"}`} numberOfLines={1}>
                      {course?.title || "Course"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={{ paddingHorizontal: horizontalPadding }} className="pb-4">
            <Text className="text-xs text-slate-500 uppercase font-black tracking-wider mb-2">Assignment</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {assignments.map((assignment, idx) => {
                const assignmentId = String(assignment?.id || assignment?._id || idx);
                const active = assignmentId === selectedAssignmentId;
                return (
                  <TouchableOpacity
                    key={assignmentId}
                    onPress={() => setSelectedAssignmentId(assignmentId)}
                    className={`px-4 py-2 rounded-full mr-2 border ${active ? "bg-slate-900 border-slate-900" : "bg-white border-slate-200"}`}
                  >
                    <Text className={`text-xs font-bold ${active ? "text-white" : "text-slate-600"}`} numberOfLines={1}>
                      {assignment?.title || `Assignment ${idx + 1}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={{ paddingHorizontal: horizontalPadding, paddingTop: 8 }}>
          {isLoading ? (
            <View className="gap-4">
              <Skeleton height={140} className="rounded-3xl" />
              <Skeleton height={140} className="rounded-3xl" />
            </View>
          ) : !selectedAssignmentId ? (
            <View className="bg-white border border-slate-100 rounded-3xl p-8 items-center justify-center">
              <ClipboardCheck size={36} color={COLORS.slate300} />
              <Text className="text-slate-600 font-bold mt-3">No assignment selected</Text>
            </View>
          ) : submissions.length === 0 ? (
            <View className="bg-white border border-slate-100 rounded-3xl p-8 items-center justify-center">
              <ClipboardCheck size={36} color={COLORS.slate300} />
              <Text className="text-slate-600 font-bold mt-3">No submissions yet</Text>
              <Text className="text-slate-500 text-sm mt-1 text-center">
                Students have not submitted work for {selectedAssignmentTitle}.
              </Text>
            </View>
          ) : (
            submissions.map((submission, idx) => {
              const submissionId = String(submission?.id || submission?._id || idx);
              const student = submission?.profiles || submission?.student || {};
              const graded = submission?.score !== null && submission?.score !== undefined;
              return (
                <View key={submissionId} className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 mb-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                      <Text className="text-slate-900 text-base font-black" numberOfLines={1}>
                        {student?.name || student?.email || "Student submission"}
                      </Text>
                      <Text className="text-slate-500 text-sm mt-1" numberOfLines={1}>
                        {graded ? `Score: ${submission?.score}` : "Pending grading"}
                      </Text>
                    </View>
                    <View className={`px-2 py-1 rounded-lg ${graded ? "bg-emerald-100" : "bg-amber-100"}`}>
                      <Text className={`text-[10px] font-black uppercase ${graded ? "text-emerald-700" : "text-amber-700"}`}>
                        {graded ? "Graded" : "Pending"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2 mt-4">
                    <Button
                      title="Open Link"
                      variant="outline"
                      className="flex-1 h-10"
                      textClassName="text-xs"
                      leftIcon={<ExternalLink size={14} color={COLORS.slate700} />}
                      onPress={() => handleOpenUrl(submission?.submission_url)}
                    />
                    <Button
                      title={graded ? "Re-grade" : "Grade"}
                      className="flex-1 h-10"
                      textClassName="text-xs"
                      leftIcon={<CheckCircle2 size={14} color={COLORS.white} />}
                      onPress={() => {
                        setTargetSubmissionId(submissionId);
                        setScore(String(submission?.score ?? ""));
                        setFeedback(String(submission?.feedback ?? ""));
                        setGradeModalVisible(true);
                      }}
                    />
                  </View>
                </View>
              );
            })
          )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={gradeModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setGradeModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900/50 justify-end">
          <View className="bg-white rounded-t-[36px] p-6 h-[64%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-black text-slate-900">Grade Submission</Text>
              <TouchableOpacity onPress={() => setGradeModalVisible(false)}>
                <Text className="text-slate-500 font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Score"
              placeholder="0-100"
              keyboardType="numeric"
              value={score}
              onChangeText={setScore}
            />

            <Input
              label="Feedback"
              placeholder="Write constructive feedback"
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={5}
              style={{ textAlignVertical: "top" }}
            />

            <Button
              title="Submit Grade"
              isLoading={isSubmittingGrade}
              onPress={handleGrade}
              className="mt-2"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
