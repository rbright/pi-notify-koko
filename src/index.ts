import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';
import { createTurnCompletionTracker } from '@rbright/pi-notify-core';

import { type NotifyResult, notifyTurnComplete } from './notify';

type NotifyFn = () => NotifyResult;

interface MessageLike {
  role: string;
  stopReason?: unknown;
}

function shouldLogFailure(result: NotifyResult): result is Extract<NotifyResult, { notified: false }> {
  if (result.notified) {
    return false;
  }

  return result.reason !== 'disabled' && result.reason !== 'non-tty';
}

function getStopReason(message: MessageLike): string | undefined {
  if (message.role !== 'assistant') {
    return undefined;
  }

  return typeof message.stopReason === 'string' ? message.stopReason : undefined;
}

export function registerKokoNotifyExtension(pi: ExtensionAPI, notify: NotifyFn = notifyTurnComplete): void {
  const tracker = createTurnCompletionTracker(() => {
    const result = notify();

    if (shouldLogFailure(result)) {
      console.warn(`[pi-notify-koko] notification skipped (${result.reason})`);
    }
  });

  pi.on('agent_start', async () => {
    tracker.onAgentStart();
  });

  pi.on('message_end', async (event) => {
    const message = event.message as unknown as MessageLike;

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
