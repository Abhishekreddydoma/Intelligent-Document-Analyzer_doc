from fastapi import APIRouter
from app.config import settings
from app.services.gemini_service import gemini_service
from app.services.documentai_service import documentai_service

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health")
def health_check():
    """Health check endpoint to verify backend operational state and configuration."""
    formats = ["PDF", "DOCX", "TXT", "XLSX", "PPTX", "CSV"]

    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "supported_formats": formats,
        "features": {
            "pymupdf_installed": True,
            "docx_installed": True,
            "openpyxl_installed": True,
            "pptx_installed": True,
            "gemini_api_configured": gemini_service.is_configured(),
            "documentai_configured": documentai_service.is_configured(),
            "max_file_size_mb": settings.MAX_FILE_SIZE_MB
        }
    }
