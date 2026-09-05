# Security Policy — MINDX Nexus

## Supported Versions

The following table outlines the active versions receiving security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of **MINDX Nexus** seriously. If you discover a security vulnerability or potential threat, please report it responsibly.

### How to Report:
1. **Email**: Send vulnerability reports directly to `shashankkumarrajp@gmail.com` or create a private GitHub security advisory.
2. **Details to Include**:
   - Description of the vulnerability and potential impact.
   - Step-by-step instructions or proof-of-concept script to reproduce the issue.
   - Affected routes, endpoints, or dependencies.

### Response Timeline:
- **Acknowledgement**: Within 24 hours.
- **Triage & Patching**: Within 48 hours for critical severity issues.

## Security Architecture & Defenses

- **API Key Confidentiality**: All AI API keys (`GEMINI_API_KEY`) are kept isolated on server-side environment configurations. No secret credentials are exposed in browser bundles.
- **HTTP Security Headers**: Enforced `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`, and `Referrer-Policy`.
- **Payload Limits**: Upload payloads are capped at 30MB via FastAPI middleware to prevent DoS attacks.
- **Input Sanitization**: File inputs are parsed securely with sanitized fallback logic.
