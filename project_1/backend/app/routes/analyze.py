import time
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel
from app.services.document_extractor_service import document_extractor
from app.services.gemini_service import gemini_service
from app.config import settings

router = APIRouter(prefix="/api", tags=["Document Analysis"])

VALID_DEPTHS = ["quick", "detailed", "in_depth"]

class RegenerateRequest(BaseModel):
    extracted_text: str
    summary_depth: str = "detailed"
    document_format: str = "Document"
    filename: Optional[str] = "document"

@router.post("/extract-text")
async def extract_text_only(file: UploadFile = File(...)):
    """
    Extract text from an uploaded document (PDF, DOCX, TXT, XLSX, PPTX, CSV)
    without invoking Gemini AI analysis.
    """
    filename = file.filename or "unknown_file"

    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read uploaded file: {str(e)}"
        )

    # Validate file format and size
    is_valid, ext, validation_msg = document_extractor.validate_document(filename, content)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=validation_msg
        )

    # Extract text content
    success, extracted_text, metadata, extract_msg = document_extractor.extract(filename, content)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=extract_msg
        )

    return {
        "success": True,
        "filename": filename,
        "file_format": ext.upper().replace(".", ""),
        "metadata": metadata,
        "extracted_text": extracted_text,
        "message": extract_msg
    }

@router.post("/analyze")
async def analyze_document(
    file: UploadFile = File(...),
    summary_depth: str = Form("detailed")
):
    """
    Complete multi-format analysis pipeline:
    1. Validate uploaded document (PDF, DOCX, TXT, XLSX, PPTX, CSV)
    2. Extract text with format-specific extractor (or Document AI OCR for scanned PDFs)
    3. Validate summary_depth ('quick', 'detailed', 'in_depth') - default is 'detailed'
    4. Send extracted content + depth mode to Google Gemini API
    5. Validate and return structured JSON
    """
    start_time = time.time()
    filename = file.filename or "unknown_document"

    # Validate summary_depth
    clean_depth = summary_depth.lower().strip() if summary_depth else "detailed"
    if clean_depth not in VALID_DEPTHS:
        clean_depth = "detailed"

    # 1. Read file bytes
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}"
        )

    # 2. Validate format and size
    is_valid, ext, validation_msg = document_extractor.validate_document(filename, content)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=validation_msg
        )

    # 3. Extract text content
    extract_success, extracted_text, metadata, extract_msg = document_extractor.extract(filename, content)
    if not extract_success:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=extract_msg
        )

    # 4. Check Gemini configuration
    if not gemini_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Gemini API key is not configured in backend/.env. "
                "Document content was extracted successfully, but AI analysis requires an API key. "
                "Please configure GEMINI_API_KEY in backend/.env and restart the backend."
            )
        )

    # 5. Perform Gemini AI analysis adapted to format & selected depth
    format_label = metadata.get("format", ext.upper().replace(".", ""))
    ai_success, analysis_data, ai_msg = gemini_service.analyze_document(
        extracted_text,
        document_format=format_label,
        summary_depth=clean_depth
    )
    if not ai_success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=ai_msg
        )

    processing_time = round(time.time() - start_time, 2)

    return {
        "success": True,
        "filename": filename,
        "file_format": format_label,
        "file_size_kb": round(len(content) / 1024, 2),
        "processing_time_seconds": processing_time,
        "summary_depth": clean_depth,
        "metadata": metadata,
        "analysis": analysis_data,
        "extracted_text_preview": extracted_text[:800] + ("..." if len(extracted_text) > 800 else ""),
        "full_text": extracted_text,
        "message": f"Document successfully analyzed in '{clean_depth}' mode."
    }

@router.post("/regenerate")
async def regenerate_summary(req: RegenerateRequest):
    """
    Regenerate summary with a different depth without re-uploading or re-extracting text.
    Reuses the client's cached extracted text.
    """
    start_time = time.time()

    clean_depth = req.summary_depth.lower().strip() if req.summary_depth else "detailed"
    if clean_depth not in VALID_DEPTHS:
        clean_depth = "detailed"

    if not req.extracted_text or len(req.extracted_text.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Extracted text is empty or too short to regenerate summary."
        )

    if not gemini_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API key is not configured in backend/.env."
        )

    ai_success, analysis_data, ai_msg = gemini_service.analyze_document(
        req.extracted_text,
        document_format=req.document_format or "Document",
        summary_depth=clean_depth
    )
    if not ai_success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=ai_msg
        )

    processing_time = round(time.time() - start_time, 2)

    return {
        "success": True,
        "filename": req.filename or "document",
        "file_format": req.document_format,
        "processing_time_seconds": processing_time,
        "summary_depth": clean_depth,
        "analysis": analysis_data,
        "message": f"Summary successfully regenerated in '{clean_depth}' mode."
    }
