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
			}
		}
	},
  plugins: [
		require('@tailwindcss/forms'),
	],
}
