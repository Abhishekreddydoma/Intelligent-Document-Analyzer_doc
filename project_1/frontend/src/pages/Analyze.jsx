import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Presentation,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Info,
  Zap,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { analyzeDocument } from '../services/api';
import AnalysisResult from '../components/AnalysisResult';

const SUPPORTED_EXTENSIONS = {
  pdf: { label: 'PDF Document', color: 'bg-[#FFFDFC] text-[#DC8043] border-[#E9D9C9]' },
  docx: { label: 'Word Document', color: 'bg-[#FFFDFC] text-[#DC8043] border-[#E9D9C9]' },
  txt: { label: 'Text File', color: 'bg-[#FFFDFC] text-[#DC8043] border-[#E9D9C9]' },
  xlsx: { label: 'Excel Spreadsheet', color: 'bg-[#FFFDFC] text-[#DC8043] border-[#E9D9C9]' },
  pptx: { label: 'PowerPoint Presentation', color: 'bg-[#FFFDFC] text-[#DC8043] border-[#E9D9C9]' },
  csv: { label: 'CSV Data File', color: 'bg-[#FFFDFC] text-[#DC8043] border-[#E9D9C9]' },
};

const DEPTH_OPTIONS = [
  {
    id: 'quick',
    title: 'Quick Summary',
    badge: null,
    icon: Zap,
    desc: 'Main ideas only • Short explanation • Essential points in bullets • Suitable for quick reading.',
  },
  {
    id: 'detailed',
    title: 'Detailed Summary',
    badge: 'DEFAULT',
    icon: BookOpen,
    desc: 'Step-by-step breakdown • Important concepts explained simply • Real-world examples • Technical terms with definitions • Quick revision notes.',
  },
  {
    id: 'in_depth',
    title: 'In-Depth Explanation',
    badge: 'ADVANCED',
    icon: Sparkles,
    desc: 'Deep topic-by-topic analysis • Theoretical context • Concept relationships • Domain synthesis • Comprehensive takeaways.',
  },
];

