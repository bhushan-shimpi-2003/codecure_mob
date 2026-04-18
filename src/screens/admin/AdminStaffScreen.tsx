import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { adminApi } from "../../api/endpoints";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
import { Skeleton } from "../../components/Skeleton";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { UserCog, Plus, ShieldCheck, GraduationCap } from "lucide-react-native";
import { COLORS } from "../../utils/theme";

export default function AdminStaffScreen() {
  const [staff, setStaff] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"teacher" | "admin">("teacher");

  const fetchData = async () => {
    setErrorMessage(null);
    try {
      const [staffRes, studentsRes] = await Promise.allSettled([
        adminApi.getStaff(),
        adminApi.getStudents(),
      ]);

      if (staffRes.status === "fulfilled" && isApiSuccess(staffRes.value.data)) {
        const data = extractApiData<any[]>(staffRes.value.data, []);
        setStaff(Array.isArray(data) ? data : []);
      } else {
        setStaff([]);
      }

      if (studentsRes.status === "fulfilled" && isApiSuccess(studentsRes.value.data)) {
        const data = extractApiData<any[]>(studentsRes.value.data, []);
        setStudents(Array.isArray(data) ? data : []);
      } else {
        setStudents([]);
      }

      const firstError =
        (staffRes.status === "fulfilled" && !isApiSuccess(staffRes.value.data) && getApiError(staffRes.value.data)) ||
        (studentsRes.status === "fulfilled" && !isApiSuccess(studentsRes.value.data) && getApiError(studentsRes.value.data));
      if (firstError) {
        setErrorMessage(firstError);
      }
    } catch (e) {
      console.log("Error loading staff management", e);
      setErrorMessage("Failed to load staff data");
      setStaff([]);
      setStudents([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const promotedStudents = useMemo(
    () => students.filter((item) => item?.role !== "teacher" && item?.role !== "admin").slice(0, 8),
    [students]
  );

  const handleCreateStaff = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage("Name, email, and password are required");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await adminApi.registerStaff({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      if (isApiSuccess(res.data)) {
        setModalVisible(false);
        setName("");
        setEmail("");
        setPassword("");
        setRole("teacher");
        fetchData();
      } else {
        setErrorMessage(getApiError(res.data));
      }
    } catch (e) {
      console.log("Error creating staff", e);
      setErrorMessage("Failed to create staff account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const promoteStudent = (userId: string, nextRole: "teacher" | "admin") => {
    Alert.alert(
      "Promote user",
      `Promote this student to ${nextRole}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Promote",
          onPress: async () => {
            try {
              const res = await adminApi.updateRole(userId, nextRole);
              if (isApiSuccess(res.data)) {
                fetchData();
              } else {
                setErrorMessage(getApiError(res.data));
              }
            } catch (e) {
              console.log("Error promoting user", e);
              setErrorMessage("Failed to update role");
            }
          },
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
        <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-black text-slate-900">Staff Management</Text>
            <Text className="text-slate-500 mt-1">Manage teachers, admins, and role promotions</Text>
          </View>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="bg-blue-600 rounded-2xl p-3"
          >
            <Plus size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View className="px-6 pt-2 pb-4 flex-row gap-3">
          <View className="flex-1 bg-white rounded-2xl border border-slate-100 p-4">
            <Text className="text-xs text-slate-500 uppercase font-black tracking-wider">Staff</Text>
            <Text className="text-2xl font-black text-slate-900 mt-1">{staff.length}</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl border border-slate-100 p-4">
            <Text className="text-xs text-slate-500 uppercase font-black tracking-wider">Students</Text>
            <Text className="text-2xl font-black text-blue-600 mt-1">{students.length}</Text>
          </View>
        </View>

        {errorMessage ? (
          <View className="mx-6 mb-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Text className="text-amber-700 text-sm font-semibold">{errorMessage}</Text>
          </View>
        ) : null}

        <View style={{ padding: 24, paddingTop: 12 }}>
          <Text className="text-sm font-black text-slate-500 uppercase tracking-wider mb-3">Current Staff</Text>

          {isLoading ? (
            <View className="gap-4 mb-6">
              <Skeleton height={130} className="rounded-3xl" />
              <Skeleton height={130} className="rounded-3xl" />
            </View>
          ) : staff.length === 0 ? (
            <View className="bg-white border border-slate-100 rounded-3xl p-8 items-center justify-center mb-6">
              <UserCog size={36} color={COLORS.slate300} />
              <Text className="text-slate-600 font-bold mt-3">No staff records</Text>
            </View>
          ) : (
            staff.map((item, index) => {
              const itemId = String(item?.id || item?._id || index);
              return (
                <View key={itemId} className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 mb-4">
                  <Text className="text-slate-900 text-base font-black">{item?.name || "Unnamed"}</Text>
                  <Text className="text-slate-500 text-sm mt-1">{item?.email || "No email"}</Text>
                  <View className="mt-3 self-start px-2 py-1 rounded-lg bg-blue-100">
                    <Text className="text-blue-700 text-[10px] font-black uppercase">{item?.role || "staff"}</Text>
                  </View>
                </View>
              );
            })
          )}

          <Text className="text-sm font-black text-slate-500 uppercase tracking-wider mb-3 mt-2">Promote Students</Text>
          {promotedStudents.map((student, index) => {
            const studentId = String(student?.id || student?._id || index);
            return (
              <View key={studentId} className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 mb-4">
                <Text className="text-slate-900 text-base font-black">{student?.name || "Student"}</Text>
                <Text className="text-slate-500 text-sm mt-1">{student?.email || "No email"}</Text>
                <View className="flex-row gap-2 mt-4">
                  <Button
                    title="To Teacher"
                    className="flex-1 h-10"
                    textClassName="text-xs"
                    leftIcon={<GraduationCap size={14} color={COLORS.white} />}
                    onPress={() => promoteStudent(studentId, "teacher")}
                  />
                  <Button
                    title="To Admin"
                    variant="outline"
                    className="flex-1 h-10"
                    textClassName="text-xs"
                    leftIcon={<ShieldCheck size={14} color={COLORS.slate700} />}
                    onPress={() => promoteStudent(studentId, "admin")}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900/50 justify-end">
          <View className="bg-white rounded-t-[36px] p-6 h-[72%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-black text-slate-900">Create Staff Account</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text className="text-slate-500 font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input label="Name" placeholder="Staff name" value={name} onChangeText={setName} />
              <Input label="Email" placeholder="name@example.com" value={email} onChangeText={setEmail} />
              <Input
                label="Password"
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                isPassword
              />

              <Text className="text-slate-500 font-bold mb-2 ml-1">Role</Text>
              <View className="flex-row gap-2 mb-6">
                <TouchableOpacity
                  onPress={() => setRole("teacher")}
                  className={`flex-1 h-12 rounded-xl border items-center justify-center ${role === "teacher" ? "bg-blue-600 border-blue-600" : "bg-white border-slate-200"}`}
                >
                  <Text className={`font-bold ${role === "teacher" ? "text-white" : "text-slate-700"}`}>Teacher</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setRole("admin")}
                  className={`flex-1 h-12 rounded-xl border items-center justify-center ${role === "admin" ? "bg-slate-900 border-slate-900" : "bg-white border-slate-200"}`}
                >
                  <Text className={`font-bold ${role === "admin" ? "text-white" : "text-slate-700"}`}>Admin</Text>
                </TouchableOpacity>
              </View>

              <Button
                title="Create Account"
                isLoading={isSubmitting}
                onPress={handleCreateStaff}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
