import { createClient } from "@/lib/supabase/server";
import { DateDisplay } from "@/components/shared/date-display";
import Link from "next/link";

const CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  lease: { label: "Leases", icon: "gavel" },
  schedule_a: { label: "Schedule A", icon: "article" },
  schedule_b: { label: "Schedule B", icon: "article" },
  inspection_movein: { label: "Move-in Inspections", icon: "fact_check" },
  inspection_moveout: { label: "Move-out Inspections", icon: "fact_check" },
  utility_bill: { label: "Utility Bills", icon: "receipt_long" },
  notice: { label: "Notices", icon: "campaign" },
  insurance: { label: "Insurance", icon: "shield" },
  receipt: { label: "Receipts", icon: "receipt" },
  other: { label: "Other", icon: "folder" },
};

const CATEGORY_ORDER = [
  "lease",
  "schedule_a",
  "schedule_b",
  "inspection_movein",
  "inspection_moveout",
  "utility_bill",
  "notice",
  "insurance",
  "receipt",
  "other",
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Document = {
  id: string;
  category: string;
  title: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  visible_to_tenant: boolean;
  created_at: string;
  rp_properties: { address_line1: string; city: string } | null;
};

export default async function AdminDocuments() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id")
    .eq("auth_id", user!.id)
    .single();

  // Get all properties for this landlord
  const { data: properties } = await supabase
    .from("rp_properties")
    .select("id")
    .eq("landlord_id", rpUser!.id);

  const propertyIds = (properties ?? []).map((p) => p.id);

  // Fetch documents with property info
  let documents: Document[] = [];
  if (propertyIds.length > 0) {
    const { data } = await supabase
      .from("rp_documents")
      .select(
        "id, category, title, file_url, file_size, mime_type, visible_to_tenant, created_at, rp_properties(address_line1, city)"
      )
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false });

    documents = (data ?? []) as unknown as Document[];
  }

  // Group documents by category
  const grouped: Record<string, Document[]> = {};
  for (const doc of documents) {
    const cat = doc.category ?? "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(doc);
  }

  // Sort categories in defined order
  const sortedCategories = CATEGORY_ORDER.filter((cat) => grouped[cat]?.length);

  const totalCount = documents.length;

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-headline text-2xl font-bold text-primary">
            Documents
          </h1>
          {totalCount > 0 && (
            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-surface-container-high text-xs font-bold text-on-surface-variant">
              {totalCount}
            </span>
          )}
        </div>

        <Link
          href="/admin/documents/upload"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-lg">
            upload_file
          </span>
          Upload Document
        </Link>
      </div>

      {/* Document sections grouped by category */}
      {totalCount === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-12 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-primary-fixed/20 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-5xl text-on-primary-fixed-variant">
              folder_open
            </span>
          </div>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-2">
            No documents yet
          </h2>
          <p className="text-sm text-on-surface-variant max-w-sm mb-8">
            Upload leases, inspection reports, utility bills, and other
            documents to keep everything organized in one place.
          </p>
          <Link
            href="/admin/documents/upload"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-lg">
              upload_file
            </span>
            Upload Document
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedCategories.map((category) => {
            const docs = grouped[category];
            const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.other;

            return (
              <div
                key={category}
                className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm"
              >
                {/* Category header */}
                <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">
                      {config.icon}
                    </span>
                    <h3 className="font-headline font-bold text-lg">
                      {config.label}
                    </h3>
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-high text-xs font-bold text-on-surface-variant">
                      {docs.length}
                    </span>
                  </div>
                </div>

                {/* Document list */}
                <div className="divide-y divide-outline-variant/10">
                  {docs.map((doc) => {
                    const property = doc.rp_properties as any;

                    return (
                      <div
                        key={doc.id}
                        className="flex items-center gap-4 px-6 md:px-8 py-4 hover:bg-surface-container-low transition-colors"
                      >
                        {/* File type icon */}
                        <div className="w-10 h-10 rounded-xl bg-primary-fixed/20 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-on-primary-fixed-variant text-sm">
                            {doc.mime_type?.includes("pdf")
                              ? "picture_as_pdf"
                              : doc.mime_type?.includes("image")
                                ? "image"
                                : "description"}
                          </span>
                        </div>

                        {/* Document info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">
                            {doc.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {property && (
                              <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
                                <span className="material-symbols-outlined text-xs">
                                  location_on
                                </span>
                                {property.address_line1}
                                {property.city ? `, ${property.city}` : ""}
                              </span>
                            )}
                            <span className="text-xs text-on-surface-variant">
                              <DateDisplay
                                date={doc.created_at}
                                format="medium"
                              />
                            </span>
                            <span className="text-xs text-on-surface-variant">
                              {formatFileSize(doc.file_size ?? 0)}
                            </span>
                          </div>
                        </div>

                        {/* Visibility badge */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {doc.visible_to_tenant ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary-fixed/30 text-[10px] font-bold uppercase tracking-wider text-on-tertiary-fixed-variant">
                              <span className="material-symbols-outlined text-xs">
                                visibility
                              </span>
                              Tenant
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-variant text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                              <span className="material-symbols-outlined text-xs">
                                visibility_off
                              </span>
                              Private
                            </span>
                          )}

                          {/* Download link */}
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface-variant transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">
                              download
                            </span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
