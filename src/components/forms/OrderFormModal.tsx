import { useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import {
  EVENT_WEEKS,
  ORDER_STATUSES,
  centsToUsdInput,
  eventLabel,
  parseUsdToCents,
  titleCase,
} from "@/lib/format";
import type { EventWeek, Order, OrderPayload, OrderStatus, Property } from "@/api/types";

interface Props {
  order: Order | null;
  properties: Property[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: OrderPayload) => void;
}

interface FormState {
  customer_name: string;
  customer_email: string;
  amount: string;
  status: OrderStatus;
  event_week: string;
  property_id: string;
  payment_provider_ref: string;
}

const EMPTY: FormState = {
  customer_name: "",
  customer_email: "",
  amount: "",
  status: "pending",
  event_week: "",
  property_id: "",
  payment_provider_ref: "",
};

/* Mounted only while open and keyed by record id, so opening the dialog
   creates a fresh component with its state seeded from props. That replaces the
   usual "sync props into state with an effect" dance, which React 19 correctly
   flags as a cascading render. */
export function OrderFormModal({
  order,
  properties,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const isEdit = order !== null;
  const [form, setForm] = useState<FormState>(() =>
    order
      ? {
          customer_name: order.customer_name,
          customer_email: order.customer_email ?? "",
          amount: centsToUsdInput(order.amount_cents),
          status: order.status,
          event_week: order.event_week ?? "",
          property_id: order.property_id ?? "",
          payment_provider_ref: order.payment_provider_ref ?? "",
        }
      : EMPTY,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = () => {
    const next: Record<string, string> = {};
    if (!form.customer_name.trim()) next.customer_name = "Customer name is required";

    const amountCents = parseUsdToCents(form.amount);
    if (amountCents == null) next.amount = "Enter an amount";
    else if (amountCents < 0) next.amount = "Amount cannot be negative";

    if (form.customer_email && !/^\S+@\S+\.\S+$/.test(form.customer_email))
      next.customer_email = "Enter a valid email";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({
      customer_name: form.customer_name.trim(),
      customer_email: form.customer_email.trim() || null,
      amount_cents: amountCents ?? 0,
      status: form.status,
      source: isEdit ? undefined : "manual",
      event_week: (form.event_week || null) as EventWeek | null,
      property_id: form.property_id || null,
      payment_provider_ref: form.payment_provider_ref.trim() || null,
    });
  };

  return (
    <Modal
      open
      title={isEdit ? "Edit order" : "Record order"}
      description={isEdit ? order?.invoice_number : "Log a payment taken outside the website."}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {isEdit ? "Save changes" : "Create order"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Customer name" error={errors.customer_name} required>
          <TextInput
            value={form.customer_name}
            invalid={Boolean(errors.customer_name)}
            onChange={(e) => set("customer_name", e.target.value)}
          />
        </Field>

        <Field label="Customer email" error={errors.customer_email}>
          <TextInput
            type="email"
            value={form.customer_email}
            invalid={Boolean(errors.customer_email)}
            onChange={(e) => set("customer_email", e.target.value)}
          />
        </Field>

        <Field label="Amount (USD)" error={errors.amount} required>
          <TextInput
            value={form.amount}
            invalid={Boolean(errors.amount)}
            onChange={(e) => set("amount", e.target.value)}
            placeholder="12500.00"
          />
        </Field>

        <Field label="Status" required>
          <SelectInput
            value={form.status}
            onChange={(e) => set("status", e.target.value as OrderStatus)}
            options={ORDER_STATUSES.map((status) => ({
              value: status,
              label: titleCase(status),
            }))}
          />
        </Field>

        <Field label="Event week">
          <SelectInput
            value={form.event_week}
            placeholder="Not tied to an event"
            onChange={(e) => set("event_week", e.target.value)}
            options={EVENT_WEEKS.map((week) => ({ value: week, label: eventLabel(week) }))}
          />
        </Field>

        <Field label="Property">
          <SelectInput
            value={form.property_id}
            placeholder="Unassigned"
            onChange={(e) => set("property_id", e.target.value)}
            options={properties.map((property) => ({
              value: property.id,
              label: property.address,
            }))}
          />
        </Field>

        <Field
          label="Payment reference"
          className="sm:col-span-2"
          hint="Helcim transaction ID, cheque number, or however this payment is traced"
        >
          <TextInput
            value={form.payment_provider_ref}
            onChange={(e) => set("payment_provider_ref", e.target.value)}
          />
        </Field>
      </div>

      {isEdit && order && order.amount_refunded_cents > 0 && (
        <p className="mt-4 rounded-lg bg-orange-50 px-3.5 py-2.5 text-xs text-orange-800">
          {centsToUsdInput(order.amount_refunded_cents)} USD has already been refunded against this
          order. Use the refund action rather than editing the amount, so the ledger stays accurate.
        </p>
      )}
    </Modal>
  );
}