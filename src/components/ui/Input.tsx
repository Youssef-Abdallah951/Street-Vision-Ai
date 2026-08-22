import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils'

const FIELD_BASE =
  'w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:opacity-60 dark:border-surface-700 dark:bg-surface-800 dark:text-white dark:placeholder:text-surface-500'

export interface FieldProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  containerClassName?: string
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & FieldProps
>(function Input(
  { label, hint, error, required, containerClassName, className, id, ...props },
  ref,
) {
  const fieldId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-surface-700 dark:text-surface-200">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={Boolean(error)}
        className={cn(FIELD_BASE, error && 'border-red-400 focus:border-red-500 focus:ring-red-500/25', className)}
        {...props}
      />
      {hint && !error && <p className="text-xs text-surface-400 dark:text-surface-500">{hint}</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
})

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps
>(function Textarea(
  { label, hint, error, required, containerClassName, className, id, ...props },
  ref,
) {
  const fieldId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-surface-700 dark:text-surface-200">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={fieldId}
        className={cn(FIELD_BASE, 'min-h-[96px] resize-y', error && 'border-red-400', className)}
        {...props}
      />
      {hint && !error && <p className="text-xs text-surface-400 dark:text-surface-500">{hint}</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
})

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & FieldProps
>(function Select(
  { label, hint, error, required, containerClassName, className, id, children, ...props },
  ref,
) {
  const fieldId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-surface-700 dark:text-surface-200">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={fieldId}
        className={cn(FIELD_BASE, 'cursor-pointer appearance-none pr-9', className)}
        {...props}
      >
        {children}
      </select>
      {hint && !error && <p className="text-xs text-surface-400 dark:text-surface-500">{hint}</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
})
