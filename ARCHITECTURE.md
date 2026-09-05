# MINDX Nexus Architecture & Technical Blueprint 🏗️

## Overview
**MINDX Nexus** is a state-of-the-art multimodal AI platform engineered specifically for final-year student project guidance, automatic code generation, visual intelligence, and knowledge graph mapping.

```
┌──────────────────────────────────────────────────────────────┐
│                    Frontend (React 18 + Vite)                │
│  - Tailwind CSS / Glassmorphism UI                            │
│  - Framer Motion Micro-animations                           │
│  - WCAG 2.1 AA Screen Reader & Mobile Accessibility          │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTP REST API / JSON
┌──────────────────────────────▼───────────────────────────────┐
│                   Backend Engine (FastAPI)                   │
│  - Security Headers & Middleware Filter                      │
│  - Routers: API, Reality, Builder, Notebook, Verify, GitHub  │
│  - Safe Fallback Zero-Crash Error Handlers                   │
└──────────────────────────────┬───────────────────────────────┘
                               │ Google GenAI SDK
┌──────────────────────────────▼───────────────────────────────┐
│               AI Intelligence (Google Gemini 2.0)            │
│  - Gemini 2.0 Flash Multimodal Vision & Text                 │
│  - Knowledge Graph Node Extraction Engine                    │
└──────────────────────────────────────────────────────────────┘
```

## Core Modules & API Contracts

### 1. Multimodal AI Notebook (`/notebook`)
- Reads PDFs via PyMuPDF (`fitz`), extracts structured text and image layers.
- Maps cross-document insights into an interactive 3D Force-Directed Knowledge Graph.

### 2. Reality Scanner (`/reality`)
- Consumes raw base64/binary imagery to run vision object detection and environment risk assessment.

### 3. AI App Builder (`/builder`)
- Translates high-level project specifications into functional multi-file codebases.

### 4. GitHub Project Analyzer (`/api/github/analyze`)
- Parses repository trees, extracts architecture blueprints, and generates implementation roadmaps.

## Security & Resilience
- **Input Sanitization**: Pydantic v2 data models for all request payloads.
- **Fail-Safe Fallbacks**: Guaranteed structured responses even in the presence of upstream network timeouts.
- **CORS & CSP Security**: Restrictive cross-origin resource sharing policies preventing XSS and clickjacking.
