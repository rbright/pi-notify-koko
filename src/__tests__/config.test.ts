import { mkdirSync, writeFileSync } from 'node:fs';
import { chmod, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadConfig, resolveDefaultCommand } from '../config';

describe('loadConfig', () => {
  it('uses defaults', () => {
    const config = loadConfig({});

    expect(config).toEqual({
      allowNonTty: false,
      argsJson: [],
      command: resolveDefaultCommand(),
      enabled: true,
      modelDir: undefined,
      noPlay: false,
      summarize: true,
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
      PI_NOTIFY_KOKO_SUMMARIZE: 'off',
      PI_NOTIFY_KOKO_TIMEOUT_MS: '2500',
      PI_NOTIFY_KOKO_VOICE: 'af_heart',
    });

    expect(config.allowNonTty).toBe(true);
    expect(config.command).toBe('custom-koko');
    expect(config.enabled).toBe(false);
    expect(config.modelDir).toBe('/models/koko');
    expect(config.noPlay).toBe(true);
    expect(config.summarize).toBe(false);
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

describe('resolveDefaultCommand', () => {
  it('falls back to koko when local venv command is absent', async () => {
    const homePath = await mkdtemp(join(tmpdir(), 'koko-home-'));

    expect(resolveDefaultCommand(homePath)).toBe('koko');
  });

  it('prefers local venv koko command when executable', async () => {
    const homePath = await mkdtemp(join(tmpdir(), 'koko-home-'));
    const commandPath = join(homePath, 'Projects', 'koko', '.venv', 'bin', 'koko');

    mkdirSync(join(homePath, 'Projects', 'koko', '.venv', 'bin'), { recursive: true });
    writeFileSync(commandPath, '#!/usr/bin/env sh\necho koko\n', { encoding: 'utf8' });
    await chmod(commandPath, 0o755);

    expect(resolveDefaultCommand(homePath)).toBe(commandPath);
  });
});
