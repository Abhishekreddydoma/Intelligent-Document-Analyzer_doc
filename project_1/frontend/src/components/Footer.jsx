import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#FFFDFC] border-t border-[#E9D9C9] mt-auto py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8C7767] gap-2">
        <div>
          <span className="font-bold text-[#493323]">DocuMind AI</span> — Intelligent Document Understanding Platform
        </div>
        <div>
          Powered by PyMuPDF, FastAPI, Google Gemini API & Google Document AI
        </div>
      </div>
    </footer>
  );
}
