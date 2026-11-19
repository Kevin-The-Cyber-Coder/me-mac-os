import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { repo } from '../config/store.js'
import { ensureAchievementDocs } from '../services/achievements.js'
import { readingTime } from '../utils/helpers.js'

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000)
const img = (seed, w = 1200, h = 720) => `https://picsum.photos/seed/${seed}/${w}/${h}`

const settingsDoc = {
  key: 'site',
  general: {
    siteName: 'Kevin The Cyber Coder',
    title: 'Kevin The Cyber Coder — Full-Stack Developer & Technology Innovator',
    description:
      'Interactive macOS-inspired portfolio of Mukeshimana Kevin — full-stack developer, software engineer and technology innovator building modern digital experiences, intelligent applications and scalable systems.',
    email: 'hello@kevinthecybercoder.dev',
    phone: '',
    location: 'Remote · Worldwide',
    resumeUrl: '/resume/Mukeshimana-Kevin-CV.pdf',
  },
  appearance: { accent: 'violet', defaultTheme: 'dark', wallpaper: 'aurora', glass: 0.7, reduceMotion: false },
  seo: {
    keywords: ['Mukeshimana Kevin', 'Kevin The Cyber Coder', 'full-stack developer', 'MERN', 'AI engineer', 'portfolio'],
    ogImage: img('kevin-og', 1200, 630),
    twitterHandle: '',
    canonical: 'https://kevinthecybercoder.dev',
  },
  ai: {
    enabled: true,
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    systemPrompt: '',
    maxTokens: 1200,
    temperature: 0.7,
    dailyLimit: 60,
    retentionDays: 30,
  },
  github: { username: env.github.username, cacheTtlSeconds: 600 },
  features: {
    music: true,
    gestures: true,
    assistant: true,
    universe: true,
    terminal: true,
    newsletter: true,
    comments: true,
  },
  maintenance: { enabled: false, message: 'Scheduled maintenance — back shortly.' },
}

