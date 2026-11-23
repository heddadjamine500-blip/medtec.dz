/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          blue: '#2585D8',
          blueClassic: '#1A56DB',
          night: '#123B65',
          turquoise: '#20B8A5',
          bg: '#F5F8FC',
          dark: '#1E293B',
          green: '#0E9F6E',
          gray: '#F3F4F6'
        }
      }
    },
  },
  plugins: [],
}
