import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive,
  Bot,
  Check,
  Download,
  History,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { Seo } from '../components/site/Seo'
import { Markdown } from '../components/site/Markdown'
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Modal,
  Progress,
  SearchInput,
  Skeleton,
  Tooltip,
} from '../components/ui'
import { api, apiError, streamChat } from '../lib/api'
import { getVisitorId, timeAgo, cn } from '../lib/utils'
import { toast } from '../lib/toast'
import { useSpeech } from '../hooks/useSpeech'
import type { ChatMessage, Conversation } from '../types'

interface AIStatus {
  enabled: boolean
  mode: 'provider' | 'knowledge-base'
  provider: string
  model: string
  configured: boolean
  dailyLimit: number
}

interface Usage {
  used: number
  limit: number
  remaining: number
}

interface UiMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  source?: string
  streaming?: boolean
  tokens?: number
  createdAt?: string
}

const SUGGESTIONS = [
  'Which projects use React and TypeScript?',
  'What services are available and who are they for?',
  'Summarise the most recent article.',
  'What is Kevin currently learning?',
  'How can I start a project with Kevin?',
  'Show the strongest full-stack case study.',
]

const toUiMessage = (message: ChatMessage): UiMessage => ({
  id: message.id,
  role: message.role,
  content: message.content,
  source: message.source,
  tokens: message.tokens,
  createdAt: message.createdAt,
})