const profileDoc = {
  name: 'Mukeshimana Kevin',
  displayName: 'Kevin The Cyber Coder',
  title: 'Full-Stack Developer | Software Engineer | Technology Innovator | Problem Solver',
  tagline: "Building Tomorrow's Technology, One Innovation at a Time.",
  shortBio:
    'Full-stack developer and technology innovator crafting modern digital experiences, intelligent applications and scalable systems.',
  bio: `I'm Mukeshimana Kevin — known professionally as Kevin The Cyber Coder. I build software at the intersection of engineering precision and product craft.

My work spans full-stack web platforms, AI-powered applications, automation tooling and connected hardware. I care about systems that stay understandable as they grow: clean boundaries, honest data models, measurable performance and interfaces that feel effortless.

I approach every project as a product problem first and a code problem second — clarifying the real constraint, designing the smallest coherent solution, then hardening it with tests, observability and documentation.

This portfolio is itself a build artifact: a macOS-inspired desktop shell, a real content API, a streaming AI assistant, an optional camera gesture layer and a GitHub command center that refuses to invent statistics.`,
  avatar: '/avatar.svg',
  resumeUrl: '/resume/Mukeshimana-Kevin-CV.pdf',
  email: 'hello@kevinthecybercoder.dev',
  phone: '',
  location: 'Remote · Worldwide',
  availability: { status: 'available', label: 'Available for select projects & collaboration' },
  socials: [
    { label: 'GitHub', url: 'https://github.com/kevinthecybercoder', icon: 'Github' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/mukeshimana-kevin', icon: 'Linkedin' },
    { label: 'X', url: 'https://x.com/kevinthecybercoder', icon: 'Twitter' },
    { label: 'Email', url: 'mailto:hello@kevinthecybercoder.dev', icon: 'Mail' },
  ],
  mission:
    'Build dependable software that gives people leverage — intelligent tools that remove friction, explain themselves and respect their users.',
  vision:
    'Grow into a technology innovator shipping open, well-documented systems across web, AI and connected devices, while helping other developers level up in public.',
  values: [
    { title: 'Clarity over cleverness', description: 'Readable systems outlive impressive ones. I optimise for the next engineer.', icon: 'Eye' },
    { title: 'Security by default', description: 'Validation, least privilege and secret hygiene are design constraints, not afterthoughts.', icon: 'ShieldCheck' },
    { title: 'Evidence over hype', description: 'No fabricated metrics. Measure, verify, then claim.', icon: 'LineChart' },
    { title: 'Relentless iteration', description: 'Ship a coherent slice, learn from real usage, improve the system.', icon: 'RefreshCw' },
  ],
  interests: [
    'Distributed systems',
    'Applied AI & retrieval',
    'Developer tooling',
    'Human–computer interaction',
    'Cybersecurity',
    'IoT & edge computing',
    'Open source',
    'Product design',
  ],
  education: [
    {
      institution: 'Continuous, project-based engineering practice',
      degree: 'Software Engineering',
      field: 'Full-stack development, systems & AI',
      start: '2020',
      end: 'Present',
      description:
        'Self-directed and collaborative learning anchored in shipped software: MERN platforms, REST/GraphQL APIs, cloud deployment, testing and security fundamentals.',
    },
    {
      institution: 'Open-source & community learning',
      degree: 'Collaborative Development',
      field: 'Code review, documentation, maintainership',
      start: '2022',
      end: 'Present',
      description:
        'Contributing to and reviewing open-source projects, writing technical documentation and mentoring newer developers.',
    },
  ],
  experience: [
    {
      company: 'Independent practice',
      role: 'Full-Stack Developer & Technology Innovator',
      start: '2021',
      end: 'Present',
      current: true,
      description:
        'Design and ship end-to-end products: React/TypeScript interfaces, Node/Express APIs, MongoDB data models, AI integrations, CI/CD and cloud deployment.',
      technologies: ['React', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'Docker', 'AI APIs'],
    },
    {
      company: 'Collaborative product builds',
      role: 'Software Engineer (contract & open source)',
      start: '2022',
      end: 'Present',
      current: true,
      description:
        'Deliver focused features in small pull requests, review code, improve documentation and automate release workflows.',
      technologies: ['Next.js', 'PostgreSQL', 'Tailwind CSS', 'GitHub Actions', 'Testing'],
    },
  ],
  timeline: [
    { year: '2020', title: 'First production interface', description: 'Moved from tutorials to shipping interfaces real people used daily.', type: 'milestone' },
    { year: '2021', title: 'Full-stack systems', description: 'Built complete MERN products with authentication, payments and admin tooling.', type: 'milestone' },
    { year: '2022', title: 'Open-source collaboration', description: 'Started contributing focused pull requests and reviewing code with other developers.', type: 'github' },
    { year: '2023', title: 'Applied AI', description: 'Integrated retrieval-augmented assistants and streaming LLM interfaces into products.', type: 'ai' },
    { year: '2025', title: 'Developer experience focus', description: 'Standardised testing, CI, documentation and observability across projects.', type: 'engineering' },
    { year: '2026', title: 'Kevin The Cyber Coder OS', description: 'Launched this macOS-inspired portfolio and ARENA AI ecosystem.', type: 'launch' },
  ],
  futureGoals: [
    'Publish a production-grade open-source AI tool with clear documentation.',
    'Grow genuine open-source collaboration through reviewed, focused pull requests.',
    'Deepen expertise in distributed systems and edge computing.',
    'Mentor developers entering full-stack engineering.',
  ],
  stats: [
    { label: 'Projects shipped', value: '18', suffix: '+' },
    { label: 'Technologies used', value: '30', suffix: '+' },
    { label: 'Articles written', value: '6', suffix: '' },
    { label: 'Coffee per sprint', value: '∞', suffix: '' },
  ],
}

const projects = [
  {
    title: 'ARENA OS — Portfolio & AI Ecosystem',
    slug: 'arena-os-portfolio-ai-ecosystem',
    category: 'AI Projects',
    coverImage: img('arena-os'),
    gallery: [img('arena-os-1'), img('arena-os-2'), img('arena-os-3')],
    summary:
      'A macOS-inspired developer operating system with a real content API, streaming AI assistant, gesture navigation and a GitHub command center.',
    description:
      'ARENA OS is the portfolio you are using. It combines a desktop-style shell (menu bar, dock, draggable windows, command palette) with a production Express/MongoDB API, an admin control center and ARENA AI — a streaming assistant grounded in real portfolio data.',
    problem:
      'Most developer portfolios are static brochures. They cannot answer questions, cannot be maintained without code changes and have no measurable engagement.',
    solution:
      'A content-driven platform: every section is served from MongoDB, the admin panel performs full CRUD, and ARENA AI answers visitor questions from published data with a knowledge-base fallback when no AI provider is configured.',
    technologies: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Framer Motion', 'Node.js', 'Express', 'MongoDB', 'Socket.IO', 'Three.js'],
    features: [
      'macOS desktop shell with dock magnification and command palette (Ctrl + K)',
      'ARENA AI streaming chat with conversation history and export',
      'Optional MediaPipe hand/head gesture navigation with instant stop',
      'GitHub Command Center with verified achievement progress',
      'Admin CRUD for every content type, analytics and newsletter campaigns',
    ],
    process: [
      { title: 'Architecture', description: 'Defined a monorepo, typed API contracts and a repository layer with a Mongo-first, memory-safe fallback for tests.' },
      { title: 'Design system', description: 'Built glassmorphism tokens, motion primitives and accessible focus states before writing page code.' },
      { title: 'Vertical slices', description: 'Shipped public pages, then admin CRUD, then AI, then GitHub — each independently testable.' },
    ],
    liveUrl: 'https://kevinthecybercoder.dev',
    repoUrl: 'https://github.com/kevinthecybercoder/kevin-cyber-portfolio',
    status: 'published',
    stage: 'completed',
    featured: true,
    tags: ['portfolio', 'ai', 'macos', 'full-stack'],
    views: 0,
    likes: 0,
    order: 1,
    startedAt: daysAgo(120),
    completedAt: daysAgo(2),
  },
  {
    title: 'Nexus Commerce',
    slug: 'nexus-commerce',
    category: 'Web Applications',
    coverImage: img('nexus-commerce'),
    gallery: [img('nexus-1'), img('nexus-2')],
    summary: 'A MERN commerce platform with Stripe checkout, inventory sync and a real-time operations dashboard.',
    description:
      'Nexus Commerce is a full-stack storefront and back office. It handles catalogue management, cart persistence, checkout, order lifecycle and inventory reconciliation, with an admin dashboard that updates over Socket.IO.',
    problem: 'Small merchants stitch together storefronts, spreadsheets and chat threads, losing stock accuracy and order context.',
    solution: 'One system of record: typed product models, transactional order updates, idempotent webhooks and a live operations view.',
    technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Stripe', 'Socket.IO', 'Tailwind CSS'],
    features: ['Catalogue CRUD with image pipeline', 'Idempotent Stripe webhooks', 'Real-time order board', 'Role-based staff accounts'],
    process: [
      { title: 'Domain modelling', description: 'Mapped products, variants, carts and orders before writing endpoints.' },
      { title: 'Payments hardening', description: 'Verified webhook signatures, replay protection and failure states.' },
    ],
    liveUrl: '',
    repoUrl: 'https://github.com/kevinthecybercoder/nexus-commerce',
    status: 'published',
    stage: 'completed',
    featured: true,
    tags: ['ecommerce', 'mern', 'stripe'],
    views: 0,
    likes: 0,
    order: 2,
    startedAt: daysAgo(300),
    completedAt: daysAgo(180),
  },
  {
    title: 'PulseOps — Operations Command Center',
    slug: 'pulseops-command-center',
    category: 'Software Systems',
    coverImage: img('pulseops'),
    gallery: [img('pulseops-1')],
    summary: 'Internal tooling that turns scattered operational signals into one prioritised, auditable queue.',
    description:
      'PulseOps aggregates events from support, billing and deployment systems into a single triage surface with SLAs, ownership and a complete audit trail.',
    problem: 'Operational context lived in four tools; handoffs dropped critical signals and nobody could reconstruct decisions.',
    solution: 'Event normalisation, deterministic priority scoring and an append-only activity log with role-based actions.',
    technologies: ['TypeScript', 'React', 'Express', 'PostgreSQL', 'Redis', 'Docker'],
    features: ['Normalised event ingestion', 'SLA timers and escalation', 'Immutable audit log', 'Saved views per team'],
    process: [{ title: 'Signal mapping', description: 'Interviewed operators and modelled every event source before building UI.' }],
    liveUrl: '',
    repoUrl: 'https://github.com/kevinthecybercoder/pulseops',
    status: 'published',
    stage: 'in-progress',
    featured: true,
    tags: ['operations', 'systems', 'typescript'],
    views: 0,
    likes: 0,
    order: 3,
    startedAt: daysAgo(90),
  },
  {
    title: 'Sentinel IoT Grid',
    slug: 'sentinel-iot-grid',
    category: 'IoT and Hardware',
    coverImage: img('sentinel-iot'),
    gallery: [img('sentinel-1'), img('sentinel-2')],
    summary: 'ESP32 sensor mesh with MQTT telemetry, anomaly alerts and a live web dashboard.',
    description:
      'Sentinel monitors temperature, humidity and power draw across distributed nodes. Devices publish over MQTT; the API validates, stores and streams telemetry to a live dashboard with alerting thresholds.',
    problem: 'Facilities teams discovered equipment failures only after downtime, with no historical signal.',
    solution: 'Low-cost sensor nodes, a hardened MQTT bridge and server-side threshold evaluation that pushes alerts within seconds.',
    technologies: ['ESP32', 'C++', 'MQTT', 'Node.js', 'MongoDB', 'React', 'WebSockets'],
    features: ['OTA firmware updates', 'Offline buffering on device', 'Anomaly thresholds', 'Live charts with historical replay'],
    process: [{ title: 'Hardware prototype', description: 'Validated sensor accuracy and power budget before scaling nodes.' }],
    liveUrl: '',
    repoUrl: 'https://github.com/kevinthecybercoder/sentinel-iot-grid',
    status: 'published',
    stage: 'completed',
    featured: false,
    tags: ['iot', 'esp32', 'realtime'],
    views: 0,
    likes: 0,
    order: 4,
    startedAt: daysAgo(420),
    completedAt: daysAgo(330),
  },
  {
    title: 'FlowForge Automations',
    slug: 'flowforge-automations',
    category: 'Automation',
    coverImage: img('flowforge'),
    gallery: [img('flowforge-1')],
    summary: 'A visual automation engine for repetitive back-office workflows, with retries and human approval gates.',
    description:
      'FlowForge lets teams compose triggers, conditions and actions, then run them with idempotency keys, retry policies and approval steps for sensitive operations.',
    problem: 'Repetitive data movement consumed hours weekly and failed silently when upstream APIs changed.',
    solution: 'A typed step registry, durable execution records and explicit approval gates for anything irreversible.',
    technologies: ['Node.js', 'TypeScript', 'BullMQ', 'Redis', 'React', 'MongoDB'],
    features: ['Visual flow builder', 'Retry with backoff', 'Approval gates', 'Execution replay and diffing'],
    process: [{ title: 'Failure-first design', description: 'Enumerated failure modes per step before implementing the happy path.' }],
    liveUrl: '',
    repoUrl: 'https://github.com/kevinthecybercoder/flowforge',
    status: 'published',
    stage: 'in-progress',
    featured: false,
    tags: ['automation', 'queues', 'workflow'],
    views: 0,
    likes: 0,
    order: 5,
    startedAt: daysAgo(60),
  },
  {
    title: 'PocketPulse',
    slug: 'pocketpulse',
    category: 'Mobile Applications',
    coverImage: img('pocketpulse'),
    gallery: [img('pocketpulse-1')],
    summary: 'Offline-first habit and focus tracker with local notifications and privacy-respecting analytics.',
    description:
      'PocketPulse helps users build focus rituals. Data lives on-device first, syncs opportunistically and never leaves the device unless the user opts in.',
    problem: 'Habit apps demand accounts and harvest behavioural data before delivering any value.',
    solution: 'Local-first storage, optional encrypted sync and zero third-party trackers.',
    technologies: ['React Native', 'Expo', 'SQLite', 'TypeScript', 'Zustand'],
    features: ['Offline streaks', 'Focus timers', 'Local notifications', 'Optional encrypted sync'],
    process: [{ title: 'Privacy model', description: 'Wrote the data-retention policy before the first screen.' }],
    liveUrl: '',
    repoUrl: 'https://github.com/kevinthecybercoder/pocketpulse',
    status: 'published',
    stage: 'concept',
    featured: false,
    tags: ['mobile', 'offline-first', 'privacy'],
    views: 0,
    likes: 0,
    order: 6,
    startedAt: daysAgo(30),
  },
]

const skillGroups = {
  Programming: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'PHP', 'Ruby', 'Kotlin', 'Swift', 'Dart', 'C#', 'SQL'],
  Frontend: ['React', 'Next.js', 'HTML5', 'CSS3', 'Tailwind CSS', 'Redux'],
  Backend: ['Node.js', 'Express', 'Django', 'FastAPI'],
  Databases: ['MongoDB', 'PostgreSQL', 'MySQL', 'Firebase'],
  Tools: ['Git', 'GitHub', 'Docker', 'Postman', 'Figma', 'VS Code'],
  Additional: ['AI Integration', 'API Development', 'Cloud Computing', 'IoT', 'Software Architecture'],
}

