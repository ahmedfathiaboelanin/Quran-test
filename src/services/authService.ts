import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import type {
  AppUser,
  ExamineeCredentialsInput,
  UserAccount,
} from '../types/auth';

const SESSION_STORAGE_KEY = 'quran_test_auth_session';
const ACCOUNTS_STORAGE_KEY = 'quran_test_auth_accounts';

const memoryStore = new Map<string, string>();

const storage = {
  getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return memoryStore.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    memoryStore.set(key, value);
  },
  removeItem(key: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    memoryStore.delete(key);
  },
  clear(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    memoryStore.clear();
  },
};

export function clearAllAuthStorage(): void {
  storage.clear();
}

export const DEFAULT_ADMIN_ACCOUNT: UserAccount = {
  id: 'admin-default',
  username: 'admin',
  password: 'admin',
  role: 'admin',
  name: 'مدير النظام',
  createdAt: '2026-11-15T00:00:00.000Z',
};

export class AuthServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function sanitizeUser(account: UserAccount): AppUser {
  return {
    id: account.id,
    username: account.username,
    role: account.role,
    name: account.name,
    examineeId: account.examineeId ?? null,
    createdAt: account.createdAt,
  };
}

function readLocalAccounts(): UserAccount[] {
  try {
    const raw = storage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return [DEFAULT_ADMIN_ACCOUNT];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [DEFAULT_ADMIN_ACCOUNT];

    // Ensure default admin is always present
    const hasAdmin = parsed.some(
      (acc) => normalizeUsername(acc.username) === 'admin',
    );
    return hasAdmin ? parsed : [DEFAULT_ADMIN_ACCOUNT, ...parsed];
  } catch {
    return [DEFAULT_ADMIN_ACCOUNT];
  }
}

function saveLocalAccounts(accounts: UserAccount[]): void {
  try {
    storage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore storage quota errors
  }
}

