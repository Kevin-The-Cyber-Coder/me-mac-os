import { useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { copyToClipboard } from '../../lib/utils'

export function CodeBlock({ code, language = 'bash', label }: { code: string; language?: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--stroke)] bg-[#080b14]">
      <div className="flex items-center justify-between border-b border-[var(--stroke)] px-3 py-1.5">
        <span className="font-mono text-[9.5px] uppercase tracking-widest text-[var(--fg-faint)]">{label || language}</span>
        <button
          onClick={async () => {
            const ok = await copyToClipboard(code)
            if (ok) {
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1600)
            }
          }}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9.5px] text-muted transition-colors hover:bg-white/[0.06] hover:text-fg"
          aria-label="Copy code"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto px-3.5 py-3">
        <code className="font-mono text-[11.5px] leading-relaxed text-[#c8d3f5]">{code}</code>
      </pre>
    </div>
  )
}

export function ExternalButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-fg hover:text-[color-mix(in_srgb,var(--accent)_85%,white)]"
    >
      {children}
      <ExternalLink className="h-3 w-3" />
    </a>
  )
}