const skillLevels = {
  JavaScript: 'expert', TypeScript: 'advanced', Python: 'advanced', Java: 'intermediate', 'C++': 'intermediate',
  PHP: 'intermediate', Ruby: 'learning', Kotlin: 'learning', Swift: 'learning', Dart: 'intermediate', 'C#': 'learning',
  SQL: 'advanced', React: 'expert', 'Next.js': 'advanced', HTML5: 'expert', CSS3: 'expert', 'Tailwind CSS': 'expert',
  Redux: 'advanced', 'Node.js': 'advanced', Express: 'advanced', Django: 'intermediate', FastAPI: 'intermediate',
  MongoDB: 'advanced', PostgreSQL: 'advanced', MySQL: 'intermediate', Firebase: 'intermediate', Git: 'advanced',
  GitHub: 'advanced', Docker: 'intermediate', Postman: 'advanced', Figma: 'intermediate', 'VS Code': 'expert',
  'AI Integration': 'advanced', 'API Development': 'advanced', 'Cloud Computing': 'intermediate', IoT: 'intermediate',
  'Software Architecture': 'advanced',
}

const skillDescriptions = {
  TypeScript: 'Typed contracts across client and server; discriminated unions for API payloads.',
  React: 'Component architecture, suspense boundaries, state isolation and accessibility.',
  'Node.js': 'Streaming APIs, background jobs, graceful shutdown and observability.',
  MongoDB: 'Schema design, indexes, aggregation pipelines and referential discipline.',
  'AI Integration': 'Streaming completions, grounded retrieval, provider abstraction and key isolation.',
  'Software Architecture': 'Boundaries, failure domains, ADRs and incremental migration paths.',
}

