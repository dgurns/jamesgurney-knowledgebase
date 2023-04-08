'use client';

import { useState } from 'react';

interface Chat {
	by: 'user' | 'ai';
	message: string;
}

function Chat({ by, message }: Chat) {
	return (
		<div className="flex w-full max-w-2xl flex-col space-y-2 p-4">
			<div className="text-sm font-bold">{by === 'ai' ? 'James' : 'You'}</div>
			<div>{message}</div>
		</div>
	);
}

export default function Home() {
	const [chats, setChats] = useState<Chat[]>([
		{
			by: 'ai',
			message:
				'Hello, I am James Gurney (in AI form). Ask me anything you want to know.',
		},
	]);

	const [message, setMessage] = useState('');

	function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			onSubmit();
		}
	}

	function onSubmit() {
		setMessage('');
		setChats((chats) => [
			...chats,
			{
				by: 'user',
				message,
			},
		]);
		setTimeout(
			() =>
				window.scrollTo({
					top: document.body.scrollHeight,
					behavior: 'smooth',
				}),
			100
		);
	}

	return (
		<div className="flex w-full pb-[200px]" id="container">
			<ul className="mt-4 flex w-full flex-col items-center even:bg-gray-200">
				{chats.map((chat, i) => (
					<li key={i} className="flex w-full flex-col items-center">
						<Chat {...chat} />
					</li>
				))}
			</ul>
			<div className="fixed bottom-0 left-0 right-0 flex flex-row items-center justify-center bg-gray-300 p-4">
				<form
					className="flex w-full max-w-2xl"
					onSubmit={(e) => {
						e.preventDefault();
						onSubmit();
					}}
				>
					<textarea
						className="w-full resize-none"
						rows={3}
						placeholder="Your message..."
						autoFocus
						required
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={onKeyDown}
					/>
					<button type="submit" hidden />
				</form>
			</div>
		</div>
	);
}
