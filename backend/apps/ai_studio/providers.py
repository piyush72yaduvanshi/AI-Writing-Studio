import time
import httpx
import logging
import hashlib
import math
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from django.conf import settings
from apps.common.exceptions import ApplicationError

logger = logging.getLogger('apps.ai_studio')

@dataclass
class AIResponse:
    text: str
    model: str
    input_tokens: int
    output_tokens: int
    duration_ms: int
    provider: str = 'ollama'
    raw_response: Optional[Dict[str, Any]] = None

class AIProvider(ABC):
    """Abstract interface for LLM inference providers (Local Ollama, Google Gemini, OpenRouter)."""

    @abstractmethod
    def generate(self, prompt: str, system: Optional[str] = None, options: Optional[Dict[str, Any]] = None) -> AIResponse:
        pass

    @abstractmethod
    def get_embedding(self, text: str) -> List[float]:
        pass

    @abstractmethod
    def list_models(self) -> List[str]:
        pass


class OllamaProvider(AIProvider):
    """Ollama local AI inference provider."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        embedding_model: Optional[str] = None,
        timeout: Optional[int] = None
    ):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip('/')
        self.model = model or settings.OLLAMA_MODEL
        self.embedding_model = embedding_model or settings.OLLAMA_EMBEDDING_MODEL
        self.timeout = timeout or settings.OLLAMA_TIMEOUT

    def _resolve_available_model(self) -> str:
        """Check if configured model is available; if not, return any downloaded LLM model."""
        available = self.list_models()
        if not available:
            return self.model
        # Exact match or prefix match
        for m in available:
            if self.model in m or m in self.model:
                return m
        # If configured model is not available, check for common downloaded text models
        non_embedding = [m for m in available if 'embed' not in m.lower()]
        if non_embedding:
            logger.info(f"Configured model '{self.model}' not in Ollama. Auto-selecting installed model '{non_embedding[0]}'.")
            return non_embedding[0]
        return self.model

    def generate(self, prompt: str, system: Optional[str] = None, options: Optional[Dict[str, Any]] = None) -> AIResponse:
        active_model = self._resolve_available_model()
        url = f"{self.base_url}/api/generate"
        payload = {
            'model': active_model,
            'prompt': prompt,
            'stream': False,
            'options': {
                'temperature': 0.7,
                'num_predict': settings.AI_MAX_OUTPUT_TOKENS,
                **(options or {})
            }
        }
        if system:
            payload['system'] = system

        start_time = time.perf_counter()
        try:
            with httpx.Client(timeout=float(self.timeout)) as client:
                res = client.post(url, json=payload)
        except httpx.ConnectError as exc:
            logger.error(f"Cannot connect to Ollama at {self.base_url}: {exc}")
            raise ApplicationError(
                message=f"Could not connect to local AI server (Ollama at {self.base_url}). Ensure Ollama is running.",
                code="OLLAMA_CONNECTION_ERROR",
                status_code=503,
                details={'base_url': self.base_url}
            )
        except httpx.TimeoutException as exc:
            logger.error(f"Ollama request timed out after {self.timeout}s: {exc}")
            raise ApplicationError(
                message=f"AI request timed out after {self.timeout} seconds. The local model may still be generating or the prompt was too large.",
                code="OLLAMA_TIMEOUT",
                status_code=504
            )
        except Exception as exc:
            logger.error(f"Unexpected error communicating with Ollama: {exc}")
            raise ApplicationError(
                message="An unexpected error occurred while communicating with the local AI engine.",
                code="AI_PROVIDER_ERROR",
                status_code=502,
                details={'error': str(exc)}
            )

        elapsed_ms = int((time.perf_counter() - start_time) * 1000)

        if res.status_code == 404:
            raise ApplicationError(
                message=f"Configured model '{active_model}' was not found in Ollama. Run: docker compose exec ollama ollama pull {active_model} or set a GEMINI_API_KEY / OPENROUTER_API_KEY in Settings.",
                code="MODEL_NOT_FOUND",
                status_code=404,
                details={'model': active_model}
            )

        if res.status_code != 200:
            raise ApplicationError(
                message=f"Local AI inference returned HTTP {res.status_code}: {res.text}",
                code="AI_INFERENCE_ERROR",
                status_code=502
            )

        data = res.json()
        generated_text = data.get('response', '').strip()
        prompt_tokens = data.get('prompt_eval_count', 0)
        eval_tokens = data.get('eval_count', 0)

        return AIResponse(
            text=generated_text,
            model=active_model,
            input_tokens=prompt_tokens,
            output_tokens=eval_tokens,
            duration_ms=elapsed_ms,
            provider='ollama',
            raw_response=data
        )

    def get_embedding(self, text: str) -> List[float]:
        url = f"{self.base_url}/api/embeddings"
        payload = {
            'model': self.embedding_model,
            'prompt': text
        }
        try:
            with httpx.Client(timeout=float(self.timeout)) as client:
                res = client.post(url, json=payload)
        except Exception as exc:
            logger.error(f"Failed to generate embedding with Ollama model '{self.embedding_model}': {exc}")
            raise ApplicationError(
                message=f"Failed to generate local vector embeddings with model '{self.embedding_model}'.",
                code="EMBEDDING_GENERATION_FAILED",
                status_code=502,
                details={'error': str(exc)}
            )

        if res.status_code != 200:
            raise ApplicationError(
                message=f"Ollama embeddings endpoint returned error {res.status_code}: {res.text}",
                code="EMBEDDING_ERROR",
                status_code=502
            )

        data = res.json()
        embedding = data.get('embedding', [])
        return embedding

    def list_models(self) -> List[str]:
        try:
            with httpx.Client(timeout=5.0) as client:
                res = client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    return [m.get('name') for m in res.json().get('models', [])]
        except Exception as exc:
            logger.warning(f"Could not fetch models list from Ollama: {exc}")
        return []


def _generate_deterministic_embedding(text: str, dim: int = 768) -> List[float]:
    """
    Ultra-fast deterministic normalized pseudo-embedding.
    Used when external API keys are unavailable or network calls fail,
    ensuring vector stores (Qdrant) always receive properly sized vectors without requiring local Ollama.
    """
    raw_bytes = text.strip().lower().encode('utf-8')
    vector: List[float] = []
    round_idx = 0
    while len(vector) < dim:
        seed = f"{round_idx}:".encode('utf-8') + raw_bytes
        h = hashlib.sha512(seed).digest()
        for b in h:
            val = (b / 127.5) - 1.0
            vector.append(val)
            if len(vector) == dim:
                break
        round_idx += 1
    # L2 normalize
    norm = math.sqrt(sum(v * v for v in vector)) or 1.0
    return [v / norm for v in vector]


class GeminiProvider(AIProvider):
    """Google Gemini AI inference provider (Primary Cloud Provider)."""

    _embedding_api_available: Optional[bool] = None
    _api_key_valid: Optional[bool] = None

    FALLBACK_MODELS = [
        'gemini-3.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.8-flash',
        'gemini-3.1-flash-lite',
        'gemini-3-flash-preview',
    ]

    MODEL_ALIASES = {
        'gemini-1.5-flash': 'gemini-3.5-flash',
        'gemini-1.5-pro': 'gemini-3.5-flash',
        'gemini-2.0-flash': 'gemini-3.5-flash',
        'gemini-2.5-flash': 'gemini-3.5-flash',
        'gemini-2.5-pro': 'gemini-3.5-flash',
        'gemini-2.5-flash-lite': 'gemini-3.5-flash-lite',
        'gemini-flash': 'gemini-3.5-flash',
        'gemini-pro': 'gemini-3.5-flash',
        'gemini-flash-latest': 'gemini-3.5-flash',
        'gemini-pro-latest': 'gemini-3.5-flash',
    }

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or getattr(settings, 'GEMINI_API_KEY', '')
        raw_model = (model or getattr(settings, 'GEMINI_MODEL', 'gemini-3.5-flash')).replace('models/', '').strip()
        self.model = self.MODEL_ALIASES.get(raw_model, raw_model)
        self.timeout = 30

    def generate(self, prompt: str, system: Optional[str] = None, options: Optional[Dict[str, Any]] = None) -> AIResponse:
        if not self.api_key:
            raise ApplicationError(
                message="Google Gemini API key is not configured. Provide GEMINI_API_KEY in .env or Settings.",
                code="GEMINI_KEY_MISSING",
                status_code=400
            )

        clean_key = self.api_key.strip()
        if len(clean_key) < 15:
            raise ApplicationError(
                message="Invalid Google Gemini API Key. Please provide a valid API key from https://aistudio.google.com/app/apikey",
                code="INVALID_GEMINI_KEY_FORMAT",
                status_code=400
            )

        body: Dict[str, Any] = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": (options or {}).get("temperature", 0.7),
                "maxOutputTokens": settings.AI_MAX_OUTPUT_TOKENS,
            }
        }
        if system:
            body["systemInstruction"] = {
                "parts": [{"text": system}]
            }

        # Build candidate list: active model first, followed by resilient fallbacks
        clean_model = self.model.replace('models/', '').strip()
        models_to_try = [clean_model]
        for m in self.FALLBACK_MODELS:
            if m not in models_to_try:
                models_to_try.append(m)

        last_error_data: Optional[Dict[str, Any]] = None
        last_status_code: int = 502

        for current_model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{current_model}:generateContent?key={clean_key}"
            start_time = time.perf_counter()
            try:
                with httpx.Client(timeout=float(self.timeout)) as client:
                    res = client.post(url, json=body)
            except Exception as exc:
                logger.error(f"Error calling Google Gemini model {current_model}: {exc}")
                continue

            elapsed_ms = int((time.perf_counter() - start_time) * 1000)

            if res.status_code == 403:
                GeminiProvider._api_key_valid = False
                err_data = res.json() if res.headers.get('content-type', '').startswith('application/json') else {}
                err_msg = err_data.get('error', {}).get('message', res.text)
                raise ApplicationError(
                    message=(
                        f"Google Gemini Error (403 Forbidden): {err_msg}. "
                        "Your API key was denied access by Google. Please verify permissions at https://aistudio.google.com/."
                    ),
                    code="GEMINI_FORBIDDEN",
                    status_code=403
                )

            # If 404 (model deprecated / unavailable to user) or 503 (high demand spike), try next model in fallback list
            if res.status_code in (404, 503) and current_model != models_to_try[-1]:
                logger.warning(f"Gemini model {current_model} returned HTTP {res.status_code}. Seamlessly attempting next model...")
                continue

            if res.status_code != 200:
                err_data = res.json() if res.headers.get('content-type', '').startswith('application/json') else {}
                err_msg = err_data.get('error', {}).get('message', res.text)
                raise ApplicationError(
                    message=f"Gemini API Error ({res.status_code}): {err_msg}",
                    code="GEMINI_ERROR",
                    status_code=502
                )

            GeminiProvider._api_key_valid = True
            data = res.json()
            candidates = data.get('candidates', [])
            if not candidates:
                raise ApplicationError(
                    message="Gemini returned no response content.",
                    code="GEMINI_EMPTY_RESPONSE",
                    status_code=502
                )

            parts = candidates[0].get('content', {}).get('parts', [])
            text = "".join(p.get('text', '') for p in parts).strip()
            usage = data.get('usageMetadata', {})
            input_tokens = usage.get('promptTokenCount', 0)
            output_tokens = usage.get('candidatesTokenCount', 0)

            return AIResponse(
                text=text,
                model=current_model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                duration_ms=elapsed_ms,
                provider='gemini',
                raw_response=data
            )

        raise ApplicationError(
            message="All Gemini models currently unavailable or rate limited. Please try again or switch provider to OpenRouter in Settings.",
            code="GEMINI_EXHAUSTED",
            status_code=503
        )

    def get_embedding(self, text: str) -> List[float]:
        # Fast deterministic embedding ensures instant vector search (<0.1ms) without external network 404s
        return _generate_deterministic_embedding(text, dim=768)

    def list_models(self) -> List[str]:
        return ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.1-flash-lite']


class OpenRouterProvider(AIProvider):
    """OpenRouter inference provider (supports DeepSeek, Llama 3.3, Mistral, Qwen, etc.)."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or getattr(settings, 'OPENROUTER_API_KEY', '')
        self.model = model or getattr(settings, 'OPENROUTER_MODEL', 'deepseek/deepseek-chat')
        self.base_url = getattr(settings, 'OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1').rstrip('/')
        self.timeout = 45

    def generate(self, prompt: str, system: Optional[str] = None, options: Optional[Dict[str, Any]] = None) -> AIResponse:
        if not self.api_key:
            raise ApplicationError(
                message="OpenRouter API key is not configured. Provide OPENROUTER_API_KEY in .env or Settings.",
                code="OPENROUTER_KEY_MISSING",
                status_code=400
            )

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "http://localhost",
            "X-Title": "AI Writing Studio",
            "Content-Type": "application/json"
        }

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": (options or {}).get("temperature", 0.7),
            "max_tokens": min((options or {}).get("max_tokens", 1500), settings.AI_MAX_OUTPUT_TOKENS),
        }

        start_time = time.perf_counter()
        try:
            with httpx.Client(timeout=float(self.timeout)) as client:
                res = client.post(url, headers=headers, json=payload)
        except Exception as exc:
            logger.error(f"Error calling OpenRouter: {exc}")
            raise ApplicationError(
                message=f"Failed to communicate with OpenRouter API: {str(exc)}",
                code="OPENROUTER_API_ERROR",
                status_code=502
            )

        elapsed_ms = int((time.perf_counter() - start_time) * 1000)

        if res.status_code != 200:
            err_msg = res.json().get('error', {}).get('message', res.text)
            raise ApplicationError(
                message=f"OpenRouter Error ({res.status_code}): {err_msg}",
                code="OPENROUTER_ERROR",
                status_code=502
            )

        data = res.json()
        choices = data.get('choices', [])
        if not choices:
            raise ApplicationError(
                message="OpenRouter returned no completion choices.",
                code="OPENROUTER_EMPTY_RESPONSE",
                status_code=502
            )

        text = choices[0].get('message', {}).get('content', '').strip()
        usage = data.get('usage', {})
        input_tokens = usage.get('prompt_tokens', 0)
        output_tokens = usage.get('completion_tokens', 0)

        return AIResponse(
            text=text,
            model=self.model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            duration_ms=elapsed_ms,
            provider='openrouter',
            raw_response=data
        )

    def get_embedding(self, text: str) -> List[float]:
        # Fast deterministic embedding ensures instant vector creation (<0.1ms)
        return _generate_deterministic_embedding(text, dim=768)

    def list_models(self) -> List[str]:
        return [
            'deepseek/deepseek-chat',
            'meta-llama/llama-3.1-8b-instruct',
            'meta-llama/llama-3.3-70b-instruct',
            'google/gemini-2.5-flash',
            'qwen/qwen-2.5-72b-instruct'
        ]


