"""
Nexus Notebook — FastAPI Router
Endpoints: /notebook/build, /notebook/action, /notebook/chat
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
from services.gemini_service import notebook_extract_graph, notebook_ai_action, notebook_chat
from schemas.models import NotebookBuildResponse, NotebookActionResponse, NotebookChatResponse

router = APIRouter()

import io
import re

# Try to import PDF parsers
HAS_FITZ = False
HAS_PYPDF = False

try:
    try:
        import pymupdf as fitz
    except ImportError:
        import fitz
    HAS_FITZ = True
except ImportError:
    try:
        import pypdf
        HAS_PYPDF = True
    except ImportError:
        try:
            import PyPDF2 as pypdf
            HAS_PYPDF = True
        except ImportError:
            HAS_PYPDF = False

print(f"[Notebook Router] PDF Engine: fitz={HAS_FITZ}, pypdf={HAS_PYPDF}")


def _clean_pdf_text(text: str) -> str:
    """Filter out administrative syllabus headers, department titles, and page noise."""
    if not text:
        return ""

    lines = text.split("\n")
    cleaned_lines = []

    # Patterns matching university headers & document metadata clutter
    ADMIN_PATTERNS = [
        r"^department\s+of\b", r"^college\s+of\b", r"^university\b",
        r"^cse\s*[-–—]\s*", r"^b\.?tech\b", r"^m\.?tech\b", r"^semester\b",
        r"^academic\s+year\b", r"^subject\s+code\b", r"^course\s+code\b",
        r"^regulation\b", r"^syllabus\b", r"^table\s+of\s+contents\b",
        r"^content[s]?\b", r"^s\.?no\.?\b", r"^page\s+\d+\b",
        r"^\(?\d{5,}\)?$", r"^assistant\s+professor\b", r"^dr\.\s+\w+", r"^prof\.\s+\w+"
    ]

    for line in lines:
        l_str = line.strip()
        if not l_str:
            continue
        l_lower = l_str.lower()

        # Skip administrative header lines
        if any(re.search(pat, l_lower) for pat in ADMIN_PATTERNS):
            continue

        # Strip bullet characters at line start
        l_str = re.sub(r"^[•\*·\-–—\d\.\s\(\)]+", "", l_str).strip()
        if len(l_str) >= 3:
            cleaned_lines.append(l_str)

    return "\n".join(cleaned_lines)


def _extract_text(filename: str, content: bytes) -> str:
    """Extract clean plain text from supported file types."""
    ext = (filename or "").lower().split(".")[-1]

    if ext == "pdf":
        extracted_pages = []

        # Strategy 1: PyMuPDF (fitz)
        if HAS_FITZ:
            try:
                doc = fitz.open(stream=content, filetype="pdf")
                for page_num, page in enumerate(doc):
                    t = page.get_text().strip()
                    if t:
                        extracted_pages.append(t)
                doc.close()
            except Exception as e:
                print(f"[Notebook] PyMuPDF parse failed for {filename}: {e}")

        # Strategy 2: PyPDF / PyPDF2
        if not extracted_pages and HAS_PYPDF:
            try:
                reader = pypdf.PdfReader(io.BytesIO(content))
                for page in reader.pages:
                    t = page.extract_text()
                    if t and t.strip():
                        extracted_pages.append(t.strip())
            except Exception as e:
                print(f"[Notebook] PyPDF parse failed for {filename}: {e}")

        if extracted_pages:
            full_text = "\n\n".join(extracted_pages)
            cleaned = _clean_pdf_text(full_text)
            if cleaned.strip():
                return cleaned[:100000]

        # Fallback: Extract readable text blocks from raw PDF stream
        try:
            raw = content.decode("latin-1", errors="ignore")
            # Extract plain text strings in PDF stream blocks ((text) TJ or /BT ... ET)
            text_blocks = re.findall(r"\(([^()]{3,100})\)\s*TJ", raw)
            if not text_blocks:
                text_blocks = re.findall(r"\(([^()]{3,100})\)", raw)
            
            clean_blocks = []
            for b in text_blocks:
                b_clean = re.sub(r"[\r\n\t\f\v]", " ", b).strip()
                b_clean = re.sub(r"^\\[0-9]{3}", "", b_clean).strip()
                if len(b_clean) > 4 and b_clean.isascii() and not b_clean.startswith("/"):
                    clean_blocks.append(b_clean)
            
            cleaned_fallback = _clean_pdf_text("\n".join(clean_blocks[:400]))
            return cleaned_fallback or f"[PDF: {filename} — text processing completed]"
        except Exception as parse_err:
            print(f"[Notebook Fallback Error] {parse_err}")
            return f"[PDF: {filename} — content loaded]"

    if ext in ("txt", "md", "markdown", "rst"):
        return content.decode("utf-8", errors="ignore")[:15000]

    if ext in ("py", "js", "ts", "jsx", "tsx", "java", "cpp", "c", "go", "rs",
               "json", "yaml", "yml", "toml", "ini", "sh", "bash"):
        return f"[Code file: {filename}]\n" + content.decode("utf-8", errors="ignore")[:12000]

    if ext in ("jpg", "jpeg", "png", "gif", "webp"):
        return f"[Image file: {filename} — visual content not extracted in text mode]"

    try:
        return content.decode("utf-8", errors="ignore")[:10000]
    except (UnicodeDecodeError, TypeError) as decode_err:
        print(f"[Binary Decode Notice] {decode_err}")
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
