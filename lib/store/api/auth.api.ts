import { baseApi } from './base-api';
import type { StaffUser } from '@/types/backoffice.types';

interface LoginResponse {
  access_token: string;
  staff: StaffUser;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    getMe: build.query<StaffUser, void>({
      query: () => '/auth/me',
    }),
    logout: build.mutation<{ success: true }, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
  }),
  overrideExisting: false,
});

export const { useLoginMutation, useGetMeQuery, useLogoutMutation } = authApi;
