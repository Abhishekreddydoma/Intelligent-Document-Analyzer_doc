import os
import json
import logging
import requests
from typing import Dict, Any, Tuple, List
from app.config import settings

logger = logging.getLogger(__name__)

# Fallback models in case of temporary 503 high-demand spikes
FALLBACK_MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-flash-latest",
]

# -------------------------------------------------------------
# 1. Quick Summary Prompt
# -------------------------------------------------------------
QUICK_SUMMARY_PROMPT = """You are an expert document analysis assistant designed for the "Intelligent Document Analyzer" platform.
Your task is to generate a QUICK, CONCISE SUMMARY of the provided document content.

Document Format: {document_format}
Summary Mode: QUICK SUMMARY (Focus on main ideas, high-level takeaways, short reading time).

Instructions:
1. Explain the main purpose and core message in simple, crisp English.
2. Extract the most critical key points in short bullet points.
3. Extract only verified facts from the document. Do NOT invent facts.
4. Return ONLY a valid JSON object matching this schema:

{
  "document_title": "Clear concise document title",
  "document_type": "e.g., Report, Spreadsheet, Presentation, Contract, Article, etc.",
  "summary_depth": "quick",
  "summary": "A concise 1 to 2 paragraph high-level overview explaining the core idea and main message.",
  "key_points": [
    "Most important takeaway 1",
    "Most important takeaway 2",
    "Most important takeaway 3"
  ],
  "important_dates": [
    {
      "date": "Date phrase or YYYY-MM-DD",
      "description": "What this date refers to"
    }
  ],
  "people_and_organizations": [
    {
      "name": "Name",
      "type": "Person or Organization",
      "role": "Role or context"
    }
  ],
  "important_numbers": [
    {
      "value": "Number/metric/currency",
      "context": "What this number represents"
    }
  ],
  "conclusions": "Brief 1-2 sentence final conclusion or bottom line."
}

Document Content to analyze:
---
{document_text}
---
"""

# -------------------------------------------------------------
# 2. Detailed Summary Prompt (DEFAULT)
# -------------------------------------------------------------
DETAILED_SUMMARY_PROMPT = """You are an expert educator and document analyst designed for the "Intelligent Document Analyzer" platform.
Your task is to create a DETAILED, EDUCATIONAL SUMMARY of the provided document content.

Document Format: {document_format}
Summary Mode: DETAILED SUMMARY (Explain like a skilled teacher explaining to a beginner: clear, structured, step-by-step, with real-world examples and definitions).

Format-Specific Guidance:
- If Excel (.xlsx) or CSV (.csv): Explain column structures, data trends, notable figures, and analytical insights.
- If PowerPoint (.pptx): Outline the presentation flow, slide themes, main thesis, and key points per slide.
- If Word (.docx), PDF (.pdf), or Text (.txt): Provide an organized overview, key sections, technical terms, and practical takeaways.

Instructions:
1. Explain all information in simple, clear, and beginner-friendly English.
2. Structure the explanation systematically with introduction, purpose, topic-by-topic breakdown, concepts, examples, and revision notes.
3. Real-World Examples: When providing illustrative real-world examples to explain a concept, clearly distinguish them from document facts (label them as illustrative examples).
4. Extract only facts from the document. Do not invent missing facts.
5. Return ONLY a valid JSON object matching this schema:

{
  "document_title": "A clear, descriptive title of the document or dataset",
  "document_type": "e.g., Technical Specification, Financial Spreadsheet, Project Deck, Policy, Report, etc.",
  "summary_depth": "detailed",
  "document_introduction": "A welcoming 1-2 paragraph introduction explaining what this document is and why it matters.",
  "main_purpose": "Clear statement of the primary goal, objective, or intended outcome of this document.",
  "summary": "A thorough 2 to 4 paragraph explanation summarizing the document in simple English.",
  "topic_breakdown": [
    {
      "topic": "Name of section or major topic",
      "explanation": "Clear step-by-step explanation of this topic in simple terms"
    }
  ],
  "important_concepts": [
    {
      "concept": "Concept or key idea",
      "simple_explanation": "Explanation in plain English that a beginner can grasp"
    }
  ],
  "real_world_examples": [
    {
      "concept": "The concept being illustrated",
      "example": "A practical real-world analogy or scenario explaining this concept",
      "note": "AI-generated illustrative example to aid understanding"
    }
  ],
  "technical_terms": [
    {
      "term": "Technical term or jargon mentioned",
      "definition": "Clear, beginner-friendly definition of what it means in context"
    }
  ],
  "key_points": [
    "Key takeaway or essential principle 1",
    "Key takeaway or essential principle 2",
    "Key takeaway or essential principle 3"
  ],
  "important_dates": [
    {
      "date": "YYYY-MM-DD or date phrase",
      "description": "Milestone, deadline, or event"
    }
  ],
  "people_and_organizations": [
    {
      "name": "Person or Entity Name",
      "type": "Person or Organization",
      "role": "Role, title, or affiliation mentioned"
    }
  ],
  "important_numbers": [
    {
      "value": "Metric, currency, percentage, or count",
      "context": "Context or what this number represents"
    }
  ],
  "conclusions": "Comprehensive final conclusion, outcomes, and future recommendations.",
  "quick_revision_notes": [
    "Bullet point note 1 for rapid review",
    "Bullet point note 2 for rapid review",
    "Bullet point note 3 for rapid review"
  ]
}

Document Content to analyze:
---
{document_text}
---
"""

