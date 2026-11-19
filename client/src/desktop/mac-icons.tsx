import type { ComponentType, CSSProperties, ReactNode } from 'react'
import type { AppId } from './apps'

export interface MacIconProps {
  className?: string
  style?: CSSProperties
  strokeWidth?: number
}

export type AppIcon = ComponentType<MacIconProps>

function Svg({
  children,
  className,
  style,
}: MacIconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={style}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  )
}

/* ── Folders ─────────────────────────────────────────────── */

function Folder({ glyph, className, style }: MacIconProps & { glyph: ReactNode }) {
  return (
    <Svg className={className} style={style}>
      <defs>
        <linearGradient id="macFolderBack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#66c7ff" />
          <stop offset="1" stopColor="#1f7ad0" />
        </linearGradient>
        <linearGradient id="macFolderFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8bdcff" />
          <stop offset="0.52" stopColor="#3fa9f5" />
          <stop offset="1" stopColor="#1176d8" />
        </linearGradient>
      </defs>
      <path
        d="M4.8 14.5h18.4c1.1 0 2.1.4 2.9 1.2l3.9 4h28.2c2.2 0 4 1.8 4 4v23.8c0 2.2-1.8 4-4 4H8.8c-2.2 0-4-1.8-4-4V18.5c0-2.2 1.8-4 4-4z"
        fill="url(#macFolderBack)"
      />
      <path
        d="M4.8 24.4h54.4c2.2 0 4 1.8 4 4v19.1c0 2.2-1.8 4-4 4H8.8c-2.2 0-4-1.8-4-4V28.4c0-2.2 1.8-4 4-4z"
        fill="url(#macFolderFront)"
      />
      <rect x="7" y="26.2" width="50" height="2.6" rx="1.3" fill="#ffffff" opacity="0.22" />
      <path d="M4.8 24.4h54.4v2H4.8z" fill="#ffffff" opacity="0.1" />
      {glyph}
    </Svg>
  )
}

export function MacFolderPhoto(props: MacIconProps) {
  return (
    <Folder
      {...props}
      glyph={
        <g>
          <rect x="19.5" y="29" width="25" height="18" rx="2.6" fill="#ffffff" />
          <circle cx="25.8" cy="34.8" r="2.3" fill="#43a8ef" />
          <path d="M21.4 45.4l5.9-6.3 4.3 4.3 3.2-3.2 5.7 5.2z" fill="#7ec9f7" />
        </g>
      }
    />
  )
}

export function MacFolderPerson(props: MacIconProps) {
  return (
    <Folder
      {...props}
      glyph={
        <g fill="#ffffff">
          <circle cx="32" cy="34" r="5.1" />
          <path d="M22.6 47.4c.7-5.1 4.6-7.9 9.4-7.9s8.7 2.8 9.4 7.9z" />
        </g>
      }
    />
  )
}

export function MacFolderBriefcase(props: MacIconProps) {
  return (
    <Folder
      {...props}
      glyph={
        <g>
          <rect x="19.5" y="31" width="25" height="16.5" rx="2.6" fill="#ffffff" />
          <path
            d="M27.4 31v-2.1c0-1.4 1.1-2.5 2.5-2.5h4.2c1.4 0 2.5 1.1 2.5 2.5V31"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.2"
          />
          <rect x="19.5" y="36.6" width="25" height="1.7" fill="#4aabf0" opacity="0.8" />
          <rect x="29.7" y="35.7" width="4.6" height="3.4" rx="1" fill="#4aabf0" />
        </g>
      }
    />
  )
}

export function MacFolderMail(props: MacIconProps) {
  return (
    <Folder
      {...props}
      glyph={
        <g>
          <rect x="19" y="29.5" width="26" height="17" rx="2.6" fill="#ffffff" />
          <path
            d="M20.2 31.2l11.8 8.5 11.8-8.5"
            fill="none"
            stroke="#4aabf0"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      }
    />
  )
}

export function MacFolderLayers(props: MacIconProps) {
  return (
    <Folder
      {...props}
      glyph={
        <g>
          <path d="M32 28.2l11.4 6.2L32 40.6l-11.4-6.2z" fill="#ffffff" />
          <path
            d="M23.2 40.4l8.8 4.8 8.8-4.8"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      }
    />
  )
}

