import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request, type ApiError } from '@/graphql/client'
import {
  CATEGORIES,
  CATEGORY_STATS,
  CREATE_CATEGORY,
  DELETE_CATEGORY,
  UPDATE_CATEGORY,
} from '@/graphql/operations'
import type { Category, CategoryInput, CategoryStats } from '@/graphql/types'

export const categoryKeys = {
  all: ['categories'] as const,
  stats: ['category-stats'] as const,
}

export function useCategories(enabled = true) {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: async () => (await request<{ categories: Category[] }>(CATEGORIES)).categories,
    enabled,
  })
}

export function useCategoryStats(enabled = true) {
  return useQuery({
    queryKey: categoryKeys.stats,
    queryFn: async () => (await request<{ categoryStats: CategoryStats }>(CATEGORY_STATS)).categoryStats,
    enabled,
  })
}

/**
 * Mexer em categoria repercute em várias telas (lista, estatísticas, tags das
 * transações), então invalidamos tudo em vez de tentar remendar o cache.
 */
function useCategoryInvalidation() {
  const queryClient = useQueryClient()

  return () => {
    void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    void queryClient.invalidateQueries({ queryKey: categoryKeys.stats })
    void queryClient.invalidateQueries({ queryKey: ['transactions'] })
  }
}

// O TError explícito faz o `onError` das telas receber ApiError (com `code` e
// `fieldErrors`) em vez do Error genérico do React Query.
export function useCreateCategory() {
  const invalidate = useCategoryInvalidation()

  return useMutation<Category, ApiError, CategoryInput>({
    mutationFn: async (input) =>
      (await request<{ createCategory: Category }>(CREATE_CATEGORY, { input })).createCategory,
    onSuccess: invalidate,
  })
}

export function useUpdateCategory() {
  const invalidate = useCategoryInvalidation()

  return useMutation<Category, ApiError, { id: string; input: CategoryInput }>({
    mutationFn: async ({ id, input }) =>
      (await request<{ updateCategory: Category }>(UPDATE_CATEGORY, { id, input })).updateCategory,
    onSuccess: invalidate,
  })
}

export function useDeleteCategory() {
  const invalidate = useCategoryInvalidation()

  return useMutation<{ deleteCategory: boolean }, ApiError, string>({
    mutationFn: async (id) => request<{ deleteCategory: boolean }>(DELETE_CATEGORY, { id }),
    onSuccess: invalidate,
  })
}
