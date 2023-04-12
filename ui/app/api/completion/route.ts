import { NextResponse } from 'next/server';

export interface CompletionRequest {
	messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface CompletionResponse {
	completion: string;
}

// the only reason we need an API route vs. calling the retrieval server
// directly from the component is to securely add a bearer token to the request
// without exposing it to the browser

export async function POST(request: Request) {
	const body = await request.text();
	const res = await fetch(`${process.env.RETRIEVAL_SERVER_ORIGIN}/completion`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${process.env.RETRIEVAL_SERVER_BEARER_TOKEN}`,
		},
		body,
	});
	if (!res.ok) {
		console.log(`Request failed with status ${res.status}`);
		return NextResponse.error();
	}
	const { completion }: CompletionResponse = await res.json();
	return NextResponse.json({ completion });
}
