import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';
import { createTurnCompletionTracker } from '@rbright/pi-notify-core';

import { type NotifyResult, notifyTurnComplete } from './notify';

type NotifyFn = (messageText: string) => NotifyResult;

interface MessageContentPart {
  type?: unknown;
  text?: unknown;
}

interface MessageLike {
  role: string;
  stopReason?: unknown;
  content?: unknown;
}

function shouldLogFailure(result: NotifyResult): result is Extract<NotifyResult, { notified: false }> {
  if (result.notified) {
    return false;
  }

  return result.reason !== 'disabled' && result.reason !== 'non-tty' && result.reason !== 'empty-message';
}

function getStopReason(message: MessageLike): string | undefined {
  if (message.role !== 'assistant') {
    return undefined;
  }

  return typeof message.stopReason === 'string' ? message.stopReason : undefined;
}

function joinAndTrim(parts: string[]): string | undefined {
  const joined = parts.join(' ').replace(/\s+/g, ' ').trim();
  return joined.length > 0 ? joined : undefined;
}

function extractMessageTextFromArray(content: unknown[]): string | undefined {
  const textParts: string[] = [];

  for (const item of content) {
    if (typeof item === 'string') {
      textParts.push(item);
      continue;
    }

    if (!item || typeof item !== 'object') {
      continue;
    }

    const part = item as MessageContentPart;
    if (part.type !== 'text' || typeof part.text !== 'string') {
      continue;
    }

    textParts.push(part.text);
  }

  return joinAndTrim(textParts);
}

export function extractAssistantMessageText(message: MessageLike): string | undefined {
  if (message.role !== 'assistant') {
    return undefined;
  }

  if (typeof message.content === 'string') {
    const text = message.content.trim();
    return text.length > 0 ? text : undefined;
  }

  if (Array.isArray(message.content)) {
    return extractMessageTextFromArray(message.content);
  }

  return undefined;
}

export function registerKokoNotifyExtension(
  pi: ExtensionAPI,
  notify: NotifyFn = (messageText: string) => notifyTurnComplete(messageText),
): void {
  let latestAssistantText: string | undefined;

  const tracker = createTurnCompletionTracker(() => {
    if (!latestAssistantText) {
      return;
    }

    const result = notify(latestAssistantText);

    if (shouldLogFailure(result)) {
      console.warn(`[pi-notify-koko] notification skipped (${result.reason})`);
    }
  });

  pi.on('agent_start', async () => {
    latestAssistantText = undefined;
    tracker.onAgentStart();
  });

  pi.on('message_end', async (event) => {
    const message = event.message as unknown as MessageLike;
    latestAssistantText = extractAssistantMessageText(message) ?? latestAssistantText;

    await tracker.onMessageEnd({
      message: {
        role: message.role,
        stopReason: getStopReason(message),
      },
    });
  });

  pi.on('agent_end', async () => {
    await tracker.onAgentEnd();
  });
}

export default function (pi: ExtensionAPI): void {
  registerKokoNotifyExtension(pi);
}
