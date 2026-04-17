// ─── Brand Color Palette ──────────────────────────────────────────────────────
export const COLORS = {
  primary:      "#2563eb",
  primaryDark:  "#1d4ed8",
  primaryLight: "#3b82f6",
  primaryFaint: "#eff6ff",
  primaryBorder:"#bfdbfe",

  secondary:    "#0ea5e9",

  accent:       "#f59e0b",

  slate50:      "#f8fafc",
  slate100:     "#f1f5f9",
  slate200:     "#e2e8f0",
  slate300:     "#cbd5e1",
  slate400:     "#94a3b8",
  slate500:     "#64748b",
  slate600:     "#475569",
  slate700:     "#334155",
  slate800:     "#1e293b",
  slate900:     "#0f172a",

  white:        "#ffffff",
  black:        "#000000",

  success:      "#22c55e",
  error:        "#ef4444",
  warning:      "#f59e0b",

  // Role-specific
  adminGold:    "#d97706",
  teacherGreen: "#16a34a",
  studentBlue:  "#2563eb",
};

// ─── Typography Scale ─────────────────────────────────────────────────────────
export const FONT_SIZE = {
  xs:   12,
  sm:   14,
  base: 16,
  lg:   18,
  xl:   20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
};

export const FONT_WEIGHT = {
  regular:    "400" as const,
  medium:     "500" as const,
  semibold:   "600" as const,
  bold:       "700" as const,
  extrabold:  "800" as const,
};

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const SPACING = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
};

// ─── Border Radius ────────────────────────────────────────────────────────────
export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  "2xl": 24,
  full: 9999,
};

// ─── Shadows (React Native) ───────────────────────────────────────────────────
export const SHADOW = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────
export const API_BASE_URL = "https://codecure-acedamy.onrender.com";
export const UPLOADS_URL  = `${API_BASE_URL}/uploads`;
