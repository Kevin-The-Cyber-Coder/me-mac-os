# Persistence

Only presentation preferences and window geometry are stored in the browser. Authentication tokens stay in memory and the refresh cookie.

## Keys

| Store | Local storage key | Version | Contents |
| --- | --- | --- | --- |
| OS | `kcp-os` | 1 | windows, focus, z-order, geometry, maximize state |
| Desktop | `kcp-desktop` | 2 | icon positions, hidden icons, icon size, dock, widgets, motion-adjacent preferences |
| UI | `kcp-ui` | 1 | theme, accent, wallpaper, glass, reduce motion |
| Music | `kcp-music` | — | queue and playback state |
| Auth | memory + `kcp_refresh` cookie | — | admin session |

## Desktop migration (v2)

Existing visitors had medium icons, visible widgets, a 52 px dock and stored icon positions from the old column-major layout. Version 2 performs a one-time reset:

```ts
{
  iconPositions: {},
  autoArrange: true,
  iconSize: 'large',
  showWidgets: false,
  dockSize: 60,
}
```

The migration runs once per browser. After it, user changes persist normally.

## UI migration (v1)

The old default wallpaper was `rays`. Version 1 replaces `rays` (or a missing value) with `macos` and leaves any other explicit choice untouched. This avoids overwriting a visitor who already picked Aurora or Nebula.

## Unknown values

- `getWallpaper` falls back to the first registry entry.
- The icon layer filters ids that are not in `DESKTOP_APPS`.
- Window rectangles are clamped against the live viewport after load and on resize.

## Clearing state

Removing the `kcp-os`, `kcp-desktop` and `kcp-ui` keys restores the first-run desktop. The admin session is cleared by signing out, which also invalidates the refresh cookie on the server.
