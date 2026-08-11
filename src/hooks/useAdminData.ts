import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";

import { apiClient } from "@/api/client";
import { qk } from "@/lib/queryClient";
import type {
  Booking,
  BookingPayload,
  DashboardOverview,
  Inquiry,
  InquiryPayload,
  Order,
  OrderPayload,
  Property,
  PropertyPayload,
  SeoMeta,
  User,
  UserPayload,
} from "@/api/types";

/* --------------------------------------------------------------------------
   Shared mutation plumbing.

   Every write invalidates both its own list and the dashboard overview, because
   the overview aggregates all of them — otherwise editing an order would leave
   stale KPI cards behind until the next refetch interval.
   -------------------------------------------------------------------------- */

function useInvalidator() {
  const queryClient = useQueryClient();
  return (...keys: QueryKey[]) => {
    const targets: QueryKey[] = [...keys, ["admin", "overview"]];
    targets.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  };
}

function stripUndefined<T extends object>(payload: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

/* ------------------------------------------------------------------ overview */

export function useDashboardOverview(months = 12) {
  return useQuery({
    queryKey: qk.overview(months),
    queryFn: async () =>
      (await apiClient.get<DashboardOverview>("/admin/overview", { params: { months } })).data,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

/* -------------------------------------------------------------------- orders */

export interface OrderFilters {
  q?: string;
  status?: string;
  event_week?: string;
}

export function useOrders(filters: OrderFilters = {}) {
  const params = stripUndefined({
    q: filters.q || undefined,
    status: filters.status || undefined,
    event_week: filters.event_week || undefined,
  });

  return useQuery({
    queryKey: qk.orders(params),
    queryFn: async () => (await apiClient.get<Order[]>("/orders", { params })).data,
  });
}

export function useCreateOrder() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async (payload: OrderPayload) =>
      (await apiClient.post<Order>("/orders", payload)).data,
    onSuccess: () => invalidate(["admin", "orders"]),
  });
}

export function useUpdateOrder() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<OrderPayload> }) =>
      (await apiClient.patch<Order>(`/orders/${id}`, payload)).data,
    onSuccess: () => invalidate(["admin", "orders"]),
  });
}

export function useRefundOrder() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async ({ id, amount_cents }: { id: string; amount_cents: number }) =>
      (await apiClient.post<Order>(`/orders/${id}/refund`, { amount_cents })).data,
    onSuccess: () => invalidate(["admin", "orders"]),
  });
}

export function useDeleteOrder() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async (id: string) => (await apiClient.delete(`/orders/${id}`)).data,
    onSuccess: () => invalidate(["admin", "orders"]),
  });
}

/* ------------------------------------------------------------------ bookings */

export interface BookingFilters {
  property_id?: string;
  source?: string;
  status?: string;
}

export function useBookings(filters: BookingFilters = {}) {
  const params = stripUndefined({
    property_id: filters.property_id || undefined,
    source: filters.source || undefined,
    status: filters.status || undefined,
  });

  return useQuery({
    queryKey: qk.bookings(params),
    queryFn: async () => (await apiClient.get<Booking[]>("/bookings", { params })).data,
  });
}

export function useCreateBooking() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async (payload: BookingPayload) =>
      (await apiClient.post<Booking>("/bookings", payload)).data,
    onSuccess: () => invalidate(["admin", "bookings"]),
  });
}

export function useUpdateBooking() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<BookingPayload> }) =>
      (await apiClient.patch<Booking>(`/bookings/${id}`, payload)).data,
    onSuccess: () => invalidate(["admin", "bookings"]),
  });
}

export function useDeleteBooking() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async (id: string) => (await apiClient.delete(`/bookings/${id}`)).data,
    onSuccess: () => invalidate(["admin", "bookings"]),
  });
}

export function useSyncCalendar() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async (propertyId: string) =>
      (await apiClient.post(`/bookings/${propertyId}/sync-calendar`)).data,
    onSuccess: () => invalidate(["admin", "bookings"]),
  });
}

/* ---------------------------------------------------------------- properties */