export function MacFolderGlobe(props: MacIconProps) {
  return (
    <Folder
      {...props}
      glyph={
        <g fill="none" stroke="#ffffff" strokeLinecap="round">
          <circle cx="32" cy="37.4" r="8.6" strokeWidth="2.2" />
          <ellipse cx="32" cy="37.4" rx="4" ry="8.6" strokeWidth="1.5" />
          <path d="M23.6 37.4h16.8" strokeWidth="1.5" />
          <path d="M24.8 32.3h14.4M24.8 42.5h14.4" strokeWidth="1.2" opacity="0.8" />
        </g>
      }
    />
  )
}

/* ── Applications ────────────────────────────────────────── */

export function MacMusic(props: MacIconProps) {
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id="macMusicBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7ad8ff" />
          <stop offset="0.5" stopColor="#23a9ff" />
          <stop offset="1" stopColor="#0a6fe8" />
        </linearGradient>
        <linearGradient id="macMusicGloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="14" fill="url(#macMusicBg)" />
      <path d="M3 17c0-7.7 6.3-14 14-14h30c7.7 0 14 6.3 14 14v6H3z" fill="url(#macMusicGloss)" />
      <path d="M40 18.5v16.2" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M27 22v15" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M27 22l13-3.6v5L27 27z" fill="#ffffff" />
      <circle cx="23.6" cy="39.6" r="4.3" fill="#ffffff" />
      <circle cx="36.6" cy="36.6" r="4.3" fill="#ffffff" />
    </Svg>
  )
}

export function MacSettings(props: MacIconProps) {
  const teeth = Array.from({ length: 8 }).map((_, index) => (
    <rect
      key={index}
      x="29.3"
      y="5.8"
      width="5.4"
      height="10"
      rx="2.2"
      fill="url(#macGearMetal)"
      transform={`rotate(${index * 45} 32 32)`}
    />
  ))
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id="macGearBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdfdfe" />
          <stop offset="0.55" stopColor="#d9d9de" />
          <stop offset="1" stopColor="#b6b6bf" />
        </linearGradient>
        <linearGradient id="macGearMetal" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#cfcfd6" />
          <stop offset="1" stopColor="#8f8f99" />
        </linearGradient>
        <radialGradient id="macGearCore" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#f4f4f6" />
          <stop offset="0.65" stopColor="#b9b9c1" />
          <stop offset="1" stopColor="#75757e" />
        </radialGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="14" fill="url(#macGearBg)" />
      <rect x="3.5" y="3.5" width="57" height="57" rx="13.5" fill="none" stroke="#ffffff" strokeOpacity="0.7" />
      {teeth}
      <circle cx="32" cy="32" r="19" fill="url(#macGearMetal)" />
      <circle cx="32" cy="32" r="13.2" fill="url(#macGearCore)" />
      <circle cx="32" cy="32" r="8.6" fill="#5c5c65" />
      <circle cx="32" cy="32" r="4.1" fill="#2f2f36" />
      <circle cx="32" cy="32" r="14.5" fill="none" stroke="#ffffff" strokeOpacity="0.35" />
    </Svg>
  )
}

export function MacSparkles(props: MacIconProps) {
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id="macArenaBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b06bff" />
          <stop offset="0.55" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#5b21b6" />
        </linearGradient>
        <linearGradient id="macArenaGloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="14" fill="url(#macArenaBg)" />
      <path d="M3 18c0-8.3 6.7-15 15-15h28c8.3 0 15 6.7 15 15v4H3z" fill="url(#macArenaGloss)" />
      <path
        d="M32 13.5l4.6 12.9L49.5 31l-12.9 4.6L32 48.5l-4.6-12.9L14.5 31l12.9-4.6z"
        fill="#ffffff"
      />
      <path
        d="M43.5 43.5l1.8 4.2 4.2 1.8-4.2 1.8-1.8 4.2-1.8-4.2-4.2-1.8 4.2-1.8z"
        fill="#ead9ff"
        opacity="0.92"
      />
    </Svg>
  )
}

