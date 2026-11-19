import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Loader2, ChevronDown, Search, AlertCircle, Inbox } from 'lucide-react'
import { cn } from '../lib/utils'

/* ── Button ─────────────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-[image:linear-gradient(100deg,var(--accent),#22d3ee)] text-[#05060c] font-semibold hover:brightness-110 shadow-[0_10px_30px_-12px_var(--accent)]',
  secondary: 'glass text-fg hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--stroke))]',
  ghost: 'text-muted hover:text-fg hover:bg-white/[0.06]',
  danger: 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25',
  outline: 'border border-[var(--stroke-strong)] text-fg hover:bg-white/[0.05]',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2.5 rounded-xl',
  icon: 'h-9 w-9 rounded-xl justify-center',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}

/* ── Surfaces ───────────────────────────────────────────────── */

export function GlassCard({
  className,
  children,
  hover = false,
  as: Tag = 'div',
}: {
  className?: string
  children: ReactNode
  hover?: boolean
  as?: 'div' | 'section' | 'article' | 'aside'
}) {
  return (
    <Tag className={cn('glass rounded-2xl', hover && 'card-hover', className)}>{children}</Tag>
  )
}

export function Badge({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}) {
  const tones: Record<string, string> = {
    default: 'bg-white/[0.06] text-muted border-[var(--stroke)]',
    accent: 'bg-[var(--accent-soft)] text-[color-mix(in_srgb,var(--accent)_80%,white)] border-[color-mix(in_srgb,var(--accent)_35%,transparent)]',
    success: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/25',
    warning: 'bg-amber-500/12 text-amber-300 border-amber-500/25',
    danger: 'bg-rose-500/12 text-rose-300 border-rose-500/25',
    info: 'bg-cyan-500/12 text-cyan-300 border-cyan-500/25',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-5',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

/* ── Inputs ─────────────────────────────────────────────────── */

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      {label && (
        <span className="flex items-center gap-1 text-[12.5px] font-medium text-fg">
          {label}
          {required && <span className="text-rose-400">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="flex items-center gap-1 text-[11.5px] text-rose-400">
          <AlertCircle className="h-3 w-3" /> {error}
        </span>
      ) : (
        hint && <span className="block text-[11.5px] text-[var(--fg-faint)]">{hint}</span>
      )}
    </label>
  )
}

const controlClass =
  'w-full rounded-xl border border-[var(--stroke)] bg-[var(--panel-soft)] px-3.5 py-2.5 text-sm text-fg placeholder:text-[var(--fg-faint)] transition-colors focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus:bg-white/[0.05] disabled:opacity-60'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, 'min-h-[110px] resize-y leading-relaxed', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(controlClass, 'appearance-none pr-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4">
      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <label htmlFor={id} className="block text-[13px] font-medium text-fg">
              {label}
            </label>
          )}
          {description && <p className="mt-0.5 text-[11.5px] leading-relaxed text-[var(--fg-faint)]">{description}</p>}
        </div>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-50',
          checked
            ? 'border-transparent bg-[image:linear-gradient(100deg,var(--accent),#22d3ee)]'
            : 'border-[var(--stroke-strong)] bg-white/[0.06]'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-all',
            checked ? 'left-[22px]' : 'left-0.5'
          )}
        />
      </button>
    </div>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  onClear,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  onClear?: () => void
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg-faint)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(controlClass, 'pl-9 pr-9')}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('')
            onClear?.()
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-fg"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

/* ── Feedback ───────────────────────────────────────────────── */

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-muted', className)} role="status">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label && <span className="text-xs">{label}</span>}
    </span>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-white/[0.06]', className)} />
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-[var(--stroke)] bg-white/[0.04] text-muted">
        {icon || <Inbox className="h-5 w-5" />}
      </div>
      <h3 className="font-display text-base font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/[0.07] px-6 py-10 text-center">
      <AlertCircle className="h-5 w-5 text-rose-400" />
      <p className="max-w-md text-[13px] text-rose-200">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

