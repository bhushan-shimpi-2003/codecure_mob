import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
} from "react-native";
import { SafeAreaWrapper } from "../../layouts/SafeAreaWrapper";
import { adminApi } from "../../api/endpoints";
import { extractApiData, getApiError, isApiSuccess } from "../../api/response";
import { Skeleton } from "../../components/Skeleton";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Wallet, Settings2, Plus } from "lucide-react-native";
import { COLORS } from "../../utils/theme";

export default function AdminPulseScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [txModalVisible, setTxModalVisible] = useState(false);
  const [isCreatingTx, setIsCreatingTx] = useState(false);
  const [txType, setTxType] = useState<"credit" | "debit">("credit");
  const [txDescription, setTxDescription] = useState("");
  const [txAmount, setTxAmount] = useState("");

  const [settingModalVisible, setSettingModalVisible] = useState(false);
  const [selectedSettingKey, setSelectedSettingKey] = useState("");
  const [selectedSettingValue, setSelectedSettingValue] = useState("");
  const [isUpdatingSetting, setIsUpdatingSetting] = useState(false);

  const fetchPulse = async () => {
    setErrorMessage(null);
    try {
      const [txRes, settingsRes] = await Promise.allSettled([
        adminApi.getTransactions(),
        adminApi.getSettings(),
      ]);

      if (txRes.status === "fulfilled" && isApiSuccess(txRes.value.data)) {
        const data = extractApiData<any[]>(txRes.value.data, []);
        setTransactions(Array.isArray(data) ? data : []);
      } else {
        setTransactions([]);
      }

      if (settingsRes.status === "fulfilled" && isApiSuccess(settingsRes.value.data)) {
        const data = extractApiData<any[]>(settingsRes.value.data, []);
        setSettings(Array.isArray(data) ? data : []);
      } else {
        setSettings([]);
      }

      const firstError =
        (txRes.status === "fulfilled" && !isApiSuccess(txRes.value.data) && getApiError(txRes.value.data)) ||
        (settingsRes.status === "fulfilled" && !isApiSuccess(settingsRes.value.data) && getApiError(settingsRes.value.data));
      if (firstError) {
        setErrorMessage(firstError);
      }
    } catch (e) {
      console.log("Error loading admin pulse", e);
      setErrorMessage("Failed to load pulse data");
      setTransactions([]);
      setSettings([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPulse();
  }, []);

  const revenue = useMemo(
    () =>
      transactions.reduce((sum, item) => {
        const amount = Number(item?.amount || 0);
        if (item?.type === "debit") return sum - amount;
        return sum + amount;
      }, 0),
    [transactions]
  );

  const handleCreateTransaction = async () => {
    if (!txDescription.trim() || !txAmount.trim()) {
      setErrorMessage("Description and amount are required");
      return;
    }

    setErrorMessage(null);
    setIsCreatingTx(true);
    try {
      const res = await adminApi.createTransaction({
        type: txType,
        description: txDescription.trim(),
        amount: Number(txAmount),
      });
      if (isApiSuccess(res.data)) {
        setTxModalVisible(false);
        setTxDescription("");
        setTxAmount("");
        setTxType("credit");
        fetchPulse();
      } else {
        setErrorMessage(getApiError(res.data));
      }
    } catch (e) {
      console.log("Error creating transaction", e);
      setErrorMessage("Failed to create transaction");
    } finally {
      setIsCreatingTx(false);
    }
  };

  const handleOpenSetting = (key: string, value: string) => {
    setSelectedSettingKey(key);
    setSelectedSettingValue(String(value || ""));
    setSettingModalVisible(true);
  };

  const handleUpdateSetting = async () => {
    if (!selectedSettingKey) return;

    setErrorMessage(null);
    setIsUpdatingSetting(true);
    try {
      const res = await adminApi.updateSetting(selectedSettingKey, selectedSettingValue);
      if (isApiSuccess(res.data)) {
        setSettingModalVisible(false);
        setSelectedSettingKey("");
        setSelectedSettingValue("");
        fetchPulse();
      } else {
        setErrorMessage(getApiError(res.data));
      }
    } catch (e) {
      console.log("Error updating setting", e);
      setErrorMessage("Failed to update setting");
    } finally {
      setIsUpdatingSetting(false);
    }
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
              fetchPulse();
            }}
          />
        }
      >
        <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-black text-slate-900">Platform Pulse</Text>
            <Text className="text-slate-500 mt-1">Monitor finances and global settings</Text>
          </View>
          <TouchableOpacity
            onPress={() => setTxModalVisible(true)}
            className="bg-blue-600 rounded-2xl p-3"
          >
            <Plus size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View className="px-6 pt-2 pb-4 flex-row gap-3">
          <View className="flex-1 bg-white rounded-2xl border border-slate-100 p-4">
            <Text className="text-xs text-slate-500 uppercase font-black tracking-wider">Transactions</Text>
            <Text className="text-2xl font-black text-slate-900 mt-1">{transactions.length}</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl border border-slate-100 p-4">
            <Text className="text-xs text-slate-500 uppercase font-black tracking-wider">Net Revenue</Text>
            <Text className="text-2xl font-black text-emerald-600 mt-1">₹{revenue}</Text>
          </View>
        </View>

        {errorMessage ? (
          <View className="mx-6 mb-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Text className="text-amber-700 text-sm font-semibold">{errorMessage}</Text>
          </View>
        ) : null}

        <View style={{ padding: 24, paddingTop: 12 }}>
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Wallet size={16} color={COLORS.slate500} />
              <Text className="text-sm font-black text-slate-500 uppercase tracking-wider ml-2">Recent Transactions</Text>
            </View>

            {isLoading ? (
              <View className="gap-4">
                <Skeleton height={120} className="rounded-3xl" />
                <Skeleton height={120} className="rounded-3xl" />
              </View>
            ) : transactions.length === 0 ? (
              <View className="bg-white border border-slate-100 rounded-3xl p-8 items-center justify-center">
                <Text className="text-slate-600 font-bold">No transaction records</Text>
              </View>
            ) : (
              transactions.slice(0, 10).map((tx, idx) => {
                const id = String(tx?.id || tx?._id || idx);
                const isDebit = tx?.type === "debit";
                return (
                  <View key={id} className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 mb-3">
                    <Text className="text-slate-900 text-base font-black" numberOfLines={1}>
                      {tx?.description || "Transaction"}
                    </Text>
                    <Text className={`text-sm font-bold mt-1 ${isDebit ? "text-rose-600" : "text-emerald-600"}`}>
                      {isDebit ? "-" : "+"}₹{Number(tx?.amount || 0)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          <View>
            <View className="flex-row items-center mb-3">
              <Settings2 size={16} color={COLORS.slate500} />
              <Text className="text-sm font-black text-slate-500 uppercase tracking-wider ml-2">Global Settings</Text>
            </View>

            {settings.map((setting, idx) => {
              const key = String(setting?.key || idx);
              const value = String(setting?.value ?? "");
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleOpenSetting(key, value)}
                  className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 mb-3"
                >
                  <Text className="text-slate-900 text-sm font-black" numberOfLines={1}>{key}</Text>
                  <Text className="text-slate-500 text-sm mt-1" numberOfLines={1}>{value}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={txModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTxModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900/50 justify-end">
          <View className="bg-white rounded-t-[36px] p-6 h-[62%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-black text-slate-900">New Transaction</Text>
              <TouchableOpacity onPress={() => setTxModalVisible(false)}>
                <Text className="text-slate-500 font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Description"
              placeholder="Payment received"
              value={txDescription}
              onChangeText={setTxDescription}
            />
            <Input
              label="Amount"
              placeholder="1000"
              keyboardType="numeric"
              value={txAmount}
              onChangeText={setTxAmount}
            />

            <Text className="text-slate-500 font-bold mb-2 ml-1">Type</Text>
            <View className="flex-row gap-2 mb-6">
              <TouchableOpacity
                onPress={() => setTxType("credit")}
                className={`flex-1 h-12 rounded-xl border items-center justify-center ${txType === "credit" ? "bg-emerald-600 border-emerald-600" : "bg-white border-slate-200"}`}
              >
                <Text className={`font-bold ${txType === "credit" ? "text-white" : "text-slate-700"}`}>Credit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTxType("debit")}
                className={`flex-1 h-12 rounded-xl border items-center justify-center ${txType === "debit" ? "bg-rose-600 border-rose-600" : "bg-white border-slate-200"}`}
              >
                <Text className={`font-bold ${txType === "debit" ? "text-white" : "text-slate-700"}`}>Debit</Text>
              </TouchableOpacity>
            </View>

            <Button title="Create Transaction" isLoading={isCreatingTx} onPress={handleCreateTransaction} />
          </View>
        </View>
      </Modal>

      <Modal
        visible={settingModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSettingModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900/50 justify-end">
          <View className="bg-white rounded-t-[36px] p-6 h-[52%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-black text-slate-900">Update Setting</Text>
              <TouchableOpacity onPress={() => setSettingModalVisible(false)}>
                <Text className="text-slate-500 font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            <Input label="Key" value={selectedSettingKey} editable={false} />
            <Input label="Value" value={selectedSettingValue} onChangeText={setSelectedSettingValue} />

            <Button title="Save Setting" isLoading={isUpdatingSetting} onPress={handleUpdateSetting} />
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
