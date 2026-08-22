import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeState {
  mode: ThemeMode
  resolved: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
}

function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return mode
}

function applyTheme(resolved: 'light' | 'dark') {
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  root.style.colorScheme = resolved
}

const mq = window.matchMedia('(prefers-color-scheme: dark)')
mq.addEventListener?.('change', () => {
  const mode = useThemeStore.getState().mode
  if (mode === 'system') {
    const resolved = resolveMode(mode)
    applyTheme(resolved)
    useThemeStore.setState({ resolved })
  }
})

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      resolved: resolveMode('system'),
      setMode: (mode) => {
        const resolved = resolveMode(mode)
        applyTheme(resolved)
        set({ mode, resolved })
      },
    }),
    {
      name: 'streetvision_theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = resolveMode(state.mode)
          applyTheme(resolved)
          state.resolved = resolved
        }
      },
    },
  ),
)

// Initial application
applyTheme(useThemeStore.getState().resolved)
