// src/providers/AuthProvider.tsx
import React, { useState, createContext, useContext, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { supabase } from '~/src/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
  isAuthenticated: boolean;
  session: Session | null;
  user?: User;
  username?: string;
  setSession: (session: Session | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSessionState(session);
      
      if (session?.user) {
        // Fetch username from users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('username')
          .eq('id', session.user.id)
          .single();
        
        if (!error && userData) {
          setUsername(userData.username);
        }
      }
      
      setIsReady(true);
    };

    fetchSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_, session) => {
      setSessionState(session);
      
      if (session?.user) {
        // Fetch username when auth state changes
        const { data: userData, error } = await supabase
          .from('users')
          .select('username')
          .eq('id', session.user.id)
          .single();
        
        if (!error && userData) {
          setUsername(userData.username);
        }
      } else {
        setUsername(undefined);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!isReady) {
    return <ActivityIndicator size="large" color="#007bff" />;
  }

  return (
    <AuthContext.Provider value={{ 
      session, 
      user: session?.user, 
      username,
      isAuthenticated: !!session?.user, 
      setSession: setSessionState 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};