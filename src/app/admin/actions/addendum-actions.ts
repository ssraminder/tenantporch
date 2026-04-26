"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { sendSigningEmail } from "@/lib/email";
import {
  generateAlbertaAddendumContent,
  type AddendumDocumentContent,
} from "@/lib/lease-templates/alberta-addendum";
import crypto from "crypto";

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashDocument(content: unknown): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(content))
    .digest("hex");
}

/**
 * Create a new addendum for a lease.
 */
export async function createAddendum(formData: FormData) {
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

    const leaseId = formData.get("lease_id") as string;
    const addendumType = formData.get("addendum_type") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const additionalRentAmount =
      parseFloat(formData.get("additional_rent_amount") as string) || 0;
    const effectiveFrom = formData.get("effective_from") as string;
    const effectiveTo = (formData.get("effective_to") as string) || null;
    const occupantName = (formData.get("occupant_name") as string) || undefined;
    const petDescription =
      (formData.get("pet_description") as string) || undefined;
    const sendForSigning = formData.get("send_for_signing") === "true";

    if (!leaseId || !addendumType || !title || !effectiveFrom) {
      return {
        success: false,
        error: "Lease, type, title, and effective date are required",
      };
    }

    // Fetch lease + property + verify ownership
    const { data: lease, error: leaseError } = await supabase
      .from("rp_leases")
      .select(
        "id, property_id, start_date, end_date, monthly_rent, currency_code, rp_properties(id, landlord_id, address_line1, city, province_state, postal_code)"
      )
      .eq("id", leaseId)
      .single();

    if (leaseError || !lease) {
      return { success: false, error: "Lease not found" };
    }

    const property = lease.rp_properties as any;
    if (property?.landlord_id !== rpUser.id) {
      return { success: false, error: "You do not own this property" };
    }

    // Fetch tenants on the lease
    const { data: leaseTenants } = await supabase
      .from("rp_lease_tenants")
      .select("user_id, rp_users(first_name, last_name, email)")
      .eq("lease_id", leaseId);

    const tenants = (leaseTenants ?? [])
      .map((lt) => lt.rp_users as any)
      .filter(Boolean);

    // Generate addendum document content
    const documentContent = generateAlbertaAddendumContent({
      addendumType,
      title,
      description,
      additionalRentAmount,
      currencyCode: lease.currency_code ?? "CAD",
      effectiveFrom,
      effectiveTo,
      lease: {
        startDate: lease.start_date,
        endDate: lease.end_date,
        monthlyRent: Number(lease.monthly_rent),
      },
      property: {
        addressLine1: property.address_line1,
        city: property.city,
        provinceState: property.province_state,
        postalCode: property.postal_code,
      },
      landlord: {
        firstName: rpUser.first_name,
        lastName: rpUser.last_name,
      },
      tenants: tenants.map((t: any) => ({
        firstName: t.first_name,
        lastName: t.last_name,
      })),
      occupantName,
      petDescription,
    });

    // Insert addendum
    const { data: addendum, error: insertError } = await supabase
      .from("rp_addendums")
      .insert({
        lease_id: leaseId,
        property_id: lease.property_id,
        addendum_type: addendumType,
        title,
        description,
        additional_rent_amount: additionalRentAmount,
        currency_code: lease.currency_code ?? "CAD",
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        status: "draft",
        document_content: documentContent,
        created_by: rpUser.id,
      })
      .select("id")
      .single();

    if (insertError || !addendum) {
      return {
        success: false,
        error: insertError?.message ?? "Failed to create addendum",
      };
    }

    // If requested, immediately send for signing
    if (sendForSigning) {
      const signResult = await sendAddendumForSigning(addendum.id);
      if (!signResult.success) {
        // Addendum created but signing failed
        revalidatePath(`/admin/properties/${lease.property_id}`);
        return {
          success: true,
          addendumId: addendum.id,
          warning: `Addendum created but signing failed: ${signResult.error}`,
        };
      }
    }

    revalidatePath(`/admin/properties/${lease.property_id}`);
    revalidatePath(`/admin/leases/${leaseId}/document`);

    return { success: true, addendumId: addendum.id };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Send an addendum for electronic signatures.
 */
export async function sendAddendumForSigning(addendumId: string) {
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

    // Fetch addendum
    const { data: addendum, error: addError } = await supabase
      .from("rp_addendums")
      .select(
        "id, lease_id, property_id, title, status, document_content, rp_properties(landlord_id, address_line1)"
      )
      .eq("id", addendumId)
      .single();

    if (addError || !addendum) {
      return { success: false, error: "Addendum not found" };
    }

    if ((addendum.rp_properties as any)?.landlord_id !== rpUser.id) {
      return { success: false, error: "You do not own this property" };
    }

    if (addendum.status !== "draft") {
      return { success: false, error: "Addendum has already been sent" };
    }

    // Fetch tenants from lease (excluding occupants for signing)
    const { data: leaseTenants } = await supabase
      .from("rp_lease_tenants")
      .select("user_id, role, rp_users(id, first_name, last_name, email)")
      .eq("lease_id", addendum.lease_id);

    const signingTenants = (leaseTenants ?? [])
      .filter((lt) => lt.role !== "occupant")
      .map((lt) => lt.rp_users as any)
      .filter(Boolean);

    // Create signing request
    const documentHash = hashDocument(addendum.document_content);

    const { data: signingRequest, error: srError } = await supabase
      .from("rp_signing_requests")
      .insert({
        lease_id: addendum.lease_id,
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

    // Match the lease-document signing flow: tenants sign first (order 1..n),
    // then landlord (order n+1). submitSignature's "all tenants signed →
    // email the landlord" handler then naturally fires for addendums too.
    const participants = [
      ...signingTenants.map((t: any, i: number) => ({
        signing_request_id: signingRequest.id,
        signer_name: `${t.first_name} ${t.last_name}`,
        signer_email: t.email,
        signer_role: "tenant",
        signing_order: i + 1,
        token: generateToken(),
        status: "pending",
      })),
      {
        signing_request_id: signingRequest.id,
        signer_name: `${rpUser.first_name} ${rpUser.last_name}`,
        signer_email: rpUser.email,
        signer_role: "landlord",
        signing_order: signingTenants.length + 1,
        token: generateToken(),
        status: "pending",
      },
    ];

    const { data: insertedParticipants } = await supabase
      .from("rp_signing_participants")
      .insert(participants)
      .select("id, signer_name, signer_email, signer_role, token");

    // Update addendum
    await supabase
      .from("rp_addendums")
      .update({
        status: "sent",
        signing_request_id: signingRequest.id,
      })
      .eq("id", addendumId);

    // Audit log
    await supabase.from("rp_signing_audit_log").insert({
      signing_request_id: signingRequest.id,
      action: "addendum_signing_request_created",
      metadata: {
        addendum_id: addendumId,
        title: addendum.title,
        participant_count: participants.length,
      },
    });

    // Notify tenants
    const propertyAddress =
      (addendum.rp_properties as any)?.address_line1 ?? "your property";
    for (const t of signingTenants) {
      await createNotification(supabase, {
        userId: t.id,
        title: "Addendum Ready for Signing",
        body: `A lease addendum "${addendum.title}" for ${propertyAddress} requires your signature.`,
        type: "lease",
        urgency: "high",
      });
    }

    // Send signing emails to tenants first. Landlord receives their link
    // automatically once every tenant has signed (via submitSignature).
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://tenantporch.vercel.app";
    const expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    const tenantParticipants = (insertedParticipants ?? []).filter(
      (p) => p.signer_role === "tenant"
    );
    const landlordName = `${rpUser.first_name} ${rpUser.last_name}`;
    const landlordEmail = rpUser.email;

    for (const tp of tenantParticipants) {
      try {
        const emailResult = await sendSigningEmail({
          to: tp.signer_email,
          signerName: tp.signer_name,
          signerRole: "tenant",
          propertyAddress,
          landlordName,
          landlordEmail,
          signingUrl: `${appUrl}/sign/${tp.token}`,
          expiresAt,
        });

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
            subject: `Action Required: Sign Addendum "${addendum.title}" for ${propertyAddress}`,
          });
        }
      } catch {
        // Email failure should not break the signing flow
      }
    }

    revalidatePath(`/admin/properties/${addendum.property_id}`);

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
 * Cancel an addendum (revert to draft or mark cancelled).
 */
export async function cancelAddendum(addendumId: string) {
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

    const { data: addendum } = await supabase
      .from("rp_addendums")
      .select(
        "id, property_id, signing_request_id, status, rp_properties(landlord_id)"
      )
      .eq("id", addendumId)
      .single();

    if (!addendum) {
      return { success: false, error: "Addendum not found" };
    }

    if ((addendum.rp_properties as any)?.landlord_id !== rpUser.id) {
      return { success: false, error: "You do not own this property" };
    }

    if (addendum.status === "signed") {
      return { success: false, error: "Cannot cancel a signed addendum" };
    }

    // Cancel signing request if exists
    if (addendum.signing_request_id) {
      await supabase
        .from("rp_signing_requests")
        .update({ status: "cancelled" })
        .eq("id", addendum.signing_request_id);
    }

    await supabase
      .from("rp_addendums")
      .update({ status: "cancelled" })
      .eq("id", addendumId);

    revalidatePath(`/admin/properties/${addendum.property_id}`);

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
 * Get active addendums for a lease to calculate effective rent.
 * Returns the total additional rent from all active addendums.
 */
export async function getActiveAddendumRent(leaseId: string): Promise<number> {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const { data: addendums } = await supabase
      .from("rp_addendums")
      .select("additional_rent_amount, effective_from, effective_to")
      .eq("lease_id", leaseId)
      .eq("status", "signed")
      .lte("effective_from", today);

    if (!addendums) return 0;

    return addendums
      .filter(
        (a) => !a.effective_to || a.effective_to >= today
      )
      .reduce((sum, a) => sum + Number(a.additional_rent_amount ?? 0), 0);
  } catch {
    return 0;
  }
}
