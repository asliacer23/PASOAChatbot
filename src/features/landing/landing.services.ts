import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);


export async function fetchLandingAnnouncements(limit = 3) {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}


export async function fetchLandingEvents(limit = 3) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
