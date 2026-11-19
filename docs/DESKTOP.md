# Desktop

The public site is a desktop, not a scrolling page. This document describes the layout and the interactions that make it feel like macOS.

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Apple  Finder  File  Edit  View  Go  Window  Help   status  │  30 px
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   wallpaper                                    Music  Gallery  About Me
│                                                Settings  ARENA  Projects
│                                                Trash  Contact  Skills
│                                                GitHub  Services
│   windows open here                            Terminal  Journal
│                                                              │
│                        [        Dock        ]                │
└──────────────────────────────────────────────────────────────┘
```

Desktop icons are anchored to the right edge and read left to right, then top to bottom. The first nine items fill three columns; the final four use two columns so `Terminal` and `Journal` share a row, matching the reference workspace.

## Tracks

`client/src/desktop/DesktopIcons.tsx` computes positions from the viewport size:

- `CELL[iconSize]` stores the cell width, height, icon tile and label size.
- `rowStep` shrinks on short displays so five rows always fit above the dock.
- Stored positions are used only when auto-arrange is off.
- A drag threshold of five pixels separates a click from a drag.

## Behaviour

| Action | Result |
| --- | --- |
| Click | Select the icon |
| Double click / Enter / Space | Launch the app |
| Drag | Move the icon; turns off auto-arrange and persists the position |
| Right click | Icon menu, or the desktop menu on empty space |
| Arrange Icons | Clear stored positions and re-enable auto-arrange |
| Hide Desktop Icons | Hide the layer from the desktop menu or View menu |

Every icon maps to an entry in `client/src/desktop/apps.tsx`, so the desktop never invents a destination. Running apps display a small white dot below the icon.

## Responsiveness

Below 860 px the desktop is replaced by `MobileEnvironment`: a native-style app grid with full-screen apps and a bottom dock. `DesktopIcons` is never mounted in that mode, so the right-side grid cannot overflow a phone screen.

## Performance

- The resize listener is registered once and removes itself on unmount.
- Icons are absolutely positioned, so arranging them does not trigger layout of the window layer.
- macOS icons are inline SVG; there are no network requests per icon.
