const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from project root (backend/.env)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
// Critical: Always use Service Role Key for backend admin-level operations that bypass RLS
// Important: If using Service Role Key, keep it private and NEVER expose it to the frontend!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase Configuration Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// For public auth verification (bypasses service-role session confusion)
const supabasePublic = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Add extra property while keeping default export
supabase.supabasePublic = supabasePublic;
module.exports = supabase;
