import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV;

// Log environment variables (redacted for security)
console.log('Supabase URL configured:', supabaseUrl ? 'Yes' : 'No');
console.log('Supabase Anon Key configured:', supabaseAnonKey ? 'Yes' : 'No');

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Keep this true for better UX
    autoRefreshToken: true,
    // In development, we allow signups without email verification
    // This helps with testing when emails might not be delivered
    flowType: isDevelopment ? 'implicit' : 'pkce',
    detectSessionInUrl: true, // Important for OAuth and password resets
    storage: {
      // Use cookies in production for better security with SameSite and HttpOnly flags
      getItem: (key) => {
        const value = localStorage.getItem(key);
        // Clear invalid sessions that might be causing auto-login issues
        if (key === 'supabase.auth.token' && value) {
          try {
            const parsed = JSON.parse(value);
            // Check if token is expired or malformed
            if (!parsed || !parsed.expires_at || new Date(parsed.expires_at * 1000) < new Date()) {
              console.log('Clearing invalid auth session');
              localStorage.removeItem(key);
              return null;
            }
          } catch (e) {
            console.error('Error parsing auth token, clearing it', e);
            localStorage.removeItem(key);
            return null;
          }
        }
        return value;
      },
      setItem: (key, value) => localStorage.setItem(key, value),
      removeItem: (key) => localStorage.removeItem(key)
    }
  },
  db: {
    schema: 'public',
  },
  global: {
    // Log debug info when in development
    fetch: (...args) => {
      if (isDevelopment) {
        console.log('Supabase Fetch:', args[0]);
      }
      return fetch(...args);
    },
  },
});

// Log whether we're using development mode authentication
console.log(`Supabase auth in ${isDevelopment ? 'development' : 'production'} mode`);

// Ensures we don't have invalid sessions persisted
export const clearInvalidSessions = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    // If session exists but is invalid, sign out
    if (data && (!data.session || (data.session && data.session.expires_at && new Date(data.session.expires_at * 1000) < new Date()))) {
      console.log('Invalid session detected, signing out');
      await supabase.auth.signOut();
    }
  } catch (error) {
    console.error('Error checking session:', error);
    // Force sign out on error
    supabase.auth.signOut();
  }
};

// Check session validity on load
clearInvalidSessions();

// More detailed connection check
(async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // First check authentication
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('Supabase auth connection error:', authError.message);
    } else {
      console.log('Supabase auth connection successful', authData.session ? 'Session found' : 'No session');
    }
    
    // Then check database connection
    console.log('Testing database connection...');
    const { data, error } = await supabase.from('notes').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Database query error:', error.message);
      console.error('Error details:', error);
      
      // Check if this is a permissions error, which could mean the table exists but the user doesn't have access
      if (error.code === 'PGRST116') {
        console.log('This appears to be a permissions error. The table may exist but RLS policies might be restricting access.');
      }
      
      // Check if this is a "relation does not exist" error, meaning the table doesn't exist
      if (error.message && error.message.includes('relation "notes" does not exist')) {
        console.error('The "notes" table does not exist in the database.');
        console.log('Please run the setup_database.sql script to create the necessary tables.');
      }
    } else {
      console.log('Successfully connected to Supabase database');
      console.log('Database query result:', data);
    }
  } catch (err) {
    console.error('Failed to connect to Supabase:', err.message);
    console.error(err);
  }
})(); 