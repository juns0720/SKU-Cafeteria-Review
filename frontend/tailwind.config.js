/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        shimmer: 'shimmer 1.5s infinite linear',
        fadeIn: 'fadeIn 0.2s ease forwards',
        fadeInUp: 'fadeInUp 0.3s ease forwards',
        slideUp: 'slideUp 0.25s ease forwards',
      },
      backgroundSize: {
        '200': '200% 100%',
      },
      colors: {
        primary: '#D94148',
        'primary-dark': '#B93540',
        'primary-light': '#FDEAEB',
        star: '#FBBF24',
        surface: '#F8F8F8',
        success: '#22C55E',
        error: '#D94148',
      },
      fontFamily: {
        sans: ['Pretendard', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
