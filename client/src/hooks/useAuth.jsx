import { useQuery, useQueryClient } from "@tanstack/react-query";
import { removeToken, getToken } from "@/lib/auth";
import { useState, useEffect } from "react";

export function useAuth() {
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/current-user'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!getToken(), // Only fetch if token exists
  });

  const logout = async () => {
    setIsLoggingOut(true);
    console.log('Logout initiated');
    
    try {
      // Remove JWT token from localStorage
      removeToken();
      
      // Clear all cached data
      queryClient.clear();
      
      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Force immediate redirect to home page
      window.location.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Force cleanup even on error
      removeToken();
      localStorage.clear();
      window.location.replace('/');
    }
  };

  const isAuthenticated = !!user && !error;
  const isLoading401 = error?.message?.includes('401');

  return {
    user,
    isLoading: isLoading && !isLoading401,
    isAuthenticated,
    logout,
    isLoggingOut,
  };
}