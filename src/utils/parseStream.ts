import { ChatMessage, MessageContent, ChatContentType } from '../types/chat';

interface ParsedChunk {
  message?: string;
  status?: string[];
  contents?: MessageContent[];
  suggestedAgents?: string[];
  session_id?: string;
  message_id?: string;
  agent?: string;
  error?: boolean;
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

    return { message, backend, tools };
  } catch (error) {
    console.debug('Error parsing CALL_BACKEND chunk:', error);
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
    if (parsed) {
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
 * Create a unique session ID
 */
export const createSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
