/** @jsxImportSource react */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Storage } from "../utils/storage";
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
  const [authState, setAuthState] = useState<{ user: User | null; token: string | null }>({
    user: null,
    token: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // ── Hydrate session from storage on app start ──────────────────────
  useEffect(() => {
    const hydrate = async () => {
      try {
        const storedToken = await Storage.getItem("auth_token");
        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        // Validate token by hitting /auth/me
        const res = await authApi.me();
        const payload = res.data;
        if (isApiSuccess(payload)) {
          const me = extractApiData<User | null>(payload, null);
          if (me) {
            setAuthState({ token: storedToken, user: normalizeUser(me) });
          } else {
            await Storage.deleteItem("auth_token");
            setAuthState({ token: null, user: null });
          }
        } else {
          await Storage.deleteItem("auth_token");
          setAuthState({ token: null, user: null });
        }
      } catch {
        // Token invalid – clear it silently
        await Storage.deleteItem("auth_token");
        setAuthState({ token: null, user: null });
      } finally {
        setIsLoading(false);
      }
    };

    hydrate();

    // Register the global 401 logout listener for the axios interceptor
    setLogoutListener(async () => {
      setAuthState({ token: null, user: null });
      Storage.deleteItem("auth_token").catch(() => {});
    });
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────
  const login = async (newToken: string, userData: User) => {
    await Storage.setItem("auth_token", newToken);
    setAuthState({ token: newToken, user: normalizeUser(userData) });
  };

  const logout = async () => {
    // Atomic state update ensures no race conditions during navigation transitions
    setAuthState({ token: null, user: null });
    
    // Then clean up persistent storage (non-blocking)
    try {
      await Storage.deleteItem("auth_token");
    } catch (e) {
      // Storage cleanup failed but UI already transitioned
    }
  };

  const updateUser = (userData: User) => setAuthState(prev => ({ ...prev, user: normalizeUser(userData) }));

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        token: authState.token,
        isAuthenticated: !!authState.token && !!authState.user,
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
