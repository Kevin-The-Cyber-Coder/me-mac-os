import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Bot,
  CornerDownLeft,
  Loader2,
  Mic,
  MicOff,
  Square,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useUI } from '../../store/ui'
import { streamChat } from '../../lib/api'
import { getVisitorId } from '../../lib/utils'
import { useSpeech } from '../../hooks/useSpeech'
import { cn } from '../../lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  source?: string
  streaming?: boolean
}

const SUGGESTIONS = [
  'Which projects use React and TypeScript?',
  'What services do you offer?',
  'How does ARENA AI stay accurate?',
]

export function ArenaAssistant() {
  const open = useUI((s) => s.assistantOpen)
  const toggle = useUI((s) => s.toggleAssistant)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [mode, setMode] = useState<string>('knowledge-base')
  const [speakReplies, setSpeakReplies] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { listening, supported, startListening, stopListening, speak, stopSpeaking, speaking } = useSpeech()

  useEffect(() => {
    if (!open) return
    fetch(`${(import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')}/api/ai/status`)
      .then((r) => r.json())
      .then((data) => setMode(data?.status?.mode || 'knowledge-base'))
      .catch(() => undefined)
    window.setTimeout(() => inputRef.current?.focus(), 120)
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async (text: string) => {
    const content = text.trim()
    if (!content || busy) return
    setInput('')
    setBusy(true)
    const userMessage: Message = { id: `u-${Date.now()}`, role: 'user', content }
    const assistantId = `a-${Date.now()}`
    setMessages((prev) => [...prev, userMessage, { id: assistantId, role: 'assistant', content: '', streaming: true }])

    const controller = new AbortController()
    abortRef.current = controller
    let buffer = ''

    try {
      await streamChat(
        {
          message: content,
          conversationId,
          visitorId: getVisitorId(),
          history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        },
        (event) => {
          if (event.type === 'meta') {
            if (event.conversationId) setConversationId(event.conversationId)
            if (event.mode) setMode(event.mode)
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, source: event.source || event.mode } : m))
            )
          }
          if (event.type === 'delta' && event.content) {
            buffer += event.content
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: buffer } : m)))
          }
          if (event.type === 'notice' && event.message) {
            buffer += (buffer ? '\n\n' : '') + event.message
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: buffer } : m)))
          }
          if (event.type === 'error') {
            buffer += `\n\n${event.message || 'The assistant encountered an error.'}`
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: buffer } : m)))
          }
        },
        controller.signal
      )
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)))
      if (speakReplies && buffer) speak(buffer)
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError'
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                streaming: false,
                content: m.content || (aborted ? 'Response stopped.' : 'ARENA AI is unreachable right now. Please try again.'),
              }
            : m
        )
      )
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  const stop = () => {
    abortRef.current?.abort()
    stopSpeaking()
    setBusy(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="glass-strong fixed bottom-[86px] right-3 z-[100] flex h-[min(560px,calc(100vh-120px))] w-[min(380px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-[var(--stroke-strong)] shadow-2xl"
          role="dialog"
          aria-label="ARENA AI assistant"
        >
          <div className="flex items-center gap-2.5 border-b border-[var(--stroke)] px-3.5 py-2.5">
            <span className="relative grid h-8 w-8 place-items-center rounded-xl bg-[image:linear-gradient(135deg,var(--accent),#22d3ee)] text-[#05060c]">
              <Bot className="h-4 w-4" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[var(--bg)]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[12.5px] font-semibold leading-tight text-fg">ARENA AI</p>
              <p className="truncate font-mono text-[9px] uppercase tracking-wider text-[var(--fg-faint)]">
                {mode === 'provider' ? 'provider streaming' : 'verified portfolio mode'}
              </p>
            </div>
            <button
              onClick={() => setSpeakReplies(!speakReplies)}
              disabled={!supported}
              className={cn('rounded p-1.5 disabled:opacity-40', speakReplies ? 'text-[var(--accent)]' : 'text-muted hover:text-fg')}
              aria-label={speakReplies ? 'Disable spoken replies' : 'Enable spoken replies'}
            >
              {speakReplies ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>
            <Link to="/arena-ai" onClick={() => toggle(false)} className="rounded p-1.5 text-muted hover:text-fg" aria-label="Open full ARENA AI">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <button onClick={() => toggle(false)} className="rounded p-1.5 text-muted hover:text-fg" aria-label="Close assistant">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3.5 py-3.5">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="rounded-xl border border-[var(--stroke)] bg-[var(--panel-soft)] px-3 py-2.5">
                  <p className="text-[12px] leading-relaxed text-fg">
                    I'm ARENA AI. I answer from Kevin's published projects, skills, services and articles — and I say so when
                    something isn't in the record.
                  </p>
                  <p className="mt-1.5 text-[10.5px] leading-relaxed text-[var(--fg-faint)]">
                    {mode === 'provider'
                      ? 'Streaming through the server-side provider proxy. Your API key never reaches this browser.'
                      : 'No provider key is configured, so answers are generated from verified portfolio content only.'}
                  </p>
                </div>
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => send(suggestion)}
                    className="block w-full rounded-lg border border-[var(--stroke)] px-3 py-2 text-left text-[11.5px] text-muted transition-colors hover:border-[var(--stroke-strong)] hover:text-fg"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[88%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed',
                    message.role === 'user'
                      ? 'bg-[var(--accent)] text-[#05060c]'
                      : 'border border-[var(--stroke)] bg-[var(--panel-soft)] text-fg'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content || (message.streaming ? '…' : '')}</p>
                  {message.role === 'assistant' && message.source && (
                    <p className="mt-1.5 border-t border-[var(--stroke)] pt-1 font-mono text-[8.5px] uppercase tracking-wider text-[var(--fg-faint)]">
                      source · {message.source}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--stroke)] p-2.5">
            <div className="flex items-end gap-1.5 rounded-xl border border-[var(--stroke)] bg-[var(--panel-soft)] px-2 py-1.5">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
                rows={1}
                placeholder="Ask about projects, skills or services…"
                className="max-h-24 min-h-[28px] flex-1 resize-none bg-transparent px-1 py-1 text-[12px] text-fg outline-none placeholder:text-[var(--fg-faint)]"
                aria-label="Message ARENA AI"
              />
              <button
                onClick={() => {
                  if (listening) stopListening()
                  else startListening((text) => setInput((prev) => (prev ? `${prev} ${text}` : text)))
                }}
                disabled={!supported}
                className={cn(
                  'rounded-lg p-1.5 disabled:opacity-40',
                  listening ? 'bg-rose-500/20 text-rose-300' : 'text-muted hover:text-fg'
                )}
                aria-label={listening ? 'Stop listening' : 'Dictate message'}
              >
                {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </button>
              {busy ? (
                <button onClick={stop} className="rounded-lg bg-rose-500/20 p-1.5 text-rose-300" aria-label="Stop response">
                  <Square className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim()}
                  className="rounded-lg bg-[var(--accent)] p-1.5 text-[#05060c] disabled:opacity-40"
                  aria-label="Send message"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CornerDownLeft className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
            <p className="mt-1.5 px-1 text-[9px] leading-relaxed text-[var(--fg-faint)]">
              {speaking ? 'Speaking reply — ' : ''}
              ARENA AI can make mistakes. Verify anything critical. Conversations are retained per the site retention policy.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
