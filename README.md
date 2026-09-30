# AI Writing Studio ✍️⚡

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Django 5.0](https://img.shields.io/badge/Django-5.0-092E20.svg?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React 18](https://img.shields.io/badge/React-18.2-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose%20v2-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Multi--Provider%20Cloud-indigo.svg)](https://openrouter.ai/)
[![Vector DB: Qdrant](https://img.shields.io/badge/OKF-Qdrant-red.svg)](https://qdrant.tech/)

**AI Writing Studio** is a modern, high-performance, Cloud-First and Self-Hosted writing environment designed for authors, screenwriters, journalists, novelists, and creative storytellers.

Powered by a **Multi-Provider AI Engine** ([OpenRouter](https://openrouter.ai) with DeepSeek V3/Llama 3.3, [Google Gemini](https://ai.google.dev), [OpenAI](https://openai.com), or optional local [Ollama](https://ollama.com)) and the **Open Knowledge Format (OKF)** running on [Qdrant](https://qdrant.tech/), the platform generates publication-ready prose in **1–2 seconds** without heavy multi-gigabyte local model downloads.

> **Core Philosophy**:  
> You write freely in your authentic voice (English, Hindi, or conversational Hinglish) ➔ The AI engine understands your stakes, intent, and cultural nuances ➔ Injects your style guidelines and story bibles via OKF vector search ➔ Transforms drafts into publication-ready prose or formatted screenplay scenes ➔ Copy the final result with one click.

---

## 🌟 Key Features

- **⚡ Blazing-Fast Multi-Provider AI**: Default integration with OpenRouter (`deepseek/deepseek-chat`), Google Gemini (`gemini-2.5-flash`), OpenAI (`gpt-4o-mini`), and local Ollama. Generates high-quality prose in 1–2 seconds.
- **📚 Open Knowledge Format (OKF) & Vector Library**: Upload style guidelines, character profiles, and story bibles (`.json` [OKF], `.md`, `.txt`, `.pdf`, `.docx`). The system chunks and indexes vectors in Qdrant with sub-200ms processing.
- **🇮🇳 Native Hinglish & Multilingual Nuance**: Freely write raw Hinglish thoughts (e.g., *"mera character ek introvert astronomer h jo radio frequency discover karta h..."*). The model extracts narrative stakes without literal word-by-word mistranslations.
- **🎬 Specialized Writing Modes**:
  - **Blog Post**: Catchy hooks, actionable subheadings, structured markdown, and reader takeaways.
  - **Article**: Analytical thesis, structured arguments, and executive takeaways.
  - **Creative Story**: Three-act dramatic arcs, character motivations, and dialogue subtext.
  - **Screenplay Draft**: Formatted uppercase sluglines (`INT./EXT.`), character cues, and visual action beats.
  - **Movie / Web Series Structure**: High-concept loglines, episode hooks, and seasonal narrative engines.
- **⚖️ Anti-Over-Correction Editorial Ethics**:
  - `Fix Grammar`: Corrects typos and syntax while strictly preserving the author's voice and phrasing.
  - `Rewrite / Improve`: Enriches cadence and vocabulary while honoring original intent.
- **⏱️ Document Versioning & Rollback**: Automatic version snapshots created during AI actions with 1-click historical rollback.
- **🛡️ Untrusted Context Isolation**: Reference chunks are enclosed inside strict boundary prompts to eliminate indirect prompt injection risks.
- **📋 1-Click Clipboard Copying**: Instant copying with visual feedback.

---

## 🏗️ System Architecture

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
        |   (Database)     | | (Broker/Cache) |  |   (OKF Store)    | |  AI Engine     |
        +------------------+ +-------+--------+  +------------------+ | (OR/Gem/OAI)   |
                                     |                                +----------------+
                             +-------v--------+
                             |  Celery Worker |
                             | (Async Indexing|
                             +----------------+
```

---

## 📸 Workspace Preview

```text
+----------------------------------------------------------------------------------------------------+
|  AI Writing Studio       [Dashboard]  [Documents]  [References (OKF)]  [Settings]   (Profile)      |
+----------------------------------------------------------------------------------------------------+
|  Mode: Screenplay Draft  |  Lang: English  |  Tone: Cinematic  |  [Knowledge Active]  [Versions]   |
+--------------------------------------------------+-------------------------------------------------+
|  ORIGINAL (Draft / Hinglish / Scene Notes)       |  AI RESULT (deepseek-chat • 1.4s)  [Copy] [Apply]|
|                                                  |                                                 |
|  INT. OBSERVATORY - NIGHT                        |  INT. OBSERVATORY - NIGHT                       |
|  Tara baithi hui h computer ke samne             |                                                 |
|  aur use ek weird radio signal milta h           |  DR. TARA SEN (30s) hunches forward, her eyes    |
|  jo bilkul human heartbeat jaisa lagta h.        |  reflecting green phosphorescent spikes on the  |
|                                                  |  oscilloscope.                                  |
|  TARA                                            |                                                 |
|  Ye koi pulsar nahi ho sakta...                  |  A rhythmic audio pulse echoes through the      |
|                                                  |  headphones: ba-bump. Ba-bump.                  |
|                                                  |                                                 |
|                                                  |  TARA                                           |
|                                                  |  (whispering to herself)                        |
|                                                  |  That's not a pulsar... That's a heartbeat.     |
+--------------------------------------------------+-------------------------------------------------+
| [Improve Writing]  [Fix Grammar]  [Rewrite]  [Translate]  [Screenplay Draft]  [Story Mode]  [More] |
+----------------------------------------------------------------------------------------------------+
```

---

## 💻 Tech Stack

### Frontend
- **Framework**: React 18, Vite, TypeScript
- **Styling**: Vanilla Tailwind CSS (Custom slate/indigo dark theme)
- **State & Server Cache**: TanStack Query (React Query)
- **Icons**: Lucide React
- **HTTP Client**: Axios with automatic JWT interceptors

### Backend
- **Core**: Python 3.11, Django 5.0, Django REST Framework
- **Architecture**: Clean 4-Tier Layered Architecture (Views ➔ Services ➔ Repositories ➔ Models)
- **Database**: PostgreSQL 16
- **Caching & Broker**: Redis 7
- **Task Queue**: Celery 5.3
- **Vector Engine**: Qdrant Vector Store
- **Multi-Provider AI**: OpenRouter, Google Gemini, OpenAI, Ollama
- **API Documentation**: OpenAPI 3 / Swagger via `drf-spectacular`

---

## 🚀 Quick Start (Docker Compose)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ai-writing-studio.git
cd ai-writing-studio
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Open `.env` and set your preferred AI Provider key:
```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=deepseek/deepseek-chat

# Optional: Add Google Gemini key for instant fallback
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
```

### 3. Launch Services
```bash
docker compose up -d
```
All containers will be up and running in ~10 seconds.

### 4. Access the Studio
- **Web App**: [http://localhost](http://localhost) (or `http://localhost:3000`)
- **API Swagger Docs**: [http://localhost/api/docs/](http://localhost/api/docs/)
- **Default Seed Admin**:
  - **Email**: `admin@aiwritingstudio.local`
  - **Password**: `StudioPassword123!`

---

## 🧪 Testing & Validation

```bash
# Run complete backend test suite (16 tests across auth, documents, AI studio, and references)
docker compose exec backend pytest

# Health check probe
curl -s http://localhost/api/v1/health/ | jq .
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
