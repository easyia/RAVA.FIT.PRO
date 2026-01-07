import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [admin, setAdmin] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const fetchCoachData = async (userId: string) => {
        console.log('[Auth] Fetching coach data for:', userId);
        try {
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('SUPABASE_TIMEOUT')), 5000)
            );

            // Race the real fetch against the timeout
            const fetchPromise = supabase
                .from('coaches')
                .select('status, is_admin')
                .eq('id', userId)
                .maybeSingle();

            const result: any = await Promise.race([fetchPromise, timeoutPromise]);
            const { data, error } = result;

            if (error) {
                console.error('[Auth] Error fetching coach data:', error);
                return;
            }

            if (data) {
                console.log('[Auth] Coach data received:', data);
                setStatus(data.status);
                setAdmin(data.is_admin);
            }
        } catch (err: any) {
            if (err.message === 'SUPABASE_TIMEOUT') {
                console.warn('[Auth] Database query timed out. Proceeding with default values.');
            } else {
                console.error('[Auth] Unexpected error in fetchCoachData:', err);
            }
        }
    };

    useEffect(() => {
        let mounted = true;

        const initialize = async () => {
            console.log('[Auth] Initializing authentication...');
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();

                if (!mounted) return;

                setSession(initialSession);
                setUser(initialSession?.user ?? null);

                if (initialSession?.user) {
                    // Do NOT await here to avoid blocking the UI
                    fetchCoachData(initialSession.user.id);
                }
            } catch (err) {
                console.error('[Auth] Initialization error:', err);
            } finally {
                if (mounted) {
                    console.log('[Auth] Initialization complete. Loading: false');
                    setLoading(false);
                }
            }
        };

        initialize();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            console.log('[Auth] State changed:', event);

            if (!mounted) return;

            setSession(currentSession);
            setUser(currentSession?.user ?? null);

            if (currentSession?.user) {
                // Do NOT await here
                fetchCoachData(currentSession.user.id);
            } else {
                setStatus(null);
                setAdmin(false);
            }

            // Immediately set loading to false after auth state change
            setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return {
        user,
        session,
        loading,
        isAuthenticated: !!user,
        isAdmin: admin,
        status,
        role: user?.user_metadata?.role || 'coach'
    };
}
