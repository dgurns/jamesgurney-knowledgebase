import Link from 'next/link';
import { Inter } from 'next/font/google';
import Image from 'next/image';
import './globals.css';
import logo from '../public/logo.png';

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
				<header className="sticky top-0 flex flex-row items-center justify-between space-x-6 bg-gray-200 p-2 pr-4 shadow">
					<Link href="/" className="text-inherit no-underline">
						<Image src={logo} alt="Logo" height={40} />
					</Link>
					<div className="space-x-4 text-sm sm:text-base">
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
