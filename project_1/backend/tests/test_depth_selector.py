import io
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app
from app.services.gemini_service import gemini_service, QUICK_SUMMARY_PROMPT, DETAILED_SUMMARY_PROMPT, IN_DEPTH_SUMMARY_PROMPT

client = TestClient(app)

def test_prompt_generation_for_different_depths():
    """Verify distinct prompts are generated for quick, detailed, and in_depth depths."""
    sample_text = "Machine Learning involves training algorithms to learn patterns from data."
    
    # 1. Quick mode
    quick_prompt = gemini_service._get_prompt_for_depth("quick", "Word Document", sample_text)
    assert "QUICK SUMMARY" in quick_prompt
    assert sample_text in quick_prompt

    # 2. Detailed mode (DEFAULT)
    detailed_prompt = gemini_service._get_prompt_for_depth("detailed", "PDF Document", sample_text)
    assert "DETAILED SUMMARY" in detailed_prompt
    assert "topic_breakdown" in detailed_prompt
    assert "real_world_examples" in detailed_prompt
    assert "technical_terms" in detailed_prompt
    assert sample_text in detailed_prompt

    # 3. In-depth mode
    in_depth_prompt = gemini_service._get_prompt_for_depth("in_depth", "Excel Spreadsheet", sample_text)
    assert "IN-DEPTH" in in_depth_prompt
    assert "concept_relationships" in in_depth_prompt
    assert sample_text in in_depth_prompt

def test_validate_and_normalize_detailed_fields():
    """Verify normalization preserves and sets default structures for detailed fields."""
    raw_data = {
        "document_title": "AI in Healthcare",
        "document_type": "Research Report",
        "summary": "This document reviews AI applications in diagnosis.",
        "key_points": ["AI speeds up radiology", "Improves early detection"],
        "topic_breakdown": [
            {"topic": "Radiology", "explanation": "CNNs detect tumors in MRI scans."}
        ],
        "important_concepts": [
            {"concept": "CNN", "simple_explanation": "A type of neural network for image recognition."}
        ],
        "real_world_examples": [
            {"concept": "CNN", "example": "Detecting diabetic retinopathy from retinal photos.", "note": "AI illustration"}
        ],
        "technical_terms": [
            {"term": "CNN", "definition": "Convolutional Neural Network"}
        ],
        "quick_revision_notes": [
            "CNNs excel in medical imaging."
        ]
    }
    
    normalized = gemini_service._validate_and_normalize(raw_data, depth="detailed")
    assert normalized["summary_depth"] == "detailed"
    assert len(normalized["topic_breakdown"]) == 1
    assert len(normalized["important_concepts"]) == 1
    assert len(normalized["real_world_examples"]) == 1
    assert len(normalized["technical_terms"]) == 1
    assert len(normalized["quick_revision_notes"]) == 1

def test_regenerate_endpoint_validation():
    """Verify /api/regenerate validates input parameters properly."""
    # Test 1: Empty extracted text should fail with 400
    res = client.post("/api/regenerate", json={
        "extracted_text": "",
        "summary_depth": "detailed",
        "document_format": "PDF"
    })
    assert res.status_code == 400
    assert "empty or too short" in res.json()["detail"]

    # Test 2: Text too short should fail with 400
    res = client.post("/api/regenerate", json={
        "extracted_text": "short",
        "summary_depth": "quick",
        "document_format": "PDF"
    })
    assert res.status_code == 400

@patch.object(gemini_service, "analyze_document")
@patch.object(gemini_service, "is_configured", return_value=True)
def test_regenerate_endpoint_success(mock_configured, mock_analyze):
    """Verify /api/regenerate returns regenerated analysis without re-uploading file."""
    mock_analyze.return_value = (
        True,
        {
            "document_title": "Regenerated Document",
            "document_type": "Technical Guide",
            "summary_depth": "quick",
            "summary": "Quick high-level summary.",
            "key_points": ["Point 1", "Point 2"],
            "important_dates": [],
            "people_and_organizations": [],
            "important_numbers": [],
            "conclusions": "Conclusion"
        },
        "Success"
    )

    res = client.post("/api/regenerate", json={
        "extracted_text": "This is a comprehensive document with sufficient text length for analyzing concepts.",
        "summary_depth": "quick",
        "document_format": "PDF",
        "filename": "sample.pdf"
    })

    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["summary_depth"] == "quick"
    assert data["filename"] == "sample.pdf"
    assert data["analysis"]["document_title"] == "Regenerated Document"
    assert mock_analyze.called
    args, kwargs = mock_analyze.call_args
    assert kwargs["summary_depth"] == "quick"

@patch.object(gemini_service, "analyze_document")
@patch.object(gemini_service, "is_configured", return_value=True)
def test_analyze_endpoint_with_depth_selection(mock_configured, mock_analyze):
    """Verify /api/analyze passes selected summary_depth to Gemini service."""
    mock_analyze.return_value = (
        True,
        {
            "document_title": "Sample Doc",
            "document_type": "Report",
            "summary_depth": "in_depth",
            "summary": "In-depth summary text",
            "key_points": [],
            "important_dates": [],
            "people_and_organizations": [],
            "important_numbers": [],
            "conclusions": ""
        },
        "Success"
    )

    file_content = b"This is a sample document for testing the depth selector parameter in FastAPI."
    res = client.post(
        "/api/analyze",
        data={"summary_depth": "in_depth"},
        files={"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    )

    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["summary_depth"] == "in_depth"
    args, kwargs = mock_analyze.call_args
    assert kwargs["summary_depth"] == "in_depth"
