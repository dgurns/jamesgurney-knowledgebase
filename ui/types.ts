export interface RetrievalQueryRequest {
	queries: Array<{
		query: string;
		top_k: number;
	}>;
}
