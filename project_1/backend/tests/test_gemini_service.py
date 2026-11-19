import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.gemini_service import gemini_service

def test_validate_and_normalize_full_data():
    raw_data = {
        "document_title": "Deep Learning Survey",
        "document_type": "Research Paper",
        "summary": "This paper reviews deep learning advances.",
        "key_points": ["Neural networks excel at vision", "Transformers dominate NLP"],
        "important_dates": [{"date": "2026-01-01", "description": "Release date"}],
        "people_and_organizations": [{"name": "Geoffrey Hinton", "type": "Person", "role": "Researcher"}],
        "important_numbers": [{"value": "99.2%", "context": "Accuracy on ImageNet"}],
        "conclusions": "Deep learning will continue to grow."
    }

    normalized = gemini_service._validate_and_normalize(raw_data)
    assert normalized["document_title"] == "Deep Learning Survey"
    assert normalized["document_type"] == "Research Paper"
    assert len(normalized["key_points"]) == 2
    assert normalized["important_dates"][0]["date"] == "2026-01-01"
    assert normalized["people_and_organizations"][0]["name"] == "Geoffrey Hinton"
    assert normalized["important_numbers"][0]["value"] == "99.2%"
    assert "grow" in normalized["conclusions"]

def test_validate_and_normalize_missing_or_partial_data():
    raw_data = {
        "summary": "Partial document.",
    }

    normalized = gemini_service._validate_and_normalize(raw_data)
    assert normalized["document_title"] == "Untitled Document"
    assert normalized["document_type"] == "General Document"
    assert normalized["key_points"] == []
    assert normalized["important_dates"] == []
    assert normalized["people_and_organizations"] == []
    assert normalized["important_numbers"] == []
    assert normalized["conclusions"] == ""
