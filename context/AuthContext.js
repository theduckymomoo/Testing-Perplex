import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = "https://gklsblxfbnliketzmqoo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrbHNibHhmYm5saWtldHptcW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDczMTUsImV4cCI6MjA3MjMyMzMxNX0.Y136mC8IO80QDrptedB-9eD_f-t0Tdpy9hBE0R-MhgU";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

const AuthContext = createContext({
  user: null,
  userProfile: null,
  session: null,
  loading: true,
  profileLoading: false,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
  resetPassword: async () => {},
  getUserSettings: async () => {},
  upsertUserSettings: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [hasActivelySignedIn, setHasActivelySignedIn] = useState(false);

  // ---------- User Settings ----------
  const getUserSettings = async () => {
    const { data: { user }, error: uerr } = await supabase.auth.getUser();
    if (uerr || !user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;

    return (
      data ?? {
        id: user.id,
        dark_mode: true,
        notifications: true,
        haptic_feedback: true,
        energy_alerts: true,
        energy_threshold: 300,
        auto_optimization: false,
        weekly_reports: true,
        currency: 'ZAR',
        language: 'English',
        email_marketing: true,
        email_product: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );
  };

  const upsertUserSettings = async (patch) => {
    const { data: { user }, error: uerr } = await supabase.auth.getUser();
    if (uerr || !user) throw new Error('Not authenticated');

    const row = { id: user.id, ...patch, updated_at: new Date().toISOString() };

    const { error } = await supabase.from('user_settings').upsert(row, { onConflict: 'id' });
    if (error) throw error;

    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return data;
  };

  // ---------- Profile ----------
  const getUserProfile = async (userId) => {
    try {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) return null;
      return data;
    } catch {
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  const upsertUserProfile = async (userId, profileData) => {
    try {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) return null;
      return data;
    } catch {
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  // ---------- Auth ----------
  const signUp = async (email, password, additionalData = {}) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data.user) {
        const profileData = {
          email: data.user.email,
          first_name: additionalData.first_name || null,
          last_name: additionalData.last_name || null,
          phone: additionalData.phone || null,
          address: additionalData.address || null,
          emergency_contact: additionalData.emergency_contact || null,
          emergency_phone: additionalData.emergency_phone || null,
          group_chat: additionalData.group_chat || null,
          username: additionalData.username || null,
        };
        await upsertUserProfile(data.user.id, profileData);
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setHasActivelySignedIn(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        const profile = await getUserProfile(data.user.id);
        setUserProfile(profile);
      }
      return { data, error: null };
    } catch (error) {
      setHasActivelySignedIn(false);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setUserProfile(null);
      setSession(null);
      setHasActivelySignedIn(false);
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');
      const updatedProfile = await upsertUserProfile(user.id, updates);
      if (updatedProfile) setUserProfile(updatedProfile);
      return { data: updatedProfile, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // ---------- Auth State Listener ----------
  useEffect(() => {
    let mounted = true;
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        if (session?.user) {
          setUser(session.user);
          setSession(session);
        }
        setLoading(false);
      }
    };
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            setSession(session);
            if (hasActivelySignedIn) {
              const profile = await getUserProfile(session.user.id);
              if (!profile) {
                const newProfile = await upsertUserProfile(session.user.id, {
                  email: session.user.email,
                });
                setUserProfile(newProfile);
              } else {
                setUserProfile(profile);
              }
            }
          } else {
            setUser(null);
            setSession(null);
            setUserProfile(null);
            setHasActivelySignedIn(false);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hasActivelySignedIn]);

  // ---------- Context ----------
  const value = {
    user,
    userProfile,
    session,
    loading,
    profileLoading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    getUserSettings,
    upsertUserSettings,
    supabase,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
