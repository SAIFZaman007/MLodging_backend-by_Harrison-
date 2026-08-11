import { useState } from "react";
import { Pencil, Plus, Receipt, RotateCcw, Search, Trash2 } from "lucide-react";

import {
  useAdminProperties,
  useCreateOrder,
  useDeleteOrder,
  useOrders,
  useRefundOrder,
  useUpdateOrder,
} from "@/hooks/useAdminData";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonRows,
  StatusBadge,
} from "@/components/ui/Feedback";
import { OrderFormModal } from "@/components/forms/OrderFormModal";
import { RefundModal } from "@/components/forms/RefundModal";
import { SelectInput } from "@/components/ui/Field";
import {
  ORDER_STATUSES,
  eventLabel,
  formatDate,
  formatUsd,
  titleCase,
} from "@/lib/format";
import type { Order, OrderPayload } from "@/api/types";

export function Orders() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [refunding, setRefunding] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState<Order | null>(null);

  const { isAdmin } = useAuth();
  const toast = useToast();

  const { data: orders, isLoading, isError, error, refetch } = useOrders({ q: search, status });
  const { data: properties } = useAdminProperties();
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const refundOrder = useRefundOrder();
  const deleteOrder = useDeleteOrder();

  const propertyLookup = new Map((properties ?? []).map((p) => [p.id, p]));

  const handleSubmit = (payload: OrderPayload) => {
    if (editing) {
      updateOrder.mutate(
        { id: editing.id, payload },
        {
          onSuccess: () => {
            toast.success(`${editing.invoice_number} updated`);
            setFormOpen(false);
          },
          onError: (err: Error) => toast.error(err.message),
        },
      );
    } else {
      createOrder.mutate(payload, {
        onSuccess: (order) => {
          toast.success(`Order ${order.invoice_number} created`);
          setFormOpen(false);
        },
        onError: (err: Error) => toast.error(err.message),
      });
    }
  };

  const handleRefund = (amountCents: number) => {
    if (!refunding) return;
    refundOrder.mutate(
      { id: refunding.id, amount_cents: amountCents },
      {
        onSuccess: () => {
          toast.success(`Refund of ${formatUsd(amountCents)} recorded`);
          setRefunding(null);
        },
        onError: (err: Error) => toast.error(err.message),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleting) return;
    deleteOrder.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(`${deleting.invoice_number} deleted`);
        setDeleting(null);
      },
      onError: (err: Error) => {
        toast.error(err.message);
        setDeleting(null);
      },
    });
  };

  const totalCollected = (orders ?? []).reduce(
    (sum, order) => sum + order.amount_cents - order.amount_refunded_cents,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Manage · Orders"
        title="Orders"
        description="Every payment recorded against the portfolio, from the site or entered by hand."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Record order
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice, customer or email…"
            className="input pl-9"
            aria-label="Search orders"
          />
        </div>

        <div className="w-48">
          <SelectInput
            value={status}
            placeholder="All statuses"
            onChange={(e) => setStatus(e.target.value)}
            options={ORDER_STATUSES.map((option) => ({
              value: option,
              label: titleCase(option),
            }))}
          />
        </div>

        {orders && orders.length > 0 && (
          <p className="tnum ml-auto text-sm text-brand-ink/50">
            {orders.length} shown · {formatUsd(totalCollected)} net
          </p>
        )}
      </div>

      <div className="card-flush">
        {isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        ) : isLoading ? (
          <SkeletonRows rows={6} />
        ) : !orders?.length ? (
          <EmptyState
            icon={Receipt}
            title={search || status ? "No matching orders" : "No orders yet"}
            description={
              search || status
                ? "Adjust your search or status filter."
                : "Orders appear here once a payment is recorded. Run the demo seeder to explore with sample data."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-4xl">
              <thead>
                <tr className="border-b border-brand-forest/10">
                  <th className="th">Invoice</th>
                  <th className="th">Customer</th>
                  <th className="th">Property</th>
                  <th className="th">Event</th>
                  <th className="th">Created</th>
                  <th className="th text-right">Amount</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="row">
                    <td className="td font-mono text-xs text-brand-ink/60">
                      {order.invoice_number}
                    </td>
                    <td className="td">
                      <p className="text-brand-ink">{order.customer_name}</p>
                      {order.customer_email && (
                        <p className="text-xs text-brand-ink/40">{order.customer_email}</p>
                      )}
                    </td>
                    <td className="td">
                      {order.property_id
                        ? (propertyLookup.get(order.property_id)?.address ?? "—")
                        : "—"}
                    </td>
                    <td className="td">{eventLabel(order.event_week)}</td>
                    <td className="td whitespace-nowrap">{formatDate(order.created_at)}</td>
                    <td className="td tnum text-right">
                      <span className="font-medium text-brand-ink">
                        {formatUsd(order.amount_cents)}
                      </span>
                      {order.amount_refunded_cents > 0 && (
                        <span className="block text-xs text-orange-700">
                          −{formatUsd(order.amount_refunded_cents)}
                        </span>
                      )}
                    </td>
                    <td className="td">
                      <StatusBadge value={order.status} />
                    </td>
                    <td className="td">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(order);
                            setFormOpen(true);
                          }}
                          title="Edit order"
                          aria-label={`Edit ${order.invoice_number}`}
                          className="rounded-lg p-2 text-brand-ink/50 transition-colors hover:bg-brand-cream hover:text-brand-ink"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setRefunding(order)}
                          disabled={order.amount_refunded_cents >= order.amount_cents}
                          title="Record refund"
                          aria-label={`Refund ${order.invoice_number}`}
                          className="rounded-lg p-2 text-brand-ink/50 transition-colors hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleting(order)}
                            title="Delete order"
                            aria-label={`Delete ${order.invoice_number}`}
                            className="rounded-lg p-2 text-brand-ink/40 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formOpen && (
        <OrderFormModal
          key={editing?.id ?? "new"}
          order={editing}
          properties={properties ?? []}
          saving={createOrder.isPending || updateOrder.isPending}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      {refunding && (
        <RefundModal
          key={refunding.id}
          order={refunding}
          saving={refundOrder.isPending}
          onClose={() => setRefunding(null)}
          onSubmit={handleRefund}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete order"
        message={`Permanently delete ${deleting?.invoice_number}? This removes a financial record and cannot be undone. Marking it cancelled or refunded preserves the audit trail instead.`}
        confirmLabel="Delete order"
        loading={deleteOrder.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}