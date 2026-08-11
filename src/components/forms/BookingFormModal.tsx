import { useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/Field";
import {
  BOOKING_SOURCES,
  BOOKING_STATUSES,
  EVENT_WEEKS,
  eventLabel,
  nightsBetween,
  sourceLabel,
  titleCase,
  toDateInput,
} from "@/lib/format";
import type {
  Booking,
  BookingPayload,
  BookingSource,
  BookingStatus,
  EventWeek,
  Property,
} from "@/api/types";

interface Props {
  booking: Booking | null;
  properties: Property[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: BookingPayload) => void;
}

interface FormState {
  property_id: string;
  check_in: string;
  check_out: string;
  source: BookingSource;
  status: BookingStatus;
  event_week: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guests_count: string;
  notes: string;
}

const EMPTY: FormState = {
  property_id: "",
  check_in: "",
  check_out: "",
  source: "direct",
  status: "confirmed",
  event_week: "",
  guest_name: "",
  guest_email: "",
  guest_phone: "",
  guests_count: "",
  notes: "",
};

/* Mounted only while open and keyed by record id, so opening the dialog
   creates a fresh component with its state seeded from props. That replaces the
   usual "sync props into state with an effect" dance, which React 19 correctly
   flags as a cascading render. */
export function BookingFormModal({
  booking,
  properties,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const isEdit = booking !== null;
  const [form, setForm] = useState<FormState>(() =>
    booking
      ? {
          property_id: booking.property_id,
          check_in: toDateInput(booking.check_in),
          check_out: toDateInput(booking.check_out),
          source: booking.source,
          status: booking.status,
          event_week: booking.event_week ?? "",
          guest_name: booking.guest_name ?? "",
          guest_email: booking.guest_email ?? "",
          guest_phone: booking.guest_phone ?? "",
          guests_count: booking.guests_count == null ? "" : String(booking.guests_count),
          notes: booking.notes ?? "",
        }
      : EMPTY,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const nights =
    form.check_in && form.check_out ? nightsBetween(form.check_in, form.check_out) : 0;
  const isBlock = form.source === "manual_block";

  const handleSubmit = () => {
    const next: Record<string, string> = {};
    if (!form.property_id) next.property_id = "Choose a property";
    if (!form.check_in) next.check_in = "Required";
    if (!form.check_out) next.check_out = "Required";
    if (form.check_in && form.check_out && form.check_out <= form.check_in)
      next.check_out = "Check-out must be after check-in";
    if (!isBlock && !form.guest_name.trim()) next.guest_name = "Guest name is required";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({
      property_id: form.property_id,
      check_in: form.check_in,
      check_out: form.check_out,
      source: form.source,
      status: form.status,
      event_week: (form.event_week || null) as EventWeek | null,
      guest_name: form.guest_name.trim() || null,
      guest_email: form.guest_email.trim() || null,
      guest_phone: form.guest_phone.trim() || null,
      guests_count: form.guests_count ? Number(form.guests_count) : null,
      notes: form.notes.trim() || null,
    });
  };

  return (
    <Modal
      open
      title={isEdit ? "Edit booking" : "Add booking"}
      description={
        isEdit
          ? "Changing dates is re-checked against every other hold on this home."
          : "Create a direct reservation or block dates for maintenance."
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {isEdit ? "Save changes" : "Create booking"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Property" error={errors.property_id} required className="sm:col-span-2">
          <SelectInput
            value={form.property_id}
            placeholder="Choose a property…"
            invalid={Boolean(errors.property_id)}
            onChange={(e) => set("property_id", e.target.value)}
            options={properties.map((property) => ({
              value: property.id,
              label: `${property.address} · ${property.bedrooms} bed`,
            }))}
          />
        </Field>

        <Field label="Check-in" error={errors.check_in} required>
          <TextInput
            type="date"
            value={form.check_in}
            invalid={Boolean(errors.check_in)}
            onChange={(e) => set("check_in", e.target.value)}
          />
        </Field>

        <Field
          label="Check-out"
          error={errors.check_out}
          required
          hint={nights > 0 ? `${nights} night${nights === 1 ? "" : "s"}` : undefined}
        >
          <TextInput
            type="date"
            value={form.check_out}
            invalid={Boolean(errors.check_out)}
            onChange={(e) => set("check_out", e.target.value)}
          />
        </Field>

        <Field label="Source" required>
          <SelectInput
            value={form.source}
            onChange={(e) => set("source", e.target.value as BookingSource)}
            options={BOOKING_SOURCES.map((source) => ({
              value: source,
              label: sourceLabel(source),
            }))}
          />
        </Field>

        <Field label="Status" required>
          <SelectInput
            value={form.status}
            onChange={(e) => set("status", e.target.value as BookingStatus)}
            options={BOOKING_STATUSES.map((status) => ({
              value: status,
              label: titleCase(status),
            }))}
          />
        </Field>

        <Field label="Event week" className="sm:col-span-2">
          <SelectInput
            value={form.event_week}
            placeholder="Not tied to an event"
            onChange={(e) => set("event_week", e.target.value)}
            options={EVENT_WEEKS.map((week) => ({ value: week, label: eventLabel(week) }))}
          />
        </Field>

        {!isBlock && (
          <>
            <Field label="Guest name" error={errors.guest_name} required>
              <TextInput
                value={form.guest_name}
                invalid={Boolean(errors.guest_name)}
                onChange={(e) => set("guest_name", e.target.value)}
              />
            </Field>

            <Field label="Guest email">
              <TextInput
                type="email"
                value={form.guest_email}
                onChange={(e) => set("guest_email", e.target.value)}
              />
            </Field>

            <Field label="Guest phone">
              <TextInput
                value={form.guest_phone}
                onChange={(e) => set("guest_phone", e.target.value)}
              />
            </Field>

            <Field label="Party size">
              <TextInput
                type="number"
                min={1}
                value={form.guests_count}
                onChange={(e) => set("guests_count", e.target.value)}
              />
            </Field>
          </>
        )}

        <Field label="Notes" className="sm:col-span-2">
          <TextArea
            rows={2}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder={isBlock ? "Reason for the block…" : "Anything the team should know…"}
          />
        </Field>
      </div>
    </Modal>
  );
}