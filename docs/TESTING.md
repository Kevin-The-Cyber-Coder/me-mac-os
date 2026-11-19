# Testing

The project ships with server integration tests and browser end-to-end tests.

## Commands

| Command | Scope |
| --- | --- |
| `npm test` | Vitest API suite in `server/tests` |
| `npm run test:e2e` | Playwright specs in `client/e2e` |
| `npm run lint` | ESLint over `client/src` |
| `npm run build` | Type-check and production build |

## Server tests

`server/tests/api.test.js` boots the Express app with supertest and exercises:

- health and public content routes;
- authentication and refresh rotation;
- admin CRUD with role checks;
- engagement endpoints;
- AI knowledge-base fallback;
- analytics aggregation.

The suite runs against the in-memory store, so it needs no MongoDB instance.

## End-to-end tests

The Playwright suite runs the Vite dev server on port 5173 and the API on port 5000. Specs cover:

- the 13 desktop icons, their labels and the 3 + 2 column layout;
- dock navigation, running indicators and Trash;
- Spotlight search and keyboard navigation;
- window open, focus, minimize and close;
- wallpaper selection and persistence;
- the mobile app grid below 860 px;
- System Settings deep links;
- the menu bar clock and status menus.

## Adding a test

1. Prefer role and label queries over CSS selectors.
2. Clean local storage in `beforeEach` to start from first-run defaults.
3. Assert visible outcomes, not implementation details.
4. Keep the suite deterministic: there are no fake API responses in production code, and tests wait for real UI states.

## What is not tested

Camera gestures require hardware permission and are covered only by a manual checklist. Real GitHub and AI provider calls are not exercised without credentials; the honest unavailable states are tested instead.
