'use client';

import { useState } from 'react';
import {
	CreateCompletionRequest,
	CreateCompletionResponse,
} from './api/completions/route';

export interface Chat {
	by: 'user' | 'ai';
	message: string;
}

function Chat({ by, message }: Chat) {
	// if there are links in the messages, put in actual <a> tags
	const urlRegex = /((https?:\/\/|www\.)?[^\s]+(\.[^\s.]+)+)/gi;
	const msgWithLinks = message.replace(urlRegex, (url) => {
		const href = url.startsWith('https')
			? url
			: url.startsWith('http')
			? `https://${url.slice(7)}`
			: `https://${url}`;
		return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
	});

	return (
		<div className="flex w-full max-w-3xl flex-col space-y-2 whitespace-pre p-4">
			<div className="text-sm font-bold">{by === 'ai' ? 'James' : 'You'}</div>
			{by === 'ai' ? (
				<div
					dangerouslySetInnerHTML={{ __html: msgWithLinks }}
					className="whitespace-pre-line"
				/>
			) : (
				message
			)}
		</div>
	);
}

export default function Home() {
	const defaultChat: Chat = {
		by: 'ai',
		message:
			"Hello, I'm James Gurney (in AI form). Ask me anything you want to know.",
	};
	const [chats, setChats] = useState<Chat[]>([defaultChat]);
	const [isLoading, setIsLoading] = useState(false);

	const [message, setMessage] = useState('');

	function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			onSubmit();
		}
	}

	function scrollToBottom() {
		setTimeout(
			() =>
				window.scrollTo({
					top: document.body.scrollHeight,
					behavior: 'smooth',
				}),
			100
		);
	}

	async function onSubmit() {
		if (isLoading) {
			return;
		}
		const userMsg = message;
		const chatsWithUserMsg: Chat[] = [
			...chats,
			{ by: 'user', message: userMsg },
		];
		setMessage('');
		setChats(chatsWithUserMsg);
		setIsLoading(true);
		scrollToBottom();
		try {
			const body: CreateCompletionRequest = {
				chats: chatsWithUserMsg,
			};
			const res = await fetch('/api/completions', {
				method: 'POST',
				body: JSON.stringify(body),
			});
			if (!res.ok) {
				throw new Error();
			}
			const resJSON: CreateCompletionResponse = await res.json();
			setIsLoading(false);
			setChats((chats) => [
				...chats,
				{ by: 'ai', message: resJSON.completion },
			]);
			scrollToBottom();
		} catch {
			setIsLoading(false);
			setChats((chats) => [
				...chats,
				{
					by: 'ai',
					message: 'Sorry, there was an error. Please try again.',
				},
			]);
			scrollToBottom();
			setMessage(userMsg);
		}
	}

	return (
		<div className="flex w-full pb-[200px]">
			<ul className="mt-4 flex w-full flex-col items-center even:bg-gray-200">
				{chats.map((chat, i) => (
					<li key={i} className="flex w-full flex-col items-center">
						<Chat {...chat} />
					</li>
				))}
				{chats.length === 1 && (
					<li className="flex w-full flex-col items-center">
						<div className="flex w-full max-w-3xl flex-col items-start space-y-2 whitespace-pre p-4">
							<p>For example:</p>
							<button
								onClick={() =>
									setMessage('What painting setup do you recommend?')
								}
							>
								What painting setup do you recommend?
							</button>
							<button
								onClick={() => setMessage('What kind of brushes do you use?')}
							>
								What kind of brushes do you use?
							</button>
							<button
								onClick={() => setMessage('How do you find inspiration?')}
							>
								How do you find inspiration?
							</button>
						</div>
					</li>
				)}
				{isLoading && (
					<li className="flex w-full flex-col items-center">
						<Chat by="ai" message="Thinking..." />
					</li>
				)}
			</ul>
			<div className="fixed bottom-0 left-0 right-0 flex flex-row items-center justify-center bg-gray-300">
				<form
					className="relative flex w-full max-w-3xl p-4"
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
					{chats.length > 1 && (
						<button
							className="absolute bottom-6 left-8"
							onClick={() => setChats([defaultChat])}
						>
							Reset
						</button>
					)}
					<button type="submit" className="absolute bottom-6 right-8">
						Send
					</button>
				</form>
			</div>
		</div>
	);
}
