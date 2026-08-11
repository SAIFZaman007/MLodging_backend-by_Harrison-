import { useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import type { User } from "@/api/types";

interface Props {
  user: User | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (newPassword: string) => void;
}

const MIN_PASSWORD = 10;

/* Mounted only while open and keyed by record id, so opening the dialog
   creates a fresh component with its state seeded from props. That replaces the
   usual "sync props into state with an effect" dance, which React 19 correctly
   flags as a cascading render. */
export function PasswordResetModal({ user, saving, onClose, onSubmit }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const next: Record<string, string> = {};
    if (password.length < MIN_PASSWORD) next.password = `At least ${MIN_PASSWORD} characters`;
    if (password !== confirm) next.confirm = "Passwords do not match";

    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit(password);
  };

  return (
    <Modal
      open
      size="sm"
      title="Reset password"
      description={user?.email}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            Set password
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="New password" error={errors.password} required>
          <TextInput
            type="text"
            value={password}
            invalid={Boolean(errors.password)}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </Field>

        <Field label="Confirm password" error={errors.confirm} required>
          <TextInput
            type="text"
            value={confirm}
            invalid={Boolean(errors.confirm)}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </Field>

        <p className="text-xs text-brand-ink/45">
          The operator is not notified automatically — pass the new password along over a secure
          channel and ask them to change it after signing in.
        </p>
      </div>
    </Modal>
  );
}