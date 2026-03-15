"use client";

import { useState, useCallback } from "react";
import { ApiResponse } from "@/lib/utils";

interface FetchState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Generic hook for making API calls with loading/error state.
 * All API routes return the standard { success, data, error, meta } envelope.
 */
export function useApi<T>() {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    error: null,
    loading: false,
  });

  const execute = useCallback(
    async (
      url: string,
      options?: RequestInit
    ): Promise<ApiResponse<T> | null> => {
      setState({ data: null, error: null, loading: true });
      try {
        const res = await fetch(url, {
          headers: { "Content-Type": "application/json", ...options?.headers },
          ...options,
        });
        const json: ApiResponse<T> = await res.json();
        if (!json.success) {
          setState({ data: null, error: json.error, loading: false });
          return json;
        }
        setState({ data: json.data, error: null, loading: false });
        return json;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setState({ data: null, error: message, loading: false });
        return null;
      }
    },
    []
  );

  return { ...state, execute };
}

/**
 * Hook for debounced search input.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useState(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  });

  return debouncedValue;
}
