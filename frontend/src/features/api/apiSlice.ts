import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    prepareHeaders: (headers) => {
      // Add authentication token later
      return headers;
    },
  }),
  tagTypes: ['Invoice', 'User', 'Rule'],
  endpoints: () => ({}),
});