const skills = Object.entries(skillGroups).flatMap(([category, names], groupIndex) =>
  names.map((name, index) => ({
    name,
    category,
    icon: '',
    description: skillDescriptions[name] || `${name} used across production builds, experiments and open-source work.`,
    level: skillLevels[name] || 'intermediate',
    learning: (skillLevels[name] || '') === 'learning',
    featured: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'AI Integration', 'Docker'].includes(name),
    order: groupIndex * 100 + index,
  }))
)

const services = [
  { title: 'Website Development', icon: 'Globe', description: 'Fast, accessible marketing sites and portfolios with real content management, SEO and analytics.', features: ['Responsive design', 'CMS integration', 'SEO foundations', 'Performance budget'], benefits: ['Launch quickly', 'Own your content', 'Rank and convert'], technologies: ['React', 'Next.js', 'Tailwind CSS'] },
  { title: 'Full-Stack Development', icon: 'Layers', description: 'End-to-end product builds: typed React interfaces, Express APIs, MongoDB models and deployment.', features: ['API design', 'Authentication', 'Database modelling', 'CI/CD'], benefits: ['One accountable partner', 'Coherent architecture', 'Production readiness'], technologies: ['React', 'TypeScript', 'Node.js', 'MongoDB'] },
  { title: 'Mobile Applications', icon: 'Smartphone', description: 'Cross-platform mobile apps with offline-first data, notifications and store-ready builds.', features: ['React Native', 'Offline sync', 'Push notifications', 'App store preparation'], benefits: ['One codebase', 'Native feel', 'Privacy-respecting'], technologies: ['React Native', 'Expo', 'SQLite'] },
  { title: 'Business Systems', icon: 'Briefcase', description: 'Internal tools that replace spreadsheets: inventory, CRM, approvals and operational dashboards.', features: ['Role-based access', 'Audit trails', 'Workflow automation', 'Reporting'], benefits: ['Less manual work', 'Clear accountability', 'Data you can trust'], technologies: ['React', 'Express', 'PostgreSQL'] },
  { title: 'Database Design', icon: 'Database', description: 'Schema design, indexing and migration planning for systems that need to grow without rewrites.', features: ['Access-pattern modelling', 'Index strategy', 'Migration plans', 'Backup strategy'], benefits: ['Predictable performance', 'Safer changes', 'Lower cost'], technologies: ['MongoDB', 'PostgreSQL', 'Redis'] },
  { title: 'API Development', icon: 'Plug', description: 'REST and GraphQL APIs with validation, versioning, rate limits and documentation.', features: ['OpenAPI docs', 'Validation', 'Rate limiting', 'Integration tests'], benefits: ['Reliable integrations', 'Fewer regressions', 'Faster onboarding'], technologies: ['Node.js', 'Express', 'Zod'] },
  { title: 'AI Integration', icon: 'BrainCircuit', description: 'Grounded AI assistants, streaming chat, retrieval and safe provider configuration.', features: ['Streaming responses', 'Retrieval grounding', 'Usage limits', 'Key isolation'], benefits: ['Real utility', 'No hallucinated data', 'Controlled cost'], technologies: ['OpenAI-compatible APIs', 'Node.js', 'React'] },
  { title: 'Workflow Automation', icon: 'Workflow', description: 'Automate repetitive operations with retries, idempotency and human approval gates.', features: ['Event triggers', 'Durable retries', 'Approval steps', 'Audit logs'], benefits: ['Save hours weekly', 'Fewer errors', 'Full traceability'], technologies: ['Node.js', 'BullMQ', 'Redis'] },
  { title: 'E-commerce', icon: 'ShoppingCart', description: 'Storefronts and back offices with secure checkout, inventory and order lifecycle management.', features: ['Secure payments', 'Inventory sync', 'Order tracking', 'Admin tooling'], benefits: ['Higher conversion', 'Accurate stock', 'Operational clarity'], technologies: ['React', 'Stripe', 'MongoDB'] },
  { title: 'UI/UX Design', icon: 'PenTool', description: 'Interface systems, prototypes and design tokens that translate cleanly into code.', features: ['Design system', 'Interactive prototypes', 'Accessibility review', 'Motion guidelines'], benefits: ['Consistent product', 'Faster delivery', 'Happier users'], technologies: ['Figma', 'Tailwind CSS', 'Framer Motion'] },
  { title: 'Custom Software', icon: 'Code2', description: 'Bespoke tools for problems no off-the-shelf product fits, built to be maintained.', features: ['Discovery', 'Iterative delivery', 'Documentation', 'Handover'], benefits: ['Exact fit', 'Own the code', 'No vendor lock-in'], technologies: ['TypeScript', 'React', 'Node.js'] },
  { title: 'Technical Consultation', icon: 'MessagesSquare', description: 'Architecture reviews, performance audits and security hardening for existing teams.', features: ['Architecture review', 'Performance audit', 'Security checklist', 'Actionable roadmap'], benefits: ['Clear priorities', 'Reduced risk', 'Independent perspective'], technologies: ['Code review', 'Threat modelling', 'Profiling'] },
].map((s, index) => ({ ...s, slug: s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), cta: 'Discuss this service', order: index }))

