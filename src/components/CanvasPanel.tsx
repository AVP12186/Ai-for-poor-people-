import React, { useState, useRef } from 'react';
import {
  ExternalLink,
  Download,
  RotateCcw,
  Share2,
  X,
  Code2,
  Play,
  Copy,
  Check,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { CanvasArtifact } from '../types';

interface CanvasPanelProps {
  canvas: CanvasArtifact;
  onClose: () => void;
  onUpdateCode: (newCode: string) => void;
}

export const CanvasPanel: React.FC<CanvasPanelProps> = ({
  canvas,
  onClose,
  onUpdateCode,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [editorCode, setEditorCode] = useState(canvas.code);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync if canvas changes from parent
  React.useEffect(() => {
    setEditorCode(canvas.code);
    setIframeKey((prev) => prev + 1);
  }, [canvas.code, canvas.id]);

  // Dedicated Open in New Tab feature:
  // "also make a thing that if a canvas game is previewing. You can open it in a new tab and preview it."
  const handleOpenInNewTab = () => {
    try {
      // First try opening via server endpoint
      const serverUrl = `/canvas-preview/${canvas.id}`;
      const newWin = window.open(serverUrl, '_blank');
      
      // Fallback: If blocked or offline, open via Blob URL
      if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
        const blob = new Blob([editorCode || canvas.code], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      }
    } catch (e) {
      const blob = new Blob([editorCode || canvas.code], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([editorCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${canvas.title.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(editorCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const fullUrl = `${window.location.origin}/canvas-preview/${canvas.id}`;
    navigator.clipboard.writeText(fullUrl);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleRestart = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleApplyCodeEdits = () => {
    onUpdateCode(editorCode);
    setIframeKey((prev) => prev + 1);
    setActiveTab('preview');
  };

  return (
    <div
      id="blob-canvas-panel"
      className="h-full w-full flex flex-col bg-[#131417] border border-[#27272a] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300"
    >
      {/* Canvas Top Bar Header (Matches IMG_0478) */}
      <div className="h-14 px-4 bg-[#1b1c20] border-b border-[#2a2b30] flex items-center justify-between shrink-0 select-none">
        {/* Title */}
        <div className="flex items-center gap-2.5 overflow-hidden pr-2">
          <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
          <span className="text-sm font-semibold text-[#f1f3f5] truncate">
            {canvas.title}
          </span>
        </div>

        {/* Center Pill: Code / Preview switch (Matching Screenshot IMG_0478) */}
        <div className="flex items-center bg-[#25272c] p-1 rounded-full border border-[#34373d]">
          <button
            id="btn-canvas-tab-code"
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeTab === 'code'
                ? 'bg-[#3b3e45] text-white shadow-sm'
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            Code
          </button>
          <button
            id="btn-canvas-tab-preview"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeTab === 'preview'
                ? 'bg-[#3b3e45] text-white shadow-sm'
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            Preview
          </button>
        </div>

        {/* Right Action Icons (Matches Screenshot IMG_0478) */}
        <div className="flex items-center gap-1">
          {/* OPEN IN NEW TAB BUTTON (Prominent & Tooltipped) */}
          <button
            id="btn-canvas-open-new-tab"
            onClick={handleOpenInNewTab}
            title="Open game preview in new tab"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-pink-300 hover:text-white hover:bg-pink-500/20 border border-pink-500/30 transition-all shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Tab</span>
          </button>

          <button
            id="btn-canvas-download"
            onClick={handleDownload}
            title="Download game code"
            className="p-2 rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#27272a] transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            id="btn-canvas-refresh"
            onClick={handleRestart}
            title="Restart game"
            className="p-2 rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#27272a] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            id="btn-canvas-share"
            onClick={handleShare}
            title={shared ? 'Copied link!' : 'Share game'}
            className="p-2 rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#27272a] transition-colors relative"
          >
            {shared ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          <div className="w-[1px] h-5 bg-[#2d2f36] mx-1" />

          <button
            id="btn-canvas-close"
            onClick={onClose}
            title="Close Canvas"
            className="p-2 rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#27272a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Body View */}
      <div className="flex-1 relative overflow-hidden bg-[#0d0e11]">
        {activeTab === 'preview' ? (
          <div className="w-full h-full relative">
            {/* Quick action helper pill to open in new tab */}
            <div className="absolute top-3 right-4 z-20 pointer-events-auto opacity-75 hover:opacity-100 transition-opacity">
              <button
                onClick={handleOpenInNewTab}
                className="bg-black/70 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg hover:bg-pink-600 transition-all"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Play Fullscreen in New Tab</span>
              </button>
            </div>

            {/* Live Interactive Iframe */}
            <iframe
              key={iframeKey}
              ref={iframeRef}
              title={canvas.title}
              srcDoc={editorCode}
              sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-modals allow-downloads"
              className="w-full h-full border-none bg-black"
            />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col bg-[#14151a]">
            {/* Code Toolbar */}
            <div className="h-10 px-4 bg-[#191a20] border-b border-[#25272e] flex items-center justify-between text-xs text-[#9ca3af]">
              <div className="flex items-center gap-2 font-mono">
                <Code2 className="w-3.5 h-3.5 text-pink-400" />
                <span>index.html (Game / Canvas Source)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#23252c] text-white hover:bg-[#2d3038] transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleApplyCodeEdits}
                  className="flex items-center gap-1 px-3 py-1 rounded bg-pink-600 text-white font-medium hover:bg-pink-500 transition-colors shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Changes</span>
                </button>
              </div>
            </div>

            {/* Code Editor */}
            <textarea
              id="canvas-code-textarea"
              value={editorCode}
              onChange={(e) => setEditorCode(e.target.value)}
              className="flex-1 w-full bg-[#0e0f13] text-[#e2e8f0] font-mono text-xs p-4 outline-none resize-none leading-relaxed selection:bg-pink-500/30 custom-scrollbar"
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};
