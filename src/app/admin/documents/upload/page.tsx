"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadDocument } from "@/app/admin/actions/document-actions";

type Property = {
  id: string;
  address_line1: string;
  city: string;
};

const CATEGORY_OPTIONS = [
  { value: "lease", label: "Lease Agreement", icon: "gavel" },
  { value: "schedule_a", label: "Schedule A", icon: "article" },
  { value: "schedule_b", label: "Schedule B", icon: "article" },
  { value: "inspection_movein", label: "Move-in Inspection", icon: "fact_check" },
  { value: "inspection_moveout", label: "Move-out Inspection", icon: "fact_check" },
  { value: "utility_bill", label: "Utility Bill", icon: "receipt_long" },
  { value: "notice", label: "Notice", icon: "campaign" },
  { value: "insurance", label: "Insurance", icon: "shield" },
  { value: "receipt", label: "Receipt", icon: "receipt" },
  { value: "other", label: "Other", icon: "folder" },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadDocumentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [propertyId, setPropertyId] = useState("");
  const [category, setCategory] = useState("lease");
  const [title, setTitle] = useState("");
  const [visibleToTenant, setVisibleToTenant] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProperties() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rpUser } = await supabase
        .from("rp_users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (!rpUser) return;

      const { data } = await supabase
        .from("rp_properties")
        .select("id, address_line1, city")
        .eq("landlord_id", rpUser.id)
        .order("address_line1");

      setProperties(data ?? []);
      if (data && data.length > 0) {
        setPropertyId(data[0].id);
      }
      setLoading(false);
    }
    loadProperties();
  }, []);

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!propertyId) {
      setError("Please select a property.");
      return;
    }
    if (!title.trim()) {
      setError("Document title is required.");
      return;
    }
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be under 10 MB.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("property_id", propertyId);
      formData.set("category", category);
      formData.set("title", title.trim());
      formData.set("visible_to_tenant", String(visibleToTenant));
      formData.set("file", file);

      const result = await uploadDocument(formData);
      if (result.success) {
        toast.success("Document uploaded successfully");
        router.push("/admin/documents");
      } else {
        setError(result.error ?? "Failed to upload document.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="ml-3 text-on-surface-variant">Loading...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/documents"
          className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to Documents
        </Link>
      </div>

      <div>
        <h1 className="font-headline text-2xl font-bold text-primary flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl">upload_file</span>
          Upload Document
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Upload a document for your property records
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-error-container/30 text-on-error-container p-4 rounded-xl">
          <span className="material-symbols-outlined text-lg mt-0.5">error</span>
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Property & Category */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Property */}
            <div>
              <label className="block text-sm font-bold text-primary mb-2">
                Property <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  domain
                </span>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.address_line1}, {p.city}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-primary mb-2">
                Category <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  category
                </span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-primary mb-2">
              Document Title <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                description
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lease Agreement - Unit 3"
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Visible to Tenant Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-bold text-on-surface">Visible to Tenant</p>
              <p className="text-xs text-on-surface-variant">
                Allow tenants to see and download this document
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={visibleToTenant}
              onClick={() => setVisibleToTenant(!visibleToTenant)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                visibleToTenant ? "bg-primary" : "bg-surface-container-highest"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                  visibleToTenant ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* File Upload Area */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 md:p-8">
          <h2 className="text-lg font-headline font-bold text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">attach_file</span>
            File
          </h2>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-primary bg-primary-fixed/10"
                : file
                ? "border-primary/30 bg-primary-fixed/5"
                : "border-outline-variant/30 hover:border-primary/30 hover:bg-surface-container-low"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.txt,.csv"
            />

            {file ? (
              <div className="flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-4xl text-primary">
                  check_circle
                </span>
                <div>
                  <p className="text-sm font-bold text-on-surface">{file.name}</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {formatFileSize(file.size)} · {file.type || "Unknown type"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-xs text-error font-semibold hover:underline"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">
                  cloud_upload
                </span>
                <div>
                  <p className="text-sm font-semibold text-on-surface">
                    Drag & drop your file here
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    or click to browse · PDF, DOC, XLS, JPG, PNG up to 10 MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/admin/documents"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-lg">
              {submitting ? "hourglass_empty" : "upload_file"}
            </span>
            {submitting ? "Uploading..." : "Upload Document"}
          </button>
        </div>
      </form>
    </section>
  );
}
