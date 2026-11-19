import io
import csv
import logging
from pathlib import Path
from typing import Dict, Any, Tuple
from app.config import settings
from app.services.documentai_service import documentai_service

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {
    ".pdf": "PDF Document",
    ".docx": "Word Document",
    ".txt": "Plain Text File",
    ".xlsx": "Excel Spreadsheet",
    ".pptx": "PowerPoint Presentation",
    ".csv": "CSV Data File",
}

class DocumentExtractorService:
    """Service to automatically identify document format and extract structured text."""

    def __init__(self):
        self.min_pdf_text_length = 50

    def get_supported_formats(self) -> Dict[str, str]:
        return SUPPORTED_EXTENSIONS

    def validate_document(self, filename: str, file_bytes: bytes) -> Tuple[bool, str, str]:
        """
        Validate file extension and size.
        Returns: (is_valid: bool, file_ext: str, error_message: str)
        """
        if not filename:
            return False, "", "Filename is missing."

        ext = Path(filename).suffix.lower()
        if ext not in SUPPORTED_EXTENSIONS:
            supported_list = ", ".join([e.upper()[1:] for e in SUPPORTED_EXTENSIONS.keys()])
            return False, ext, f"Unsupported file format '{ext}'. Supported formats: {supported_list}."

        if not file_bytes or len(file_bytes) == 0:
            return False, ext, "Uploaded file is empty (0 bytes)."

        if len(file_bytes) > settings.MAX_FILE_SIZE_BYTES:
            max_mb = settings.MAX_FILE_SIZE_MB
            return False, ext, f"File exceeds maximum allowed size of {max_mb} MB."

        # Quick magic header checks for binary formats
        if ext == ".pdf" and not file_bytes.startswith(b"%PDF-"):
            return False, ext, "Corrupted or invalid PDF document (missing %PDF- header)."

        if ext in [".docx", ".xlsx", ".pptx"] and not file_bytes.startswith(b"PK\x03\x04"):
            return False, ext, f"Corrupted or invalid Office document format ({ext.upper()})."

        return True, ext, "Valid document."

    def extract(self, filename: str, file_bytes: bytes) -> Tuple[bool, str, Dict[str, Any], str]:
        """
        Main extraction entrypoint. Automatically delegates to the appropriate extractor.
        Returns: (success: bool, text: str, metadata: dict, message: str)
        """
        ext = Path(filename).suffix.lower()

        if ext == ".pdf":
            return self._extract_pdf(file_bytes)
        elif ext == ".docx":
            return self._extract_docx(file_bytes)
        elif ext == ".txt":
            return self._extract_txt(file_bytes)
        elif ext == ".xlsx":
            return self._extract_xlsx(file_bytes)
        elif ext == ".pptx":
            return self._extract_pptx(file_bytes)
        elif ext == ".csv":
            return self._extract_csv(file_bytes)
        else:
            return False, "", {}, f"Unsupported document extension: {ext}"

    # -------------------------------------------------------------
    # 1. PDF Extraction (PyMuPDF + Document AI OCR fallback)
    # -------------------------------------------------------------
    def _extract_pdf(self, file_bytes: bytes) -> Tuple[bool, str, Dict[str, Any], str]:
        metadata = {
            "format": "PDF",
            "page_count": 0,
            "extraction_method": "PyMuPDF",
            "is_scanned": False,
            "char_count": 0,
            "word_count": 0,
        }

        extracted_text = ""
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            metadata["page_count"] = len(doc)
            pages = []
            for i in range(len(doc)):
                t = doc[i].get_text()
                if t:
                    pages.append(t)
            extracted_text = "\n\n".join(pages).strip()
            doc.close()
        except Exception as e:
            logger.error(f"PyMuPDF error: {e}")
            return False, "", metadata, f"Failed to parse PDF document: {str(e)}"

        metadata["char_count"] = len(extracted_text)
        metadata["word_count"] = len(extracted_text.split()) if extracted_text else 0

        # Check if text is sufficient or scanned
        if len(extracted_text.strip()) >= self.min_pdf_text_length:
            return True, extracted_text, metadata, "Successfully extracted text using PyMuPDF."

        # Scanned PDF detected
        metadata["is_scanned"] = True
        logger.info("PDF contains insufficient text (<50 chars). Checking Document AI OCR...")

        if documentai_service.is_configured():
            metadata["extraction_method"] = "Google Document AI OCR"
            ocr_ok, ocr_text, ocr_msg = documentai_service.extract_text_with_ocr(file_bytes)
            if ocr_ok:
                metadata["char_count"] = len(ocr_text)
                metadata["word_count"] = len(ocr_text.split()) if ocr_text else 0
                return True, ocr_text, metadata, ocr_msg
            return False, "", metadata, ocr_msg
        else:
            metadata["extraction_method"] = "PyMuPDF (No OCR configured)"
            msg = (
                "Scanned PDF Detected: The document contains scanned images or lacks digital text. "
                "Google Document AI OCR is required to extract text from scanned files, but is not configured in backend/.env. "
                "Please configure Google Cloud Document AI credentials or upload a standard readable PDF."
            )
            return False, "", metadata, msg

    # -------------------------------------------------------------
    # 2. Word Document (.docx) Extraction
    # -------------------------------------------------------------
    def _extract_docx(self, file_bytes: bytes) -> Tuple[bool, str, Dict[str, Any], str]:
        metadata = {
            "format": "DOCX",
            "paragraph_count": 0,
            "table_count": 0,
            "extraction_method": "python-docx",
            "char_count": 0,
            "word_count": 0,
        }

        try:
            import docx
            doc = docx.Document(io.BytesIO(file_bytes))
            sections_text = []

            # Paragraphs & Headings
            for p in doc.paragraphs:
                text = p.text.strip()
                if not text:
                    continue
                style_name = p.style.name if p.style else ""
                if "Heading" in style_name:
                    sections_text.append(f"\n### {text}\n")
                else:
                    sections_text.append(text)

            metadata["paragraph_count"] = len(sections_text)

            # Tables
            for idx, table in enumerate(doc.tables):
                table_lines = [f"\n[Table {idx + 1}]"]
                for row in table.rows:
                    row_cells = [cell.text.strip().replace("\n", " ") for cell in row.cells]
                    if any(row_cells):
                        table_lines.append(" | ".join(row_cells))
                if len(table_lines) > 1:
                    sections_text.append("\n".join(table_lines))

            metadata["table_count"] = len(doc.tables)

            extracted_text = "\n\n".join(sections_text).strip()
            metadata["char_count"] = len(extracted_text)
            metadata["word_count"] = len(extracted_text.split()) if extracted_text else 0

            if not extracted_text:
                return False, "", metadata, "The Word document appears to be empty."

            return True, extracted_text, metadata, "Successfully extracted text from Word document."

        except Exception as e:
            logger.error(f"DOCX extraction error: {e}")
            return False, "", metadata, f"Failed to extract Word document: {str(e)}"

    # -------------------------------------------------------------
    # 3. Plain Text (.txt) Extraction
    # -------------------------------------------------------------
    def _extract_txt(self, file_bytes: bytes) -> Tuple[bool, str, Dict[str, Any], str]:
        metadata = {
            "format": "TXT",
            "line_count": 0,
            "extraction_method": "Text File Parser",
            "char_count": 0,
            "word_count": 0,
        }

        # Try multiple encodings
        encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
        extracted_text = ""
        for enc in encodings:
            try:
                extracted_text = file_bytes.decode(enc).strip()
                break
            except UnicodeDecodeError:
                continue

        if not extracted_text:
            return False, "", metadata, "Text file is empty or could not be decoded."

        metadata["line_count"] = len(extracted_text.splitlines())
        metadata["char_count"] = len(extracted_text)
        metadata["word_count"] = len(extracted_text.split())

        return True, extracted_text, metadata, "Successfully extracted plain text."

    # -------------------------------------------------------------
    # 4. Excel Spreadsheet (.xlsx) Extraction
    # -------------------------------------------------------------
    def _extract_xlsx(self, file_bytes: bytes) -> Tuple[bool, str, Dict[str, Any], str]:
        metadata = {
            "format": "XLSX",
            "sheet_count": 0,
            "sheet_names": [],
            "extraction_method": "openpyxl",
            "char_count": 0,
            "word_count": 0,
        }

        try:
            import openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
            metadata["sheet_count"] = len(wb.sheetnames)
            metadata["sheet_names"] = wb.sheetnames

            sheets_output = []
            for sheetname in wb.sheetnames:
                ws = wb[sheetname]
                sheet_lines = [f"=== Sheet: {sheetname} ==="]
                row_count = 0

                for row in ws.iter_rows(values_only=True):
                    # Filter out completely None/empty rows
                    non_empty = [str(val).strip() for val in row if val is not None and str(val).strip()]
                    if non_empty:
                        sheet_lines.append(" | ".join(non_empty))
                        row_count += 1
                        if row_count >= 150:  # Sample up to 150 rows per sheet to prevent overflow
                            sheet_lines.append(f"... (truncated after 150 rows in sheet '{sheetname}')")
                            break

                if len(sheet_lines) > 1:
                    sheets_output.append("\n".join(sheet_lines))

            extracted_text = "\n\n".join(sheets_output).strip()
            metadata["char_count"] = len(extracted_text)
            metadata["word_count"] = len(extracted_text.split()) if extracted_text else 0

            if not extracted_text:
                return False, "", metadata, "The Excel spreadsheet contains no readable text or data."

            return True, extracted_text, metadata, f"Successfully extracted data from {len(wb.sheetnames)} sheet(s)."

        except Exception as e:
            logger.error(f"XLSX extraction error: {e}")
            return False, "", metadata, f"Failed to extract Excel spreadsheet: {str(e)}"

    # -------------------------------------------------------------
    # 5. PowerPoint Presentation (.pptx) Extraction
    # -------------------------------------------------------------
    def _extract_pptx(self, file_bytes: bytes) -> Tuple[bool, str, Dict[str, Any], str]:
        metadata = {
            "format": "PPTX",
            "slide_count": 0,
            "extraction_method": "python-pptx",
            "char_count": 0,
            "word_count": 0,
        }

        try:
            import pptx
            prs = pptx.Presentation(io.BytesIO(file_bytes))
            metadata["slide_count"] = len(prs.slides)

            slides_output = []
            for idx, slide in enumerate(prs.slides):
                slide_num = idx + 1
                slide_title = ""
                slide_bullets = []

                for shape in slide.shapes:
                    if not shape.has_text_frame:
                        continue
                    text = shape.text.strip()
                    if not text:
                        continue

                    # If shape is slide title placeholder
                    if shape == slide.shapes.title:
                        slide_title = text
                    else:
                        for paragraph in shape.text_frame.paragraphs:
                            p_text = paragraph.text.strip()
                            if p_text and p_text != slide_title:
                                slide_bullets.append(f"- {p_text}")

                header = f"=== Slide {slide_num}: {slide_title or 'Untitled Slide'} ==="
                content = "\n".join(slide_bullets) if slide_bullets else "(No bullet points)"
                slides_output.append(f"{header}\n{content}")

            extracted_text = "\n\n".join(slides_output).strip()
            metadata["char_count"] = len(extracted_text)
            metadata["word_count"] = len(extracted_text.split()) if extracted_text else 0

            if not extracted_text:
                return False, "", metadata, "The PowerPoint presentation contains no readable text."

            return True, extracted_text, metadata, f"Successfully extracted {len(prs.slides)} slide(s)."

        except Exception as e:
            logger.error(f"PPTX extraction error: {e}")
            return False, "", metadata, f"Failed to extract PowerPoint presentation: {str(e)}"

    # -------------------------------------------------------------
    # 6. CSV Data (.csv) Extraction
    # -------------------------------------------------------------
    def _extract_csv(self, file_bytes: bytes) -> Tuple[bool, str, Dict[str, Any], str]:
        metadata = {
            "format": "CSV",
            "row_count": 0,
            "column_count": 0,
            "columns": [],
            "extraction_method": "CSV Parser",
            "char_count": 0,
            "word_count": 0,
        }

        try:
            # Decode CSV text
            text_content = ""
            for enc in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
                try:
                    text_content = file_bytes.decode(enc)
                    break
                except UnicodeDecodeError:
                    continue

            if not text_content.strip():
                return False, "", metadata, "CSV file is empty."

            # Sniff delimiter (comma, semicolon, tab)
            delimiter = ","
            try:
                sample = text_content[:2048]
                dialect = csv.Sniffer().sniff(sample)
                delimiter = dialect.delimiter
            except Exception:
                delimiter = ","

            reader = csv.reader(io.StringIO(text_content), delimiter=delimiter)
            rows = list(reader)

            if not rows:
                return False, "", metadata, "CSV file has no data rows."

            headers = [h.strip() for h in rows[0]]
            metadata["columns"] = headers
            metadata["column_count"] = len(headers)
            metadata["row_count"] = max(0, len(rows) - 1)

            csv_lines = [
                f"CSV Columns ({len(headers)}): {', '.join(headers)}",
                f"Total Data Rows: {len(rows) - 1}",
                "\n--- Sample Data Preview (First 50 Rows) ---",
                " | ".join(headers)
            ]

            # Append up to 50 sample rows
            for row in rows[1:51]:
                clean_row = [c.strip() for c in row]
                csv_lines.append(" | ".join(clean_row))

            if len(rows) > 51:
                csv_lines.append(f"... and {len(rows) - 51} more rows.")

            extracted_text = "\n".join(csv_lines).strip()
            metadata["char_count"] = len(extracted_text)
            metadata["word_count"] = len(extracted_text.split()) if extracted_text else 0

            return True, extracted_text, metadata, f"Successfully parsed CSV with {len(rows)-1} row(s) and {len(headers)} column(s)."

        except Exception as e:
            logger.error(f"CSV extraction error: {e}")
            return False, "", metadata, f"Failed to parse CSV file: {str(e)}"

document_extractor = DocumentExtractorService()
