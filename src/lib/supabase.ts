import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Directly write the credentials
const supabaseUrl = "https://gmtvyzqyjzeftipprsgh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdHZ5enF5anplZnRpcHByc2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1OTgxNDYsImV4cCI6MjA1OTE3NDE0Nn0.VP3IC6G2Xj4ugi_69jInhDRqqdczq1Syc4P4WTIQBbA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});