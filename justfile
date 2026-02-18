# Use bash with strict error checking
set shell := ["bash", "-uc"]

# Allow passing arguments to recipes
set positional-arguments

# Show available recipes
default:
  @just --list

# Install dependencies
deps:
  bun install

# Run linting
[group('lint')]
lint *args:
  bun run eslint . {{ args }}

# Run type checking
[group('lint')]
typecheck:
  bun run tsc --noEmit -p tsconfig.json

# Run tests
[group('test')]
test *args:
  bun run vitest run {{ args }}

# Run the full local quality gate
check:
  bun run check

# Install prek git hooks
precommit-install:
  bun run precommit:install

# Run prek hooks over all files
precommit-run:
  bun run precommit:run
