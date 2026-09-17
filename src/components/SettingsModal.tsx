import React from 'react';
import { X, Sparkles, Zap, Cpu, Check, ShieldCheck, Info } from 'lucide-react';
import { GooeyPinkLogo } from './GooeyPinkLogo';
import { BLOB_MODELS, BlobModelId } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: BlobModelId;
  onSelectModel: (model: BlobModelId) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  onSelectModel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="blob-settings-modal-backdrop"
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in select-none"
    >
      <div
        id="blob-settings-dialog"
        className="bg-[#1e1f23] border border-[#2f3137] rounded-3xl w-full max-w-lg p-6 shadow-2xl overflow-hidden relative text-[#e3e3e3]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2d2f35]">
          <div className="flex items-center gap-3">
            <GooeyPinkLogo size={30} />
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Blob AI Settings
                <span className="text-[10px] bg-pink-500/20 text-pink-300 font-mono px-2 py-0.5 rounded-full border border-pink-500/30">
                  Blob Native
                </span>
              </h2>
              <p className="text-xs text-[#9ca3af]">Models, Canvas engine and preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#9ca3af] hover:text-white hover:bg-[#282a30] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Model Architecture Mapping */}
        <div className="mt-5">
          <div className="text-xs font-bold uppercase tracking-wider text-[#a1a1aa] mb-3">
            Default AI Model
          </div>
          <div className="space-y-2.5">
            {Object.values(BLOB_MODELS).map((m) => {
              const isSelected = selectedModel === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => onSelectModel(m.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                    isSelected
                      ? 'bg-pink-500/10 border-pink-500/40 shadow-sm'
                      : 'bg-[#18191c] border-[#292b31] hover:bg-[#22242a]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'bg-pink-500 text-white shadow-md' : 'bg-[#26282e] text-[#9ca3af]'
                    }`}
                  >
                    {m.id === 'blob-flash' ? (
                      <Sparkles className="w-4 h-4" />
                    ) : m.id === 'blob-pro' ? (
                      <Zap className="w-4 h-4" />
                    ) : (
                      <Cpu className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{m.name}</span>
                        <span className="text-[11px] font-mono text-pink-400 bg-pink-500/20 px-2 py-0.5 rounded-md">
                          {m.tagline}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-pink-400" />}
                    </div>
                    <p className="text-xs text-[#9ca3af] mt-1 leading-relaxed">{m.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-5 p-3.5 rounded-2xl bg-[#18191d] border border-[#2b2d34] flex items-start gap-3 text-xs text-[#9ca3af]">
          <Info className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Full-Stack Canvas Integration:</span> All
            canvas games created by Blob can be played in-app, edited in real-time, or popped out
            into a dedicated browser tab preview.
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-[#2d2f35] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
