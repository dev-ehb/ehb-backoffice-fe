import { baseApi } from './base-api';

export type PurchaseRequestStatus = 'pending' | 'approved' | 'rejected';
export type FranchiseLevel = 'sub' | 'corporate' | 'master';

export interface PurchaseRequest {
  _id: string;
  franchise_id: string;
  franchise_code: string;
  franchise_display_name: string;
  franchise_level: FranchiseLevel;
  full_name: string;
  email: string;
  phone: string | null;
  message: string;
  status: PurchaseRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string;
  temp_password: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApproveResponse {
  request: PurchaseRequest;
  temp_password: string;
}

export const purchaseRequestsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listPurchaseRequests: build.query<PurchaseRequest[], { status?: PurchaseRequestStatus }>({
      query: ({ status } = {}) => ({
        url: '/purchase-requests',
        params: status ? { status } : undefined,
      }),
      providesTags: ['Franchise'],
    }),
    getPurchaseRequest: build.query<PurchaseRequest, string>({
      query: (id) => `/purchase-requests/${id}`,
      providesTags: ['Franchise'],
    }),
    approvePurchaseRequest: build.mutation<ApproveResponse, { id: string; note?: string }>({
      query: ({ id, ...body }) => ({
        url: `/purchase-requests/${id}/approve`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Franchise'],
    }),
    rejectPurchaseRequest: build.mutation<PurchaseRequest, { id: string; note?: string }>({
      query: ({ id, ...body }) => ({
        url: `/purchase-requests/${id}/reject`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Franchise'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListPurchaseRequestsQuery,
  useGetPurchaseRequestQuery,
  useApprovePurchaseRequestMutation,
  useRejectPurchaseRequestMutation,
} = purchaseRequestsApi;
