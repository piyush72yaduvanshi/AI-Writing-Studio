# REST API Reference & Specifications

All API requests (except public auth & health) require a valid JWT Bearer Token in the `Authorization` header:

```http
Authorization: Bearer <access_token>
```

Interactive OpenAPI 3 / Swagger documentation is available at:
- Gateway: [http://localhost/api/docs/](http://localhost/api/docs/)
- Direct Backend: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)

---

## 1. Authentication Endpoints (`/api/v1/auth/`)

### Register New Author
`POST /api/v1/auth/register`
```json
{
  "email": "author@example.com",
  "password": "SecurePassword123!",
  "username": "Rohit",
  "preferred_language": "English",
  "preferred_tone": "Simple"
}
```

### Login
`POST /api/v1/auth/login`
```json
{
  "email": "author@example.com",
  "password": "SecurePassword123!"
}
```

### Refresh Token
`POST /api/v1/auth/refresh`
```json
{
  "refresh": "<refresh_token>"
}
```

### Current User Profile
- `GET /api/v1/auth/me`: Retrieve current profile and preferences.
- `PATCH /api/v1/auth/me`: Update display name, default language, or tone.

---

## 2. Document Management (`/api/v1/documents/`)

### List Documents
`GET /api/v1/documents/?search=scene&mode=screenplay&sort_by=-updated_at`

### Create Document Draft
`POST /api/v1/documents/`
```json
{
  "title": "Midnight In Hanle",
  "content": "A lone astronomer notices a rhythmic frequency...",
  "mode": "story",
  "language": "English",
  "tone": "Cinematic"
}
```

### Duplicate Document
`POST /api/v1/documents/:id/duplicate`

### Document Versions & Rollback
- `GET /api/v1/documents/:id/versions`: List snapshots.
- `POST /api/v1/documents/:id/versions`: Create manual snapshot.
- `POST /api/v1/documents/:id/restore/:version_id`: Rollback to version snapshot.

---

## 3. AI Studio Operations (`/api/v1/ai/`)

All transformation endpoints accept optional `provider`, `model`, and `api_key` overrides for dynamic per-request routing.

### Improve Writing
`POST /api/v1/ai/improve`
```json
{
  "content": "rahul apne father se baat nahi karta...",
  "document_id": "<optional_uuid>",
  "mode": "story",
  "language": "English",
  "tone": "Emotional",
  "use_rag": true,
  "save_version": true,
  "provider": "openrouter",
  "model": "deepseek/deepseek-chat"
}
```

### Dedicated Transformation Endpoints
- `POST /api/v1/ai/grammar`: Fix grammar, typos, and agreement without altering the author's voice.
- `POST /api/v1/ai/translate`: Contextual translation preserving cultural idioms and emotional stakes.
- `POST /api/v1/ai/rewrite`: Enrich phrasing, prose cadence, and vocabulary.
- `POST /api/v1/ai/expand`: Deepen scene descriptions, sensory details, and arguments.
- `POST /api/v1/ai/shorten`: Condense text for brevity while preserving key story beats.
- `POST /api/v1/ai/structure`: Generate clean hierarchical outlines.
- `POST /api/v1/ai/screenplay`: Convert prose or rough dialogue into industry-standard Screenplay Draft layout.
- `POST /api/v1/ai/story`: Expand notes into three-act narrative prose.
- `POST /api/v1/ai/action`: Universal dynamic action dispatcher.

### Engine Configuration & Audit History
- `GET /api/v1/ai/config`: Returns active provider status, configured models, and readiness across OpenRouter, Gemini, OpenAI, and Ollama.
- `GET /api/v1/ai/history`: Retrieve execution audit logs and latency metrics.

---

## 4. Open Knowledge Format & Reference Library (`/api/v1/references/`)

- `GET /api/v1/references/`: List references with chunk counts and indexing status (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`).
- `POST /api/v1/references/`: Upload document (`.json` [OKF], `.md`, `.txt`, `.pdf`, `.docx`) or submit raw text guidelines.
- `DELETE /api/v1/references/:id`: Delete reference asset and purge associated vectors from Qdrant.
- `POST /api/v1/references/:id/index`: Re-chunk and re-index vector representations.

---

## 5. System Health Check (`/api/v1/health/`)

`GET /api/v1/health/`

Returns unified health telemetry for orchestration probes:
```json
{
  "success": true,
  "status": "healthy",
  "environment": "development",
  "services": {
    "database": { "status": "healthy", "type": "postgresql" },
    "redis": { "status": "healthy" },
    "ai_providers": {
      "gemini": { "status": "ready", "model": "gemini-2.5-flash" },
      "openrouter": { "status": "ready", "model": "deepseek/deepseek-chat" },
      "openai": { "status": "not_configured", "model": "gpt-4o-mini" },
      "ollama": { "status": "inactive", "note": "Cloud AI providers active" }
    },
    "qdrant": { "status": "healthy", "url": "http://qdrant:6333" }
  }
}
```
