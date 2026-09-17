import React from 'react';
import { Compass, CheckCircle2, Loader2, Sparkles, FileText, ArrowRight } from 'lucide-react';
import { ResearchStep } from '../types';

interface DeepResearchViewProps {
  topic: string;
  steps: ResearchStep[];
  reportContent?: string;
  onClose?: () => void;
}

export const DeepResearchView: React.FC<DeepResearchViewProps> = ({
  topic,
  steps,
  reportContent,
}) => {
  return (
    <div className="w-full bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 my-3 shadow-xl select-none">
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#2a2c33]">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
          <Compass className="w-4 h-4 animate-spin-slow" />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            Deep Research in Progress
          </div>
          <div className="text-sm font-bold text-white truncate max-w-md">{topic}</div>
        </div>
      </div>

      {/* Steps List */}
      <div className="py-4 space-y-3">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-3 text-xs">
            {step.status === 'complete' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : step.status === 'in-progress' ? (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0 mt-0.5" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-gray-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div
                className={`font-medium ${
                  step.status === 'complete'
                    ? 'text-[#e5e7eb]'
                    : step.status === 'in-progress'
                    ? 'text-blue-300'
                    : 'text-[#6b7280]'
                }`}
              >
                {step.title}
              </div>
              {step.details && (
                <div className="text-[11px] text-[#9ca3af] mt-0.5 font-mono bg-[#1f2127] p-1.5 rounded">
                  {step.details}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Generated Report */}
      {reportContent && (
        <div className="mt-4 pt-3 border-t border-[#2a2c33]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#d1d5db] mb-2">
            <FileText className="w-3.5 h-3.5 text-pink-400" />
            <span>Synthesized Research Brief</span>
          </div>
          <div className="text-xs text-[#d1d5db] leading-relaxed whitespace-pre-line bg-[#131417] p-3 rounded-xl border border-[#232428]">
            {reportContent}
          </div>
        </div>
      )}
    </div>
  );
};
