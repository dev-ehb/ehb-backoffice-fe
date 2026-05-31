import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_BACKOFFICE_API_URL ?? 'http://localhost:3011',
    prepareHeaders: (headers, { getState }) => {
      const token =
        (getState() as RootState).auth.access_token ??
        (typeof window !== 'undefined' ? sessionStorage.getItem('backoffice_token') : null);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Franchise'],
  endpoints: () => ({}),
});
