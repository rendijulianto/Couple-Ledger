/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#ffffff",
        ink: {
          DEFAULT: "#222222",
          muted: "#717171",
          subtle: "#b0b0b0",
        },
        rausch: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          active: "rgb(var(--color-primary-active) / <alpha-value>)",
          disabled: "rgb(var(--color-primary-disabled) / <alpha-value>)",
        },
        surface: {
          soft: "#f7f7f7",
          strong: "#f2f2f2",
        },
        hairline: {
          DEFAULT: "#dddddd",
          soft: "#ebebeb",
          strong: "#c1c1c1",
        },
        error: {
          DEFAULT: "#c13515",
          soft: "#fff8f6",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "14px",
      },
      boxShadow: {
        float:
          "rgba(0, 0, 0, 0.02) 0 0 0 1px, rgba(0, 0, 0, 0.04) 0 2px 6px 0, rgba(0, 0, 0, 0.1) 0 4px 8px 0",
      },
      fontFamily: {
        sans: [
          "Inter",
          "Circular",
          "-apple-system",
          "BlinkMacSystemFont",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