# -------------------------------------------------------------
# 3. In-Depth Explanation Prompt
# -------------------------------------------------------------
IN_DEPTH_SUMMARY_PROMPT = """You are a senior principal analyst and researcher designed for the "Intelligent Document Analyzer" platform.
Your task is to provide an IN-DEPTH, COMPREHENSIVE EXPLANATION of the provided document content.

Document Format: {document_format}
Summary Mode: IN-DEPTH EXPLANATION (Deeper topic-by-topic analysis, technical relationships, in-depth context, and advanced synthesis).

Format-Specific Guidance:
- If Excel (.xlsx) or CSV (.csv): Perform in-depth data pattern analysis, correlation insights, column relationships, and quantitative conclusions.
- If PowerPoint (.pptx): Deeply analyze the presentation narrative, arguments, strategic intent, and technical details behind each slide.
- If Word (.docx), PDF (.pdf), or Text (.txt): Provide comprehensive section-by-section analysis, concept interactions, and extensive evaluations.

Instructions:
1. Provide deep, rigorous explanations of technical concepts, methodologies, and relationships between topics.
2. Do not simply inflate word count: significantly elevate the analytical depth, precision, and clarity.
3. Address how different concepts, sections, and numbers interrelate.
4. Extract only facts from the document. Do not invent missing facts.
5. Return ONLY a valid JSON object matching this schema:

{
  "document_title": "Comprehensive document title",
  "document_type": "Specific classified document type",
  "summary_depth": "in_depth",
  "document_introduction": "Detailed architectural/contextual introduction setting the complete background of the document.",
  "main_purpose": "Thorough analysis of the explicit and implicit objectives of the document.",
  "summary": "An extensive multi-paragraph synthesis analyzing the document's structure, methodology, and core findings.",
  "topic_breakdown": [
    {
      "topic": "Topic or Section Title",
      "explanation": "In-depth technical breakdown analyzing principles, mechanisms, and implementation details."
    }
  ],
  "important_concepts": [
    {
      "concept": "Advanced or central concept",
      "simple_explanation": "Thorough analytical explanation including theoretical context and implications"
    }
  ],
  "concept_relationships": [
    {
      "concept_a": "First Concept",
      "concept_b": "Second Concept",
      "relationship": "How concept A interacts with, depends upon, or impacts concept B"
    }
  ],
  "real_world_examples": [
    {
      "concept": "Concept name",
      "example": "Detailed practical application or case study showing how this works in industry",
      "note": "AI-generated illustrative application"
    }
  ],
  "technical_terms": [
    {
      "term": "Specialized terminology",
      "definition": "Precise domain-specific definition with contextual explanation"
    }
  ],
  "key_points": [
    "Critical technical or strategic insight 1",
    "Critical technical or strategic insight 2",
    "Critical technical or strategic insight 3"
  ],
  "important_dates": [
    {
      "date": "YYYY-MM-DD or date phrase",
      "description": "Milestone, deadline, or historical marker"
    }
  ],
  "people_and_organizations": [
    {
      "name": "Person or Organization",
      "type": "Person or Organization",
      "role": "Specific role, authority, or department"
    }
  ],
  "important_numbers": [
    {
      "value": "Metric, threshold, or statistic",
      "context": "Contextual meaning, benchmark, or significance"
    }
  ],
  "conclusions": "Exhaustive evaluation of conclusions, limitations, strategic implications, and future directions.",
  "quick_revision_notes": [
    "Key revision takeaway 1",
    "Key revision takeaway 2",
    "Key revision takeaway 3"
  ]
}

Document Content to analyze:
---
{document_text}
---
"""

