import { NextResponse } from 'next/server';

// run on the edge close to the user since we are just adding a bearer token
// and proxying a request
export const runtime = 'experimental-edge';

export interface CompletionRequest {
	messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface CompletionResponse {
	completion: string;
}

export async function POST(request: Request) {
	// restrict this route handler to same-origin only
	const origin = request.headers.get('origin');
	if (
		!origin ||
		!process.env.UI_ORIGIN ||
		!origin.startsWith(process.env.UI_ORIGIN)
	) {
		return NextResponse.error();
	}
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
