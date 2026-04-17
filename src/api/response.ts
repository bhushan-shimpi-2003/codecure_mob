type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export const isApiSuccess = (payload: unknown): boolean => {
  if (!payload || typeof payload !== "object") return true;
  const maybeEnvelope = payload as ApiEnvelope<unknown>;
  return maybeEnvelope.success !== false;
};

export const getApiError = (payload: unknown): string => {
  if (!payload || typeof payload !== "object") return "Request failed";
  const maybeEnvelope = payload as ApiEnvelope<unknown>;
  return maybeEnvelope.error || maybeEnvelope.message || "Request failed";
};

export const extractApiData = <T>(payload: unknown, fallback: T): T => {
  if (payload == null) return fallback;
  if (typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    const envelope = payload as ApiEnvelope<T>;
    return (envelope.data as T) ?? fallback;
  }
  return payload as T;
};
