#!/bin/sh

echo "Starting Ollama server in background..."
/bin/ollama serve &
SERVER_PID=$!

echo "Waiting for Ollama API server to become ready..."
while ! /bin/ollama list > /dev/null 2>&1; do
    sleep 1
done
echo "Ollama API server is up!"

MODEL="${OLLAMA_MODEL:-qwen3:8b}"
EMBED_MODEL="${OLLAMA_EMBEDDING_MODEL:-nomic-embed-text}"

LIST=$(/bin/ollama list 2>&1 || true)

if echo "$LIST" | grep -q "$MODEL"; then
    echo "Model '$MODEL' already present in local persistent volume. Skipping download."
else
    echo "Model '$MODEL' not found locally. Initiating download in background..."
    /bin/ollama pull "$MODEL" &
fi

if echo "$LIST" | grep -q "$EMBED_MODEL"; then
    echo "Embedding model '$EMBED_MODEL' already present in local persistent volume. Skipping download."
else
    echo "Embedding model '$EMBED_MODEL' not found locally. Initiating download in background..."
    /bin/ollama pull "$EMBED_MODEL" &
fi

wait $SERVER_PID
