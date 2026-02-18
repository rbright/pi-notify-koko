export interface KokoNotifyConfig {
  allowNonTty: boolean;
  command: string;
  enabled: boolean;
  modelDir?: string;
  noPlay: boolean;
  timeoutMs: number;
  voice?: string;
  argsJson: string[];
}

const DEFAULT_COMMAND = 'koko';
const DEFAULT_TIMEOUT_MS = 15_000;

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (value == null || value.trim() === '') {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parseNonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed;
}

function parseArgsJson(value: string | undefined): string[] {
  if (value == null || value.trim() === '') {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function loadConfig(env: NodeJS.ProcessEnv): KokoNotifyConfig {
  return {
    allowNonTty: parseBoolean(env.PI_NOTIFY_KOKO_ALLOW_NON_TTY, false),
    argsJson: parseArgsJson(env.PI_NOTIFY_KOKO_ARGS_JSON),
    command: parseNonEmpty(env.PI_NOTIFY_KOKO_COMMAND) ?? DEFAULT_COMMAND,
    enabled: parseBoolean(env.PI_NOTIFY_KOKO_ENABLED, true),
    modelDir: parseNonEmpty(env.PI_NOTIFY_KOKO_MODEL_DIR),
    noPlay: parseBoolean(env.PI_NOTIFY_KOKO_NO_PLAY, false),
    timeoutMs: parsePositiveInteger(env.PI_NOTIFY_KOKO_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    voice: parseNonEmpty(env.PI_NOTIFY_KOKO_VOICE),
  };
}
