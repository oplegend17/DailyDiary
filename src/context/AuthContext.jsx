import { createContext, useState, useEffect, useContext } from 'react';
import { supabase, clearInvalidSessions } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabaseError, setSupabaseError] = useState(null);

  useEffect(() => {
    // Check for active session on initial load
    const checkUser = async () => {
      try {
        // First clear any invalid sessions
        await clearInvalidSessions();
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking auth session:', error);
          setSupabaseError(error.message);
          return;
        }
        
        // Validate session before setting user
        if (session && session.user) {
          // Check if token is expired
          const expiresAt = new Date(session.expires_at * 1000);
          if (expiresAt < new Date()) {
            console.log('Session expired, signing out');
            await supabase.auth.signOut();
            setUser(null);
          } else {
            setUser(session.user);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
        setSupabaseError('Failed to connect to Supabase. Please check your configuration.');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event);
          if (event === 'SIGNED_OUT') {
            setUser(null);
            // Clear any local storage related to auth
            localStorage.removeItem('supabase.auth.token');
          } else if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user);
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            setUser(session.user);
          } else if (event === 'USER_UPDATED' && session?.user) {
            setUser(session.user);
          } else {
            // For any other events or if session is null
            await clearInvalidSessions();
            setUser(session?.user || null);
          }
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setSupabaseError('Failed to connect to Supabase authentication services.');
      setLoading(false);
    }
  }, []);

  const signUp = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      // Clear any existing sessions first
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Signin error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear any local storage related to auth
      localStorage.removeItem('supabase.auth.token');
      setUser(null);
      
      return { error: null };
    } catch (error) {
      console.error('Signout error:', error);
      return { error };
    }
  };

  const value = {
    user,
    signUp,
    signIn,
    signOut,
    loading,
    supabaseError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 