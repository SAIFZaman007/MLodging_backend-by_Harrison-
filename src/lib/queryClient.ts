import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Operators keep this open on a second monitor all day. 30s keeps numbers
      // fresh without hammering the API on every tab switch.
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Every cache key in the console lives here, so an invalidation can never
 *  silently miss a list because two files spelled the key differently. */
export const qk = {
  overview: (months: number) => ["admin", "overview", months] as const,
  orders: (filters?: unknown) => ["admin", "orders", filters ?? null] as const,
  bookings: (filters?: unknown) => ["admin", "bookings", filters ?? null] as const,
  properties: (filters?: unknown) => ["admin", "properties", filters ?? null] as const,
  inquiries: (filters?: unknown) => ["admin", "inquiries", filters ?? null] as const,
  users: () => ["admin", "users"] as const,
  seo: () => ["admin", "seo"] as const,
} as const;