// src/providers/AuthProvider.tsx
import React, { useState, createContext, useContext, useEffect } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { supabase } from '~/src/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
  isAuthenticated: boolean;
  session: Session | null;
  user?: User;
  setSession: (session: Session | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSessionState(session);
      setIsReady(true);
    };

    fetchSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setSessionState(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!isReady) {
    return <ActivityIndicator size="large" color="#007bff" />;
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user, isAuthenticated: !!session?.user, setSession: setSessionState }}>
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