import Link from 'next/link';
import { Inter } from 'next/font/google';
import Image from 'next/image';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import jg from '../public/JamesGurney.webp';
import jimbotImg from '../public/ask_jimbot.webp';

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
				<header className="sticky top-0 flex flex-row items-center justify-between space-x-6 bg-gray-200 p-1 pl-3 pr-4 shadow">
					<div className="flex flex-row items-center space-x-4">
						<Link href="/" className="text-inherit no-underline">
							<Image src={jg} alt="James Gurney" height={44} />
						</Link>
						<Link href="/" className="hidden text-inherit no-underline md:flex">
							<Image
								src={jimbotImg}
								alt="Ask Jimbot"
								height={16}
								className="rounded"
							/>
						</Link>
					</div>
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
			<Analytics />
		</html>
	);
}
