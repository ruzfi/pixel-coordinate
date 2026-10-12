# Pixel Coordinate

A Caido plugin that adds a **"Pixel Coordinates"** view mode to HTTP responses. When you select it on an image response, it renders the image and shows the pixel coordinate under your cursor.

## Features

- **Hover** — a live readout of the `(X, Y)` pixel coordinate under the cursor, in the *original* image's pixel space (correct even when the image is scaled to fit).
- **Click to freeze** — click anywhere on the image to pin the coordinate (a crosshair and badge mark the pinned spot).
- **Clear** — reset the pinned coordinate and return to hover mode.
- **Copy** — copy the current coordinate to the clipboard.
- Works in HTTP History, Replay, Search, Sitemap, Automate, Intercept, and Findings.

## How it works

The frontend view mode receives the response ID and asks the backend for the image bytes. The backend fetches the response's `raw` body via GraphQL (base64-encoded `Blob`), strips the HTTP headers, and returns the raw body as base64 — so the image is reconstructed **byte-for-byte** without any lossy text decoding.

## Project structure

```
packages/backend/src/index.ts            # getImageData() RPC endpoint
packages/frontend/src/index.ts           # registers the response view mode
packages/frontend/src/views/PixelCoordinateView.vue   # the coordinate UI
```

## Requirements

- [Node.js](https://nodejs.org/) 18+ or 20+
- [pnpm](https://pnpm.io/installation)

## Build

```bash
pnpm install
pnpm build
```

This produces `dist/plugin_package.zip`, which you can install in Caido via
**Settings → Plugins → Install package**.

## Development (hot reload)

```bash
pnpm watch
```

Then connect the [Caido Devtools](https://github.com/caido-community/devtools) plugin to the dev server URL.

## Notes

- The plugin only exposes the tab for responses whose `Content-Type` starts with `image/`.
- Coordinates are 0-indexed from the top-left corner (`X` increases rightward, `Y` increases downward), matching HTML canvas / OpenCV conventions.