class GeminiService:
    """Service to communicate with Google Gemini API with Summary Depth Support."""

    @property
    def api_key(self) -> str:
        return settings.GEMINI_API_KEY

    @property
    def model_name(self) -> str:
        return settings.GEMINI_MODEL or "gemini-3.1-flash-lite"

    def is_configured(self) -> bool:
        key = self.api_key
        return bool(key and key.strip() and key != "your_gemini_api_key_here")

    def _get_prompt_for_depth(self, depth: str, document_format: str, document_text: str) -> str:
        clean_depth = depth.lower().strip() if depth else "detailed"
        if clean_depth == "quick":
            template = QUICK_SUMMARY_PROMPT
        elif clean_depth == "in_depth":
            template = IN_DEPTH_SUMMARY_PROMPT
        else:
            template = DETAILED_SUMMARY_PROMPT

        truncated_text = document_text[:120000] if len(document_text) > 120000 else document_text
        return (
            template
            .replace("{document_format}", document_format)
            .replace("{document_text}", truncated_text)
        )

    def analyze_document(
        self,
        document_text: str,
        document_format: str = "Document",
        summary_depth: str = "detailed"
    ) -> Tuple[bool, Dict[str, Any], str]:
        """
        Send document text to Gemini and return validated structured JSON matching the summary depth.
        Returns: (success: bool, structured_data: dict, message: str)
        """
        if not self.is_configured():
            msg = (
                "Gemini API key is not configured in backend/.env. "
                "Please get an API key from https://aistudio.google.com/app/apikey "
                "and set GEMINI_API_KEY in backend/.env to enable AI document analysis."
            )
            return False, {}, msg

        if not document_text or len(document_text.strip()) < 10:
            return False, {}, "Document content is empty or too short for AI analysis."

        valid_depth = summary_depth if summary_depth in ["quick", "detailed", "in_depth"] else "detailed"
        prompt = self._get_prompt_for_depth(valid_depth, document_format, document_text)

        # Build prioritized list of models to try
        models_to_try = [self.model_name] + [m for m in FALLBACK_MODELS if m != self.model_name]

        last_error = ""
        for model in models_to_try:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "responseMimeType": "application/json",
                        "temperature": 0.2
                    }
                }

                logger.info(f"Calling Gemini model: {model} with summary depth: {valid_depth}")
                response = requests.post(url, json=payload, timeout=60)

                if response.status_code == 200:
                    resp_json = response.json()
                    candidates = resp_json.get("candidates", [])
                    if not candidates:
                        continue
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if not parts:
                        continue
                    raw_text = parts[0].get("text", "")
                    if not raw_text.strip():
                        continue

                    cleaned_text = raw_text.strip()
                    if cleaned_text.startswith("```json"):
                        cleaned_text = cleaned_text[7:]
                    if cleaned_text.startswith("```"):
                        cleaned_text = cleaned_text[3:]
                    if cleaned_text.endswith("```"):
                        cleaned_text = cleaned_text[:-3]
                    cleaned_text = cleaned_text.strip()

                    parsed_data = json.loads(cleaned_text)
                    normalized_data = self._validate_and_normalize(parsed_data, valid_depth)
                    return True, normalized_data, f"Document successfully analyzed using Gemini ({model}) in '{valid_depth}' mode."

                elif response.status_code in [404, 429, 503]:
                    err_detail = response.json().get("error", {}).get("message", response.text)
                    logger.warning(f"Model {model} returned {response.status_code}: {err_detail}. Trying fallback...")
                    last_error = f"{model}: {err_detail}"
                    continue
                else:
                    err_detail = response.json().get("error", {}).get("message", response.text)
                    last_error = f"Gemini API error ({response.status_code}): {err_detail}"
                    break

            except requests.exceptions.Timeout:
                logger.warning(f"Timeout calling Gemini model {model}. Trying fallback...")
                last_error = f"Model {model} timed out."
                continue
            except Exception as e:
                logger.error(f"Error calling model {model}: {e}")
                last_error = str(e)
                continue

        return False, {}, f"Gemini analysis failed: {last_error}"

    def _validate_and_normalize(self, data: Dict[str, Any], depth: str = "detailed") -> Dict[str, Any]:
        """Ensure all required fields exist and conform to the expected format for the given depth."""
        result = {
            "document_title": str(data.get("document_title") or "Untitled Document").strip(),
            "document_type": str(data.get("document_type") or "General Document").strip(),
            "summary_depth": depth,
            "summary": str(data.get("summary") or "").strip(),
            "key_points": [],
            "important_dates": [],
            "people_and_organizations": [],
            "important_numbers": [],
            "conclusions": str(data.get("conclusions") or "").strip(),
            # Detailed & In-depth fields
            "document_introduction": str(data.get("document_introduction") or "").strip(),
            "main_purpose": str(data.get("main_purpose") or "").strip(),
            "topic_breakdown": [],
            "important_concepts": [],
            "real_world_examples": [],
            "technical_terms": [],
            "quick_revision_notes": [],
            # In-depth specific fields
            "concept_relationships": [],
        }

        # Normalize key_points
        kp = data.get("key_points")
        if isinstance(kp, list):
            result["key_points"] = [str(item).strip() for item in kp if item]

        # Normalize topic_breakdown
        tb = data.get("topic_breakdown")
        if isinstance(tb, list):
            for t in tb:
                if isinstance(t, dict):
                    result["topic_breakdown"].append({
                        "topic": str(t.get("topic") or "Topic").strip(),
                        "explanation": str(t.get("explanation") or "").strip()
                    })

        # Normalize important_concepts
        ic = data.get("important_concepts")
        if isinstance(ic, list):
            for c in ic:
                if isinstance(c, dict):
                    result["important_concepts"].append({
                        "concept": str(c.get("concept") or "Concept").strip(),
                        "simple_explanation": str(c.get("simple_explanation") or "").strip()
                    })

        # Normalize real_world_examples
        rwe = data.get("real_world_examples")
        if isinstance(rwe, list):
            for ex in rwe:
                if isinstance(ex, dict):
                    result["real_world_examples"].append({
                        "concept": str(ex.get("concept") or "Concept").strip(),
                        "example": str(ex.get("example") or "").strip(),
                        "note": str(ex.get("note") or "AI-generated illustrative example").strip()
                    })

        # Normalize technical_terms
        tt = data.get("technical_terms")
        if isinstance(tt, list):
            for t in tt:
                if isinstance(t, dict):
                    result["technical_terms"].append({
                        "term": str(t.get("term") or "").strip(),
                        "definition": str(t.get("definition") or "").strip()
                    })

        # Normalize quick_revision_notes
        rn = data.get("quick_revision_notes")
        if isinstance(rn, list):
            result["quick_revision_notes"] = [str(item).strip() for item in rn if item]

        # Normalize concept_relationships
        cr = data.get("concept_relationships")
        if isinstance(cr, list):
            for r in cr:
                if isinstance(r, dict):
                    result["concept_relationships"].append({
                        "concept_a": str(r.get("concept_a") or "").strip(),
                        "concept_b": str(r.get("concept_b") or "").strip(),
                        "relationship": str(r.get("relationship") or "").strip()
                    })

        # Normalize important_dates
        dates = data.get("important_dates")
        if isinstance(dates, list):
            for d in dates:
                if isinstance(d, dict):
                    result["important_dates"].append({
                        "date": str(d.get("date") or "N/A").strip(),
                        "description": str(d.get("description") or "").strip()
                    })
                elif isinstance(d, str) and d.strip():
                    result["important_dates"].append({
                        "date": d.strip(),
                        "description": ""
                    })

        # Normalize people_and_organizations
        people = data.get("people_and_organizations")
        if isinstance(people, list):
            for p in people:
                if isinstance(p, dict):
                    result["people_and_organizations"].append({
                        "name": str(p.get("name") or "Unknown").strip(),
                        "type": str(p.get("type") or "Entity").strip(),
                        "role": str(p.get("role") or "").strip()
                    })
                elif isinstance(p, str) and p.strip():
                    result["people_and_organizations"].append({
                        "name": p.strip(),
                        "type": "Entity",
                        "role": ""
                    })

        # Normalize important_numbers
        numbers = data.get("important_numbers")
        if isinstance(numbers, list):
            for n in numbers:
                if isinstance(n, dict):
                    result["important_numbers"].append({
                        "value": str(n.get("value") or "").strip(),
                        "context": str(n.get("context") or "").strip()
                    })
                elif isinstance(n, str) and n.strip():
                    result["important_numbers"].append({
                        "value": n.strip(),
                        "context": ""
                    })

        return result

gemini_service = GeminiService()
