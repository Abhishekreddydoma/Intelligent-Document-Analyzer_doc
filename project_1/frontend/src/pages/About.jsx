import React from 'react';
import {
  FileText,
  Cpu,
  Layers,
  Database,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Info,
} from 'lucide-react';

export default function About({ backendStatus }) {
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-[#493323]">
          About the Project
        </h2>
        <p className="text-sm text-[#8C7767] mt-1">
          DocuMind AI is a modern web application demonstrating applied Generative AI and Document OCR.
        </p>
      </div>

      {/* Project Overview */}
      <div className="bg-[#FFFDFC] rounded-2xl p-6 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9] space-y-4">
        <h3 className="text-base font-bold text-[#493323] flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#DC8043]" />
          Project Overview & Motivation
        </h3>
        <p className="text-sm text-[#493323] leading-relaxed">
          Traditional document processing often requires manual reading of extensive reports, research papers, legal contracts, spreadsheets, and presentations. 
          <strong className="text-[#DC8043]"> DocuMind AI</strong> bridges this gap by combining fast local text extraction (PyMuPDF, python-docx, openpyxl, python-pptx), cloud optical character recognition (Google Document AI OCR), and Google's flagship Gemini models to extract structured insights and actionable summaries within seconds.
        </p>
      </div>

      {/* Architecture Flow */}
      <div className="bg-[#FFFDFC] rounded-2xl p-6 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9] space-y-4">
        <h3 className="text-base font-bold text-[#493323] flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#DC8043]" />
          System Architecture & Workflow
        </h3>
        <div className="bg-[#F8E5D2] rounded-xl p-5 shadow-[inset_3px_3px_6px_#E8DCCD,inset_-3px_-3px_6px_#FFFFFF] text-xs space-y-3 font-mono text-[#493323]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#DC8043]">[1] React UI</span>
            <span>&rarr; User uploads PDF, Word, Excel, PPTX, TXT, or CSV (&le; 10 MB)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#DC8043]">[2] FastAPI</span>
            <span>&rarr; Validates extension, headers, and file size limits</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#DC8043]">[3] Extractor</span>
            <span>&rarr; Uses format-specific engine (PyMuPDF, docx, openpyxl, pptx)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#DC8043]">[4] OCR Check</span>
            <span>&rarr; If scanned PDF (&lt;50 chars), routes to Google Document AI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#DC8043]">[5] Gemini API</span>
            <span>&rarr; Generates multi-depth analysis (Quick, Detailed, In-Depth)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#DC8043]">[6] Result & Report</span>
            <span>&rarr; Displays neumorphic cards + enables instant regeneration & report export</span>
          </div>
        </div>
      </div>

      {/* Technology Stack Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Frontend Tech */}
        <div className="bg-[#FFFDFC] rounded-2xl p-6 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9] space-y-3">
          <h4 className="text-sm font-bold text-[#493323] flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#DC8043]" />
            Frontend Technologies
          </h4>
          <ul className="text-xs text-[#493323] space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC8043]"></span>
              <strong>React 19 & Vite:</strong> Ultra-fast component-based frontend
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC8043]"></span>
              <strong>Sunset Orange Theme:</strong> Warm, minimal neumorphic design
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC8043]"></span>
              <strong>Tailwind CSS:</strong> Minimalist responsive styling
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC8043]"></span>
              <strong>Lucide React:</strong> Clean, semantic iconography
            </li>
          </ul>
        </div>

        {/* Backend Tech */}
        <div className="bg-[#FFFDFC] rounded-2xl p-6 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9] space-y-3">
          <h4 className="text-sm font-bold text-[#493323] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#DC8043]" />
            Backend & AI Technologies
          </h4>
          <ul className="text-xs text-[#493323] space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC8043]"></span>
              <strong>Python 3.12 & FastAPI:</strong> High-performance async REST API
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC8043]"></span>
              <strong>Universal Parsers:</strong> PyMuPDF, python-docx, openpyxl, pptx
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC8043]"></span>
              <strong>Google Gemini API:</strong> Structured JSON analysis & summarization
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC8043]"></span>
              <strong>Google Document AI:</strong> Specialized cloud OCR for scanned documents
            </li>
          </ul>
        </div>
      </div>

      {/* Backend & Credentials Status Check */}
      <div className="bg-[#FFFDFC] rounded-2xl p-6 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9] space-y-4">
        <h3 className="text-sm font-bold text-[#493323] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#DC8043]" />
          System Configuration Status
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-[#F8E5D2] rounded-xl shadow-[inset_2px_2px_5px_#E8DCCD,inset_-2px_-2px_5px_#FFFFFF]">
            <span className="text-[#8C7767] block mb-1">Extraction Engines</span>
            <span className={`font-bold ${backendStatus?.features?.pymupdf_installed ? 'text-[#548A68]' : 'text-[#8C7767]'}`}>
              {backendStatus?.features?.pymupdf_installed ? 'Installed & Ready' : 'Ready'}
            </span>
          </div>

          <div className="p-3.5 bg-[#F8E5D2] rounded-xl shadow-[inset_2px_2px_5px_#E8DCCD,inset_-2px_-2px_5px_#FFFFFF]">
            <span className="text-[#8C7767] block mb-1">Google Gemini API</span>
            <span className={`font-bold ${backendStatus?.features?.gemini_api_configured ? 'text-[#548A68]' : 'text-[#C75B50]'}`}>
              {backendStatus?.features?.gemini_api_configured ? 'Configured (.env)' : 'Key Needed in .env'}
            </span>
          </div>

          <div className="p-3.5 bg-[#F8E5D2] rounded-xl shadow-[inset_2px_2px_5px_#E8DCCD,inset_-2px_-2px_5px_#FFFFFF]">
            <span className="text-[#8C7767] block mb-1">Google Document AI OCR</span>
            <span className={`font-bold ${backendStatus?.features?.documentai_configured ? 'text-[#548A68]' : 'text-[#8C7767]'}`}>
              {backendStatus?.features?.documentai_configured ? 'Configured (GCP)' : 'Optional (Scanned PDFs)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
