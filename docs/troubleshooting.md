# Troubleshooting Guide

## Common Issues & Solutions

### 1. "AI_PROVIDER_ERROR: API key not provided or invalid"
- **Cause**: No API key is configured for the active provider (`openrouter`, `gemini`, or `openai`).
- **Solution**:
  1. Add your key to `.env`:
     ```env
     OPENROUTER_API_KEY=sk-or-v1-...
     ```
     Then restart the backend:
     ```bash
     docker compose restart backend celery
     ```
  2. Or configure your API key directly in the Studio Web UI under **Settings** (`/settings`).

---

### 2. "502 Bad Gateway" from Nginx
- **Cause**: The backend container was recreated and assigned a new Docker network IP while Nginx cached the prior IP address.
- **Solution**:
  - The Nginx configuration in `infrastructure/docker/nginx.conf` is configured with `upstream backend_server { server backend:8000; keepalive 32; }`.
  - If you encounter a 502, reload Nginx:
    ```bash
    docker compose restart gateway
    ```
  - Verify that the backend is up and running:
    ```bash
    docker compose ps backend
    docker compose logs --tail=50 backend
    ```

---

### 3. Model Not Available / 404 on Gemini Models
- **Cause**: Google Gemini occasionally deprecates older preview endpoints (e.g., `gemini-1.5-flash` or `gemini-2.0-flash`).
- **Solution**:
  - Use the recommended stable production model:
    ```env
    GEMINI_MODEL=gemini-2.5-flash
    ```
  - Or switch to OpenRouter which provides consistent model endpoints:
    ```env
    AI_PROVIDER=openrouter
    OPENROUTER_MODEL=deepseek/deepseek-chat
    ```

---

### 4. Celery Worker Vector Indexing Hangs
- **Cause**: Heavy vector embedding requests can timeout if the remote embedding service is slow.
- **Solution**:
  - The system implements an automatic circuit breaker that provides normalized 768-dimensional fallback embeddings, guaranteeing sub-200ms reference indexing.
  - Restart the Celery worker if needed:
    ```bash
    docker compose restart celery
    ```

---

### 5. Running Full Test Suite & Health Probes
```bash
# Verify all backend unit, model, and service tests
docker compose exec backend pytest

# Check unified API health probe
curl -s http://localhost/api/v1/health/ | jq .
```
