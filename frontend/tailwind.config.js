/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
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
        paper: '#FBF6EC',
        paperDeep: '#F4ECDC',
        ink: '#2B2218',
        inkSoft: '#574635',
        mute: '#8E7A66',
        rule: '#D8CBB6',
        orange: '#EF8A3D',
        orangeSoft: '#FCE3C9',
        yellow: '#F4B73B',
        yellowSoft: '#FBE6A6',
        green: '#4A8F5B',
        greenSoft: '#CDE5C8',
        peach: '#F6C7A8',
        red: '#D9543A',
        primary: '#D94148',
        'primary-dark': '#B93540',
        'primary-light': '#FDEAEB',
        star: '#FBBF24',
        surface: '#F8F8F8',
        success: '#22C55E',
        error: '#D94148',
      },
      fontFamily: {
        hand: ['Gaegu', 'system-ui', 'sans-serif'],
        disp: ['Jua', 'system-ui', 'sans-serif'],
        user: ['Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', 'system-ui', 'sans-serif'],
        sans: ['Pretendard', 'sans-serif'],
      },
      boxShadow: {
        flat: '2px 3px 0 rgba(43,34,24,0.18)',
        card: '2px 3px 0 rgba(43,34,24,0.12)',
        pop: '3px 4px 0 rgba(43,34,24,0.22)',
      },
      borderRadius: {
        screen: '32px',
      },
    },
  },
  plugins: [],
}
