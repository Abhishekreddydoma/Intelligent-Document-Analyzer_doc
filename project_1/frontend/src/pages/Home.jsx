import React from 'react';
import {
  FileText,
  Sparkles,
  Search,
  ArrowRight,
  UploadCloud,
  Layers,
  FileCheck2,
} from 'lucide-react';

export default function Home({ onStartAnalyzing }) {
  return (
    <div className="space-y-12 py-4">
      {/* Hero / Welcome Section */}
      <section className="text-center max-w-3xl mx-auto pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFFDFC] border border-[#E9D9C9] text-[#DC8043] text-xs font-bold mb-5 shadow-[3px_3px_8px_#E8DCCD,-3px_-3px_8px_#FFFFFF]">
          <Sparkles className="w-3.5 h-3.5 text-[#DC8043]" />
          <span>Intelligent Document Analysis with Google Gemini</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#493323] tracking-tight mb-4">
          Understand Your Documents with AI
        </h1>
        <p className="text-lg text-[#8C7767] mb-8 leading-relaxed max-w-2xl mx-auto">
          Transform complex documents into clear, meaningful insights.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onStartAnalyzing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#DC8043] hover:bg-[#C87137] text-white font-semibold text-sm transition-all shadow-[4px_4px_10px_#E8DCCD,-4px_-4px_10px_#FFFFFF] hover:shadow-[2px_2px_6px_#E8DCCD,-2px_-2px_6px_#FFFFFF] active:shadow-[inset_2px_2px_5px_rgba(73,51,35,0.4)] cursor-pointer"
          >
            <span>Start Analyzing</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-[#493323]">
            Core Project Features
          </h2>
          <p className="text-xs text-[#8C7767] mt-1">
            Engineered with modern full-stack technologies and state-of-the-art AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-[#FFFDFC] rounded-2xl p-6 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9] hover:shadow-[7px_7px_16px_#E8DCCD,-7px_-7px_16px_#FFFFFF] transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#F8E5D2] text-[#DC8043] flex items-center justify-center mb-4 shadow-[inset_3px_3px_6px_#E8DCCD,inset_-3px_-3px_6px_#FFFFFF]">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#493323] mb-2">
              1. Smart Document Extraction
            </h3>
            <p className="text-xs text-[#8C7767] leading-relaxed">
              Fast, lossless digital text extraction across PDF, DOCX, XLSX, PPTX, TXT, and CSV. If a PDF is scanned or image-based, Google Document AI OCR automatically extracts text from the images.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#FFFDFC] rounded-2xl p-6 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9] hover:shadow-[7px_7px_16px_#E8DCCD,-7px_-7px_16px_#FFFFFF] transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#F8E5D2] text-[#DC8043] flex items-center justify-center mb-4 shadow-[inset_3px_3px_6px_#E8DCCD,inset_-3px_-3px_6px_#FFFFFF]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#493323] mb-2">
              2. AI-Powered Summarization
            </h3>
            <p className="text-xs text-[#8C7767] leading-relaxed">
              Google Gemini generates clear, customizable summaries explaining dense documents in plain English. Choose between Quick Summary, Detailed Summary, or In-Depth Explanation.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#FFFDFC] rounded-2xl p-6 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9] hover:shadow-[7px_7px_16px_#E8DCCD,-7px_-7px_16px_#FFFFFF] transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#F8E5D2] text-[#DC8043] flex items-center justify-center mb-4 shadow-[inset_3px_3px_6px_#E8DCCD,inset_-3px_-3px_6px_#FFFFFF]">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#493323] mb-2">
              3. Important Information Detection
            </h3>
            <p className="text-xs text-[#8C7767] leading-relaxed">
              Extract key takeaways, crucial milestones and dates, named individuals and organizations, and critical metrics and statistics without reading through hundreds of pages.
            </p>
          </div>
        </div>
      </section>

      {/* How the Application Works */}
      <section className="max-w-5xl mx-auto bg-[#FFFDFC] rounded-2xl p-8 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9]">
        <h2 className="text-lg font-bold text-[#493323] mb-6 text-center">
          How the Application Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#F8E5D2] text-[#DC8043] flex items-center justify-center font-bold text-sm shadow-[inset_3px_3px_6px_#E8DCCD,inset_-3px_-3px_6px_#FFFFFF] border border-[#E9D9C9] mb-3">
              1
            </div>
            <h4 className="text-sm font-bold text-[#493323] mb-1">Upload Document</h4>
            <p className="text-xs text-[#8C7767] leading-normal">
              Select or drag and drop PDF, Word, Excel, PowerPoint, Text, or CSV files up to 10 MB.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#F8E5D2] text-[#DC8043] flex items-center justify-center font-bold text-sm shadow-[inset_3px_3px_6px_#E8DCCD,inset_-3px_-3px_6px_#FFFFFF] border border-[#E9D9C9] mb-3">
              2
            </div>
            <h4 className="text-sm font-bold text-[#493323] mb-1">Text Extraction & OCR</h4>
            <p className="text-xs text-[#8C7767] leading-normal">
              Format-specific parsers extract structured content; Google Document AI handles scanned images.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#F8E5D2] text-[#DC8043] flex items-center justify-center font-bold text-sm shadow-[inset_3px_3px_6px_#E8DCCD,inset_-3px_-3px_6px_#FFFFFF] border border-[#E9D9C9] mb-3">
              3
            </div>
            <h4 className="text-sm font-bold text-[#493323] mb-1">AI Insights & Report</h4>
            <p className="text-xs text-[#8C7767] leading-normal">
              Google Gemini structures key points and generates a downloadable report with chosen depth.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
