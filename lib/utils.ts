import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { FranchiseLevel, FranchiseStatus } from '@/types/backoffice.types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function getLevelLabel(level: FranchiseLevel | string): string {
  const map: Record<string, string> = {
    sub: 'Sub Franchise',
    corporate: 'Corporate Franchise',
    master: 'Master Franchise',
  };
  return map[level] ?? level;
}

export function getStatusColor(status: FranchiseStatus | string): string {
  const map: Record<string, string> = {
    'Auto-Created': 'bg-gray-100 text-gray-700',
    Available: 'bg-blue-100 text-blue-700',
    Assigned: 'bg-amber-100 text-amber-700',
    Active: 'bg-green-100 text-green-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}