export default function ArenaAI() {
  const visitorId = useMemo(() => getVisitorId(), [])
  const [status, setStatus] = useState<AIStatus | null>(null)
  const [usage, setUsage] = useState<Usage | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [listQuery, setListQuery] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Conversation | null>(null)
  const [speakReplies, setSpeakReplies] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { listening, supported, startListening, stopListening, speak, stopSpeaking, speaking } = useSpeech()

  const active = conversations.find((item) => item.id === activeId) || null

  const loadStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/ai/status')
      setStatus(data.status as AIStatus)
    } catch {
      setStatus(null)
    }
  }, [])

  const loadUsage = useCallback(async () => {
    try {
      const { data } = await api.get('/ai/usage', { headers: { 'x-visitor-id': visitorId } })
      setUsage({ used: data.used, limit: data.limit, remaining: data.remaining })
    } catch {
      setUsage(null)
    }
  }, [visitorId])

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/ai/conversations', { headers: { 'x-visitor-id': visitorId } })
      setConversations((data.conversations || []) as Conversation[])
    } catch {
      setConversations([])
    } finally {
      setLoadingList(false)
    }
  }, [visitorId])

  useEffect(() => {
    loadStatus()
    loadUsage()
    loadConversations()
  }, [loadStatus, loadUsage, loadConversations])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const filtered = useMemo(() => {
    const q = listQuery.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((conversation) => conversation.title.toLowerCase().includes(q))
  }, [conversations, listQuery])

  const openConversation = async (conversation: Conversation) => {
    if (busy) abortRef.current?.abort()
    setActiveId(conversation.id)
    setHistoryOpen(false)
    setLoadingMessages(true)
    setError(null)
    try {
      const { data } = await api.get(`/ai/conversations/${conversation.id}/messages`, {
        headers: { 'x-visitor-id': visitorId },
      })
      setMessages((data.messages || []).map(toUiMessage))
    } catch (err) {
      setError(apiError(err))
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  const newConversation = () => {
    abortRef.current?.abort()
    setBusy(false)
    setActiveId(null)
    setMessages([])
    setError(null)
    setHistoryOpen(false)
    window.setTimeout(() => inputRef.current?.focus(), 60)
  }

  const send = async (text: string) => {
    const content = text.trim()
    if (!content || busy) return
    if (status && !status.enabled) {
      setError('ARENA AI is currently disabled by the administrator.')
      return
    }
    setInput('')
    setError(null)
    setBusy(true)

    const userMessage: UiMessage = { id: `u-${Date.now()}`, role: 'user', content, createdAt: new Date().toISOString() }
    const assistantId = `a-${Date.now()}`
    const history = messages
      .filter((message) => message.role !== 'system' && message.content)
      .slice(-8)
      .map((message) => ({ role: message.role, content: message.content }))

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: 'assistant', content: '', streaming: true, source: status?.mode },
    ])

    const controller = new AbortController()
    abortRef.current = controller
    let buffer = ''
    let createdConversation = false

    try {
      await streamChat(
        {
          message: content,
          conversationId: activeId,
          visitorId,
          history,
        },
        (event) => {
          if (event.type === 'meta') {
            if (event.conversationId && !activeId) {
              createdConversation = true
              setActiveId(event.conversationId)
            }
            if (event.mode) {
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantId ? { ...message, source: event.source || event.mode } : message
                )
              )
            }
          }
          if (event.type === 'delta' && event.content) {
            buffer += event.content
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: buffer } : m)))
          }
          if (event.type === 'notice' && event.message) {
            buffer += (buffer ? '\n\n' : '') + `> ${event.message}`
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: buffer } : m)))
          }
          if (event.type === 'error') {
            buffer += (buffer ? '\n\n' : '') + (event.message || 'The assistant encountered an error.')
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: buffer } : m)))
          }
          if (event.type === 'done') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, streaming: false, tokens: event.tokens, source: event.source || m.source }
                  : m
              )
            )
          }
        },
        controller.signal
      )
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)))
      if (speakReplies && buffer) speak(buffer)
      if (createdConversation) loadConversations()
      loadUsage()
    } catch (err) {
      const aborted = err instanceof Error && err.name === 'AbortError'
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                streaming: false,
                content:
                  m.content ||
                  (aborted ? '_Response stopped._' : 'ARENA AI is unreachable right now. Please try again shortly.'),
              }
            : m
        )
      )
      if (!aborted) setError(apiError(err))
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

  const togglePin = async (conversation: Conversation) => {
    try {
      const { data } = await api.patch(
        `/ai/conversations/${conversation.id}`,
        { pinned: !conversation.pinned },
        { headers: { 'x-visitor-id': visitorId } }
      )
      setConversations((prev) =>
        prev.map((item) => (item.id === conversation.id ? { ...item, ...(data.conversation || {}) } : item))
      )
      toast(conversation.pinned ? 'Conversation unpinned' : 'Conversation pinned')
    } catch (err) {
      toast(apiError(err), 'error')
    }
  }

  const archiveConversation = async (conversation: Conversation) => {
    try {
      await api.patch(
        `/ai/conversations/${conversation.id}`,
        { archived: true },
        { headers: { 'x-visitor-id': visitorId } }
      )
      setConversations((prev) => prev.filter((item) => item.id !== conversation.id))
      if (activeId === conversation.id) newConversation()
      toast('Conversation archived')
    } catch (err) {
      toast(apiError(err), 'error')
    }
  }

  const removeConversation = async () => {
    if (!pendingDelete) return
    try {
      await api.delete(`/ai/conversations/${pendingDelete.id}`, { headers: { 'x-visitor-id': visitorId } })
      setConversations((prev) => prev.filter((item) => item.id !== pendingDelete.id))
      if (activeId === pendingDelete.id) newConversation()
      toast('Conversation deleted')
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setPendingDelete(null)
    }
  }

  const exportTranscript = () => {
    if (!messages.length) return
    const body = messages
      .map((message) => `### ${message.role === 'user' ? 'You' : 'ARENA AI'}\n\n${message.content}`)
      .join('\n\n---\n\n')
    const header = `# ${active?.title || 'ARENA AI conversation'}\n\n_Exported ${new Date().toLocaleString()}_\n\n`
    const blob = new Blob([header + body], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `arena-ai-${(active?.title || 'conversation').slice(0, 40).replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  const usagePercent = usage && usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0
  const modeLabel = status?.mode === 'provider' ? 'Provider streaming' : 'Verified portfolio mode'

  const historyList = (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--stroke)] p-2.5">
        <Button className="w-full" size="sm" onClick={newConversation} icon={<Plus className="h-3.5 w-3.5" />}>
          New conversation
        </Button>
        <SearchInput
          value={listQuery}
          onChange={setListQuery}
          placeholder="Search history…"
          className="mt-2"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {loadingList && (
          <div className="space-y-1.5 p-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-11" />
            ))}
          </div>
        )}
        {!loadingList && filtered.length === 0 && (
          <p className="px-3 py-8 text-center text-[11.5px] leading-relaxed text-[var(--fg-faint)]">
            {conversations.length === 0
              ? 'No saved conversations yet. Ask something to start one.'
              : 'No conversation matches that search.'}
          </p>
        )}
        {filtered.map((conversation) => (
          <div
            key={conversation.id}
            className={cn(
              'group mb-0.5 flex items-start gap-1.5 rounded-lg px-2 py-1.5 transition-colors',
              activeId === conversation.id ? 'bg-[var(--accent-soft)]' : 'hover:bg-white/[0.05]'
            )}
          >
            <button
              onClick={() => openConversation(conversation)}
              className="min-w-0 flex-1 text-left"
              aria-current={activeId === conversation.id ? 'true' : undefined}
            >
              <span className="flex items-center gap-1.5">
                {conversation.pinned && <Pin className="h-2.5 w-2.5 shrink-0 text-[var(--accent)]" />}
                <span className="truncate text-[12px] font-medium text-fg">{conversation.title}</span>
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-[9.5px] text-[var(--fg-faint)]">
                <MessageSquare className="h-2.5 w-2.5" /> {conversation.messageCount || 0}
                <span>·</span>
                {timeAgo(conversation.lastMessageAt)}
              </span>
            </button>
            <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <button
                onClick={() => togglePin(conversation)}
                className="rounded p-1 text-muted hover:text-fg"
                aria-label={conversation.pinned ? 'Unpin conversation' : 'Pin conversation'}
              >
                {conversation.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
              </button>
              <button
                onClick={() => archiveConversation(conversation)}
                className="rounded p-1 text-muted hover:text-fg"
                aria-label="Archive conversation"
              >
                <Archive className="h-3 w-3" />
              </button>
              <button
                onClick={() => setPendingDelete(conversation)}
                className="rounded p-1 text-muted hover:text-rose-300"
                aria-label="Delete conversation"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--stroke)] p-2.5">
        <div className="flex items-center justify-between text-[9.5px] text-[var(--fg-faint)]">
          <span>Daily messages</span>
          <span className="font-mono">
            {usage ? `${usage.used}/${usage.limit}` : '—'}
          </span>
        </div>
        <Progress value={usagePercent} className="mt-1.5" />
        <p className="mt-1.5 flex items-center gap-1 text-[9px] text-[var(--fg-faint)]">
          <ShieldCheck className="h-2.5 w-2.5 text-emerald-400" />
          History is stored against this browser only.
        </p>
      </div>
    </div>
  )

  return (
    <>
      <Seo
        title="ARENA AI"
        description="Ask ARENA AI about Mukeshimana Kevin's projects, skills, services and writing. Answers are grounded in published portfolio records."
      />

      <header className="mb-5 flex flex-col gap-3 border-b border-[var(--stroke)] pb-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--accent)_75%,white)]">
            ARENA AI
          </div>
          <h1 className="font-display text-[clamp(1.5rem,3.2vw,2.1rem)] font-semibold leading-tight text-fg">
            An assistant grounded in <span className="text-gradient">real portfolio data</span>
          </h1>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted">
            Streaming answers about projects, skills, services and articles. When no provider key is configured, ARENA AI
            answers directly from published records — never from invented statistics.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={status?.enabled === false ? 'danger' : 'success'}>
              <span className={cn('h-1.5 w-1.5 rounded-full', status?.enabled === false ? 'bg-rose-400' : 'bg-emerald-400')} />
              {status?.enabled === false ? 'Disabled by admin' : modeLabel}
            </Badge>
            {status?.configured && (
              <Badge tone="accent">
                {status.provider} · {status.model}
              </Badge>
            )}
            <Badge tone="default">Streaming SSE</Badge>
            <Badge tone="default">Keys stay server-side</Badge>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={() => setHistoryOpen(true)} icon={<History className="h-3.5 w-3.5" />} className="lg:hidden">
            History
          </Button>
          <Tooltip label="Reload conversation list">
            <Button variant="ghost" size="icon" onClick={loadConversations} aria-label="Reload conversations">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
        </div>
      </header>

      {status && !status.enabled && (
        <Alert tone="warning" title="Assistant disabled">
          The administrator has temporarily disabled ARENA AI. You can still browse projects, articles and services.
        </Alert>
      )}

      <div className="mt-4 grid min-h-[540px] gap-3 lg:grid-cols-[264px_1fr]">
        <aside className="glass hidden min-h-0 overflow-hidden rounded-2xl lg:block" aria-label="Conversation history">
          {historyList}
        </aside>

        <section className="glass flex min-h-[540px] flex-col overflow-hidden rounded-2xl" aria-label="ARENA AI chat">
          <div className="flex items-center gap-2.5 border-b border-[var(--stroke)] px-3.5 py-2.5">
            <span className="relative grid h-8 w-8 place-items-center rounded-xl bg-[image:linear-gradient(135deg,var(--accent),#22d3ee)] text-[#05060c]">
              <Bot className="h-4 w-4" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[var(--bg)]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[12.5px] font-semibold text-fg">
                {active?.title || 'New conversation'}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--fg-faint)]">
                {modeLabel}
                {status?.model ? ` · ${status.model}` : ''}
              </p>
            </div>
            <Tooltip label={speakReplies ? 'Spoken replies on' : 'Spoken replies off'}>
              <button
                onClick={() => {
                  if (speakReplies) stopSpeaking()
                  setSpeakReplies(!speakReplies)
                }}
                disabled={!supported}
                className={cn('rounded-lg p-1.5 disabled:opacity-40', speakReplies ? 'text-[var(--accent)]' : 'text-muted hover:text-fg')}
                aria-label={speakReplies ? 'Disable spoken replies' : 'Enable spoken replies'}
              >
                {speakReplies ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </button>
            </Tooltip>
            <Tooltip label="Export transcript">
              <button
                onClick={exportTranscript}
                disabled={!messages.length}
                className="rounded-lg p-1.5 text-muted hover:text-fg disabled:opacity-40"
                aria-label="Export transcript"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
            <button
              onClick={newConversation}
              className="rounded-lg p-1.5 text-muted hover:text-fg"
              aria-label="Start a new conversation"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3.5 py-4 sm:px-5">
            {loadingMessages && (
              <div className="space-y-3">
                <Skeleton className="ml-auto h-12 w-2/3" />
                <Skeleton className="h-24 w-5/6" />
                <Skeleton className="ml-auto h-10 w-1/2" />
              </div>
            )}

            {!loadingMessages && messages.length === 0 && (
              <div className="mx-auto max-w-2xl py-6">
                <div className="text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[image:linear-gradient(135deg,var(--accent),#22d3ee)] text-[#05060c]">
                    <Sparkles className="h-6 w-6" />
                  </span>
                  <h2 className="mt-3 font-display text-lg font-semibold text-fg">What do you want to know?</h2>
                  <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-muted">
                    Ask about architecture decisions, technology choices, service fit or the story behind a build.
                  </p>
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => send(suggestion)}
                      className="rounded-xl border border-[var(--stroke)] bg-[var(--panel-soft)] px-3 py-2.5 text-left text-[11.5px] leading-relaxed text-muted transition-colors hover:border-[var(--stroke-strong)] hover:text-fg"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!loadingMessages &&
              messages.map((message) => (
                <div key={message.id} className={cn('flex gap-2.5', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {message.role !== 'user' && (
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[color-mix(in_srgb,var(--accent)_85%,white)]">
                      <Bot className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <div
                    className={cn(
                      'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed sm:max-w-[82%]',
                      message.role === 'user'
                        ? 'bg-[var(--accent)] text-[#05060c]'
                        : 'border border-[var(--stroke)] bg-[var(--panel-soft)] text-fg'
                    )}
                  >
                    {message.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : message.content ? (
                      <Markdown content={message.content} className="prose-kcp prose-sm max-w-none text-[12.5px]" />
                    ) : (
                      <span className="flex items-center gap-2 text-[11.5px] text-muted">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                      </span>
                    )}
                    {message.role === 'assistant' && !message.streaming && (message.source || message.tokens) && (
                      <p className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-[var(--stroke)] pt-1.5 font-mono text-[8.5px] uppercase tracking-wider text-[var(--fg-faint)]">
                        {message.source && <span>source · {message.source}</span>}
                        {message.tokens ? <span>· {message.tokens} tokens</span> : null}
                        <span className="ml-auto flex items-center gap-0.5 text-emerald-400/80">
                          <Check className="h-2.5 w-2.5" /> saved
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              ))}

            {error && (
              <div className="rounded-xl border border-rose-500/25 bg-rose-500/[0.07] px-3 py-2.5 text-[11.5px] text-rose-200">
                {error}
              </div>
            )}
          </div>

          <div className="border-t border-[var(--stroke)] p-2.5 sm:p-3">
            <div className="flex items-end gap-1.5 rounded-xl border border-[var(--stroke)] bg-[var(--panel-soft)] px-2 py-1.5 focus-within:border-[color-mix(in_srgb,var(--accent)_55%,transparent)]">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    send(input)
                  }
                }}
                rows={1}
                placeholder="Ask about projects, skills, services or writing…"
                className="max-h-32 min-h-[32px] flex-1 resize-none bg-transparent px-1 py-1.5 text-[12.5px] text-fg outline-none placeholder:text-[var(--fg-faint)]"
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
                aria-label={listening ? 'Stop dictation' : 'Dictate message'}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              {busy ? (
                <button onClick={stop} className="rounded-lg bg-rose-500/20 p-1.5 text-rose-300" aria-label="Stop response">
                  <Square className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || status?.enabled === false}
                  className="rounded-lg bg-[var(--accent)] p-1.5 text-[#05060c] disabled:opacity-40"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2 px-1">
              <p className="text-[9px] leading-relaxed text-[var(--fg-faint)]">
                {speaking ? 'Speaking reply · ' : ''}
                ARENA AI can make mistakes — verify anything critical.
              </p>
              <span className="shrink-0 font-mono text-[9px] text-[var(--fg-faint)]">
                {usage ? `${usage.remaining} left today` : 'local history'}
              </span>
            </div>
          </div>
        </section>
      </div>

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Conversation history" size="sm">
        <div className="h-[60vh] overflow-hidden rounded-xl border border-[var(--stroke)]">{historyList}</div>
      </Modal>

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete conversation?"
        description="This permanently removes the conversation and all of its messages."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={removeConversation} icon={<Trash2 className="h-3.5 w-3.5" />}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[12.5px] leading-relaxed text-muted">
          <span className="font-medium text-fg">{pendingDelete?.title}</span> — this cannot be undone.
        </p>
      </Modal>

      {!supported && (
        <p className="mt-2 flex items-center gap-1 text-[9.5px] text-[var(--fg-faint)]">
          <X className="h-2.5 w-2.5" /> Voice input and spoken replies are not supported by this browser. Text chat still works.
        </p>
      )}

      {conversations.length === 0 && !loadingList && (
        <EmptyState
          className="hidden"
          title="No history"
          description="Your conversations will appear here after the first message."
          icon={<MessageSquare className="h-5 w-5" />}
        />
      )}
    </>
  )
}
