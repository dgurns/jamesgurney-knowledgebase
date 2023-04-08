'use client';

import { useState } from 'react';
import { RetrieveDocumentsRequest } from './api/retrieve-documents/route';

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

async function retrieveDocuments(query: string): Promise<string> {
	const req: RetrieveDocumentsRequest = {
		query,
	};
	const res = await fetch('/api/retrieve-documents', {
		method: 'POST',
		body: JSON.stringify(req),
	});
	if (!res.ok) {
		throw new Error(`Request failed with status ${res.status}`);
	}
	// we'll just pass the JSON response string to OpenAI API in the prompt and
	// not bother typing it
	const documentsAsJSONString = JSON.stringify(await res.json());
	return documentsAsJSONString;
}

export default function Home() {
	const [chats, setChats] = useState<Chat[]>([
		{
			by: 'ai',
			message:
				"Hello, I'm James Gurney (in AI form). Ask me anything you want to know.",
		},
	]);
	const [isLoading, setIsLoading] = useState(false);

	const [message, setMessage] = useState('');

	function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			onSubmit();
		}
	}

	async function onSubmit() {
		if (isLoading) {
			return;
		}
		const userMsg = message;
		setMessage('');
		setChats((chats) => [
			...chats,
			{
				by: 'user',
				message: userMsg,
			},
		]);
		setIsLoading(true);
		setTimeout(
			() =>
				window.scrollTo({
					top: document.body.scrollHeight,
					behavior: 'smooth',
				}),
			100
		);
		try {
			const docs = await retrieveDocuments(userMsg);
		} catch {
			setChats((chats) => [
				...chats,
				{
					by: 'ai',
					message: 'Sorry, there was a server error. Please try again.',
				},
			]);
			setMessage(userMsg);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="flex w-full pb-[200px]" id="container">
			<ul className="mt-4 flex w-full flex-col items-center even:bg-gray-200">
				{chats.map((chat, i) => (
					<li key={i} className="flex w-full flex-col items-center">
						<Chat {...chat} />
					</li>
				))}
				{isLoading && (
					<li className="flex w-full flex-col items-center">
						<Chat by="ai" message="Loading..." />
					</li>
				)}
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
