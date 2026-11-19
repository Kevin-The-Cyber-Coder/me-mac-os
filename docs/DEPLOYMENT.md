# Deployment

The repository is an npm workspace with a Vite frontend and an Express API.

## Build

```bash
npm install
npm run build        # client type-check + Vite bundle into client/dist
npm start            # API on PORT (default 5000)
```

Set `NODE_ENV=production` and provide the environment variables from `.env.example`.

## Environment

Required for a real deployment:

- `MONGODB_URI` — Atlas or self-hosted MongoDB.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SETTINGS_SECRET` — long random values.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — used by `npm run seed`.
- `CLIENT_URL` and `ALLOWED_ORIGINS` — CORS allowlist.

Optional integrations: AI provider key, GitHub token, Cloudinary and SMTP. When absent, the UI shows honest unavailable states.

## Hosting

- Serve `client/dist` from a static host or CDN.
- Run the API as a long-lived Node process (Render, Fly.io, Railway, a VPS with systemd).
- Configure SPA fallback so unknown paths return `index.html`; the desktop router handles deep links itself.
- Terminate TLS at the proxy. Refresh cookies are `secure` and `sameSite=none` in production.

## Seed and admin

```bash
npm run seed
```

The seed script is idempotent: it creates missing settings, profile, projects, skills, services, posts, gallery, music, achievements and the bootstrap administrator. Change the seeded credentials immediately after the first production login.

## Health

`GET /api/health` returns environment, database mode and integration status. Use it for uptime checks. The endpoint never exposes secrets.

## Checks before release

```bash
npm run lint
npm run build
npm test
npm run test:e2e
```
