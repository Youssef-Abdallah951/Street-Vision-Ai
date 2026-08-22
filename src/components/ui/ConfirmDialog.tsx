import { useState, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean
    title: string
    message?: ReactNode
    confirmLabel?: string
    danger?: boolean
    onConfirm?: () => void | Promise<void>
  }>({ open: false, title: '' })

  const confirm = (opts: {
    title: string
    message?: ReactNode
    confirmLabel?: string
    danger?: boolean
    onConfirm: () => void | Promise<void>
  }) => {
    setState({ open: true, ...opts })
  }

  const dialog = (
    <Modal
      open={state.open}
      onClose={() => setState((s) => ({ ...s, open: false }))}
      title={state.title}
      size="sm"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="text-sm leading-relaxed text-surface-600 dark:text-surface-300">
          {state.message}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => setState((s) => ({ ...s, open: false }))}>
          Cancel
        </Button>
        <Button
          variant={state.danger ? 'danger' : 'primary'}
          onClick={async () => {
            await state.onConfirm?.()
            setState((s) => ({ ...s, open: false }))
          }}
        >
          {state.confirmLabel ?? 'Confirm'}
        </Button>
      </div>
    </Modal>
  )

  return { confirm, dialog }
}

export { Button }
