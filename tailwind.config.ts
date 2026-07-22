import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        asphalt: "#070b0e",
        panel: "#10171d",
        panelSoft: "#162029",
        signal: "#f51f2f",
        racing: "#18a957",
        amber: "#f2b84b",
        cyan: "#39b8d3"
      },
      boxShadow: {
        glow: "0 18px 80px rgba(245, 31, 47, 0.18)"
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};

export default config;
