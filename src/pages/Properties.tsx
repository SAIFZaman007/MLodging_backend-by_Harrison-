import { useMemo, useState } from "react";
import { Eye, EyeOff, Home, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";

import {
  useAdminProperties,
  useCreateProperty,
  useDeleteProperty,
  useUpdateProperty,
} from "@/hooks/useAdminData";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, PageHeader, SkeletonCards } from "@/components/ui/Feedback";
import { PropertyFormModal } from "@/components/forms/PropertyFormModal";
import { formatUsd } from "@/lib/format";
import type { Property, PropertyPayload } from "@/api/types";

type Filter = "all" | "published" | "hidden";

export function Properties() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Property | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Property | null>(null);

  const { isAdmin } = useAuth();
  const toast = useToast();

  const { data: properties, isLoading, isError, error, refetch } = useAdminProperties();
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const deleteProperty = useDeleteProperty();

  // Filtering client-side keeps typing instant — 24 homes never justifies a
  // round-trip per keystroke.
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (properties ?? []).filter((property) => {
      if (filter === "published" && !property.is_published) return false;
      if (filter === "hidden" && property.is_published) return false;
      if (!needle) return true;
      return (
        property.address.toLowerCase().includes(needle) ||
        property.title.toLowerCase().includes(needle) ||
        property.listing_id.toLowerCase().includes(needle)
      );
    });
  }, [properties, search, filter]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (property: Property) => {
    setEditing(property);
    setFormOpen(true);
  };

  const handleSubmit = (payload: Partial<PropertyPayload>) => {
    if (editing) {
      updateProperty.mutate(
        { id: editing.id, payload },
        {
          onSuccess: () => {
            toast.success(`${editing.address} updated`);
            setFormOpen(false);
          },
          onError: (err: Error) => toast.error(err.message),
        },
      );
    } else {
      createProperty.mutate(payload, {
        onSuccess: () => {
          toast.success("Property created");
          setFormOpen(false);
        },
        onError: (err: Error) => toast.error(err.message),
      });
    }
  };

  const togglePublish = (property: Property) => {
    updateProperty.mutate(
      { id: property.id, payload: { is_published: !property.is_published } },
      {
        onSuccess: () =>
          toast.success(
            property.is_published
              ? `${property.address} hidden from the site`
              : `${property.address} is now live`,
          ),
        onError: (err: Error) => toast.error(err.message),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleting) return;
    deleteProperty.mutate(
      { id: deleting.id },
      {
        onSuccess: () => {
          toast.success(`${deleting.address} deleted`);
          setDeleting(null);
        },
        onError: (err: Error) => {
          toast.error(err.message);
          setDeleting(null);
        },
      },
    );
  };

  const publishedCount = (properties ?? []).filter((p) => p.is_published).length;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Manage · Properties"
        title="Properties"
        description={
          properties
            ? `${properties.length} homes · ${publishedCount} published`
            : "The full portfolio, published and hidden."
        }
        actions={
          <Button variant="primary" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> Add property
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search address, title or listing ID…"
            className="input pl-9"
            aria-label="Search properties"
          />
        </div>

        <div className="flex rounded-full border border-brand-forest/15 bg-white p-0.5">
          {(["all", "published", "hidden"] as Filter[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                filter === option
                  ? "bg-brand-forest text-brand-cream"
                  : "text-brand-ink/55 hover:text-brand-ink"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <div className="card-flush">
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SkeletonCards count={6} height="h-48" />
        </div>
      ) : visible.length === 0 ? (
        <div className="card-flush">
          <EmptyState
            icon={Home}
            title={search || filter !== "all" ? "No matches" : "No properties yet"}
            description={
              search || filter !== "all"
                ? "Try a different search term or filter."
                : "Seed the portfolio with `python -m app.seed.seed`, or add a home manually."
            }
            action={
              search || filter !== "all" ? (
                <Button
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button variant="primary" onClick={openCreate}>
                  <Plus className="h-3.5 w-3.5" /> Add property
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((property) => (
            <article key={property.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate font-display text-base text-brand-ink">
                    {property.address}
                  </h2>
                  <p className="text-xs text-brand-ink/45">{property.listing_id}</p>
                </div>
                {property.is_signature && (
                  <Star
                    className="h-4 w-4 shrink-0 fill-brand-gold text-brand-gold"
                    aria-label="Signature home"
                  />
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-ink/60">
                <span>{property.bedrooms} bed</span>
                <span>{property.baths} bath</span>
                <span>{property.guests} guests</span>
                {property.miles_to_angc != null && (
                  <span className="text-brand-ink/40">{property.miles_to_angc} mi to ANGC</span>
                )}
              </div>

              <p className="tnum mt-3 font-display text-lg text-brand-forest">
                {formatUsd(property.price_cents)}
              </p>

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-brand-forest/5 pt-3">
                <span
                  className={`badge ${
                    property.is_published
                      ? "bg-green-100 text-green-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {property.is_published ? "Published" : "Hidden"}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => togglePublish(property)}
                    disabled={updateProperty.isPending}
                    title={property.is_published ? "Unpublish" : "Publish"}
                    aria-label={property.is_published ? "Unpublish" : "Publish"}
                    className="rounded-lg p-2 text-brand-ink/50 transition-colors hover:bg-brand-cream hover:text-brand-ink disabled:opacity-40"
                  >
                    {property.is_published ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEdit(property)}
                    title="Edit"
                    aria-label={`Edit ${property.address}`}
                    className="rounded-lg p-2 text-brand-ink/50 transition-colors hover:bg-brand-cream hover:text-brand-ink"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setDeleting(property)}
                      title="Delete"
                      aria-label={`Delete ${property.address}`}
                      className="rounded-lg p-2 text-brand-ink/40 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {formOpen && (
        <PropertyFormModal
          key={editing?.id ?? "new"}
          property={editing}
          saving={createProperty.isPending || updateProperty.isPending}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete property"
        message={`Permanently delete ${deleting?.address}? If this home has bookings or orders, the API will block the deletion — unpublishing is the safer option.`}
        confirmLabel="Delete property"
        loading={deleteProperty.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}