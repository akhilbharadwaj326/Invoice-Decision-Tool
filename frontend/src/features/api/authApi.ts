import { apiSlice } from './apiSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    signup: builder.mutation({
      query: (userData) => ({
        url: '/auth/signup',
        method: 'POST',
        body: userData,
      }),
    }),
    updateProfile: builder.mutation({
      query: (userData) => ({
        url: '/auth/profile',
        method: 'PATCH',
        body: userData,
      }),
    }),
  }),
});

export const { useLoginMutation, useSignupMutation, useUpdateProfileMutation } = authApi;
