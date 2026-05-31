'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/store/hooks';

export default function RootPage() {
  const router = useRouter();
  const token = useAppSelector((s) => s.auth.access_token);

  useEffect(() => {
    router.replace(token ? '/overview' : '/login');
  }, [token, router]);

  return null;
}
