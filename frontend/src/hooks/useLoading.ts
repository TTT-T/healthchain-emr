"use client";
import { useState, useCallback, useRef, useEffect } from 'react';

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  data: any;
}

interface UseLoadingOptions {
  initialData?: any;
  onError?: (error: any) => void;
  onSuccess?: (data: any) => void;
}

export const useLoading = (options: UseLoadingOptions = {}) => {
  const { initialData = null, onError, onSuccess } = options;
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    data: initialData
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const setData = useCallback((data: any) => {
    setState(prev => ({ ...prev, data, error: null, isLoading: false }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: initialData
    });
  }, [initialData]);

  const execute = useCallback(async <T>(
    asyncFunction: (signal?: AbortSignal) => Promise<T>,
    options: { 
      resetError?: boolean;
      resetData?: boolean;
      abortPrevious?: boolean;
    } = {}
  ): Promise<T | null> => {
    const { resetError = true, resetData = false, abortPrevious = true } = options;

    // Abort previous request if needed
    if (abortPrevious && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setLoading(true);
      
      if (resetError) {
        setError(null);
      }
      
      if (resetData) {
        setData(initialData);
      }

      const result = await asyncFunction(abortController.signal);
      
      if (!abortController.signal.aborted) {
        setData(result);
        onSuccess?.(result);
        return result;
      }
      
      return null;
    } catch (error: any) {
      if (!abortController.signal.aborted) {
        const errorMessage = error?.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
        setError(errorMessage);
        onError?.(error);
      }
      return null;
    }
  }, [setLoading, setError, setData, initialData, onError, onSuccess]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    setLoading,
    setError,
    setData,
    reset,
    execute
  };
};

// Hook for managing multiple loading states
export const useMultipleLoading = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  const resetAll = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    resetAll,
    loadingStates
  };
};

// Hook for debounced loading
export const useDebouncedLoading = (delay: number = 300) => {
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setLoading = useCallback((loading: boolean) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (loading) {
      setIsLoading(true);
    } else {
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, delay);
    }
  }, [delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { isLoading, setLoading };
};

// Hook for retry mechanism with loading
export const useRetryableLoading = (maxRetries: number = 3) => {
  const [retryCount, setRetryCount] = useState(0);
  const { isLoading, error, data, execute, reset } = useLoading();

  const executeWithRetry = useCallback(async <T>(
    asyncFunction: () => Promise<T>,
    options: { 
      resetError?: boolean;
      resetData?: boolean;
    } = {}
  ): Promise<T | null> => {
    const result = await execute(asyncFunction, options);
    
    if (result === null && retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return executeWithRetry(asyncFunction, options);
    }
    
    return result;
  }, [execute, retryCount, maxRetries]);

  const resetWithRetry = useCallback(() => {
    setRetryCount(0);
    reset();
  }, [reset]);

  return {
    isLoading,
    error,
    data,
    retryCount,
    canRetry: retryCount < maxRetries,
    executeWithRetry,
    reset: resetWithRetry
  };
};
