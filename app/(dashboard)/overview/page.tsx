'use client';

import Link from 'next/link';
import { useListFranchisesQuery } from '@/lib/store/api/franchises.api';
import type { FranchiseStatus } from '@/types/backoffice.types';

/**
 * Backoffice overview — pipeline counts across the four statuses
 * (Auto-Created / Available / Assigned / Active) computed live from the
 * ehb-franchises registry. Clicking a card drills into the filtered list.
 */
const STATUSES: { key: FranchiseStatus; label: string; color: string }[] = [
  { key: 'Auto-Created', label: 'Auto-Created', color: 'bg-gray-100 text-gray-700' },
  { key: 'Available', label: 'Available', color: 'bg-blue-100 text-blue-700' },
  { key: 'Assigned', label: 'Assigned', color: 'bg-amber-100 text-amber-700' },
  { key: 'Active', label: 'Active', color: 'bg-green-100 text-green-700' },
];

export default function OverviewPage() {
  const { data: franchises, isLoading, isError } = useListFranchisesQuery({});

  const counts: Record<FranchiseStatus, number> = {
    'Auto-Created': 0,
    Available: 0,
    Assigned: 0,
    Active: 0,
  };
  if (franchises) {
    for (const f of franchises) counts[f.status] = (counts[f.status] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500">
          Pipeline across the four franchise statuses. Click a card to open the filtered list.
        </p>
      </div>

      {isError && (
        <p className="text-sm text-red-600">
          Could not reach ehb-franchises. Make sure it&apos;s running on port 3010.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATUSES.map((s) => (
          <Link
            key={s.key}
            href={`/franchises?status=${encodeURIComponent(s.key)}`}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-card transition-shadow hover:shadow-md"
          >
            <span className={`rounded-full px-2 py-0.5 text-xs ${s.color}`}>{s.label}</span>
            <div className="mt-3 text-3xl font-semibold text-gray-900">
              {isLoading ? '—' : counts[s.key] ?? 0}
            </div>
            <div className="mt-1 text-xs text-gray-500">View filtered list &rarr;</div>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
        <h2 className="text-sm font-semibold text-gray-900">How this pipeline flows</h2>
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-medium">Auto-Created</span> &rarr;{' '}
          <span className="font-medium">Available</span> (staff review) &rarr;{' '}
          <span className="font-medium">Assigned</span> (admin assigns to an EHB user) &rarr;{' '}
          <span className="font-medium">Active</span> (owner logs in to their dashboard).
          Payment is intentionally out of scope right now &mdash; the assign action is the only step.
        </p>
      </div>
    </div>
  );
}
