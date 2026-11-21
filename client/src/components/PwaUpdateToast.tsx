import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw, X } from 'lucide-react'
import { applyPwaUpdate, subscribePwaUpdate } from '../lib/pwa'

/**
 * Non-blocking prompt shown when a new service worker is installed.
 * The visitor decides when to reload, so open windows and drafts are kept.
 */
export function PwaUpdateToast() {
  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => subscribePwaUpdate(setReady), [])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[200] flex justify-center px-4">
      <AnimatePresence>
        {ready && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            role="status"
            aria-live="polite"
            className="pointer-events-auto flex w-full max-w-[430px] items-center gap-3 rounded-2xl border border-white/20 bg-[#0b1020]/92 px-3.5 py-3 text-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[image:linear-gradient(135deg,var(--accent),#22d3ee)] text-[#05060c]">
              <RefreshCw className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold leading-tight">A new version is ready</p>
              <p className="mt-0.5 text-[10.5px] leading-snug text-white/60">
                Reload when it suits you — nothing is lost.
              </p>
            </div>
            <button
              type="button"
              onClick={applyPwaUpdate}
              className="shrink-0 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#05060c] transition hover:brightness-105"
            >
              Update
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss update notice"
              className="shrink-0 rounded-md p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
