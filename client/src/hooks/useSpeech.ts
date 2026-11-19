import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
}

export function useSpeech() {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const onResultRef = useRef<((text: string) => void) | null>(null)

  useEffect(() => {
    const w = window as any
    const Recognition = w.SpeechRecognition || w.webkitSpeechRecognition
    setSupported(Boolean(Recognition) && 'speechSynthesis' in window)
    if (Recognition) {
      const recognition: SpeechRecognitionLike = new Recognition()
      recognition.lang = 'en-US'
      recognition.continuous = false
      recognition.interimResults = false
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0]?.transcript || '')
          .join(' ')
          .trim()
        if (transcript) onResultRef.current?.(transcript)
      }
      recognition.onerror = () => setListening(false)
      recognition.onend = () => setListening(false)
      recognitionRef.current = recognition
    }
    return () => {
      try {
        recognitionRef.current?.stop()
        window.speechSynthesis?.cancel()
      } catch {}
    }
  }, [])

  const startListening = useCallback((onResult: (text: string) => void) => {
    if (!recognitionRef.current) return
    onResultRef.current = onResult
    try {
      recognitionRef.current.start()
      setListening(true)
    } catch {
      setListening(false)
    }
  }, [])

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch {}
    setListening(false)
  }, [])

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`>_]/g, '').slice(0, 4000))
    utterance.rate = 1
    utterance.pitch = 1
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [])

  return { listening, speaking, supported, startListening, stopListening, speak, stopSpeaking }
}
