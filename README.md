# MINDX Nexus 🚀

A production-quality multimodal AI workspace powered by Google Gemini 2.0 Flash.

## Quick Start

### Step 1 — Add your Gemini API key
Open `backend/.env` and replace `your_gemini_api_key_here` with your actual key:
```
GEMINI_API_KEY=AIza...your_key_here
```
Get one free at https://aistudio.google.com/app/apikey

### Step 2 — Install backend
Double-click `install_backend.bat` OR run in terminal:
```bash
cd backend
pip install -r requirements.txt
```

### Step 3 — Install frontend
Double-click `install_frontend.bat` OR run in terminal:
```bash
cd frontend
npm install
```

### Step 4 — Start the app
Open **two terminal windows**:

Terminal 1 (Backend):
```bash
cd backend
uvicorn main:app --reload --port 8000
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

Then open: **http://localhost:5173**

---

## Modules

| Module | Route | Description |
|--------|-------|-------------|
| ⬡ Nexus Home | `/` | Central command — Multimodal, Knowledge Graph & GitHub Repo Analysis |
| ◎ Reality Scanner | `/reality` | Image object identification with Gemini Vision |
| ◈ AI App Builder | `/builder` | Prompt → live working app prototype |
| ◉ Content Verify | `/verify` | AI-assisted content & visual consistency analysis |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | General multimodal analysis |
| POST | `/api/reality-scan` | Image object identification |
| POST | `/api/knowledge` | Knowledge graph extraction |
| POST | `/api/generate-app` | Prompt → app code |
| POST | `/api/verify` | Content consistency analysis |

API docs: http://localhost:8000/docs

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Framer Motion
- **Backend**: Python FastAPI + Uvicorn
- **AI**: Google Gemini 2.0 Flash (multimodal)
- **Graph**: react-force-graph-2d
- **Files**: PyMuPDF (PDF parsing)
