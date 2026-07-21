import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      // One retry with backoff: library reads fail transiently (iCloud
      // offline, a library mid-migration). Without any retry a single blip
      // stranded the user on an error screen until they acted. Kept at 1 so a
      // genuine failure still surfaces quickly rather than hanging.
      retry: 1,
      retryDelay: 500,
      refetchOnWindowFocus: false,
    },
  },
});
