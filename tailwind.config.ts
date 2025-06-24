import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        duolingo: {
          green: "#58cc02",
          greenDark: "#46a302",
          blue: "#1cb0f6",
          red: "#ff4b4b",
          gray: "#e5e5e5",
          text: "#4c4c4c",
          border: "#e5e5e5",
          background: "#f7f7f7",
          card: "#ffffff",
        },
      },
      borderRadius: {
        'xl': '1rem', // 既存のxlを上書き、または新しいサイズを追加
        '2xl': '1.5rem',
        '3xl': '2rem', // Duolingo風の大きな角丸
      },
      fontFamily: {
        // Duolingoで使われているフォントに近いものを指定 (例: sans-serif)
        // 実際に 'Feather Bold' や 'DIN Next Rounded LT Pro' を使う場合はフォントファイルの準備と@font-faceの設定が必要
        sans: ['"system-ui"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config; 