import { useRef, useCallback } from 'react';

// Global cache for API requests
const apiCache = new Map<string, { data: any, timestamp: number }>();
const pendingRequests = new Map<string, Promise<any>>();

interface UseApiCacheOptions {
  cacheDuration?: number; // in milliseconds
  enableDeduplication?: boolean;
}

export const useApiCache = (options: UseApiCacheOptions = {}) => {
  const { cacheDuration = 5 * 60 * 1000, enableDeduplication = true } = options;
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchWithCache = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<any> => {
    const cacheKey = `${url}:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      return cached.data;
    }

    // Check for pending request (deduplication)
    if (enableDeduplication && pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    const requestPromise = (async () => {
      try {
        const response = await fetch(url, {
          ...options,
          signal: abortControllerRef.current?.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Cache the results
        apiCache.set(cacheKey, { data, timestamp: Date.now() });
        
        return data;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was cancelled, ignore
          throw error;
        }
        throw error;
      } finally {
        // Remove from pending requests
        pendingRequests.delete(cacheKey);
      }
    })();

    // Store pending request for deduplication
    if (enableDeduplication) {
      pendingRequests.set(cacheKey, requestPromise);
    }

    return requestPromise;
  }, [cacheDuration, enableDeduplication]);

  const clearCache = useCallback((pattern?: string) => {
    if (pattern) {
      // Clear cache entries matching pattern
      const keysToDelete: string[] = [];
      apiCache.forEach((_, key) => {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => apiCache.delete(key));
    } else {
      // Clear all cache
      apiCache.clear();
    }
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    fetchWithCache,
    clearCache,
    abort
  };
};
