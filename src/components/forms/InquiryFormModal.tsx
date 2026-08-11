import { useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/Field";
import {
  EVENT_WEEKS,
  INQUIRY_STATUSES,
  eventLabel,
  titleCase,
  toDateInput,
} from "@/lib/format";
import type { EventWeek, Inquiry, InquiryPayload, InquiryStatus, Property } from "@/api/types";

interface Props {
  inquiry: Inquiry | null;
  properties: Property[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: InquiryPayload) => void;
}

interface FormState {
  name: string;
  company: string;
  email: string;
  phone: string;
  group_size: string;
  event_week: string;
  check_in: string;
  check_out: string;
  property_slug: string;
  notes: string;
  status: InquiryStatus;
}

const EMPTY: FormState = {
  name: "",
  company: "",
  email: "",
  phone: "",
  group_size: "",
  event_week: "",
  check_in: "",
  check_out: "",
  property_slug: "",
  notes: "",
  status: "new",
};

/* Mounted only while open and keyed by record id, so opening the dialog
   creates a fresh component with its state seeded from props. That replaces the
   usual "sync props into state with an effect" dance, which React 19 correctly
   flags as a cascading render. */
export function InquiryFormModal({
  inquiry,
  properties,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const isEdit = inquiry !== null;
  const [form, setForm] = useState<FormState>(() =>
    inquiry
      ? {
          name: inquiry.name,
          company: inquiry.company ?? "",
          email: inquiry.email,
          phone: inquiry.phone ?? "",
          group_size: inquiry.group_size == null ? "" : String(inquiry.group_size),
          event_week: inquiry.event_week ?? "",
          check_in: toDateInput(inquiry.check_in),
          check_out: toDateInput(inquiry.check_out),
          property_slug: inquiry.property_slug ?? "",
          notes: inquiry.notes ?? "",
          status: inquiry.status,
        }
      : EMPTY,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email";
    if (form.check_in && form.check_out && form.check_out <= form.check_in)
      next.check_out = "Check-out must be after check-in";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({
      name: form.name.trim(),
      company: form.company.trim() || null,
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      group_size: form.group_size ? Number(form.group_size) : null,
      event_week: (form.event_week || null) as EventWeek | null,
      check_in: form.check_in || null,
      check_out: form.check_out || null,
      property_slug: form.property_slug || null,
      notes: form.notes.trim() || null,
      status: form.status,
    });
  };

  return (
    <Modal
      open
      title={isEdit ? "Edit lead" : "Log a lead"}
      description={
        isEdit ? inquiry?.email : "Capture an inquiry that arrived by phone, email, or DM."
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {isEdit ? "Save changes" : "Add lead"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors.name} required>
          <TextInput
            value={form.name}
            invalid={Boolean(errors.name)}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>

        <Field label="Company">
          <TextInput value={form.company} onChange={(e) => set("company", e.target.value)} />
        </Field>

        <Field label="Email" error={errors.email} required>
          <TextInput
            type="email"
            value={form.email}
            invalid={Boolean(errors.email)}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>

        <Field label="Phone">
          <TextInput value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>

        <Field label="Group size">
          <TextInput
            type="number"
            min={1}
            value={form.group_size}
            onChange={(e) => set("group_size", e.target.value)}
          />
        </Field>

        <Field label="Status" required>
          <SelectInput
            value={form.status}
            onChange={(e) => set("status", e.target.value as InquiryStatus)}
            options={INQUIRY_STATUSES.map((status) => ({
              value: status,
              label: titleCase(status),
            }))}
          />
        </Field>

        <Field label="Event week">
          <SelectInput
            value={form.event_week}
            placeholder="Not specified"
            onChange={(e) => set("event_week", e.target.value)}
            options={EVENT_WEEKS.map((week) => ({ value: week, label: eventLabel(week) }))}
          />
        </Field>

        <Field label="Property of interest">
          <SelectInput
            value={form.property_slug}
            placeholder="No preference"
            onChange={(e) => set("property_slug", e.target.value)}
            options={properties.map((property) => ({
              value: property.slug,
              label: property.address,
            }))}
          />
        </Field>

        <Field label="Desired check-in">
          <TextInput
            type="date"
            value={form.check_in}
            onChange={(e) => set("check_in", e.target.value)}
          />
        </Field>

        <Field label="Desired check-out" error={errors.check_out}>
          <TextInput
            type="date"
            value={form.check_out}
            invalid={Boolean(errors.check_out)}
            onChange={(e) => set("check_out", e.target.value)}
          />
        </Field>

        <Field label="Notes" className="sm:col-span-2">
          <TextArea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}