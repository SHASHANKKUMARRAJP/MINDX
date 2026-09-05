"""
Nexus Notebook — FastAPI Router
Endpoints: /notebook/build, /notebook/action, /notebook/chat
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
from services.gemini_service import notebook_extract_graph, notebook_ai_action, notebook_chat
from schemas.models import NotebookBuildResponse, NotebookActionResponse, NotebookChatResponse

router = APIRouter()

# Try to import PDF parser — optional dependency
try:
    try:
        import pymupdf as fitz
    except ImportError:
        import fitz
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False
    print("[Notebook] pymupdf/fitz not available — PDF text extraction disabled, will use raw bytes")


def _extract_text(filename: str, content: bytes) -> str:
    """Extract plain text from supported file types."""
    ext = (filename or "").lower().split(".")[-1]

    if ext == "pdf":
        if HAS_FITZ:
            try:
                doc = fitz.open(stream=content, filetype="pdf")
                pages_text = []
                for page_num, page in enumerate(doc):
                    t = page.get_text().strip()
                    if t:
                        pages_text.append(f"--- Page {page_num + 1} ---\n" + t)
                doc.close()
                extracted = "\n\n".join(pages_text)
                if extracted.strip():
                    return extracted[:100000]
            except Exception as e:
                print(f"[Notebook] PDF parse failed for {filename}: {e}")
        # Fallback: try to decode raw bytes
        try:
            raw = content.decode("latin-1", errors="ignore")
            lines = [line_str.strip() for line_str in raw.split("\n") if len(line_str.strip()) > 20 and line_str.strip().isascii()]
            return "\n".join(lines[:400]) or f"[PDF: {filename} — could not extract text]"
        except Exception as parse_err:
            print(f"[Notebook Fallback Error] {parse_err}")
            return f"[PDF: {filename} — binary content]"

    if ext in ("txt", "md", "markdown", "rst"):
        return content.decode("utf-8", errors="ignore")[:15000]

    if ext in ("py", "js", "ts", "jsx", "tsx", "java", "cpp", "c", "go", "rs",
               "json", "yaml", "yml", "toml", "ini", "sh", "bash"):
        return f"[Code file: {filename}]\n" + content.decode("utf-8", errors="ignore")[:12000]

    if ext in ("jpg", "jpeg", "png", "gif", "webp"):
        return f"[Image file: {filename} — visual content not extracted in text mode]"

    try:
        return content.decode("utf-8", errors="ignore")[:10000]
    except Exception:
        return f"[Binary file: {filename} — could not extract text]"



@router.post("/notebook/build", response_model=NotebookBuildResponse)
async def build_notebook(
    files: List[UploadFile] = File(...),
):
    """
    Accept multiple source files, extract text, and build a concept knowledge graph.
    """
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files provided.")

        texts = []
        filenames = []

        for f in files:
            content = await f.read()
            text = _extract_text(f.filename or "file", content)
            texts.append(text)
            filenames.append(f.filename or "unknown")

        result = await notebook_extract_graph(texts, filenames)
        combined_ctx = "\n\n---\n\n".join(
            f"SOURCE FILE: {name}\n{text}" for name, text in zip(filenames, texts)
        )
        result["source_context"] = combined_ctx[:30000]
        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Notebook Build Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notebook/action", response_model=NotebookActionResponse)
async def notebook_action(
    action: str = Form(...),
    node_title: str = Form(...),
    node_description: Optional[str] = Form(""),
    source_context: Optional[str] = Form(""),
):
    """
    Perform a source-grounded AI action (explain, deep_dive, connections, example,
    quiz, missing, summarize) on a selected knowledge graph node.
    """
    try:
        if not action or not node_title:
            raise HTTPException(status_code=400, detail="action and node_title are required.")

        result = await notebook_ai_action(
            action=action,
            node_title=node_title,
            node_description=node_description or "",
            source_context=source_context or "",
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Notebook Action Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notebook/chat", response_model=NotebookChatResponse)
async def notebook_chat_endpoint(
    message: str = Form(...),
    source_context: Optional[str] = Form(""),
):
    """
    Answer a user question grounded in the uploaded notebook sources.
    """
    try:
        if not message:
            raise HTTPException(status_code=400, detail="message is required.")

        result = await notebook_chat(
            message=message,
            source_context=source_context or "",
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Notebook Chat Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))
