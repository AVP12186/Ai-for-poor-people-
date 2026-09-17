export type BlobModelId = 'blob-flash' | 'blob-pro' | 'blob-lite';

export interface BlobModelInfo {
  id: BlobModelId;
  name: string;
  geminiEngine: string;
  tagline: string;
  description: string;
  badge?: string;
}

export const BLOB_MODELS: Record<BlobModelId, BlobModelInfo> = {
  'blob-flash': {
    id: 'blob-flash',
    name: 'Blob Flash',
    geminiEngine: 'gemini-3.8-flash',
    tagline: 'Fast & Versatile',
    description: 'Swift responses, game building, and creative work.',
    badge: 'Default',
  },
  'blob-pro': {
    id: 'blob-pro',
    name: 'Blob Pro',
    geminiEngine: 'gemini-3.1-pro-preview',
    tagline: 'Deep Reasoning & Logic',
    description: 'Superior for complex game mechanics, stem logic, and advanced coding.',
    badge: 'Advanced',
  },
  'blob-lite': {
    id: 'blob-lite',
    name: 'Blob Lite',
    geminiEngine: 'gemini-3.5-flash-lite',
    tagline: 'Lightweight & Instant',
    description: 'Ultra-light, rapid latency, and instant chats.',
  },
};

export type AIMode = 'chat' | 'canvas' | 'deep-research';

export interface CanvasArtifact {
  id: string;
  title: string;
  code: string;
  type: 'game' | 'app';
  createdAt: number;
}

export interface ResearchStep {
  title: string;
  status: 'pending' | 'in-progress' | 'complete';
  details?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  canvas?: CanvasArtifact;
  researchSteps?: ResearchStep[];
  searchGroundingSources?: string[];
}

export interface RecentSession {
  id: string;
  title: string;
  timestamp: string;
  hasCanvas?: boolean;
  messages?: ChatMessage[];
  canvas?: CanvasArtifact | null;
  mode?: AIMode;
}