const blogCategories = [
  { name: 'Engineering', slug: 'engineering', description: 'Architecture, APIs and delivery practice.', color: '#7c5cff' },
  { name: 'AI', slug: 'ai', description: 'Applied AI, retrieval and streaming interfaces.', color: '#22d3ee' },
  { name: 'Security', slug: 'security', description: 'Practical hardening for web applications.', color: '#34d399' },
  { name: 'Open Source', slug: 'open-source', description: 'Contribution workflows and maintainership.', color: '#f59e0b' },
  { name: 'Design', slug: 'design', description: 'Interface systems, motion and accessibility.', color: '#ec4899' },
]

const posts = [
  {
    title: 'Designing a macOS-inspired portfolio that actually ships',
    slug: 'macos-inspired-portfolio-that-ships',
    excerpt: 'A desktop shell is a design constraint, not a gimmick. Here is how the window, dock and command palette model holds together without sacrificing accessibility.',
    category: 'Design',
    tags: ['design-system', 'react', 'accessibility'],
    coverImage: img('blog-macos'),
    featured: true,
    status: 'published',
    publishedAt: daysAgo(6),
    views: 0,
    likes: 0,
    seo: { title: 'Designing a macOS-inspired developer portfolio', description: 'Desktop-shell design constraints, motion budgets and accessibility.', keywords: ['portfolio', 'macos', 'react'] },
    content: `A macOS shell gives visitors a mental model they already have: a menu bar, a dock, windows, and a command palette. The risk is that the metaphor becomes decoration. The fix is to make the metaphor carry real behaviour.

## Start with the window contract

Every page renders inside one window frame with three honest controls:

- **Close** returns to the desktop home.
- **Minimise** collapses the window into a restore chip.
- **Maximise** removes the frame padding for reading-heavy pages.

If a control cannot do something meaningful, remove it. Fake traffic lights are worse than no traffic lights.

## Dock magnification without layout thrash

Magnification should be driven by pointer distance, not CSS sibling selectors:

~~~tsx
const distance = Math.abs(mouseX - itemCenter)
const scale = 1 + Math.max(0, 1 - distance / 160) * 0.35
~~~

Spring the scale value and keep the hit target fixed. The visual grows; the click area does not shift under the cursor.

## Keyboard parity is non-negotiable

A desktop metaphor implies keyboard expectations. Provide:

1. \`Ctrl + K\` for the command palette.
2. Arrow-key navigation with a visible focus ring.
3. \`Escape\` to close every overlay.
4. A skip link before the shell chrome.

## Motion budget

Animate transform and opacity only, cap durations at ~240ms, and honour \`prefers-reduced-motion\` at the provider level so individual components cannot forget. If the 3D universe is disabled, the page must still be complete.

## What I would do differently

I would build the design tokens before the shell. Retrofitting glass surfaces after twelve pages exist is a tax you pay in every component.`,
  },
  {
    title: 'Streaming AI responses in Express without leaking your API key',
    slug: 'streaming-ai-responses-express',
    excerpt: 'A server-side proxy pattern for token streaming, abort handling, daily limits and graceful degradation when the provider is down.',
    category: 'AI',
    tags: ['node', 'express', 'sse', 'ai'],
    coverImage: img('blog-streaming'),
    featured: true,
    status: 'published',
    publishedAt: daysAgo(14),
    views: 0,
    likes: 0,
    seo: { title: 'Streaming AI responses in Express safely', description: 'SSE proxying, abort signals and provider fallbacks.', keywords: ['express', 'sse', 'ai'] },
    content: `The browser should never see your provider key. That single rule determines the architecture: the client talks to your API, your API talks to the provider.

## Server-sent events are enough

Token streaming does not require WebSockets. A POST request that returns \`text/event-stream\` is simpler to secure and works with standard fetch.

~~~js
res.setHeader('Content-Type', 'text/event-stream')
res.setHeader('Cache-Control', 'no-cache, no-transform')
res.setHeader('X-Accel-Buffering', 'no')
res.flushHeaders()

const send = (payload) => res.write(\`data: \${JSON.stringify(payload)}\\n\\n\`)
~~~

## Parse provider frames defensively

Chunks split mid-line. Keep a buffer, split on newlines, and only parse complete \`data:\` lines. Ignore \`[DONE]\` and malformed keep-alives.

## Abort when the visitor leaves

~~~js
const controller = new AbortController()
res.on('close', () => controller.abort())
~~~

Pass that signal to \`fetch\`. Without it, abandoned conversations keep burning tokens.

## Enforce limits server-side

Per-IP rate limiting is not enough; a shared office IP would throttle everyone. Track a per-visitor daily message count in the database and reject before opening the stream.

## Degrade honestly

When the provider is unreachable, do not return a fabricated answer. Fall back to a retrieval layer over your own published content, label the response source, and tell the visitor which mode they are in.`,
  },
  {
    title: 'A MongoDB schema strategy for content-driven portfolios',
    slug: 'mongodb-schema-strategy-content-portfolio',
    excerpt: 'Modelling projects, articles and engagement without letting a portfolio database become a swamp.',
    category: 'Engineering',
    tags: ['mongodb', 'schema', 'node'],
    coverImage: img('blog-mongo'),
    featured: false,
    status: 'published',
    publishedAt: daysAgo(26),
    views: 0,
    likes: 0,
    seo: { title: 'MongoDB schema strategy for content platforms', description: 'Indexes, references and pagination for portfolio content.', keywords: ['mongodb', 'mongoose', 'schema'] },
    content: `A portfolio has five content shapes: identity, catalogue, editorial, engagement and telemetry. Treating them the same is the usual mistake.

## Embed what you always read together

Project features, process steps and gallery links belong inside the project document. They are bounded, always rendered together, and never queried independently.

## Reference what grows without bound

Comments must not live inside posts. They are unbounded, moderated independently and paginated. Store \`targetType\` + \`targetId\` and index both.

~~~js
commentSchema.index({ targetType: 1, targetId: 1, status: 1, createdAt: -1 })
~~~

## Design indexes from access patterns

For a blog list page you need:

1. Published posts, newest first.
2. Category filter, newest first.
3. Slug lookup.

~~~js
postSchema.index({ status: 1, publishedAt: -1 })
postSchema.index({ status: 1, category: 1, publishedAt: -1 })
~~~

## Never expose private fields by default

Mark visitor emails \`select: false\`, then explicitly opt in for admin queries. It is a small habit that prevents a large class of leaks.

## Keep a repository boundary

Controllers should not care whether data lives in Mongo or in memory. A thin repository layer made the test suite runnable without infrastructure and kept query logic in one place.`,
  },
  {
    title: 'Gesture navigation with MediaPipe: consent, control and graceful failure',
    slug: 'gesture-navigation-mediapipe-consent',
    excerpt: 'Camera interaction can be genuinely useful — if it is optional, local, interruptible and never the only path.',
    category: 'Engineering',
    tags: ['mediapipe', 'accessibility', 'browser'],
    coverImage: img('blog-gesture'),
    featured: false,
    status: 'published',
    publishedAt: daysAgo(40),
    views: 0,
    likes: 0,
    seo: { title: 'MediaPipe gesture navigation done responsibly', description: 'Local processing, consent and fallbacks for camera gestures.', keywords: ['mediapipe', 'gestures', 'accessibility'] },
    content: `Camera gesture control is a delight feature. The moment it becomes mandatory, it is an accessibility failure.

## Consent before pixels

Do not request camera permission on page load. Open an explicit panel, explain that frames are processed locally, and request access only when the visitor starts the session.

## Local processing

MediaPipe Tasks Vision runs in the browser via WebAssembly. Frames never leave the device. No recording, no face identification, no biometric storage.

## Make stopping obvious

The active session shows a persistent indicator and a large stop control. Stopping must release the camera track immediately:

~~~js
stream.getTracks().forEach((track) => track.stop())
~~~

## Cooldowns prevent chaos

A swipe is a sequence of frames. Debounce gestures with a cooldown window and require a neutral frame before the next trigger. Otherwise one wave navigates five pages.

## Always keep the keyboard path

Every gesture maps to an existing keyboard or pointer action. If the camera fails to initialise, show a clear message and continue as a normal website.`,
  },
  {
    title: 'GitHub achievements without gaming the system',
    slug: 'github-achievements-without-gaming',
    excerpt: 'Pull Shark, Starstruck and friends are outputs of good habits — not targets to manufacture.',
    category: 'Open Source',
    tags: ['github', 'open-source', 'collaboration'],
    coverImage: img('blog-github'),
    featured: true,
    status: 'published',
    publishedAt: daysAgo(55),
    views: 0,
    likes: 0,
    seo: { title: 'Earning GitHub achievements honestly', description: 'Healthy contribution habits instead of metric manipulation.', keywords: ['github', 'achievements', 'open-source'] },
    content: `GitHub achievements are a mirror of contribution habits. The moment you optimise the mirror instead of the work, the signal becomes worthless.

## Split work into reviewable pull requests

A 2,000-line PR is a liability. Break features into coherent slices: schema, API, UI, tests, documentation. Each slice gets a descriptive title, a linked issue and a clear test plan.

## Co-authorship is attribution, not a cheat code

The \`Co-authored-by\` trailer records genuine joint work. Only add it when both people contributed and agreed. Inventing identities is fraud, and it poisons the commit history you will rely on later.

## Repository quality earns stars

Stars follow usefulness and discoverability:

- A README that explains the problem in the first paragraph.
- Install steps that actually work on a clean machine.
- Screenshots or a short demo GIF.
- A license, contribution guide and issue templates.
- Accurate topics so the right people find it.

Never buy stars or coordinate artificial engagement.

## Discussions are support work

Accepted answers come from answering real questions carefully. Enable Discussions where it makes sense, seed an FAQ from genuine repeated questions, and write answers you would want to receive.

## Quickdraw and YOLO are edge cases, not strategies

A five-minute typo fix is legitimate. Opening meaningless issues to farm a badge is not. Never skip review for authentication, authorization, security, data or dependency changes.

## The honest dashboard

Track verified metrics from the GitHub API, label manual checks clearly, and link to the official profile for badge status. GitHub decides who earns an achievement. Your job is to do work worth recognising.`,
  },
  {
    title: 'Three.js performance budgets for portfolio 3D scenes',
    slug: 'threejs-performance-budgets-portfolio',
    excerpt: 'A 3D universe should feel like a bonus, not a tax. Budgets, fallbacks and the reduced-motion contract.',
    category: 'Engineering',
    tags: ['threejs', 'performance', 'react-three-fiber'],
    coverImage: img('blog-three'),
    featured: false,
    status: 'published',
    publishedAt: daysAgo(70),
    views: 0,
    likes: 0,
    seo: { title: 'Three.js performance budgets for portfolios', description: 'Frame budgets, instancing and fallbacks for 3D scenes.', keywords: ['threejs', 'performance', 'r3f'] },
    content: `A portfolio 3D scene has one job: communicate structure quickly without blocking the actual content.

## Set a frame budget before the scene

On mid-range mobile, target 30fps and a 16ms CPU frame. That rules out expensive post-processing and large shadow maps immediately.

## Instance everything repeated

Particles, stars and technology glyphs should be instanced. One draw call beats two thousand.

~~~jsx
<instancedMesh args={[geometry, material, count]} />
~~~

## Cap device pixel ratio

~~~js
<Canvas dpr={[1, 1.75]} />
~~~

Retina at 3x multiplies fragment cost for almost no perceptual gain in a dark scene.

## Pause when off-screen

Use \`IntersectionObserver\` to stop the render loop when the canvas leaves the viewport. A hidden scene should cost zero.

## Provide a real fallback

Detect WebGL support, respect \`prefers-reduced-motion\`, and render a static, linked project map when 3D is unavailable. The information architecture must survive without the spectacle.`,
  },
]