export function MacGithub(props: MacIconProps) {
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id="macGithubBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3a3f" />
          <stop offset="1" stopColor="#0b0b0d" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="14" fill="url(#macGithubBg)" />
      <rect x="3.5" y="3.5" width="57" height="57" rx="13.5" fill="none" stroke="#ffffff" strokeOpacity="0.16" />
      <g transform="translate(12 12) scale(1.667)" fill="#ffffff">
        <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.67.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
      </g>
    </Svg>
  )
}

export function MacTerminal(props: MacIconProps) {
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id="macTerminalBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a4a4f" />
          <stop offset="1" stopColor="#101014" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="14" fill="url(#macTerminalBg)" />
      <rect x="3.5" y="3.5" width="57" height="57" rx="13.5" fill="none" stroke="#ffffff" strokeOpacity="0.18" />
      <path
        d="M19.5 24.5l7.2 7.2-7.2 7.2"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M31.5 39.5h12.5" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" />
    </Svg>
  )
}

export function MacNotebook(props: MacIconProps) {
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id="macNoteBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a855f7" />
          <stop offset="0.55" stopColor="#8b3ff0" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="macNoteSpine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#5b21b6" />
        </linearGradient>
      </defs>
      <rect x="10" y="5" width="44" height="54" rx="6" fill="url(#macNoteBg)" />
      <rect x="10" y="5" width="12" height="54" rx="6" fill="url(#macNoteSpine)" />
      <g fill="none" stroke="#f5ecff" strokeWidth="1.8" strokeLinecap="round" opacity="0.85">
        <path d="M15 14h6M15 22h6M15 30h6M15 38h6M15 46h6" />
      </g>
      <g transform="rotate(40 36 32)">
        <rect x="32.5" y="10" width="7" height="30" rx="1.4" fill="#ffffff" />
        <rect x="32.5" y="10" width="7" height="6" rx="1.4" fill="#f472b6" />
        <path d="M32.5 40l3.5 7 3.5-7z" fill="#fcd34d" />
        <path d="M34.4 44.4l1.6 2.6 1.6-2.6z" fill="#4b2e05" />
      </g>
    </Svg>
  )
}

export function MacTrash(props: MacIconProps) {
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id="macTrashBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b9b9c1" />
          <stop offset="0.18" stopColor="#f2f2f5" />
          <stop offset="0.5" stopColor="#d4d4da" />
          <stop offset="0.82" stopColor="#f4f4f7" />
          <stop offset="1" stopColor="#a5a5ae" />
        </linearGradient>
        <linearGradient id="macTrashLid" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c7c7ce" />
          <stop offset="0.5" stopColor="#f7f7fa" />
          <stop offset="1" stopColor="#b1b1ba" />
        </linearGradient>
      </defs>
      <path
        d="M19 19h26l-2.4 33.1c-.13 1.87-1.7 3.4-3.6 3.4H25c-1.9 0-3.47-1.53-3.6-3.4z"
        fill="url(#macTrashBody)"
        stroke="#7f7f88"
        strokeOpacity="0.55"
        strokeWidth="0.8"
      />
      <path d="M19 19h26l-.5 6.5H19.5z" fill="#ffffff" opacity="0.35" />
      <g stroke="#8c8c96" strokeWidth="1" opacity="0.55" strokeLinecap="round">
        <path d="M26 27v23M32 27v23M38 27v23" />
      </g>
      <ellipse cx="32" cy="18.4" rx="13" ry="3.6" fill="url(#macTrashLid)" stroke="#8b8b94" strokeWidth="0.8" />
      <path
        d="M27.4 15.6v-1.9c0-1 .8-1.8 1.8-1.8h5.6c1 0 1.8.8 1.8 1.8v1.9"
        fill="none"
        stroke="#d8d8de"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <ellipse cx="32" cy="18.4" rx="9.6" ry="2.3" fill="#e9e9ee" opacity="0.7" />
    </Svg>
  )
}