/* ── Layout helpers ─────────────────────────────────────────── */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: string
  title: ReactNode
  description?: string
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-[var(--stroke)] pb-7 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--accent)_75%,white)]">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-[clamp(1.65rem,3.6vw,2.35rem)] font-semibold leading-tight text-fg">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function SectionTitle({
  title,
  subtitle,
  action,
  className,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-5 flex items-end justify-between gap-4', className)}>
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight text-fg">{title}</h2>
        {subtitle && <p className="mt-1 text-[12.5px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  trend,
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
  trend?: { value: string; positive?: boolean }
}) {
  return (
    <div className="glass card-hover rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-faint)]">{label}</span>
        {icon && <span className="text-[color-mix(in_srgb,var(--accent)_75%,white)]">{icon}</span>}
      </div>
      <div className="mt-2.5 font-display text-2xl font-semibold text-fg">{value}</div>
      <div className="mt-1 flex items-center gap-2">
        {hint && <span className="text-[11px] text-[var(--fg-faint)]">{hint}</span>}
        {trend && (
          <span className={cn('text-[11px] font-medium', trend.positive === false ? 'text-rose-400' : 'text-emerald-400')}>
            {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  className,
  counts,
}: {
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  className?: string
  counts?: Partial<Record<T, number>>
}) {
  return (
    <div className={cn('no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-1', className)}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={cn(
            'shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors',
            value === option
              ? 'border-transparent bg-[var(--accent)] text-[#05060c]'
              : 'border-[var(--stroke)] text-muted hover:border-[var(--stroke-strong)] hover:text-fg'
          )}
        >
          {option}
          {counts?.[option] !== undefined && (
            <span className="ml-1.5 opacity-70">{counts[option]}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ── Modal ──────────────────────────────────────────────────── */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && ref.current) {
        const nodes = ref.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
        )
        if (!nodes.length) return
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
            className={cn(
              'glass-strong flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl window-shadow',
              widths[size]
            )}
          >
            {(title || description) && (
              <div className="flex items-start justify-between gap-4 border-b border-[var(--stroke)] px-5 py-4">
                <div>
                  {title && <h2 className="font-display text-[15px] font-semibold text-fg">{title}</h2>}
                  {description && <p className="mt-0.5 text-[12px] text-muted">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-muted transition-colors hover:bg-white/[0.06] hover:text-fg"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-[var(--stroke)] px-5 py-3.5">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Tabs ───────────────────────────────────────────────────── */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { key: T; label: string; icon?: ReactNode }[]
  value: T
  onChange: (key: T) => void
  className?: string
}) {
  return (
    <div className={cn('no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-[var(--stroke)] bg-[var(--panel-soft)] p-1', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={value === tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors',
            value === tab.key ? 'bg-white/[0.09] text-fg shadow-sm' : 'text-muted hover:text-fg'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

/* ── Confirm / toast-free inline alert ──────────────────────── */

export function Alert({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'warning' | 'danger' | 'success'
  title?: string
  children: ReactNode
}) {
  const tones = {
    info: 'border-cyan-500/25 bg-cyan-500/[0.07] text-cyan-100',
    warning: 'border-amber-500/25 bg-amber-500/[0.07] text-amber-100',
    danger: 'border-rose-500/25 bg-rose-500/[0.07] text-rose-100',
    success: 'border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-100',
  }
  return (
    <div className={cn('rounded-xl border px-3.5 py-3 text-[12.5px] leading-relaxed', tones[tone])}>
      {title && <div className="mb-0.5 font-semibold">{title}</div>}
      {children}
    </div>
  )
}

/* ── Progress ───────────────────────────────────────────────── */

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]', className)}>
      <div
        className="h-full rounded-full bg-[image:linear-gradient(90deg,var(--accent),#22d3ee)] transition-[width] duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

/* ── Simple tooltip ─────────────────────────────────────────── */

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [show, setShow] = useState(false)
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--stroke)] bg-[var(--panel-strong)] px-2 py-1 text-[10.5px] text-fg shadow-lg"
            role="tooltip"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

/* ── Window context (used by shell) ─────────────────────────── */

export const ScrollContext = createContext<{ scrollToTop: () => void }>({ scrollToTop: () => {} })
export const useScrollToTop = () => useContext(ScrollContext)
