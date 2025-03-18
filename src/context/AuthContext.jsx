import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabaseError, setSupabaseError] = useState(null);

  useEffect(() => {
    // Check for active session on initial load
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking auth session:', error);
          setSupabaseError(error.message);
          return;
        }
        
        setUser(session?.user || null);
      } catch (error) {
        console.error('Error checking auth session:', error);
        setSupabaseError('Failed to connect to Supabase. Please check your configuration.');
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user || null);
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