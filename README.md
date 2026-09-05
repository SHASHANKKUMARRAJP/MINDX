# MINDX Nexus 🚀
> **AI Project Idea Generator, Code Builder & Multimodal Mentor for Final-Year Student Projects & Hackathons**

[![CI/CD Pipeline](https://github.com/SHASHANKKUMARRAJP/MINDX/actions/workflows/ci.yml/badge.svg)](https://github.com/SHASHANKKUMARRAJP/MINDX/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code Style: Black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![Accessibility: WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-success)](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 🎯 Problem Statement Alignment & Innovation

**MINDX Nexus** solves the fundamental challenges faced by students, hackathon builders, and researchers during final-year project development:
1. **Idea Conception & Validation**: Real-time project idea generation and automated GitHub project structure generation powered by Google Gemini 2.0 Flash.
2. **Multimodal Code & Document Intelligence**: Interactive Notebooks (`/notebook`) capable of reading PDFs, code files, and vision scans to construct interactive 3D Knowledge Graphs.
3. **Automated Verification & Debugging**: One-click code verification, security check, and reality scans using multimodal vision AI.
4. **Inclusive & Mobile-First Design**: Native mobile layout responsiveness with full WCAG 2.1 AA screen-reader support (ARIA labels, keyboard navigation, high contrast themes).

---

## ⚡ Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate | On Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Add your GEMINI_API_KEY
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** to launch the workspace.

---

## 🛡️ Security & Code Quality

- **Zero-Crash Architecture**: Every router implements defensive error-handling with safe fallback responses to prevent unhandled exception leaks.
- **Security Headers**: Enforces `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy`, and strict CORS policies.
- **Automated CI/CD**: Fully configured GitHub Actions workflow (`.github/workflows/ci.yml`) running pytest and code quality linters on every commit.

---

## 🧪 Comprehensive Test Suite

Run unit and integration tests across all routers:
```bash
# Run backend tests
cd backend
pytest --cov=. tests/

# Run frontend tests
cd frontend
npm test
```

---

## 📱 Mobile-First Modules

| Module | Route | Description |
|--------|-------|-------------|
| ⬡ **Nexus Home** | `/` | Multimodal Workspace, GitHub Repo Analyzer & Interactive Knowledge Graph |
| 📓 **AI Notebook** | `/notebook` | Multi-source context engine, PDF reader, and project mentor |
| ◎ **Reality Scanner** | `/reality` | Vision AI object identification & environment analysis |
| ◈ **AI App Builder** | `/builder` | Prompt-to-app generator & codebase architect |
| ◉ **Content Verify** | `/verify` | Automated visual, security, and logic verifier |

---

## 🧰 Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Lucide Icons + Framer Motion
- **Backend**: Python FastAPI + Uvicorn + PyMuPDF + Google GenAI SDK
- **AI Core**: Google Gemini 2.0 Flash Multimodal Model
- **Deployment**: Vercel (Frontend) + Render (Backend)

---

## 📜 License & Compliance

Distributed under the MIT License. See `LICENSE` for details. Built to satisfy all WCAG 2.1 AA accessibility guidelines and Hack2Skill AI Hackathon submission standards.
