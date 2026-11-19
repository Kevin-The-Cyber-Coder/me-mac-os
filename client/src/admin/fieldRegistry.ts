export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'tags'
  | 'date'
  | 'url'
  | 'image'
  | 'json'
  | 'password'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  hint?: string
  options?: string[]
  span?: 1 | 2
  defaultValue?: unknown
}

export interface CollectionConfig {
  title: string
  singular: string
  description: string
  rowTitle: string
  listFields: string[]
  fields: FieldDef[]
  statusField?: string
  readOnly?: boolean
  allowCreate?: boolean
}

const status = (options: string[], defaultValue: string): FieldDef => ({
  key: 'status',
  label: 'Status',
  type: 'select',
  options,
  defaultValue,
})

const order: FieldDef = { key: 'order', label: 'Order', type: 'number', defaultValue: 0, hint: 'Lower numbers appear first.' }

export const COLLECTIONS: Record<string, CollectionConfig> = {
  projects: {
    title: 'Projects',
    singular: 'project',
    description: 'Case studies, their stack, process and publication state.',
    rowTitle: 'title',
    statusField: 'status',
    listFields: ['title', 'category', 'stage', 'featured', 'order'],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true, span: 2 },
      { key: 'slug', label: 'Slug', type: 'text', hint: 'Generated from the title when empty.' },
      { key: 'category', label: 'Category', type: 'text', required: true, placeholder: 'Full-Stack' },
      { key: 'coverImage', label: 'Cover image', type: 'image', span: 2 },
      { key: 'summary', label: 'Summary', type: 'textarea', required: true, span: 2 },
      { key: 'description', label: 'Description', type: 'textarea', span: 2 },
      { key: 'problem', label: 'Problem', type: 'textarea', span: 2 },
      { key: 'solution', label: 'Solution', type: 'textarea', span: 2 },
      { key: 'technologies', label: 'Technologies', type: 'tags', hint: 'Comma separated.' },
      { key: 'features', label: 'Features', type: 'tags' },
      { key: 'tags', label: 'Tags', type: 'tags' },
      { key: 'process', label: 'Process', type: 'json', span: 2, hint: 'Array of { title, description } objects.' },
      { key: 'liveUrl', label: 'Live URL', type: 'url' },
      { key: 'repoUrl', label: 'Repository URL', type: 'url' },
      { key: 'status', label: 'Status', type: 'select', options: ['draft', 'published', 'archived'], defaultValue: 'draft' },
      { key: 'stage', label: 'Stage', type: 'select', options: ['completed', 'in-progress', 'concept'], defaultValue: 'completed' },
      { key: 'featured', label: 'Featured', type: 'boolean', defaultValue: false },
      order,
      { key: 'startedAt', label: 'Started', type: 'date' },
      { key: 'completedAt', label: 'Completed', type: 'date' },
    ],
  },
  skills: {
    title: 'Skills',
    singular: 'skill',
    description: 'The public stack, grouped by category and proficiency.',
    rowTitle: 'name',
    listFields: ['name', 'category', 'level', 'learning', 'featured', 'order'],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', span: 2 },
      { key: 'level', label: 'Level', type: 'select', options: ['expert', 'advanced', 'intermediate', 'learning'], defaultValue: 'advanced' },
      { key: 'learning', label: 'Currently learning', type: 'boolean', defaultValue: false },
      { key: 'featured', label: 'Featured', type: 'boolean', defaultValue: false },
      order,
    ],
  },
  services: {
    title: 'Services',
    singular: 'service',
    description: 'Offers, deliverables and the call to action on each card.',
    rowTitle: 'title',
    listFields: ['title', 'cta', 'order'],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true, span: 2 },
      { key: 'slug', label: 'Slug', type: 'text' },
      { key: 'icon', label: 'Icon key', type: 'text', hint: 'Lucide icon name used by the client.' },
      { key: 'description', label: 'Description', type: 'textarea', required: true, span: 2 },
      { key: 'features', label: 'Features', type: 'tags', span: 2 },
      { key: 'benefits', label: 'Benefits', type: 'tags', span: 2 },
      { key: 'technologies', label: 'Technologies', type: 'tags', span: 2 },
      { key: 'cta', label: 'Call to action', type: 'text', span: 2 },
      order,
    ],
  },
  'blog-categories': {
    title: 'Blog categories',
    singular: 'category',
    description: 'Taxonomy used by articles and filters.',
    rowTitle: 'name',
    listFields: ['name', 'slug', 'color'],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea', span: 2 },
      { key: 'color', label: 'Color', type: 'text', placeholder: '#7c5cff' },
    ],
  },
  blog: {
    title: 'Articles',
    singular: 'article',
    description: 'Markdown journal entries with publication scheduling.',
    rowTitle: 'title',
    statusField: 'status',
    listFields: ['title', 'category', 'status', 'publishedAt', 'views'],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true, span: 2 },
      { key: 'slug', label: 'Slug', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'excerpt', label: 'Excerpt', type: 'textarea', required: true, span: 2 },
      { key: 'content', label: 'Content (Markdown)', type: 'textarea', span: 2, hint: 'Reading time is recalculated on save.' },
      { key: 'coverImage', label: 'Cover image', type: 'image', span: 2 },
      { key: 'tags', label: 'Tags', type: 'tags', span: 2 },
      status(['draft', 'published', 'scheduled'], 'draft'),
      { key: 'publishedAt', label: 'Published at', type: 'date' },
      { key: 'featured', label: 'Featured', type: 'boolean', defaultValue: false },
      { key: 'author', label: 'Author', type: 'text', defaultValue: 'Mukeshimana Kevin' },
      { key: 'seo', label: 'SEO overrides', type: 'json', span: 2, hint: '{ title, description, keywords }' },
    ],
  },
  gallery: {
    title: 'Gallery',
    singular: 'gallery item',
    description: 'Screenshots, product visuals and video walkthroughs.',
    rowTitle: 'title',
    listFields: ['title', 'category', 'type', 'featured', 'order'],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true, span: 2 },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'type', label: 'Type', type: 'select', options: ['image', 'video'], defaultValue: 'image' },
      { key: 'url', label: 'Media URL', type: 'image', required: true, span: 2 },
      { key: 'thumbnail', label: 'Thumbnail URL', type: 'image', span: 2 },
      { key: 'description', label: 'Description', type: 'textarea', span: 2 },
      { key: 'tags', label: 'Tags', type: 'tags', span: 2 },
      { key: 'featured', label: 'Featured', type: 'boolean', defaultValue: false },
      order,
    ],
  },
  testimonials: {
    title: 'Testimonials',
    singular: 'testimonial',
    description: 'Seeded placeholders — replace with real, permissioned quotes.',
    rowTitle: 'name',
    listFields: ['name', 'role', 'company', 'rating', 'featured'],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'company', label: 'Company', type: 'text' },
      { key: 'avatar', label: 'Avatar', type: 'image' },
      { key: 'quote', label: 'Quote', type: 'textarea', required: true, span: 2 },
      { key: 'rating', label: 'Rating (1–5)', type: 'number', defaultValue: 5 },
      { key: 'featured', label: 'Featured', type: 'boolean', defaultValue: false },
    ],
  },
  music: {
    title: 'Music',
    singular: 'track',
    description: 'Tracks, including browser-synthesized ambient pieces.',
    rowTitle: 'title',
    listFields: ['title', 'artist', 'genre', 'featured', 'order'],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'artist', label: 'Artist', type: 'text', defaultValue: 'Kevin The Cyber Coder' },
      { key: 'album', label: 'Album', type: 'text' },
      { key: 'cover', label: 'Cover', type: 'image' },
      { key: 'src', label: 'Audio URL', type: 'url', hint: 'Leave empty when using the built-in synthesizer.' },
      { key: 'duration', label: 'Duration (seconds)', type: 'number' },
      { key: 'genre', label: 'Genre', type: 'text' },
      { key: 'synth', label: 'Synth settings', type: 'json', span: 2, hint: '{ enabled, root, mode, tempo, brightness }' },
      { key: 'featured', label: 'Featured', type: 'boolean', defaultValue: false },
      order,
    ],
  },
  playlists: {
    title: 'Playlists',
    singular: 'playlist',
    description: 'Curated groups of tracks.',
    rowTitle: 'name',
    listFields: ['name', 'order'],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', span: 2 },
      { key: 'tracks', label: 'Track IDs', type: 'tags', span: 2 },
      { key: 'cover', label: 'Cover', type: 'image' },
      order,
    ],
  },
  comments: {
    title: 'Comments',
    singular: 'comment',
    description: 'Visitor discussion. Approve, reject or remove before it appears publicly.',
    rowTitle: 'name',
    statusField: 'status',
    listFields: ['name', 'targetTitle', 'content', 'rating', 'status', 'createdAt'],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', hint: 'Private — never published.' },
      { key: 'targetType', label: 'Target type', type: 'select', options: ['project', 'post', 'portfolio'], defaultValue: 'portfolio' },
      { key: 'targetId', label: 'Target ID', type: 'text' },
      { key: 'targetTitle', label: 'Target title', type: 'text' },
      { key: 'content', label: 'Content', type: 'textarea', required: true, span: 2 },
      { key: 'rating', label: 'Rating', type: 'number' },
      status(['pending', 'approved', 'rejected', 'spam'], 'pending'),
      { key: 'parentId', label: 'Parent comment ID', type: 'text' },
    ],
  },
  feedback: {
    title: 'Feedback',
    singular: 'feedback entry',
    description: 'Private visitor feedback and ratings.',
    rowTitle: 'name',
    statusField: 'status',
    listFields: ['name', 'category', 'message', 'rating', 'status', 'createdAt'],
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'message', label: 'Message', type: 'textarea', span: 2 },
      { key: 'rating', label: 'Rating', type: 'number' },
      status(['new', 'reviewed', 'archived'], 'new'),
    ],
  },
  messages: {
    title: 'Messages',
    singular: 'message',
    description: 'Contact form submissions and their follow-up state.',
    rowTitle: 'subject',
    statusField: 'status',
    listFields: ['name', 'subject', 'service', 'status', 'createdAt'],
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'subject', label: 'Subject', type: 'text' },
      { key: 'service', label: 'Service', type: 'text' },
      { key: 'message', label: 'Message', type: 'textarea', span: 2 },
      status(['new', 'read', 'replied', 'archived'], 'new'),
    ],
  },
  subscribers: {
    title: 'Subscribers',
    singular: 'subscriber',
    description: 'Double opt-in newsletter list with consent timestamps.',
    rowTitle: 'email',
    statusField: 'status',
    listFields: ['email', 'name', 'source', 'status', 'consentAt'],
    fields: [
      { key: 'email', label: 'Email', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'source', label: 'Source', type: 'text' },
      status(['subscribed', 'unsubscribed'], 'subscribed'),
      { key: 'consentAt', label: 'Consent at', type: 'date' },
    ],
  },
  campaigns: {
    title: 'Campaigns',
    singular: 'campaign',
    description: 'Newsletter drafts. Sending requires confirmed subscribers and SMTP.',
    rowTitle: 'subject',
    statusField: 'status',
    listFields: ['subject', 'status', 'recipients', 'sentAt'],
    fields: [
      { key: 'subject', label: 'Subject', type: 'text', required: true, span: 2 },
      { key: 'preview', label: 'Preview text', type: 'text', span: 2 },
      { key: 'content', label: 'HTML content', type: 'textarea', span: 2 },
      status(['draft', 'scheduled', 'sending', 'sent'], 'draft'),
      { key: 'scheduledAt', label: 'Scheduled at', type: 'date' },
    ],
  },
  notifications: {
    title: 'Notifications',
    singular: 'notification',
    description: 'Real-time system notices delivered over Socket.IO.',
    rowTitle: 'title',
    listFields: ['title', 'type', 'read', 'createdAt'],
    fields: [
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'title', label: 'Title', type: 'text', required: true, span: 2 },
      { key: 'message', label: 'Message', type: 'textarea', span: 2 },
      { key: 'link', label: 'Link', type: 'text', span: 2 },
      { key: 'read', label: 'Read', type: 'boolean', defaultValue: false },
    ],
  },
  achievements: {
    title: 'Achievements',
    singular: 'achievement',
    description: 'Verified GitHub progress. Badges are awarded only by GitHub.',
    rowTitle: 'name',
    listFields: ['name', 'key', 'current', 'source', 'verified'],
    fields: [
      { key: 'key', label: 'Key', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'metric', label: 'Metric', type: 'text' },
      { key: 'current', label: 'Current value', type: 'number' },
      { key: 'source', label: 'Source', type: 'select', options: ['github', 'manual', 'estimated'], defaultValue: 'manual' },
      { key: 'verified', label: 'Verified', type: 'boolean', defaultValue: false },
      { key: 'notes', label: 'Notes', type: 'textarea', span: 2 },
      order,
    ],
  },
  sponsorships: {
    title: 'Sponsorships',
    singular: 'sponsorship',
    description: 'Dependency funding candidates verified through FUNDING.yml.',
    rowTitle: 'packageName',
    statusField: 'status',
    listFields: ['packageName', 'repository', 'fundingSource', 'verified', 'status'],
    fields: [
      { key: 'packageName', label: 'Package', type: 'text', required: true },
      { key: 'repository', label: 'Repository', type: 'url' },
      { key: 'maintainers', label: 'Maintainers', type: 'tags' },
      { key: 'fundingUrls', label: 'Funding URLs', type: 'tags', span: 2 },
      { key: 'fundingSource', label: 'Funding source', type: 'text' },
      { key: 'verified', label: 'Verified', type: 'boolean', defaultValue: false },
      status(['unreviewed', 'reviewed', 'sponsored'], 'unreviewed'),
      { key: 'note', label: 'Note', type: 'textarea', span: 2 },
    ],
  },
  audit: {
    title: 'Repository audit',
    singular: 'audit record',
    description: 'Persisted repository health scores and check results.',
    rowTitle: 'repo',
    readOnly: true,
    listFields: ['repo', 'score', 'stars', 'lastAuditedAt'],
    fields: [
      { key: 'repo', label: 'Repository', type: 'text' },
      { key: 'url', label: 'URL', type: 'url' },
      { key: 'description', label: 'Description', type: 'textarea', span: 2 },
      { key: 'stars', label: 'Stars', type: 'number' },
      { key: 'score', label: 'Score', type: 'number' },
      { key: 'checks', label: 'Checks', type: 'json', span: 2 },
      { key: 'lastAuditedAt', label: 'Last audited', type: 'date' },
    ],
  },
  activity: {
    title: 'Activity log',
    singular: 'activity entry',
    description: 'Immutable audit trail of every administrative mutation.',
    rowTitle: 'action',
    readOnly: true,
    listFields: ['action', 'actor', 'entity', 'createdAt'],
    fields: [
      { key: 'actor', label: 'Actor', type: 'text' },
      { key: 'action', label: 'Action', type: 'text' },
      { key: 'entity', label: 'Entity', type: 'text' },
      { key: 'entityId', label: 'Entity ID', type: 'text' },
      { key: 'meta', label: 'Metadata', type: 'json', span: 2 },
      { key: 'createdAt', label: 'Created', type: 'date' },
    ],
  },
  analytics: {
    title: 'Analytics events',
    singular: 'event',
    description: 'Raw privacy-conscious pageview and event records.',
    rowTitle: 'path',
    readOnly: true,
    listFields: ['path', 'event', 'referrer', 'createdAt'],
    fields: [
      { key: 'path', label: 'Path', type: 'text' },
      { key: 'event', label: 'Event', type: 'text' },
      { key: 'referrer', label: 'Referrer', type: 'text' },
      { key: 'sessionId', label: 'Session', type: 'text' },
      { key: 'createdAt', label: 'Created', type: 'date' },
    ],
  },
  'github-accounts': {
    title: 'GitHub snapshots',
    singular: 'snapshot',
    description: 'Cached GitHub account snapshots written by the sync service.',
    rowTitle: 'username',
    readOnly: true,
    listFields: ['username', 'name', 'stars', 'publicRepos', 'followers', 'lastSyncedAt'],
    fields: [
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'stars', label: 'Stars', type: 'number' },
      { key: 'publicRepos', label: 'Public repositories', type: 'number' },
      { key: 'followers', label: 'Followers', type: 'number' },
      { key: 'lastSyncedAt', label: 'Last synced', type: 'date' },
    ],
  },
  'github-activity': {
    title: 'GitHub activity',
    singular: 'activity record',
    description: 'Cached public events from the GitHub API.',
    rowTitle: 'repo',
    readOnly: true,
    listFields: ['repo', 'title', 'type', 'date'],
    fields: [
      { key: 'repo', label: 'Repository', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'date', label: 'Date', type: 'date' },
    ],
  },
  conversations: {
    title: 'AI conversations',
    singular: 'conversation',
    description: 'Visitor conversations retained per the configured policy.',
    rowTitle: 'title',
    readOnly: true,
    listFields: ['title', 'messageCount', 'tokens', 'pinned', 'lastMessageAt'],
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'visitorId', label: 'Visitor ID', type: 'text' },
      { key: 'messageCount', label: 'Messages', type: 'number' },
      { key: 'tokens', label: 'Tokens', type: 'number' },
      { key: 'pinned', label: 'Pinned', type: 'boolean' },
      { key: 'archived', label: 'Archived', type: 'boolean' },
      { key: 'lastMessageAt', label: 'Last message', type: 'date' },
    ],
  },
}

export function getCollection(name?: string): CollectionConfig | null {
  if (!name) return null
  return COLLECTIONS[name] || null
}

export function fieldFor(collection: string, key: string): FieldDef | undefined {
  return COLLECTIONS[collection]?.fields.find((field) => field.key === key)
}

export function emptyRecord(config: CollectionConfig): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  config.fields.forEach((field) => {
    if (field.defaultValue !== undefined) record[field.key] = field.defaultValue
    else if (field.type === 'boolean') record[field.key] = false
    else if (field.type === 'tags') record[field.key] = []
    else if (field.type === 'number') record[field.key] = undefined
    else record[field.key] = ''
  })
  return record
}
