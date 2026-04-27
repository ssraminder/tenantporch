"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { sendSigningEmail } from "@/lib/email";
import crypto from "crypto";

function hashDocument(content: unknown): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(content))
    .digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Send a specific lease document for electronic signatures.
 * Creates a signing request linked to the rp_lease_documents row.
 */
export async function sendDocumentForSignatures(
  documentId: string,
  options?: { overrideIdCheck?: boolean }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id, first_name, last_name, email")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser) {
      return { success: false, error: "User profile not found" };
    }

    // Fetch the lease document
    const { data: leaseDoc } = await supabase
      .from("rp_lease_documents")
      .select("id, lease_id, document_type, title, document_content, signing_status")
      .eq("id", documentId)
      .single();

    if (!leaseDoc) {
      return { success: false, error: "Document not found" };
    }

    if (leaseDoc.signing_status !== "draft") {
      return {
        success: false,
        error: "This document has already been sent for signatures",
      };
    }

    if (!leaseDoc.document_content) {
      return { success: false, error: "No document content to sign" };
    }

    // Fetch lease with property ownership check
    const { data: lease } = await supabase
      .from("rp_leases")
      .select(
        "id, property_id, rp_properties(landlord_id, address_line1)"
      )
      .eq("id", leaseDoc.lease_id)
      .single();

    if (!lease) {
      return { success: false, error: "Lease not found" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const landlordId = (lease.rp_properties as any)?.landlord_id;
    if (landlordId !== rpUser.id) {
      return { success: false, error: "You do not own this property" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const propertyAddress = (lease.rp_properties as any)?.address_line1 ?? "Property";

    // Check tenant IDs
    const { data: leaseTenants } = await supabase
      .from("rp_lease_tenants")
      .select(
        "user_id, role, rp_users(id, first_name, last_name, email, id_document_status)"
      )
      .eq("lease_id", lease.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tenants = (leaseTenants ?? [])
      .filter((lt) => lt.role !== "occupant")
      .map((lt) => lt.rp_users as any)
      .filter(Boolean);

    const unverified = tenants.filter(
      (t: any) => t.id_document_status !== "approved"
    );
    if (unverified.length > 0 && !options?.overrideIdCheck) {
      const names = unverified
        .map((t: any) => `${t.first_name} ${t.last_name}`)
        .join(", ");
      return {
        success: false,
        error: `The following tenants need approved ID before signing: ${names}`,
      };
    }

    // Create document hash
    const documentHash = hashDocument(leaseDoc.document_content);

    // Fetch property owners with signing authority
    const { data: propertyOwners } = await supabase
      .from("rp_property_owners")
      .select(
        "user_id, designation, rp_users!inner(first_name, last_name, email)"
      )
      .eq("property_id", lease.property_id)
      .in("designation", ["owner", "signing_authority"]);

    const landlordSigners =
      propertyOwners && propertyOwners.length > 0
        ? propertyOwners.map((o) => ({
            name: `${(o.rp_users as any).first_name} ${(o.rp_users as any).last_name}`,
            email: (o.rp_users as any).email,
          }))
        : [
            {
              name: `${rpUser.first_name} ${rpUser.last_name}`,
              email: rpUser.email,
            },
          ];

    // Create signing request with lease_document_id
    const { data: signingRequest, error: srError } = await supabase
      .from("rp_signing_requests")
      .insert({
        lease_id: lease.id,
        lease_document_id: documentId,
        document_hash: documentHash,
        status: "sent",
        created_by: rpUser.id,
        expires_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .select("id")
      .single();

    if (srError || !signingRequest) {
      return {
        success: false,
        error: srError?.message ?? "Failed to create signing request",
      };
    }

    // Create participants: tenants first, then landlords
    const participants = [
      ...tenants.map((t: any, i: number) => ({
        signing_request_id: signingRequest.id,
        signer_name: `${t.first_name} ${t.last_name}`,
        signer_email: t.email,
        signer_role: "tenant",
        signing_order: i + 1,
        token: generateToken(),
        status: "pending",
      })),
      ...landlordSigners.map((ls, i) => ({
        signing_request_id: signingRequest.id,
        signer_name: ls.name,
        signer_email: ls.email,
        signer_role: "landlord",
        signing_order: tenants.length + i + 1,
        token: generateToken(),
        status: "pending",
      })),
    ];

    const { data: insertedParticipants, error: partError } = await supabase
      .from("rp_signing_participants")
      .insert(participants)
      .select("id, signer_name, signer_email, signer_role, token");

    if (partError) {
      return { success: false, error: partError.message };
    }

    // Update the lease document signing status + link signing request
    await supabase
      .from("rp_lease_documents")
      .update({
        signing_status: "sent",
        signing_request_id: signingRequest.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    // Audit log
    await supabase.from("rp_signing_audit_log").insert({
      signing_request_id: signingRequest.id,
      action: "signing_request_created",
      metadata: {
        document_id: documentId,
        document_type: leaseDoc.document_type,
        document_title: leaseDoc.title,
        participant_count: participants.length,
        tenant_count: tenants.length,
        unverified_tenants: unverified.map((t: any) => t.email),
        override_id_check: options?.overrideIdCheck ?? false,
      },
    });

    // Send signing emails to tenants first
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://tenantporch.com";

    const tenantParticipants = (insertedParticipants ?? []).filter(
      (p) => p.signer_role === "tenant"
    );

    for (const tp of tenantParticipants) {
      try {
        const emailResult = await sendSigningEmail({
          to: tp.signer_email,
          signerName: tp.signer_name,
          signerRole: "tenant",
          propertyAddress,
          landlordName: `${rpUser.first_name} ${rpUser.last_name}`,
          landlordEmail: rpUser.email,
          signingUrl: `${appUrl}/sign/${tp.token}`,
          expiresAt:
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        // Update notified_at
        await supabase
          .from("rp_signing_participants")
          .update({ notified_at: new Date().toISOString() })
          .eq("id", tp.id);

        if (emailResult.data?.id) {
          await supabase.from("rp_email_logs").insert({
            signing_request_id: signingRequest.id,
            participant_id: tp.id,
            recipient_email: tp.signer_email,
            recipient_name: tp.signer_name,
            email_type: "signing_request",
            resend_message_id: emailResult.data.id,
            status: "sent",
            subject: `Sign ${leaseDoc.title} for ${propertyAddress}`,
          });
        }
      } catch {
        // Email failure should not break the signing flow
      }
    }

    // Notify tenants in-app
    for (const t of tenants) {
      await createNotification(supabase, {
        userId: t.id,
        title: "Document Sent for Signing",
        body: `"${leaseDoc.title}" for ${propertyAddress} has been sent for your signature.`,
        type: "lease",
        urgency: "high",
      });
    }

    revalidatePath(`/admin/leases/${lease.id}/document`);
    return { success: true, signingRequestId: signingRequest.id };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Mark a document as signed offline.
 * Optionally upload a scanned signed PDF.
 */
export async function markDocumentSignedOffline(
  documentId: string,
  formData?: FormData
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser) {
      return { success: false, error: "User profile not found" };
    }

    // Fetch document and verify ownership
    const { data: leaseDoc } = await supabase
      .from("rp_lease_documents")
      .select("id, lease_id, title, signing_status, document_type")
      .eq("id", documentId)
      .single();

    if (!leaseDoc) {
      return { success: false, error: "Document not found" };
    }

    if (
      leaseDoc.signing_status !== "draft" &&
      leaseDoc.signing_status !== "sent"
    ) {
      return {
        success: false,
        error: "This document is already signed",
      };
    }

    const { data: lease } = await supabase
      .from("rp_leases")
      .select("id, property_id, rp_properties(landlord_id)")
      .eq("id", leaseDoc.lease_id)
      .single();

    if (!lease) {
      return { success: false, error: "Lease not found" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((lease.rp_properties as any)?.landlord_id !== rpUser.id) {
      return { success: false, error: "Not authorized" };
    }

    let signedPdfUrl: string | null = null;

    // Handle optional file upload
    const file = formData?.get("file") as File | null;
    if (file && file.size > 0) {
      if (file.type !== "application/pdf") {
        return { success: false, error: "Only PDF files are accepted" };
      }
      if (file.size > 20 * 1024 * 1024) {
        return { success: false, error: "File size must be under 20MB" };
      }

      // Storage path mirrors the online signing path:
      // <property_id>/<document_type>/<timestamp>_Signed_<slug>.pdf
      const docType = (leaseDoc.document_type as string) || "lease_agreement";
      const category =
        docType === "schedule_a"
          ? "schedule_a"
          : docType === "schedule_b"
            ? "schedule_b"
            : docType === "lease_agreement"
              ? "lease"
              : "other";
      const slug =
        leaseDoc.title.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "") ||
        docType ||
        "Document";
      const filePath = `${lease.property_id}/${category}/${Date.now()}_Signed_${slug}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        return { success: false, error: `Upload failed: ${uploadError.message}` };
      }

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);
      signedPdfUrl = urlData.publicUrl;

      // Also create rp_documents record
      await supabase.from("rp_documents").insert({
        property_id: lease.property_id,
        lease_id: lease.id,
        uploaded_by: rpUser.id,
        category,
        title: `Signed ${leaseDoc.title}`,
        file_url: signedPdfUrl,
        file_size: file.size,
        mime_type: "application/pdf",
        visible_to_tenant: true,
      });
    }

    // If there's an active signing request for this document, cancel it
    if (leaseDoc.signing_status === "sent") {
      await supabase
        .from("rp_signing_requests")
        .update({ status: "cancelled" })
        .eq("lease_document_id", documentId)
        .in("status", ["sent", "partially_signed"]);
    }

    // Update the lease document
    await supabase
      .from("rp_lease_documents")
      .update({
        signing_status: "signed_offline",
        signed_offline_at: new Date().toISOString(),
        signed_offline_by: rpUser.id,
        signed_pdf_url: signedPdfUrl,
        signing_request_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    revalidatePath(`/admin/leases/${leaseDoc.lease_id}/document`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Cancel a per-document signing request.
 */
export async function cancelDocumentSigning(documentId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser) {
      return { success: false, error: "User profile not found" };
    }

    // Fetch document
    const { data: leaseDoc } = await supabase
      .from("rp_lease_documents")
      .select("id, lease_id, signing_status, signing_request_id")
      .eq("id", documentId)
      .single();

    if (!leaseDoc) {
      return { success: false, error: "Document not found" };
    }

    if (
      leaseDoc.signing_status !== "sent" &&
      leaseDoc.signing_status !== "partially_signed"
    ) {
      return { success: false, error: "No active signing to cancel" };
    }

    // Verify ownership
    const { data: lease } = await supabase
      .from("rp_leases")
      .select("id, property_id, rp_properties(landlord_id)")
      .eq("id", leaseDoc.lease_id)
      .single();

    if (!lease) {
      return { success: false, error: "Lease not found" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((lease.rp_properties as any)?.landlord_id !== rpUser.id) {
      return { success: false, error: "Not authorized" };
    }

    // Cancel the signing request
    if (leaseDoc.signing_request_id) {
      await supabase
        .from("rp_signing_requests")
        .update({ status: "cancelled" })
        .eq("id", leaseDoc.signing_request_id);
    }

    // Reset document to draft
    await supabase
      .from("rp_lease_documents")
      .update({
        signing_status: "draft",
        signing_request_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    // Audit log
    if (leaseDoc.signing_request_id) {
      await supabase.from("rp_signing_audit_log").insert({
        signing_request_id: leaseDoc.signing_request_id,
        action: "signing_cancelled",
        metadata: { document_id: documentId, cancelled_by: rpUser.id },
      });
    }

    revalidatePath(`/admin/leases/${leaseDoc.lease_id}/document`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
