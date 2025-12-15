import { NextResponse } from 'next/server';

// run on the edge close to the user since we are just adding a bearer token
// and proxying a request
export const runtime = 'edge';

export interface CompletionRequest {
	messages: Array<{ role: 'user' | 'assistant'; content: string }>;
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
	const openaiRes = await fetch(
		`${process.env.RETRIEVAL_SERVER_ORIGIN}/streaming-completion`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${process.env.RETRIEVAL_SERVER_BEARER_TOKEN}`,
			},
			body,
		}
	);
	if (!openaiRes.body || !openaiRes.ok) {
		console.log(`Request failed with status ${openaiRes.status}`);
		return NextResponse.error();
	}
	const reader = openaiRes.body.getReader();

	const stream = new ReadableStream({
		async start(controller) {
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					break;
				}
				controller.enqueue(value);
			}
			controller.close();
			reader.releaseLock();
		},
	});

	return new NextResponse(stream, {
		headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' },
	});
}
