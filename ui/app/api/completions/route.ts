import { NextResponse } from 'next/server';
import { Chat } from '~/app/page';
import { DocumentsRetrievalRequest } from '~/types';

export interface CreateCompletionRequest {
	chats: Chat[];
}

export interface CreateCompletionResponse {
	completion: string;
}

export async function POST(request: Request) {
	const referer = request.headers.get('Referer');
	const uiOrigin = process.env.UI_ORIGIN;
	if (!referer || !uiOrigin || !referer.startsWith(uiOrigin)) {
		return NextResponse.error();
	}
	const { chats }: CreateCompletionRequest = await request.json();
	if (!chats.length) {
		return NextResponse.error();
	}
	const userChatMessages = [...chats]
		.filter((c) => c.by === 'user')
		.slice(-2) // use the last 2 user messages to search documents
		.map((c) => c.message)
		.join(', ');
	const documentsReq: DocumentsRetrievalRequest = {
		queries: [
			{
				query: userChatMessages,
				top_k: 4,
			},
		],
	};
	const documentsRes = await fetch(
		`${process.env.RETRIEVAL_SERVER_ORIGIN}/query`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${process.env.RETRIEVAL_SERVER_BEARER_TOKEN}`,
			},
			body: JSON.stringify(documentsReq),
		}
	);
	if (!documentsRes.ok) {
		throw new Error(`Request failed with status ${documentsRes.status}`);
	}
	// we'll pass the raw JSON string of documents to the OpenAI API as context
	const documentsAsJSONStr = JSON.stringify(await documentsRes.json());
	interface OpenAIRequest {
		model: 'gpt-3.5-turbo' | 'gpt-4';
		temperature?: number; // 0 to 2
		messages: Array<{
			role: 'system' | 'user' | 'assistant';
			content: string;
		}>;
	}
	interface OpenAIResponse {
		choices: Array<{
			message: {
				content: string;
			};
		}>;
	}
	const completionReq: OpenAIRequest = {
		model: 'gpt-3.5-turbo',
		temperature: 1,
		messages: [
			{
				role: 'system',
				content: `
					Answer as if you are James Gurney by saying "I". 
					Using this content written by James Gurney - \`\`\`${documentsAsJSONStr}\`\`\` -
					as well as the past chats in this conversation, answer questions as best you can. 
					You can infer or use outside knowledge, but don't make up facts.
					If you used any of the content, at the end of your answer, provide a list of URLs to the content you used.
					If you include a URL, make sure it is a real URL found in the provided content or from outside knowledge - don't make it up!
					Do not include any URLs which contain the substring "jamesgurney.com/site/". Instead use "jamesgurney.com".
					If people are looking for products or the shop, always send them to a URL on "jamesgurney.com".
				`,
			},
			// set a max context window to avoid passing in too many tokens
			...chats.slice(-15).map(
				(c) =>
					({
						role: c.by === 'user' ? 'user' : 'assistant',
						content: typeof c.message === 'string' ? c.message : '',
					} as const)
			),
		],
	};
	const completionRes = await fetch(
		'https://api.openai.com/v1/chat/completions',
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(completionReq),
		}
	);
	if (!completionRes.ok) {
		return NextResponse.error();
	}
	const { choices }: OpenAIResponse = await completionRes.json();
	if (choices.length === 0) {
		return NextResponse.error();
	}
	const completion = choices[0].message.content;
	return NextResponse.json({ completion });
}
