/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#004ac6",
          container: "#2563eb",
          fixed: "#dbe1ff",
          "fixed-dim": "#b4c5ff",
        },
        secondary: {
          DEFAULT: "#565e74",
          container: "#dae2fd",
          fixed: "#dae2fd",
          "fixed-dim": "#bec6e0",
        },
        tertiary: {
          DEFAULT: "#005b7c",
          container: "#00759f",
          fixed: "#c4e7ff",
          "fixed-dim": "#7bd0ff",
        },
        surface: {
          DEFAULT: "#f7f9fb",
          bright: "#f7f9fb",
          dim: "#d8dadc",
          container: {
            DEFAULT: "#eceef0",
            low: "#f2f4f6",
            lowest: "#ffffff",
            high: "#e6e8ea",
            highest: "#e0e3e5",
          },
          variant: "#e0e3e5",
          tint: "#0053db",
        },
        background: "#f7f9fb",
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
        },
        outline: {
          DEFAULT: "#737686",
          variant: "#c3c6d7",
        },
        "on-primary": "#ffffff",
        "on-primary-container": "#eeefff",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#5c647a",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#e1f2ff",
        "on-surface": "#191c1e",
        "on-surface-variant": "#434655",
        "on-background": "#191c1e",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
      },
      fontFamily: {
        sans: ["Inter", "System"],
        headline: ["Inter"],
        body: ["Inter"],
        label: ["Inter"],
      },
    },
  },
  plugins: [],
};