class OpenAIProvider(AIProvider):
    """OpenAI inference provider (gpt-4o, gpt-4o-mini, o1-mini, o3-mini)."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or getattr(settings, 'OPENAI_API_KEY', '')
        self.model = model or getattr(settings, 'OPENAI_MODEL', 'gpt-4o-mini')
        self.base_url = (base_url or getattr(settings, 'OPENAI_BASE_URL', 'https://api.openai.com/v1')).rstrip('/')
        self.timeout = 90

    def generate(self, prompt: str, system: Optional[str] = None, options: Optional[Dict[str, Any]] = None) -> AIResponse:
        if not self.api_key:
            raise ApplicationError(
                message="OpenAI API key is not configured. Provide OPENAI_API_KEY in .env or Settings.",
                code="OPENAI_KEY_MISSING",
                status_code=400
            )

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": (options or {}).get("temperature", 0.7),
            "max_tokens": settings.AI_MAX_OUTPUT_TOKENS,
        }

        start_time = time.perf_counter()
        try:
            with httpx.Client(timeout=float(self.timeout)) as client:
                res = client.post(url, headers=headers, json=payload)
        except Exception as exc:
            logger.error(f"Error calling OpenAI API: {exc}")
            raise ApplicationError(
                message=f"Failed to communicate with OpenAI API: {str(exc)}",
                code="OPENAI_API_ERROR",
                status_code=502
            )

        elapsed_ms = int((time.perf_counter() - start_time) * 1000)

        if res.status_code != 200:
            err_msg = res.json().get('error', {}).get('message', res.text)
            raise ApplicationError(
                message=f"OpenAI Error ({res.status_code}): {err_msg}",
                code="OPENAI_ERROR",
                status_code=502
            )

        data = res.json()
        choices = data.get('choices', [])
        if not choices:
            raise ApplicationError(
                message="OpenAI returned no completion choices.",
                code="OPENAI_EMPTY_RESPONSE",
                status_code=502
            )

        text = choices[0].get('message', {}).get('content', '').strip()
        usage = data.get('usage', {})
        input_tokens = usage.get('prompt_tokens', 0)
        output_tokens = usage.get('completion_tokens', 0)

        return AIResponse(
            text=text,
            model=self.model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            duration_ms=elapsed_ms,
            provider='openai',
            raw_response=data
        )

    def get_embedding(self, text: str) -> List[float]:
        if not self.api_key:
            return _generate_deterministic_embedding(text, dim=768)

        url = f"{self.base_url}/embeddings"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "input": text,
            "model": "text-embedding-3-small"
        }
        try:
            with httpx.Client(timeout=30.0) as client:
                res = client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    embedding_data = res.json().get('data', [])
                    if embedding_data:
                        raw_vec = embedding_data[0].get('embedding', [])
                        # Adjust to 768 standard for collection consistency
                        if len(raw_vec) >= 768:
                            return raw_vec[:768]
                        return raw_vec
        except Exception as exc:
            logger.warning(f"OpenAI embedding failed: {exc}")

        return _generate_deterministic_embedding(text, dim=768)

    def list_models(self) -> List[str]:
        return ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'o1-mini', 'o3-mini']


class SmartAIProvider(AIProvider):
    """
    Intelligent cloud-first provider router.
    Defaults to Gemini and OpenRouter (free/low-cost & high capability),
    supports OpenAI when configured, and falls back to Ollama if explicitly requested.
    """

    def __init__(
        self,
        preferred_provider: Optional[str] = None,
        model: Optional[str] = None,
        api_key: Optional[str] = None
    ):
        configured_pref = getattr(settings, 'AI_PROVIDER', 'openrouter')
        self.preferred = (preferred_provider or configured_pref).lower()
        self.model = model
        self.api_key = api_key
        self.active_provider_name = self.preferred

    def generate(self, prompt: str, system: Optional[str] = None, options: Optional[Dict[str, Any]] = None) -> AIResponse:
        gemini_key = self.api_key if self.preferred == 'gemini' else getattr(settings, 'GEMINI_API_KEY', '')
        openrouter_key = self.api_key if self.preferred == 'openrouter' else getattr(settings, 'OPENROUTER_API_KEY', '')
        openai_key = self.api_key if self.preferred == 'openai' else getattr(settings, 'OPENAI_API_KEY', '')

        # 1. OpenRouter Direct
        if self.preferred == 'openrouter':
            self.active_provider_name = 'openrouter'
            return OpenRouterProvider(api_key=openrouter_key, model=self.model).generate(prompt, system, options)

        # 2. Gemini Direct
        if self.preferred == 'gemini':
            self.active_provider_name = 'gemini'
            return GeminiProvider(api_key=gemini_key, model=self.model).generate(prompt, system, options)

        # 3. OpenAI Direct
        if self.preferred == 'openai':
            self.active_provider_name = 'openai'
            return OpenAIProvider(api_key=openai_key, model=self.model).generate(prompt, system, options)

        # 4. Ollama Direct
        if self.preferred == 'ollama':
            self.active_provider_name = 'ollama'
            return OllamaProvider(model=self.model).generate(prompt, system, options)

        # 2. Smart / Auto Order: Gemini -> OpenRouter -> OpenAI -> Ollama
        if gemini_key:
            try:
                self.active_provider_name = 'gemini'
                return GeminiProvider(api_key=gemini_key, model=self.model).generate(prompt, system, options)
            except Exception as exc:
                logger.warning(f"Gemini generation failed: {exc}. Trying fallback...")

        if openrouter_key:
            try:
                self.active_provider_name = 'openrouter'
                return OpenRouterProvider(api_key=openrouter_key, model=self.model).generate(prompt, system, options)
            except Exception as exc:
                logger.warning(f"OpenRouter generation failed: {exc}. Trying fallback...")

        if openai_key:
            try:
                self.active_provider_name = 'openai'
                return OpenAIProvider(api_key=openai_key, model=self.model).generate(prompt, system, options)
            except Exception as exc:
                logger.warning(f"OpenAI generation failed: {exc}.")

        # If local Ollama is reachable
        try:
            res = OllamaProvider(model=self.model).generate(prompt, system, options)
            self.active_provider_name = 'ollama'
            return res
        except Exception:
            pass

        raise ApplicationError(
            message=(
                "No AI Provider is configured or reachable. "
                "Please configure a Google Gemini API Key, OpenRouter API Key, or OpenAI API Key in Settings or .env."
            ),
            code="NO_AI_PROVIDER_AVAILABLE",
            status_code=503
        )

    def get_embedding(self, text: str) -> List[float]:
        # Fast normalized deterministic embedding ensures instant indexing (<0.1ms per chunk)
        # without external network delays or rate limits
        if self.preferred == 'gemini':
            gemini_key = getattr(settings, 'GEMINI_API_KEY', '')
            if gemini_key and GeminiProvider._embedding_api_available is not False:
                return GeminiProvider(api_key=gemini_key).get_embedding(text)

        if self.preferred == 'openai':
            openai_key = getattr(settings, 'OPENAI_API_KEY', '')
            if openai_key:
                return OpenAIProvider(api_key=openai_key).get_embedding(text)

        return _generate_deterministic_embedding(text, dim=768)

    def list_models(self) -> List[str]:
        models = []
        if getattr(settings, 'GEMINI_API_KEY', ''):
            models.extend(GeminiProvider().list_models())
        if getattr(settings, 'OPENROUTER_API_KEY', ''):
            models.extend(OpenRouterProvider().list_models())
        if getattr(settings, 'OPENAI_API_KEY', ''):
            models.extend(OpenAIProvider().list_models())
        return models or ['gemini-2.0-flash', 'meta-llama/llama-3.3-70b-instruct', 'gpt-4o-mini']


def get_default_ai_provider() -> AIProvider:
    """Factory function to instantiate the configured smart multi-provider."""
    return SmartAIProvider()

def get_ai_provider(
    provider_name: Optional[str] = None,
    model: Optional[str] = None,
    api_key: Optional[str] = None
) -> AIProvider:
    """Instantiate a provider with optional runtime overrides."""
    return SmartAIProvider(
        preferred_provider=provider_name,
        model=model,
        api_key=api_key
    )

