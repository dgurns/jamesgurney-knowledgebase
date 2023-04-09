import Link from 'next/link';
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
				<header className="sticky top-0 flex flex-row items-center justify-between bg-gray-200 p-4 pl-6 shadow">
					<Link href="/" className="text-inherit no-underline">
						James Gurney Knowledge Base
					</Link>
					<div className="space-x-4">
						<Link href="/about" className="text-gray-500 no-underline">
							About
						</Link>
						<a
							href="https://jamesgurney.com"
							rel="noreferrer"
							className="text-gray-500 no-underline"
						>
							JamesGurney.com
						</a>
					</div>
				</header>
				{children}
			</body>
		</html>
	);
}
