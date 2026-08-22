import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getSignedImageUrl } from '@/services/supabaseApi'

const BUCKET = 'street-reports'

export function useSignedImageUrl(storedValue: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!storedValue) {
      setUrl(null)
      return
    }

    if (
      storedValue.startsWith('http://') ||
      storedValue.startsWith('https://') ||
      storedValue.startsWith('data:')
    ) {
      setUrl(storedValue)
      return
    }

    let cancelled = false
    getSignedImageUrl(storedValue, 3600)
      .then((signed) => {
        if (!cancelled) setUrl(signed)
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load image:', err)
          setUrl(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [storedValue])

  return url
}
