import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jiyscqteyfcfnbtustqd.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppeXNjcXRleWZjZm5idHVzdHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NzA3MzIsImV4cCI6MjEwMTE0NjczMn0.Ck_Jn_2SUQosXWido7SaE7Y7VP1Jcq9ku_Y0-Qy0xew'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
