# Multi-Provider AI Architecture & Inference Engine

## 1. Architectural Philosophy

AI Writing Studio utilizes a **Cloud-First Multi-Provider AI Architecture** with optional local inference capability. This architecture is engineered for:

1. **Ultra-Low Latency**: Sub-2-second end-to-end response times for prose generation and transformations.
2. **Provider Redundancy & Flexibility**: Seamless switching between OpenRouter, Google Gemini, OpenAI, and local Ollama without modifying application logic.
3. **No Heavy Docker Pull Times**: Eliminates multi-gigabyte local model downloads by default while preserving local inference for air-gapped environments.
4. **Cultural Nuance & Stylistic Fidelity**: First-class support for Romanized Hinglish, Hindi, and English across literary, cinematic, and editorial writing genres.

---

## 2. Supported AI Providers & Models

| Provider | Status | Default Model | Key Strengths & Use Cases |
| :--- | :--- | :--- | :--- |
| **OpenRouter** *(Primary)* | Cloud | `deepseek/deepseek-chat` | Highest quality prose, deep structural reasoning, blazing fast (~1.5s), and cost-effective. Supports Llama 3.3 70B, Qwen 2.5 72B, and Mistral. |
| **Google Gemini** | Cloud | `gemini-2.5-flash` | Ultra-fast token generation, massive context window (1M+ tokens), multilingual Hindi/Hinglish fluidity. |
| **OpenAI** | Cloud | `gpt-4o-mini` | Precise instruction following, strict grammar corrections, and structured formatting. |
| **Ollama** | Local | `qwen3:8b` | Completely private, offline-capable open-weight execution for hardware with 16GB+ RAM / NVIDIA GPU. |

---

## 3. Configuration & Runtime Selection

### Environment Variables
Configure primary credentials in `.env`:

```env
# Set primary engine: 'openrouter', 'gemini', 'openai', 'ollama', or 'auto'
AI_PROVIDER=openrouter

# OpenRouter Configuration
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=deepseek/deepseek-chat

# Google Gemini Configuration
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash

# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Optional Local Ollama
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=qwen3:8b
```

### Runtime Override via UI
Authors can override the active provider, model, and API keys per-session or per-workspace directly in the **Settings** view (`/settings`). Custom API keys provided in Settings are stored client-side in secure `localStorage` and passed to the backend per request, never written to disk.

---

## 4. Hinglish & Multilingual Processing

Hinglish (a fluid blend of Hindi colloquial syntax, Romanized vocabulary, and culture-rich idioms) is natively supported without requiring pre-translation:

1. **Idiomatic Decoding**: Rather than translating word-by-word (e.g., *"mera dimaag kharab ho gaya hai"*), the prompt framework captures the emotional state (*"deep frustration / cognitive overwhelm"*).
2. **Authentic Cadence**: Preserves character voice in urban dramas and youth narratives where dialogue fluidly transitions between emotional Hindi expressions and analytical English terms.
3. **Target Tone Preservation**: Outputs can be directed to English, Devanagari Hindi, or polished Hinglish with tones like *Cinematic*, *Emotional*, *Professional*, or *Casual*.

---

## 5. Editorial Ethics & Anti-Over-Correction

To maintain the author's authentic voice, different transformation actions apply strict preservation rules:

- **`fix_grammar`**: Corrects typos, punctuation, and grammatical agreement without altering sentence cadence, colloquial tone, or regional character quirks.
- **`improve` / `rewrite`**: Reformulates syntax, enhances rhythmic cadence, and expands vocabulary while respecting the original message.
- **`simplify`**: Decreases structural complexity and removes redundancies while retaining every key narrative beat.
- **`convert_to_screenplay`**: Restructures loose notes into standard industry screenplay drafts (uppercase sluglines, character cues, parentheticals, and visual action beats).
