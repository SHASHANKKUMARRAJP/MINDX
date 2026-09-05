"""
MINDX Nexus — FastAPI Backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import analyze, reality, knowledge, builder, verify, notebook, github

app = FastAPI(
    title="MINDX Nexus API",
    description="Multimodal AI workspace powered by Gemini",
    version="1.0.0",
)

# CORS — allow Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(analyze.router, prefix="/api", tags=["Analyze"])
app.include_router(reality.router, prefix="/api", tags=["Reality Scanner"])
app.include_router(knowledge.router, prefix="/api", tags=["Second Brain"])
app.include_router(builder.router, prefix="/api", tags=["App Builder"])
app.include_router(verify.router, prefix="/api", tags=["Verify"])
app.include_router(notebook.router, prefix="/api", tags=["Notebook"])
app.include_router(github.router, prefix="/api", tags=["GitHub Analysis"])



@app.get("/")
def root():
    return {"status": "MINDX Nexus API is running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
