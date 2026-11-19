/**
 * API service to communicate with the FastAPI backend.
 */

const API_BASE = '/api';

/**
 * Check the backend health and configuration status.
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to connect to backend:', error);
    return {
      status: 'offline',
      service: 'Intelligent Document Analyzer',
      error: error.message,
      features: {
        pymupdf_installed: false,
        gemini_api_configured: false,
        documentai_configured: false,
      },
    };
  }
}

/**
 * Upload and analyze a document with selected summary depth.
 * @param {File} file - Document file object
 * @param {string} summaryDepth - 'quick', 'detailed', or 'in_depth'
 * @returns {Promise<Object>} Analysis result object
 */
export async function analyzeDocument(file, summaryDepth = 'detailed') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('summary_depth', summaryDepth);

  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || `Server error (${response.status}): Analysis failed.`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Regenerate summary for already extracted text without re-uploading file.
 * @param {Object} params - { extracted_text, summary_depth, document_format, filename }
 */
export async function regenerateSummary({ extracted_text, summary_depth, document_format, filename }) {
  const response = await fetch(`${API_BASE}/regenerate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      extracted_text,
      summary_depth,
      document_format,
      filename,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || `Regeneration failed (${response.status}).`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Extract raw text only from document without AI.
 * @param {File} file - Document file object
 */
export async function extractTextOnly(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/extract-text`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || `Text extraction failed (${response.status}).`;
    throw new Error(errorMsg);
  }

  return data;
}
