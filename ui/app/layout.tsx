import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
	title: 'James Gurney Knowledge Base',
	description: 'Ask anything you want to know about James Gurney',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={inter.className}>
			<body>
				<header className="sticky top-0 p-4 bg-gray-200">
					James Gurney Knowledge Base
				</header>
				{children}
			</body>
		</html>
	);
}
