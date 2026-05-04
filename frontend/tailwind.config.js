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
        // ── v3 Coral ──────────────────────────────────────────────
        coral:     '#FF6B5C',
        coralSoft: '#FFEEEC',
        g50:  '#F9FAFB',
        g100: '#F2F4F6',
        g200: '#E5E8EB',
        g300: '#D1D6DB',
        g400: '#B0B8C1',
        g500: '#8B95A1',
        g600: '#6B7684',
        g700: '#4E5968',
        g800: '#333D4B',
        g900: '#191F28',
      },
      fontFamily: {
        // ── v3 Coral ──────────────────────────────────────────────
        pretendard: ['Pretendard', '-apple-system', 'BlinkMacSystemFont',
                     'Apple SD Gothic Neo', 'system-ui', 'sans-serif'],
        sans: ['Pretendard', 'sans-serif'],
      },
      boxShadow: {
        // ── v3 Coral ──────────────────────────────────────────────
        frame:    '0 2px 8px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.08)',
        hairline: 'inset 0 -1px 0 #E5E8EB',
      },
      borderRadius: {
        // ── v3 Coral ──────────────────────────────────────────────
        '2xs': '4px',
        xs:    '6px',
        frame: '32px',
      },
    },
  },
  plugins: [],
}
