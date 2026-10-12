# Contributing

Thanks for contributing to **Pixel Coordinate**! This document describes the commit conventions used in this project.

## Commit messages

All commits **must** follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

### Format

- **type** — the kind of change (required, lowercase).
- **scope** — the area of the codebase affected, e.g. `frontend`, `backend` (optional).
- **!** — mark a breaking change (optional).
- **description** — a short imperative summary, e.g. `add`, `fix`, `remove` (required).
- **body** — longer explanation of *what* and *why* (optional).
- **footer** — e.g. `BREAKING CHANGE:` or issue references (optional).

### Types

| Type       | Purpose                                                        |
| ---------- | -------------------------------------------------------------- |
| `feat`     | A new feature (e.g. a new view mode, a new UI control)          |
| `fix`      | A bug fix                                                       |
| `docs`     | Documentation only (README, CONTRIBUTING, comments)             |
| `style`    | Formatting, whitespace, linting — no behavior change            |
| `refactor` | Code change that neither fixes a bug nor adds a feature         |
| `perf`     | A performance improvement                                       |
| `test`     | Adding or correcting tests                                      |
| `build`    | Build system or external dependencies                           |
| `ci`       | CI configuration and scripts                                    |
| `chore`    | Other changes that don't touch source or tests                  |
| `revert`   | Revert a previous commit                                        |

### Scopes

Use a scope that matches the package or area you changed:

- `frontend` — `packages/frontend`
- `backend` — `packages/backend`
- `config` — `caido.config.ts`, `package.json`, workspace/tooling

### Breaking changes

Mark a breaking change with `!` after the type/scope, and/or add a `BREAKING CHANGE:` footer:

```
feat(frontend)!: drop support for the old coordinate overlay API

BREAKING CHANGE: the `overlay` option has been removed.
```

### Examples

```
feat(frontend): add crosshair overlay to the pixel coordinate view
```

```
fix(backend): strip headers before returning image body
```

```
docs: document the click-to-freeze behavior
```

```
refactor(backend): extract base64 decoding into a helper
```

## Pull requests

1. Branch from `main` with a short descriptive name (e.g. `feat/copy-coordinates`).
2. Keep commits atomic and well-described using the convention above.
3. Make sure `pnpm typecheck` passes before opening the PR.
4. Reference the related issue in the description when applicable.

## Development setup

```bash
pnpm install
pnpm build        # produces dist/plugin_package.zip
pnpm typecheck    # type-checks backend and frontend
pnpm watch        # hot reload with the Caido Devtools plugin
```
