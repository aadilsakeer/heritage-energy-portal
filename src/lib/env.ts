function readRequiredEnv(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY' | 'VITE_GEMINI_API_KEY'): string {
  const value = import.meta.env[name]

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env and set a real value.`,
    )
  }

  if (
    value.includes('your_') ||
    value.includes('placeholder') ||
    value === 'undefined'
  ) {
    throw new Error(
      `Invalid environment variable: ${name}. Replace the placeholder with a real value.`,
    )
  }

  return value.trim()
}

export const env = {
  get supabaseUrl() {
    return readRequiredEnv('VITE_SUPABASE_URL')
  },
  get supabaseAnonKey() {
    return readRequiredEnv('VITE_SUPABASE_ANON_KEY')
  },
  get geminiApiKey() {
    return readRequiredEnv('VITE_GEMINI_API_KEY')
  },
}
