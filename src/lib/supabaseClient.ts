// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

//ntar diganti sesuai
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
