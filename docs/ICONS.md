# Icons

Every desktop and dock icon is an inline React SVG in `client/src/desktop/mac-icons.tsx`. Nothing depends on an external icon pack, so the desktop renders consistently offline.

## Structure

```tsx
export interface MacIconProps {
  className?: string
  style?: CSSProperties
  strokeWidth?: number
}

export type AppIcon = ComponentType<MacIconProps>
```

- `Svg` provides the shared 64 × 64 viewBox and accessibility attributes.
- `Folder` draws the blue macOS folder and accepts a white glyph.
- Application icons draw their own rounded-square background, gloss and glyph.
- `AppleLogo` is the only icon that inherits `currentColor`.

## Registries

```tsx
export const MAC_ICONS: Partial<Record<AppId, AppIcon>> = { ... }
export const MAC_DOCK_ICONS: Partial<Record<AppId, AppIcon>> = { ... }
```

`MAC_ICONS` is used on the desktop, in window title bars and in Spotlight results. `MAC_DOCK_ICONS` reuses those icons but swaps in familiar dock metaphors:

| App id | Desktop | Dock |
| --- | --- | --- |
| `projects` | Folder with briefcase | Briefcase app |
| `gallery` | Folder with photo | Photos flower |
| `blog` | Notebook | Notes pad |
| `contact` | Folder with envelope | Mail envelope |
| `finder` | Finder face | Finder face |

Missing entries fall back to the Lucide icon on the app definition, so a newly added app still renders before it receives custom artwork.

## Adding an icon

1. Add a component that accepts `MacIconProps`.
2. Draw inside the 64 × 64 viewBox, leaving a 3 px transparent margin for the drop shadow.
3. Register it in `MAC_ICONS` and, when the dock needs a different metaphor, `MAC_DOCK_ICONS`.
4. Check the icon at 52 px, 60 px and 76 px; these are the three desktop sizes.

## Accessibility

Icons are decorative (`aria-hidden`). The interactive element supplies the accessible name:

- Desktop: `aria-label="Music — double click to open"`.
- Dock: `aria-label="Music"` with a tooltip.
- Window title bar: the window title is the accessible label.