export function MacFinder(props: MacIconProps) {
  return (
    <Svg {...props}>
      <defs>
        <clipPath id="macFinderClip">
          <rect x="3" y="3" width="58" height="58" rx="13" />
        </clipPath>
        <linearGradient id="macFinderBlue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3fa9ff" />
          <stop offset="1" stopColor="#0a6fe8" />
        </linearGradient>
      </defs>
      <g clipPath="url(#macFinderClip)">
        <rect x="3" y="3" width="58" height="58" fill="#eef9ff" />
        <rect x="31" y="3" width="30" height="58" fill="url(#macFinderBlue)" />
        <path d="M31 3v58" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="1.2" />
        <rect x="21" y="24" width="2.8" height="9.4" rx="1.4" fill="#17324d" />
        <rect x="40.2" y="24" width="2.8" height="9.4" rx="1.4" fill="#ffffff" />
        <path
          d="M21.3 40.6c3 5.2 7.4 7.7 10.7 7.7s7.7-2.5 10.7-7.7"
          fill="none"
          stroke="#17324d"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
      <rect x="3.4" y="3.4" width="57.2" height="57.2" rx="12.8" fill="none" stroke="#ffffff" strokeOpacity="0.3" />
    </Svg>
  )
}

/* ── Dock application variants ───────────────────────────── */

export function MacPhotos(props: MacIconProps) {
  const colors = [
    '#ff3b30',
    '#ff9500',
    '#ffcc00',
    '#34c759',
    '#30d5c8',
    '#007aff',
    '#5856d6',
    '#af52de',
  ]
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id="macPhotosBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ececf1" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="14" fill="url(#macPhotosBg)" />
      {colors.map((color, index) => (
        <ellipse
          key={color}
          cx="32"
          cy="21.4"
          rx="7"
          ry="11.2"
          fill={color}
          opacity="0.9"
          transform={`rotate(${index * 45} 32 32)`}
        />
      ))}
      <circle cx="32" cy="32" r="3.4" fill="#ffffff" />
    </Svg>
  )
}

export function MacMail(props: MacIconProps) {
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id="macMailBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fd1ff" />
          <stop offset="0.55" stopColor="#1e9bff" />
          <stop offset="1" stopColor="#0a68e0" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="14" fill="url(#macMailBg)" />
      <rect x="13" y="21.5" width="38" height="21.5" rx="3.2" fill="#ffffff" />
      <path
        d="M14.2 23.5L32 36.5l17.8-13"
        fill="none"
        stroke="#2f9bf0"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function MacNotes(props: MacIconProps) {
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id="macNotesBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f0f0f3" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="14" fill="url(#macNotesBg)" />
      <path d="M3 17c0-7.7 6.3-14 14-14h30c7.7 0 14 6.3 14 14v2H3z" fill="#ffd60a" />
      <g stroke="#c9c9cf" strokeWidth="2.6" strokeLinecap="round">
        <path d="M14 31h36M14 38h36M14 45h26" />
      </g>
    </Svg>
  )
}

export function MacBriefcase(props: MacIconProps) {
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id="macBriefcaseBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7ad8ff" />
          <stop offset="0.55" stopColor="#23a9ff" />
          <stop offset="1" stopColor="#0a6fe8" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="14" fill="url(#macBriefcaseBg)" />
      <rect x="13" y="24" width="38" height="25" rx="4" fill="#ffffff" />
      <path
        d="M25.5 24v-3.2c0-1.8 1.4-3.2 3.2-3.2h6.6c1.8 0 3.2 1.4 3.2 3.2V24"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
      />
      <rect x="13" y="34" width="38" height="2" fill="#3aa9f5" opacity="0.8" />
    </Svg>
  )
}

export function AppleLogo({ className, style }: MacIconProps) {
  return (
    <svg
      viewBox="0 0 384 512"
      className={className}
      style={style}
      fill="currentColor"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  )
}

/* ── Registry maps ───────────────────────────────────────── */

export const MAC_ICONS: Partial<Record<AppId, AppIcon>> = {
  finder: MacFinder,
  welcome: MacFolderPerson,
  about: MacFolderPerson,
  projects: MacFolderBriefcase,
  project: MacFolderBriefcase,
  skills: MacFolderLayers,
  services: MacFolderGlobe,
  blog: MacNotebook,
  post: MacNotebook,
  gallery: MacFolderPhoto,
  contact: MacFolderMail,
  arena: MacSparkles,
  github: MacGithub,
  terminal: MacTerminal,
  music: MacMusic,
  settings: MacSettings,
  trash: MacTrash,
}

export const MAC_DOCK_ICONS: Partial<Record<AppId, AppIcon>> = {
  ...MAC_ICONS,
  projects: MacBriefcase,
  gallery: MacPhotos,
  blog: MacNotes,
  contact: MacMail,
}
