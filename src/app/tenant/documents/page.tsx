import { createClient } from "@/lib/supabase/server";
import { DateDisplay } from "@/components/shared/date-display";

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  lease: { icon: "description", color: "bg-blue-50 text-primary", label: "Primary Lease Agreements" },
  schedule_a: { icon: "article", color: "bg-amber-50 text-secondary", label: "Schedules & Riders" },
  schedule_b: { icon: "article", color: "bg-amber-50 text-secondary", label: "Schedules & Riders" },
  inspection: { icon: "content_paste_search", color: "bg-green-50 text-tertiary", label: "Inspections & Reports" },
  receipt: { icon: "receipt_long", color: "bg-slate-50 text-on-surface-variant", label: "Bills & Receipts" },
  utility: { icon: "receipt_long", color: "bg-slate-50 text-on-surface-variant", label: "Utility Bills" },
  insurance: { icon: "verified_user", color: "bg-green-50 text-tertiary", label: "Insurance" },
  other: { icon: "folder", color: "bg-surface-container-high text-on-surface-variant", label: "Other Documents" },
};

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id")
    .eq("auth_id", user!.id)
    .single();

  if (!rpUser) return <div>User not found</div>;

  // Get lease
  const { data: leaseLink } = await supabase
    .from("rp_lease_tenants")
    .select("lease_id")
    .eq("user_id", rpUser.id)
    .limit(1)
    .single();

  let documents: Array<{
    id: string;
    category: string;
    title: string;
    file_url: string;
    file_size: number | null;
    mime_type: string | null;
    created_at: string;
  }> = [];

  if (leaseLink) {
    const { data } = await supabase
      .from("rp_documents")
      .select("id, category, title, file_url, file_size, mime_type, created_at")
      .eq("lease_id", leaseLink.lease_id)
      .eq("visible_to_tenant", true)
      .order("category")
      .order("created_at", { ascending: false });
    documents = data ?? [];
  }

  // Group by category label
  const grouped: Record<string, typeof documents> = {};
  for (const doc of documents) {
    const config = CATEGORY_CONFIG[doc.category] ?? CATEGORY_CONFIG.other;
    const label = config.label;
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(doc);
  }

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-headline font-extrabold text-primary tracking-tighter leading-tight">
          Regulatory & Lease{" "}
          <span className="text-secondary italic">Asset Repository</span>
        </h1>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Upload + Compliance */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Upload Area */}
          <div className="bg-primary p-1 rounded-xl shadow-ambient-lg">
            <div className="bg-primary-container rounded-lg p-8 border-2 border-dashed border-outline-variant/20 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
                <span className="material-symbols-outlined text-secondary text-3xl">
                  cloud_upload
                </span>
              </div>
              <h5 className="font-headline font-bold text-white text-lg mb-2">
                Upload Documents
              </h5>
              <p className="text-on-primary-container text-sm mb-6 px-4">
                Insurance, Tenant ID, or supporting Schedule B amendments.
              </p>
              <button className="w-full bg-secondary-fixed text-on-secondary-fixed py-3 rounded-lg font-headline font-bold text-sm hover:scale-[0.98] transition-transform">
                Browse Files
              </button>
            </div>
          </div>
        </div>

        {/* Right: Document Grid */}
        <div className="col-span-12 lg:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-4">
              <button className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold uppercase">
                All Files
              </button>
              <button className="px-4 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-full text-xs font-bold uppercase transition-colors">
                Recent
              </button>
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-low rounded-2xl">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">
                description
              </span>
              <h2 className="font-headline text-xl font-bold text-primary mb-2">
                No Documents Yet
              </h2>
              <p className="text-on-surface-variant">
                Documents shared by your landlord will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(grouped).map(([label, docs]) => (
                <div key={label}>
                  <div className="bg-surface-container-low p-3 px-6 rounded-t-xl text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] flex items-center justify-between">
                    <span>{label}</span>
                    <span>{docs.length} Item{docs.length !== 1 ? "s" : ""}</span>
                  </div>
                  {docs.map((doc) => {
                    const config =
                      CATEGORY_CONFIG[doc.category] ?? CATEGORY_CONFIG.other;
                    return (
                      <div
                        key={doc.id}
                        className="bg-white hover:bg-surface-container-lowest transition-all p-5 shadow-sm flex items-center gap-6 group"
                      >
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${config.color}`}
                        >
                          <span className="material-symbols-outlined text-2xl">
                            {config.icon}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h6 className="font-headline font-bold text-primary truncate">
                            {doc.title}
                          </h6>
                          <p className="text-xs text-on-surface-variant">
                            {doc.category} •{" "}
                            <DateDisplay date={doc.created_at} format="medium" />
                            {doc.file_size ? ` • ${formatSize(doc.file_size)}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <button className="p-2 hover:bg-surface-container text-primary transition-colors rounded-lg flex items-center gap-1 text-xs font-bold">
                            <span className="material-symbols-outlined text-[18px]">
                              visibility
                            </span>
                            View
                          </button>
                          <button className="p-2 hover:bg-surface-container text-primary transition-colors rounded-lg">
                            <span className="material-symbols-outlined text-[18px]">
                              download
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Compliance Note */}
      <footer className="mt-12 pt-8 border-t border-surface-container-highest flex flex-col md:flex-row justify-between items-center text-on-surface-variant text-[11px] font-medium tracking-wide uppercase gap-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">security</span>
            AES-256 Encrypted Storage
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">gavel</span>
            RTA Compliant Records
          </span>
        </div>
        <p>All Documents Archived for 7 Years.</p>
      </footer>
    </section>
  );
}
