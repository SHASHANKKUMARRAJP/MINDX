from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from services.gemini_service import reality_scan, _fallback_reality_scan
from schemas.models import RealityScanResponse

router = APIRouter()


@router.post("/reality-scan", response_model=RealityScanResponse)
async def scan_reality(
    file: UploadFile = File(...),
    prompt: Optional[str] = Form("Analyze this image in detail."),
    mode: Optional[str] = Form("general"),
):
    try:
        image_bytes = await file.read()
        mime_type = file.content_type or "image/jpeg"
        result = await reality_scan(image_bytes, mime_type, prompt, mode)
        return result
    except Exception as e:
        print(f"[Reality API Error] {e}. Using resilient visual scanner fallback.")
        return _fallback_reality_scan(prompt or "", mode or "general")


