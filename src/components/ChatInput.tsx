import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Mic,
  MicOff,
  ArrowUp,
  X,
  Code2,
  Compass,
  ChevronDown,
  Sparkles,
  Search,
  Check,
  Zap,
  Globe,
  Lock,
} from 'lucide-react';
import { AIMode, BlobModelId, BLOB_MODELS } from '../types';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  activeMode: AIMode;
  onChangeMode: (mode: AIMode) => void;
  selectedModel: BlobModelId;
  onChangeModel: (model: BlobModelId) => void;
  googleSearchEnabled: boolean;
  onToggleGoogleSearch: () => void;
  isProUnlocked: boolean;
  onOpenUpgradePuzzle: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  activeMode,
  onChangeMode,
  selectedModel,
  onChangeModel,
  googleSearchEnabled,
  onToggleGoogleSearch,
  isProUnlocked,
  onOpenUpgradePuzzle,
}) => {
  const [text, setText] = useState('');
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setShowToolsMenu(false);
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setShowModelMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Web Speech API for the mic button
  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. You can type your request directly.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!text.trim() || isLoading) return;
    onSendMessage(text);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto grow textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  // Label for current model: purely Blob Flash, Blob Pro, or Blob Lite
  const currentModelInfo = BLOB_MODELS[selectedModel];
  const modelShortLabel =
    selectedModel === 'blob-flash' ? 'Blob Flash' : selectedModel === 'blob-pro' ? 'Blob Pro' : 'Blob Lite';

  // Placeholder based on active mode
  const placeholder =
    activeMode === 'canvas'
      ? "Let's write or build together in Canvas..."
      : activeMode === 'deep-research'
      ? 'Enter a topic for comprehensive deep research...'
      : googleSearchEnabled
      ? 'Ask Blob (Google Search enabled)...'
      : 'Ask Blob';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 flex flex-col items-center select-none">
      {/* Input Pill Container */}
      <div
        id="blob-prompt-dock"
        className="w-full bg-[#1e1f20] hover:bg-[#222426] border border-[#2f3136] focus-within:border-[#4b4d54] focus-within:bg-[#202225] rounded-3xl p-2.5 transition-all shadow-xl relative"
      >
        <div className="flex items-end gap-2">
          {/* Add / Tools Button (+ icon) */}
          <div className="relative shrink-0" ref={toolsMenuRef}>
            <button
              id="btn-input-plus"
              type="button"
              onClick={() => setShowToolsMenu((prev) => !prev)}
              title="Add tools & capabilities"
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#9ca3af] hover:text-white hover:bg-[#2d2f34] transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Tools Popup Menu */}
            {showToolsMenu && (
              <div className="absolute bottom-12 left-0 w-72 bg-[#23252a] border border-[#34373e] rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[11px] font-semibold text-[#8b8e96] uppercase tracking-wider px-3 py-1.5">
                  Capabilities & Tools
                </div>

                {/* Google Search Toggle */}
                <button
                  id="btn-toggle-google-search"
                  onClick={() => {
                    onToggleGoogleSearch();
                    setShowToolsMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition-colors ${
                    googleSearchEnabled
                      ? 'bg-blue-500/20 text-blue-300 font-medium'
                      : 'text-[#d1d5db] hover:bg-[#2d3037]'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[#f1f3f5] flex items-center gap-1.5">
                      Google Search
                      <span className="text-[10px] bg-blue-500/30 text-blue-300 px-1.5 py-0.2 rounded font-mono">
                        Live Web
                      </span>
                    </div>
                    <div className="text-[11px] text-[#9ca3af]">Search the web for up-to-date facts</div>
                  </div>
                  {googleSearchEnabled && <Check className="w-4 h-4 text-blue-400" />}
                </button>

                {/* Canvas Mode */}
                <button
                  onClick={() => {
                    onChangeMode(activeMode === 'canvas' ? 'chat' : 'canvas');
                    setShowToolsMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition-colors mt-1 ${
                    activeMode === 'canvas'
                      ? 'bg-pink-500/20 text-pink-300 font-medium'
                      : 'text-[#d1d5db] hover:bg-[#2d3037]'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[#f1f3f5]">Canvas Mode</div>
                    <div className="text-[11px] text-[#9ca3af]">Build games, apps & preview</div>
                  </div>
                  {activeMode === 'canvas' && <Check className="w-4 h-4 text-pink-400" />}
                </button>

                {/* Deep Research */}
                <button
                  onClick={() => {
                    onChangeMode(activeMode === 'deep-research' ? 'chat' : 'deep-research');
                    setShowToolsMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition-colors mt-1 ${
                    activeMode === 'deep-research'
                      ? 'bg-indigo-500/20 text-indigo-300 font-medium'
                      : 'text-[#d1d5db] hover:bg-[#2d3037]'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[#f1f3f5]">Deep Research</div>
                    <div className="text-[11px] text-[#9ca3af]">Multi-source deep reasoning</div>
                  </div>
                  {activeMode === 'deep-research' && <Check className="w-4 h-4 text-indigo-400" />}
                </button>
              </div>
            )}
          </div>

          {/* Google Search Capability Pill Badge */}
          {googleSearchEnabled && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/15 text-xs font-medium text-blue-300 border border-blue-500/30 shrink-0">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Google Search</span>
              <button
                onClick={onToggleGoogleSearch}
                className="hover:text-white p-0.5 rounded-full"
                title="Disable Google Search"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Active Mode Pill Badge */}
          {activeMode === 'canvas' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2d2f34] text-xs font-medium text-pink-300 border border-pink-500/30 shrink-0">
              <Code2 className="w-3.5 h-3.5 text-pink-400" />
              <span>Canvas</span>
              <button
                onClick={() => onChangeMode('chat')}
                className="hover:text-white p-0.5 rounded-full"
                title="Remove Canvas mode"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {activeMode === 'deep-research' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#243042] text-xs font-medium text-blue-300 border border-blue-500/30 shrink-0">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span>Deep Research</span>
              <button
                onClick={() => onChangeMode('chat')}
                className="hover:text-white p-0.5 rounded-full"
                title="Remove Deep Research mode"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Prompt Text Input */}
          <textarea
            id="blob-prompt-textarea"
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-[#e3e3e3] placeholder-[#8e9196] text-sm md:text-[15px] outline-none resize-none py-2 px-1 max-h-40 leading-relaxed custom-scrollbar"
          />

          {/* Right Action Cluster: Google Search button, Model Selector Dropdown & Mic & Send */}
          <div className="flex items-center gap-1 shrink-0 pb-0.5">
            {/* Quick Google Search Toggle Button */}
            <button
              type="button"
              onClick={onToggleGoogleSearch}
              title={googleSearchEnabled ? 'Google Search active (click to disable)' : 'Enable Google Search'}
              className={`p-1.5 rounded-full transition-colors ${
                googleSearchEnabled
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  : 'text-[#9ca3af] hover:text-[#e3e3e3] hover:bg-[#2d2f34]'
              }`}
            >
              <Globe className="w-4 h-4" />
            </button>

            {/* Model Selector Dropdown */}
            <div className="relative" ref={modelMenuRef}>
              <button
                id="btn-model-selector"
                type="button"
                onClick={() => setShowModelMenu((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-[#c4c7c5] hover:text-white hover:bg-[#2d2f34] transition-colors"
                title={`Selected: ${currentModelInfo.name}`}
              >
                <span>{modelShortLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8e9196]" />
              </button>

              {/* Model Dropdown Menu */}
              {showModelMenu && (
                <div className="absolute bottom-12 right-0 w-72 bg-[#23252a] border border-[#34373e] rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-[#8b8e96] uppercase tracking-wider">
                    Blob Intelligence Models
                  </div>

                  {/* Blob Flash */}
                  <button
                    onClick={() => {
                      onChangeModel('blob-flash');
                      setShowModelMenu(false);
                    }}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-colors ${
                      selectedModel === 'blob-flash'
                        ? 'bg-pink-500/15 border border-pink-500/30'
                        : 'hover:bg-[#2d3037]'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">Blob Flash</span>
                        <span className="text-[10px] bg-pink-500/30 text-pink-300 px-1.5 py-0.2 rounded font-medium">
                          Default
                        </span>
                      </div>
                      <div className="text-[11px] text-[#9ca3af] mt-0.5">
                        Swift responses, game building, creative work.
                      </div>
                    </div>
                  </button>

                  {/* Blob Pro (Requires 24-piece jigsaw puzzle if locked) */}
                  <button
                    onClick={() => {
                      if (!isProUnlocked) {
                        onOpenUpgradePuzzle();
                      } else {
                        onChangeModel('blob-pro');
                      }
                      setShowModelMenu(false);
                    }}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-colors mt-1 ${
                      selectedModel === 'blob-pro'
                        ? 'bg-blue-500/15 border border-blue-500/30'
                        : 'hover:bg-[#2d3037]'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">Blob Pro</span>
                        {!isProUnlocked ? (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-medium flex items-center gap-1 border border-amber-500/30">
                            <Lock className="w-2.5 h-2.5" />
                            Solve Puzzle to Unlock
                          </span>
                        ) : (
                          <span className="text-[10px] bg-blue-500/30 text-blue-300 px-1.5 py-0.2 rounded font-medium">
                            Unlocked
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#9ca3af] mt-0.5">
                        Deep reasoning, STEM logic, and advanced coding.
                      </div>
                    </div>
                  </button>

                  {/* Blob Lite */}
                  <button
                    onClick={() => {
                      onChangeModel('blob-lite');
                      setShowModelMenu(false);
                    }}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-colors mt-1 ${
                      selectedModel === 'blob-lite'
                        ? 'bg-emerald-500/15 border border-emerald-500/30'
                        : 'hover:bg-[#2d3037]'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">Blob Lite</span>
                        <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded font-medium">
                          Lightweight
                        </span>
                      </div>
                      <div className="text-[11px] text-[#9ca3af] mt-0.5">
                        Ultra-light, rapid latency, and instant chats.
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Microphone Icon (Speech-to-text) */}
            <button
              id="btn-voice-input"
              type="button"
              onClick={toggleListening}
              title={isListening ? 'Listening... click to stop' : 'Voice input'}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-[#9ca3af] hover:text-white hover:bg-[#2d2f34]'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send Button */}
            {text.trim() && (
              <button
                id="btn-send-prompt"
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                title="Send prompt"
                className="w-8 h-8 rounded-full bg-white text-black hover:bg-[#e3e3e3] flex items-center justify-center transition-all disabled:opacity-50 shadow-md active:scale-95"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
