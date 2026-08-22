// ============================================================
// Environment configuration
// Supabase keys are REQUIRED for the application to run.
// ============================================================

export const env = {
  appName: import.meta.env.VITE_APP_NAME || 'StreetVision AI',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  aiProvider: (import.meta.env.VITE_AI_PROVIDER as 'none' | 'custom') || 'none',
  customAiUrl: import.meta.env.VITE_CUSTOM_AI_URL || '',
  mapboxToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '',
}

export const hasSupabase = Boolean(env.supabaseUrl && env.supabaseAnonKey)
export const hasMapbox = Boolean(env.mapboxToken)
export const hasAI = env.aiProvider === 'custom' && Boolean(env.customAiUrl)
