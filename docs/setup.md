# Setup & Installation Guide

This guide covers setting up **AI Writing Studio** using Docker Compose for development and production deployments.

---

## 1. Prerequisites

- **Docker & Docker Compose**: Docker 24.0+ and Compose v2.20+
- **System Memory**: 4 GB RAM minimum for cloud providers (8 GB+ if running optional local Ollama).
- **API Keys (Cloud-First Mode)**:
  - **OpenRouter** (Recommended): [Get API Key](https://openrouter.ai/keys)
  - **Google Gemini**: [Get Free API Key](https://aistudio.google.com/)
  - **OpenAI** (Optional): [Get API Key](https://platform.openai.com/api-keys)

---

## 2. Quick Start with Docker (Recommended)

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/ai-writing-studio.git
cd ai-writing-studio
```

### Step 2: Configure Environment
Copy the environment template and insert your API keys:
```bash
cp .env.example .env
```

Edit `.env` to configure your primary provider (OpenRouter or Gemini):
```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=deepseek/deepseek-chat

# Optional: Add Gemini as fallback
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

### Step 3: Launch Services
```bash
docker compose up -d
```

All services start in approximately 10–15 seconds:
- `ai_writing_studio_gateway` (Nginx reverse proxy on port 80)
- `ai_writing_studio_frontend` (React application)
- `ai_writing_studio_backend` (Django API)
- `ai_writing_studio_celery` (Background OKF indexing)
- `ai_writing_studio_postgres` (Relational database)
- `ai_writing_studio_redis` (Broker & Cache)
- `ai_writing_studio_qdrant` (Vector store)

### Step 4: Access the Studio
- **Web Studio UI**: [http://localhost](http://localhost) (or [http://localhost:3000](http://localhost:3000))
- **Interactive API Swagger Docs**: [http://localhost/api/docs/](http://localhost/api/docs/)
- **Default Seed Admin**:
  - **Email**: `admin@aiwritingstudio.local`
  - **Password**: `StudioPassword123!`

---

## 3. Optional: Running Local Ollama Inference

If you wish to run completely offline without external cloud APIs:

1. Start Ollama container:
   ```bash
   docker compose up -d ollama
   ```
2. Pull the creative model & embedding weights:
   ```bash
   docker compose exec ollama ollama pull qwen3:8b
   docker compose exec ollama ollama pull nomic-embed-text
   ```
3. Set `AI_PROVIDER=ollama` in `.env` and restart backend:
   ```bash
   docker compose restart backend celery
   ```

---

## 4. Useful Operations & Commands

```bash
# View live application logs
docker compose logs -f

# Check container health and status
docker compose ps

# Re-run migrations or seed default data
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_data

# Run backend unit & integration tests
docker compose exec backend pytest

# Stop all containers
docker compose down

# Full clean restart (WARNING: resets database and vector collections)
docker compose down -v
docker compose up -d
```
