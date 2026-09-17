import React, { useState } from 'react';
import {
  SquarePen,
  Search,
  Image as ImageIcon,
  LayoutGrid,
  Gem,
  Plus,
  Settings,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { GooeyPinkLogo } from './GooeyPinkLogo';
import { RecentSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  recents: RecentSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  onNewChat,
  recents,
  activeSessionId,
  onSelectSession,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const filteredRecents = searchQuery
    ? recents.filter((r) => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : recents;

  if (!isOpen) {
    return (
      <aside
        id="blob-sidebar-collapsed"
        className="w-[68px] h-full bg-[#18191b] border-r border-[#27272a] flex flex-col items-center py-4 px-2 select-none z-30 transition-all duration-300"
      >
        <button
          id="btn-expand-sidebar"
          onClick={onToggle}
          title="Expand menu"
          className="p-2.5 rounded-xl text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#27272a] transition-colors mb-4"
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        <button
          id="btn-new-chat-collapsed"
          onClick={onNewChat}
          title="New chat"
          className="p-2.5 rounded-xl text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#27272a] transition-colors mb-6"
        >
          <SquarePen className="w-5 h-5" />
        </button>

        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={() => {
              onToggle();
              setIsSearching(true);
            }}
            title="Search chats"
            className="p-2.5 rounded-xl text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#27272a] transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            title="Images"
            className="p-2.5 rounded-xl text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#27272a] transition-colors"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <button
            title="Library"
            className="p-2.5 rounded-xl text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#27272a] transition-colors"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            title="Gems"
            className="p-2.5 rounded-xl text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#27272a] transition-colors"
          >
            <Gem className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-auto flex flex-col items-center gap-3">
          <button
            id="btn-settings-collapsed"
            onClick={onOpenSettings}
            title="Settings"
            className="p-2.5 rounded-xl text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#27272a] transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User Avatar */}
          <div
            className="w-8 h-8 rounded-full bg-[#ec4899] text-white font-bold flex items-center justify-center text-sm shadow-md cursor-pointer hover:ring-2 hover:ring-pink-400"
            title="blob user"
            onClick={onOpenSettings}
          >
            B
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      id="blob-sidebar-expanded"
      className="w-[280px] h-full bg-[#18191b] border-r border-[#27272a] flex flex-col select-none z-30 transition-all duration-300"
    >
      {/* Sidebar Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#232427]">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={onNewChat}>
          <GooeyPinkLogo size={26} />
          <span className="text-[17px] font-semibold text-[#f1f3f5] tracking-tight flex items-center gap-1.5">
            Blob
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">
              AI
            </span>
          </span>
        </div>

        <button
          id="btn-collapse-sidebar"
          onClick={onToggle}
          title="Collapse menu"
          className="p-2 rounded-lg text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#27272a] transition-colors"
        >
          <PanelLeftClose className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Top Items */}
      <div className="p-3 space-y-1">
        <button
          id="btn-new-chat-main"
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-full bg-[#202124] text-[#e8eaed] hover:bg-[#2c2d30] text-sm font-medium transition-all text-left shadow-sm"
        >
          <SquarePen className="w-4 h-4 text-pink-400" />
          <span>New chat</span>
        </button>

        {isSearching ? (
          <div className="px-1 py-1">
            <input
              type="text"
              autoFocus
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => {
                if (!searchQuery) setIsSearching(false);
              }}
              className="w-full bg-[#202124] text-xs text-white rounded-lg px-3 py-2 outline-none border border-pink-500/40"
            />
          </div>
        ) : (
          <button
            onClick={() => setIsSearching(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#9ca3af] hover:text-[#e8eaed] hover:bg-[#202124] text-sm transition-colors text-left"
          >
            <Search className="w-4 h-4" />
            <span>Search chats</span>
          </button>
        )}

        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#9ca3af] hover:text-[#e8eaed] hover:bg-[#202124] text-sm transition-colors text-left">
          <ImageIcon className="w-4 h-4" />
          <span>Images</span>
        </button>

        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#9ca3af] hover:text-[#e8eaed] hover:bg-[#202124] text-sm transition-colors text-left">
          <LayoutGrid className="w-4 h-4" />
          <span>Library</span>
        </button>

        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#9ca3af] hover:text-[#e8eaed] hover:bg-[#202124] text-sm transition-colors text-left">
          <Gem className="w-4 h-4" />
          <span>Gems</span>
        </button>
      </div>

      {/* Notebooks Section */}
      <div className="px-4 pt-2 pb-1">
        <div className="text-[12px] font-medium text-[#71717a] uppercase tracking-wider mb-1">
          Notebooks
        </div>
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[#9ca3af] hover:text-[#e8eaed] hover:bg-[#202124] text-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New notebook</span>
        </button>
      </div>

      {/* Recents Section */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 custom-scrollbar">
        <div className="px-2 text-[12px] font-medium text-[#71717a] uppercase tracking-wider mb-2">
          Recents
        </div>

        {filteredRecents.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-[#71717a]">
            No recent chats yet
          </div>
        ) : (
          filteredRecents.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-all group ${
                  isActive
                    ? 'bg-[#23252a] text-[#ffffff] font-medium shadow-sm border border-[#2f3137]'
                    : 'text-[#9ca3af] hover:bg-[#1e1f23] hover:text-[#d1d5db]'
                }`}
              >
                {session.hasCanvas ? (
                  <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                ) : (
                  <MessageSquare className="w-3.5 h-3.5 text-[#6b7280] shrink-0 group-hover:text-pink-400" />
                )}
                <span className="truncate flex-1">{session.title}</span>
              </button>
            );
          })
        )}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-[#232427] flex items-center justify-between">
        <div
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90"
          onClick={onOpenSettings}
        >
          <div className="w-8 h-8 rounded-full bg-[#ec4899] text-white font-bold flex items-center justify-center text-sm shadow-md">
            B
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#f1f3f5]">blob user</span>
            <span className="text-[11px] text-[#71717a]">Blob Free Plan</span>
          </div>
        </div>

        <button
          id="btn-settings-expanded"
          onClick={onOpenSettings}
          title="Settings"
          className="p-2 rounded-lg text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#27272a] transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
