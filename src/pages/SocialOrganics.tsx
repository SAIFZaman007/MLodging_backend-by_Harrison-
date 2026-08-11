import { useState } from "react";
import { Info, Mail, Pencil, Phone, Plus, Search, Trash2, Users } from "lucide-react";

import {
  useAdminProperties,
  useCreateInquiry,
  useDeleteInquiry,
  useInquiries,
  useUpdateInquiry,
  useUpdateInquiryStatus,
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
} from "@/components/ui/Feedback";
import { InquiryFormModal } from "@/components/forms/InquiryFormModal";
import { SelectInput } from "@/components/ui/Field";
import {
  INQUIRY_STATUSES,
  eventLabel,
  formatDate,
  statusColor,
  titleCase,
} from "@/lib/format";
import type { Inquiry, InquiryPayload } from "@/api/types";

export function SocialOrganics() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Inquiry | null>(null);
  const [deleting, setDeleting] = useState<Inquiry | null>(null);

  const { isAdmin } = useAuth();
  const toast = useToast();

  const { data: inquiries, isLoading, isError, error, refetch } = useInquiries({
    q: search,
    status,
  });
  const { data: properties } = useAdminProperties();
  const createInquiry = useCreateInquiry();
  const updateInquiry = useUpdateInquiry();
  const updateStatus = useUpdateInquiryStatus();
  const deleteInquiry = useDeleteInquiry();

  const handleSubmit = (payload: InquiryPayload) => {
    if (editing) {
      updateInquiry.mutate(
        { id: editing.id, payload },
        {
          onSuccess: () => {
            toast.success("Lead updated");
            setFormOpen(false);
          },
          onError: (err: Error) => toast.error(err.message),
        },
      );
    } else {
      createInquiry.mutate(payload, {
        onSuccess: () => {
          toast.success("Lead added");
          setFormOpen(false);
        },
        onError: (err: Error) => toast.error(err.message),
      });
    }
  };

  const handleStatusChange = (inquiry: Inquiry, next: Inquiry["status"]) => {
    updateStatus.mutate(
      { id: inquiry.id, status: next },
      {
        onSuccess: () => toast.success(`${inquiry.name} marked ${next}`),
        onError: (err: Error) => toast.error(err.message),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleting) return;
    deleteInquiry.mutate(deleting.id, {
      onSuccess: () => {
        toast.success("Lead deleted");
        setDeleting(null);
      },
      onError: (err: Error) => {
        toast.error(err.message);
        setDeleting(null);
      },
    });
  };

  const newCount = (inquiries ?? []).filter((i) => i.status === "new").length;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Manage · Social Organics"
        title="Social Organics"
        description="Leads captured from the site and logged by the team, ready to work."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Log a lead
          </Button>
        }
      />

      <div className="card flex gap-3 border-l-4 border-brand-gold bg-brand-gold/5 py-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
        <p className="text-sm leading-relaxed text-brand-ink/70">
          This table holds real inquiries from the website's "Request availability" forms, plus
          anything the team logs by hand. The Instagram/hashtag prospecting toolkit still runs as
          standalone scripts — bringing it in as a scheduled backend job that writes into this same
          table is the natural next phase.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or company…"
            className="input pl-9"
            aria-label="Search leads"
          />
        </div>

        <div className="w-44">
          <SelectInput
            value={status}
            placeholder="All statuses"
            onChange={(e) => setStatus(e.target.value)}
            options={INQUIRY_STATUSES.map((option) => ({
              value: option,
              label: titleCase(option),
            }))}
          />
        </div>

        {inquiries && inquiries.length > 0 && (
          <p className="ml-auto text-sm text-brand-ink/50">
            {inquiries.length} shown · {newCount} new
          </p>
        )}
      </div>

      <div className="card-flush">
        {isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        ) : isLoading ? (
          <SkeletonRows rows={6} />
        ) : !inquiries?.length ? (
          <EmptyState
            icon={Users}
            title={search || status ? "No matching leads" : "No inquiries yet"}
            description={
              search || status
                ? "Try a different search or status."
                : "Leads from the website land here automatically. You can also log one manually."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-4xl">
              <thead>
                <tr className="border-b border-brand-forest/10">
                  <th className="th">Name</th>
                  <th className="th">Contact</th>
                  <th className="th">Event</th>
                  <th className="th text-right">Group</th>
                  <th className="th">Received</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="row">
                    <td className="td">
                      <p className="text-brand-ink">{inquiry.name}</p>
                      {inquiry.company && (
                        <p className="text-xs text-brand-ink/40">{inquiry.company}</p>
                      )}
                    </td>
                    <td className="td">
                      <a
                        href={`mailto:${inquiry.email}`}
                        className="flex items-center gap-1.5 text-brand-ink/70 hover:text-brand-forest"
                      ><Mail className="h-3 w-3" /> {inquiry.email}</a>
                      {inquiry.phone && (
                        <a
                          href={`tel:${inquiry.phone}`}
                          className="mt-0.5 flex items-center gap-1.5 text-xs text-brand-ink/45 hover:text-brand-forest"
                        ><Phone className="h-3 w-3" /> {inquiry.phone}</a>
                      )}
                    </td>
                    <td className="td">{eventLabel(inquiry.event_week)}</td>
                    <td className="td tnum text-right">{inquiry.group_size ?? "—"}</td>
                    <td className="td whitespace-nowrap">{formatDate(inquiry.created_at)}</td>
                    <td className="td">
                      <select
                        value={inquiry.status}
                        onChange={(e) =>
                          handleStatusChange(inquiry, e.target.value as Inquiry["status"])
                        }
                        aria-label={`Status for ${inquiry.name}`}
                        className={`badge cursor-pointer border-0 ${statusColor(inquiry.status)}`}
                      >
                        {INQUIRY_STATUSES.map((option) => (
                          <option key={option} value={option}>
                            {titleCase(option)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="td">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(inquiry);
                            setFormOpen(true);
                          }}
                          title="Edit lead"
                          aria-label={`Edit ${inquiry.name}`}
                          className="rounded-lg p-2 text-brand-ink/50 transition-colors hover:bg-brand-cream hover:text-brand-ink"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleting(inquiry)}
                            title="Delete lead"
                            aria-label={`Delete ${inquiry.name}`}
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
        <InquiryFormModal
          key={editing?.id ?? "new"}
          inquiry={editing}
          properties={properties ?? []}
          saving={createInquiry.isPending || updateInquiry.isPending}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete lead"
        message={`Permanently delete ${deleting?.name}? Archiving keeps the record and is reversible — deletion is intended for spam or erasure requests.`}
        confirmLabel="Delete lead"
        loading={deleteInquiry.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}