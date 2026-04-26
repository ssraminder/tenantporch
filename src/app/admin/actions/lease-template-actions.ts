"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  buildRenderContext,
  renderTemplateDocuments,
  type LandlordTemplateDefaults,
  type LandlordTemplateDocument,
  type LeaseFormInput,
  type PropertyInput,
  type PersonInput,
  type OwnerInput,
} from "@/lib/lease-templates/template-renderer";
import type { LeaseDocumentContent } from "@/lib/lease-templates/alberta";

type ActionResult<T = void> =
  | ({ success: true } & (T extends void ? Record<string, never> : T))
  | { success: false; error: string };

/**
 * Authenticate the request and resolve the rp_users.id of the caller.
 * Returns null on auth failure so the caller can short-circuit.
 */
async function requireLandlord() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false as const, error: "Not authenticated" };
  }

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id, first_name, last_name, email, phone")
    .eq("auth_id", user.id)
    .single();

  if (!rpUser) {
    return { ok: false as const, error: "User profile not found" };
  }

  return { ok: true as const, supabase, rpUser };
}

// ============================================================
// CRUD
// ============================================================

export async function listMyLeaseTemplates() {
  const auth = await requireLandlord();
  if (!auth.ok) return { success: false as const, error: auth.error };

  const { data, error } = await auth.supabase
    .from("rp_lease_templates")
    .select(
      "id, landlord_id, name, description, province_code, country_code, version, is_active, created_at, updated_at"
    )
    .or(`landlord_id.eq.${auth.rpUser.id},landlord_id.is.null`)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return { success: false as const, error: error.message };
  return { success: true as const, templates: data ?? [] };
}

export async function getLeaseTemplate(templateId: string) {
  const auth = await requireLandlord();
  if (!auth.ok) return { success: false as const, error: auth.error };

  const { data, error } = await auth.supabase
    .from("rp_lease_templates")
    .select(
      "id, landlord_id, name, description, province_code, country_code, version, is_active, defaults, documents, created_at, updated_at"
    )
    .eq("id", templateId)
    .single();

  if (error || !data) {
    return { success: false as const, error: error?.message ?? "Template not found" };
  }

  return { success: true as const, template: data };
}

export async function createLeaseTemplate(formData: FormData) {
  const auth = await requireLandlord();
  if (!auth.ok) return { success: false as const, error: auth.error };

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const province = (formData.get("province_code") as string) || "AB";
  const country = (formData.get("country_code") as string) || "CA";

  if (!name) return { success: false as const, error: "Template name is required" };

  const { data, error } = await auth.supabase
    .from("rp_lease_templates")
    .insert({
      landlord_id: auth.rpUser.id,
      name,
      description,
      province_code: province,
      country_code: country,
      version: "1.0",
      is_active: true,
      defaults: {},
      documents: [],
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false as const, error: error?.message ?? "Failed to create template" };
  }

  revalidatePath("/admin/lease-templates");
  return { success: true as const, templateId: data.id };
}

export async function updateLeaseTemplate(
  templateId: string,
  payload: {
    name?: string;
    description?: string | null;
    defaults?: LandlordTemplateDefaults;
    documents?: LandlordTemplateDocument[];
  }
) {
  const auth = await requireLandlord();
  if (!auth.ok) return { success: false as const, error: auth.error };

  // Ownership check via existing row.
  const { data: existing } = await auth.supabase
    .from("rp_lease_templates")
    .select("id, landlord_id")
    .eq("id", templateId)
    .single();
  if (!existing) return { success: false as const, error: "Template not found" };
  if (existing.landlord_id !== auth.rpUser.id) {
    return { success: false as const, error: "You do not own this template" };
  }

  // Build the partial update object.
  const update: Record<string, unknown> = {};
  if (typeof payload.name === "string") update.name = payload.name.trim();
  if (payload.description !== undefined) update.description = payload.description;
  if (payload.defaults) update.defaults = payload.defaults;
  if (payload.documents) update.documents = payload.documents;

  if (Object.keys(update).length === 0) {
    return { success: true as const };
  }

  const { error } = await auth.supabase
    .from("rp_lease_templates")
    .update(update)
    .eq("id", templateId);

  if (error) return { success: false as const, error: error.message };

  revalidatePath("/admin/lease-templates");
  revalidatePath(`/admin/lease-templates/${templateId}`);
  return { success: true as const };
}

export async function deleteLeaseTemplate(templateId: string) {
  const auth = await requireLandlord();
  if (!auth.ok) return { success: false as const, error: auth.error };

  const { data: existing } = await auth.supabase
    .from("rp_lease_templates")
    .select("id, landlord_id")
    .eq("id", templateId)
    .single();
  if (!existing) return { success: false as const, error: "Template not found" };
  if (existing.landlord_id !== auth.rpUser.id) {
    return { success: false as const, error: "You do not own this template" };
  }

  const { error } = await auth.supabase
    .from("rp_lease_templates")
    .delete()
    .eq("id", templateId);

  if (error) return { success: false as const, error: error.message };

  revalidatePath("/admin/lease-templates");
  return { success: true as const };
}

