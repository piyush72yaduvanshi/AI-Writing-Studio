# System Architecture & Technical Specifications

## 1. High-Level Architecture Overview

**AI Writing Studio** is engineered as a production-grade, Cloud-First & Self-Hosted writing environment. The platform decouples presentation, application logic, vector retrieval, and AI inference to provide maximum resilience, privacy, and speed.

```text
                                +-------------------+
                                |   Nginx Gateway   |
                                |     (Port 80)     |
                                +---------+---------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
              +---------v---------+               +---------v---------+
              |   React Frontend  |               |   Django Backend  |
              | (Vite/TS/Tailwind)|               |     (DRF API)     |
              +-------------------+               +---------+---------+
                                                            |
                   +------------------+---------------------+------------------+
                   |                  |                     |                  |
         +---------v--------+ +-------v--------+  +---------v--------+ +-------v--------+
         |    PostgreSQL    | |     Redis      |  |   Qdrant Vector  | | Multi-Provider |
         |   (Primary DB)   | | (Broker/Cache) |  |   (OKF Store)    | | AI Engine (OR/ |
         +------------------+ +-------+--------+  +------------------+ | Gemini/OAI)    |
                                      |                                +----------------+
                              +-------v--------+
                              |  Celery Worker |
                              | (Async Indexing|
                              +----------------+
```

---

## 2. Backend 4-Tier Layered Architecture

To prevent monolithic spaghetti code, the Django application strictly follows a clean 4-tier design pattern:

```text
[Controllers / Views]  → HTTP handling, permission validation, serializer invocation
         ↓
[Service Layer]        → Prompt assembly, AI provider routing, OKF retrieval orchestration
         ↓
[Repository Layer]     → ORM isolation, atomic transactions, decoupled database queries
         ↓
[Data Models]          → Relational schema, UUID primary keys, indexing & constraints
```

### AI Inference Provider Abstraction
All AI interactions run through the `AIProvider` base class:
- `OpenRouterProvider`: Primary production provider connecting to OpenRouter API (DeepSeek V3, Llama 3.3 70B, etc.).
- `GeminiProvider`: High-speed generation via Google Gemini 2.5 Flash / Pro.
- `OpenAIProvider`: Direct OpenAI API execution (GPT-4o, GPT-4o-mini).
- `OllamaProvider`: Optional local inference runner for completely offline setups.
- `MultiProviderManager`: Unified router supporting runtime user key overrides and automated fallback.

---

## 3. Core Data Models

1. **`User` (`apps.accounts.models.User`)**:
   - UUID PK, secure email authentication, preferred language (English, Hindi, Hinglish), preferred tone.
2. **`Document` (`apps.documents.models.Document`)**:
   - Manages drafts, writing modes (Blog, Article, Story, Screenplay, Series), tones, word counts, and revision tracking.
3. **`DocumentVersion` (`apps.documents.models.DocumentVersion`)**:
   - Immutable snapshot history enabling instantaneous rollback to prior writing iterations.
4. **`WritingReference` (`apps.references.models.WritingReference`)**:
   - Open Knowledge Format references, uploaded file assets, chunk counts, and lifecycle states (`PENDING` → `PROCESSING` → `COMPLETED` / `FAILED`).
5. **`ReferenceChunk` (`apps.references.models.ReferenceChunk`)**:
   - Granular text segments mapped directly to high-dimensional points in Qdrant collections.
6. **`AIRequest` (`apps.ai_studio.models.AIRequest`)**:
   - Non-leaking audit trail recording duration, token metrics, provider, model name, and execution status.

---

## 4. Production Security Architecture

- **Context Isolation**: Untrusted reference chunks retrieved from vector search are sanitized and wrapped in isolated boundary tags with explicit override prohibition prompts.
- **Multi-Tenant Protection**: Database and vector queries strictly verify `user_id == current_user.id OR is_global == True`.
- **Stateless Credentials**: Client-supplied API keys for OpenRouter or Gemini are passed per request over TLS/Docker network and never persisted to the database.
- **JWT Authentication**: Short-lived access tokens with automatic rotation and token blacklisting upon logout.
- **Reverse Proxy Defense**: Nginx handles SSL termination, header sanitization, dynamic keepalive upstream pooling, and payload limits (15MB).
