import os
import traceback
from typing import Optional
import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, Depends, Body, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles

from models.api import (
    DeleteRequest,
    DeleteResponse,
    QueryRequest,
    QueryResponse,
    UpsertRequest,
    UpsertResponse,
    CompletionRequest,
    CompletionResponse,
)
from models.models import ChatMessage, ChatMessageRole
from datastore.factory import get_datastore
from services.file import get_document_from_file
from services.openai import get_chat_completion

from models.models import DocumentMetadata, Source, Query, QueryResult
from typing import List

bearer_scheme = HTTPBearer()
BEARER_TOKEN = os.environ.get("BEARER_TOKEN")
assert BEARER_TOKEN is not None


def validate_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if credentials.scheme != "Bearer" or credentials.credentials != BEARER_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid or missing token")
    return credentials


app = FastAPI(dependencies=[Depends(validate_token)])
app.mount("/.well-known", StaticFiles(directory=".well-known"), name="static")

# Create a sub-application, in order to access just the query endpoint in an OpenAPI schema, found at http://0.0.0.0:8000/sub/openapi.json when the app is running locally
sub_app = FastAPI(
    title="Retrieval Plugin API",
    description="A retrieval API for querying and filtering documents based on natural language queries and metadata",
    version="1.0.0",
    servers=[{"url": "https://your-app-url.com"}],
    dependencies=[Depends(validate_token)],
)
app.mount("/sub", sub_app)


@app.post(
    "/upsert-file",
    response_model=UpsertResponse,
)
async def upsert_file(
    file: UploadFile = File(...),
    metadata: Optional[str] = Form(None),
):
    try:
        metadata_obj = (
            DocumentMetadata.parse_raw(metadata)
            if metadata
            else DocumentMetadata(source=Source.file)
        )
    except:
        metadata_obj = DocumentMetadata(source=Source.file)

    document = await get_document_from_file(file, metadata_obj)

    try:
        ids = await datastore.upsert([document])
        return UpsertResponse(ids=ids)
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail=f"str({e})")


@app.post(
    "/upsert",
    response_model=UpsertResponse,
)
async def upsert(
    request: UpsertRequest = Body(...),
):
    try:
        ids = await datastore.upsert(request.documents)
        return UpsertResponse(ids=ids)
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail="Internal Service Error")


@app.post(
    "/query",
    response_model=QueryResponse,
)
async def query_main(
    request: QueryRequest = Body(...),
):
    try:
        results = await datastore.query(
            request.queries,
        )
        return QueryResponse(results=results)
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail="Internal Service Error")


@sub_app.post(
    "/query",
    response_model=QueryResponse,
    # NOTE: We are describing the shape of the API endpoint input due to a current limitation in parsing arrays of objects from OpenAPI schemas. This will not be necessary in the future.
    description="Accepts search query objects array each with query and optional filter. Break down complex questions into sub-questions. Refine results by criteria, e.g. time / source, don't do this often. Split queries if ResponseTooLargeError occurs.",
)
async def query(
    request: QueryRequest = Body(...),
):
    try:
        results = await datastore.query(
            request.queries,
        )
        return QueryResponse(results=results)
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail="Internal Service Error")


@app.delete(
    "/delete",
    response_model=DeleteResponse,
)
async def delete(
    request: DeleteRequest = Body(...),
):
    if not (request.ids or request.filter or request.delete_all):
        raise HTTPException(
            status_code=400,
            detail="One of ids, filter, or delete_all is required",
        )
    try:
        success = await datastore.delete(
            ids=request.ids,
            filter=request.filter,
            delete_all=request.delete_all,
        )
        return DeleteResponse(success=success)
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail="Internal Service Error")


@app.post(
    "/completion",
    response_model=CompletionResponse,
)
async def completion(
    request: CompletionRequest = Body(...),
):
    if not (request.messages) or len(request.messages) == 0:
        raise HTTPException(
            status_code=400,
            detail="Missing required field: messages",
        )
    try:
        docs_query = ""
        for msg in request.messages[-2:]:
            if msg.role == "user":
                docs_query += f"{msg.content}, "
        results: List[QueryResult] = await datastore.query(
            queries=[Query(query=docs_query, top_k=3)]
        )
        docs_context = ""
        for r in results:
            for idx, doc in enumerate(r.results):
                docs_context += f"Document {idx + 1}: Text: `{doc.text}` URL: `{doc.metadata.url}`, "
        system_msg = ChatMessage(
            role=ChatMessageRole.system,
            content=f"""
                Answer as if you are James Gurney by saying 'I'. 
	              Using this content written by James Gurney - `{docs_context}` - 
								as well as the past chats in this conversation, answer questions as best you can. 
								You can infer or use outside knowledge, but don't make up facts. 
								If you used any of the content, at the end of your answer provide a list of URLs to the content you used. 
								If you include a URL, make sure it is a real URL found in the provided content or from outside knowledge - don't make it up! 
								Do not include any URLs which contain the substring 'jamesgurney.com/site/'. Instead use 'jamesgurney.com'.
            """,
        )
        msgs = [system_msg] + request.messages

        def chat_message_to_dict(chat_message: ChatMessage):
            return {
                "role": chat_message.role,
                "content": chat_message.content,
            }

        msgs_dict = [chat_message_to_dict(m) for m in msgs]
        completion = get_chat_completion(msgs_dict, "gpt-3.5-turbo")
        return CompletionResponse(completion=completion)
    except Exception as e:
        print("Error:", e)
        print("Traceback:", traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal Service Error")


@app.on_event("startup")
async def startup():
    global datastore
    datastore = await get_datastore()


def start():
    uvicorn.run("server.main:app", host="0.0.0.0", port=8000, reload=True)