export async function duplicateLeaseTemplate(templateId: string) {
  const auth = await requireLandlord();
  if (!auth.ok) return { success: false as const, error: auth.error };

  const { data: source } = await auth.supabase
    .from("rp_lease_templates")
    .select(
      "id, landlord_id, name, description, province_code, country_code, version, defaults, documents"
    )
    .eq("id", templateId)
    .single();

  if (!source) return { success: false as const, error: "Template not found" };

  const { data: dup, error } = await auth.supabase
    .from("rp_lease_templates")
    .insert({
      landlord_id: auth.rpUser.id,
      name: `${source.name} (Copy)`,
      description: source.description,
      province_code: source.province_code,
      country_code: source.country_code,
      version: source.version,
      is_active: true,
      defaults: source.defaults ?? {},
      documents: source.documents ?? [],
    })
    .select("id")
    .single();

  if (error || !dup) {
    return { success: false as const, error: error?.message ?? "Failed to duplicate template" };
  }

  revalidatePath("/admin/lease-templates");
  return { success: true as const, templateId: dup.id };
}

// ============================================================
// Apply / Save-as
// ============================================================

/**
 * Render the template's placeholder content using the lease's current data
 * (property, landlord, tenants, defaults) and write the result into the
 * lease's rp_lease_documents rows. Existing rows are upserted by document_type;
 * extra docs in the template are inserted.
 */
