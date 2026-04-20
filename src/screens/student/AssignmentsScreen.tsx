import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, useWindowDimensions } from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { assignmentsApi } from "../../api/endpoints";
import { FileText, Clock, CheckCircle2, Link as LinkIcon, Send } from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Skeleton } from "../../components/Skeleton";
import { extractApiData, isApiSuccess } from "../../api/response";
import { StudentScreenHeader } from "../../components/StudentScreenHeader";
import { StudentStatCard } from "../../components/StudentStatCard";
import { useAuth } from "../../context/AuthContext";
import { AppHeader } from "../../components/AppHeader";

export default function AssignmentsScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 30 : 24;
  const shellMaxWidth = isTablet ? 980 : undefined;

  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAssignments = async () => {
    try {
      const res = await assignmentsApi.myAssignments();
      const payload = res.data;
      if (isApiSuccess(payload)) {
        const data = extractApiData<any[]>(payload, []);
        setAssignments(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.log("Error loading assignments", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const submittedCount = assignments.filter(
    (item) => Array.isArray(item?.submissions) && item.submissions.length > 0
  ).length;
  const pendingCount = assignments.length - submittedCount;

  const handleSubmit = async () => {
    if (!submissionUrl) return;

    const assignmentId = selectedAssignment?.id || selectedAssignment?._id;
    if (!assignmentId) {
      alert("Invalid assignment");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await assignmentsApi.submit(assignmentId, submissionUrl);
      if (isApiSuccess(res.data)) {
        alert("Assignment submitted!");
        setSelectedAssignment(null);
        setSubmissionUrl("");
        fetchAssignments();
      }
    } catch (e) {
      alert("Failed to submit assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const { user } = useAuth();

  return (
    <SafeAreaWrapper>
      <AppHeader role={user?.role} subtitle="Training" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: isTablet ? 34 : 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchAssignments();
            }}
          />
        }
      >
        <View style={{ width: "100%", maxWidth: shellMaxWidth, alignSelf: "center" }}>
          <StudentScreenHeader
            badge="Student Workspace"
            title="Assignments"
            subtitle="Submit on time, track status, and improve scores"
          />

          <View style={{ paddingHorizontal: horizontalPadding }} className="pt-1 pb-2 flex-row flex-wrap justify-between">
            <StudentStatCard label="Total" value={assignments.length} Icon={FileText} tone="slate" />
            <StudentStatCard label="Submitted" value={submittedCount} Icon={CheckCircle2} tone="emerald" />
            <StudentStatCard label="Pending" value={pendingCount} Icon={Clock} tone="amber" />
          </View>

          <View
            style={{
              paddingHorizontal: horizontalPadding,
              paddingTop: 12,
            }}
          >
            {isLoading ? (
              <View className="gap-4">
                <Skeleton height={140} className="rounded-3xl" />
                <Skeleton height={140} className="rounded-3xl" />
              </View>
            ) : assignments.length === 0 ? (
              <View className="items-center justify-center py-16 bg-white rounded-3xl border border-slate-100">
                <View className="bg-slate-100 p-6 rounded-full mb-4">
                  <FileText size={40} color={COLORS.slate300} />
                </View>
                <Text className="text-slate-500 font-semibold text-center">No assignments assigned yet.</Text>
              </View>
            ) : (
              assignments.map((item) => {
                const isSubmitted = Array.isArray(item?.submissions) && item.submissions.length > 0;
                const status = isSubmitted ? "Submitted" : "Pending";
                const assignmentId = item?.id || item?._id;
                const courseRef = item?.courses || item?.course;
                const dueDate = item?.due_date ? new Date(item.due_date) : null;
                const dueLabel =
                  dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate.toLocaleDateString() : "TBD";

                return (
                  <TouchableOpacity
                    key={String(assignmentId || item?.title)}
                    onPress={() => setSelectedAssignment(item)}
                    className="bg-white p-5 rounded-[32px] mb-4 border border-slate-100 shadow-sm"
                  >
                    <View className="flex-row justify-between items-start mb-4">
                      <View className="flex-1 mr-4">
                        <Text className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">
                          {courseRef?.title || "Assignment"}
                        </Text>
                        <Text className="text-lg font-black text-slate-900" numberOfLines={1}>
                          {item.title}
                        </Text>
                      </View>
                      <View className={`px-3 py-1 rounded-full ${isSubmitted ? "bg-emerald-100" : "bg-amber-100"}`}>
                        <Text
                          className={`text-[10px] font-black uppercase tracking-widest ${
                            isSubmitted ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {status}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Clock size={14} color={COLORS.slate400} />
                        <Text className="text-xs font-bold text-slate-400 ml-1">Due: {dueLabel}</Text>
                      </View>
                      <Text className="text-xs font-black text-blue-600 uppercase">Open</Text>
                    </View>

                    {isSubmitted &&
                    item.submissions[0]?.score !== null &&
                    item.submissions[0]?.score !== undefined ? (
                      <View className="mt-4 pt-4 border-t border-slate-50 flex-row items-center justify-between">
                        <Text className="text-slate-500 text-xs font-bold uppercase">Grade</Text>
                        <Text className="text-slate-900 font-black text-base">{item.submissions[0].score}/100</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={!!selectedAssignment}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedAssignment(null)}
      >
        <View className="flex-1 bg-slate-900/45 justify-end">
          <View className="bg-white rounded-t-[40px] p-8 h-[64%] shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-black text-slate-900">Assignment Detail</Text>
              <TouchableOpacity onPress={() => setSelectedAssignment(null)}>
                <Text className="text-slate-400 font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-lg font-black text-slate-900 mb-2">{selectedAssignment?.title}</Text>
              <Text className="text-slate-500 leading-6 mb-8">{selectedAssignment?.description}</Text>

              <Text className="text-slate-900 font-bold mb-4">Submit Your Work</Text>
              <Input
                placeholder="https://github.com/your-project"
                value={submissionUrl}
                onChangeText={setSubmissionUrl}
                leftIcon={<LinkIcon size={18} color={COLORS.slate400} />}
                className="mb-8"
              />

              <Button
                title="Submit Assignment"
                onPress={handleSubmit}
                isLoading={isSubmitting}
                leftIcon={<Send size={18} color="white" />}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
