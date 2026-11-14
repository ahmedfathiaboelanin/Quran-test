import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export class SupabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseConfigurationError';
  }
}

export class SupabaseSessionError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'SupabaseSessionError';
    this.cause = cause;
  }
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

let sessionPromise: Promise<void> | null = null;

/**
 * The tracker is a private examiner workspace, so writes require an
 * `authenticated` Supabase session. For a no-login PWA we create an anonymous
 * session on first use; a regular signed-in session is reused when present.
 *
 * Enable "Anonymous Sign-ins" in Supabase Auth for this flow.
 */
async function ensureAuthenticated(client: SupabaseClient): Promise<void> {
  const { data, error } = await client.auth.getSession();
  if (error) {
    throw new SupabaseSessionError(
      'تعذّر قراءة جلسة Supabase. تحقق من الاتصال ثم أعد المحاولة.',
      error,
    );
  }
  if (data.session) return;

  if (!sessionPromise) {
    sessionPromise = client.auth.signInAnonymously().then(({ error: signInError }) => {
      if (signInError) {
        sessionPromise = null;
        throw new SupabaseSessionError(
          'تعذّر بدء جلسة Supabase. فعّل Anonymous Sign-ins من إعدادات Supabase Auth أو سجّل الدخول.',
          signInError,
        );
      }
    });
  }

  await sessionPromise;
}

/** Returns a configured Supabase client with an authenticated session ready. */
export async function getSupabaseClient(): Promise<SupabaseClient> {
  if (!supabase) {
    throw new SupabaseConfigurationError(
      'لم يتم ضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY بعد.',
    );
  }

  await ensureAuthenticated(supabase);
  return supabase;
}
