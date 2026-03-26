"""OpenAI embedding client for semantic search."""

import os
import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536
BATCH_SIZE = 100
OPENAI_API_URL = "https://api.openai.com/v1/embeddings"


def get_openai_api_key() -> Optional[str]:
    return os.environ.get("OPENAI_API_KEY")


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a batch of texts using OpenAI API."""
    api_key = get_openai_api_key()
    if not api_key:
        logger.warning("OPENAI_API_KEY not set, skipping embeddings")
        return [[] for _ in texts]

    all_embeddings = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i + BATCH_SIZE]
        try:
            response = httpx.post(
                OPENAI_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": EMBEDDING_MODEL,
                    "input": batch,
                    "dimensions": EMBEDDING_DIMENSIONS,
                },
                timeout=60.0,
            )
            response.raise_for_status()
            data = response.json()
            batch_embeddings = [item["embedding"] for item in data["data"]]
            all_embeddings.extend(batch_embeddings)
        except Exception as e:
            logger.error(f"Embedding API error for batch {i // BATCH_SIZE}: {e}")
            all_embeddings.extend([[] for _ in batch])

    return all_embeddings


def generate_embedding(text: str) -> list[float]:
    """Generate embedding for a single text."""
    results = generate_embeddings([text])
    return results[0] if results else []
