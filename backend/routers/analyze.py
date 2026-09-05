try:
    import pymupdf as fitz
except ImportError:
    import fitz
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from services.gemini_service import general_analyze
from schemas.models import AnalyzeResponse

router = APIRouter()


def _extract_text_if_document(filename: str, content: bytes) -> tuple[Optional[str], Optional[bytes], Optional[str]]:
    ext = (filename or "").lower().split(".")[-1]
    if ext == "pdf":
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            text = "\n".join(page.get_text() for page in doc)
            doc.close()
            return f"Attached PDF ({filename}) content:\n\n{text[:15000]}", None, None
        except Exception as e:
            print(f"Failed to parse PDF text: {e}")
            return None, content, "application/pdf"
    elif ext in ("txt", "md", "markdown", "py", "js", "ts", "json", "yaml", "yml"):
        return f"Attached File ({filename}) content:\n\n{content.decode('utf-8', errors='ignore')[:15000]}", None, None
    elif ext in ("jpg", "jpeg", "png", "gif", "webp"):
        return None, content, f"image/{'jpeg' if ext in ('jpg','jpeg') else ext}"
    else:
        return None, content, "image/jpeg"


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    prompt: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    try:
        image_bytes = None
        mime_type = None
        user_prompt = prompt or ""

        if file:
            file_content = await file.read()
            doc_text, img_b, mime = _extract_text_if_document(file.filename or "file", file_content)
            if doc_text:
                user_prompt = f"{user_prompt}\n\n{doc_text}".strip()
            else:
                image_bytes = img_b
                mime_type = mime

        result = await general_analyze(user_prompt, image_bytes, mime_type)
        return result
    except Exception as e:
        print(f"[Analyze API Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


