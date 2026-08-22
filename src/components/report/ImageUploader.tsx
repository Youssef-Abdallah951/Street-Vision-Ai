import { useRef, useState } from 'react'
import { Camera, ImagePlus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ImageUploader({
  value,
  onChange,
  onFileChange,
}: {
  value: string | null
  onChange: (dataUrl: string) => void
  onFileChange?: (file: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)

  const readFile = (file?: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.')
      return
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      alert(`Unsupported format: ${file.type}. Please upload a JPG, PNG, or WebP image.`)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image is too large. Max size is 10 MB.')
      return
    }
    setProcessing(true)
    const reader = new FileReader()
    reader.onload = () => {
      onChange(reader.result as string)
      onFileChange?.(file)
      setProcessing(false)
    }
    reader.onerror = () => {
      setProcessing(false)
      alert('Could not read the image.')
    }
    reader.readAsDataURL(file)
  }

  if (value) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-700">
        <img src={value} alt="Selected report" className="h-full max-h-[420px] w-full object-cover" />
        <button
          onClick={() => {
            onChange('')
            onFileChange?.(null)
          }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface-950/60 text-white backdrop-blur transition-colors hover:bg-surface-950/80"
          aria-label="Remove image"
        >
          <X className="h-[18px] w-[18px]" />
        </button>
        <div className="absolute bottom-3 left-3 rounded-full bg-surface-950/60 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          Image ready for AI analysis
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          readFile(e.dataTransfer.files?.[0])
        }}
        className={cn(
          'flex min-h-[260px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-surface-300 bg-surface-50/60 p-8 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40 dark:border-surface-700 dark:bg-surface-900/50 dark:hover:border-brand-600 dark:hover:bg-brand-950/20',
          processing && 'pointer-events-none opacity-70',
        )}
      >
        {processing ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
            <p className="text-sm font-medium text-surface-600 dark:text-surface-300">Processing image…</p>
          </>
        ) : (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <ImagePlus className="h-8 w-8" />
            </div>
            <div>
              <p className="text-base font-semibold text-surface-900 dark:text-white">
                Take a photo or upload one
              </p>
                  <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                    Drag & drop an image here, or choose a file — up to 10 MB
                  </p>
            </div>
          </>
        )}
      </button>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          onClick={() => cameraRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white py-3 text-sm font-medium text-surface-700 shadow-soft transition-colors hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700"
        >
          <Camera className="h-4 w-4" />
          Use camera
        </button>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white py-3 text-sm font-medium text-surface-700 shadow-soft transition-colors hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700"
        >
          <ImagePlus className="h-4 w-4" />
          Choose from files
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => readFile(e.target.files?.[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => readFile(e.target.files?.[0])}
      />
    </div>
  )
}