const gallery = [
  { title: 'ARENA OS desktop', category: 'Projects', url: img('gallery-arena', 1400, 900), description: 'The macOS-inspired shell running the portfolio.', tags: ['portfolio'], featured: true, order: 1 },
  { title: 'Late-night build session', category: 'Coding', url: img('gallery-code', 900, 1200), description: 'Shipping the streaming AI layer.', tags: ['coding'], order: 2 },
  { title: 'Interface study', category: 'Technology', url: img('gallery-ui', 1200, 800), description: 'Glass surface and dock experiments.', tags: ['design'], order: 3 },
  { title: 'Workspace', category: 'Professional', url: img('gallery-workspace', 1400, 800), description: 'Where the work happens.', tags: ['workspace'], order: 4 },
  { title: 'IoT prototype bench', category: 'Projects', url: img('gallery-iot', 1200, 900), description: 'Sensor mesh validation.', tags: ['iot'], order: 5 },
  { title: 'Community meetup', category: 'Events', url: img('gallery-event', 1200, 800), description: 'Talking open source with other developers.', tags: ['community'], order: 6 },
  { title: 'Milestone', category: 'Achievements', url: img('gallery-milestone', 900, 900), description: 'A release worth remembering.', tags: ['milestone'], order: 7 },
  { title: 'Behind the scenes', category: 'Behind the Scenes', url: img('gallery-bts', 1200, 800), description: 'Whiteboard architecture before code.', tags: ['process'], order: 8 },
]

