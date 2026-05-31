import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth.slice';
import { baseApi } from './api/base-api';
import './api/auth.api';
import './api/franchises.api';
import './api/purchase-requests.api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
