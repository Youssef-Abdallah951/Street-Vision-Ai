import { Moon, Sun, Monitor } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useThemeStore, type ThemeMode } from '@/store/theme'
import { cn } from '@/lib/utils'

const OPTIONS: Array<{ value: ThemeMode; icon: React.ReactNode; label: string }> = [
  { value: 'light', icon: <Sun className="h-4 w-4" />, label: 'Light' },
  { value: 'dark', icon: <Moon className="h-4 w-4" />, label: 'Dark' },
  { value: 'system', icon: <Monitor className="h-4 w-4" />, label: 'System' },
]

export function ThemeToggle({ className }: { className?: string }) {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-800 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-white"
        aria-label="Toggle theme"
      >
        {mode === 'dark' ? <Moon className="h-5 w-5" /> : mode === 'light' ? <Sun className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-36 overflow-hidden rounded-xl border border-surface-200 bg-white p-1 shadow-lift animate-scale-in dark:border-surface-700 dark:bg-surface-800">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setMode(opt.value)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                mode === opt.value
                  ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                  : 'text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-700',
              )}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
