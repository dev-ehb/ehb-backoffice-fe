'use client';

import { useState } from 'react';
import { Check, Copy, Eye, EyeOff, KeyRound, X } from 'lucide-react';
import {
  useApprovePurchaseRequestMutation,
  useListPurchaseRequestsQuery,
  useRejectPurchaseRequestMutation,
  type PurchaseRequest,
  type PurchaseRequestStatus,
} from '@/lib/store/api/purchase-requests.api';
import { cn, formatDate } from '@/lib/utils';
import { useAppSelector } from '@/lib/store/hooks';

const STATUS_TABS: { key: PurchaseRequestStatus | 'all'; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

export default function PurchaseRequestsPage() {
  const staff = useAppSelector((s) => s.auth.staff);
  const isAdmin = staff?.role === 'admin';

  const [tab, setTab] = useState<PurchaseRequestStatus | 'all'>('pending');
  const { data: requests = [], isLoading, isError, refetch } = useListPurchaseRequestsQuery(
    tab === 'all' ? {} : { status: tab },
  );

  const [approvedDialog, setApprovedDialog] = useState<{
    request: PurchaseRequest;
    temp_password: string;
  } | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Purchase Requests</h1>
        <p className="text-sm text-gray-500">
          Visitors submit these from the public franchise detail page. Approve to mint a
          temp password for the buyer — copy it once and forward it to them out-of-band.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-card">
        {STATUS_TABS.map((s) => (
          <button
            key={s.key}
            onClick={() => setTab(s.key)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              tab === s.key
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading && <div className="skeleton h-40 w-full" />}
      {isError && (
        <p className="text-sm text-red-600">
          Couldn&apos;t load purchase requests. Is the backoffice API up?
        </p>
      )}

      {requests.length === 0 && !isLoading && (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
          No {tab === 'all' ? '' : tab} purchase requests.
        </div>
      )}

      <div className="space-y-3">
        {requests.map((r) => (
          <RequestCard
            key={r._id}
            request={r}
            isAdmin={isAdmin}
            onApproved={(payload) => {
              setApprovedDialog(payload);
              refetch();
            }}
            onRejected={() => refetch()}
          />
        ))}
      </div>

      {approvedDialog && (
        <ApprovedDialog
          request={approvedDialog.request}
          tempPassword={approvedDialog.temp_password}
          onClose={() => setApprovedDialog(null)}
        />
      )}
    </div>
  );
}

// ── Single request card ──────────────────────────────────────────────────────

function RequestCard({
  request,
  isAdmin,
  onApproved,
  onRejected,
}: {
  request: PurchaseRequest;
  isAdmin: boolean;
  onApproved: (payload: { request: PurchaseRequest; temp_password: string }) => void;
  onRejected: () => void;
}) {
  const [approve, { isLoading: approving }] = useApprovePurchaseRequestMutation();
  const [reject, { isLoading: rejecting }] = useRejectPurchaseRequestMutation();
  const [error, setError] = useState<string | null>(null);

  async function onApprove() {
    setError(null);
    try {
      const result = await approve({ id: request._id }).unwrap();
      onApproved({ request: result.request, temp_password: result.temp_password });
    } catch (e: unknown) {
      const msg = (e as { data?: { message?: string } } | undefined)?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Approve failed');
    }
  }

  async function onReject() {
    if (!confirm('Reject this purchase request?')) return;
    setError(null);
    try {
      await reject({ id: request._id }).unwrap();
      onRejected();
    } catch (e: unknown) {
      const msg = (e as { data?: { message?: string } } | undefined)?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Reject failed');
    }
  }

  const isPending = request.status === 'pending';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-gray-600">{request.franchise_code}</span>
            <span className="text-sm font-semibold text-gray-900">{request.franchise_display_name}</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs uppercase text-gray-600">
              {request.franchise_level}
            </span>
            <StatusPill status={request.status} />
          </div>
          <div className="text-xs text-gray-500">
            Submitted {formatDate(request.created_at)}
          </div>
        </div>
        {isPending && isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={onApprove}
              disabled={approving}
              className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              <Check className="h-3 w-3" /> {approving ? 'Approving…' : 'Approve'}
            </button>
            <button
              onClick={onReject}
              disabled={rejecting}
              className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              <X className="h-3 w-3" /> {rejecting ? 'Rejecting…' : 'Reject'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div>
          <div className="text-xs uppercase text-gray-400">Buyer</div>
          <div className="font-medium text-gray-800">{request.full_name}</div>
          <div className="text-gray-600">{request.email}</div>
          {request.phone && <div className="text-gray-500">{request.phone}</div>}
        </div>
        <div className="sm:col-span-2">
          <div className="text-xs uppercase text-gray-400">Message</div>
          <div className="whitespace-pre-wrap text-gray-700">
            {request.message?.trim() || <span className="text-gray-400">— no message —</span>}
          </div>
        </div>
      </div>

      {request.status !== 'pending' && (
        <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
          Reviewed {formatDate(request.reviewed_at)} by staff {request.reviewed_by ?? 'unknown'}
          {request.review_note && (
            <> · note: <span className="text-gray-700">{request.review_note}</span></>
          )}
        </div>
      )}

      {request.status === 'approved' && (
        <TempPasswordRow request={request} />
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ── Persistent temp-password row on approved request cards ───────────────────
//
// The temp_password stays on the request row until the buyer rotates it. The
// approval dialog shows it once, but we also surface it here so the admin can
// re-copy it (e.g. the buyer says "I lost the password, please resend"). After
// the buyer rotates, temp_password is wiped and we render a tidy "rotated"
// pill instead.

function TempPasswordRow({ request }: { request: PurchaseRequest }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!request.temp_password) {
    return (
      <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800">
        <KeyRound className="h-3.5 w-3.5" />
        Buyer has rotated their password
      </div>
    );
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(request.temp_password ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* insecure-context clipboards: ignore */
    }
  }

  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      <div className="mb-1.5 flex items-center gap-1.5 font-medium">
        <KeyRound className="h-3.5 w-3.5" />
        Temp password (forward to buyer)
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded border border-amber-200 bg-white px-2 py-1 font-mono text-sm tracking-wider text-gray-900">
          {revealed ? request.temp_password : '••••••••••••'}
        </code>
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="rounded border border-amber-200 bg-white p-1.5 text-amber-800 hover:bg-amber-100"
          title={revealed ? 'Hide' : 'Reveal'}
        >
          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={copy}
          className="rounded border border-amber-200 bg-white p-1.5 text-amber-800 hover:bg-amber-100"
          title="Copy"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        {copied && <span className="text-[11px] text-amber-700">Copied!</span>}
      </div>
      <p className="mt-2 text-[11px] text-amber-700">
        Stored in plaintext until the buyer signs in and changes their password.
      </p>
    </div>
  );
}

// ── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: PurchaseRequestStatus }) {
  const map: Record<PurchaseRequestStatus, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs ${map[status]}`}>{status}</span>;
}

// ── Post-approval dialog: shows the temp password ONCE ──────────────────────

function ApprovedDialog({
  request,
  tempPassword,
  onClose,
}: {
  request: PurchaseRequest;
  tempPassword: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard API can fail on insecure context — ignore */
    }
  }

  return (
    // z-[2000] sits above react-leaflet's controls (z-1000). Without this the
    // map underneath the modal would leak through the backdrop.
    <div className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
      <div className="my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">approved</span>
          <h2 className="text-base font-semibold text-gray-900">Temp password generated</h2>
        </div>

        <p className="mb-3 text-sm text-gray-600">
          Forward this temp password to <strong>{request.email}</strong> manually (WhatsApp / email /
          phone). They&apos;ll use it to sign in at the franchises portal and will be forced to rotate
          it on first login.
        </p>

        <div className="space-y-2">
          <Field label="Buyer email" value={request.email} onCopy={() => copyToClipboard(request.email)} />
          <Field
            label="Temp password"
            value={tempPassword}
            mono
            onCopy={() => copyToClipboard(tempPassword)}
          />
          <Field label="Franchise" value={`${request.franchise_code} · ${request.franchise_display_name}`} mono />
        </div>

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          ⚠️ The temp password is shown here so you can copy it now. It&apos;s stored on the request
          row until the buyer rotates their password — but treat this dialog as your one chance to grab it cleanly.
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <span className="text-xs text-gray-500">{copied ? 'Copied to clipboard!' : ''}</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
        <code className={cn('truncate text-sm text-gray-900', mono && 'font-mono')}>{value}</code>
        {onCopy && (
          <button
            onClick={onCopy}
            className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-800"
            title="Copy"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
