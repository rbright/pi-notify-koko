# pi-notify-koko

[![CI](https://github.com/rbright/pi-notify-koko/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/rbright/pi-notify-koko/actions/workflows/ci.yml)

`pi-notify-koko` triggers Koko voice playback when the Pi agent completes a turn.

- Pi agent: https://github.com/badlogic/pi-mono
- Koko CLI: https://github.com/rbright/koko
- npm package: `@rbright/pi-notify-koko`

## Install into Pi (npm, recommended)

Global install:

```bash
pi install npm:@rbright/pi-notify-koko
```

Project-local install:

```bash
pi install -l npm:@rbright/pi-notify-koko
```

Git install fallback:

```bash
pi install git:github.com/rbright/pi-notify-koko
pi install -l git:github.com/rbright/pi-notify-koko
```

If Pi is already running, reload extensions:

```text
/reload
```

## How it works

The extension is zero-config by default.

- completion trigger: final assistant `message_end` (non-tool) with `agent_end` fallback
- per-agent dedupe: one Koko invocation per completed agent run
- executes `koko` with a short message
- skips non-TTY sessions by default

## Configuration (optional)

| Variable | Default | Description |
| --- | --- | --- |
| `PI_NOTIFY_KOKO_ENABLED` | `true` | Enable/disable notifications |
| `PI_NOTIFY_KOKO_COMMAND` | `koko` | Koko executable name/path |
| `PI_NOTIFY_KOKO_TEXT` | `Turn complete. Awaiting your feedback.` | Spoken message |
| `PI_NOTIFY_KOKO_TIMEOUT_MS` | `15000` | Subprocess timeout in ms |
| `PI_NOTIFY_KOKO_ALLOW_NON_TTY` | `false` | Allow triggering in non-TTY contexts |
| `PI_NOTIFY_KOKO_VOICE` | unset | Passed as `--voice <value>` |
| `PI_NOTIFY_KOKO_MODEL_DIR` | unset | Passed as `--model-dir <value>` |
| `PI_NOTIFY_KOKO_NO_PLAY` | `false` | Adds `--no-play` |
| `PI_NOTIFY_KOKO_ARGS_JSON` | unset | JSON array of extra args (e.g. `["--device","cpu"]`) |

Example:

```bash
export PI_NOTIFY_KOKO_VOICE=af_heart
export PI_NOTIFY_KOKO_TEXT='Agent turn complete'
pi
```

## Troubleshooting

1. Confirm extension install: `pi list`
2. If Pi was open during install/update, run `/reload`
3. Confirm Koko is on PATH: `command -v koko`
4. Run a short prompt and wait for completion
5. If no sound but command works, test Koko directly (for example: `koko "test"`)

## Development

```bash
just deps
just lint
just typecheck
just test
just check
just precommit-install
just precommit-run
```

Run extension directly during local development:

```bash
bun install
pi --no-extensions -e ./src/index.ts
```

## Publishing

Manual publish (`@rbright/pi-notify-koko`):

```bash
bun run check
npm publish --access public
```

Automated publish via GitHub Actions (`.github/workflows/publish.yml`) runs on:
- `workflow_dispatch`
- tag pushes matching `v*`

Required repository secret:
- `NPM_TOKEN` (npm token with publish permission)
