/**
 * Utilities for detecting and filtering structured (machine) payloads
 * that are stored as user messages or chat titles.
 * Based on neo3-ui/src/api/history/utils/filterActionCardUserMessages.ts
 */

import { ChatMessage } from '../types/chat';

/**
 * Heuristic quick check that a string looks like JSON.
 */
export function isLikelyJsonString(s: string): boolean {
  if (!s) return false;
  const trimmed = s.trim();
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  );
}

/**
 * Try to parse JSON if msg is a JSON-like string.
 * Returns parsed value on success, otherwise returns the original input.
 */
export function parseJsonIfPossible(msg: unknown): unknown {
  if (typeof msg !== 'string') return msg;
  if (!isLikelyJsonString(msg)) return msg;

  try {
    return JSON.parse(msg.trim());
  } catch {
    return msg;
  }
}

/**
 * Returns true if the message is JSON-like (string containing JSON or already-parsed object).
 */
export function isJsonMessage(msg: unknown): boolean {
  if (msg == null) return false;
  if (typeof msg === 'object') return true;
  if (typeof msg === 'string') {
    if (!isLikelyJsonString(msg)) return false;
    try {
      const parsed = JSON.parse(msg.trim());
      return parsed !== null && typeof parsed === 'object';
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Normalize a chat title that might be JSON.
 * Extracts meaningful text from JSON objects (e.g., { "value": "TroubleshootVPN" } -> "TroubleshootVPN")
 * Based on neo3-ui/src/api/history/utils/normaliseActionCardTitle.ts
 */
export function normaliseActionCardTitle(raw?: unknown): string {
  // If it's already a string, try to parse JSON inside it
  if (typeof raw === 'string') {
    const trimmed = raw.trim();

    // Quick check: if it looks like JSON try to parse it
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        const parsed = JSON.parse(trimmed);

        // If parsed is a string, return it
        if (typeof parsed === 'string') return parsed;

        // If parsed is an object and has a 'value' or 'name' property, prefer those
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.value === 'string' && parsed.value.length)
            return parsed.value;
          if (typeof parsed.name === 'string' && parsed.name.length)
            return parsed.name;

          // If the object has a single string-valued property, return that
          const keys = Object.keys(parsed);
          if (keys.length === 1 && typeof parsed[keys[0]] === 'string') {
            return parsed[keys[0]];
          }
        }

        // Otherwise, fall through to use the raw string
      } catch {
        // If parse failed, fall back to original string
      }
    }

    return trimmed;
  }

  // If it's null/undefined or other types, return empty string
  if (raw == null) return '';
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);

  // For objects that somehow got here (not stringified), try to extract common props
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.value === 'string') return obj.value;
    if (typeof obj.name === 'string') return obj.name;
    // fallback to JSON stringify
    try {
      return JSON.stringify(raw);
    } catch {
      return '';
    }
  }

  return String(raw);
}

/**
 * Filter out user messages that are JSON payloads from action agent.
 * These are machine-to-machine messages (e.g., adaptive card button clicks)
 * that shouldn't be displayed to users.
 */
export function filterActionCardUserMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter((msg) => {
    // Only filter user messages
    if (msg.role !== 'user') return true;

    // Only filter if backend is 'action'
    const backend = (msg as any).backend;
    if (typeof backend !== 'string' || backend.toLowerCase() !== 'action') {
      return true;
    }

    // Filter if message is JSON-like
    return !isJsonMessage(msg.message);
  });
}

/**
 * Check if a title should be hidden (is just JSON without extractable content)
 */
export function shouldHideTitle(title: string | null | undefined): boolean {
  if (!title) return false;

  const normalised = normaliseActionCardTitle(title);

  // If the normalised title is still JSON-like, hide it
  if (isLikelyJsonString(normalised)) {
    return true;
  }

  // If normalisation returned empty or just whitespace, hide it
  if (!normalised.trim()) {
    return true;
  }

  return false;
}
