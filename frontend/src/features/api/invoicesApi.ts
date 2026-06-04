import { apiSlice } from './apiSlice';

export const invoicesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query({
      query: ({ search, status, page, page_size }: any = {}) => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (status) params.set('status', status);
        if (page) params.set('page', String(page));
        if (page_size) params.set('page_size', String(page_size));
        const qs = params.toString();
        return `/api/invoices${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Invoice'],
    }),
    getInvoiceDetail: builder.query({
      query: (id) => `/api/invoices/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Invoice', id }],
    }),
    uploadInvoice: builder.mutation({
      query: (formData) => ({
        url: '/api/invoices/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Invoice'],
    }),
    getComments: builder.query({
      query: (id) => `/api/invoices/${id}/comments`,
      providesTags: (_result, _error, id) => [{ type: 'Invoice', id }, 'Invoice'],
    }),
    addComment: builder.mutation({
      query: ({ id, comment, is_internal }) => ({
        url: `/api/invoices/${id}/comments`,
        method: 'POST',
        body: { comment, is_internal },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Invoice', id }],
    }),
    makeDecision: builder.mutation({
      query: ({ id, decision, reason, override_reason }) => ({
        url: `/api/invoices/${id}/decisions`,
        method: 'POST',
        body: { decision, reason, override_reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Invoice', id }, 'Invoice'],
    }),
    correctFields: builder.mutation({
      query: ({ id, fields }) => ({
        url: `/api/invoices/${id}/fields`,
        method: 'PATCH',
        body: { fields },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Invoice', id }],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetInvoiceDetailQuery,
  useUploadInvoiceMutation,
  useGetCommentsQuery,
  useAddCommentMutation,
  useMakeDecisionMutation,
  useCorrectFieldsMutation,
} = invoicesApi;
