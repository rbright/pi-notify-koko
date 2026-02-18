import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';
import { describe, expect, it, vi } from 'vitest';

import { registerKokoNotifyExtension } from '../index';
import type { NotifyResult } from '../notify';

type EventHandler = (event: unknown, ctx: unknown) => Promise<void>;

function setupExtension(notifyImpl: () => NotifyResult) {
  const handlers = new Map<string, EventHandler>();

  const on = vi.fn((eventName: string, callback: EventHandler) => {
    handlers.set(eventName, callback);
  });

  registerKokoNotifyExtension({ on } as unknown as ExtensionAPI, notifyImpl);

  return {
    handlers,
  };
}

describe('registerKokoNotifyExtension', () => {
  it('notifies once for message completion with agent_end fallback dedupe', async () => {
    const notify = vi.fn(
      (): NotifyResult => ({
        args: ['Turn complete'],
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

    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('skips toolUse message_end and uses agent_end fallback', async () => {
    const notify = vi.fn(
      (): NotifyResult => ({
        args: ['Turn complete'],
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
          stopReason: 'toolUse',
        },
        type: 'message_end',
      },
      {},
    );

    expect(notify).not.toHaveBeenCalled();

    await handlers.get('agent_end')?.({ type: 'agent_end' }, {});
    expect(notify).toHaveBeenCalledTimes(1);
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
      await handlers.get('agent_end')?.({ type: 'agent_end' }, {});

      expect(warn).toHaveBeenCalledWith('[pi-notify-koko] notification skipped (command-not-found)');
    } finally {
      warn.mockRestore();
    }
  });
});
