import { ChatMessage, MessageContent, ChatContentType } from '../types/chat';

interface LiveChatStart {
  liveSessionId: string;
  message: string;
  startType: string;
}

interface ParsedChunk {
  message?: string;
  status?: string[];
  contents?: MessageContent[];
  suggestedAgents?: string[];
  session_id?: string;
  message_id?: string;
  agent?: string;
  error?: boolean;
  isLiveChatStart?: LiveChatStart | null;
}

/**
 * Get human-readable backend/agent name
 */
const getBackendStatusName = (agent: string, prefix: string): string => {
  const agentNames: Record<string, string> = {
    '__fallback__': prefix.replace(/\s*from\s*$/i, ''),
    'knowledge': `${prefix} Knowledge Base`,
    'action': `${prefix} Action Bot`,
    'utility': `${prefix} Utility`,
    'sales_rfp': `${prefix} Proposal Assistant`,
    'audit': `${prefix} Internal Audit Assistant`,
    'hr': `${prefix} Manager Edge Assistant`,
    'finance': `${prefix} Finance Assistant`,
    'legal': `${prefix} Contracts Assistant`,
    'web_search': `${prefix} Web Search`,
    'aionbi': `${prefix} Sales Analyst`,
    'unleash': `${prefix} Unleash Assistant`,
  };
  return agentNames[agent] || prefix.replace(/\s*from\s*$/i, '');
};

/**
 * Extract message from CALL_BACKEND event
 */
const extractMessageFromCallBackend = (chunk: string): {
  message: string;
  backend: string;
  tools?: any[];
  contents?: any[];
} | null => {
  if (!chunk.includes('event: CALL_BACKEND')) return null;

  const afterEvent = chunk.split('CALL_BACKEND')[1]?.trim();
  if (!afterEvent) return null;

  try {
    const jsonString = afterEvent
      .replace(/^data:\s*/, '')
      .replace(/\n/g, '')
      .split('event:')[0] // stop before any next event
      .trim();

    const json = JSON.parse(jsonString);
    const message = json?.response?.object?.message || '';
    const backend = json?.response?.backend || '';
    const tools = json?.response?.object?.tools || [];
    const contents = json?.response?.object?.contents || [];

    return { message, backend, tools, contents };
  } catch (error) {
    console.debug('Error parsing CALL_BACKEND chunk:', error);
    return null;
  }
};

/**
 * Extract live chat start signal from CALL_BACKEND event metadata
 * Looks for livechat_start in metadata or specific message patterns
 */
