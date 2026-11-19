export interface WallpaperDefinition {
  id: string
  label: string
  description: string
  className?: string
  image?: string
  tone: string
}

export const WALLPAPERS: WallpaperDefinition[] = [
  {
    id: 'rays',
    label: 'Rays',
    description: 'The signature ARENA gradient — blue, violet and emerald light rays.',
    image: '/wallpapers/rays.jpg',
    tone: 'from-[#1d4ed8] via-[#7c3aed] to-[#10b981]',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    description: 'Violet and cyan aurora drifting over deep space.',
    className: 'wp-aurora',
    tone: 'from-[#7c5cff] via-[#3b82f6] to-[#22d3ee]',
  },
  {
    id: 'nebula',
    label: 'Nebula',
    description: 'Soft magenta and indigo clouds.',
    className: 'wp-nebula',
    tone: 'from-[#ec4899] via-[#a855f7] to-[#22d3ee]',
  },
  {
    id: 'grid',
    label: 'Grid',
    description: 'A measured technical grid with a cyan horizon.',
    className: 'wp-grid',
    tone: 'from-[#0ea5e9] via-[#1e293b] to-[#22d3ee]',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    description: 'Warm amber and rose light for a calmer desktop.',
    className: 'wp-sunset',
    tone: 'from-[#f59e0b] via-[#fb7185] to-[#7c5cff]',
  },
]

export const DEFAULT_WALLPAPER = 'rays'

export function getWallpaper(id?: string): WallpaperDefinition {
  return WALLPAPERS.find((wallpaper) => wallpaper.id === id) || WALLPAPERS[0]
}

export function WallpaperLayer({ id, dim = false }: { id?: string; dim?: boolean }) {
  const wallpaper = getWallpaper(id)
  return (
    <>
      <div
        className={`absolute inset-0 bg-cover bg-center ${wallpaper.className || ''}`}
        style={
          wallpaper.image
            ? { backgroundImage: `url(${wallpaper.image})`, backgroundColor: '#05070f' }
            : undefined
        }
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute inset-0 ${
          dim ? 'bg-black/35' : 'bg-[radial-gradient(120%_100%_at_50%_0%,transparent_35%,rgba(3,6,16,0.55)_100%)]'
        }`}
        aria-hidden
      />
    </>
  )
}
