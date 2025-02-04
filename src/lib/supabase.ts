import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
// const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseUrl = "https://dkylguaknzyiofcdgphq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRreWxndWFrbnp5aW9mY2RncGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2OTUwNjcsImV4cCI6MjA1NDI3MTA2N30.vJuUBqjZplbP1bvOSjfkXxiEo6D_nlsZAHDLWxOVKdA"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});