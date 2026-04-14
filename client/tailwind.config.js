/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "mic-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%":      { transform: "scale(1.15)" },
        },
      },
      animation: {
        "fade-in":    "fade-in 0.2s ease-out",
        "slide-up":   "slide-up 0.25s ease-out",
        "mic-pulse":  "mic-pulse 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
