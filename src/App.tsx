/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  SquarePen,
  Code2,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Copy,
  MoreHorizontal,
  Compass,
  Check,
  PanelLeft,
  Globe,
  Lock,
} from 'lucide-react';
import { GooeyPinkLogo } from './components/GooeyPinkLogo';
import { Sidebar } from './components/Sidebar';
import { CanvasPanel } from './components/CanvasPanel';
import { ChatInput } from './components/ChatInput';
import { DeepResearchView } from './components/DeepResearchView';
import { SettingsModal } from './components/SettingsModal';
import { UpgradePuzzleModal } from './components/UpgradePuzzleModal';
import {
  AIMode,
  BlobModelId,
  ChatMessage,
  CanvasArtifact,
  RecentSession,
  ResearchStep,
} from './types';

export default function App() {
  // Configured to start with sidebar collapsed (pushed in) and no canvas open
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<BlobModelId>('blob-flash');
  const [activeMode, setActiveMode] = useState<AIMode>('chat');
  const [activeCanvas, setActiveCanvas] = useState<CanvasArtifact | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpgradePuzzleOpen, setIsUpgradePuzzleOpen] = useState(false);
  const [isProUnlocked, setIsProUnlocked] = useState(false);
  const [googleSearchEnabled, setGoogleSearchEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // User chat sessions list (no pre-seeded chats)
  const [recents, setRecents] = useState<RecentSession[]>([]);

  // Current active chat messages (empty by default)
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle New Chat
  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setActiveCanvas(null);
    setActiveMode('chat');
  };

  // Handle Session Selection (Remembers which chat you do)
  const handleSelectSession = (sessionId: string) => {
    const session = recents.find((s) => s.id === sessionId);
    if (!session) return;

    setActiveSessionId(sessionId);
    setMessages(session.messages || []);
    setActiveCanvas(session.canvas || null);
    if (session.mode) {
      setActiveMode(session.mode);
    }
  };

  // Helper to persist/update session in recents
  const syncCurrentSession = (
    currentSessionId: string | null,
    updatedMessages: ChatMessage[],
    canvasItem: CanvasArtifact | null,
    mode: AIMode
  ) => {
    if (updatedMessages.length === 0) return currentSessionId;

    let targetId = currentSessionId;
    if (!targetId) {
      targetId = `session-${Date.now()}`;
      setActiveSessionId(targetId);
    }

    // Determine title from first user message
    const firstUserMsg = updatedMessages.find((m) => m.role === 'user');
    let title = firstUserMsg ? firstUserMsg.content.slice(0, 36) : 'New Blob Chat';
    if (firstUserMsg && firstUserMsg.content.length > 36) title += '...';

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setRecents((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === targetId);
      const updatedItem: RecentSession = {
        id: targetId!,
        title,
        timestamp,
        hasCanvas: !!canvasItem,
        messages: updatedMessages,
        canvas: canvasItem,
        mode,
      };

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = updatedItem;
        return copy;
      }
      return [updatedItem, ...prev];
    });

    return targetId;
  };

  // Handle Send Message
  const handleSendMessage = async (userPrompt: string) => {
    if (!userPrompt.trim()) return;

    const userMessageId = `user-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedAfterUser = [...messages, newMsg];
    setMessages(updatedAfterUser);
    setIsLoading(true);

    const activeSession = syncCurrentSession(
      activeSessionId,
      updatedAfterUser,
      activeCanvas,
      activeMode
    );

    try {
      // If in deep research mode, start with research steps
      let researchSteps: ResearchStep[] | undefined = undefined;
      if (activeMode === 'deep-research') {
        researchSteps = [
          { title: 'Formulating research queries for Blob intelligence', status: 'complete' },
          { title: 'Synthesizing technical documentation and sources', status: 'in-progress' },
          { title: 'Drafting structured comprehensive brief', status: 'pending' },
        ];
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userPrompt,
          model: selectedModel,
          mode: activeMode,
          currentCode: activeCanvas?.code || '',
          history: updatedAfterUser.slice(-6),
          searchEnabled: googleSearchEnabled,
        }),
      });

      const data = await response.json();

      let canvasResult = activeCanvas;
      if (data.canvas) {
        canvasResult = data.canvas;
        setActiveCanvas(data.canvas);
        setActiveMode('canvas');
      }

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content:
          data.reply ||
          (data.canvas
            ? "I've created this interactive game for you in Canvas! You can play it right here with keyboard or touch controls, tweak the code in the Code editor, or open it in a fresh new tab."
            : "I'm here and ready to help! What would you like to build, explore, or create next?"),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        canvas: canvasResult || undefined,
        searchGroundingSources: data.searchGroundingSources,
        researchSteps:
          activeMode === 'deep-research'
            ? [
                { title: 'Formulating research queries for Blob intelligence', status: 'complete' },
                { title: 'Synthesizing technical documentation and sources', status: 'complete' },
                { title: 'Drafting structured comprehensive brief', status: 'complete' },
              ]
            : undefined,
      };

      const updatedAfterAi = [...updatedAfterUser, assistantMsg];
      setMessages(updatedAfterAi);
      syncCurrentSession(activeSession, updatedAfterAi, canvasResult, activeMode);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Hey blob user, I ran into a brief hiccup while loading (${err?.message || 'network latency'}). Please try sending your request again!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const updatedAfterErr = [...updatedAfterUser, errorMsg];
      setMessages(updatedAfterErr);
      syncCurrentSession(activeSession, updatedAfterErr, activeCanvas, activeMode);
    } finally {
      setIsLoading(false);
    }
  };

  // Open Canvas in a new tab:
  const handleOpenGameInNewTab = (canvasItem?: CanvasArtifact) => {
    const target = canvasItem || activeCanvas;
    if (!target) return;

    try {
      const serverUrl = `/canvas-preview/${target.id}`;
      const newWin = window.open(serverUrl, '_blank');
      if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
        const blob = new Blob([target.code], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      }
    } catch (e) {
      const blob = new Blob([target.code], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    }
  };

  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Unlock Blob Pro when jigsaw puzzle is completed
  const handleUnlockPro = () => {
    setIsProUnlocked(true);
    setSelectedModel('blob-pro');
  };

  const isChatEmpty = messages.length === 0;

  // Active model display text without "Powered by Gemini"
  const modelDisplayName =
    selectedModel === 'blob-flash'
      ? 'Blob Flash'
      : selectedModel === 'blob-pro'
      ? 'Blob Pro'
      : 'Blob Lite';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#131314] text-[#e3e3e3] font-sans">
      {/* Collapsible Left Sidebar (Starts collapsed/pushed in) */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        onNewChat={handleNewChat}
        recents={recents}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#131314]">
        {/* Top App Header */}
        <header className="h-14 px-4 flex items-center justify-between border-b border-[#1f2023] bg-[#131314] shrink-0 z-20 select-none">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                id="btn-header-open-sidebar"
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1e1f20] transition-colors"
                title="Open sidebar"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-2 cursor-pointer" onClick={handleNewChat}>
              <GooeyPinkLogo size={24} />
              <span className="text-base font-semibold text-[#f1f3f5] tracking-tight">
                Blob AI
              </span>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {modelDisplayName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Top Right: Upgrade to Pro Button with 24-piece jigsaw puzzle */}
            <button
              id="btn-upgrade-to-pro"
              onClick={() => setIsUpgradePuzzleOpen(true)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all active:scale-95 ${
                isProUnlocked
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'bg-[#1b72e8] hover:bg-[#1967d2] text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>{isProUnlocked ? 'Blob Pro Active' : 'Upgrade to Pro'}</span>
            </button>

            {/* New Chat Pen Button */}
            <button
              id="btn-header-new-chat"
              onClick={handleNewChat}
              title="New Chat"
              className="p-2 rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1e1f20] transition-colors"
            >
              <SquarePen className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Workspace Body: Split View if Canvas is active, or Centered Chat */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Column: Chat Conversation Stream */}
          <div
            className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${
              activeCanvas ? 'max-w-xl lg:max-w-2xl border-r border-[#1f2023]' : 'w-full'
            }`}
          >
            {isChatEmpty ? (
              /* Clean Welcome State for "blob user" */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none relative">
                {/* Subtle deep blue radial glow behind greeting */}
                <div className="absolute w-96 h-96 rounded-full bg-blue-900/15 blur-3xl pointer-events-none -z-10" />

                <div className="mb-8">
                  <div className="flex justify-center mb-4">
                    <GooeyPinkLogo size={52} />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-[#e3e3e3]">
                    Hi blob user, what's the move?
                  </h1>
                  <p className="text-sm text-[#8e9196] mt-2">
                    Build games, search Google, preview in canvas, or run deep research.
                  </p>
                </div>

                {/* Quick Prompts to jump straight in */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full mb-8">
                  <button
                    onClick={() => {
                      setActiveMode('canvas');
                      handleSendMessage(
                        'Create a Roblox Rainbow Obby game with moving platforms, sound and touch joystick!'
                      );
                    }}
                    className="p-3.5 rounded-2xl bg-[#1e1f20] hover:bg-[#25272a] border border-[#2d2f34] text-left transition-all group"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-pink-400 mb-1">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Canvas Game</span>
                    </div>
                    <div className="text-xs text-[#d1d5db]">
                      Roblox Rainbow Obby with touch joystick & new tab preview
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setGoogleSearchEnabled(true);
                      handleSendMessage(
                        'Search Google for the latest tech breakthroughs this week and summarize them'
                      );
                    }}
                    className="p-3.5 rounded-2xl bg-[#1e1f20] hover:bg-[#25272a] border border-[#2d2f34] text-left transition-all group"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Google Search</span>
                    </div>
                    <div className="text-xs text-[#d1d5db]">
                      Query live web search with grounded citations & facts
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              /* Active Chat Message Stream */
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6 custom-scrollbar">
                {messages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      {/* Message Bubble */}
                      <div
                        className={`max-w-2xl rounded-3xl p-4 text-sm leading-relaxed ${
                          isUser
                            ? 'bg-[#27292d] text-[#f1f3f5] rounded-br-sm'
                            : 'bg-transparent text-[#e3e3e3] px-1'
                        }`}
                      >
                        {/* If AI message, show pink gooey logo */}
                        {!isUser && (
                          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-pink-400">
                            <GooeyPinkLogo size={18} animate={false} />
                            <span>Blob AI</span>
                          </div>
                        )}

                        <div className="whitespace-pre-wrap">{msg.content}</div>

                        {/* Search Grounding Sources (if Google Search was used) */}
                        {msg.searchGroundingSources && msg.searchGroundingSources.length > 0 && (
                          <div className="mt-3 p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs">
                            <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-1.5">
                              <Globe className="w-3.5 h-3.5" />
                              <span>Grounded with Google Search</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.searchGroundingSources.map((source, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[11px] truncate max-w-[200px]"
                                  title={source}
                                >
                                  {source}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Interactive Deep Research Progress (if applicable) */}
                        {msg.researchSteps && (
                          <DeepResearchView
                            topic="Roblox Rainbow Obby Architecture & Physics"
                            steps={msg.researchSteps}
                          />
                        )}

                        {/* Canvas Card Artifact */}
                        {msg.canvas && (
                          <div className="mt-4 p-4 rounded-2xl bg-[#1e1f24] border border-[#2f3138] shadow-lg">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                                  <Code2 className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-white">
                                    {msg.canvas.title}
                                  </div>
                                  <div className="text-xs text-[#9ca3af]">
                                    {msg.timestamp}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Open in Canvas Split View */}
                                <button
                                  id="btn-open-canvas-split"
                                  onClick={() => setActiveCanvas(msg.canvas!)}
                                  className="px-4 py-2 rounded-full bg-[#1b72e8] hover:bg-[#1967d2] text-white text-xs font-bold transition-all active:scale-95 shadow-md"
                                >
                                  Open
                                </button>

                                {/* Direct Open in New Tab Button */}
                                <button
                                  id="btn-open-canvas-newtab-card"
                                  onClick={() => handleOpenGameInNewTab(msg.canvas)}
                                  title="Open game preview in new tab"
                                  className="p-2 rounded-full bg-[#27292f] hover:bg-[#32353c] text-pink-300 border border-pink-500/30 transition-all"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Bar for AI messages */}
                      {!isUser && (
                        <div className="flex items-center gap-1 mt-2 text-[#71717a] text-xs px-2">
                          <button
                            title="Helpful"
                            className="p-1.5 rounded-lg hover:text-white hover:bg-[#1f2024] transition-colors"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Not helpful"
                            className="p-1.5 rounded-lg hover:text-white hover:bg-[#1f2024] transition-colors"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleSendMessage('Regenerate and enhance response')}
                            title="Regenerate response"
                            className="p-1.5 rounded-lg hover:text-white hover:bg-[#1f2024] transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCopyMessage(msg.content, index)}
                            title={copiedIndex === index ? 'Copied' : 'Copy'}
                            className="p-1.5 rounded-lg hover:text-white hover:bg-[#1f2024] transition-colors"
                          >
                            {copiedIndex === index ? (
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            title="More"
                            className="p-1.5 rounded-lg hover:text-white hover:bg-[#1f2024] transition-colors"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-center gap-3 p-4 text-xs text-[#9ca3af]">
                    <GooeyPinkLogo size={20} />
                    <span className="animate-pulse">Blob AI is generating response...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Bottom Floating Prompt Dock */}
            <div className="p-4 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent shrink-0">
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                activeMode={activeMode}
                onChangeMode={setActiveMode}
                selectedModel={selectedModel}
                onChangeModel={setSelectedModel}
                googleSearchEnabled={googleSearchEnabled}
                onToggleGoogleSearch={() => setGoogleSearchEnabled((prev) => !prev)}
                isProUnlocked={isProUnlocked}
                onOpenUpgradePuzzle={() => setIsUpgradePuzzleOpen(true)}
              />
            </div>
          </div>

          {/* Right Column: Interactive Canvas Panel */}
          {activeCanvas && (
            <div className="flex-1 h-full p-3 lg:p-4 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
              <CanvasPanel
                canvas={activeCanvas}
                onClose={() => setActiveCanvas(null)}
                onUpdateCode={(updatedCode) => {
                  setActiveCanvas((prev) => (prev ? { ...prev, code: updatedCode } : null));
                  // Also persist back to backend
                  fetch('/api/canvas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id: activeCanvas.id,
                      title: activeCanvas.title,
                      code: updatedCode,
                      type: activeCanvas.type,
                    }),
                  });
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
      />

      {/* 24-Piece Jigsaw Puzzle Upgrade Modal */}
      <UpgradePuzzleModal
        isOpen={isUpgradePuzzleOpen}
        onClose={() => setIsUpgradePuzzleOpen(false)}
        onUnlockPro={handleUnlockPro}
        isProUnlocked={isProUnlocked}
      />
    </div>
  );
}
