import { useQuery, useQueryClient } from "@tanstack/react-query";
import { removeToken, getToken, isTokenExpired } from "@/lib/auth";
import { useState, useEffect } from "react";

export function useAuth() {
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Check token on every render to ensure fresh state
  const token = getToken();
  const isTokenValid = token && !isTokenExpired(token);
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/current-user'],
    retry: false,
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!isTokenValid, // Only fetch if token exists and is valid
  });
  
  // Remove expired tokens immediately
  useEffect(() => {
    if (token && isTokenExpired(token)) {
      removeToken();
      queryClient.clear();
    }
  }, [token, queryClient]);
  
  console.log('Auth state:', { 
    hasToken: !!token, 
    tokenValid: isTokenValid,
    hasUser: !!user, 
    hasError: !!error,
    errorMsg: error?.message 
  });

  const logout = () => {
    console.log('Logout function called');
    setIsLoggingOut(true);
    
    try {
      // Remove JWT token from localStorage
      removeToken();
      
      // Clear all cached data
      queryClient.clear();
      
      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('Logout complete, redirecting...');
      
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

  const isAuthenticated = !!user && !error && !!isTokenValid;
  const isLoading401 = error?.message?.includes('401');

  const authResult = {
    user,
    isLoading: isLoading && !isLoading401,
    isAuthenticated,
    logout: logout,
    isLoggingOut,
  };
  
  console.log('useAuth returning:', { 
    hasUser: !!user, 
    isAuthenticated, 
    hasToken: !!token,
    tokenValid: isTokenValid
  });
  return authResult;
}