export interface PropertyFilters {
  q?: string;
  published?: boolean;
}

export function useAdminProperties(filters: PropertyFilters = {}) {
  const params = stripUndefined({
    q: filters.q || undefined,
    published: filters.published,
  });

  return useQuery({
    queryKey: qk.properties(params),
    queryFn: async () =>
      (await apiClient.get<Property[]>("/properties/admin/all", { params })).data,
  });
}

export function useCreateProperty() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async (payload: Partial<PropertyPayload>) =>
      (await apiClient.post<Property>("/properties", payload)).data,
    onSuccess: () => invalidate(["admin", "properties"]),
  });
}

export function useUpdateProperty() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<PropertyPayload> }) =>
      (await apiClient.patch<Property>(`/properties/${id}`, payload)).data,
    onSuccess: () => invalidate(["admin", "properties"]),
  });
}

export function useDeleteProperty() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async ({ id, force }: { id: string; force?: boolean }) =>
      (await apiClient.delete(`/properties/${id}`, { params: { force: force ?? false } })).data,
    onSuccess: () => invalidate(["admin", "properties"]),
  });
}

/* ----------------------------------------------------------------- inquiries */

export interface InquiryFilters {
  q?: string;
  status?: string;
  event_week?: string;
}

export function useInquiries(filters: InquiryFilters = {}) {
  const params = stripUndefined({
    q: filters.q || undefined,
    status: filters.status || undefined,
    event_week: filters.event_week || undefined,
  });

  return useQuery({
    queryKey: qk.inquiries(params),
    queryFn: async () => (await apiClient.get<Inquiry[]>("/inquiries", { params })).data,
  });
}

export function useCreateInquiry() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async (payload: InquiryPayload) =>
      (await apiClient.post<Inquiry>("/inquiries/manual", payload)).data,
    onSuccess: () => invalidate(["admin", "inquiries"]),
  });
}

export function useUpdateInquiry() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<InquiryPayload> }) =>
      (await apiClient.put<Inquiry>(`/inquiries/${id}`, payload)).data,
    onSuccess: () => invalidate(["admin", "inquiries"]),
  });
}

export function useUpdateInquiryStatus() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Inquiry["status"] }) =>
      (await apiClient.patch<Inquiry>(`/inquiries/${id}`, { status })).data,
    onSuccess: () => invalidate(["admin", "inquiries"]),
  });
}

export function useDeleteInquiry() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async (id: string) => (await apiClient.delete(`/inquiries/${id}`)).data,
    onSuccess: () => invalidate(["admin", "inquiries"]),
  });
}

/* ----------------------------------------------------------------------- SEO */

export function useSeoEntries() {
  return useQuery({
    queryKey: qk.seo(),
    queryFn: async () => (await apiClient.get<SeoMeta[]>("/seo")).data,
  });
}

export function useUpsertSeo() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async (payload: SeoMeta) => (await apiClient.put<SeoMeta>("/seo", payload)).data,
    onSuccess: () => invalidate(qk.seo()),
  });
}

export function useDeleteSeo() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async (path: string) => (await apiClient.delete("/seo", { params: { path } })).data,
    onSuccess: () => invalidate(qk.seo()),
  });
}

/* --------------------------------------------------------------------- users */

export function useUsers() {
  return useQuery({
    queryKey: qk.users(),
    queryFn: async () => (await apiClient.get<User[]>("/users")).data,
  });
}

export function useCreateUser() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async (payload: UserPayload) => (await apiClient.post<User>("/users", payload)).data,
    onSuccess: () => invalidate(qk.users()),
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<UserPayload> }) =>
      (await apiClient.patch<User>(`/users/${id}`, payload)).data,
    onSuccess: () => invalidate(qk.users()),
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: async ({ id, new_password }: { id: string; new_password: string }) =>
      (await apiClient.post<User>(`/users/${id}/password`, { new_password })).data,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async (id: string) => (await apiClient.delete(`/users/${id}`)).data,
    onSuccess: () => invalidate(qk.users()),
  });
}