# Architecture

This document describes how the desktop portfolio is put together, the data flow between client and API, and the decisions that keep the interface honest.

## Overview

```
Browser
├── Client (React + Vite)
│   ├── Desktop shell (menu bar, dock, windows, overlays)
│   ├── Portfolio apps (rendered inside windows)
│   └── Admin console (standalone route)
└── API (Express)
    ├── Public routes
    ├── Auth + admin routes
    ├── AI streaming route
    └── Services (GitHub, analytics, mail, notifications)
```

The public site and the admin console share one API. The public site never receives AI, GitHub or SMTP credentials.

## Desktop shell

### Window manager (`client/src/store/os.ts`)

Zustand store persisted under `kcp-os`. It owns:

- the open window list, focus, z-order and cascade placement;
- drag/resize updates, maximize/restore rectangles and boundary clamping;
- minimize, restore, close, close-all, cycle and "show desktop";
- window titles, which detail pages can update once their content loads.

Rectangles are clamped against the viewport minus the menu bar and a bottom margin, so windows never become lost off-screen after a resize.

### App registry (`client/src/desktop/apps.tsx`)

A single registry describes every app: id, label, icon, tone, category, default size, minimum size, dock/desktop visibility, lazy component, window id, URL path and title. Detail apps such as `project` and `post` derive their window id, path and title from params.

Routes that should not be wrapped in the shared padding (Finder, Settings, Music, Trash, Shortcuts) are listed in `BARE_APPS`.

### URL and window synchronisation

`DesktopEnvironment.tsx` keeps the URL and the window list in sync:

- A non-root path opens (or focuses) the matching window.
- Closing the window that owns the current path navigates back to `/`.
- A `seenPaths` guard prevents a deep link from being treated as a close before its window has rendered.
- Deep-link params (settings sections, project/post slugs) are preserved instead of being overwritten by the URL sync.

This makes every page linkable and the browser back button behave sensibly without duplicating state.

### Chrome and overlays

- `MenuBar.tsx` — system/app menus, Wi-Fi, battery, volume, now-playing, clock, Control Center, Spotlight and Notification Center triggers.
- `Dock.tsx` — distance-based magnification, tooltips, running indicators, separators and minimized previews.
- `Spotlight.tsx` — searches apps, projects, articles, skills, services, gallery and GitHub; actions include theme changes and wallpaper settings.
- `ControlCenter.tsx`, `NotificationCenter.tsx` — quick controls and notifications.
- `DesktopIcons.tsx`, `ContextMenu.tsx` — draggable icons, persisted positions and desktop context menus.
- `wallpapers.tsx` — wallpaper registry; `rays.jpg` is the default signature wallpaper.

### Mobile mode

Below 860px the same data and apps render as a mobile OS: an app grid, full-screen apps with a back button, and a bottom dock. This is a separate layout tree rather than a scaled desktop.

## State stores

| Store | Key | Responsibility |
| --- | --- | --- |
| `store/os.ts` | `kcp-os` | Windows, focus, z-order, geometry |
| `store/desktop.ts` | `kcp-desktop` | Icon positions, hidden icons, dock, wallpaper-related preferences |
| `store/ui.ts` | `kcp-ui` | Theme, accent, motion, gestures, overlay visibility |
| `store/music.ts` | `kcp-music` | Tracks, queue, playback, elapsed/duration/seek |
| `store/auth.ts` | in-memory + cookie | Admin session bootstrap and refresh |
| `store/site.ts` | in-memory | Site settings, profile and shared content |

Only presentation preferences and window layout are persisted. Authentication tokens are not written to local storage.

## Music and audio

`AudioEngine.tsx` is mounted once at the desktop level so playback survives window focus changes. The store exposes `elapsed`, `duration`, `seekRequest` and `error`; seeded tracks are synthesised locally by `lib/synth.ts`, while uploaded audio files play through an audio element. Playback never starts automatically.

## API design

- **Public routes** (`server/routes/public.js`): published content, search, profile, settings, stats.
- **Auth** (`server/routes/auth.js`): login, refresh rotation, logout, session validation.
- **Admin** (`server/routes/admin.js`): CRUD for every collection, uploads, backups, notifications, users.
- **AI** (`server/routes/ai.js`): server-sent events; the provider key stays on the server and a knowledge-base fallback answers from published records.
- **GitHub** (`server/routes/github.js`): live data when configured; an explicit unavailable state otherwise.
- **Engagement** (`server/routes/engagement.js`): comments, likes, newsletter.
- **Analytics** (`server/routes/analytics.js`): salted, privacy-conscious pageview tracking.

MongoDB is optional. `server/config/store.js` provides an in-memory implementation with the same interfaces, seeded on startup, so the site is fully browsable without external services.

## Honesty and security

- No mock statistics: unavailable GitHub or analytics data renders as unavailable.
- Secrets are read from the environment, encrypted in the database where applicable, and never returned to the browser.
- Pageviews are only tracked for public routes, not for `/admin` or `/login`.
- Rate limiting, schema validation and RBAC apply to the API.
