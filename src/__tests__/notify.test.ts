import { describe, expect, it, vi } from 'vitest';

import { notifyTurnComplete } from '../notify';

describe('notifyTurnComplete', () => {
  it('returns disabled when notifications are off', () => {
    const run = vi.fn();

    const result = notifyTurnComplete({
      env: {
        PI_NOTIFY_KOKO_ENABLED: 'false',
      },
      run,
      stdout: {
        isTTY: true,
      },
    });

    expect(result).toEqual({ notified: false, reason: 'disabled' });
    expect(run).not.toHaveBeenCalled();
  });

  it('skips non-tty by default', () => {
    const run = vi.fn();

    const result = notifyTurnComplete({
      env: {},
      run,
      stdout: {
        isTTY: false,
      },
    });

    expect(result).toEqual({ notified: false, reason: 'non-tty' });
    expect(run).not.toHaveBeenCalled();
  });

  it('allows non-tty when explicitly enabled', () => {
    const run = vi.fn(() => ({ signal: null, status: 0 }));

    const result = notifyTurnComplete({
      env: {
        PI_NOTIFY_KOKO_ALLOW_NON_TTY: 'true',
      },
      run,
      stdout: {
        isTTY: false,
      },
    });

    expect(result.notified).toBe(true);
    expect(run).toHaveBeenCalledOnce();
  });

  it('returns command-not-found when koko binary is missing', () => {
    const run = vi.fn(() => ({
      error: {
        code: 'ENOENT',
      } as NodeJS.ErrnoException,
      signal: null,
      status: null,
    }));

    const result = notifyTurnComplete({
      env: {},
      run,
      stdout: {
        isTTY: true,
      },
    });

    expect(result).toEqual({
      errorCode: 'ENOENT',
      notified: false,
      reason: 'command-not-found',
    });
  });

  it('returns spawn-error for unknown spawn failure', () => {
    const run = vi.fn(() => ({
      error: {
        code: 'EACCES',
      } as NodeJS.ErrnoException,
      signal: null,
      status: null,
    }));

    const result = notifyTurnComplete({
      env: {},
      run,
      stdout: {
        isTTY: true,
      },
    });

    expect(result).toEqual({
      errorCode: 'EACCES',
      notified: false,
      reason: 'spawn-error',
    });
  });

  it('returns timeout when process is killed by signal', () => {
    const run = vi.fn(() => ({
      signal: 'SIGTERM' as NodeJS.Signals,
      status: null,
    }));

    const result = notifyTurnComplete({
      env: {},
      run,
      stdout: {
        isTTY: true,
      },
    });

    expect(result).toEqual({ notified: false, reason: 'timeout' });
  });

  it('returns exit-nonzero for non-zero exit code', () => {
    const run = vi.fn(() => ({
      signal: null,
      status: 2,
    }));

    const result = notifyTurnComplete({
      env: {},
      run,
      stdout: {
        isTTY: true,
      },
    });

    expect(result).toEqual({
      exitCode: 2,
      notified: false,
      reason: 'exit-nonzero',
    });
  });

  it('invokes koko with configured options on success', () => {
    const run = vi.fn(() => ({
      signal: null,
      status: 0,
    }));

    const result = notifyTurnComplete({
      env: {
        PI_NOTIFY_KOKO_ARGS_JSON: '["--device","cpu"]',
        PI_NOTIFY_KOKO_COMMAND: 'koko-custom',
        PI_NOTIFY_KOKO_MODEL_DIR: '/models/koko',
        PI_NOTIFY_KOKO_NO_PLAY: 'true',
        PI_NOTIFY_KOKO_TEXT: 'Done ;\u0007',
        PI_NOTIFY_KOKO_TIMEOUT_MS: '9999',
        PI_NOTIFY_KOKO_VOICE: 'af_heart',
      },
      run,
      stdout: {
        isTTY: true,
      },
    });

    expect(result).toEqual({
      args: ['--device', 'cpu', '--voice', 'af_heart', '--model-dir', '/models/koko', '--no-play', 'Done'],
      command: 'koko-custom',
      notified: true,
    });

    expect(run).toHaveBeenCalledWith(
      'koko-custom',
      ['--device', 'cpu', '--voice', 'af_heart', '--model-dir', '/models/koko', '--no-play', 'Done'],
      9999,
    );
  });
});
