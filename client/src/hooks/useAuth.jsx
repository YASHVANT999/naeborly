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

  const logout = () => {
    try {
      // Remove JWT token from localStorage
      removeToken();
      
      // Clear all cached data
      queryClient.clear();
      
      // Force a page reload to reset application state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force cleanup even if there's an error
      removeToken();
      queryClient.clear();
      window.location.href = '/';
    }
  };

  const isAuthenticated = !!user && !error;
  const isLoading401 = error?.message?.includes('401');

  return {
    user,
    isLoading: isLoading && !isLoading401,
    isAuthenticated,
    logout,
    isLoggingOut: false,
  };
}