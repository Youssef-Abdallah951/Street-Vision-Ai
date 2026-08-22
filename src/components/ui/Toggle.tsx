import { cn } from '@/lib/utils'

export function Toggle({
  checked,
  onChange,
  label,
  size = 'md',
  className,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const dims = size === 'sm' ? { track: 'h-5 w-9', thumb: 'h-4 w-4', offset: 'after:translate-x-4' } : { track: 'h-6 w-11', thumb: 'h-5 w-5', offset: 'after:translate-x-5' }
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2.5', className)}>
      <span className="relative">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={cn(
            'block rounded-full bg-surface-300 transition-colors after:absolute after:top-0.5 after:left-0.5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-brand-600',
            dims.track,
            dims.thumb,
            dims.offset,
          )}
        />
      </span>
      {label && <span className="text-sm text-surface-700 dark:text-surface-200">{label}</span>}
    </label>
  )
}
