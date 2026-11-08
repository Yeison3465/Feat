/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Evora Dark: negro neutro, blanco cálido como destacado, rojo solo para riesgo.
      // Mantener en sincronía con src/shared/theme/tokens.ts
      colors: {
        app: "#0A0A0B",
        card: "#141416",
        card2: "#1D1D20",
        ink: "#0C0C0E",
        line: "#2A2A2E",
        line2: "#303036",
        warm: "#F5F5F3",
        muted: "#A3A3A8",
        muted2: "#8E8E94",
        danger: "#FF6B5E",
        "danger-soft": "#FF8A7E",
        ok: "#7FD6A4",
        "ok-soft": "#86DDAB",
        warn: "#F2C46D",
        gold: "#A6824A",
      },
      fontFamily: {
        // En React Native la familia define el peso: se elige con font-geist-*
        geist: ["Geist_400Regular"],
        "geist-light": ["Geist_300Light"],
        "geist-medium": ["Geist_500Medium"],
        "geist-semibold": ["Geist_600SemiBold"],
      },
      borderRadius: {
        pill: "999px",
        card: "28px",
        hero: "32px",
        field: "20px",
      },
    },
  },
  plugins: [],
};
