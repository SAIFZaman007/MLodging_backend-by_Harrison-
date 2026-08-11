import { useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { centsToUsdInput, formatUsd, parseUsdToCents } from "@/lib/format";
import type { Order } from "@/api/types";

interface Props {
  order: Order | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (amountCents: number) => void;
}

/* Mounted only while open and keyed by record id, so opening the dialog
   creates a fresh component with its state seeded from props. That replaces the
   usual "sync props into state with an effect" dance, which React 19 correctly
   flags as a cascading render. */
export function RefundModal({ order, saving, onClose, onSubmit }: Props) {
  const remaining = order ? order.amount_cents - order.amount_refunded_cents : 0;
  const [amount, setAmount] = useState(() => centsToUsdInput(remaining));
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const cents = parseUsdToCents(amount);
    if (cents == null || cents <= 0) {
      setError("Enter an amount greater than zero");
      return;
    }
    if (cents > remaining) {
      setError(`Cannot exceed the ${formatUsd(remaining)} remaining on this order`);
      return;
    }
    onSubmit(cents);
  };

  return (
    <Modal
      open
      size="sm"
      title="Record refund"
      description={order?.invoice_number}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} loading={saving}>
            Record refund
          </Button>
        </>
      }
    >
      <dl className="mb-4 space-y-1.5 rounded-lg bg-brand-cream/60 px-4 py-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-brand-ink/55">Order total</dt>
          <dd className="tnum font-medium">{formatUsd(order?.amount_cents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-brand-ink/55">Already refunded</dt>
          <dd className="tnum font-medium">{formatUsd(order?.amount_refunded_cents)}</dd>
        </div>
        <div className="flex justify-between border-t border-brand-forest/10 pt-1.5">
          <dt className="text-brand-ink/55">Available to refund</dt>
          <dd className="tnum font-semibold">{formatUsd(remaining)}</dd>
        </div>
      </dl>

      <Field label="Refund amount (USD)" error={error} required>
        <TextInput
          value={amount}
          invalid={Boolean(error)}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />
      </Field>

      <p className="mt-3 text-xs text-brand-ink/45">
        This records the refund in the ledger and updates the order status. Settling the money with
        the payment provider is a separate step.
      </p>
    </Modal>
  );
}