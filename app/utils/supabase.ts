import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Initialize the Supabase client
const supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

export { supabaseClient };
