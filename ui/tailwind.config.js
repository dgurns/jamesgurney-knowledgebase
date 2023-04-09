/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
		extend: {
			keyframes: {
				'fade-in-out': {
					'0%, 100%': { opacity: 0 },
					'50%': { opacity: 1 }
				}
			},
			animation: {
				'fade-in-out': 'fade-in-out 1s ease-in-out infinite'
			},
			boxShadow: {
				't': '0 -1px 3px 0 rgb(0 0 0 / 0.1), 0 -1px 2px -1px rgb(0 0 0 / 0.1)',
				't-md': '0 -4px 6px -1px rgb(0 0 0 / 0.1), 0 -2px 4px -2px rgb(0 0 0 / 0.1)',
				't-lg': '0 -10px 15px -3px rgb(0 0 0 / 0.1), 0 -4px 6px -4px rgb(0 0 0 / 0.1)'
			}
		}
	},
  plugins: [
		require('@tailwindcss/forms'),
	],
}
