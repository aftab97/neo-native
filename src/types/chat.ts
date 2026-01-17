export enum ChatContentType {
  TEXT = 'text',
  THOUGHT = 'thought',
  CHART = 'chart',
  IMAGE = 'image',
  CODE = 'code',
}

export interface MessageContent {
  type: 'text' | 'thought' | 'chart' | 'image' | 'code' | ChatContentType;
  content?: string;
  thought?: string;
  thought_title?: string;
  language?: string;
  url?: string;
}

export interface ChatMessage {
  role: 'user' | 'ai' | 'live_chat_agent';
  message: string;
  message_id: string;
  session_id: string;
  order?: number;
  status?: string[];
  contents?: MessageContent[];
  suggestedAgents?: string[];
  metadata?: Record<string, unknown>;
  files?: FileMetaData[];
  /** Marker for live chat start in this message */
  isLiveChatStart?: {
    liveSessionId: string;
    message: string;
    startType?: string;
  } | null;
}

export interface FileMetaData {
  name: string;
  type: string;
  loading: boolean;
  error: boolean;
  signedUrl?: string;
}

export interface ChatHistory {
  session_id: string;
  title: string;
  updated_at: string;
  created_at: string;
}
