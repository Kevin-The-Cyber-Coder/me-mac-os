import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react'
import { GalleryCard } from './cards'
import type { GalleryItem } from '../../types'

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [index, setIndex] = useState<number | null>(null)

  useEffect(() => {
    if (index === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIndex(null)
      if (event.key === 'ArrowRight') setIndex((i) => (i === null ? null : (i + 1) % items.length))
      if (event.key === 'ArrowLeft') setIndex((i) => (i === null ? null : (i - 1 + items.length) % items.length))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [index, items.length])

  const active = index === null ? null : items[index]

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <GalleryCard key={item.id} item={item} onOpen={() => setIndex(i)} />
        ))}
      </div>

      <AnimatePresence>
        {active && index !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex flex-col bg-black/90 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label={active.title}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-medium text-white">{active.title}</p>
                <p className="text-[10px] text-white/50">
                  {active.category} · {index + 1} / {items.length}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href={active.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
                  aria-label="Open original"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  onClick={() => setIndex(null)}
                  className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
                  aria-label="Close lightbox"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center p-3 sm:p-8">
              <button
                onClick={() => setIndex((index - 1 + items.length) % items.length)}
                className="absolute left-2 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white/80 backdrop-blur hover:bg-black/80 hover:text-white sm:left-5"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <motion.img
                key={active.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                src={active.url}
                alt={active.title}
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
              />
              <button
                onClick={() => setIndex((index + 1) % items.length)}
                className="absolute right-2 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white/80 backdrop-blur hover:bg-black/80 hover:text-white sm:right-5"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {active.description && (
              <div className="border-t border-white/10 px-4 py-3">
                <p className="mx-auto max-w-3xl text-center text-[11.5px] leading-relaxed text-white/60">{active.description}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
