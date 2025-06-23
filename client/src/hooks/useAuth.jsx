import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { removeToken } from "@/lib/auth";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/current-user'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Remove JWT token from localStorage
      removeToken();
      
      // Optional: Call logout endpoint (though it's not required for JWT)
      return await apiRequest('/api/logout', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      // Clear all queries and redirect to home
      queryClient.clear();
      window.location.href = '/';
    },
    onError: () => {
      // Even if logout API fails, still clear token and redirect
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