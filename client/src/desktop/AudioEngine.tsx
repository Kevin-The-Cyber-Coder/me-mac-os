import { useEffect, useRef } from 'react'
import { useMusic } from '../store/music'
import { useAmbientSynth } from '../lib/synth'

/**
 * Global playback engine. It lives at the desktop level so menu-bar and Control
 * Center transport controls keep working even when the Music window is closed.
 */
export function AudioEngine() {
  const tracks = useMusic((state) => state.tracks)
  const index = useMusic((state) => state.index)
  const playing = useMusic((state) => state.playing)
  const volume = useMusic((state) => state.volume)
  const muted = useMusic((state) => state.muted)
  const seekRequest = useMusic((state) => state.seekRequest)
  const next = useMusic((state) => state.next)
  const pause = useMusic((state) => state.pause)
  const setElapsed = useMusic((state) => state.setElapsed)
  const setDuration = useMusic((state) => state.setDuration)
  const setError = useMusic((state) => state.setError)
  const synth = useAmbientSynth()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const track = tracks[index] ?? null
  const isSynth = Boolean(track?.synth?.enabled) || !track?.src

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
        .catch((error) => {
          setError(error instanceof Error ? error.message : 'Web Audio is unavailable.')
          pause()
        })
    } else if (audio) {
      setError(null)
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
    const audio = audioRef.current
    if (!audio || isSynth || !seekRequest) return
    audio.currentTime = useMusic.getState().elapsed
    // Only react to explicit seek requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seekRequest])

  useEffect(() => {
    if (!playing || !isSynth) return
    const timer = window.setInterval(() => setElapsed(useMusic.getState().elapsed + 1), 1000)
    return () => window.clearInterval(timer)
  }, [playing, isSynth, index, setElapsed])

  return (
    <audio
      ref={audioRef}
      onEnded={() => next()}
      onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
      onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || track?.duration || 0)}
      onError={() => setError('This audio file could not be loaded.')}
      preload="none"
      crossOrigin="anonymous"
      className="hidden"
    />
  )
}
