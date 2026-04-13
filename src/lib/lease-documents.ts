import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeaseDocumentContent } from "@/lib/lease-templates/alberta";

export interface LeaseDocument {
  id: string;
  lease_id: string;
  document_type: string;
  title: string;
  sort_order: number;
  document_content: LeaseDocumentContent | null;
  file_url: string | null;
  signing_status: string;
  signing_request_id: string | null;
  signed_offline_at: string | null;
  signed_offline_by: string | null;
  signed_pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get all documents for a lease from rp_lease_documents.
 * Falls back to building a virtual document from rp_leases.lease_document_content
 * if no rows exist yet (backward compatibility for pre-migration leases).
 */
export async function getLeaseDocuments(
  supabase: SupabaseClient,
  leaseId: string
): Promise<LeaseDocument[]> {
  const { data: docs } = await supabase
    .from("rp_lease_documents")
    .select("*")
    .eq("lease_id", leaseId)
    .order("sort_order");

  if (docs && docs.length > 0) {
    return docs as LeaseDocument[];
  }

  // Fallback: build a virtual document from the old monolithic column
  const { data: lease } = await supabase
    .from("rp_leases")
    .select("id, lease_document_content, signing_status, created_at")
    .eq("id", leaseId)
    .single();

  if (!lease?.lease_document_content) {
    return [];
  }

  return [
    {
      id: `virtual-${lease.id}`,
      lease_id: lease.id,
      document_type: "lease_agreement",
      title: "Lease Agreement",
      sort_order: 0,
      document_content: lease.lease_document_content as LeaseDocumentContent,
      file_url: null,
      signing_status: lease.signing_status ?? "draft",
      signing_request_id: null,
      signed_offline_at: null,
      signed_offline_by: null,
      signed_pdf_url: null,
      created_at: lease.created_at,
      updated_at: lease.created_at,
    },
  ];
}

/**
 * Get a single lease document by its ID.
 */
export async function getLeaseDocument(
  supabase: SupabaseClient,
  documentId: string
): Promise<LeaseDocument | null> {
  const { data } = await supabase
    .from("rp_lease_documents")
    .select("*")
    .eq("id", documentId)
    .single();

  return (data as LeaseDocument) ?? null;
}

/**
 * Save document content to rp_lease_documents.
 * Also writes to rp_leases.lease_document_content for backward compatibility (dual-write).
 */
export async function saveLeaseDocumentContent(
  supabase: SupabaseClient,
  documentId: string,
  content: LeaseDocumentContent
): Promise<{ success: boolean; error?: string }> {
  // Update the rp_lease_documents row
  const { data: doc, error: docError } = await supabase
    .from("rp_lease_documents")
    .update({
      document_content: content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .select("lease_id, document_type")
    .single();

  if (docError) {
    return { success: false, error: docError.message };
  }

  // Dual-write: also update the old column on rp_leases for lease_agreement type
  if (doc.document_type === "lease_agreement") {
    await supabase
      .from("rp_leases")
      .update({ lease_document_content: content })
      .eq("id", doc.lease_id);
  }

  return { success: true };
}

/**
 * Create the initial set of documents for a new lease.
 * Currently creates a single lease_agreement row (Phase 4 will split into 3).
 * Also writes to rp_leases.lease_document_content for backward compatibility.
 */
export async function createLeaseDocumentSet(
  supabase: SupabaseClient,
  leaseId: string,
  fullContent: LeaseDocumentContent,
  createdBy: string
): Promise<{ success: boolean; error?: string }> {
  // Insert a lease_agreement row with the full content
  const { error: insertError } = await supabase
    .from("rp_lease_documents")
    .insert({
      lease_id: leaseId,
      document_type: "lease_agreement",
      title: "Lease Agreement",
      sort_order: 0,
      document_content: fullContent,
      signing_status: "draft",
      created_by: createdBy,
    });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  // Dual-write: also set the old column
  await supabase
    .from("rp_leases")
    .update({ lease_document_content: fullContent })
    .eq("id", leaseId);

  return { success: true };
}

/**
 * Regenerate a specific lease document's content.
 * Writes to both rp_lease_documents and rp_leases for backward compat.
 * Returns the new content.
 */
export async function regenerateLeaseDocumentContent(
  supabase: SupabaseClient,
  leaseId: string,
  fullContent: LeaseDocumentContent
): Promise<{ success: boolean; error?: string }> {
  // Update rp_lease_documents (lease_agreement row)
  const { error: docError } = await supabase
    .from("rp_lease_documents")
    .update({
      document_content: fullContent,
      updated_at: new Date().toISOString(),
    })
    .eq("lease_id", leaseId)
    .eq("document_type", "lease_agreement");

  if (docError) {
    return { success: false, error: docError.message };
  }

  // Dual-write: also update the old column
  await supabase
    .from("rp_leases")
    .update({ lease_document_content: fullContent })
    .eq("id", leaseId);

  return { success: true };
}