export default function Analyze() {
  const [file, setFile] = useState(null);
  const [fileFormat, setFileFormat] = useState(null);
  const [summaryDepth, setSummaryDepth] = useState('detailed'); // DEFAULT is detailed
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  const fileInputRef = useRef(null);

  const MAX_SIZE_MB = 10;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  const getExtension = (name) => {
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  };

  const handleFileValidation = (selectedFile) => {
    setError(null);

    if (!selectedFile) return;

    const ext = getExtension(selectedFile.name);
    if (!SUPPORTED_EXTENSIONS[ext]) {
      setError(`Unsupported file format ('.${ext}'). Supported formats: PDF, DOCX, TXT, XLSX, PPTX, CSV.`);
      return;
    }

    if (selectedFile.size > MAX_SIZE_BYTES) {
      setError(`File size exceeds ${MAX_SIZE_MB} MB limit (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }

    if (selectedFile.size === 0) {
      setError('Selected file is empty (0 bytes).');
      return;
    }

    setFile(selectedFile);
    setFileFormat(SUPPORTED_EXTENSIONS[ext]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileValidation(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileValidation(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileFormat(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setStatusMessage('Uploading document and extracting structured text content...');

    try {
      const depthLabel = summaryDepth === 'quick' ? 'Quick' : summaryDepth === 'in_depth' ? 'In-Depth' : 'Detailed';
      const statusTimer = setTimeout(() => {
        setStatusMessage(`Generating ${depthLabel} Summary with Google Gemini AI...`);
      }, 1400);

      const result = await analyzeDocument(file, summaryDepth);
      clearTimeout(statusTimer);

      setAnalysisResult(result);
      setStatusMessage('');
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'An unexpected error occurred while analyzing the document.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileFormat(null);
    setAnalysisResult(null);
    setError(null);
    setStatusMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdateResult = (newResult) => {
    setAnalysisResult(newResult);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const renderFormatIcon = (ext) => {
    if (ext === 'xlsx' || ext === 'csv') {
      return <FileSpreadsheet className="w-5 h-5" />;
    }
    if (ext === 'pptx') {
      return <Presentation className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* If analysis is ready, show Results View */}
      {analysisResult ? (
        <AnalysisResult
          result={analysisResult}
          onReset={handleReset}
          onUpdateResult={handleUpdateResult}
        />
      ) : (
        /* Upload View */
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-[#493323]">
              Upload Your Document
            </h2>
            <p className="text-sm text-[#8C7767] mt-1 leading-relaxed">
              Upload PDF, Word, Excel, PowerPoint, Text or CSV files to extract and analyze important information using AI.
            </p>
          </div>

          {/* Minimal Neumorphic Upload Container */}
          <div className="bg-[#FFFDFC] rounded-2xl p-6 sm:p-8 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9] space-y-6">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.xlsx,.pptx,.csv"
              onChange={handleChange}
              className="hidden"
            />

            {!file ? (
              /* Drag & Drop Area */
              <div>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all bg-[#F8E5D2] shadow-[inset_4px_4px_8px_#E8DCCD,inset_-4px_-4px_8px_#FFFFFF] ${
                    dragActive
                      ? 'border-[#DC8043] bg-[#F2BD78]/30 shadow-[inset_6px_6px_12px_#E8DCCD,inset_-6px_-6px_12px_#FFFFFF]'
                      : 'border-[#E9D9C9] hover:border-[#DC8043]'
                  }`}
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFFDFC] text-[#DC8043] flex items-center justify-center mb-4 shadow-[3px_3px_8px_#E8DCCD,-3px_-3px_8px_#FFFFFF]">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-semibold text-[#493323] mb-1">
                    Drag and drop your file here, or click to browse
                  </h3>
                  <p className="text-xs text-[#8C7767] mb-5">
                    Maximum file size: 10 MB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center px-6 py-2.5 text-xs font-semibold text-white bg-[#DC8043] hover:bg-[#C87137] rounded-xl shadow-[3px_3px_8px_#E8DCCD,-3px_-3px_8px_#FFFFFF] active:shadow-[inset_2px_2px_4px_rgba(73,51,35,0.4)] transition-all cursor-pointer"
                  >
                    Choose File
                  </button>
                </div>

                {/* Display Supported Formats Below Upload Area */}
                <div className="mt-4 pt-3 border-t border-[#E9D9C9] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8C7767] gap-2">
                  <span className="font-semibold text-[#493323]">Supported Formats:</span>
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#DC8043]">
                    <span>PDF</span>
                    <span className="text-[#E9D9C9]">|</span>
                    <span>DOCX</span>
                    <span className="text-[#E9D9C9]">|</span>
                    <span>TXT</span>
                    <span className="text-[#E9D9C9]">|</span>
                    <span>XLSX</span>
                    <span className="text-[#E9D9C9]">|</span>
                    <span>PPTX</span>
                    <span className="text-[#E9D9C9]">|</span>
                    <span>CSV</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Selected File Details */
              <div className="flex items-center justify-between p-4 bg-[#F8E5D2] rounded-xl shadow-[inset_3px_3px_6px_#E8DCCD,inset_-3px_-3px_6px_#FFFFFF]">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-11 h-11 rounded-xl bg-[#DC8043] text-white flex items-center justify-center flex-shrink-0 shadow-[2px_2px_5px_#E8DCCD,-2px_-2px_5px_#FFFFFF]">
                    {renderFormatIcon(getExtension(file.name))}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#493323] truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[#8C7767]">
                        {formatFileSize(file.size)}
                      </span>
                      {fileFormat && (
                        <>
                          <span className="text-[#DC8043]">•</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFFDFC] text-[#DC8043] border border-[#E9D9C9] shadow-[1px_1px_3px_#E8DCCD,-1px_-1px_3px_#FFFFFF]">
                            {fileFormat.label}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {!loading && (
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-2 text-[#8C7767] hover:text-[#C75B50] bg-[#FFFDFC] rounded-xl shadow-[2px_2px_5px_#E8DCCD,-2px_-2px_5px_#FFFFFF] hover:shadow-[inset_2px_2px_4px_#E8DCCD,inset_-2px_-2px_4px_#FFFFFF] transition-all cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* SECTION: Choose Summary Depth */}
            <div className="pt-3 border-t border-[#E9D9C9] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#493323]">
                  Choose Summary Depth
                </label>
                <span className="text-xs text-[#8C7767]">
                  Select your desired level of detail
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {DEPTH_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = summaryDepth === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => !loading && setSummaryDepth(opt.id)}
                      className={`relative p-4 rounded-xl text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#DC8043] text-white shadow-[inset_3px_3px_7px_rgba(73,51,35,0.3),inset_-3px_-3px_7px_rgba(255,255,255,0.2)] border-2 border-[#DC8043]'
                          : 'bg-[#F8E5D2] text-[#493323] shadow-[3px_3px_8px_#E8DCCD,-3px_-3px_8px_#FFFFFF] border border-[#E9D9C9] hover:shadow-[4px_4px_10px_#E8DCCD,-4px_-4px_10px_#FFFFFF]'
                      } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#DC8043]'}`} />
                          <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#493323]'}`}>
                            {opt.title}
                          </span>
                        </div>
                        {opt.badge && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs ${
                              isSelected
                                ? 'bg-white text-[#DC8043]'
                                : 'bg-[#DC8043] text-white'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] leading-normal ${isSelected ? 'text-white/90' : 'text-[#8C7767]'}`}>
                        {opt.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress / Status indicator */}
            {loading && (
              <div className="p-4 bg-[#F8E5D2] border border-[#E9D9C9] rounded-xl shadow-[inset_3px_3px_6px_#E8DCCD,inset_-3px_-3px_6px_#FFFFFF] flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-[#DC8043] animate-spin flex-shrink-0" />
                <div className="text-xs text-[#493323] font-semibold">
                  {statusMessage || 'Processing document...'}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {file && (
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleAnalyze}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer ${
                    loading
                      ? 'bg-[#F2BD78] cursor-not-allowed'
                      : 'bg-[#DC8043] hover:bg-[#C87137] shadow-[4px_4px_10px_#E8DCCD,-4px_-4px_10px_#FFFFFF] hover:shadow-[2px_2px_6px_#E8DCCD,-2px_-2px_6px_#FFFFFF] active:shadow-[inset_2px_2px_5px_rgba(73,51,35,0.4)]'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing Document...</span>
                    </>
                  ) : (
                    <span>Analyze Document</span>
                  )}
                </button>

                {!loading && (
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="px-5 py-3 rounded-xl text-sm font-semibold text-[#493323] bg-[#F2BD78] hover:bg-[#EDB368] border border-[#E9D9C9] shadow-[3px_3px_8px_#E8DCCD,-3px_-3px_8px_#FFFFFF] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="bg-[#FFFDFC] border border-[#C75B50] rounded-xl p-4 flex items-start gap-3 text-xs text-[#C75B50] shadow-[3px_3px_8px_#E8DCCD,-3px_-3px_8px_#FFFFFF]">
              <AlertCircle className="w-5 h-5 text-[#C75B50] flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-[#C75B50]">Processing Error</p>
                <p className="leading-relaxed text-[#493323]">{error}</p>
              </div>
            </div>
          )}

          {/* Format & Depth Notice */}
          <div className="bg-[#FFFDFC] border border-[#E9D9C9] rounded-xl p-4 text-xs text-[#8C7767] flex items-start gap-3 shadow-[3px_3px_8px_#E8DCCD,-3px_-3px_8px_#FFFFFF]">
            <Info className="w-4 h-4 text-[#DC8043] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-[#493323]">About Summary Depth:</span>
              <p className="leading-relaxed">
                <strong className="text-[#493323]">Detailed Summary (Default)</strong> provides section-by-section breakdowns, real-world examples, and terminology definitions. You can switch to <strong className="text-[#493323]">Quick Summary</strong> for rapid review or <strong className="text-[#493323]">In-Depth Explanation</strong> for advanced technical synthesis at any time.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
