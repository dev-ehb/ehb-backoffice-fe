'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  useGetFranchiseQuery,
  useGetHistoryQuery,
  useLazySearchUsersQuery,
  useAssignFranchiseMutation,
  useRevokeFranchiseMutation,
  useRenameFranchiseMutation,
  type AssignmentHistoryRow,
} from '@/lib/store/api/franchises.api';
import { getLevelLabel, getStatusColor, formatDate, cn } from '@/lib/utils';
import { useAppSelector } from '@/lib/store/hooks';
import { TerritoryMap } from '@/components/map/territory-map';
import type { EhbUserSummary } from '@/types/backoffice.types';

export default function FranchiseDetailPage() {
  const params = useParams<{ id: string }>();
  const staff = useAppSelector((s) => s.auth.staff);
  const isAdmin = staff?.role === 'admin';

  const { data: f, isLoading, isError, refetch } = useGetFranchiseQuery(params.id);
  const { data: history } = useGetHistoryQuery(params.id);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [revoke, { isLoading: revoking }] = useRevokeFranchiseMutation();
  const onRevoke = async () => {
    if (!confirm('Revoke this franchise from its current owner?')) return;
    try {
      await revoke({ id: params.id }).unwrap();
      refetch();
    } catch {
      alert('Revoke failed — check that you are logged in as admin and ehb-franchises is reachable.');
    }
  };

  if (isLoading) return <div className="skeleton h-48 w-full" />;
  if (isError || !f) return <p className="text-sm text-red-600">Franchise not found.</p>;

  const isAssigned = f.status === 'Assigned' || f.status === 'Active';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <AdminRenameTitle
          franchiseId={params.id}
          displayName={f.display_name ?? f.name}
          code={f.code}
          canEdit={isAdmin}
          onSaved={refetch}
        />
        <span className={`rounded-full px-2 py-0.5 text-xs ${getStatusColor(f.status)}`}>
          {f.status}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              {isAssigned ? 'Reassign' : 'Assign'}
            </button>
          )}
          {isAdmin && isAssigned && (
            <button
              onClick={onRevoke}
              disabled={revoking}
              className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {revoking ? 'Revoking…' : 'Revoke'}
            </button>
          )}
        </div>
      </div>

      {/* Detail cards — radius only shown for Subs (Corp/Master have no territory). */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {([
          ['Level', getLevelLabel(f.level)],
          ['Region', f.region],
          f.level === 'sub' && f.radius_km > 0
            ? ['Radius', `${f.radius_km} km`]
            : null,
          ['Stores', String(f.store_count)],
          ['Child franchises', String(f.child_count)],
          ['Owner', f.owner_id ?? 'Unassigned'],
          ['Parent', f.parent_id ?? '—'],
          ['Created', formatDate(f.created_at)],
        ].filter(Boolean) as [string, string][]).map(([k, v]) => (
          <div key={k} className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
            <div className="text-xs uppercase tracking-wide text-gray-400">{k}</div>
            <div className="mt-1 break-all text-sm font-medium text-gray-800">{v}</div>
          </div>
        ))}
      </div>

      {/* Territory map (OpenStreetMap, free + open-source via react-leaflet) */}
      {f.center?.coordinates && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              {f.level === 'sub' ? 'Territory' : 'Location'}
            </h2>
            <span className="text-xs text-gray-500">
              {f.center.coordinates[1].toFixed(4)}, {f.center.coordinates[0].toFixed(4)}
              {f.level === 'sub' && f.radius_km > 0 && (
                <>{' '}&middot; radius {f.radius_km} km</>
              )}
            </span>
          </div>
          <TerritoryMap
            center={[f.center.coordinates[1], f.center.coordinates[0]]}
            radiusKm={f.level === 'sub' && f.radius_km > 0 ? f.radius_km : undefined}
            markers={[
              {
                position: [f.center.coordinates[1], f.center.coordinates[0]],
                label: f.display_name ?? f.name,
              },
            ]}
            zoom={f.level === 'master' ? 9 : f.level === 'corporate' ? 11 : 12}
            legend={
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-primary-600" />
                  {f.level === 'sub' ? 'Centre' : 'Pin'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-primary-600 bg-primary-500/20" />
                  Territory
                </span>
              </div>
            }
          />
        </div>
      )}

      {/* Assignment-history timeline */}
      <HistoryTimeline history={history ?? []} />

      {drawerOpen && (
        <AssignDrawer
          franchiseId={params.id}
          isReassign={isAssigned}
          onClose={() => setDrawerOpen(false)}
          onSuccess={() => {
            setDrawerOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

// ── History timeline ─────────────────────────────────────────────────────────

function HistoryTimeline({ history }: { history: AssignmentHistoryRow[] }) {
  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
        No assignments yet — this franchise hasn&apos;t been handed to a user.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-card">
      <div className="border-b border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
        Assignment history
      </div>
      <ol className="divide-y divide-gray-100">
        {history.map((row) => (
          <li key={row._id} className="px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs',
                  row.action === 'assign' && 'bg-blue-100 text-blue-700',
                  row.action === 'reassign' && 'bg-amber-100 text-amber-700',
                  row.action === 'revoke' && 'bg-red-100 text-red-700',
                )}
              >
                {row.action}
              </span>
              <span className="text-gray-500">{formatDate(row.created_at)}</span>
            </div>
            <div className="mt-1 text-gray-700">
              {row.action === 'revoke' ? (
                <>
                  Revoked from <code className="text-xs">{row.previous_owner_id}</code>
                </>
              ) : row.action === 'reassign' ? (
                <>
                  From <code className="text-xs">{row.previous_owner_id ?? '—'}</code> to{' '}
                  <code className="text-xs">{row.new_owner_id}</code>
                </>
              ) : (
                <>
                  Assigned to <code className="text-xs">{row.new_owner_id}</code>
                </>
              )}
            </div>
            {row.note && <div className="mt-1 text-xs text-gray-500">Note: {row.note}</div>}
            <div className="mt-1 text-xs text-gray-400">by staff {row.performed_by}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Assign drawer (user typeahead + confirm) ─────────────────────────────────

function AssignDrawer({
  franchiseId,
  isReassign,
  onClose,
  onSuccess,
}: {
  franchiseId: string;
  isReassign: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<EhbUserSummary | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [trigger, { data: results, isFetching }] = useLazySearchUsersQuery();
  const [assign, { isLoading: assigning }] = useAssignFranchiseMutation();

  // Debounced search (300 ms) so we don't hammer EHB Main on every keystroke.
  useEffect(() => {
    if (!q.trim()) return;
    const t = setTimeout(() => {
      trigger(q.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [q, trigger]);

  const buttonLabel = useMemo(
    () => (assigning ? (isReassign ? 'Reassigning…' : 'Assigning…') : isReassign ? 'Reassign' : 'Assign'),
    [assigning, isReassign],
  );

  async function onConfirm() {
    if (!selected) return;
    setError(null);
    try {
      await assign({
        id: franchiseId,
        new_owner_id: selected.ehb_user_id,
        note: note.trim() || undefined,
      }).unwrap();
      onSuccess();
    } catch {
      setError('Assignment failed. Check that EHB Main + ehb-franchises are reachable.');
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/30"
        onClick={onClose}
        role="button"
        aria-label="Close drawer"
      />
      {/* Drawer */}
      <aside className="flex w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            {isReassign ? 'Reassign franchise' : 'Assign franchise'}
          </h2>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">
            Close
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
              Find an EHB user
            </label>
            <input
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setSelected(null);
              }}
              placeholder="Search by name or email"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {selected ? (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm">
                <div>
                  <div className="font-medium text-primary-900">{selected.full_name}</div>
                  <div className="text-xs text-primary-700">{selected.email}</div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-primary-700 hover:underline"
                >
                  change
                </button>
              </div>
            ) : (
              <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-gray-200">
                {isFetching && (
                  <div className="px-3 py-2 text-sm text-gray-400">Searching…</div>
                )}
                {!isFetching && (results?.length ?? 0) === 0 && q.trim() && (
                  <div className="px-3 py-2 text-sm text-gray-400">
                    No EHB users match &ldquo;{q}&rdquo;.
                  </div>
                )}
                {(results ?? []).map((u) => (
                  <button
                    key={u.ehb_user_id}
                    onClick={() => setSelected(u)}
                    className="block w-full border-b border-gray-100 px-3 py-2 text-left last:border-0 hover:bg-gray-50"
                  >
                    <div className="text-sm font-medium text-gray-900">{u.full_name}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Internal note — visible only in audit history"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!selected || assigning}
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {buttonLabel}
          </button>
        </div>
      </aside>
    </div>
  );
}

/**
 * Backoffice admin rename of a franchise display_name. Bypasses the 30-day
 * owner cooldown (server side enforces this is a service-key route).
 * The `code` is shown as a non-editable chip; only `display_name` can change.
 */
function AdminRenameTitle({
  franchiseId,
  displayName,
  code,
  canEdit,
  onSaved,
}: {
  franchiseId: string;
  displayName: string;
  code?: string;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(displayName);
  const [error, setError] = useState<string | null>(null);
  const [rename, { isLoading }] = useRenameFranchiseMutation();

  async function onSave() {
    setError(null);
    const next = value.trim();
    if (next.length < 2 || next.length > 60) {
      setError('Display name must be 2–60 characters');
      return;
    }
    try {
      await rename({ id: franchiseId, display_name: next }).unwrap();
      setEditing(false);
      onSaved();
    } catch (e: unknown) {
      const message =
        (e as { data?: { message?: string } } | undefined)?.data?.message ??
        'Rename failed';
      setError(message);
    }
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <button
          onClick={onSave}
          disabled={isLoading}
          className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {isLoading ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setValue(displayName);
            setError(null);
          }}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        {code && (
          <span className="basis-full font-mono text-[11px] text-gray-500">
            Code {code} stays unchanged — only the display name updates.
          </span>
        )}
        {error && <p className="basis-full text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <h1 className="text-lg font-semibold text-gray-900">{displayName}</h1>
      {code && (
        <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
          {code}
        </span>
      )}
      {canEdit && (
        <button
          onClick={() => setEditing(true)}
          title="Rename display name (admin)"
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          ✏️
        </button>
      )}
    </div>
  );
}
