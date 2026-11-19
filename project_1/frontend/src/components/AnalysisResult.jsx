import React, { useState } from 'react';
import {
  FileText,
  Download,
  RotateCcw,
  Calendar,
  Users,
  Hash,
  CheckCircle,
  FileCheck,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Zap,
  BookOpen,
  Sparkles,
  RefreshCw,
  Lightbulb,
  BookMarked,
  Network,
  AlertCircle,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import { regenerateSummary } from '../services/api';

const DEPTH_LABELS = {
  quick: {
    title: 'Quick Summary',
    short: 'Quick',
    icon: Zap,
    badgeBg: 'bg-[#F8E5D2] text-[#DC8043] border-[#E9D9C9]',
    desc: 'Concise overview focusing on high-level takeaways.',
  },
  detailed: {
    title: 'Detailed Summary',
    short: 'Detailed',
    icon: BookOpen,
    badgeBg: 'bg-[#DC8043] text-white border-[#DC8043]',
    desc: 'Comprehensive teacher-style explanation with concepts, examples & terms.',
  },
  in_depth: {
    title: 'In-Depth Explanation',
    short: 'In-Depth',
    icon: Sparkles,
    badgeBg: 'bg-[#F2BD78] text-[#493323] border-[#E9D9C9]',
    desc: 'Deep analytical synthesis with concept relationships & theoretical context.',
  },
};

export default function AnalysisResult({ result, onReset, onUpdateResult }) {
  const [showRawText, setShowRawText] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState(null);
  const [selectedDepth, setSelectedDepth] = useState(result?.summary_depth || 'detailed');

  if (!result || !result.analysis) {
    return null;
  }

  const {
    analysis,
    filename,
    metadata,
    file_size_kb,
    processing_time_seconds,
    full_text,
    file_format,
    summary_depth = 'detailed',
  } = result;

  const currentDepthInfo = DEPTH_LABELS[summary_depth] || DEPTH_LABELS.detailed;

  const getFormatDetailText = () => {
    if (!metadata) return '';
    if (metadata.format === 'PDF') return `${metadata.page_count || 1} page(s)`;
    if (metadata.format === 'DOCX') return `${metadata.paragraph_count || 0} paragraphs • ${metadata.table_count || 0} tables`;
    if (metadata.format === 'XLSX') return `${metadata.sheet_count || 1} sheet(s) (${(metadata.sheet_names || []).join(', ')})`;
    if (metadata.format === 'PPTX') return `${metadata.slide_count || 1} slide(s)`;
    if (metadata.format === 'CSV') return `${metadata.row_count || 0} rows • ${metadata.column_count || 0} columns`;
    if (metadata.format === 'TXT') return `${metadata.line_count || 0} lines`;
    return `${metadata.word_count || 0} words`;
  };

  // Handler for regenerating summary with a chosen depth
  const handleRegenerate = async (depthToRun) => {
    const targetDepth = depthToRun || selectedDepth;
    if (!full_text) {
      setRegenError('Full document text is missing; unable to regenerate summary.');
      return;
    }

    setRegenerating(true);
    setRegenError(null);

    try {
      const res = await regenerateSummary({
        extracted_text: full_text,
        summary_depth: targetDepth,
        document_format: file_format || metadata?.format || 'Document',
        filename: filename,
      });

      // Update parent state seamlessly
      if (onUpdateResult) {
        onUpdateResult({
          ...result,
          ...res,
          full_text: result.full_text,
          metadata: result.metadata,
          file_size_kb: result.file_size_kb,
          summary_depth: targetDepth,
        });
      }
      setSelectedDepth(targetDepth);
    } catch (err) {
      console.error('Failed to regenerate summary:', err);
      setRegenError(err.message || 'Failed to regenerate summary.');
    } finally {
      setRegenerating(false);
    }
  };

  // Generate downloadable plain text report
  const handleDownloadReport = () => {
    let reportContent = `=====================================================
DOCUMIND AI - DOCUMENT ANALYSIS REPORT
=====================================================

File Name: ${filename}
Format: ${file_format || metadata?.format || 'Document'}
Details: ${getFormatDetailText()}
File Size: ${file_size_kb || 'N/A'} KB
Extraction Method: ${metadata?.extraction_method || 'Extractor Service'}
Summary Depth Mode: ${currentDepthInfo.title.toUpperCase()}
Processing Time: ${processing_time_seconds || 'N/A'} seconds
Analyzed with: Google Gemini AI

-----------------------------------------------------
1. DOCUMENT OVERVIEW
-----------------------------------------------------
Title: ${analysis.document_title || 'Untitled Document'}
Classified Type: ${analysis.document_type || 'General Document'}
Summary Depth: ${summary_depth}
`;

    if (analysis.document_introduction) {
      reportContent += `
-----------------------------------------------------
2. INTRODUCTION & MAIN PURPOSE
-----------------------------------------------------
Introduction:
${analysis.document_introduction}

Main Purpose:
${analysis.main_purpose || 'N/A'}
`;
    }

    reportContent += `
-----------------------------------------------------
3. ${summary_depth === 'quick' ? 'QUICK SUMMARY' : summary_depth === 'in_depth' ? 'IN-DEPTH EXPLANATION' : 'DETAILED SUMMARY'}
-----------------------------------------------------
${analysis.summary || 'No summary available.'}
`;

    if (analysis.topic_breakdown && analysis.topic_breakdown.length > 0) {
      reportContent += `
-----------------------------------------------------
4. TOPIC-BY-TOPIC EXPLANATION
-----------------------------------------------------
`;
      analysis.topic_breakdown.forEach((item, idx) => {
        reportContent += `[${idx + 1}] ${item.topic}\n${item.explanation}\n\n`;
      });
    }

    if (analysis.important_concepts && analysis.important_concepts.length > 0) {
      reportContent += `
-----------------------------------------------------
5. IMPORTANT CONCEPTS
-----------------------------------------------------
`;
      analysis.important_concepts.forEach((c) => {
        reportContent += `* ${c.concept}: ${c.simple_explanation}\n`;
      });
    }

    if (analysis.real_world_examples && analysis.real_world_examples.length > 0) {
      reportContent += `
-----------------------------------------------------
6. REAL-WORLD EXAMPLES (AI ILLUSTRATIONS)
-----------------------------------------------------
`;
      analysis.real_world_examples.forEach((ex) => {
        reportContent += `* Concept: ${ex.concept}\n  Example: ${ex.example}\n  Note: [AI-Generated Illustrative Example]\n\n`;
      });
    }

    if (analysis.technical_terms && analysis.technical_terms.length > 0) {
      reportContent += `
-----------------------------------------------------
7. IMPORTANT TECHNICAL TERMS
-----------------------------------------------------
`;
      analysis.technical_terms.forEach((t) => {
        reportContent += `* ${t.term}: ${t.definition}\n`;
      });
    }

    if (analysis.concept_relationships && analysis.concept_relationships.length > 0) {
      reportContent += `
-----------------------------------------------------
8. CONCEPT RELATIONSHIPS
-----------------------------------------------------
`;
      analysis.concept_relationships.forEach((rel) => {
        reportContent += `* [${rel.concept_a}] <--> [${rel.concept_b}]: ${rel.relationship}\n`;
      });
    }

    reportContent += `
-----------------------------------------------------
9. IMPORTANT DATES AND NUMBERS
-----------------------------------------------------
[Dates]
${
  analysis.important_dates && analysis.important_dates.length > 0
    ? analysis.important_dates.map((d) => `* ${d.date}: ${d.description}`).join('\n')
    : 'No important dates identified.'
}

[Numbers & Metrics]
${
  analysis.important_numbers && analysis.important_numbers.length > 0
    ? analysis.important_numbers.map((n) => `* ${n.value}: ${n.context}`).join('\n')
    : 'No important numbers identified.'
}

-----------------------------------------------------
10. PEOPLE AND ORGANIZATIONS
-----------------------------------------------------
${
  analysis.people_and_organizations && analysis.people_and_organizations.length > 0
    ? analysis.people_and_organizations
        .map((p) => `* ${p.name} [${p.type || 'Entity'}] ${p.role ? '- ' + p.role : ''}`)
        .join('\n')
    : 'No people or organizations identified.'
}

-----------------------------------------------------
11. KEY TAKEAWAYS
-----------------------------------------------------
${
  analysis.key_points && analysis.key_points.length > 0
    ? analysis.key_points.map((kp, idx) => `${idx + 1}. ${kp}`).join('\n')
    : 'No key takeaways identified.'
}

-----------------------------------------------------
12. CONCLUSION
-----------------------------------------------------
${analysis.conclusions || 'No specific conclusions mentioned in document.'}
`;

    if (analysis.quick_revision_notes && analysis.quick_revision_notes.length > 0) {
      reportContent += `
-----------------------------------------------------
13. QUICK REVISION
-----------------------------------------------------
${analysis.quick_revision_notes.map((note, idx) => `[Point ${idx + 1}] ${note}`).join('\n')}
`;
    }

    reportContent += `
=====================================================
Report generated by DocuMind AI
=====================================================
`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanName = filename.replace(/\.[^/.]+$/, '');
    link.download = `${cleanName}_${summary_depth}_Report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-[#FFFDFC] rounded-2xl p-6 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#FFFDFC] text-[#548A68] border border-[#548A68]/30 shadow-[1px_1px_3px_#E8DCCD,-1px_-1px_3px_#FFFFFF]">
              Analysis Complete
            </span>
            <span className={`px-3 py-0.5 rounded-full text-xs font-bold border shadow-[1px_1px_3px_#E8DCCD,-1px_-1px_3px_#FFFFFF] ${currentDepthInfo.badgeBg}`}>
              Mode: {currentDepthInfo.title}
            </span>
            <span className="text-xs text-[#8C7767]">
              Processed in {processing_time_seconds || '1.2'}s
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#493323]">
            {analysis.document_title || filename}
          </h2>
          <p className="text-xs text-[#8C7767] mt-1">
            File: <span className="text-[#493323] font-semibold">{filename}</span> • Format:{' '}
            <span className="font-bold text-[#DC8043]">{file_format || metadata?.format}</span> • {file_size_kb || 0} KB • {getFormatDetailText()} • Extractor: {metadata?.extraction_method || 'Service'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Primary Button */}
          <button
            onClick={handleDownloadReport}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#DC8043] hover:bg-[#C87137] rounded-xl transition-all shadow-[3px_3px_8px_#E8DCCD,-3px_-3px_8px_#FFFFFF] active:shadow-[inset_2px_2px_4px_rgba(73,51,35,0.4)] cursor-pointer"
            title="Download formatted text report"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
          {/* Secondary Button */}
          <button
            onClick={onReset}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#493323] bg-[#F2BD78] hover:bg-[#EDB368] rounded-xl transition-all shadow-[3px_3px_8px_#E8DCCD,-3px_-3px_8px_#FFFFFF] border border-[#E9D9C9] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Analyze Another
          </button>
        </div>
      </div>

      {/* Summary Depth Regeneration Toolbar */}
      <div className="bg-[#FFFDFC] rounded-2xl p-4 shadow-[4px_4px_10px_#E8DCCD,-4px_-4px_10px_#FFFFFF] border border-[#E9D9C9]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 text-[#DC8043] ${regenerating ? 'animate-spin' : ''}`} />
              <h3 className="text-sm font-bold text-[#493323]">
                Change Summary Depth & Regenerate
              </h3>
            </div>
            <p className="text-xs text-[#8C7767] mt-0.5">
              Switch depth mode to get a different level of detail without re-uploading the document.
            </p>
          </div>

          {/* Depth Selector Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(DEPTH_LABELS).map(([depthKey, info]) => {
              const Icon = info.icon;
              const isCurrent = summary_depth === depthKey;

              return (
                <button
                  key={depthKey}
                  type="button"
                  disabled={regenerating}
                  onClick={() => {
                    setSelectedDepth(depthKey);
                    if (depthKey !== summary_depth) {
                      handleRegenerate(depthKey);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                    isCurrent
                      ? 'bg-[#DC8043] text-white shadow-[inset_2px_2px_4px_rgba(73,51,35,0.35)] border-transparent'
                      : 'bg-[#F8E5D2] text-[#493323] hover:bg-[#F2BD78] shadow-[2px_2px_6px_#E8DCCD,-2px_-2px_6px_#FFFFFF] border border-[#E9D9C9]'
                  } ${regenerating ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{info.short}</span>
                  {depthKey === 'detailed' && !isCurrent && (
                    <span className="text-[10px] text-[#DC8043]">(Default)</span>
                  )}
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Regenerating Status / Error notification */}
        {regenerating && (
          <div className="mt-3 pt-3 border-t border-[#E9D9C9] flex items-center gap-2 text-xs text-[#DC8043] font-semibold animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#DC8043]" />
            <span>Regenerating analysis in '{DEPTH_LABELS[selectedDepth]?.title}' mode with Google Gemini AI...</span>
          </div>
        )}

        {regenError && (
          <div className="mt-3 pt-3 border-t border-[#E9D9C9] flex items-center gap-2 text-xs text-[#C75B50] font-semibold">
            <AlertCircle className="w-4 h-4 text-[#C75B50] flex-shrink-0" />
            <span>{regenError}</span>
          </div>
        )}
      </div>

      {/* Grid of Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main): Overview, Detailed Summary, Topic Breakdown, Concepts, Examples, Conclusions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Document Overview */}
          <div className="bg-[#FFFDFC] rounded-2xl p-6 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E9D9C9]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#DC8043]">
                1. Document Overview
              </span>
              <span className="px-3 py-1 text-xs font-bold bg-[#F8E5D2] text-[#493323] rounded-lg shadow-[inset_2px_2px_4px_#E8DCCD,inset_-2px_-2px_4px_#FFFFFF]">
                Type: {analysis.document_type || 'General'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#493323] mb-1">
              {analysis.document_title}
            </h3>
            <p className="text-sm text-[#8C7767]">
              Classified Document Type: <strong className="text-[#493323]">{analysis.document_type}</strong>
            </p>

            {(analysis.document_introduction || analysis.main_purpose) && (
              <div className="mt-4 pt-4 border-t border-[#E9D9C9] space-y-3">
                {analysis.document_introduction && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C7767] mb-1">
                      Introduction
                    </h4>
                    <p className="text-sm text-[#493323] leading-relaxed">
                      {analysis.document_introduction}
                    </p>
                  </div>
                )}
                {analysis.main_purpose && (
                  <div className="bg-[#F8E5D2] rounded-xl p-3.5 shadow-[inset_3px_3px_6px_#E8DCCD,inset_-3px_-3px_6px_#FFFFFF]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#DC8043] mb-1">
                      Main Purpose
                    </h4>
                    <p className="text-sm text-[#493323] leading-relaxed font-medium">
                      {analysis.main_purpose}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 2: Detailed Summary */}
          <div className="bg-[#FFFDFC] rounded-2xl p-6 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E9D9C9]">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#DC8043]" />
                <h3 className="text-base font-bold text-[#493323]">
                  2. {summary_depth === 'quick' ? 'Quick Summary' : summary_depth === 'in_depth' ? 'In-Depth Explanation' : 'Detailed Summary'}
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[#F8E5D2] text-[#DC8043] shadow-[inset_2px_2px_4px_#E8DCCD,inset_-2px_-2px_4px_#FFFFFF]">
                {currentDepthInfo.short} Mode
              </span>
            </div>
            <div className="text-sm text-[#493323] leading-relaxed space-y-3 whitespace-pre-line">
              {analysis.summary || 'Summary unavailable.'}
            </div>
          </div>

          {/* Card 3: Topic-by-Topic Explanation */}
          {analysis.topic_breakdown && analysis.topic_breakdown.length > 0 && (
            <div className="bg-[#FFFDFC] rounded-2xl p-6 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9]">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#E9D9C9]">
                <Layers className="w-5 h-5 text-[#DC8043]" />
                <h3 className="text-base font-bold text-[#493323]">
                  3. Topic-by-Topic Explanation
                </h3>
              </div>
              <div className="space-y-3">
                {analysis.topic_breakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-[#F8E5D2] rounded-xl p-4 shadow-[inset_3px_3px_6px_#E8DCCD,inset_-3px_-3px_6px_#FFFFFF]"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-[#DC8043] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-[1px_1px_3px_#E8DCCD]">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-[#493323]">
                        {item.topic}
                      </h4>
                    </div>
                    <p className="text-sm text-[#493323] leading-relaxed pl-8">
                      {item.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card 4: Important Concepts */}
          {analysis.important_concepts && analysis.important_concepts.length > 0 && (
            <div className="bg-[#FFFDFC] rounded-2xl p-6 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9]">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#E9D9C9]">
                <Lightbulb className="w-5 h-5 text-[#DC8043]" />
                <h3 className="text-base font-bold text-[#493323]">
                  4. Important Concepts
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {analysis.important_concepts.map((conceptItem, idx) => (
                  <div
                    key={idx}
                    className="bg-[#F8E5D2] rounded-xl p-4 shadow-[inset_3px_3px_6px_#E8DCCD,inset_-3px_-3px_6px_#FFFFFF]"
                  >
                    <h4 className="text-sm font-bold text-[#DC8043] mb-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#DC8043]"></span>
                      {conceptItem.concept}
                    </h4>
                    <p className="text-sm text-[#493323] leading-relaxed pl-4">
                      {conceptItem.simple_explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card 5: Real-World Examples */}
          {analysis.real_world_examples && analysis.real_world_examples.length > 0 && (
            <div className="bg-[#FFFDFC] rounded-2xl p-6 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9]">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E9D9C9]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#DC8043]" />
                  <h3 className="text-base font-bold text-[#493323]">
                    5. Real-World Examples
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-[#DC8043] bg-[#F8E5D2] px-2.5 py-0.5 rounded-lg shadow-[inset_1px_1px_3px_#E8DCCD]">
                  Practical Scenarios
                </span>
              </div>
              <div className="space-y-3">
                {analysis.real_world_examples.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-[#F8E5D2] rounded-xl p-4 shadow-[inset_3px_3px_6px_#E8DCCD,inset_-3px_-3px_6px_#FFFFFF]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-[#493323]">
                        {item.concept}
                      </h4>
                      <span className="text-[10px] font-bold text-[#DC8043] bg-[#FFFDFC] px-2 py-0.5 rounded-md border border-[#E9D9C9] shadow-[1px_1px_3px_#E8DCCD,-1px_-1px_3px_#FFFFFF]">
                        ✨ AI Illustration
                      </span>
                    </div>
                    <p className="text-sm text-[#493323] leading-relaxed mb-2">
                      {item.example}
                    </p>
                    <div className="text-[11px] text-[#8C7767] italic bg-[#FFFDFC] px-3 py-1.5 rounded-lg border border-[#E9D9C9]">
                      Note: This example is generated by AI to illustrate how this concept applies in practical scenarios.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card: Concept Relationships (if in-depth) */}
          {analysis.concept_relationships && analysis.concept_relationships.length > 0 && (
            <div className="bg-[#FFFDFC] rounded-2xl p-6 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9]">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#E9D9C9]">
                <Network className="w-5 h-5 text-[#DC8043]" />
                <h3 className="text-base font-bold text-[#493323]">
                  Concept Relationships
                </h3>
              </div>
              <div className="space-y-3">
                {analysis.concept_relationships.map((rel, idx) => (
                  <div key={idx} className="bg-[#F8E5D2] rounded-xl p-4 shadow-[inset_3px_3px_6px_#E8DCCD,inset_-3px_-3px_6px_#FFFFFF]">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#493323] mb-1">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#FFFDFC] border border-[#E9D9C9] shadow-[1px_1px_3px_#E8DCCD,-1px_-1px_3px_#FFFFFF]">
                        {rel.concept_a}
                      </span>
                      <span className="text-[#DC8043]">↔</span>
                      <span className="px-2.5 py-0.5 rounded-md bg-[#FFFDFC] border border-[#E9D9C9] shadow-[1px_1px_3px_#E8DCCD,-1px_-1px_3px_#FFFFFF]">
                        {rel.concept_b}
                      </span>
                    </div>
                    <p className="text-sm text-[#493323] leading-relaxed mt-1.5">
                      {rel.relationship}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card 8: Key Takeaways */}
          <div className="bg-[#FFFDFC] rounded-2xl p-6 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9]">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#E9D9C9]">
              <CheckCircle className="w-5 h-5 text-[#DC8043]" />
              <h3 className="text-base font-bold text-[#493323]">
                8. Key Takeaways
              </h3>
            </div>
            {analysis.key_points && analysis.key_points.length > 0 ? (
              <ul className="space-y-2.5">
                {analysis.key_points.map((point, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-sm text-[#493323]">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#DC8043] text-white flex items-center justify-center text-xs font-bold mt-0.5 shadow-[1px_1px_3px_#E8DCCD]">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#8C7767]">No specific key takeaways identified.</p>
            )}
          </div>

          {/* Card 9: Conclusion */}
          <div className="bg-[#FFFDFC] rounded-2xl p-6 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9]">
            <h3 className="text-base font-bold text-[#493323] mb-2 pb-2 border-b border-[#E9D9C9]">
              9. Conclusion
            </h3>
            <p className="text-sm text-[#493323] leading-relaxed">
              {analysis.conclusions || 'No explicit conclusion provided in the document.'}
            </p>
          </div>
        </div>

        {/* Right Column: Technical Terms, Dates & Numbers, People & Orgs, Quick Revision */}
        <div className="space-y-6">
          {/* Card 10: Quick Revision */}
          {analysis.quick_revision_notes && analysis.quick_revision_notes.length > 0 && (
            <div className="bg-[#FFFDFC] rounded-2xl p-5 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9]">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#E9D9C9]">
                <Bookmark className="w-4 h-4 text-[#DC8043]" />
                <h4 className="text-sm font-bold text-[#493323]">
                  10. Quick Revision
                </h4>
              </div>
              <ul className="space-y-2">
                {analysis.quick_revision_notes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-[#493323] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#548A68] flex-shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Card 6: Important Technical Terms */}
          {analysis.technical_terms && analysis.technical_terms.length > 0 && (
            <div className="bg-[#FFFDFC] rounded-2xl p-5 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9]">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#E9D9C9]">
                <BookMarked className="w-4 h-4 text-[#DC8043]" />
                <h4 className="text-sm font-bold text-[#493323]">
                  6. Important Technical Terms
                </h4>
              </div>
              <div className="space-y-2.5">
                {analysis.technical_terms.map((termItem, idx) => (
                  <div key={idx} className="bg-[#F8E5D2] rounded-xl p-3 shadow-[inset_2px_2px_5px_#E8DCCD,inset_-2px_-2px_5px_#FFFFFF] text-xs">
                    <span className="font-bold text-[#DC8043] block font-mono mb-0.5">
                      {termItem.term}
                    </span>
                    <span className="text-[#493323] block leading-relaxed">
                      {termItem.definition}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card 7: Important Dates and Numbers */}
          <div className="bg-[#FFFDFC] rounded-2xl p-5 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9] space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#E9D9C9]">
                <Calendar className="w-4 h-4 text-[#DC8043]" />
                <h4 className="text-sm font-bold text-[#493323]">
                  7. Important Dates and Numbers
                </h4>
              </div>

              {/* Dates */}
              <div className="space-y-2 mb-3">
                <span className="text-[11px] font-bold text-[#8C7767] uppercase tracking-wider block">
                  Important Dates:
                </span>
                {analysis.important_dates && analysis.important_dates.length > 0 ? (
                  analysis.important_dates.map((item, idx) => (
                    <div key={idx} className="bg-[#F8E5D2] rounded-xl p-2.5 shadow-[inset_2px_2px_5px_#E8DCCD,inset_-2px_-2px_5px_#FFFFFF] text-xs">
                      <span className="font-bold text-[#DC8043] block mb-0.5">
                        {item.date}
                      </span>
                      <span className="text-[#493323] block">
                        {item.description || 'Mentioned in document'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#8C7767]">No dates identified.</p>
                )}
              </div>

              {/* Numbers */}
              <div className="space-y-2 pt-2 border-t border-[#E9D9C9]">
                <span className="text-[11px] font-bold text-[#8C7767] uppercase tracking-wider block">
                  Important Numbers & Metrics:
                </span>
                {analysis.important_numbers && analysis.important_numbers.length > 0 ? (
                  analysis.important_numbers.map((item, idx) => (
                    <div key={idx} className="bg-[#F8E5D2] rounded-xl p-2.5 shadow-[inset_2px_2px_5px_#E8DCCD,inset_-2px_-2px_5px_#FFFFFF] text-xs">
                      <span className="font-bold text-[#DC8043] block font-mono">
                        {item.value}
                      </span>
                      <span className="text-[#493323] block mt-0.5">
                        {item.context || 'Metric from document'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#8C7767]">No key numbers identified.</p>
                )}
              </div>
            </div>
          </div>

          {/* People & Organizations Card */}
          <div className="bg-[#FFFDFC] rounded-2xl p-5 shadow-[5px_5px_12px_#E8DCCD,-5px_-5px_12px_#FFFFFF] border border-[#E9D9C9]">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#E9D9C9]">
              <Users className="w-4 h-4 text-[#DC8043]" />
              <h4 className="text-sm font-bold text-[#493323]">
                People & Organizations
              </h4>
            </div>
            {analysis.people_and_organizations && analysis.people_and_organizations.length > 0 ? (
              <div className="space-y-2">
                {analysis.people_and_organizations.map((item, idx) => (
                  <div key={idx} className="bg-[#F8E5D2] rounded-xl p-2.5 shadow-[inset_2px_2px_5px_#E8DCCD,inset_-2px_-2px_5px_#FFFFFF] text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[#493323]">{item.name}</span>
                      <span className="text-[10px] uppercase font-bold text-[#DC8043] bg-[#FFFDFC] px-2 py-0.5 rounded-md border border-[#E9D9C9] shadow-[1px_1px_3px_#E8DCCD,-1px_-1px_3px_#FFFFFF]">
                        {item.type || 'Entity'}
                      </span>
                    </div>
                    {item.role && (
                      <p className="text-[#8C7767] text-[11px]">{item.role}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#8C7767]">No entities identified.</p>
            )}
          </div>
        </div>
      </div>

      {/* Raw Extracted Text Drawer */}
      {full_text && (
        <div className="bg-[#FFFDFC] rounded-2xl shadow-[4px_4px_10px_#E8DCCD,-4px_-4px_10px_#FFFFFF] border border-[#E9D9C9] overflow-hidden">
          <button
            onClick={() => setShowRawText(!showRawText)}
            className="w-full px-6 py-4 bg-[#FFFDFC] flex items-center justify-between text-left text-xs font-bold text-[#493323] hover:bg-[#F8E5D2]/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#DC8043]" />
              <span>Extracted Document Text ({metadata?.char_count || full_text.length} characters)</span>
            </div>
            <div className="flex items-center gap-1 text-[#8C7767]">
              <span>{showRawText ? 'Hide Raw Text' : 'View Extracted Text'}</span>
              {showRawText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
          {showRawText && (
            <div className="p-5 bg-[#493323] text-[#FBF3EA] text-xs font-mono max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text shadow-[inset_4px_4px_10px_rgba(0,0,0,0.5)]">
              {full_text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
