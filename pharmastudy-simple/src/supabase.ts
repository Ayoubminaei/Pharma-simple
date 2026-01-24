import { createClient } from '@supabase/supabase-js'

// ⚠️ REPLACE THESE WITH YOUR ACTUAL VALUES FROM STEP 3!
const supabaseUrl = 'https://qwccxmqdehhuzkfaclin.supabase.co'  // ← Your Project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3Y2N4bXFkZWhodXprZmFjbGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNjQ4NTUsImV4cCI6MjA4NDg0MDg1NX0.C-S6E59CThog0cpCV_zrWFY4PYCMN2Dq0701BgFTg3A'  // ← Your anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
