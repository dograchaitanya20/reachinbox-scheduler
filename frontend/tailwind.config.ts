import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0FAF3',
          100: '#E4F5EA',
          200: '#C2E8CF',
          500: '#00A63E',
          600: '#008C34',
          700: '#00702A',
        },
        surface: {
          DEFAULT: '#F5F6F5',
          muted: '#F8F9F8',
          border: '#E6E8E6',
        },
        orangePill: {
          bg: '#FFF1E3',
          text: '#D4570F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        pixel: ['Silkscreen', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
