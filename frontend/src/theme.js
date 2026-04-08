import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#f0eeff" },
          100: { value: "#d4ceff" },
          200: { value: "#b8acff" },
          300: { value: "#9b8aff" },
          400: { value: "#8a7bff" },
          500: { value: "#7a69ff" }, // Your primary purple
          600: { value: "#6558ee" },
          700: { value: "#5045cc" },
          800: { value: "#3b32aa" },
          900: { value: "#261f88" },
        },
        accent: {
          400: { value: "#1fb6ff" },
          500: { value: "#00a8f0" },
        },
        success: {
          400: { value: "#5be4a8" },
          500: { value: "#3dd498" },
        },
        danger: {
          400: { value: "#ff6b81" },
          500: { value: "#ff4757" },
        },
      },
      fonts: {
        heading: { value: "'Space Grotesk', 'Inter', system-ui, sans-serif" },
        body: { value: "'Space Grotesk', 'Inter', system-ui, sans-serif" },
      },
    },
    // SEMANTIC TOKENS: This makes your code much cleaner
    semanticTokens: {
      colors: {
        primary: { value: "{colors.brand.500}" },
        "primary.hover": { value: "{colors.brand.600}" },
        "bg.canvas": { value: "#f9fafb" }, // Light grey dashboard background
        "bg.panel": { value: "#ffffff" },  // White cards
        "border.subtle": { value: "{colors.brand.100}" },
      },
    },
    // Global styles to make the app feel "App-like"
    keyframes: {
      pulseGlow: {
        "0%, 100%": { opacity: 1, transform: "scale(1)" },
        "50%": { opacity: 0.7, transform: "scale(1.05)" },
      },
    },
  },
});

export const system = createSystem(defaultConfig, customConfig);
export default system;