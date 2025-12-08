import { createClient } from '@supabase/supabase-js';

// NOTE: In a real app, these should be in .env files.
// For this demo, please replace these with your actual Supabase Project URL and Anon Key.
const SUPABASE_URL: string = 'https://updunfmskjzfcwofouod.supabase.co'; 
const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwZHVuZm1za2p6ZmN3b2ZvdW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODU0NzgsImV4cCI6MjA4MDc2MTQ3OH0.Jb4Fs_tde-E6HTYd2jkvyPiCPdTQ7zrmA5pPzxlsRdY';

export const isSupabaseConfigured = () => {
    return SUPABASE_URL !== 'https://your-project-url.supabase.co' && 
           SUPABASE_ANON_KEY !== 'your-anon-key';
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);