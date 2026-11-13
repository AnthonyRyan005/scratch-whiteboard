# Scratch Whiteboard

A borderless whiteboard for iPhone and iPad. Draw, paste pictures and text or add photos from your library, then move, resize, rotate and crop them. Nothing is saved. Once installed, it works offline.

## Open it

When GitHub Pages is on for this repo, the app is at `https://anthonyryan005.github.io/scratch-whiteboard/`. If your repo has a different name, put that name at the end instead.

## Install it on your iPhone or iPad (once, while online)

1. Open the link in Safari.
2. Tap Share, then Add to Home Screen. On iOS 26, Share may sit under the ••• menu. Leave "Open as Web App" on and tap Add.
3. Open Whiteboard from the Home Screen once while you're still online. It saves itself for offline use within a few seconds.

From then on it opens with no connection. Use the Home Screen icon rather than a Safari tab, because Safari can clear the offline copy of a site you haven't visited for a week.

## What's in this repo

| File | What it does |
|---|---|
| `index.html` | The whole app |
| `sw.js` | Keeps a copy of the app's own files so it opens offline |
| `manifest.json` and `icon-*.png` | The Home Screen name and icon |

The offline copy holds only these files. Drawings and pasted pictures stay in memory and are gone when the app closes.

## Updating

Upload the new files to the `main` branch. GitHub replaces files that have the same name. GitHub Pages republishes within a minute or two, and each device gets the new version the next time it opens the app while online.
