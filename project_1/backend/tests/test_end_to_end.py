import io
import sys
from pathlib import Path
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app
from app.services.gemini_service import gemini_service

client = TestClient(app)

def test_analyze_endpoint_end_to_end_mocked_gemini(monkeypatch):
    """
    Test complete analyze pipeline:
    Uploads a real digital PDF, extracts text with PyMuPDF,
    simulates Gemini returning valid structured JSON,
    and checks the full response payload matching frontend expectations.
    """
    # 1. Prepare valid PDF bytes
    import fitz
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text(
        (50, 72),
        "PROJECT SPECIFICATION: Intelligent Document Analyzer. Authors: Priya and Alex. Date: 2026-11-18. "
        "Organization: NIT AI Lab. The project budget is 1500 USD with 94.6% accuracy."
    )
    pdf_bytes = doc.tobytes()
    doc.close()

    # 2. Mock Gemini service is_configured and analyze_document
    monkeypatch.setattr(gemini_service, "is_configured", lambda: True)
    
    mock_ai_output = {
        "document_title": "Intelligent Document Analyzer Specification",
        "document_type": "Project Specification",
        "summary": "This document outlines the technical specification for the Intelligent Document Analyzer project.",
        "key_points": [
            "Combines PyMuPDF with Gemini AI for document intelligence",
            "Achieves 94.6% accuracy with budget of 1500 USD"
        ],
        "important_dates": [
            {"date": "2026-11-18", "description": "Document creation and analysis date"}
        ],
        "people_and_organizations": [
            {"name": "Priya", "type": "Person", "role": "Author"},
            {"name": "NIT AI Lab", "type": "Organization", "role": "Research Department"}
        ],
        "important_numbers": [
            {"value": "94.6%", "context": "Accuracy metric"},
            {"value": "1500 USD", "context": "Estimated project budget"}
        ],
        "conclusions": "The system represents a viable, low-cost document parsing architecture."
    }

    monkeypatch.setattr(
        gemini_service,
        "analyze_document",
        lambda text, *args, **kwargs: (True, mock_ai_output, "Success")
    )

    # 3. Call POST /api/analyze
    response = client.post(
        "/api/analyze",
        files={"file": ("project_spec.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["filename"] == "project_spec.pdf"
    assert data["metadata"]["extraction_method"] == "PyMuPDF"
    assert "analysis" in data
    analysis = data["analysis"]
    assert analysis["document_title"] == "Intelligent Document Analyzer Specification"
    assert analysis["document_type"] == "Project Specification"
    assert len(analysis["key_points"]) == 2
    assert len(analysis["important_dates"]) == 1
    assert len(analysis["people_and_organizations"]) == 2
    assert len(analysis["important_numbers"]) == 2
    assert "conclusions" in analysis
    assert "full_text" in data
