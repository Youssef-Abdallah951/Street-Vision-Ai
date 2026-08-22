import { cn } from '@/lib/utils'

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  count?: number
}

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 overflow-x-auto rounded-xl border border-surface-200 bg-surface-100 p-1 scrollbar-hide dark:border-surface-800 dark:bg-surface-800/70',
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
            active === tab.id
              ? 'bg-white text-surface-900 shadow-soft dark:bg-surface-900 dark:text-white'
              : 'text-surface-500 hover:text-surface-800 dark:text-surface-400 dark:hover:text-surface-100',
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count != null && (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                active === tab.id
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                  : 'bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400',
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
