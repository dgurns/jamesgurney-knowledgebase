from typing import List, AsyncGenerator
import openai
import os


from tenacity import retry, wait_random_exponential, stop_after_attempt

openai.organization = os.getenv("OPENAI_ORGANIZATION")


@retry(wait=wait_random_exponential(min=1, max=20), stop=stop_after_attempt(3))
def get_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Embed texts using OpenAI's ada model.

    Args:
        texts: The list of texts to embed.

    Returns:
        A list of embeddings, each of which is a list of floats.

    Raises:
        Exception: If the OpenAI API call fails.
    """
    # Call the OpenAI API to get the embeddings
    response = openai.Embedding.create(input=texts, model="text-embedding-ada-002")

    # Extract the embedding data from the response
    data = response["data"]  # type: ignore

    # Return the embeddings as a list of lists of floats
    return [result["embedding"] for result in data]


@retry(wait=wait_random_exponential(min=1, max=20), stop=stop_after_attempt(3))
def get_chat_completion(
    messages,
    model="gpt-4o-mini",
):
    """
    Generate a chat completion using OpenAI's chat completion API.

    Args:
        messages: The list of messages in the chat history.
        model: The name of the model to use for the completion. Default is gpt-4o-mini, which is a fast, cheap and versatile model. Use gpt-4 for higher quality but slower results.

    Returns:
        A string containing the chat completion.

    Raises:
        Exception: If the OpenAI API call fails.
    """
    # call the OpenAI chat completion API with the given messages
    response = openai.ChatCompletion.create(
        model=model, messages=messages, max_tokens=300
    )

    choices = response["choices"]  # type: ignore
    completion = choices[0].message.content.strip()
    print(f"Completion: {completion}")
    return completion


@retry(wait=wait_random_exponential(min=1, max=20), stop=stop_after_attempt(3))
async def get_streaming_chat_completion(
    messages,
    model="gpt-4o-mini",  # use "gpt-4" for better results
) -> AsyncGenerator[str, None]:
    """
    Generate a streaming chat completion using OpenAI's chat completion API.

    Args:
        messages: The list of messages in the chat history.
        model: The name of the model to use for the completion. Default is gpt-4o-mini, which is a fast, cheap and versatile model. Use gpt-4 for higher quality but slower results.

    Returns:
        A stream returning each chunk of the chat completion.

    Raises:
        Exception: If the OpenAI API call fails.
    """
    # call the OpenAI chat completion API with the given messages
    response = openai.ChatCompletion.create(
        model=model, messages=messages, max_tokens=300, stream=True
    )

    full_completion = ""

    for chunk in response:  # type: ignore
        choice = chunk["choices"][0]  # type: ignore
        if choice["finish_reason"] == "stop":
            break
        if "role" in choice["delta"]:
            continue
        chunk = choice["delta"]["content"]
        full_completion += chunk
        yield chunk

    print(f"Completion: {full_completion}")
