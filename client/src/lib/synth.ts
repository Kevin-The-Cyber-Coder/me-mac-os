import { useEffect, useRef } from 'react'

export interface SynthPreset {
  root: number
  mode: string
  tempo: number
  brightness: number
}

const SCALES: Record<string, number[]> = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
}

/**
 * A small Web Audio ambient pad engine.
 *
 * It synthesises slow, evolving chords from a scale so the portfolio ships with
 * royalty-free music that requires no audio files or licensing. It never starts
 * on its own: playback only begins from an explicit user gesture.
 */
export class AmbientSynth {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private voices: { osc: OscillatorNode; gain: GainNode; filter: BiquadFilterNode }[] = []
  private timer: number | null = null
  private step = 0
  private preset: SynthPreset = { root: 196, mode: 'minor', tempo: 56, brightness: 0.55 }
  private volume = 0.65

  get running() {
    return this.ctx?.state === 'running'
  }

  async start(preset: SynthPreset, volume: number) {
    this.preset = preset
    this.volume = volume
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext
      if (!Ctor) throw new Error('Web Audio is not supported in this browser')
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume()
    this.master!.gain.cancelScheduledValues(this.ctx.currentTime)
    this.master!.gain.setTargetAtTime(this.volume * 0.22, this.ctx.currentTime, 0.8)
    this.buildVoices()
    this.schedule()
  }

  private scaleNote(degree: number) {
    const scale = SCALES[this.preset.mode] || SCALES.minor
    const octave = Math.floor(degree / scale.length)
    const semitone = scale[((degree % scale.length) + scale.length) % scale.length]
    return this.preset.root * Math.pow(2, octave + semitone / 12)
  }

  private buildVoices() {
    if (!this.ctx || !this.master) return
    this.stopVoices()
    const ctx = this.ctx
    const chords = [
      [0, 2, 4],
      [3, 5, 7],
      [4, 6, 8],
      [0, 2, 5],
    ]
    const chord = chords[this.step % chords.length]
    chord.forEach((degree, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      osc.type = index === 0 ? 'sine' : 'triangle'
      osc.frequency.value = this.scaleNote(degree)
      osc.detune.value = (index - 1) * 4
      filter.type = 'lowpass'
      filter.frequency.value = 500 + this.preset.brightness * 1800
      filter.Q.value = 0.7
      gain.gain.value = 0
      gain.gain.setTargetAtTime(0.16 / chord.length, ctx.currentTime, 1.6)
      osc.connect(filter).connect(gain).connect(this.master!)
      osc.start()
      this.voices.push({ osc, gain, filter })
    })
  }

  private schedule() {
    if (this.timer) window.clearInterval(this.timer)
    const interval = Math.max(8, 60 / Math.max(20, this.preset.tempo)) * 1000
    this.timer = window.setInterval(() => {
      this.step += 1
      this.buildVoices()
    }, interval)
  }

  private stopVoices() {
    if (!this.ctx) return
    const now = this.ctx.currentTime
    for (const voice of this.voices) {
      voice.gain.gain.cancelScheduledValues(now)
      voice.gain.gain.setTargetAtTime(0.0001, now, 0.6)
      try {
        voice.osc.stop(now + 2.2)
      } catch {}
    }
    this.voices = []
  }

  setVolume(volume: number) {
    this.volume = volume
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(volume * 0.22, this.ctx.currentTime, 0.15)
    }
  }

  stop() {
    if (this.timer) {
      window.clearInterval(this.timer)
      this.timer = null
    }
    if (!this.ctx || !this.master) return
    this.master.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.25)
    this.stopVoices()
  }

  dispose() {
    this.stop()
    this.ctx?.close().catch(() => undefined)
    this.ctx = null
    this.master = null
  }
}

export function useAmbientSynth() {
  const ref = useRef<AmbientSynth | null>(null)
  useEffect(() => {
    ref.current = new AmbientSynth()
    return () => ref.current?.dispose()
  }, [])
  return ref
}
