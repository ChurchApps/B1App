"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  persistQueryClient,
  type Persister,
  type PersistedClient
} from "@tanstack/react-query-persist-client";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";

const CACHE_KEY = "b1-mobile-query-cache";

// Async IDB persister. The built-in createSyncStoragePersister is synchronous
// and would read IDB Promises into JSON.parse verbatim (silently discarding
// the cache on every load). persistQueryClient supports async persisters via
// Promise return types on all three methods.
function createIdbPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      await idbSet(CACHE_KEY, client);
    },
    restoreClient: async () => {
      const cached = await idbGet<PersistedClient>(CACHE_KEY);
      return cached ?? undefined;
    },
    removeClient: async () => {
      await idbDel(CACHE_KEY);
    }
  };
}

function buildQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        networkMode: "offlineFirst",
        // 60s keeps cached data fresh across normal tab-to-tab navigation
        // without suppressing updates that matter. Screens that need tighter
        // freshness still set their own staleTime.
        staleTime: 60 * 1000,
        gcTime: 24 * 60 * 60 * 1000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 1
      },
      mutations: { networkMode: "offlineFirst" }
    }
  });
}

export function MobileQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => buildQueryClient());

  useEffect(() => {
    const persister = createIdbPersister();
    const [unsubscribe] = persistQueryClient({
      queryClient,
      persister,
      maxAge: 24 * 60 * 60 * 1000,
      buster: "v1"
    });
    return () => {
      unsubscribe?.();
    };
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
