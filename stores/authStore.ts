import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User, UserRole } from '@/types/database';

interface AuthState {
  user: User | null;
  session: { access_token: string } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    let data, error;
    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      data = result.data;
      error = result.error;
    } catch (e) {
      return { error: 'Network request failed. Check your connection.' };
    }

    if (error || !data.user || !data.session) {
      return { error: error?.message ?? 'Sign in failed' };
    }

    // Fetch user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      return { error: 'Failed to load user profile' };
    }

    set({
      session: { access_token: data.session.access_token },
      user: profile as User,
    });

    return { error: null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  loadSession: async () => {
    set({ loading: true });

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({
          session: { access_token: session.access_token },
          user: profile as User | null,
          loading: false,
        });
      } else {
        set({ user: null, session: null, loading: false });
      }
    } catch {
      set({ user: null, session: null, loading: false });
    }
  },
}));