const extractLiveChatStartFromCallBackend = (chunk: string): LiveChatStart | null => {
  if (!chunk.includes('event: CALL_BACKEND')) return null;

  const afterEvent = chunk.split('CALL_BACKEND')[1]?.trim();
  if (!afterEvent) return null;

  try {
    const jsonString = afterEvent
      .replace(/^data:\s*/, '')
      .replace(/\n/g, '')
      .split('event:')[0]
      .trim();

    const json = JSON.parse(jsonString);
    const metadata = json?.response?.object?.metadata;
    const rawMessage = json?.response?.object?.message || '';

    // The message might be a JSON string containing responses array
    // Try to extract the actual text content
    let message = rawMessage;
    let extractedText = '';
    try {
      const parsedMessage = JSON.parse(rawMessage);
      if (parsedMessage?.responses && Array.isArray(parsedMessage.responses)) {
        // Combine all text responses
        extractedText = parsedMessage.responses
          .filter((r: any) => r.type === 'text' && r.text)
          .map((r: any) => r.text)
          .join(' ');
        console.log('[livechat] Extracted text from responses:', extractedText.substring(0, 100));
      }
    } catch {
      // Not JSON, use raw message
      extractedText = rawMessage;
    }

    // Use extracted text if available, otherwise use raw message
    const textToCheck = extractedText || message;

    // Check for explicit livechat_start in metadata
    if (metadata?.livechat_start || metadata?.live_chat_start) {
      const lcData = metadata.livechat_start || metadata.live_chat_start;
      console.log('[livechat] Found explicit livechat_start in metadata');
      return {
        liveSessionId: lcData.session_id || lcData.liveSessionId || '',
        message: lcData.message || textToCheck || 'Connecting you to a live agent...',
        startType: lcData.start_type || lcData.startType || 'metadata',
      };
    }

    // Check for init_suffix pattern (e.g., "...init_live_chat")
    if (metadata?.init_suffix && /live.?chat/i.test(metadata.init_suffix)) {
      console.log('[livechat] Found init_suffix pattern:', metadata.init_suffix);
      return {
        liveSessionId: '',
        message: textToCheck || 'Connecting you to a live agent...',
        startType: 'init_suffix',
      };
    }

    // Check for wait_phrase pattern
    if (metadata?.wait_phrase && /agent|live/i.test(metadata.wait_phrase)) {
      console.log('[livechat] Found wait_phrase pattern:', metadata.wait_phrase);
      return {
        liveSessionId: '',
        message: metadata.wait_phrase,
        startType: 'wait_phrase',
      };
    }

    // Heuristic: check message content for live chat patterns
    // These patterns should only match IMPERATIVE messages directing the user,
    // NOT descriptive text about features

    // Pattern: "Please wait while I connect you to an agent"
    if (textToCheck && /please\s+wait\s+while\s+I\s+connect\s+you/i.test(textToCheck)) {
      console.log('[livechat] Heuristic match: "please wait while I connect you" pattern');
      return {
        liveSessionId: '',
        message: textToCheck,
        startType: 'heuristic',
      };
    }

    // Pattern: "I'm connecting you to an agent" / "I will connect you to an agent"
    // Must be imperative (I'm/I'll/I will) not descriptive
    if (textToCheck && /I('m|'ll|.will|.am)\s+connect(ing)?\s+you\s+to\s+(an?\s+)?agent/i.test(textToCheck)) {
      console.log('[livechat] Heuristic match: "I am connecting you to agent" pattern');
      return {
        liveSessionId: '',
        message: textToCheck,
        startType: 'heuristic',
      };
    }

    // Pattern: "waiting to be connected" (user is waiting)
    if (textToCheck && /waiting\s+to\s+be\s+connected/i.test(textToCheck)) {
      console.log('[livechat] Heuristic match: "waiting to be connected" pattern');
      return {
        liveSessionId: '',
        message: textToCheck,
        startType: 'heuristic',
      };
    }

    // Pattern: "You can end this live chat session" - indicates active live chat
    // This is specific enough to not match general feature descriptions
    if (textToCheck && /you\s+can\s+end\s+(this\s+)?live\s*chat/i.test(textToCheck)) {
      console.log('[livechat] Heuristic match: "you can end this live chat" pattern');
      return {
        liveSessionId: '',
        message: textToCheck,
        startType: 'heuristic',
      };
    }

    // Pattern: "connecting you to a live agent" - imperative action
    if (textToCheck && /connecting\s+you\s+to\s+(a\s+)?(live\s+)?agent/i.test(textToCheck)) {
      console.log('[livechat] Heuristic match: "connecting you to agent" pattern');
      return {
        liveSessionId: '',
        message: textToCheck,
        startType: 'heuristic',
      };
    }

    // REMOVED: "live chat session" pattern - too broad, matches feature descriptions
    // REMOVED: generic "connect to agent" pattern - too broad

    return null;
  } catch (error) {
    console.debug('Error extracting live chat start:', error);
    return null;
  }
};

/**
 * Extract inferred backends from DETECT_INTENT event
 */
const extractInferredBackends = (chunk: string): string[] => {
  if (!chunk.includes('event: DETECT_INTENT')) return [];

  const lines = chunk.split('\n');
  const dataLine = lines.find((line) => line.trim().startsWith('data:'))?.trim();
  if (!dataLine) return [];

  try {
    const jsonString = dataLine.replace(/^data:\s*/, '').trim();
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed?.inferred_backends) ? parsed.inferred_backends : [];
  } catch {
    return [];
  }
};

/**
 * Parse available and inferred backends from CLARIFY_INTENT event
 */
const parseAvailableAndInferredBackends = (chunk: string): {
  availableBackends: string[];
  inferredBackends: string[];
  multiOptionMessage: string;
} | null => {
  if (!chunk.includes('event: CLARIFY_INTENT')) return null;

  const lines = chunk.split('\n');
  const dataLine = lines.find((line) => line.trim().startsWith('data:'))?.trim();
  if (!dataLine) return null;

  try {
    const jsonString = dataLine.replace(/^data:\s*/, '').trim();
    const parsed = JSON.parse(jsonString);
    return {
      availableBackends: Array.isArray(parsed?.response?.available_backends)
        ? parsed.response.available_backends : [],
      inferredBackends: Array.isArray(parsed?.response?.inferred_backends)
        ? parsed.response.inferred_backends : [],
      multiOptionMessage: parsed?.response?.message || '',
    };
  } catch {
    return null;
  }
};

