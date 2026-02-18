import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';
import { describe, expect, it, vi } from 'vitest';

import { extractAssistantMessageText, registerKokoNotifyExtension } from '../index';
import type { NotifyResult } from '../notify';

type EventHandler = (event: unknown, ctx: unknown) => Promise<void>;

function setupExtension(notifyImpl: (messageText: string) => NotifyResult) {
  const handlers = new Map<string, EventHandler>();

  const on = vi.fn((eventName: string, callback: EventHandler) => {
    handlers.set(eventName, callback);
  });

  registerKokoNotifyExtension({ on } as unknown as ExtensionAPI, notifyImpl);

  return {
    handlers,
  };
}

describe('extractAssistantMessageText', () => {
  it('extracts string content for assistant messages', () => {
    const text = extractAssistantMessageText({
      content: '  okay  ',
      role: 'assistant',
    });

    expect(text).toBe('okay');
  });

  it('extracts text blocks from structured content', () => {
    const text = extractAssistantMessageText({
      content: [
        { text: 'first', type: 'text' },
        { text: 'ignored', type: 'toolUse' },
        { text: 'second', type: 'text' },
      ],
      role: 'assistant',
    });

    expect(text).toBe('first second');
  });

  it('returns undefined for non-assistant or empty content', () => {
    expect(extractAssistantMessageText({ content: 'hi', role: 'user' })).toBeUndefined();
    expect(extractAssistantMessageText({ content: '   ', role: 'assistant' })).toBeUndefined();
    expect(extractAssistantMessageText({ role: 'assistant' })).toBeUndefined();
  });
});

describe('registerKokoNotifyExtension', () => {
  it('notifies once and uses assistant message content', async () => {
    const notify = vi.fn(
      (): NotifyResult => ({
        args: ['done'],
        command: 'koko',
        notified: true,
      }),
    );

    const { handlers } = setupExtension(notify);

    await handlers.get('agent_start')?.({ type: 'agent_start' }, {});
    await handlers.get('message_end')?.(
      {
        message: {
          content: 'respond with "okay"',
          role: 'assistant',
          stopReason: 'stop',
        },
        type: 'message_end',
      },
      {},
    );
    await handlers.get('agent_end')?.({ type: 'agent_end' }, {});

    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith('respond with "okay"');
  });

  it('does not notify if no assistant message text exists', async () => {
    const notify = vi.fn(
      (): NotifyResult => ({
        args: ['done'],
        command: 'koko',
        notified: true,
      }),
    );

    const { handlers } = setupExtension(notify);

    await handlers.get('agent_start')?.({ type: 'agent_start' }, {});
    await handlers.get('message_end')?.(
      {
        message: {
          role: 'assistant',
          stopReason: 'stop',
        },
        type: 'message_end',
      },
      {},
    );
    await handlers.get('agent_end')?.({ type: 'agent_end' }, {});

    expect(notify).not.toHaveBeenCalled();
  });

  it('logs warning when notify fails for actionable reason', async () => {
    const notify = vi.fn(
      (): NotifyResult => ({
        notified: false,
        reason: 'command-not-found',
      }),
    );

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {
      // no-op
    });

    try {
      const { handlers } = setupExtension(notify);
      await handlers.get('agent_start')?.({ type: 'agent_start' }, {});
      await handlers.get('message_end')?.(
        {
          message: {
            content: 'done',
            role: 'assistant',
            stopReason: 'stop',
          },
          type: 'message_end',
        },
        {},
      );

      expect(warn).toHaveBeenCalledWith('[pi-notify-koko] notification skipped (command-not-found)');
    } finally {
      warn.mockRestore();
    }
  });
});
