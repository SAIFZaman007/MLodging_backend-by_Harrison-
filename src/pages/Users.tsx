import { useState } from "react";
import { KeyRound, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";

import {
  useCreateUser,
  useDeleteUser,
  useResetUserPassword,
  useUpdateUser,
  useUsers,
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
import { UserFormModal } from "@/components/forms/UserFormModal";
import { PasswordResetModal } from "@/components/forms/PasswordResetModal";
import { formatDate } from "@/lib/format";
import type { User, UserPayload } from "@/api/types";

export function Users() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const { user: currentUser } = useAuth();
  const toast = useToast();

  const { data: users, isLoading, isError, error, refetch } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const resetPassword = useResetUserPassword();
  const deleteUser = useDeleteUser();

  const handleSubmit = (payload: UserPayload) => {
    if (editing) {
      updateUser.mutate(
        { id: editing.id, payload },
        {
          onSuccess: () => {
            toast.success(`${payload.full_name} updated`);
            setFormOpen(false);
          },
          onError: (err: Error) => toast.error(err.message),
        },
      );
    } else {
      createUser.mutate(payload, {
        onSuccess: () => {
          toast.success(`Account created for ${payload.full_name}`);
          setFormOpen(false);
        },
        onError: (err: Error) => toast.error(err.message),
      });
    }
  };

  const handleReset = (newPassword: string) => {
    if (!resetting) return;
    resetPassword.mutate(
      { id: resetting.id, new_password: newPassword },
      {
        onSuccess: () => {
          toast.success(`Password reset for ${resetting.full_name}`);
          setResetting(null);
        },
        onError: (err: Error) => toast.error(err.message),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleting) return;
    deleteUser.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(`${deleting.full_name} removed`);
        setDeleting(null);
      },
      onError: (err: Error) => {
        toast.error(err.message);
        setDeleting(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Settings · Team"
        title="Team"
        description="Operator accounts for this console. There is no public sign-up — every account is provisioned here."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Invite operator
          </Button>
        }
      />

      <div className="card-flush">
        {isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        ) : isLoading ? (
          <SkeletonRows rows={4} />
        ) : !users?.length ? (
          <EmptyState
            icon={ShieldCheck}
            title="No operators yet"
            description="Create the first account with `python -m app.seed.create_admin`."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-3xl">
              <thead>
                <tr className="border-b border-brand-forest/10">
                  <th className="th">Name</th>
                  <th className="th">Email</th>
                  <th className="th">Role</th>
                  <th className="th">Status</th>
                  <th className="th">Added</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user.id === currentUser?.id;
                  return (
                    <tr key={user.id} className="row">
                      <td className="td">
                        <span className="text-brand-ink">{user.full_name}</span>
                        {isSelf && (
                          <span className="ml-2 text-xs text-brand-ink/40">(you)</span>
                        )}
                      </td>
                      <td className="td">{user.email}</td>
                      <td className="td">
                        <StatusBadge value={user.role} />
                      </td>
                      <td className="td">
                        <span
                          className={`badge ${
                            user.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {user.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="td whitespace-nowrap">{formatDate(user.created_at)}</td>
                      <td className="td">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(user);
                              setFormOpen(true);
                            }}
                            title="Edit operator"
                            aria-label={`Edit ${user.full_name}`}
                            className="rounded-lg p-2 text-brand-ink/50 transition-colors hover:bg-brand-cream hover:text-brand-ink"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setResetting(user)}
                            title="Reset password"
                            aria-label={`Reset password for ${user.full_name}`}
                            className="rounded-lg p-2 text-brand-ink/50 transition-colors hover:bg-brand-cream hover:text-brand-ink"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleting(user)}
                            disabled={isSelf}
                            title={
                              isSelf ? "You cannot delete your own account" : "Delete operator"
                            }
                            aria-label={`Delete ${user.full_name}`}
                            className="rounded-lg p-2 text-brand-ink/40 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-brand-ink/40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formOpen && (
        <UserFormModal
          key={editing?.id ?? "new"}
          user={editing}
          saving={createUser.isPending || updateUser.isPending}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      {resetting && (
        <PasswordResetModal
          key={resetting.id}
          user={resetting}
          saving={resetPassword.isPending}
          onClose={() => setResetting(null)}
          onSubmit={handleReset}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Remove operator"
        message={`Permanently remove ${deleting?.full_name}'s account? They lose access immediately. Disabling the account instead is reversible.`}
        confirmLabel="Remove account"
        loading={deleteUser.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}