'use client';

import { LogOut, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { clearCredentials } from '@/lib/store/auth.slice';
import { useLogoutMutation } from '@/lib/store/api/auth.api';

export function Topbar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const staff = useAppSelector((s) => s.auth.staff);
  const [logout] = useLogoutMutation();

  async function onLogout() {
    try {
      await logout().unwrap();
    } catch {
      /* token already invalid — clear locally anyway */
    }
    dispatch(clearCredentials());
    router.replace('/login');
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="text-sm font-medium text-gray-700">Franchise Management</div>
      <div className="flex items-center gap-4 text-gray-500">
        <div className="flex items-center gap-2">
          <UserCircle className="h-6 w-6" />
          <span className="text-sm text-gray-700">
            {staff?.full_name ?? 'Staff'}
            {staff?.role ? ` · ${staff.role}` : ''}
          </span>
        </div>
        <button
          onClick={onLogout}
          aria-label="Log out"
          className="flex items-center gap-1 text-sm hover:text-gray-800"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
