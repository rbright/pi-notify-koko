import { spawnSync } from 'node:child_process';

import { sanitizeNotificationText } from '@rbright/pi-notify-core';

import { type KokoNotifyConfig, loadConfig } from './config';

const UNBOUNDED_MAX_LENGTH = Number.MAX_SAFE_INTEGER;

const EMOJI_REGEX = /(?:\p{Extended_Pictographic}|\u200D|\uFE0F)/gu;
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;
const MARKDOWN_TOKEN_REGEX = /[*_~`#>|]/g;
const RAW_URL_REGEX = /https?:\/\/\S+/g;
const WRAPPER_PUNCTUATION_REGEX = /[()[\]{}<>]/g;

type NotifyFailureReason =
  | 'command-not-found'
  | 'disabled'
  | 'empty-message'
  | 'exit-nonzero'
  | 'non-tty'
  | 'spawn-error'
  | 'timeout';

export interface NotifyFailure {
  notified: false;
  reason: NotifyFailureReason;
  exitCode?: number;
  errorCode?: string;
}

export interface NotifySuccess {
  notified: true;
  command: string;
  args: string[];
}

export type NotifyResult = NotifyFailure | NotifySuccess;

interface OutputWriter {
  isTTY?: boolean;
}

interface RunResult {
  error?: NodeJS.ErrnoException;
  signal: NodeJS.Signals | null;
  status: number | null;
}

interface NotifierDeps {
  env: NodeJS.ProcessEnv;
  stdout: OutputWriter;
  run: (command: string, args: string[], timeoutMs: number) => RunResult;
}

function buildArgs(config: KokoNotifyConfig, text: string): string[] {
  const args = [...config.argsJson];

  if (config.voice) {
    args.push('--voice', config.voice);
  }

  if (config.modelDir) {
    args.push('--model-dir', config.modelDir);
  }

  if (config.noPlay) {
    args.push('--no-play');
  }

  args.push(text);
  return args;
}

function defaultRun(command: string, args: string[], timeoutMs: number): RunResult {
  const result = spawnSync(command, args, {
    stdio: 'ignore',
    timeout: timeoutMs,
  });

  return {
    error: result.error as NodeJS.ErrnoException | undefined,
    signal: result.signal,
    status: result.status,
  };
}

function resolveDeps(partialDeps?: Partial<NotifierDeps>): NotifierDeps {
  return {
    env: partialDeps?.env ?? process.env,
    run: partialDeps?.run ?? defaultRun,
    stdout: partialDeps?.stdout ?? process.stdout,
  };
}

export function sanitizeSpeechMessage(messageText: string): string {
  const normalized = messageText
    .replace(MARKDOWN_LINK_REGEX, '$1')
    .replace(RAW_URL_REGEX, ' ')
    .replace(EMOJI_REGEX, ' ')
    .replace(MARKDOWN_TOKEN_REGEX, ' ')
    .replace(WRAPPER_PUNCTUATION_REGEX, ' ');

  return sanitizeNotificationText(normalized, '', UNBOUNDED_MAX_LENGTH);
}

export function createNotifier(partialDeps?: Partial<NotifierDeps>) {
  const deps = resolveDeps(partialDeps);

  return {
    notifyTurnComplete(messageText: string): NotifyResult {
      const config = loadConfig(deps.env);

      if (!config.enabled) {
        return { notified: false, reason: 'disabled' };
      }

      if (deps.stdout.isTTY === false && !config.allowNonTty) {
        return { notified: false, reason: 'non-tty' };
      }

      const text = sanitizeSpeechMessage(messageText);
      if (text.length === 0) {
        return { notified: false, reason: 'empty-message' };
      }

      const args = buildArgs(config, text);
      const runResult = deps.run(config.command, args, config.timeoutMs);

      if (runResult.error) {
        if (runResult.error.code === 'ENOENT') {
          return { notified: false, reason: 'command-not-found', errorCode: runResult.error.code };
        }

        return { notified: false, reason: 'spawn-error', errorCode: runResult.error.code };
      }

      if (runResult.signal) {
        return { notified: false, reason: 'timeout' };
      }

      if (runResult.status !== 0) {
        return {
          notified: false,
          reason: 'exit-nonzero',
          exitCode: runResult.status ?? undefined,
        };
      }

      return {
        args,
        command: config.command,
        notified: true,
      };
    },
  };
}

export function notifyTurnComplete(messageText: string, partialDeps?: Partial<NotifierDeps>): NotifyResult {
  return createNotifier(partialDeps).notifyTurnComplete(messageText);
}
