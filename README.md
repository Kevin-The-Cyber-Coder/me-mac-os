# Kevin The Cyber Coder — ARENA OS

[![CI](https://github.com/Kevin-The-Cyber-Coder/me-mac-os/actions/workflows/ci.yml/badge.svg)](https://github.com/Kevin-The-Cyber-Coder/me-mac-os/actions/workflows/ci.yml)

An interactive, macOS-inspired portfolio for **Mukeshimana Kevin** (Kevin The Cyber Coder). Instead of a single scrolling page, the public site is a full desktop: a translucent menu bar, a magnifying dock, draggable windows, a command palette and a mobile app grid. Every portfolio section is an app backed by the same API that powers the admin console.

- **Desktop site:** every section opens in its own window (Finder, Projects, Skills, Services, Journal, Gallery, Contact, GitHub, ARENA AI, Terminal, Music, System Settings, Trash).
- **Admin console:** a standalone, JWT-secured workspace at `/admin` for content, analytics, moderation, AI settings, GitHub verification and backups.
- **Real data only:** GitHub statistics, analytics and AI answers come from live services or published database records. Nothing is fabricated, and unavailable data is shown as unavailable.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Zustand |
| Backend | Node.js, Express, Socket.IO |
| Database | MongoDB (Mongoose) with an in-memory demo fallback |
| AI | OpenAI-compatible streaming API, with a knowledge-base fallback |
| Auth | JWT access tokens plus rotating refresh cookies, RBAC |

## Monorepo layout

```
.
├── client/            React desktop OS, portfolio apps and admin console
│   ├── public/        Icons, PWA assets and the signature Rays wallpaper
│   └── src/
│       ├── admin/     Admin console modules
│       ├── components/ Shared UI, site cards, assistant and legacy shell
│       ├── desktop/   Window manager, menu bar, dock, Spotlight, native apps
│       ├── hooks/     Content, socket and speech hooks
│       ├── lib/       API client, analytics, synth, utilities
│       ├── pages/     Portfolio pages rendered inside windows
│       └── store/     Zustand stores (auth, OS windows, preferences, music)
└── server/            Express API, models, routes, services and tests
    ├── config/        Environment, database and memory store
    ├── middleware/    Auth, validation, rate limiting, uploads, errors
    ├── models/        Mongoose schemas for content, engagement and system data
    ├── routes/        Public, admin, auth, AI, analytics and GitHub endpoints
    ├── scripts/       Seeding
    ├── services/      AI, GitHub, analytics, mail, crypto, notifications
    └── tests/         API integration tests
```

## Getting started

Requirements: **Node.js 20+** and npm. MongoDB is optional — without `MONGODB_URI` the API runs in an in-memory demo mode that seeds itself on startup.

```bash
npm install
cp .env.example .env    # Windows: Copy-Item .env.example .env
npm run dev
```

- Web: http://localhost:5173
- API health: http://localhost:5000/api/health
- Admin: http://localhost:5173/admin (redirects to `/login` when signed out)

To load the portfolio into a real MongoDB instance:

```bash
npm run seed
npm start
```

## Environment

All configuration lives in `.env` (see `.env.example`). Highlights:

- `MONGODB_URI` — optional; memory demo mode is used when empty.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SETTINGS_SECRET` — generate long random values before deploying.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — bootstrap administrator created by the seed script. Change these for any real deployment.
- `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` — server-side only; keys are never sent to the browser.
- `GITHUB_TOKEN` / `GITHUB_USERNAME` — optional read-only token for live GitHub data.
- `SMTP_*` — optional; emails are logged to the console when unset.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run API and Vite together |
| `npm run build` | Type-check and build the client |
| `npm start` | Start the API server |
| `npm run seed` | Seed settings, profile, projects, skills, services, posts, gallery, music and more |
| `npm test` | Run the server API test suite |
| `npm run lint` | Lint the client |

## Desktop behaviour

- **Window manager:** independent windows with drag, resize, maximize, minimize, focus and z-order; the layout persists across reloads.
- **URL as state:** deep links such as `/projects/nexus-commerce` open the matching window; closing the owning window returns to the desktop.
- **Dock:** distance-based magnification, tooltips, running indicators and minimized-window previews.
- **Spotlight:** `Ctrl/Cmd + K` searches apps, projects, articles, skills, services, gallery items and GitHub.
- **Appearance:** wallpaper gallery, light/dark/system themes, accent colours, reduced motion and dock preferences.
- **Mobile:** below 860px the desktop becomes a native-style app grid with full-screen apps, a bottom dock and back navigation.
- **Gestures:** optional, consent-based camera navigation that can be stopped instantly; never required.

The architecture is documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Desktop documentation

The macOS desktop is documented in detail:

| Guide | Contents |
| --- | --- |
| [`docs/DESKTOP.md`](docs/DESKTOP.md) | Layout, icon grid, drag and selection behaviour |
| [`docs/ICONS.md`](docs/ICONS.md) | Icon system, registries and adding artwork |
| [`docs/WALLPAPERS.md`](docs/WALLPAPERS.md) | Wallpaper registry, fallbacks and current artwork |
| [`docs/DOCK.md`](docs/DOCK.md) | Dock items, magnification, glass and running state |
| [`docs/MENUBAR.md`](docs/MENUBAR.md) | Menus, status items, panels and clock |
| [`docs/KEYBOARD.md`](docs/KEYBOARD.md) | Every supported shortcut |
| [`docs/PERSISTENCE.md`](docs/PERSISTENCE.md) | Store keys, migrations and resetting state |
| [`docs/CONTENT.md`](docs/CONTENT.md) | Collections, admin workflow and deep links |
| [`docs/TESTING.md`](docs/TESTING.md) | API and end-to-end test coverage |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Build, hosting, environment and release checks |

## Honest data policy

ARENA AI answers from published records when no provider key is configured, and clearly labels that mode. GitHub analytics display a "data unavailable" state rather than estimates. There are no simulated statistics anywhere in the interface.

## Branding

**Mukeshimana Kevin** — display name **Kevin The Cyber Coder**.

## License

MIT © Mukeshimana Kevin
