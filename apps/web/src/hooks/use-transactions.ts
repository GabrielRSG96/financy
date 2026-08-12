import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request, type ApiError } from '@/graphql/client'
import {
  CREATE_TRANSACTION,
  DELETE_TRANSACTION,
  SUMMARY,
  TRANSACTIONS,
  UPDATE_TRANSACTION,
} from '@/graphql/operations'
import type { Summary, Transaction, TransactionFilter, TransactionInput, TransactionPage } from '@/graphql/types'

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (filter: TransactionFilter, page: number, pageSize: number) =>
    ['transactions', { filter, page, pageSize }] as const,
  summary: (month?: number, year?: number) => ['summary', { month, year }] as const,
}

export function useTransactions(
  filter: TransactionFilter = {},
  page = 1,
  pageSize = 10,
  enabled = true,
) {
  return useQuery({
    queryKey: transactionKeys.list(filter, page, pageSize),
    queryFn: async () =>
      (await request<{ transactions: TransactionPage }>(TRANSACTIONS, { filter, page, pageSize }))
        .transactions,
    enabled,
    placeholderData: (previous) => previous,
  })
}

export function useSummary(month?: number, year?: number, enabled = true) {
  return useQuery({
    queryKey: transactionKeys.summary(month, year),
    queryFn: async () => (await request<{ summary: Summary }>(SUMMARY, { month, year })).summary,
    enabled,
  })
}

function useTransactionInvalidation() {
  const queryClient = useQueryClient()

  return () => {
    void queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    void queryClient.invalidateQueries({ queryKey: ['summary'] })
    void queryClient.invalidateQueries({ queryKey: ['categories'] })
    void queryClient.invalidateQueries({ queryKey: ['category-stats'] })
  }
}

export function useCreateTransaction() {
  const invalidate = useTransactionInvalidation()

  return useMutation<Transaction, ApiError, TransactionInput>({
    mutationFn: async (input) =>
      (await request<{ createTransaction: Transaction }>(CREATE_TRANSACTION, { input }))
        .createTransaction,
    onSuccess: invalidate,
  })
}

export function useUpdateTransaction() {
  const invalidate = useTransactionInvalidation()

  return useMutation<Transaction, ApiError, { id: string; input: TransactionInput }>({
    mutationFn: async ({ id, input }) =>
      (await request<{ updateTransaction: Transaction }>(UPDATE_TRANSACTION, { id, input }))
        .updateTransaction,
    onSuccess: invalidate,
  })
}

export function useDeleteTransaction() {
  const invalidate = useTransactionInvalidation()

  return useMutation<{ deleteTransaction: boolean }, ApiError, string>({
    mutationFn: async (id) => request<{ deleteTransaction: boolean }>(DELETE_TRANSACTION, { id }),
    onSuccess: invalidate,
  })
}
