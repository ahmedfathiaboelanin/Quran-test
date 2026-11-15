import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAllAuthStorage,
  getCurrentUser,
  registerExamineeAccount,
  signIn,
  signOut,
} from '../authService';

vi.mock('../../lib/supabase', () => ({
  getSupabaseClient: async () => ({
    from: () => ({
      select: () => ({
        ilike: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  }),
  isSupabaseConfigured: false,
}));

describe('authService', () => {
  beforeEach(() => {
    clearAllAuthStorage();
  });

  it('allows admin sign in with username admin and password admin', async () => {
    const user = await signIn('admin', 'admin');
    expect(user.role).toBe('admin');
    expect(user.username).toBe('admin');
    expect(getCurrentUser()).toEqual(user);
  });

  it('is case-insensitive for username admin', async () => {
    const user = await signIn('ADMIN ', 'admin');
    expect(user.role).toBe('admin');
    expect(user.username).toBe('admin');
  });

  it('rejects incorrect password for admin', async () => {
    await expect(signIn('admin', 'wrongpass')).rejects.toThrow(
      'اسم المستخدم أو كلمة المرور غير صحيحة.',
    );
  });

  it('registers an examinee account and allows them to sign in', async () => {
    await registerExamineeAccount('ex-1', 'عمر مجدي', {
      username: 'omar',
      password: 'secret123',
    });

    const user = await signIn('omar', 'secret123');
    expect(user.role).toBe('examinee');
    expect(user.username).toBe('omar');
    expect(user.name).toBe('عمر مجدي');
    expect(user.examineeId).toBe('ex-1');
  });

  it('clears session on signOut', async () => {
    await signIn('admin', 'admin');
    expect(getCurrentUser()).not.toBeNull();

    signOut();
    expect(getCurrentUser()).toBeNull();
  });
});
