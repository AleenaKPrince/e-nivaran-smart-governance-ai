/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.15" },
          "50%": { opacity: "0.30" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.8s ease-out both",
        "fade-in-slow": "fadeIn 1.2s ease-out both",
        "fade-in-delay": "fadeIn 0.8s ease-out 0.3s both",
        "fade-in-delay2": "fadeIn 0.8s ease-out 0.6s both",
        "fade-in-delay3": "fadeIn 0.8s ease-out 0.9s both",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
