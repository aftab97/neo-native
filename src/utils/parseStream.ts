import { ChatMessage, MessageContent } from '../types/chat';

interface ParsedChunk {
  message?: string;
  status?: string[];
  contents?: MessageContent[];
  suggestedAgents?: string[];
  session_id?: string;
  message_id?: string;
}

/**
 * Parse a Server-Sent Events chunk from the chat API
 * The BFF sends newline-delimited JSON strings
 */
export const parseStreamChunk = (chunk: string): ParsedChunk | null => {
  try {
    // Remove 'data: ' prefix if present (SSE format)
    let data = chunk.trim();
    if (data.startsWith('data: ')) {
      data = data.slice(6);
    }

    // Skip empty chunks or keep-alive messages
    if (!data || data === '[DONE]') {
      return null;
    }

    // Parse JSON
    const parsed = JSON.parse(data);

    return {
      message: parsed.message || parsed.content || '',
      status: parsed.status,
      contents: parsed.contents,
      suggestedAgents: parsed.suggestedAgents,
      session_id: parsed.session_id,
      message_id: parsed.message_id,
    };
  } catch (error) {
    // Not valid JSON, might be partial chunk
    console.debug('Could not parse chunk:', chunk);
    return null;
  }
};

/**
 * Create a unique message ID
 */
export const createMessageId = (prefix: 'user' | 'ai' = 'user'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a unique session ID
 */
export const createSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
