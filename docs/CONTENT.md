# Content

All public content comes from the API and is managed in the admin console at `/admin`. The desktop is a view over that data, not a separate hard-coded site.

## Collections

| Collection | Used by |
| --- | --- |
| Profile | About Me, menu bar, contact details, résumé |
| Settings | site metadata, social links, appearance defaults |
| Projects | Projects folder, project detail windows |
| Skills | Skills folder and grouping |
| Services | Services folder and contact form options |
| Posts | Journal index and article windows |
| Gallery | Gallery app |
| Music | Music app queue |
| Achievements | About Me and GitHub center |
| Comments | Article discussions and moderation |
| Notifications | Notification Center |

## Admin workflow

1. Sign in at `/login` with an administrator account.
2. Open `/admin` and choose a collection.
3. Create or edit an entry using the generated field registry (`client/src/admin/fieldRegistry.ts`).
4. Publish the entry. Drafts are never returned by the public API.
5. Use **Backups** for an export before large content changes.

## Honesty rules

- No mock statistics. Unavailable GitHub or analytics data displays an unavailable state.
- AI answers without a provider key are labelled as knowledge-base responses.
- Counts come from published records; the UI never multiplies or estimates them.
- Uploaded files are validated by type and size on the server.

## Deep links

Content windows are addressable:

- `/projects/:slug`
- `/journal/:slug`
- `/gallery`
- `/about`, `/skills`, `/services`, `/contact`, `/github`, `/terminal`

Closing the window returns to the desktop and `/`. Opening a URL directly opens the matching window and loads the record.
