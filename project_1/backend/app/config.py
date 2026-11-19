import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory for backend
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env initially
load_dotenv(BASE_DIR / ".env")

class Settings:
    PROJECT_NAME: str = "Intelligent Document Analyzer"
    VERSION: str = "1.0.0"
    
    @property
    def GEMINI_API_KEY(self) -> str:
        # Auto-reload .env so edits take effect immediately
        load_dotenv(BASE_DIR / ".env", override=True)
        return os.getenv("GEMINI_API_KEY", "").strip()
    
    @property
    def GEMINI_MODEL(self) -> str:
        load_dotenv(BASE_DIR / ".env", override=True)
        return os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
    
    @property
    def GCP_PROJECT_ID(self) -> str:
        load_dotenv(BASE_DIR / ".env", override=True)
        return os.getenv("GCP_PROJECT_ID", "").strip()
        
    @property
    def GCP_LOCATION(self) -> str:
        load_dotenv(BASE_DIR / ".env", override=True)
        return os.getenv("GCP_LOCATION", "us").strip()
        
    @property
    def DOCUMENTAI_PROCESSOR_ID(self) -> str:
        load_dotenv(BASE_DIR / ".env", override=True)
        return os.getenv("DOCUMENTAI_PROCESSOR_ID", "").strip()
        
    @property
    def GOOGLE_APPLICATION_CREDENTIALS(self) -> str:
        load_dotenv(BASE_DIR / ".env", override=True)
        return os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    
    # Server & Upload Limits
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
    MAX_FILE_SIZE_BYTES: int = MAX_FILE_SIZE_MB * 1024 * 1024
    
    # Temporary files directory
    TEMP_DIR: Path = BASE_DIR / "temp"
    
    @property
    def is_gemini_configured(self) -> bool:
        key = self.GEMINI_API_KEY
        return bool(key and key != "your_gemini_api_key_here")
        
    @property
    def is_documentai_configured(self) -> bool:
        return bool(self.GCP_PROJECT_ID and self.DOCUMENTAI_PROCESSOR_ID)

settings = Settings()

# Ensure temp directory exists
settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)
