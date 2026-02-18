import { describe, expect, it } from 'vitest';

import { loadConfig } from '../config';

describe('loadConfig', () => {
  it('uses defaults', () => {
    const config = loadConfig({});

    expect(config).toEqual({
      allowNonTty: false,
      argsJson: [],
      command: 'koko',
      enabled: true,
      modelDir: undefined,
      noPlay: false,
      text: 'Turn complete. Awaiting your feedback.',
      timeoutMs: 15_000,
      voice: undefined,
    });
  });

  it('parses booleans and overrides', () => {
    const config = loadConfig({
      PI_NOTIFY_KOKO_ALLOW_NON_TTY: '1',
      PI_NOTIFY_KOKO_COMMAND: 'custom-koko',
      PI_NOTIFY_KOKO_ENABLED: 'false',
      PI_NOTIFY_KOKO_MODEL_DIR: ' /models/koko ',
      PI_NOTIFY_KOKO_NO_PLAY: 'yes',
      PI_NOTIFY_KOKO_TEXT: 'Agent done',
      PI_NOTIFY_KOKO_TIMEOUT_MS: '2500',
      PI_NOTIFY_KOKO_VOICE: 'af_heart',
    });

    expect(config.allowNonTty).toBe(true);
    expect(config.command).toBe('custom-koko');
    expect(config.enabled).toBe(false);
    expect(config.modelDir).toBe('/models/koko');
    expect(config.noPlay).toBe(true);
    expect(config.text).toBe('Agent done');
    expect(config.timeoutMs).toBe(2500);
    expect(config.voice).toBe('af_heart');
  });

  it('parses args from PI_NOTIFY_KOKO_ARGS_JSON', () => {
    const config = loadConfig({
      PI_NOTIFY_KOKO_ARGS_JSON: '["--device", "cpu", 1, "", "--offline"]',
    });

    expect(config.argsJson).toEqual(['--device', 'cpu', '--offline']);
  });

  it('ignores invalid args JSON and invalid timeout', () => {
    const config = loadConfig({
      PI_NOTIFY_KOKO_ARGS_JSON: 'not-json',
      PI_NOTIFY_KOKO_TIMEOUT_MS: '0',
    });

    expect(config.argsJson).toEqual([]);
    expect(config.timeoutMs).toBe(15_000);
  });
});
