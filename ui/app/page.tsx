'use client';

import { useState } from 'react';
import { CompletionRequest } from './api/completion/route';

function Thinking() {
	return (
		<div className="flex items-center space-x-1">
			<span>Thinking</span>
			<span className="animate-fade-in-out">.</span>
			<span className="animate-fade-in-out" style={{ animationDelay: '0.2s' }}>
				.
			</span>
			<span className="animate-fade-in-out" style={{ animationDelay: '0.4s' }}>
				.
			</span>
		</div>
	);
}

export interface Chat {
	by: 'user' | 'ai';
	message: string | React.ReactNode;
}

function Chat({ by, message }: Chat) {
	// if there are links in the messages, put in actual <a> tags and sanitize
	// the URLs to remove weird leading/trailing characters like [], (), or .
	const urlRegex = /((https?:\/\/|www\.)?[a-zA-Z][^\s]*\w(\.[^\s)]+)+)/gi;
	const formattedMessage =
		typeof message !== 'string'
			? message
			: message.replace(urlRegex, (url) => {
					const startRegex = /^[^a-zA-Z]+/;
					const endRegex = /[^a-zA-Z0-9]+$/;
					const cleanedUrl = url.replace(startRegex, '').replace(endRegex, '');
					const href = cleanedUrl.startsWith('https')
						? cleanedUrl
						: cleanedUrl.startsWith('http')
						? `https://${cleanedUrl.slice(7)}`
						: `https://${cleanedUrl}`;
					return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
			  });

	return (
		<div className="flex w-full max-w-3xl flex-col space-y-2 whitespace-pre-line p-4">
			<div className="text-sm font-bold">{by === 'ai' ? 'James' : 'You'}</div>
			{by === 'user' ? (
				message
			) : typeof formattedMessage !== 'string' ? (
				formattedMessage
			) : (
				<div
					dangerouslySetInnerHTML={{ __html: formattedMessage }}
					className="whitespace-pre-line"
				/>
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
			const body: CompletionRequest = {
				messages: chatsWithUserMsg.map((c) => ({
					role: c.by === 'user' ? 'user' : 'assistant',
					content: typeof c.message === 'string' ? c.message : '',
				})),
			};
			const res = await fetch('/api/streaming-completion', {
				method: 'POST',
				body: JSON.stringify(body),
			});
			if (!res.body || !res.ok) {
				throw new Error();
			}
			setIsLoading(false);
			const reader = res.body.getReader();
			let accumulatedChunks = '';
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					break;
				}
				const chunk = new TextDecoder('utf-8').decode(value);
				accumulatedChunks += chunk;
				setChats((chats) => {
					const aiIsAnswering = chats[chats.length - 1].by === 'ai';
					const prevChats = aiIsAnswering ? chats.slice(0, -1) : chats;
					return [...prevChats, { by: 'ai', message: accumulatedChunks }];
				});
				scrollToBottom();
			}
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
		<div className="flex w-full flex-col pb-[320px]">
			<ul className="mt-4 flex w-full flex-col items-center">
				{chats.map((chat, i) => (
					<li
						key={i}
						className="flex w-full flex-col items-center even:bg-gray-100"
					>
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
								onClick={() =>
									setMessage('What are some limited palettes you recommend?')
								}
							>
								What are some limited palettes you recommend?
							</button>
							<button
								onClick={() => setMessage('Any tips for finding inspiration?')}
							>
								Any tips for finding inspiration?
							</button>
						</div>
					</li>
				)}
				{isLoading && (
					<li className="flex w-full flex-col items-center">
						<Chat by="ai" message={<Thinking />} />
					</li>
				)}
			</ul>
			<div className="fixed bottom-0 left-0 right-0 flex flex-row items-center justify-center bg-gray-300 shadow-t">
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
						required
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={onKeyDown}
						maxLength={500}
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
