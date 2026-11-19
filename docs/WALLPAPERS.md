# Wallpapers

The wallpaper system is a registry plus a renderer. It supports CSS-only artwork and image artwork with a matching gradient fallback.

## Registry

`client/src/desktop/wallpapers.tsx` exports:

```ts
export interface WallpaperDefinition {
  id: string
  label: string
  description: string
  className?: string
  image?: string
  tone: string
}
```

| Id | Source | Notes |
| --- | --- | --- |
| `macos` | `/wallpapers/macos-waves.svg` | Default; deep blue and violet waves |
| `rays` | `/wallpapers/rays.jpg` | Original signature wallpaper |
| `aurora` | `.wp-aurora` | CSS gradients |
| `nebula` | `.wp-nebula` | CSS gradients |
| `grid` | `.wp-grid` | CSS grid lines |
| `sunset` | `.wp-sunset` | CSS gradients |

`DEFAULT_WALLPAPER` is `macos`. `getWallpaper` returns the first entry when an unknown id is stored, so an old or corrupted preference never produces a blank desktop.

## Rendering

`WallpaperLayer` renders two stacked elements:

1. The base layer, which applies `className` and `backgroundColor`. This is visible immediately and remains visible if the image fails.
2. An inner image layer with `background-image`. It only exists when `image` is defined.

A vignette layer sits above both and dims further in focus mode.

## Adding artwork

1. Put the asset in `client/public/wallpapers/`.
2. Add a definition with a unique `id`, a `tone` gradient for pickers and, optionally, a `className` fallback in `client/src/index.css`.
3. Verify the wallpaper at 1440 × 900 and 2560 × 1440.
4. Keep the SVG free of external references and scripts.

## Current artwork

`macos-waves.svg` uses a 2560 × 1440 viewBox, layered linear gradients, soft haze, thin highlight strokes and a vignette. `preserveAspectRatio="xMidYMid slice"` lets the desktop crop it without distortion.
