export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { navy: { 950: '#071428', 900: '#0b1f3a', 800: '#10294b', 700: '#173a66', 100: '#e3ebf5' } },
    fontFamily: { sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'], display: ['"Sora"', 'system-ui', 'sans-serif'] }
  } },
  plugins: []
}
