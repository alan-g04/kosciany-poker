/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        felt: {
          50: '#f1f6f3',
          900: '#0d2417',
          950: '#08160e',
        },
        ivory: '#f5efe1',
        crimson: '#9b2c2c',
      },
      fontFamily: {
        display: ['"Cinzel"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        cell: 'inset 0 0 0 1px rgba(245,239,225,0.18)',
        die: '0 4px 14px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.5)',
      },
    },
  },
  plugins: [],
};
