# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

The AI Writing Studio team takes the security of our application and the privacy of our users very seriously.

If you believe you have found a security vulnerability in AI Writing Studio, please follow these steps:

1. **Do not disclose the vulnerability publicly** in a GitHub issue, forum, or social media.
2. Email your findings directly to the project security contacts or open a private GitHub Security Advisory.
3. Include as much information as possible:
   - Description of the vulnerability and its potential impact
   - Step-by-step instructions to reproduce
   - Proof of Concept (PoC) scripts or payloads
   - Affected components, environments, or endpoints
   - Suggested mitigations if known

## Security Principles

- **Multi-Provider Privacy & Control**: AI Writing Studio provides granular control over inference engines. Users can use direct cloud providers (Google Gemini, OpenRouter, OpenAI) with zero server-side retention of user keys, or run 100% offline via local Ollama.
- **Untrusted RAG Context**: User-uploaded reference documents are treated as untrusted data and strictly isolated from system instructions to prevent prompt injection.
- **Strong Authentication**: JWT tokens with access/refresh rotation and secure password hashing (PBKDF2/Argon2).
- **Environment Isolation**: Production secrets and database credentials must never be committed to source control.
