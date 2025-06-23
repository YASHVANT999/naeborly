import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getToken, removeToken, isTokenExpired } from "./auth";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  } = {}
): Promise<any> {
  const { method = "GET", body, headers = {} } = options;
  const token = getToken();
  
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  // Add authorization header if token exists and is valid
  if (token && !isTokenExpired(token)) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }
  
  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body,
  });

  if (res.status === 401 || res.status === 403) {
    // Token is invalid or expired, remove it
    removeToken();
    // Redirect to login
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
    throw new Error(`${res.status}: ${res.statusText}`);
  }

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = getToken();
    const headers: Record<string, string> = {};
    
    if (token && !isTokenExpired(token)) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const res = await fetch(queryKey[0] as string, { headers });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      removeToken();
      return null;
    }

    if (res.status === 401 || res.status === 403) {
      // Token is invalid or expired, remove it
      removeToken();
      // For unauthorized access, redirect to home page
      window.location.href = '/';
      throw new Error(`${res.status}: Unauthorized`);
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
