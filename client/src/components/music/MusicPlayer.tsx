import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Heart,
  ListMusic,
  Music2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useUI } from '../../store/ui'
import { useMusic } from '../../store/music'
import { useList } from '../../hooks/useContent'
import { useAmbientSynth } from '../../lib/synth'
import { cn, formatTime } from '../../lib/utils'
import type { MusicTrack } from '../../types'

export function MusicPlayer() {
  const open = useUI((s) => s.musicOpen)
  const toggleOpen = useUI((s) => s.toggleMusic)
  const {
    tracks,
    index,
    playing,
    volume,
    muted,
    shuffle,
    repeat,
    favorites,
    setTracks,
    playIndex,
    toggle,
    pause,
    next,
    prev,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleFavorite,
  } = useMusic()
  const { data } = useList<MusicTrack>('/music', { limit: 30 })
  const synth = useAmbientSynth()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'queue' | 'favorites'>('queue')

  const track = tracks[index] ?? null
  const isSynth = Boolean(track?.synth?.enabled) || !track?.src

  useEffect(() => {
    if (data?.items?.length) setTracks(data.items)
  }, [data, setTracks])

  // Handle playback for both real audio files and the ambient synth.
  useEffect(() => {
    const audio = audioRef.current
    if (!track || !playing) {
      synth.current?.stop()
      audio?.pause()
      return
    }
    if (isSynth) {
      setError(null)
      synth.current
        ?.start(
          {
            root: track.synth?.root || 196,
            mode: track.synth?.mode || 'minor',
            tempo: track.synth?.tempo || 56,
            brightness: track.synth?.brightness ?? 0.5,
          },
          muted ? 0 : volume
        )
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Audio unavailable')
          pause()
        })
    } else if (audio) {
      audio.src = track.src
      audio.volume = muted ? 0 : volume
      audio.play().catch(() => {
        setError('Playback was blocked by the browser. Press play again.')
        pause()
      })
    }
    return () => {
      synth.current?.stop()
      audio?.pause()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, track?.id, isSynth])

  useEffect(() => {
    synth.current?.setVolume(muted ? 0 : volume)
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume
  }, [volume, muted, synth])

  useEffect(() => {
    if (!playing || !isSynth) return
    setElapsed(0)
    const timer = window.setInterval(() => setElapsed((v) => v + 1), 1000)
    return () => window.clearInterval(timer)
  }, [playing, isSynth, index])

  const list = tab === 'favorites' ? tracks.filter((t) => favorites.includes(t.id)) : tracks
  const duration = track?.duration || 0

  return (
    <>
      <audio
        ref={audioRef}
        onEnded={() => next()}
        onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
        onError={() => setError('This audio file could not be loaded.')}
        preload="none"
        crossOrigin="anonymous"
      />

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="glass-strong fixed bottom-[86px] left-3 z-[100] w-[min(340px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[var(--stroke-strong)] shadow-2xl"
            role="dialog"
            aria-label="Music player"
          >
            <div className="flex items-center justify-between border-b border-[var(--stroke)] px-3 py-2">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">
                <Music2 className="h-3 w-3" /> ARENA Sound
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTab(tab === 'queue' ? 'favorites' : 'queue')}
                  className={cn(
                    'rounded p-1 text-[10px] transition-colors',
                    tab === 'favorites' ? 'text-[color-mix(in_srgb,var(--accent)_85%,white)]' : 'text-muted hover:text-fg'
                  )}
                  aria-label="Toggle favourites"
                >
                  <ListMusic className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => toggleOpen(false)} className="rounded p-1 text-muted hover:text-fg" aria-label="Close music player">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="px-4 pb-3 pt-4">
              <div className="flex items-center gap-3">
                <div className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[image:linear-gradient(135deg,var(--accent),#22d3ee)] text-[#05060c]">
                  {track?.cover ? (
                    <img src={track.cover} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Music2 className="h-6 w-6" />
                  )}
                  {playing && <span className="absolute inset-0 animate-pulse bg-white/10" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[13.5px] font-semibold text-fg">{track?.title || 'No track selected'}</p>
                  <p className="truncate text-[11px] text-muted">{track?.artist || 'ARENA Sound Lab'}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="rounded border border-[var(--stroke)] px-1 py-px font-mono text-[8.5px] uppercase tracking-wider text-[var(--fg-faint)]">
                      {isSynth ? 'live synth' : 'audio file'}
                    </span>
                    <span className="font-mono text-[9px] text-[var(--fg-faint)]">
                      {isSynth ? formatTime(elapsed) : `${formatTime(elapsed)} / ${formatTime(duration)}`}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => track && toggleFavorite(track.id)}
                  className={cn(
                    'rounded p-1.5 transition-colors',
                    track && favorites.includes(track.id) ? 'text-rose-400' : 'text-muted hover:text-fg'
                  )}
                  aria-label="Toggle favourite"
                >
                  <Heart className={cn('h-3.5 w-3.5', track && favorites.includes(track.id) && 'fill-current')} />
                </button>
              </div>

              {!isSynth && duration > 0 && (
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full bg-[image:linear-gradient(90deg,var(--accent),#22d3ee)]"
                    style={{ width: `${Math.min(100, (elapsed / duration) * 100)}%` }}
                  />
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={toggleShuffle}
                  className={cn('rounded p-1.5', shuffle ? 'text-[color-mix(in_srgb,var(--accent)_85%,white)]' : 'text-muted hover:text-fg')}
                  aria-label="Shuffle"
                  aria-pressed={shuffle}
                >
                  <Shuffle className="h-3.5 w-3.5" />
                </button>
                <button onClick={prev} className="rounded p-1.5 text-fg hover:text-[var(--accent)]" aria-label="Previous track">
                  <SkipBack className="h-4 w-4" />
                </button>
                <button
                  onClick={toggle}
                  className="grid h-10 w-10 place-items-center rounded-full bg-[image:linear-gradient(135deg,var(--accent),#22d3ee)] text-[#05060c] shadow-lg transition-transform hover:scale-105"
                  aria-label={playing ? 'Pause' : 'Play'}
                >
                  {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
                </button>
                <button onClick={next} className="rounded p-1.5 text-fg hover:text-[var(--accent)]" aria-label="Next track">
                  <SkipForward className="h-4 w-4" />
                </button>
                <button
                  onClick={cycleRepeat}
                  className={cn(
                    'rounded p-1.5',
                    repeat !== 'off' ? 'text-[color-mix(in_srgb,var(--accent)_85%,white)]' : 'text-muted hover:text-fg'
                  )}
                  aria-label={`Repeat ${repeat}`}
                >
                  {repeat === 'one' ? <Repeat1 className="h-3.5 w-3.5" /> : <Repeat className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <button onClick={toggleMute} className="text-muted hover:text-fg" aria-label={muted ? 'Unmute' : 'Mute'}>
                  {muted || volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/[0.12] accent-[var(--accent)]"
                  aria-label="Volume"
                />
                <span className="w-7 text-right font-mono text-[9px] text-[var(--fg-faint)]">
                  {Math.round((muted ? 0 : volume) * 100)}
                </span>
              </div>

              {error && <p className="mt-2 rounded-lg bg-rose-500/10 px-2 py-1.5 text-[10.5px] text-rose-300">{error}</p>}
            </div>

            <div className="max-h-[190px] overflow-y-auto border-t border-[var(--stroke)] p-1.5">
              {list.length === 0 && (
                <p className="px-2 py-4 text-center text-[11px] text-muted">
                  {tab === 'favorites' ? 'No favourites yet — tap the heart on a track.' : 'Loading playlist…'}
                </p>
              )}
              {list.map((item) => {
                const realIndex = tracks.findIndex((t) => t.id === item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => playIndex(realIndex)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors',
                      realIndex === index ? 'bg-[var(--accent-soft)]' : 'hover:bg-white/[0.05]'
                    )}
                  >
                    <span className="w-3 shrink-0 text-center font-mono text-[9px] text-[var(--fg-faint)]">
                      {realIndex === index && playing ? '▶' : realIndex + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11.5px] font-medium text-fg">{item.title}</span>
                      <span className="block truncate text-[9.5px] text-[var(--fg-faint)]">{item.artist}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[9px] text-[var(--fg-faint)]">
                      {item.synth?.enabled ? '∞' : formatTime(item.duration || 0)}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="border-t border-[var(--stroke)] px-3 py-2">
              <p className="text-[9.5px] leading-relaxed text-[var(--fg-faint)]">
                Playback never starts automatically. Seeded tracks are synthesised locally in your browser — no copyrighted
                audio is streamed.
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {!open && playing && track && (
        <button
          onClick={() => toggleOpen(true)}
          className="glass-strong fixed bottom-[86px] left-3 z-[95] flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 shadow-xl"
          aria-label="Open music player"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[image:linear-gradient(135deg,var(--accent),#22d3ee)] text-[#05060c]">
            <Pause className="h-3 w-3 fill-current" />
          </span>
          <span className="max-w-[120px] truncate text-[10.5px] text-fg">{track.title}</span>
          <span className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-0.5 animate-pulse rounded-full bg-[var(--accent)]"
                style={{ height: 6 + i * 3, animationDelay: `${i * 120}ms` }}
              />
            ))}
          </span>
        </button>
      )}
    </>
  )
}
