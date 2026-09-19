import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#05070d",
          900: "#0a0e17",
          850: "#0d1220",
          800: "#111827",
          700: "#1b2333",
          600: "#2a3448",
          500: "#3d4a63",
          100: "#e6ebf2",
        },
        accent: {
          DEFAULT: "#3ddc97",
          dim: "#1f8f63",
          glow: "#5eead4",
        },
        warn: "#f5b942",
        crit: "#ff5470",
        info: "#4fa9ff",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(61,220,151,0.15), 0 0 24px rgba(61,220,151,0.08)",
      },
      animation: {
        pulseSlow: "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
