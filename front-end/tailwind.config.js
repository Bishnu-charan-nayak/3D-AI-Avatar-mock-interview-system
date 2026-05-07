/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Adjust to the location of your project files
    'node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}', // Include Flowbite React
    'node_modules/flowbite/**/*.js', // Include Flowbite core
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('flowbite/plugin'), // Include Flowbite plugin
  ],
};
