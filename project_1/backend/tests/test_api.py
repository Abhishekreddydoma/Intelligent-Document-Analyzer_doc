import io
import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app

client = TestClient(app)

def test_health_endpoint():
    """Verify health check endpoint returns 200 and feature flags."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "pymupdf_installed" in data["features"]
    assert "gemini_api_configured" in data["features"]
    assert "documentai_configured" in data["features"]

def test_extract_text_valid_pdf():
    """Verify PyMuPDF extraction works for normal text PDF."""
    import fitz
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), "This is a test digital document with enough characters to pass the minimum text threshold of fifty characters for verification.")
    pdf_bytes = doc.tobytes()
    doc.close()

    response = client.post(
        "/api/extract-text",
        files={"file": ("test.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "extracted_text" in data
    assert data["metadata"]["extraction_method"] == "PyMuPDF"
    assert data["metadata"]["is_scanned"] is False

def test_extract_text_scanned_pdf_without_ocr():
    """Verify scanned PDF returns informative 422 error when OCR is not configured."""
    import fitz
    doc = fitz.open()
    doc.new_page()  # Blank page without text layer
    pdf_bytes = doc.tobytes()
    doc.close()

    response = client.post(
        "/api/extract-text",
        files={"file": ("scanned.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    # Scanned PDF without text and without OCR configured should return 422 with explanation
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert "Scanned PDF Detected" in data["detail"] or "Document AI" in data["detail"]

def test_invalid_file_extension():
    """Verify uploading an unsupported file format returns 400 error."""
    response = client.post(
        "/api/extract-text",
        files={"file": ("test.exe", io.BytesIO(b"binary executable data"), "application/octet-stream")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]

def test_empty_file():
    """Verify uploading an empty file returns 400 error."""
    response = client.post(
        "/api/extract-text",
        files={"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()
