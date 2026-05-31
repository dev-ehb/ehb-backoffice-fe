'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useListFranchisesQuery } from '@/lib/store/api/franchises.api';
import { getLevelLabel, getStatusColor, cn } from '@/lib/utils';
import type { FranchiseLevel, FranchiseStatus } from '@/types/backoffice.types';

const LEVELS: { key: '' | FranchiseLevel; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'sub', label: 'Sub' },
  { key: 'corporate', label: 'Corporate' },
  { key: 'master', label: 'Master' },
];

const STATUSES: { key: '' | FranchiseStatus; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'Auto-Created', label: 'Auto-Created' },
  { key: 'Available', label: 'Available' },
  { key: 'Assigned', label: 'Assigned' },
  { key: 'Active', label: 'Active' },
];

function FranchisesList() {
  // Pre-select filters from URL query string (Overview deep-link uses ?status=...)
  const search = useSearchParams();
  const [level, setLevel] = useState<'' | FranchiseLevel>(
    (search.get('level') as FranchiseLevel) || '',
  );
  const [status, setStatus] = useState<'' | FranchiseStatus>(
    (search.get('status') as FranchiseStatus) || '',
  );
  const [region, setRegion] = useState<string>('');

  const { data: franchises, isLoading, isError } = useListFranchisesQuery({
    level: level || undefined,
    status: status || undefined,
    region: region.trim() || undefined,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Franchises</h1>
        <p className="text-sm text-gray-500">Browse auto-created franchises and assign them to EHB users.</p>
      </div>

      {/* Filters */}
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Level</span>
          {LEVELS.map((l) => (
            <button
              key={l.key || 'all'}
              onClick={() => setLevel(l.key as '' | FranchiseLevel)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                level === l.key
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</span>
          {STATUSES.map((s) => (
            <button
              key={s.key || 'all'}
              onClick={() => setStatus(s.key as '' | FranchiseStatus)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                status === s.key
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Region</span>
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="e.g. geo:31.5,74.3"
            className="w-72 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {isLoading && <div className="skeleton h-40 w-full" />}
      {isError && (
        <p className="text-sm text-red-600">
          Could not reach ehb-franchises. Make sure the franchises API is running on port 3010.
        </p>
      )}

      {franchises && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Code</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Level</th>
                <th className="px-4 py-2 font-medium">Region</th>
                <th className="px-4 py-2 font-medium">Stores</th>
                <th className="px-4 py-2 font-medium">Owner</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {franchises.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No franchises match these filters.
                  </td>
                </tr>
              )}
              {franchises.map((f) => (
                <tr key={f._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-700">
                      {f.code ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/franchises/${f._id}`} className="text-primary-700 hover:underline">
                      {f.display_name ?? f.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{getLevelLabel(f.level)}</td>
                  <td className="px-4 py-2 text-gray-600">{f.region}</td>
                  <td className="px-4 py-2 text-gray-600">{f.store_count}</td>
                  <td className="px-4 py-2 text-gray-500">{f.owner_id ?? '—'}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${getStatusColor(f.status)}`}>
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function FranchisesPage() {
  // useSearchParams() needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={<div className="skeleton h-40 w-full" />}>
      <FranchisesList />
    </Suspense>
  );
}
