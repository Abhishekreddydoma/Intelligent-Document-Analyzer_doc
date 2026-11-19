# DocuMind AI
> **Multi-Format AI Document Understanding Platform with Sunset Orange Minimal Neumorphism**  
> *Built with React 19, FastAPI, PyMuPDF, python-docx, openpyxl, python-pptx, Google Gemini API & Document AI OCR.*

---

## 📌 Project Overview
**DocuMind AI** (Intelligent Document Analyzer) is an AI web application that allows users to upload documents across **6 supported file formats**, extract high-fidelity structured text and tabular data, generate customizable AI summaries with depth control, and pinpoint critical details (key points, important dates, individuals, organizations, and numerical metrics) using **Google Gemini AI** and **Google Document AI OCR**.

### Supported File Formats

| Format | Extension | Extractor Library | Extraction Capabilities |
| :--- | :--- | :--- | :--- |
| **PDF Documents** | `.pdf` | **PyMuPDF (`fitz`)** + **Document AI** | Digital text streams, page count; automated OCR for scanned images |
| **Word Documents** | `.docx` | **python-docx** | Formatted paragraphs, headings (H1/H2/H3), and structured table cells |
| **Excel Spreadsheets** | `.xlsx` | **openpyxl** | Multi-sheet parsing, column headers, cell values, and financial tables |
| **PowerPoint Decks** | `.pptx` | **python-pptx** | Slide-by-slide titles, text frames, bullet points, and presentation structure |
| **Plain Text** | `.txt` | **Python Native I/O** | Multi-encoding decoding (UTF-8, UTF-8-SIG, Latin-1, CP1252) |
| **CSV Data Files** | `.csv` | **Python csv module** | Automatic delimiter detection (comma, tab, semicolon), column summaries |

---

## 🧠 Summary Depth Selector (New Feature)

Users can select the depth of AI analysis either before uploading or regenerate instantly without re-uploading:

| Mode | Identifier | Description | Generated Sections |
| :--- | :--- | :--- | :--- |
| **Quick Summary** | `quick` | Concise high-level summary for rapid reading | Title, Type, Summary, Key Points, Dates, Entities, Numbers, Conclusions |
| **Detailed Summary** *(DEFAULT)* | `detailed` | Teacher-style beginner-friendly explanation | Introduction, Main Purpose, Detailed Explanation, Topic-by-Topic Breakdown, Concepts Explained, Real-World Examples (AI-labeled), Technical Terms Glossary, Key Takeaways, Dates, Entities, Metrics, Conclusions, Quick Revision Notes |
| **In-Depth Explanation** | `in_depth` | Rigorous, comprehensive technical synthesis | Everything in Detailed mode plus **Concept Interrelationships**, theoretical context, and advanced synthesis |

### 🔄 Instant Summary Regeneration
- Change the summary depth mode directly from the results view.
- Re-analyzes using client-cached extracted text via `POST /api/regenerate`.
- **Zero re-upload required**, saving time and bandwidth.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide React icons, Sunset Orange + Minimal Neumorphism theme, JavaScript (ES Modules) |
| **Backend** | Python 3.12, FastAPI, Uvicorn, Pydantic, python-multipart |
| **Extraction Engines** | PyMuPDF, python-docx, openpyxl, python-pptx, csv parser |
| **AI & OCR** | Google Gemini API (`gemini-3.1-flash-lite`, fallback to `gemini-3.5-flash`), Google Document AI OCR |
| **Testing** | Pytest, HTTPX, FastAPI TestClient (18 automated unit & integration tests) |

---

## 📂 Project Structure

