from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
from services.gemini_service import verify_content
from schemas.models import VerifyResponse

router = APIRouter()


@router.post("/verify", response_model=VerifyResponse)
async def verify(
    file: Optional[UploadFile] = File(None),
    text_content: Optional[str] = Form(None),
):
    image_bytes = None
    mime_type = None
    if file:
        image_bytes = await file.read()
        mime_type = file.content_type or "image/jpeg"
    
    result = await verify_content(image_bytes, mime_type, text_content)
    return result
