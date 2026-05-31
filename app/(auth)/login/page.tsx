'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/lib/store/hooks';
import { setCredentials } from '@/lib/store/auth.slice';
import { useLoginMutation } from '@/lib/store/api/auth.api';

/**
 * EHB staff login. Standalone JWT (approved Phase 0) — the backoffice keeps its
 * own staff accounts, independent of EHB SSO. Seed an admin with `npm run seed`
 * in ehb-backoffice/backend.
 */
export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials({ staff: res.staff, access_token: res.access_token }));
      router.replace('/overview');
    } catch {
      setError('Invalid email or password');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-card">
        <h1 className="text-xl font-semibold text-gray-900">EHB Backoffice</h1>
        <p className="mt-1 text-sm text-gray-500">Staff sign in</p>

        <label className="mt-6 block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />

        <label className="mt-4 block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 w-full rounded-lg bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
