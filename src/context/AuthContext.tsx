/** @jsxImportSource react */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { authApi } from "../api/endpoints";
import { setLogoutListener } from "../api/client";
import { extractApiData, isApiSuccess } from "../api/response";
import { User } from "../types";


interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeUser = (raw: any): User => {
  const email = String(raw?.email || "");
  const fallbackNameFromEmail = email.includes("@") ? email.split("@")[0] : "Student";

  return {
    ...raw,
    id: String(raw?.id || raw?._id || ""),
    name: String(raw?.name || raw?.full_name || raw?.username || fallbackNameFromEmail),
  } as User;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Hydrate session from AsyncStorage on app start ──────────────────────
  useEffect(() => {
    const hydrate = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("auth_token");
        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        setToken(storedToken);

        // Validate token by hitting /auth/me
        const res = await authApi.me();
        const payload = res.data;
        if (isApiSuccess(payload)) {
          const me = extractApiData<User | null>(payload, null);
          if (me) {
            setUser(normalizeUser(me));
          } else {
            await AsyncStorage.removeItem("auth_token");
            setToken(null);
          }
        } else {
          await SecureStore.deleteItemAsync("auth_token");
          setToken(null);
        }
      } catch {
        // Token invalid – clear it silently
        await SecureStore.deleteItemAsync("auth_token");
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    hydrate();

    // Register the global 401 logout listener for the axios interceptor
    setLogoutListener(async () => {
      // Set React state FIRST for immediate UI transition
      setToken(null);
      setUser(null);
      // Then clean up storage
      SecureStore.deleteItemAsync("auth_token").catch(() => {});
    });
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────
  const login = async (newToken: string, userData: User) => {
    await SecureStore.setItemAsync("auth_token", newToken);
    setToken(newToken);
    setUser(normalizeUser(userData));
  };

  const logout = async () => {
    // Set React state FIRST for immediate UI transition
    setToken(null);
    setUser(null);
    // Then clean up persistent storage (non-blocking)
    try {
      await SecureStore.deleteItemAsync("auth_token");
    } catch (e) {
      // Storage cleanup failed but UI already transitioned
    }
  };

  const updateUser = (userData: User) => setUser(normalizeUser(userData));

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};
