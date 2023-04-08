import { NextResponse } from 'next/server';
import { RetrievalQueryRequest } from '~/types';

export interface RetrieveDocumentsRequest {
	query: string;
}

export async function POST(request: Request) {
	const referer = request.headers.get('Referer');
	const uiOrigin = process.env.UI_ORIGIN;
	if (!referer || !uiOrigin || !referer.startsWith(uiOrigin)) {
		return NextResponse.error();
	}
	const incoming: RetrieveDocumentsRequest = await request.json();
	const outgoing: RetrievalQueryRequest = {
		queries: [
			{
				query: incoming.query,
				top_k: 3,
			},
		],
	};
	const res = await fetch(`${process.env.RETRIEVAL_SERVER_ORIGIN}/query`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${process.env.RETRIEVAL_SERVER_BEARER_TOKEN}`,
		},
		body: JSON.stringify(outgoing),
	});
	if (!res.ok) {
		throw new Error(`Request failed with status ${res.status}`);
	}
	const resJSON = await res.json();
	return NextResponse.json(resJSON);
}
