import io
import sys
from pathlib import Path
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app
from app.services.document_extractor_service import document_extractor
from app.services.gemini_service import gemini_service

client = TestClient(app)

def test_extract_text_all_formats():
    """Verify POST /api/extract-text works for all supported formats."""
    test_files = [
        ("test_sample_digital.pdf", "application/pdf"),
        ("sample_test.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        ("sample_test.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        ("sample_test.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
        ("sample_test.txt", "text/plain"),
        ("sample_test.csv", "text/csv"),
    ]

    for fname, mime in test_files:
        with open(fname, "rb") as f:
            content = f.read()
        response = client.post(
            "/api/extract-text",
            files={"file": (fname, io.BytesIO(content), mime)}
        )
        assert response.status_code == 200, f"Failed for {fname}: {response.text}"
        data = response.json()
        assert data["success"] is True
        assert len(data["extracted_text"]) > 10

def test_unsupported_file_extension():
    """Verify unsupported formats return 400 error."""
    response = client.post(
        "/api/extract-text",
        files={"file": ("archive.zip", io.BytesIO(b"fake zip content"), "application/zip")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]

def test_analyze_docx_end_to_end():
    """Verify analyzing a DOCX file returns full structured JSON."""
    with open("sample_test.docx", "rb") as f:
        content = f.read()
    response = client.post(
        "/api/analyze",
        files={"file": ("sample_test.docx", io.BytesIO(content), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    )
    assert response.status_code == 200, f"Analyze DOCX failed: {response.text}"
    data = response.json()
    assert data["success"] is True
    assert data["file_format"] == "DOCX"
    assert "analysis" in data
    analysis = data["analysis"]
    assert "document_title" in analysis
    assert "summary" in analysis
    assert len(analysis["key_points"]) > 0

def test_analyze_xlsx_end_to_end():
    """Verify analyzing an XLSX file returns full structured JSON."""
    with open("sample_test.xlsx", "rb") as f:
        content = f.read()
    response = client.post(
        "/api/analyze",
        files={"file": ("sample_test.xlsx", io.BytesIO(content), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    )
    assert response.status_code == 200, f"Analyze XLSX failed: {response.text}"
    data = response.json()
    assert data["success"] is True
    assert data["file_format"] == "XLSX"
    assert "analysis" in data

def test_analyze_csv_end_to_end():
    """Verify analyzing a CSV file returns full structured JSON."""
    with open("sample_test.csv", "rb") as f:
        content = f.read()
    response = client.post(
        "/api/analyze",
        files={"file": ("sample_test.csv", io.BytesIO(content), "text/csv")}
    )
    assert response.status_code == 200, f"Analyze CSV failed: {response.text}"
    data = response.json()
    assert data["success"] is True
    assert data["file_format"] == "CSV"
    assert "analysis" in data
