import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  TextInput,
  Dimensions,
  Platform as RNPlatform,
  Alert
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { 
  ChevronLeft, 
  Settings, 
  Globe, 
  Bell, 
  Sun, 
  Moon, 
  Monitor, 
  Key, 
  Eye, 
  EyeOff,
  Info,
  LogOut
} from "lucide-react-native";
import { COLORS } from "../../utils/theme";
import { LinearGradient } from "expo-linear-gradient";
import { adminApi } from "../../api/endpoints";
import { extractApiData, isApiSuccess } from "../../api/response";
import { useAuth } from "../../context/AuthContext";
import { AppHeader } from "../../components/AppHeader";

const { width } = Dimensions.get("window");

export default function AdminProfileScreen({ navigation }: any) {
  const { logout } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [theme, setTheme] = useState("Light");
  
  const [gatewayKey, setGatewayKey] = useState("");
  const [storageSecret, setStorageSecret] = useState("");
  
  const [showGatewayKey, setShowGatewayKey] = useState(false);
  const [showStorageSecret, setShowStorageSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await adminApi.getSettings();
      if (isApiSuccess(res.data)) {
        const data = extractApiData<any>(res.data, {});
        // Map settings based on common keys
        if (data.maintenance_mode !== undefined) setMaintenanceMode(data.maintenance_mode === 'true' || data.maintenance_mode === true);
        if (data.push_notifications !== undefined) setPushNotifications(data.push_notifications === 'true' || data.push_notifications === true);
        if (data.theme) setTheme(data.theme);
        if (data.stripe_key || data.payment_key) setGatewayKey(data.stripe_key || data.payment_key);
        if (data.aws_secret || data.storage_secret) setStorageSecret(data.aws_secret || data.storage_secret);
      }
    } catch (e) {
      console.log("Error loading settings", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateConfig = async () => {
    setIsUpdating(true);
    try {
      // Save multiple settings
      const settingsToUpdate = [
        adminApi.updateSetting("maintenance_mode", String(maintenanceMode)),
        adminApi.updateSetting("push_notifications", String(pushNotifications)),
        adminApi.updateSetting("theme", theme),
        adminApi.updateSetting("payment_key", gatewayKey),
        adminApi.updateSetting("storage_secret", storageSecret)
      ];

      await Promise.allSettled(settingsToUpdate);
      Alert.alert("Success", "Platform configuration updated successfully");
    } catch (e) {
      Alert.alert("Error", "Failed to update some settings");
    } finally {
      setIsUpdating(false);
    }
  };

  const SettingRow = ({ label, description, value, onValueChange }: any) => (
    <View className="flex-row items-center justify-between mb-8">
      <View className="flex-1 mr-4">
        <Text className="text-slate-900 font-black text-base">{label}</Text>
        <Text className="text-slate-400 text-xs font-bold leading-5 mt-1">{description}</Text>
      </View>
      <Switch 
        value={value} 
        onValueChange={onValueChange}
        trackColor={{ false: "#E2E8F0", true: "#2563EB" }}
        thumbColor={RNPlatform.OS === 'ios' ? '#FFFFFF' : (value ? '#FFFFFF' : '#F8FAFC')}
      />
    </View>
  );

  return (
    <SafeAreaWrapper bgWhite>
      <AppHeader navigation={navigation} role="Admin" title="Platform" subtitle="Settings" />

      <ScrollView 
        className="flex-1 bg-[#F8FAFC]"
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <LinearGradient
          colors={['#0047AB', '#002D72']}
          className="p-10 rounded-[44px] mb-10 overflow-hidden relative"
        >
           <View className="bg-white/20 px-4 py-1.5 rounded-full self-start mb-4 border border-white/20">
              <Text className="text-white text-[10px] font-black uppercase tracking-widest">System</Text>
           </View>
           <Text className="text-white text-[44px] font-black leading-[48px] tracking-tighter">
              Platform <Text className="text-blue-200">Settings</Text>
           </Text>
           <Text className="text-blue-100 text-base font-medium mt-2">Configure platform rules and integrations.</Text>
        </LinearGradient>

        <Text className="text-slate-900 text-lg font-black mb-8">General</Text>
        <View className="bg-white rounded-[44px] p-8 border border-slate-50 shadow-sm mb-10">
           <SettingRow 
             label="Maintenance Mode" 
             description="Block student access for updates" 
             value={maintenanceMode} 
             onValueChange={setMaintenanceMode}
           />
           <View className="h-[1px] bg-slate-50 w-full mb-8" />
           <SettingRow 
             label="System Push Notifications" 
             description="Global alerts for critical errors" 
             value={pushNotifications} 
             onValueChange={setPushNotifications}
           />
           <View className="h-[1px] bg-slate-50 w-full mb-8" />
           <TouchableOpacity 
             onPress={() => navigation.navigate('AdminSendNotification')}
             className="flex-row items-center justify-between"
           >
             <View className="flex-1 mr-4">
               <Text className="text-slate-900 font-black text-base">Broadcast Center</Text>
               <Text className="text-slate-400 text-xs font-bold leading-5 mt-1">Send notifications to roles or individuals</Text>
             </View>
             <View className="bg-purple-50 p-3 rounded-xl">
                <Bell size={18} color="#7C3AED" />
             </View>
           </TouchableOpacity>
        </View>

        <Text className="text-slate-900 text-lg font-black mb-8">Appearance</Text>
        <View className="bg-white rounded-[44px] p-8 border border-slate-50 shadow-sm mb-10">
           <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mb-6">Application Theme</Text>
           
           <View className="bg-slate-50 p-2 rounded-[28px] flex-row">
              {[
                { label: "Light", icon: Sun },
                { label: "Dark", icon: Moon },
                { label: "System", icon: Monitor }
              ].map((item) => (
                <TouchableOpacity 
                  key={item.label}
                  onPress={() => setTheme(item.label)}
                  className={`flex-1 flex-row items-center justify-center py-4 rounded-[22px] ${theme === item.label ? 'bg-white shadow-sm' : ''}`}
                >
                   <item.icon size={16} color={theme === item.label ? COLORS.primary : COLORS.slate400} className="mr-2" />
                   <Text className={`font-black text-xs ${theme === item.label ? 'text-slate-900' : 'text-slate-400'}`}>{item.label}</Text>
                </TouchableOpacity>
              ))}
           </View>
        </View>

        <Text className="text-slate-900 text-lg font-black mb-8">Integrations</Text>
        <View className="bg-white rounded-[44px] p-8 border border-slate-50 shadow-sm mb-10">
           <View className="flex-row items-center mb-10">
              <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mr-4">
                 <Key size={20} color={COLORS.primary} />
              </View>
              <View>
                 <Text className="text-slate-900 font-black text-base">API Key Settings</Text>
                 <Text className="text-slate-400 text-[10px] font-bold">Stripe & AWS Cloud Credentials</Text>
              </View>
           </View>

           <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Payment Gateway Key</Text>
           <View className="bg-slate-50 h-16 rounded-[20px] flex-row items-center px-5 mb-8">
              <TextInput 
                value={gatewayKey}
                onChangeText={setGatewayKey}
                placeholder="sk_live_••••••••••••••••"
                className="flex-1 font-bold text-slate-900 text-sm"
                secureTextEntry={!showGatewayKey}
              />
              <TouchableOpacity onPress={() => setShowGatewayKey(!showGatewayKey)}>
                 <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest">
                    {showGatewayKey ? "HIDE" : "SHOW"}
                 </Text>
              </TouchableOpacity>
           </View>

           <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Cloud Storage Secret</Text>
           <View className="bg-slate-50 h-16 rounded-[20px] flex-row items-center px-5 mb-10">
              <TextInput 
                value={storageSecret}
                onChangeText={setStorageSecret}
                placeholder="aws_sec_••••••••••••••••"
                className="flex-1 font-bold text-slate-900 text-sm"
                secureTextEntry={!showStorageSecret}
              />
              <TouchableOpacity onPress={() => setShowStorageSecret(!showStorageSecret)}>
                 <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest">
                    {showStorageSecret ? "HIDE" : "SHOW"}
                 </Text>
              </TouchableOpacity>
           </View>

           <TouchableOpacity 
             onPress={updateConfig}
             disabled={isUpdating}
             className={`bg-blue-600 py-6 rounded-[28px] items-center shadow-lg shadow-blue-600/20 ${isUpdating ? 'opacity-50' : ''}`}
           >
              <Text className="text-white font-black text-sm uppercase tracking-widest">
                {isUpdating ? "UPDATING..." : "Update Configuration"}
              </Text>
           </TouchableOpacity>
        </View>

        <View className="bg-slate-100/50 p-6 rounded-[32px] flex-row items-center justify-between mb-8">
           <View className="flex-row items-center">
              <View className="w-10 h-10 bg-slate-900 rounded-full items-center justify-center mr-4">
                 <Info size={18} color="white" />
              </View>
              <Text className="text-slate-900 font-black text-sm">Platform Version</Text>
           </View>
           <Text className="text-slate-400 font-black text-xs uppercase">v4.2.0-stable</Text>
        </View>

        <TouchableOpacity 
          onPress={logout}
          className="bg-rose-50 border border-rose-100 py-6 rounded-[28px] flex-row items-center justify-center"
        >
           <LogOut size={20} color="#F43F5E" className="mr-3" />
           <Text className="text-rose-600 font-black text-sm uppercase tracking-widest">Sign Out from Admin</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