export function getCurrentUser(): AppUser | null {
  try {
    const raw = storage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

export function saveSession(user: AppUser): void {
  try {
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearSession(): void {
  try {
    storage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

async function tryFetchRemoteAccount(
  client: SupabaseClient,
  normalizedUsername: string,
): Promise<UserAccount | null> {
  try {
    const { data, error } = await client
      .from('app_users')
      .select('*')
      .ilike('username', normalizedUsername)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: String(data.id),
      username: String(data.username),
      password: String(data.password),
      role: data.role === 'admin' ? 'admin' : 'examinee',
      name: String(data.name || data.username),
      examineeId: data.examinee_id ? String(data.examinee_id) : null,
      createdAt: String(data.created_at || new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

export async function signIn(
  rawUsername: string,
  rawPass: string,
): Promise<AppUser> {
  const username = normalizeUsername(rawUsername);
  const password = rawPass.trim();

  if (!username || !password) {
    throw new AuthServiceError('يرجى إدخال اسم المستخدم وكلمة المرور.');
  }

  // 1. Direct match for default admin credentials
  if (username === 'admin' && password === 'admin') {
    const user = sanitizeUser(DEFAULT_ADMIN_ACCOUNT);
    saveSession(user);
    return user;
  }

  // 2. Check remote Supabase accounts if configured
  if (isSupabaseConfigured) {
    try {
      const client = await getSupabaseClient();
      const remoteAccount = await tryFetchRemoteAccount(client, username);
      if (remoteAccount && remoteAccount.password === password) {
        // Sync to local accounts
        const locals = readLocalAccounts().filter(
          (a) => normalizeUsername(a.username) !== username,
        );
        saveLocalAccounts([...locals, remoteAccount]);

        const user = sanitizeUser(remoteAccount);
        saveSession(user);
        return user;
      }
    } catch {
      // Fallback to local accounts if network fails
    }
  }

  // 3. Check local accounts
  const accounts = readLocalAccounts();
  const matched = accounts.find(
    (acc) =>
      normalizeUsername(acc.username) === username &&
      acc.password === password,
  );

  if (!matched) {
    throw new AuthServiceError('اسم المستخدم أو كلمة المرور غير صحيحة.');
  }

  const user = sanitizeUser(matched);
  saveSession(user);
  return user;
}

export function signOut(): void {
  clearSession();
}

export async function registerExamineeAccount(
  examineeId: string,
  name: string,
  input: ExamineeCredentialsInput,
): Promise<UserAccount> {
  const username = normalizeUsername(input.username);
  const password = input.password.trim();

  if (!username) {
    throw new AuthServiceError('اسم المستخدم مطلوب.');
  }
  if (!password) {
    throw new AuthServiceError('كلمة المرور مطلوبة.');
  }

  // Check if username already used by someone else locally
  const accounts = readLocalAccounts();
  const existing = accounts.find(
    (acc) =>
      normalizeUsername(acc.username) === username &&
      acc.examineeId !== examineeId,
  );
  if (existing) {
    throw new AuthServiceError('اسم المستخدم مستخدم بالفعل، اختر اسمًا آخر.');
  }

  const account: UserAccount = {
    id: `acc-${examineeId}`,
    username,
    password,
    role: 'examinee',
    name: name.trim() || username,
    examineeId,
    createdAt: new Date().toISOString(),
  };

  // Try to write to Supabase
  if (isSupabaseConfigured) {
    try {
      const client = await getSupabaseClient();
      await client
        .from('app_users')
        .upsert(
          {
            examinee_id: examineeId,
            username,
            password,
            role: 'examinee',
            name: account.name,
          },
          { onConflict: 'username' },
        );
    } catch {
      // Keep local copy even if remote table isn't migrated yet
    }
  }

  // Update local accounts list
  const nextAccounts = accounts.filter(
    (acc) => acc.examineeId !== examineeId && normalizeUsername(acc.username) !== username,
  );
  nextAccounts.push(account);
  saveLocalAccounts(nextAccounts);

  return account;
}

export async function updateExamineeAccount(
  examineeId: string,
  name: string,
  input: Partial<ExamineeCredentialsInput>,
): Promise<UserAccount | null> {
  const accounts = readLocalAccounts();
  const existing = accounts.find((acc) => acc.examineeId === examineeId);

  const nextUsername = input.username !== undefined
    ? normalizeUsername(input.username)
    : existing?.username;
  const nextPassword = input.password !== undefined
    ? input.password.trim()
    : existing?.password;

  if (!nextUsername || !nextPassword) {
    // If clearing credentials, remove account
    if (existing) {
      await deleteExamineeAccount(examineeId);
    }
    return null;
  }

  return registerExamineeAccount(examineeId, name, {
    username: nextUsername,
    password: nextPassword,
  });
}

export async function deleteExamineeAccount(examineeId: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const client = await getSupabaseClient();
      await client.from('app_users').delete().eq('examinee_id', examineeId);
    } catch {
      // Ignore
    }
  }

  const accounts = readLocalAccounts().filter((a) => a.examineeId !== examineeId);
  saveLocalAccounts(accounts);
}

export async function getAccountForExaminee(
  examineeId: string,
): Promise<UserAccount | null> {
  if (isSupabaseConfigured) {
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client
        .from('app_users')
        .select('*')
        .eq('examinee_id', examineeId)
        .maybeSingle();

      if (!error && data) {
        return {
          id: String(data.id),
          username: String(data.username),
          password: String(data.password),
          role: 'examinee',
          name: String(data.name || data.username),
          examineeId: String(data.examinee_id),
          createdAt: String(data.created_at || new Date().toISOString()),
        };
      }
    } catch {
      // Fallback to local
    }
  }

  const accounts = readLocalAccounts();
  return accounts.find((acc) => acc.examineeId === examineeId) ?? null;
}

export async function getAllAccountsMap(): Promise<Record<string, UserAccount>> {
  const map: Record<string, UserAccount> = {};

  if (isSupabaseConfigured) {
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client.from('app_users').select('*');
      if (!error && Array.isArray(data)) {
        for (const row of data) {
          if (row.examinee_id) {
            map[row.examinee_id] = {
              id: String(row.id),
              username: String(row.username),
              password: String(row.password),
              role: row.role === 'admin' ? 'admin' : 'examinee',
              name: String(row.name || row.username),
              examineeId: String(row.examinee_id),
              createdAt: String(row.created_at || new Date().toISOString()),
            };
          }
        }
      }
    } catch {
      // Fallback
    }
  }

  // Also overlay local accounts
  for (const acc of readLocalAccounts()) {
    if (acc.examineeId && !map[acc.examineeId]) {
      map[acc.examineeId] = acc;
    }
  }

  return map;
}
