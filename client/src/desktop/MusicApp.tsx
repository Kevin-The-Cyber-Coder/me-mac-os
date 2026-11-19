import { useEffect, useMemo, useState } from 'react'
import {
  Clock3,
  Disc3,
  Heart,
  History,
  ListMusic,
  Music2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useMusic, useCurrentTrack } from '../store/music'
import { useLaunch } from './launch'
import { cn, formatTime } from '../lib/utils'

function TrackCover({
  src,
  title,
  className,
}: {
  src?: string
  title: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  if (!src || failed) {
    return (
      <span
        className={cn(
          'grid place-items-center bg-[image:linear-gradient(140deg,var(--accent),#22d3ee)] text-[#05060c]',
          className
        )}
        aria-label={title}
      >
        <Music2 className="h-1/3 w-1/3" strokeWidth={1.6} />
      </span>
    )
  }
  return <img src={src} alt={title} onError={() => setFailed(true)} className={cn('object-cover', className)} />
}

function Visualizer({ playing }: { playing: boolean }) {
  return (
    <span className="flex h-4 items-end gap-[2px]" aria-hidden>
      {[5, 11, 8, 14, 7, 12, 6, 10].map((height, index) => (
        <span
          key={index}
          className={cn('w-[2px] rounded-full bg-current transition-opacity', playing ? 'animate-pulse' : 'opacity-30')}
          style={{
            height,
            animationDelay: `${index * 90}ms`,
            animationDuration: `${540 + (index % 4) * 120}ms`,
          }}
        />
      ))}
    </span>
  )
}

export default function MusicApp() {
  const {
    tracks,
    index,
    playing,
    volume,
    muted,
    shuffle,
    repeat,
    favorites,
    elapsed,
    duration,
    error,
    recentlyPlayed,
    playIndex,
    toggle,
    next,
    prev,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleFavorite,
    seekTo,
  } = useMusic()
  const track = useCurrentTrack()
  const launch = useLaunch()
  const [filter, setFilter] = useState<'all' | 'favorites' | 'recent'>('all')
  const [genre, setGenre] = useState<string>('')
  const [query, setQuery] = useState('')

  const genres = useMemo(
    () => Array.from(new Set(tracks.map((item) => item.genre).filter(Boolean))).sort(),
    [tracks]
  )

  const list = useMemo(() => {
    let items = tracks
    if (filter === 'favorites') items = items.filter((item) => favorites.includes(item.id))
    if (filter === 'recent') {
      items = recentlyPlayed
        .map((id) => tracks.find((item) => item.id === id))
        .filter((item): item is (typeof tracks)[number] => Boolean(item))
    }
    if (genre) items = items.filter((item) => item.genre === genre)
    const q = query.trim().toLowerCase()
    if (q) {
      items = items.filter((item) => `${item.title} ${item.artist} ${item.album} ${item.genre}`.toLowerCase().includes(q))
    }
    return items
  }, [tracks, filter, favorites, recentlyPlayed, genre, query])

  const isSynth = Boolean(track?.synth?.enabled) || !track?.src
  const progress = duration > 0 && !isSynth ? Math.min(100, (elapsed / duration) * 100) : 0
  const hero = track || tracks[0] || null

  const play = (id: string) => {
    const realIndex = tracks.findIndex((item) => item.id === id)
    if (realIndex < 0) return
    if (realIndex === index && playing) {
      toggle()
      return
    }
    playIndex(realIndex)
  }

  const filterLabel = filter === 'all' ? 'All tracks' : filter === 'favorites' ? 'Favourites' : 'Recently played'

  return (
    <div className="flex h-full min-h-0 flex-col text-fg">
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[178px] shrink-0 flex-col border-r border-[var(--stroke)] bg-[color-mix(in_srgb,var(--panel-soft)_70%,black)] max-sm:hidden">
          <div className="no-scrollbar flex-1 overflow-y-auto px-2 py-2.5">
            <p className="px-2 pb-1 font-mono text-[8.5px] uppercase tracking-[0.18em] text-[var(--fg-faint)]">Library</p>
            {[
              { id: 'all' as const, label: 'All tracks', icon: ListMusic, count: tracks.length },
              { id: 'favorites' as const, label: 'Favourites', icon: Heart, count: favorites.length },
              { id: 'recent' as const, label: 'Recently played', icon: History, count: recentlyPlayed.length },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setFilter(item.id)
                  setGenre('')
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-[6px] px-2 py-[5px] text-left text-[11.5px] transition-colors',
                  filter === item.id && !genre
                    ? 'bg-white/[0.12] font-medium text-fg'
                    : 'text-[var(--fg-muted)] hover:bg-white/[0.06] hover:text-fg'
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <span className="font-mono text-[9px] text-[var(--fg-faint)]">{item.count}</span>
              </button>
            ))}

            {genres.length > 0 && (
              <>
                <p className="px-2 pb-1 pt-3 font-mono text-[8.5px] uppercase tracking-[0.18em] text-[var(--fg-faint)]">
                  Genres
                </p>
                {genres.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setGenre(item)
                      setFilter('all')
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-[6px] px-2 py-[5px] text-left text-[11.5px] transition-colors',
                      genre === item
                        ? 'bg-white/[0.12] font-medium text-fg'
                        : 'text-[var(--fg-muted)] hover:bg-white/[0.06] hover:text-fg'
                    )}
                  >
                    <Disc3 className="h-3.5 w-3.5" />
                    <span className="min-w-0 flex-1 truncate">{item}</span>
                    <span className="font-mono text-[9px] text-[var(--fg-faint)]">
                      {tracks.filter((trackItem) => trackItem.genre === item).length}
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
          <div className="border-t border-[var(--stroke)] px-3 py-2">
            <p className="text-[9px] leading-relaxed text-[var(--fg-faint)]">
              Tracks come from the portfolio database. Seeded pieces are synthesised locally.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-[42px] shrink-0 items-center gap-2 border-b border-[var(--stroke)] bg-[var(--panel-soft)] px-3">
            <p className="font-display text-[13px] font-semibold text-fg">ARENA Sound</p>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--fg-faint)] sm:inline">
              {filterLabel}
              {genre ? ` · ${genre}` : ''}
            </span>
            <div className="relative ml-auto">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--fg-faint)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search music"
                aria-label="Search music"
                className="h-6 w-[140px] rounded-md border border-[var(--stroke)] bg-white/[0.05] pl-6 pr-2 text-[11px] text-fg outline-none placeholder:text-[var(--fg-faint)] focus:border-[color-mix(in_srgb,var(--accent)_55%,var(--stroke))] sm:w-[180px]"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {tracks.length === 0 ? (
              <div className="grid h-full min-h-[200px] place-items-center px-6 text-center">
                <div>
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05] text-[var(--fg-faint)]">
                    <Music2 className="h-6 w-6" />
                  </span>
                  <p className="mt-3 text-[12.5px] font-medium text-fg">No tracks published</p>
                  <p className="mx-auto mt-1 max-w-[280px] text-[11px] leading-relaxed text-muted">
                    The music collection is managed from the admin dashboard. Add a track there and it appears here.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {hero && (
                  <div className="relative m-3 overflow-hidden rounded-xl border border-[var(--stroke)] bg-[image:linear-gradient(120deg,color-mix(in_srgb,var(--accent)_35%,#0a0e18),rgba(34,211,238,0.16))] p-4">
                    <div className="flex items-center gap-3.5">
                      <TrackCover
                        src={hero.cover}
                        title={hero.title}
                        className="h-[86px] w-[86px] shrink-0 rounded-lg ring-1 ring-white/20"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-white/55">
                          {isSynth ? 'Live synth · generated locally' : 'Now playing'}
                        </p>
                        <p className="mt-1 truncate font-display text-[19px] font-semibold leading-tight text-white">
                          {hero.title}
                        </p>
                        <p className="truncate text-[11px] text-white/65">
                          {hero.artist} · {hero.album || hero.genre || 'ARENA Sound'}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => play(hero.id)}
                            className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#05060c] shadow hover:scale-105"
                            aria-label={playing && hero.id === track?.id ? 'Pause' : 'Play'}
                          >
                            {playing && hero.id === track?.id ? (
                              <Pause className="h-3.5 w-3.5 fill-current" />
                            ) : (
                              <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                            )}
                          </button>
                          <span className="text-[10.5px] text-white/65">
                            {isSynth ? '∞ continuous' : formatTime(hero.duration || 0)}
                          </span>
                          <span className="ml-auto hidden text-white/50 sm:block">
                            <Visualizer playing={playing} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="px-3 pb-2">
                  <div className="grid grid-cols-[24px_1fr_1fr_56px_28px] items-center gap-2 border-b border-[var(--stroke)] px-2 pb-1 font-mono text-[8.5px] uppercase tracking-wider text-[var(--fg-faint)] sm:grid-cols-[24px_1.5fr_1fr_1fr_56px_28px]">
                    <span>#</span>
                    <span>Title</span>
                    <span className="hidden sm:block">Artist</span>
                    <span className="hidden sm:block">Album</span>
                    <span className="text-right">Time</span>
                    <span />
                  </div>
                  {list.length === 0 && (
                    <p className="py-10 text-center text-[11px] text-muted">Nothing matches this view.</p>
                  )}
                  {list.map((item) => {
                    const realIndex = tracks.findIndex((trackItem) => trackItem.id === item.id)
                    const active = realIndex === index
                    const synth = Boolean(item.synth?.enabled) || !item.src
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'group grid grid-cols-[24px_1fr_1fr_56px_28px] items-center gap-2 rounded-md px-2 py-1.5 text-[11px] transition-colors sm:grid-cols-[24px_1.5fr_1fr_1fr_56px_28px]',
                          active ? 'bg-[var(--accent-soft)]' : 'hover:bg-white/[0.05]'
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => play(item.id)}
                          className="grid h-5 w-5 place-items-center text-[var(--fg-faint)] hover:text-fg"
                          aria-label={active && playing ? `Pause ${item.title}` : `Play ${item.title}`}
                        >
                          {active && playing ? (
                            <Visualizer playing />
                          ) : (
                            <>
                              <span className="font-mono text-[9px] group-hover:hidden">{realIndex + 1}</span>
                              <Play className="hidden h-3 w-3 fill-current group-hover:block" />
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => play(item.id)}
                          className="flex min-w-0 items-center gap-2 text-left"
                        >
                          <TrackCover src={item.cover} title={item.title} className="h-7 w-7 shrink-0 rounded" />
                          <span className="min-w-0">
                            <span className={cn('block truncate font-medium', active ? 'text-fg' : 'text-fg/90')}>
                              {item.title}
                            </span>
                            <span className="block truncate text-[9.5px] text-[var(--fg-faint)] sm:hidden">
                              {item.artist}
                            </span>
                          </span>
                        </button>
                        <span className="hidden truncate text-[10px] text-[var(--fg-faint)] sm:block">{item.artist || '—'}</span>
                        <span className="hidden truncate text-[10px] text-[var(--fg-faint)] sm:block">{item.album || '—'}</span>
                        <span className="text-right font-mono text-[9.5px] text-[var(--fg-faint)]">
                          {synth ? '∞' : formatTime(item.duration || 0)}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(item.id)}
                          className={cn(
                            'grid h-6 w-6 place-items-center rounded hover:bg-white/10',
                            favorites.includes(item.id) ? 'text-rose-400' : 'text-[var(--fg-faint)] hover:text-fg'
                          )}
                          aria-label={favorites.includes(item.id) ? `Remove ${item.title} from favourites` : `Add ${item.title} to favourites`}
                        >
                          <Heart className={cn('h-3 w-3', favorites.includes(item.id) && 'fill-current')} />
                        </button>
                      </div>
                    )
                  })}
                </div>

                <div className="mx-3 mb-3 mt-1 flex items-start gap-2 rounded-lg border border-[var(--stroke)] bg-[var(--panel-soft)] px-3 py-2">
                  <Clock3 className="mt-0.5 h-3 w-3 shrink-0 text-[var(--fg-faint)]" />
                  <p className="text-[9.5px] leading-relaxed text-[var(--fg-faint)]">
                    Playback never starts automatically. Synth tracks run until you pause them; audio files end and advance
                    according to the repeat mode.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-[var(--stroke)] bg-[color-mix(in_srgb,var(--panel-strong)_94%,black)] px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 items-center gap-2.5 sm:w-[220px]">
            <TrackCover src={track?.cover} title={track?.title || 'Nothing playing'} className="h-9 w-9 shrink-0 rounded" />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-fg">{track?.title || 'Nothing playing'}</p>
              <p className="truncate text-[9.5px] text-[var(--fg-faint)]">
                {track?.artist || 'Choose a track from the library'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => track && toggleFavorite(track.id)}
              disabled={!track}
              className={cn(
                'ml-auto grid h-6 w-6 shrink-0 place-items-center rounded disabled:opacity-30',
                track && favorites.includes(track.id) ? 'text-rose-400' : 'text-[var(--fg-faint)] hover:text-fg'
              )}
              aria-label="Toggle favourite"
            >
              <Heart className={cn('h-3 w-3', track && favorites.includes(track.id) && 'fill-current')} />
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center gap-1">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={toggleShuffle}
                className={cn('rounded p-1', shuffle ? 'text-[var(--accent)]' : 'text-[var(--fg-faint)] hover:text-fg')}
                aria-label="Shuffle"
                aria-pressed={shuffle}
              >
                <Shuffle className="h-3 w-3" />
              </button>
              <button type="button" onClick={prev} disabled={!tracks.length} className="rounded p-1 text-fg hover:text-[var(--accent)] disabled:opacity-30" aria-label="Previous track">
                <SkipBack className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={toggle}
                disabled={!tracks.length}
                className="grid h-7 w-7 place-items-center rounded-full bg-[var(--accent)] text-white hover:brightness-110 disabled:opacity-40"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause className="h-3 w-3 fill-current" /> : <Play className="ml-0.5 h-3 w-3 fill-current" />}
              </button>
              <button type="button" onClick={next} disabled={!tracks.length} className="rounded p-1 text-fg hover:text-[var(--accent)] disabled:opacity-30" aria-label="Next track">
                <SkipForward className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={cycleRepeat}
                className={cn('rounded p-1', repeat !== 'off' ? 'text-[var(--accent)]' : 'text-[var(--fg-faint)] hover:text-fg')}
                aria-label={`Repeat ${repeat}`}
              >
                {repeat === 'one' ? <Repeat1 className="h-3 w-3" /> : <Repeat className="h-3 w-3" />}
              </button>
            </div>
            <div className="flex w-full max-w-[360px] items-center gap-1.5">
              <span className="w-7 text-right font-mono text-[8.5px] text-[var(--fg-faint)]">{formatTime(elapsed)}</span>
              <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-[image:linear-gradient(90deg,var(--accent),#22d3ee)]"
                  style={{ width: `${progress}%` }}
                />
                {!isSynth && duration > 0 && (
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.5}
                    value={Math.min(elapsed, duration)}
                    onChange={(event) => seekTo(Number(event.target.value))}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Seek"
                  />
                )}
              </div>
              <span className="w-7 font-mono text-[8.5px] text-[var(--fg-faint)]">
                {isSynth ? '∞' : formatTime(duration)}
              </span>
            </div>
          </div>

          <div className="hidden items-center gap-1.5 sm:flex sm:w-[180px] sm:justify-end">
            <button type="button" onClick={toggleMute} className="text-[var(--fg-faint)] hover:text-fg" aria-label={muted ? 'Unmute' : 'Mute'}>
              {muted || volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="h-1 w-[92px] cursor-pointer appearance-none rounded-full bg-white/15 accent-[var(--accent)]"
              aria-label="Volume"
            />
            <button
              type="button"
              onClick={() => launch('settings', { section: 'music' })}
              className="ml-1 rounded p-1 text-[var(--fg-faint)] hover:text-fg"
              aria-label="Music settings"
              title="Music settings"
            >
              <ListMusic className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {error && <p className="mt-1.5 rounded bg-rose-500/10 px-2 py-1 text-[10px] text-rose-300">{error}</p>}
      </div>
    </div>
  )
}
