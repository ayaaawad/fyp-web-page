import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        panel: '#0D1322',
        pulse: '#43F0E8',
        neon: '#8C8BFF',
        ember: '#FF8A5B',
      },
      boxShadow: {
        scanner: '0 0 0 1px rgba(140, 139, 255, 0.35), 0 0 40px rgba(67, 240, 232, 0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
