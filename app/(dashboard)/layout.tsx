'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { useGetMeQuery } from '@/lib/store/api/auth.api';
import { clearCredentials, setCredentials } from '@/lib/store/auth.slice';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.access_token);
  const staff = useAppSelector((s) => s.auth.staff);

  // Token survives in sessionStorage across reloads, but state.staff resets
  // to null on hydration, so role gates (admin-only buttons, etc.) silently
  // fail until we re-fetch /me. Skip the call once staff is already populated.
  const { data: me, error: meError } = useGetMeQuery(undefined, {
    skip: !token || !!staff,
  });

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  useEffect(() => {
    if (me && token) {
      dispatch(setCredentials({ staff: me, access_token: token }));
    }
  }, [me, token, dispatch]);

  useEffect(() => {
    if (meError && typeof meError === 'object' && 'status' in meError && meError.status === 401) {
      dispatch(clearCredentials());
      router.replace('/login');
    }
  }, [meError, dispatch, router]);

  if (!token) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="relative flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
}
