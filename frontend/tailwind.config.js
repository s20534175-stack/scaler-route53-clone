/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        aws: {
          orange: '#FF9900',
          'orange-dark': '#EC7211',
          'orange-light': '#FFF3E0',
          navy: '#232F3E',
          'navy-light': '#31465C',
          blue: '#0073BB',
          'blue-light': '#E8F4FD',
          'blue-dark': '#005E9C',
          green: '#1D8348',
          'green-light': '#E9F7EF',
          red: '#D13212',
          'red-light': '#FDECEA',
          gray: {
            50: '#F8F8F8',
            100: '#F2F3F3',
            200: '#D5DBDB',
            300: '#AAB7B8',
            400: '#879596',
            500: '#687078',
            600: '#535B60',
            700: '#3F4447',
            800: '#2B2F31',
            900: '#16191D',
          }
        }
      },
      fontFamily: {
        sans: ['Amazon Ember', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
