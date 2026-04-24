import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { adminApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { Skeleton } from "../../components/Skeleton";
import { 
  Search, 
  Plus, 
  Menu, 
  Bell,
  MoreHorizontal,
  UserCog,
  ShieldCheck,
  UserX,
  Trash2,
  X
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { AppHeader } from "../../components/AppHeader";

const { width, height } = Dimensions.get("window");

export default function AdminStaffScreen({ navigation }: any) {
  const [staff, setStaff] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"Students" | "Teachers" | "Admins">("Students");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const fetchData = async () => {
    try {
      const [staffRes, studentsRes] = await Promise.allSettled([
        adminApi.getStaff(),
        adminApi.getStudents(),
      ]);

      if (staffRes.status === "fulfilled" && isApiSuccess(staffRes.value.data)) {
        setStaff(extractApiData<any[]>(staffRes.value.data, []));
      }
      if (studentsRes.status === "fulfilled" && isApiSuccess(studentsRes.value.data)) {
        setStudents(extractApiData<any[]>(studentsRes.value.data, []));
      }
    } catch (e) {
      console.log("Error loading user directory", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredUsers = useMemo(() => {
    let list: any[] = [];
    if (activeTab === "Students") list = students;
    else if (activeTab === "Teachers") list = staff.filter(s => s.role === 'teacher');
    else if (activeTab === "Admins") list = staff.filter(s => s.role === 'admin');

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(u => 
        (u.name || "").toLowerCase().includes(q) || 
        (u.email || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTab, students, staff, searchQuery]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await adminApi.updateRole(userId, newRole);
      if (isApiSuccess(res.data)) {
        setMenuVisible(false);
        fetchData();
        Alert.alert("Success", `User role updated to ${newRole}`);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to update role");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to permanently delete this user record?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await adminApi.deleteUser(userId);
              if (isApiSuccess(res.data)) {
                setMenuVisible(false);
                fetchData();
              }
            } catch (e) {
              Alert.alert("Error", "Failed to delete user");
            }
          }
        }
      ]
    );
  };

  const UserCard = ({ user }: any) => {
    const isOnline = useMemo(() => Math.random() > 0.3, [user.id || user._id]);

    return (
      <View className="bg-white rounded-[32px] p-6 flex-row items-center justify-between border border-slate-50 mb-4 shadow-sm">
        <View className="flex-row items-center flex-1">
          <View className="relative">
            <View className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden border-2 border-white shadow-sm items-center justify-center">
               {user.image ? (
                 <Image source={{ uri: user.image }} className="w-full h-full" />
               ) : (
                 <Text className="text-blue-600 font-black text-lg">{(user.name || "U").substring(0, 1)}</Text>
               )}
            </View>
            {isOnline && (
              <View className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white" />
            )}
          </View>
          
          <View className="ml-5 flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-slate-900 font-black text-lg" numberOfLines={1}>{user.name || "User"}</Text>
              {user.role === 'admin' && <ShieldCheck size={14} color="#4F46E5" />}
            </View>
            <Text className="text-slate-400 text-xs font-bold" numberOfLines={1}>{user.email || "user@example.com"}</Text>
            
            <View className="flex-row mt-3 gap-2">
               <View className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                  <Text className="text-slate-500 text-[8px] font-black uppercase tracking-widest">{user.role || 'STUDENT'}</Text>
               </View>
               {user.role === 'teacher' && (
                 <View className="bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                    <Text className="text-blue-600 text-[8px] font-black uppercase tracking-widest">Instructor</Text>
                 </View>
               )}
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          className="w-12 h-12 items-center justify-center bg-slate-50 rounded-2xl"
          onPress={() => {
            setSelectedUser(user);
            setMenuVisible(true);
          }}
        >
           <MoreHorizontal size={20} color={COLORS.slate900} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} role="Admin" title="Directory" subtitle="Management" />

      <ScrollView 
        className="flex-1 bg-[#F8FAFC]"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-8 pt-8 mb-10">
           <View className="bg-blue-50 px-4 py-1.5 rounded-full self-start mb-4">
              <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Management</Text>
           </View>
           <Text className="text-[44px] font-black text-slate-900 leading-[48px] tracking-tighter">
              User <Text className="text-blue-600">Directory</Text>
           </Text>
           <Text className="text-slate-400 text-base font-medium mt-2">Manage students, instructors, and permissions.</Text>
        </View>

           {/* Tab Switcher */}
           <View className="px-8 mb-10">
              <View className="bg-slate-100/50 p-2 rounded-[32px] flex-row">
                {["Students", "Teachers", "Admins"].map((tab) => (
                  <TouchableOpacity 
                    key={tab} 
                    onPress={() => setActiveTab(tab as any)}
                    className={`flex-1 py-4 rounded-[26px] items-center ${activeTab === tab ? 'bg-white shadow-sm' : ''}`}
                  >
                    <Text className={`font-black text-sm ${activeTab === tab ? 'text-blue-600' : 'text-slate-400'}`}>{tab}</Text>
                  </TouchableOpacity>
                ))}
              </View>
           </View>

           {/* Stats Card */}
           <View className="px-8 mb-10">
              <View className="bg-white rounded-[44px] p-8 border border-slate-50 shadow-sm">
                <Text className="text-slate-900 text-base font-black mb-8">Ecosystem Health</Text>
                
                <View className="flex-row gap-4">
                    <View className="flex-1 bg-blue-50/50 p-6 rounded-[32px] border border-blue-50">
                      <Text className="text-blue-600/60 text-[10px] font-black uppercase tracking-widest mb-2">Total Students</Text>
                      <Text className="text-blue-600 text-3xl font-black">{students.length.toLocaleString()}</Text>
                    </View>
                    <View className="flex-1 bg-slate-50 p-6 rounded-[32px] border border-slate-50">
                      <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Staff</Text>
                      <Text className="text-slate-900 text-3xl font-black">{staff.length.toLocaleString()}</Text>
                    </View>
                </View>

                <View className="mt-8 flex-row items-center justify-between px-2">
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                      <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Active Now</Text>
                    </View>
                    <Text className="text-slate-900 font-black text-sm">{Math.ceil((students.length + staff.length) * 0.18)}</Text>
                </View>
              </View>
           </View>

            {/* Quick Filters */}
            <View className="px-8 mb-6">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                 {['All Members', 'Recently Joined', 'Premium', 'Pending Verify'].map((filter) => (
                   <TouchableOpacity 
                     key={filter}
                     className="mr-3 px-6 py-4 bg-white rounded-2xl border border-slate-50 shadow-sm"
                   >
                      <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{filter}</Text>
                   </TouchableOpacity>
                 ))}
              </ScrollView>
            </View>

            {/* Search and Add */}
            <View className="px-8 flex-row gap-4 mb-8">
               <View className="flex-1 bg-white h-16 rounded-[24px] border border-slate-50 shadow-sm flex-row items-center px-5">
                  <Search size={20} color={COLORS.slate300} />
                  <TextInput 
                    placeholder="Search by name, email..."
                    className="flex-1 ml-3 font-bold text-slate-900"
                    placeholderTextColor={COLORS.slate300}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
               </View>
               <TouchableOpacity className="w-16 h-16 bg-blue-600 rounded-[24px] items-center justify-center shadow-lg shadow-blue-600/30">
                  <Plus size={28} color="white" />
               </TouchableOpacity>
            </View>

            {/* User List */}
            <View className="px-8">
               {!isLoading && filteredUsers.length > 0 && (
                 <View className="flex-row items-center justify-between mb-6 px-2">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                       Showing {filteredUsers.length} {activeTab.toLowerCase()}
                    </Text>
                    <TouchableOpacity>
                       <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Sort by Date</Text>
                    </TouchableOpacity>
                 </View>
               )}
               {isLoading ? (
                 <View className="gap-4">
                   <Skeleton height={80} className="rounded-[32px]" />
                   <Skeleton height={80} className="rounded-[32px]" />
                   <Skeleton height={80} className="rounded-[32px]" />
                 </View>
               ) : filteredUsers.length === 0 ? (
                 <Text className="text-center text-slate-400 font-bold py-10">No users found</Text>
               ) : (
                 filteredUsers.map((user, idx) => (
                   <UserCard key={idx} user={user} />
                 ))
               )}
            </View>
      </ScrollView>

      {/* User Actions Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          className="flex-1 bg-slate-900/50 justify-end"
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
           <View className="bg-white rounded-t-[44px] p-8 pb-12">
              <View className="flex-row justify-between items-center mb-10">
                 <View>
                    <Text className="text-slate-900 text-2xl font-black">{selectedUser?.name}</Text>
                    <Text className="text-slate-400 text-sm font-bold mt-1">Manage User Permissions</Text>
                 </View>
                 <TouchableOpacity 
                   onPress={() => setMenuVisible(false)}
                   className="p-3 bg-slate-50 rounded-2xl"
                 >
                    <X size={20} color={COLORS.slate900} />
                 </TouchableOpacity>
              </View>

              <View className="gap-4">
                 {selectedUser?.role === 'student' && (
                   <TouchableOpacity 
                     onPress={() => handleUpdateRole(selectedUser.id || selectedUser._id, 'teacher')}
                     className="bg-blue-50 p-6 rounded-[28px] flex-row items-center border border-blue-100"
                   >
                      <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center mr-4">
                         <UserCog size={20} color={COLORS.primary} />
                      </View>
                      <View>
                         <Text className="text-blue-900 font-black text-base">Promote to Teacher</Text>
                         <Text className="text-blue-600/60 text-xs font-bold">Grant instructional privileges</Text>
                      </View>
                   </TouchableOpacity>
                 )}

                 {selectedUser?.role !== 'admin' && (
                   <TouchableOpacity 
                     onPress={() => handleUpdateRole(selectedUser.id || selectedUser._id, 'admin')}
                     className="bg-indigo-50 p-6 rounded-[28px] flex-row items-center border border-indigo-100"
                   >
                      <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center mr-4">
                         <ShieldCheck size={20} color="#4F46E5" />
                      </View>
                      <View>
                         <Text className="text-indigo-900 font-black text-base">Make Administrator</Text>
                         <Text className="text-indigo-600/60 text-xs font-bold">Full platform access</Text>
                      </View>
                   </TouchableOpacity>
                 )}

                 <TouchableOpacity className="bg-slate-50 p-6 rounded-[28px] flex-row items-center border border-slate-100">
                    <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center mr-4">
                       <UserX size={20} color={COLORS.slate400} />
                    </View>
                    <View>
                       <Text className="text-slate-900 font-black text-base">Deactivate Account</Text>
                       <Text className="text-slate-400 text-xs font-bold">Temporarily disable access</Text>
                    </View>
                 </TouchableOpacity>

                 <TouchableOpacity 
                   onPress={() => {
                     setMenuVisible(false);
                     navigation.navigate('AdminSendNotification', { targetUser: selectedUser.id || selectedUser._id, targetRole: 'user' });
                   }}
                   className="bg-purple-50 p-6 rounded-[28px] flex-row items-center border border-purple-100"
                 >
                    <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center mr-4">
                       <Bell size={20} color="#7C3AED" />
                    </View>
                    <View>
                       <Text className="text-purple-900 font-black text-base">Send Notification</Text>
                       <Text className="text-purple-600/60 text-xs font-bold">Dispatch a direct platform alert</Text>
                    </View>
                 </TouchableOpacity>

                 <TouchableOpacity 
                   onPress={() => handleDeleteUser(selectedUser.id || selectedUser._id)}
                   className="bg-rose-50 p-6 rounded-[28px] flex-row items-center border border-rose-100 mt-4"
                 >
                    <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center mr-4">
                       <Trash2 size={20} color="#F43F5E" />
                    </View>
                    <View>
                       <Text className="text-rose-900 font-black text-base">Delete Permanently</Text>
                       <Text className="text-rose-600/60 text-xs font-bold">This action cannot be undone</Text>
                    </View>
                 </TouchableOpacity>
              </View>
           </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaWrapper>
  );
}
