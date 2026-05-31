// ─── ehb-backoffice frontend types ────────────────────────────────────────────

export type StaffRole = 'admin' | 'viewer';

export interface StaffUser {
  id: string;
  email: string;
  full_name: string;
  role: StaffRole;
  is_active: boolean;
}

export type FranchiseLevel = 'sub' | 'corporate' | 'master';
export type FranchiseStatus = 'Auto-Created' | 'Available' | 'Assigned' | 'Active';

/** GeoJSON Point — coordinates = [lng, lat]. */
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface FranchiseSummary {
  _id: string;
  level: FranchiseLevel;
  parent_id: string | null;
  /** Immutable identity, e.g. "SUB-LHR-001". */
  code: string;
  /** Mutable display label; owner/admin editable. */
  display_name: string;
  /** @deprecated alias of display_name kept for one release. */
  name: string;
  region: string;
  region_label?: string;
  center: GeoPoint;
  radius_km: number;
  store_count: number;
  child_count: number;
  status: FranchiseStatus;
  owner_id: string | null;
  display_name_updated_at?: string | null;
  created_at: string;
}

export interface EhbUserSummary {
  ehb_user_id: string;
  email: string;
  full_name: string;
}