export async function applyTemplateToLease(
  leaseId: string,
  templateId: string
) {
  const auth = await requireLandlord();
  if (!auth.ok) return { success: false as const, error: auth.error };

  // Fetch lease + property
  const { data: lease } = await auth.supabase
    .from("rp_leases")
    .select(
      "id, property_id, lease_type, start_date, end_date, monthly_rent, currency_code, security_deposit, deposit_paid_date, utility_split_percent, internet_included, pets_allowed, smoking_allowed, max_occupants, late_fee_type, late_fee_amount, signing_status, rp_properties!inner(landlord_id, address_line1, address_line2, city, province_state, postal_code, unit_description)"
    )
    .eq("id", leaseId)
    .single();
  if (!lease) return { success: false as const, error: "Lease not found" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const property = lease.rp_properties as any;
  if (property.landlord_id !== auth.rpUser.id) {
    return { success: false as const, error: "Not authorized" };
  }

  if (lease.signing_status && lease.signing_status !== "draft") {
    return {
      success: false as const,
      error: "Cannot apply a template — this lease has already been sent for signing.",
    };
  }

  // Fetch template
  const { data: template } = await auth.supabase
    .from("rp_lease_templates")
    .select("id, landlord_id, defaults, documents")
    .eq("id", templateId)
    .single();
  if (!template) return { success: false as const, error: "Template not found" };

  // Fetch tenants + property owners
  const { data: leaseTenants } = await auth.supabase
    .from("rp_lease_tenants")
    .select("rp_users!inner(first_name, last_name, email, phone)")
    .eq("lease_id", leaseId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenants: PersonInput[] = (leaseTenants ?? []).map((lt) => lt.rp_users as any);

  const { data: propertyOwners } = await auth.supabase
    .from("rp_property_owners")
    .select("designation, rp_users!inner(first_name, last_name, email, phone)")
    .eq("property_id", lease.property_id)
    .in("designation", ["owner", "signing_authority"]);

  const owners: OwnerInput[] | undefined =
    propertyOwners && propertyOwners.length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        propertyOwners.map((o: any) => ({
          first_name: o.rp_users.first_name,
          last_name: o.rp_users.last_name,
          email: o.rp_users.email,
          phone: o.rp_users.phone,
          designation: o.designation,
        }))
      : undefined;

  const ctx = buildRenderContext({
    lease: {
      start_date: lease.start_date,
      end_date: lease.end_date,
      monthly_rent: Number(lease.monthly_rent ?? 0),
      currency_code: lease.currency_code ?? "CAD",
      security_deposit: Number(lease.security_deposit ?? 0),
      deposit_paid_date: lease.deposit_paid_date,
      utility_split_percent: lease.utility_split_percent
        ? Number(lease.utility_split_percent)
        : null,
      max_occupants: lease.max_occupants ? Number(lease.max_occupants) : null,
      late_fee_amount: lease.late_fee_amount
        ? Number(lease.late_fee_amount)
        : null,
    } as LeaseFormInput,
    property: {
      address_line1: property.address_line1,
      address_line2: property.address_line2,
      city: property.city,
      province_state: property.province_state,
      postal_code: property.postal_code,
      unit_description: property.unit_description,
    } as PropertyInput,
    landlord: {
      first_name: auth.rpUser.first_name,
      last_name: auth.rpUser.last_name,
      email: auth.rpUser.email,
      phone: auth.rpUser.phone,
    } as PersonInput,
    owners,
    tenants,
    permittedOccupant: null,
    defaults: (template.defaults ?? {}) as LandlordTemplateDefaults,
  });

  const rendered = renderTemplateDocuments(
    (template.documents ?? []) as LandlordTemplateDocument[],
    ctx
  );

  // Replace existing rp_lease_documents rows for this lease with the
  // rendered set. Drafts only — verified above by signing_status check.
  const { data: existingDocs } = await auth.supabase
    .from("rp_lease_documents")
    .select("id, document_type")
    .eq("lease_id", leaseId);

  // Update existing docs by document_type when possible; insert any extras.
  const existingByType = new Map(
    (existingDocs ?? []).map((d) => [d.document_type, d.id])
  );

  for (const doc of rendered) {
    const existingId = existingByType.get(doc.document_type);
    if (existingId) {
      await auth.supabase
        .from("rp_lease_documents")
        .update({
          title: doc.title,
          sort_order: doc.sort_order,
          document_content: doc.document_content,
          template_id: null, // landlord templates are not in rp_document_templates
          template_version: (doc.document_content as LeaseDocumentContent)
            .templateVersion,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingId);
      existingByType.delete(doc.document_type);
    } else {
      await auth.supabase.from("rp_lease_documents").insert({
        lease_id: leaseId,
        document_type: doc.document_type,
        title: doc.title,
        sort_order: doc.sort_order,
        document_content: doc.document_content,
        template_version: (doc.document_content as LeaseDocumentContent)
          .templateVersion,
        signing_status: "draft",
        created_by: auth.rpUser.id,
      });
    }
  }

  // Mirror the lease_agreement content onto the legacy column for any
  // older code paths that still read rp_leases.lease_document_content.
  const leaseAgreement = rendered.find(
    (d) => d.document_type === "lease_agreement"
  );
  if (leaseAgreement) {
    await auth.supabase
      .from("rp_leases")
      .update({ lease_document_content: leaseAgreement.document_content })
      .eq("id", leaseId);
  }

  revalidatePath(`/admin/leases/${leaseId}/document`);
  return { success: true as const };
}

/**
 * Snapshot the current lease's rp_lease_documents into a new landlord
 * template the user can reuse for future leases.
 */
export async function saveLeaseAsTemplate(
  leaseId: string,
  payload: { name: string; description?: string | null }
) {
  const auth = await requireLandlord();
  if (!auth.ok) return { success: false as const, error: auth.error };

  const name = payload.name?.trim();
  if (!name) return { success: false as const, error: "Template name is required" };

  const { data: lease } = await auth.supabase
    .from("rp_leases")
    .select(
      "id, property_id, utility_split_percent, internet_included, pets_allowed, smoking_allowed, max_occupants, late_fee_type, late_fee_amount, holdover_rent, rent_due_day, rp_properties!inner(landlord_id, province_state, country_code)"
    )
    .eq("id", leaseId)
    .single();
  if (!lease) return { success: false as const, error: "Lease not found" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const property = lease.rp_properties as any;
  if (property.landlord_id !== auth.rpUser.id) {
    return { success: false as const, error: "Not authorized" };
  }

  const { data: docs } = await auth.supabase
    .from("rp_lease_documents")
    .select("document_type, title, sort_order, document_content")
    .eq("lease_id", leaseId)
    .order("sort_order");

  const documents: LandlordTemplateDocument[] = (docs ?? [])
    .filter((d) => d.document_content)
    .map((d) => ({
      document_type: d.document_type as LandlordTemplateDocument["document_type"],
      title: d.title,
      sort_order: d.sort_order,
      document_content: d.document_content as LeaseDocumentContent,
    }));

  if (documents.length === 0) {
    return {
      success: false as const,
      error: "This lease has no document content yet. Regenerate documents before saving as a template.",
    };
  }

  const defaults: LandlordTemplateDefaults = {
    utility_split_percent: lease.utility_split_percent
      ? Number(lease.utility_split_percent)
      : undefined,
    internet_included: lease.internet_included ?? undefined,
    pets_allowed: lease.pets_allowed ?? undefined,
    smoking_allowed: lease.smoking_allowed ?? undefined,
    max_occupants: lease.max_occupants ? Number(lease.max_occupants) : undefined,
    late_fee_type: (lease.late_fee_type ?? undefined) as
      | "flat"
      | "percentage"
      | "none"
      | undefined,
    late_fee_amount: lease.late_fee_amount
      ? Number(lease.late_fee_amount)
      : undefined,
    holdover_rent: lease.holdover_rent ? Number(lease.holdover_rent) : null,
    rent_due_day: lease.rent_due_day ? Number(lease.rent_due_day) : undefined,
  };

  const { data, error } = await auth.supabase
    .from("rp_lease_templates")
    .insert({
      landlord_id: auth.rpUser.id,
      name,
      description: payload.description ?? null,
      province_code: property.province_state ?? "AB",
      country_code: property.country_code ?? "CA",
      version: "1.0",
      is_active: true,
      defaults,
      documents,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false as const, error: error?.message ?? "Failed to save template" };
  }

  revalidatePath("/admin/lease-templates");
  return { success: true as const, templateId: data.id };
}
