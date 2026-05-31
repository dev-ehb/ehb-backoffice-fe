import { baseApi } from './base-api';
import type { FranchiseSummary, EhbUserSummary } from '@/types/backoffice.types';

/** Assignment-history row as returned by ehb-franchises /franchises/:id/history. */
export interface AssignmentHistoryRow {
  _id: string;
  franchise_id: string;
  action: 'assign' | 'reassign' | 'revoke';
  previous_owner_id: string | null;
  new_owner_id: string | null;
  performed_by: string;
  note: string;
  created_at: string;
}

// Re-export so consumers can import FranchiseSummary alongside the hooks.
export type { FranchiseSummary } from '@/types/backoffice.types';

/**
 * Franchise management endpoints. The backoffice backend proxies these to
 * ehb-franchises via its franchises-client module.
 */
export const franchisesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listFranchises: build.query<
      FranchiseSummary[],
      { level?: string; status?: string; region?: string }
    >({
      query: (params) => ({ url: '/franchises', params }),
      providesTags: ['Franchise'],
    }),
    getFranchise: build.query<FranchiseSummary, string>({
      query: (id) => `/franchises/${id}`,
      providesTags: ['Franchise'],
    }),
    getHistory: build.query<AssignmentHistoryRow[], string>({
      query: (id) => `/franchises/${id}/history`,
      providesTags: ['Franchise'],
    }),
    searchUsers: build.query<EhbUserSummary[], string>({
      query: (q) => ({ url: '/franchises/users/search', params: { q } }),
    }),
    assignFranchise: build.mutation<
      { success: boolean; franchise_id: string; status: string },
      { id: string; new_owner_id: string; note?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/franchises/${id}/assign`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Franchise'],
    }),
    revokeFranchise: build.mutation<
      { success: boolean; franchise_id: string; status: string },
      { id: string; note?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/franchises/${id}/revoke`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Franchise'],
    }),
    renameFranchise: build.mutation<
      FranchiseSummary,
      { id: string; display_name: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/franchises/${id}/display-name`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Franchise'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListFranchisesQuery,
  useGetFranchiseQuery,
  useGetHistoryQuery,
  useSearchUsersQuery,
  useLazySearchUsersQuery,
  useAssignFranchiseMutation,
  useRevokeFranchiseMutation,
  useRenameFranchiseMutation,
} = franchisesApi;
