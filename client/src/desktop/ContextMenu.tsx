import { useEffect, useRef, type ComponentType } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

export interface ContextMenuItem {
  label?: string
  hint?: string
  icon?: ComponentType<{ className?: string }>
  action?: () => void
  divider?: boolean
  disabled?: boolean
  danger?: boolean
}

export function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const width = 228
  const height = items.length * 30 + 14
  const left = Math.min(x, window.innerWidth - width - 8)
  const top = Math.min(y, window.innerHeight - height - 8)

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.96, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.12 }}
      className="glass-strong fixed z-[260] w-[228px] overflow-hidden rounded-[10px] border border-[var(--stroke-strong)] p-1.5 shadow-2xl"
      role="menu"
      style={{ left, top }}
      onContextMenu={(event) => event.preventDefault()}
    >
      {items.map((item, index) =>
        item.divider ? (
          <div key={`divider-${index}`} className="my-1 h-px bg-[var(--stroke)]" />
        ) : (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              item.action?.()
              onClose()
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-left text-[12px] transition-colors',
              item.danger
                ? 'text-rose-300 hover:bg-rose-500/15'
                : 'text-fg hover:bg-[var(--accent)] hover:text-white',
              item.disabled && 'cursor-default text-[var(--fg-faint)] hover:bg-transparent hover:text-[var(--fg-faint)]'
            )}
          >
            {item.icon && <item.icon className="h-3.5 w-3.5 shrink-0 opacity-80" />}
            <span className="flex-1 truncate">{item.label}</span>
            {item.hint && <span className="font-mono text-[9px] opacity-60">{item.hint}</span>}
          </button>
        )
      )}
    </motion.div>
  )
}
