# AGENTS.md

## Scope
This file applies to the entire `pi-notify-koko` repository.

## Mission
Keep the extension minimal and reliable while triggering Koko voice notifications when Pi finishes a turn.

## Architecture Rules

### Module boundaries
- `src/index.ts`: Pi event wiring only.
- `src/config.ts`: environment parsing and defaults only.
- `src/notify.ts`: Koko command assembly + process execution only.

### Design constraints
- Keep files focused on one responsibility.
- Keep side effects isolated to `src/notify.ts`.
- Reuse `@rbright/pi-notify-core` for completion tracking and sanitization.
- Do not register slash commands unless explicitly requested.

## Testing & Quality
Run before handoff:

1. `just lint`
2. `just typecheck`
3. `just test`

Manual smoke checks:
- local terminal run with `koko` available
- non-TTY mode skip behavior
- missing-command warning behavior

## Tooling
- Use Bun for dependencies and scripts.
- Use ESLint + Prettier for code quality.
- Use Vitest for tests.
- Use Prek (`prek`) for pre-commit hooks.

## Safety
- Do not introduce secrets.
- Keep subprocess execution deterministic and bounded (timeouts).
- Avoid shell interpolation for command args.
