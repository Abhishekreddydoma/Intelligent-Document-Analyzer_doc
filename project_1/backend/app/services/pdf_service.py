import io
import logging
from typing import Dict, Any, Tuple
from app.config import settings
from app.services.documentai_service import documentai_service

logger = logging.getLogger(__name__)

class PDFService:
    """Service to handle PDF validation and text extraction using PyMuPDF and Document AI OCR."""

    MIN_TEXT_LENGTH = 50  # Minimum characters to consider a PDF digitally readable

    def validate_pdf(self, filename: str, file_bytes: bytes) -> Tuple[bool, str]:
        """Validate filename, size, and PDF magic header bytes."""
        if not filename or not filename.lower().endswith(".pdf"):
            return False, "Invalid file format. Please upload a file with a .pdf extension."

        if not file_bytes or len(file_bytes) == 0:
            return False, "Uploaded file is empty (0 bytes)."

        if len(file_bytes) > settings.MAX_FILE_SIZE_BYTES:
            max_mb = settings.MAX_FILE_SIZE_MB
            return False, f"File exceeds the maximum allowed size of {max_mb} MB."

        # Verify PDF header magic bytes: %PDF-
        if not file_bytes.startswith(b"%PDF-"):
            return False, "File is not a valid PDF document (missing %PDF- header)."

        return True, "Valid PDF file."

    def extract_text(self, file_bytes: bytes) -> Tuple[bool, str, Dict[str, Any], str]:
        """
        Extract text from PDF.
        Tries PyMuPDF first.
        If extracted text is insufficient (scanned PDF), triggers Google Document AI OCR.
        
        Returns:
            (success: bool, extracted_text: str, metadata: dict, message: str)
        """
        metadata = {
            "page_count": 0,
            "extraction_method": "PyMuPDF",
            "is_scanned": False,
            "char_count": 0,
            "word_count": 0
        }

        extracted_text = ""

        # Step 1: Attempt PyMuPDF extraction
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            metadata["page_count"] = len(doc)

            text_pieces = []
            for page_index in range(len(doc)):
                page = doc[page_index]
                page_text = page.get_text()
                if page_text:
                    text_pieces.append(page_text)

            extracted_text = "\n\n".join(text_pieces).strip()
            doc.close()

        except Exception as e:
            logger.warning(f"PyMuPDF failed, attempting fallback to pypdf: {e}")
            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                metadata["page_count"] = len(reader.pages)
                text_pieces = []
                for p in reader.pages:
                    t = p.extract_text() or ""
                    if t:
                        text_pieces.append(t)
                extracted_text = "\n\n".join(text_pieces).strip()
            except Exception as pe:
                logger.error(f"Both PyMuPDF and pypdf extraction failed: {pe}")
                return False, "", metadata, f"Failed to parse PDF document: {str(pe)}"

        metadata["char_count"] = len(extracted_text)
        metadata["word_count"] = len(extracted_text.split()) if extracted_text else 0

        # Step 2: Check whether text is sufficient
        if len(extracted_text.strip()) >= self.MIN_TEXT_LENGTH:
            return True, extracted_text, metadata, "Successfully extracted digital text using PyMuPDF."

        # Step 3: Text is insufficient -> Scanned PDF detected!
        metadata["is_scanned"] = True
        logger.info("PDF contains insufficient text (<50 chars). Treating as scanned document.")

        # Step 4: Attempt OCR with Google Document AI
        if documentai_service.is_configured():
            metadata["extraction_method"] = "Google Document AI OCR"
            ocr_success, ocr_text, ocr_msg = documentai_service.extract_text_with_ocr(file_bytes)
            if ocr_success:
                metadata["char_count"] = len(ocr_text)
                metadata["word_count"] = len(ocr_text.split()) if ocr_text else 0
                return True, ocr_text, metadata, ocr_msg
            else:
                return False, "", metadata, ocr_msg
        else:
            metadata["extraction_method"] = "PyMuPDF (No OCR available)"
            msg = (
                "Scanned PDF Detected: The uploaded document contains scanned images or lacks digital text. "
                "Google Document AI OCR is required to read scanned documents, but is not configured in backend/.env. "
                "Please configure Google Cloud Document AI credentials (GCP_PROJECT_ID, DOCUMENTAI_PROCESSOR_ID, GOOGLE_APPLICATION_CREDENTIALS) "
                "or upload a standard PDF with digital text."
            )
            return False, "", metadata, msg

pdf_service = PDFService()
