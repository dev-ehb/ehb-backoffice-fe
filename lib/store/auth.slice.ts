import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { StaffUser } from '@/types/backoffice.types';

interface AuthState {
  staff: StaffUser | null;
  access_token: string | null;
}

const initialState: AuthState = {
  staff: null,
  access_token:
    typeof window !== 'undefined' ? sessionStorage.getItem('backoffice_token') : null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ staff: StaffUser; access_token: string }>) {
      state.staff = action.payload.staff;
      state.access_token = action.payload.access_token;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('backoffice_token', action.payload.access_token);
      }
    },
    clearCredentials(state) {
      state.staff = null;
      state.access_token = null;
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('backoffice_token');
      }
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
