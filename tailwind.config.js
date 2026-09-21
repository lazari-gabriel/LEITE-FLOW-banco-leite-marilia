/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blh: {
          primary: "#235347",
          "primary-dark": "#16362e",
          "primary-light": "#357262",
          "primary-soft": "#eaf3f0",
          "primary-tint": "#f3f8f6",
          accent: "#cf6656",
          "accent-soft": "#fcf1ef",
          "accent-dark": "#a94b3d",
          amber: "#b87d28",
          "amber-soft": "#fcf6ea",
          "amber-line": "#eed6aa",
          "amber-dark": "#795219",
          slate: {
            950: "#091217",
            900: "#0f1c24",
            800: "#16252f",
            700: "#223542",
            600: "#334a5a",
            500: "#486273",
            400: "#698394",
            300: "#a2b5c2",
            200: "#cfe0ea",
            100: "#e9f1f6",
            50: "#f6f9fb",
          },
          bg: "#f4f7f6",
          surface: "#ffffff",
          line: "#dbe5e1",
          "line-strong": "#c1d3cc",
          success: "#15803d",
          "success-soft": "#f0fdf4",
          danger: "#b91c1c",
          "danger-soft": "#fef2f2",
        }
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Plus Jakarta Sans", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 28, 36, 0.05), 0 4px 12px rgba(15, 28, 36, 0.03)",
        elevation: "0 4px 20px rgba(15, 28, 36, 0.08)",
        floating: "0 10px 25px rgba(15, 28, 36, 0.12)",
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      }
    },
  },
  plugins: [],
}