const testimonials = [
  { name: 'Collaborator', role: 'Software Engineer', company: 'Open-source project', quote: 'Kevin reviews code with unusual care — small pull requests, clear reasoning and tests that actually cover the failure modes we discussed.', rating: 5, featured: true, order: 1 },
  { name: 'Client', role: 'Product Lead', company: 'Product team', quote: 'He turned a vague internal process into a working system in weeks, and left documentation the team could maintain without him.', rating: 5, featured: true, order: 2 },
  { name: 'Mentor', role: 'Engineering Mentor', company: 'Developer community', quote: 'A builder who asks the right questions before writing code. The architecture decisions are deliberate, not accidental.', rating: 5, featured: true, order: 3 },
]

const music = [
  { title: 'Neon Circuits', artist: 'ARENA Sound Lab', album: 'Neon Circuits', genre: 'Ambient', synth: { enabled: true, root: 196, mode: 'minor', tempo: 56, brightness: 0.55 }, featured: true, order: 1, cover: '' },
  { title: 'Midnight Compile', artist: 'ARENA Sound Lab', album: 'Neon Circuits', genre: 'Ambient', synth: { enabled: true, root: 146.83, mode: 'dorian', tempo: 48, brightness: 0.35 }, featured: true, order: 2, cover: '' },
  { title: 'Cyan Horizon', artist: 'ARENA Sound Lab', album: 'Neon Circuits', genre: 'Ambient', synth: { enabled: true, root: 261.63, mode: 'major', tempo: 64, brightness: 0.7 }, featured: true, order: 3, cover: '' },
]

