import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
// const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseUrl = "https://gmtvyzqyjzeftipprsgh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdHZ5enF5anplZnRpcHByc2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzMTA5OTMsImV4cCI6MjA1NTg4Njk5M30.sFzTppAQkw63G3MVpq7E07X_7btShFz_ssDjzHbM2uI"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});