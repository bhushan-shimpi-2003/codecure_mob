import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { enrollmentsApi } from "../../api/endpoints";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
import { Skeleton } from "../../components/Skeleton";
import { Button } from "../../components/Button";
import { UserCheck, XCircle, CheckCircle2 } from "lucide-react-native";
import { COLORS } from "../../utils/theme";

export default function AdminEnrollmentsScreen() {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setErrorMessage(null);
    try {
      const [pendingRes, allRes] = await Promise.allSettled([
        enrollmentsApi.pendingRequests(),
        enrollmentsApi.all(),
      ]);

      if (pendingRes.status === "fulfilled" && isApiSuccess(pendingRes.value.data)) {
        const data = extractApiData<any[]>(pendingRes.value.data, []);
        setPendingRequests(Array.isArray(data) ? data : []);
      } else {
        setPendingRequests([]);
      }

      if (allRes.status === "fulfilled" && isApiSuccess(allRes.value.data)) {
        const data = extractApiData<any[]>(allRes.value.data, []);
        setAllEnrollments(Array.isArray(data) ? data : []);
      } else {
        setAllEnrollments([]);
      }

      const firstError =
        (pendingRes.status === "fulfilled" && !isApiSuccess(pendingRes.value.data) && getApiError(pendingRes.value.data)) ||
        (allRes.status === "fulfilled" && !isApiSuccess(allRes.value.data) && getApiError(allRes.value.data));

      if (firstError) {
        setErrorMessage(firstError);
      }
    } catch (e) {
      console.log("Error loading enrollment governance", e);
      setErrorMessage("Failed to load enrollment data");
      setPendingRequests([]);
      setAllEnrollments([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeEnrollments = useMemo(
    () =>
      allEnrollments.filter(
        (item) => item?.student_status === "active" || item?.status === "approved"
      ).length,
    [allEnrollments]
  );

  const handleResolve = async (requestId: string, status: "approved" | "rejected") => {
    try {
      const res = await enrollmentsApi.updateRequest(requestId, status);
      if (isApiSuccess(res.data)) {
        fetchData();
      } else {
        setErrorMessage(getApiError(res.data));
      }
    } catch (e) {
      console.log("Error resolving request", e);
      setErrorMessage(`Failed to ${status} request`);
    }
  };

  const askResolve = (requestId: string, status: "approved" | "rejected") => {
    Alert.alert(
      status === "approved" ? "Approve request" : "Reject request",
      "Are you sure you want to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: status === "approved" ? "Approve" : "Reject",
          style: status === "approved" ? "default" : "destructive",
          onPress: () => handleResolve(requestId, status),
        },
      ]
    );
  };

  return (
    <SafeAreaWrapper>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
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
        <View className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-black text-slate-900">Enrollment Governance</Text>
          <Text className="text-slate-500 mt-1">Approve or reject student access requests</Text>
        </View>

        <View className="px-6 pt-2 pb-4 flex-row gap-3">
          <View className="flex-1 bg-white rounded-2xl border border-slate-100 p-4">
            <Text className="text-xs text-slate-500 uppercase font-black tracking-wider">Pending</Text>
            <Text className="text-2xl font-black text-amber-600 mt-1">{pendingRequests.length}</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl border border-slate-100 p-4">
            <Text className="text-xs text-slate-500 uppercase font-black tracking-wider">Active</Text>
            <Text className="text-2xl font-black text-emerald-600 mt-1">{activeEnrollments}</Text>
          </View>
        </View>

        {errorMessage ? (
          <View className="mx-6 mb-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Text className="text-amber-700 text-sm font-semibold">{errorMessage}</Text>
          </View>
        ) : null}

        <View style={{ padding: 24, paddingTop: 12 }}>
          {isLoading ? (
            <View className="gap-4">
              <Skeleton height={150} className="rounded-3xl" />
              <Skeleton height={150} className="rounded-3xl" />
            </View>
          ) : pendingRequests.length === 0 ? (
            <View className="bg-white border border-slate-100 rounded-3xl p-8 items-center justify-center">
              <UserCheck size={36} color={COLORS.slate300} />
              <Text className="text-slate-600 font-bold mt-3">No pending requests</Text>
            </View>
          ) : (
            pendingRequests.map((request, index) => {
              const requestId = String(request?.id || request?._id || index);
              const student = request?.profiles || request?.student || {};
              const course = request?.courses || request?.course || {};

              return (
                <View key={requestId} className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 mb-4">
                  <Text className="text-slate-900 text-base font-black" numberOfLines={1}>
                    {student?.name || student?.email || "Student"}
                  </Text>
                  <Text className="text-slate-500 text-sm mt-1" numberOfLines={1}>
                    {course?.title || "Course request"}
                  </Text>

                  <View className="flex-row gap-2 mt-4">
                    <Button
                      title="Approve"
                      className="flex-1 h-10"
                      textClassName="text-xs"
                      leftIcon={<CheckCircle2 size={14} color={COLORS.white} />}
                      onPress={() => askResolve(requestId, "approved")}
                    />
                    <Button
                      title="Reject"
                      variant="outline"
                      className="flex-1 h-10"
                      textClassName="text-xs"
                      leftIcon={<XCircle size={14} color={COLORS.slate700} />}
                      onPress={() => askResolve(requestId, "rejected")}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