/**
 * Parse a Server-Sent Events chunk from the chat API
 * The BFF sends SSE events like: event: CALL_BACKEND\ndata: {...}
 */
export const parseStreamChunk = (chunk: string): ParsedChunk | null => {
  const result: ParsedChunk = {
    status: [],
    contents: [],
  };

  // Handle START event
  if (chunk.includes('event: START')) {
    result.status = ['Routing Layer activated'];
    return result;
  }

  // Handle ERROR event
  if (chunk.includes('event: ERROR')) {
    result.status = ['Error'];
    result.error = true;
    return result;
  }

  // Handle DETECT_INTENT event
  if (chunk.includes('event: DETECT_INTENT')) {
    const backends = extractInferredBackends(chunk);
    if (backends.length > 1 && backends[0] !== '__fallback__') {
      result.status = [`Suggesting available backends: ${backends.map(b => getBackendStatusName(b, '')).join(', ')}`];
    } else if (backends[0] && backends[0] !== '__fallback__') {
      result.status = [getBackendStatusName(backends[0], 'Suggesting available backend:')];
    }
    return result;
  }

  // Handle CLARIFY_INTENT event
  if (chunk.includes('event: CLARIFY_INTENT')) {
    const parsed = parseAvailableAndInferredBackends(chunk);
    if (parsed) {
      result.status = ['Intent is unclear'];
      result.suggestedAgents = parsed.inferredBackends;
      result.message = parsed.multiOptionMessage;
      if (parsed.multiOptionMessage) {
        result.contents = [{ type: ChatContentType.TEXT, content: parsed.multiOptionMessage }];
      }
    }
    return result;
  }

  // Handle CALL_BACKEND event (main message content)
  if (chunk.includes('event: CALL_BACKEND')) {
    const parsed = extractMessageFromCallBackend(chunk);
    const liveChatStart = extractLiveChatStartFromCallBackend(chunk);

    if (liveChatStart) {
      console.log('[livechat] ========== LIVE CHAT START EXTRACTED ==========');
      console.log('[livechat] Details:', JSON.stringify(liveChatStart, null, 2));
      console.log('[livechat] ================================================');
      result.isLiveChatStart = liveChatStart;
      result.status = ['Connecting you to an Agent...'];
      result.message = liveChatStart.message;
      if (liveChatStart.message) {
        result.contents = [{ type: ChatContentType.TEXT, content: liveChatStart.message }];
      }
    } else if (parsed) {
      result.status = ['Intent is clear', 'Neo is generating your answer...'];
      result.message = parsed.message;
      result.agent = parsed.backend;
      if (parsed.message) {
        result.contents = [{ type: ChatContentType.TEXT, content: parsed.message }];
      }
      // Handle chart tools
      if (parsed.tools && Array.isArray(parsed.tools)) {
        const chartTools = parsed.tools.filter((tool: any) => tool.tool_type === 'chart');
        if (chartTools.length > 0) {
          result.contents?.push({
            type: ChatContentType.CHART,
            content: JSON.stringify(chartTools),
          });
        }
      }
      // Handle image contents from contentArray (generated images with signed URLs)
      if (parsed.contents && Array.isArray(parsed.contents)) {
        const imageContents = parsed.contents.filter((c: any) => c.type === 'image');
        for (const img of imageContents) {
          result.contents?.push({
            type: ChatContentType.IMAGE,
            content: typeof img.content === 'string' ? img.content : JSON.stringify(img.content),
            url: img.content?.signedUrl || img.signedUrl || img.url,
          });
        }
      }
    }
    return result;
  }

  // Handle END event
  if (chunk.includes('event: END')) {
    result.status = ['Answer generated'];
    return result;
  }

  // Try to parse as simple JSON (fallback)
  try {
    let data = chunk.trim();
    if (data.startsWith('data: ')) {
      data = data.slice(6);
    }
    if (!data || data === '[DONE]') {
      return null;
    }
    const parsed = JSON.parse(data);
    return {
      message: parsed.message || parsed.content || '',
      status: parsed.status,
      contents: parsed.contents,
      suggestedAgents: parsed.suggestedAgents,
      session_id: parsed.session_id,
      message_id: parsed.message_id,
    };
  } catch {
    console.debug('Could not parse chunk:', chunk.substring(0, 100));
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
 * Generate a UUID v4
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Create a unique session ID (UUID v4 format)
 */
export const createSessionId = (): string => {
  return generateUUID();
};
