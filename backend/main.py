"""
MINDX Nexus — FastAPI Backend
"""
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import analyze, reality, knowledge, builder, verify, notebook, github

app = FastAPI(
    title="MINDX Nexus API",
    description="Multimodal AI workspace powered by Gemini",
    version="1.0.0",
)

# CORS — allow Vite dev server & production frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    # Enforce maximum upload payload limit (30MB)
    if request.headers.get("content-length"):
        try:
            length = int(request.headers.get("content-length", 0))
            if length > 30 * 1024 * 1024:
                return JSONResponse(
                    status_code=413,
                    content={"detail": "Payload size limit exceeded (Max 30MB)."}
                )
        except ValueError:
            pass

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


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

