import mongoose from 'mongoose'

const base = { timestamps: true, versionKey: false }

const socialSchema = new mongoose.Schema(
  { label: String, url: String, icon: String },
  { _id: false }
)

const profileSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Mukeshimana Kevin' },
    displayName: { type: String, default: 'Kevin The Cyber Coder' },
    title: { type: String, default: 'Full-Stack Developer | Software Engineer | Technology Innovator' },
    tagline: { type: String, default: "Building Tomorrow's Technology, One Innovation at a Time." },
    shortBio: { type: String, default: '' },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    availability: {
      status: { type: String, enum: ['available', 'limited', 'unavailable'], default: 'available' },
      label: { type: String, default: 'Available for new opportunities' },
    },
    socials: [socialSchema],
    mission: { type: String, default: '' },
    vision: { type: String, default: '' },
    values: [{ title: String, description: String, icon: String, _id: false }],
    interests: [String],
    education: [
      {
        institution: String,
        degree: String,
        field: String,
        start: String,
        end: String,
        description: String,
        _id: false,
      },
    ],
    experience: [
      {
        company: String,
        role: String,
        start: String,
        end: String,
        current: Boolean,
        description: String,
        technologies: [String],
        _id: false,
      },
    ],
    timeline: [{ year: String, title: String, description: String, type: String, _id: false }],
    futureGoals: [String],
    stats: [{ label: String, value: String, suffix: String, _id: false }],
  },
  base
)

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    category: {
      type: String,
      enum: [
        'Web Applications',
        'Mobile Applications',
        'AI Projects',
        'Automation',
        'Software Systems',
        'IoT and Hardware',
        'Experimental Projects',
      ],
      default: 'Web Applications',
      index: true,
    },
    coverImage: { type: String, default: '' },
    gallery: [String],
    summary: { type: String, default: '' },
    description: { type: String, default: '' },
    problem: { type: String, default: '' },
    solution: { type: String, default: '' },
    technologies: [String],
    features: [String],
    process: [{ title: String, description: String, _id: false }],
    liveUrl: { type: String, default: '' },
    repoUrl: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published', index: true },
    stage: { type: String, enum: ['completed', 'in-progress', 'concept'], default: 'completed' },
    featured: { type: Boolean, default: false, index: true },
    tags: [String],
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    startedAt: Date,
    completedAt: Date,
  },
  base
)
projectSchema.index({ title: 'text', summary: 'text', technologies: 'text' })

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['Programming', 'Frontend', 'Backend', 'Databases', 'Tools', 'Additional'],
      default: 'Programming',
      index: true,
    },
    icon: { type: String, default: '' },
    description: { type: String, default: '' },
    // Qualitative level only — no fabricated proficiency percentages.
    level: { type: String, enum: ['expert', 'advanced', 'intermediate', 'learning'], default: 'intermediate' },
    learning: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  base
)

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, index: true },
    icon: { type: String, default: 'Sparkles' },
    description: { type: String, default: '' },
    features: [String],
    benefits: [String],
    technologies: [String],
    cta: { type: String, default: 'Start a project' },
    order: { type: Number, default: 0 },
  },
  base
)

const blogCategorySchema = new mongoose.Schema(
  { name: { type: String, required: true, unique: true }, slug: { type: String, index: true }, description: String, color: String },
  base
)

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true },
    excerpt: { type: String, default: '' },
    content: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    category: { type: String, default: 'Engineering', index: true },
    tags: [String],
    status: { type: String, enum: ['draft', 'published', 'scheduled'], default: 'draft', index: true },
    publishedAt: { type: Date, default: Date.now, index: true },
    readingTime: { type: Number, default: 1 },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    author: { type: String, default: 'Mukeshimana Kevin' },
    seo: { title: String, description: String, keywords: [String] },
  },
  base
)

const gallerySchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Professional', 'Personal', 'Projects', 'Coding', 'Technology', 'Events', 'Achievements', 'Behind the Scenes'],
      default: 'Projects',
      index: true,
    },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    url: { type: String, required: true },
    thumbnail: { type: String, default: '' },
    description: { type: String, default: '' },
    tags: [String],
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  base
)

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, default: '' },
    company: { type: String, default: '' },
    avatar: { type: String, default: '' },
    quote: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    featured: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  base
)

const musicTrackSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artist: { type: String, default: 'ARENA Sound Lab' },
    album: { type: String, default: 'Neon Circuits' },
    cover: { type: String, default: '' },
    src: { type: String, default: '' },
    duration: { type: Number, default: 0 },
    genre: { type: String, default: 'Ambient' },
    // Generated, royalty-free ambient pad synthesized in the browser.
    synth: {
      enabled: { type: Boolean, default: false },
      root: { type: Number, default: 220 },
      mode: { type: String, default: 'minor' },
      tempo: { type: Number, default: 60 },
      brightness: { type: Number, default: 0.5 },
    },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  base
)

const playlistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    cover: { type: String, default: '' },
    tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MusicTrack' }],
    order: { type: Number, default: 0 },
  },
  base
)

export const Profile = mongoose.model('Profile', profileSchema)
export const Project = mongoose.model('Project', projectSchema)
export const Skill = mongoose.model('Skill', skillSchema)
export const Service = mongoose.model('Service', serviceSchema)
export const BlogCategory = mongoose.model('BlogCategory', blogCategorySchema)
export const BlogPost = mongoose.model('BlogPost', blogPostSchema)
export const Gallery = mongoose.model('Gallery', gallerySchema)
export const Testimonial = mongoose.model('Testimonial', testimonialSchema)
export const MusicTrack = mongoose.model('MusicTrack', musicTrackSchema)
export const Playlist = mongoose.model('Playlist', playlistSchema)
