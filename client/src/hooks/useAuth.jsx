import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/current-user'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/logout', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      // Clear all queries and redirect to home
      queryClient.clear();
      window.location.href = '/';
    },
  });

  const isAuthenticated = !!user && !error;
  const isLoading401 = error?.message?.includes('401');

  return {
    user,
    isLoading: isLoading && !isLoading401,
    isAuthenticated,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}