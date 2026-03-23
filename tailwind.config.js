/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#f0faf4',
          100: '#d6f0e0',
          200: '#aadec2',
          300: '#72c49e',
          400: '#3fa578',
          500: '#2D6A4F',
          600: '#245a42',
          700: '#1b4532',
          800: '#133023',
          900: '#0a1c14',
        },
        clay: {
          50:  '#fdf3ef',
          100: '#fbe0d4',
          200: '#f5b89f',
          300: '#ed8b69',
          400: '#e05f36',
          500: '#B5451B',
          600: '#9a3b17',
          700: '#7c2f12',
          800: '#5e230d',
          900: '#3f1708',
        },
        harvest: {
          50:  '#fdf9ee',
          100: '#faf0cf',
          200: '#f3de9a',
          300: '#eac960',
          400: '#DDB030',
          500: '#D4A848',
          600: '#b8893a',
          700: '#9a6e2d',
          800: '#7c5422',
          900: '#5e3d18',
        },
        parchment: '#F5F0E8',
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
