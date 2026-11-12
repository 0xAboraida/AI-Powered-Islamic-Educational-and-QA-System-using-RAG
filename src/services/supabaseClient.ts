import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lcqwpvhhfyfpmkmeyjaq.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_v5z-wihtAuEz629w4rQo_Q_P42ns3Ny';

export const supabase = createClient(supabaseUrl, supabaseKey);