const comments = [
  {
    targetType: 'project',
    targetId: 'arena-os-portfolio-ai-ecosystem',
    targetTitle: 'ARENA OS — Portfolio & AI Ecosystem',
    name: 'Amina',
    email: 'amina@example.com',
    content: 'The command palette is the detail that sold me — it makes the whole desktop metaphor feel real. How did you handle focus trapping?',
    rating: 5,
    status: 'approved',
    likes: 4,
    createdAt: daysAgo(3),
  },
  {
    targetType: 'project',
    targetId: 'arena-os-portfolio-ai-ecosystem',
    targetTitle: 'ARENA OS — Portfolio & AI Ecosystem',
    name: 'Daniel',
    email: 'daniel@example.com',
    content: 'Respect for showing the GitHub metrics as verified vs manual. Most portfolios just invent numbers.',
    rating: 5,
    status: 'approved',
    likes: 2,
    createdAt: daysAgo(2),
  },
  {
    targetType: 'portfolio',
    targetId: 'portfolio',
    targetTitle: 'Portfolio feedback',
    name: 'Grace',
    email: 'grace@example.com',
    content: 'The ARENA AI knowledge-base fallback is a smart touch. It answered my project question without any external API key.',
    rating: 4,
    status: 'approved',
    likes: 1,
    createdAt: daysAgo(1),
  },
  {
    targetType: 'project',
    targetId: 'nexus-commerce',
    targetTitle: 'Nexus Commerce',
    name: 'Pending Visitor',
    email: 'pending@example.com',
    content: 'Interested in how you handled Stripe webhook idempotency. Awaiting moderation example.',
    rating: 5,
    status: 'pending',
    createdAt: daysAgo(1),
  },
]

const notificationSeed = {
  type: 'system',
  title: 'Welcome to your command center',
  message: 'Seed data loaded. Configure .env for MongoDB, SMTP, AI and GitHub to activate every integration.',
  link: '/admin',
  read: false,
  meta: { seeded: true },
}

async function seedCollection(name, docs, { force = false } = {}) {
  if (!docs?.length) return 0
  if (force) await repo.clear(name)
  const existing = await repo.count(name)
  if (existing > 0 && !force) return 0
  await repo.insertMany(name, docs)
  return docs.length
}

export async function seedDatabase({ force = false, silent = false } = {}) {
  const log = (...args) => !silent && console.info('[seed]', ...args)
  const summary = {}

  const adminCount = await repo.count('admins')
  if (adminCount === 0) {
    await repo.create('admins', {
      name: env.admin.name,
      email: env.admin.email,
      role: 'admin',
      passwordHash: await bcrypt.hash(env.admin.password, 12),
      active: true,
    })
    log(`administrator created: ${env.admin.email}`)
    if (!env.isProd) log('change ADMIN_PASSWORD in .env before deploying')
  }

  const settingsExisting = await repo.findOne('settings', { key: 'site' })
  if (!settingsExisting) {
    await repo.create('settings', settingsDoc)
    summary.settings = 1
  }

  summary.profile = await seedCollection('profile', [profileDoc], { force })
  summary.projects = await seedCollection('projects', projects, { force })
  summary.skills = await seedCollection('skills', skills, { force })
  summary.services = await seedCollection('services', services, { force })
  summary.categories = await seedCollection('blog-categories', blogCategories, { force })
  summary.posts = await seedCollection(
    'blog',
    posts.map((p) => ({ ...p, readingTime: readingTime(p.content) })),
    { force }
  )
  summary.gallery = await seedCollection('gallery', gallery, { force })
  summary.testimonials = await seedCollection('testimonials', testimonials, { force })
  summary.music = await seedCollection('music', music, { force })
  summary.comments = await seedCollection('comments', comments, { force })

  const notificationCount = await repo.count('notifications')
  if (notificationCount === 0) {
    await repo.create('notifications', notificationSeed)
    summary.notifications = 1
  }

  await ensureAchievementDocs()

  log('completed', summary)
  return summary
}
