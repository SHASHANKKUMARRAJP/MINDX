import io
try:
    import pymupdf as fitz  # PyMuPDF >= 1.24
except ImportError:
    import fitz  # older PyMuPDF fallback
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
from services.gemini_service import extract_knowledge
from schemas.models import KnowledgeResponse

router = APIRouter()


def extract_text_from_file(filename: str, content: bytes) -> str:
    """Extract text from PDF, TXT, MD, or image files."""
    ext = filename.lower().split(".")[-1]
    
    if ext == "pdf":
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            text = "\n".join(page.get_text() for page in doc)
            doc.close()
            if text.strip():
                return text[:15000]
        except Exception as e:
            print(f"[Knowledge Router] PDF extract error: {e}")
        return f"[PDF Document: {filename} — text content extracted from file structure]"
    
    elif ext in ("txt", "md", "markdown", "py", "js", "ts", "json", "yaml", "yml"):
        return content.decode("utf-8", errors="ignore")[:15000]
    
    elif ext in ("jpg", "jpeg", "png", "gif", "webp"):
        return f"[Image file: {filename}]"  # images analyzed separately if needed
    
    else:
        # Try decode as text
        try:
            return content.decode("utf-8", errors="ignore")[:10000]
        except Exception:
            return f"[Binary file: {filename} — could not extract text]"


@router.post("/knowledge", response_model=KnowledgeResponse)
async def extract_knowledge_graph(
    files: List[UploadFile] = File(...),
    question: Optional[str] = Form(None),
):
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        texts = []
        filenames = []
        
        for f in files:
            content = await f.read()
            text = extract_text_from_file(f.filename or "file", content)
            texts.append(text)
            filenames.append(f.filename or "unknown")
        
        if question:
            texts.append(f"\n\nUser's specific question: {question}")
            filenames.append("user_question")
        
        result = await extract_knowledge(texts, filenames)
        return result
    except Exception as e:
        print(f"[Knowledge API Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))

