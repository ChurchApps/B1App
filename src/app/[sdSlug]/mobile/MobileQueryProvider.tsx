"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";

const idbStorage = {
  getItem: async (key: string) => {
    const value = await idbGet(key);
    return value ?? null;
  },
  setItem: async (key: string, value: string) => {
    await idbSet(key, value);
  },
  removeItem: async (key: string) => {
    await idbDel(key);
  },
};

function buildQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        networkMode: "offlineFirst",
        staleTime: 0,
        gcTime: 24 * 60 * 60 * 1000,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 1,
      },
      mutations: {
        networkMode: "offlineFirst",
      },
    },
  });
}

export function MobileQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => buildQueryClient());

  useEffect(() => {
    const persister = createSyncStoragePersister({
      storage: idbStorage as unknown as Storage,
      key: "b1-mobile-query-cache",
      throttleTime: 1000,
    });
    const [unsubscribe] = persistQueryClient({
      queryClient,
      persister,
      maxAge: 24 * 60 * 60 * 1000,
      buster: "v1",
    });
    return () => {
      unsubscribe?.();
    };
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
