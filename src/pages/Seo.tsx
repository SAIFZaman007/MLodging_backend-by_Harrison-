import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

import { useDeleteSeo, useSeoEntries, useUpsertSeo } from "@/hooks/useAdminData";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState, PageHeader } from "@/components/ui/Feedback";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import type { SeoMeta } from "@/api/types";

const SUGGESTED_PATHS = [
  "/",
  "/portfolio",
  "/events/masters",
  "/events/anwa",
  "/local-info",
  "/how-it-works",
  "/weddings-private-events",
];

const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 160;

function CharCount({ value, limit }: { value: string; limit: number }) {
  const over = value.length > limit;
  return (
    <span className={`tnum text-xs ${over ? "text-red-600" : "text-brand-ink/35"}`}>
      {value.length}/{limit}
      {over && " — search engines will truncate this"}
    </span>
  );
}

interface EditorProps {
  initialPath: string;
  entry: SeoMeta | undefined;
  saving: boolean;
  deleting: boolean;
  onSave: (payload: SeoMeta) => void;
  onDelete: (path: string) => void;
}

/**
 * The editor is keyed by the selected path in the parent, so switching pages
 * remounts it with fresh state seeded from the saved entry. Loading the record
 * into state via an effect would work, but it costs a second render pass on
 * every click and is exactly the cascading-render pattern React 19 warns about.
 */
function SeoEditor({ initialPath, entry, saving, deleting, onSave, onDelete }: EditorProps) {
  const [path, setPath] = useState(initialPath);
  const [title, setTitle] = useState(entry?.title ?? "");
  const [description, setDescription] = useState(entry?.meta_description ?? "");
  const [ogImage, setOgImage] = useState(entry?.og_image_url ?? "");
  const [canonical, setCanonical] = useState(entry?.canonical_url ?? "");
  const [pathError, setPathError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleSave = () => {
    if (!path.trim().startsWith("/")) {
      setPathError("Path must start with a slash");
      return;
    }
    setPathError("");
    onSave({
      path: path.trim(),
      title: title.trim() || null,
      meta_description: description.trim() || null,
      og_image_url: ogImage.trim() || null,
      canonical_url: canonical.trim() || null,
    });
  };

  return (
    <div className="card lg:col-span-2">
      <Field
        label="Path"
        error={pathError}
        required
        hint="The exact route on the public site, e.g. /events/masters"
      >
        <TextInput
          value={path}
          invalid={Boolean(pathError)}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/events/masters"
          className="font-mono"
        />
      </Field>

      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between">
          <label className="label mb-0" htmlFor="seo-title">
            Title tag
          </label>
          <CharCount value={title} limit={TITLE_LIMIT} />
        </div>
        <TextInput
          id="seo-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Default title from the page component"
        />
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between">
          <label className="label mb-0" htmlFor="seo-description">
            Meta description
          </label>
          <CharCount value={description} limit={DESCRIPTION_LIMIT} />
        </div>
        <TextArea
          id="seo-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Default description from the page component"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="OG image URL" hint="1200×630 recommended">
          <TextInput
            value={ogImage}
            onChange={(e) => setOgImage(e.target.value)}
            placeholder="https://8888augusta.com/assets/og/masters.jpg"
          />
        </Field>
        <Field label="Canonical URL">
          <TextInput
            value={canonical}
            onChange={(e) => setCanonical(e.target.value)}
            placeholder="https://8888augusta.com/events/masters"
          />
        </Field>
      </div>

      {/* A live preview beats guessing at where the SERP will truncate. */}
      <div className="mt-6 rounded-xl border border-brand-forest/10 bg-brand-cream/50 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-ink/40">
          Search preview
        </p>
        <p className="truncate text-xs text-green-800">
          8888augusta.com{path === "/" ? "" : path}
        </p>
        <p className="mt-0.5 truncate text-base text-blue-800">
          {title || "8888 Augusta — Luxury Homes Near Augusta National"}
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm text-brand-ink/60">
          {description || "This page will use the description defined in its own component."}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={handleSave} loading={saving}>
          <Save className="h-3.5 w-3.5" /> Save override
        </Button>

        {entry && (
          <Button variant="ghost" onClick={() => setConfirmingDelete(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Remove override
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Remove override"
        message={`Clear the SEO override for ${path}? The page reverts to the title and description defined in its component — nothing on the public site breaks.`}
        confirmLabel="Remove override"
        loading={deleting}
        onConfirm={() => {
          onDelete(path);
          setConfirmingDelete(false);
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}

export function Seo() {
  const toast = useToast();
  const { data: entries, isLoading, isError, error, refetch } = useSeoEntries();
  const upsertSeo = useUpsertSeo();
  const deleteSeo = useDeleteSeo();

  const [selectedPath, setSelectedPath] = useState("/");

  const entry = entries?.find((item) => item.path === selectedPath);
  const overriddenPaths = new Set((entries ?? []).map((item) => item.path));
  const customPaths = (entries ?? [])
    .filter((item) => !SUGGESTED_PATHS.includes(item.path))
    .map((item) => item.path);

  const handleSave = (payload: SeoMeta) => {
    upsertSeo.mutate(payload, {
      onSuccess: () => {
        setSelectedPath(payload.path);
        toast.success(`Saved override for ${payload.path}`);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const handleDelete = (path: string) => {
    deleteSeo.mutate(path, {
      onSuccess: () => toast.success(`${path} reverted to its built-in defaults`),
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const renderPathButton = (value: string) => (
    <li key={value}>
      <button
        type="button"
        onClick={() => setSelectedPath(value)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
          selectedPath === value
            ? "bg-brand-forest text-brand-cream"
            : "text-brand-ink/70 hover:bg-brand-cream-dark"
        }`}
      >
        <span className="truncate font-mono text-xs">{value}</span>
        {overriddenPaths.has(value) && (
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              selectedPath === value ? "bg-brand-gold" : "bg-green-500"
            }`}
            title="Has an override"
          />
        )}
      </button>
    </li>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Manage · SEO"
        title="SEO"
        description="Override title tags and meta descriptions per page without a code deploy. Any page without an override falls back to its built-in defaults."
      />

      {isError ? (
        <div className="card-flush">
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card lg:col-span-1">
            <h2 className="font-display text-base text-brand-ink">Pages</h2>
            <p className="mt-0.5 text-xs text-brand-ink/40">
              A dot marks a page with a saved override.
            </p>

            <ul className="mt-3 space-y-1">{SUGGESTED_PATHS.map(renderPathButton)}</ul>

            {!isLoading && customPaths.length > 0 && (
              <>
                <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-brand-ink/40">
                  Custom paths
                </p>
                <ul className="mt-2 space-y-1">{customPaths.map(renderPathButton)}</ul>
              </>
            )}

            <button
              type="button"
              onClick={() => setSelectedPath("")}
              className="mt-5 flex w-full items-center gap-2 rounded-lg border border-dashed border-brand-forest/25 px-3 py-2 text-sm text-brand-ink/55 transition-colors hover:border-brand-forest/50 hover:text-brand-ink"
            >
              <Plus className="h-3.5 w-3.5" /> Add another path
            </button>
          </div>

          <SeoEditor
            key={selectedPath}
            initialPath={selectedPath}
            entry={entry}
            saving={upsertSeo.isPending}
            deleting={deleteSeo.isPending}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  );
}