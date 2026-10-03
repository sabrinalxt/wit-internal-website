/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(240 5.9% 90%)",
        background: "#ffffff",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(16, 24, 40, 0.08)",
      },
      borderRadius: {
        xl: "14px",
      },
    },
  },
  plugins: [],
};
