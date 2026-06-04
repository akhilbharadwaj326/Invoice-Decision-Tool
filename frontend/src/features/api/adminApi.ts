import { apiSlice } from './apiSlice';

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      query: () => '/api/reports/stats',
      providesTags: ['Invoice'],
    }),
    getUsers: builder.query({
      query: () => '/api/admin/users',
      providesTags: ['User'],
    }),
    createUser: builder.mutation({
      query: (body) => ({
        url: '/api/admin/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/admin/users/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    getRules: builder.query({
      query: () => '/api/admin/rules',
      providesTags: ['Rule'],
    }),
    createRule: builder.mutation({
      query: (body) => ({
        url: '/api/admin/rules',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Rule'],
    }),
    updateRule: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/admin/rules/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Rule'],
    }),
    exportCsv: builder.query({
      query: () => ({ url: '/api/reports/export', responseHandler: 'text' }),
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetRulesQuery,
  useCreateRuleMutation,
  useUpdateRuleMutation,
  useLazyExportCsvQuery,
} = adminApi;
