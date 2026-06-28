import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uuunkwwcuwsxtooyboha.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dW5rd3djdXdzeHRvb3lib2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MDc1MjksImV4cCI6MjA5ODE4MzUyOX0.zPrSxCHHDw3kzVAFgSYd34KT29-qCFYfH53T3ILGQGw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
