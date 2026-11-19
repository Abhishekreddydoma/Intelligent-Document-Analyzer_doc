import os
from typing import Tuple
from app.config import settings

class DocumentAIService:
    """Service to handle Google Cloud Document AI OCR for scanned/image PDFs."""
    
    def __init__(self):
        self.project_id = settings.GCP_PROJECT_ID
        self.location = settings.GCP_LOCATION
        self.processor_id = settings.DOCUMENTAI_PROCESSOR_ID
        self.credentials_path = settings.GOOGLE_APPLICATION_CREDENTIALS

    def is_configured(self) -> bool:
        """Check if all required Google Cloud Document AI variables are provided."""
        return bool(self.project_id and self.processor_id)

    def extract_text_with_ocr(self, pdf_bytes: bytes) -> Tuple[bool, str, str]:
        """
        Process a scanned PDF using Google Cloud Document AI.
        Returns: (success: bool, extracted_text: str, message: str)
        """
        if not self.is_configured():
            msg = (
                "Google Cloud Document AI is not configured. "
                "This document appears to be a scanned image or contains no digital text. "
                "To enable OCR for scanned PDFs, configure GCP_PROJECT_ID, DOCUMENTAI_PROCESSOR_ID, "
                "and GOOGLE_APPLICATION_CREDENTIALS in backend/.env."
            )
            return False, "", msg

        try:
            from google.cloud import documentai
            from google.api_core.client_options import ClientOptions

            # Set environment variable for service account if provided
            if self.credentials_path and os.path.exists(self.credentials_path):
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = self.credentials_path

            # Document AI endpoint depends on region
            endpoint = f"{self.location}-documentai.googleapis.com"
            client_options = ClientOptions(api_endpoint=endpoint)
            client = documentai.DocumentProcessorServiceClient(client_options=client_options)

            # Build full processor path: projects/{project}/locations/{location}/processors/{processor}
            resource_name = client.processor_path(self.project_id, self.location, self.processor_id)

            raw_document = documentai.RawDocument(
                content=pdf_bytes,
                mime_type="application/pdf"
            )

            request = documentai.ProcessRequest(
                name=resource_name,
                raw_document=raw_document
            )

            response = client.process_document(request=request)
            document = response.document

            extracted_text = document.text or ""
            if not extracted_text.strip():
                return False, "", "Document AI OCR processed the file but found no readable text."

            return True, extracted_text, "Successfully extracted text using Google Document AI OCR."

        except Exception as e:
            error_msg = f"Document AI OCR processing error: {str(e)}"
            return False, "", error_msg

documentai_service = DocumentAIService()
