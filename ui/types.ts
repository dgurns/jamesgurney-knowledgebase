export interface DocumentsRetrievalRequest {
	queries: Array<{
		query: string;
		top_k: number;
	}>;
}
