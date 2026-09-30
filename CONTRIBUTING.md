# Contributing to AI Writing Studio

Thank you for your interest in contributing to **AI Writing Studio**! As an open-source, local-first writing assistant, we welcome contributions from engineers, writers, and designers.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Coding Guidelines](#coding-guidelines)
- [Testing Standards](#testing-standards)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Issues](#reporting-issues)

---

## Code of Conduct

Please review our [Code of Conduct](CODE_OF_CONDUCT.md) before participating in discussions or submitting contributions.

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/ai-writing-studio.git
   cd ai-writing-studio
   ```
3. **Create a branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/my-new-action
   ```

---

## Development Setup

### Option A: Using Docker (Recommended)

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure your primary AI API key (`OPENROUTER_API_KEY` or `GEMINI_API_KEY`) in `.env`.
3. Start all services:
   ```bash
   docker compose up -d
   ```
4. Access:
   - Web Application: `http://localhost` (or `http://localhost:3000`)
   - Backend API: `http://localhost/api/v1/`
   - Swagger Documentation: `http://localhost/api/docs/`

### Option B: Local Non-Docker Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Project Architecture

The backend follows a strict layered architecture:
```text
Controllers/Views (Django REST Framework)
       ↓
Service Layer (Business logic & AI coordination)
       ↓
Repositories & Models (Data access, ORM)
```

- **`backend/apps/accounts`**: User model, registration, JWT authentication.
- **`backend/apps/documents`**: Documents, versioning, CRUD operations.
- **`backend/apps/ai_studio`**: Multi-Provider AI abstraction (`OpenRouterProvider`, `GeminiProvider`, `OpenAIProvider`, `OllamaProvider`), prompt builder, token & duration metrics.
- **`backend/apps/references`**: Open Knowledge Format (OKF), document chunking, resilient vector embedding, Qdrant integration.
- **`frontend/src`**: React 18+ with TypeScript, Tailwind CSS, TanStack Query, and Lucide icons.

---

## Coding Guidelines

### Python (Backend)
- Adhere to **PEP 8** style guidelines.
- Use explicit type annotations.
- Business logic belongs in `services/`, never directly inside DRF viewsets or models.
- All AI prompt templates are centralized in `backend/prompts/`.

### TypeScript / React (Frontend)
- Use strict TypeScript; avoid `any`.
- Keep components focused and reusable.
- Extract API calls into dedicated functions inside `src/api/`.
- Handle loading, error, and empty states gracefully.

---

## Testing Standards

All pull requests should include or pass tests:

- **Backend tests:**
  ```bash
  docker compose exec backend pytest
  ```
  Note: AI tests use mocked provider responses and do not require live external API keys during standard CI runs.

- **Frontend tests & linting:**
  ```bash
  cd frontend
  npm run test
  npm run build
  ```

---

## Submitting a Pull Request

1. Commit your changes with descriptive messages:
   ```bash
   git commit -m "feat(ai): add technical writing tone option"
   ```
2. Push your branch to GitHub:
   ```bash
   git push origin feature/my-new-action
   ```
3. Open a Pull Request against `main`.
4. Ensure all CI checks and tests pass.

---

## Reporting Issues

- Search existing issues to verify it hasn't been reported.
- Provide detailed steps to reproduce, including your OS, Docker version, and Ollama model configuration.