```text
Intelligent-Document-Analyzer/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Top navigation with live backend status badge
│   │   │   ├── Footer.jsx          # Clean footer with platform info
│   │   │   └── AnalysisResult.jsx  # Multi-format result cards, depth switcher & report download
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Hero section, 6-format features & workflow guide
│   │   │   ├── Analyze.jsx         # Universal uploader with "Choose Summary Depth" selector
│   │   │   └── About.jsx           # Architecture flowchart and technology breakdown
│   │   ├── services/
│   │   │   └── api.js              # REST client with analyzeDocument & regenerateSummary
│   │   ├── App.jsx                 # Page routing and backend health monitoring
│   │   ├── main.jsx                # React DOM entrypoint
│   │   └── index.css               # Clean styling (white background & light-blue accents)
│   ├── package.json
│   └── vite.config.js              # Vite server with API proxy to port 8000
│
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── health.py           # GET /api/health (reports supported formats)
│   │   │   └── analyze.py          # POST /api/analyze, POST /api/regenerate & POST /api/extract-text
│   │   ├── services/
│   │   │   ├── document_extractor_service.py # Universal extractor for all 6 formats
│   │   │   ├── pdf_service.py      # Dedicated PDF parser & scanned PDF detector
│   │   │   ├── gemini_service.py   # Multi-depth prompts, fallback cascade & JSON normalizer
│   │   │   └── documentai_service.py # Google Cloud Document AI OCR service
│   │   ├── config.py               # Settings loader and file size limits
│   │   └── main.py                 # FastAPI application with CORS enabled
│   ├── tests/
│   │   ├── test_depth_selector.py  # Tests for quick, detailed, in_depth prompts & /api/regenerate
│   │   ├── test_api.py             # Health and upload validation tests
│   │   ├── test_multi_format.py    # Dedicated tests for PDF, DOCX, XLSX, PPTX, TXT, CSV
│   │   ├── test_gemini_service.py  # JSON schema normalization tests
│   │   └── test_end_to_end.py      # Full pipeline test
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example                # Configuration template
│   └── .env                        # Local configuration file
│
├── sample_test.docx                # Sample Word document for testing
├── sample_test.xlsx                # Sample Excel spreadsheet for testing
├── sample_test.pptx                # Sample PowerPoint presentation for testing
├── sample_test.txt                 # Sample plain text file for testing
├── sample_test.csv                 # Sample CSV dataset for testing
├── test_sample_digital.pdf         # Sample digital PDF for testing
├── test_sample_scanned.pdf         # Sample scanned/blank PDF for testing
└── README.md
```

---

## ⚙️ Configuration & Environment Setup

Open `backend/.env` to configure your keys:

```env
# 1. Google Gemini API (Required for AI Summarization & Analysis)
# Get a free key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=AIzaSy...your_actual_key_here...
GEMINI_MODEL=gemini-3.1-flash-lite

# 2. Google Cloud Document AI OCR (Optional - only needed for scanned/image PDFs)
# Normal PDFs, Word, Excel, PPTX, TXT, and CSV do NOT require Google Cloud.
GCP_PROJECT_ID=
GCP_LOCATION=us
DOCUMENTAI_PROCESSOR_ID=
GOOGLE_APPLICATION_CREDENTIALS=
```

---

## 🚀 How to Run the Application

### Step 1: Start the FastAPI Backend
```powershell
& "C:\Users\blued\AppData\Local\Programs\Python\Python312\python.exe" -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```
- API is live at: `http://127.0.0.1:8000`
- Interactive Swagger Documentation: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/health`

### Step 2: Start the React Frontend
```powershell
cd frontend
npm run dev
```
- Web Application is live at: `http://localhost:5173`

---

## 🧪 Automated Testing

Run the full pytest suite (18 automated tests across all formats and summary depths):

```powershell
& "C:\Users\blued\AppData\Local\Programs\Python\Python312\python.exe" -m pytest backend/tests/ -v
```

### Tests Covered:
1. `test_health_endpoint`: Verifies API operational status and supported formats list.
2. `test_extract_text_valid_pdf`: Confirms PyMuPDF text extraction.
3. `test_extract_text_scanned_pdf_without_ocr`: Verifies scanned PDF OCR detection.
4. `test_invalid_file_extension`: Rejects unsupported formats with HTTP 400.
5. `test_empty_file`: Rejects 0-byte uploads with HTTP 400.
6. `test_prompt_generation_for_different_depths`: Validates distinct prompts for quick, detailed, and in-depth.
7. `test_validate_and_normalize_detailed_fields`: Verifies parsing of detailed structures.
8. `test_regenerate_endpoint_validation`: Validates `/api/regenerate` input rules.
9. `test_regenerate_endpoint_success`: Confirms summary regeneration without re-uploading file.
10. `test_analyze_endpoint_with_depth_selection`: Tests `/api/analyze` passing selected depth.
11. `test_analyze_endpoint_end_to_end_mocked_gemini`: Verifies full request-to-response pipeline.
12. `test_validate_and_normalize_full_data`: Validates full structured JSON schema.
13. `test_validate_and_normalize_missing_or_partial_data`: Validates schema normalization.
14. `test_extract_text_all_formats`: Tests extraction across PDF, DOCX, XLSX, PPTX, TXT, and CSV.
15. `test_unsupported_file_extension`: Tests rejection of non-supported formats.
16. `test_analyze_docx_end_to_end`: Tests full Word document AI analysis.
17. `test_analyze_xlsx_end_to_end`: Tests full Excel spreadsheet AI analysis.
18. `test_analyze_csv_end_to_end`: Tests full CSV dataset AI analysis.
