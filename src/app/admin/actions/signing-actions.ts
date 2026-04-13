"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { sendSigningEmail, sendSigningCompletionEmail } from "@/lib/email";
import { generateLeaseBuffer } from "@/lib/pdf/generate-lease-pdf";
import type { SignatureInfo } from "@/lib/pdf/generate-lease-pdf";
import crypto from "crypto";

/**
 * Generate a SHA-256 hash of the lease document content.
 */
function hashDocument(content: unknown): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(content))
    .digest("hex");
}

/**
 * Generate a cryptographically secure token for signing links.
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Send a lease for electronic signatures.
 * Creates signing request + participants, notifies all parties.
 */
export async function sendForSignatures(
  leaseId: string,
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

    // Fetch lease with property ownership check
    const { data: lease, error: leaseError } = await supabase
      .from("rp_leases")
      .select(
        "id, property_id, signing_status, lease_document_content, rp_properties(landlord_id, address_line1)"
      )
      .eq("id", leaseId)
      .single();

    if (leaseError || !lease) {
      return { success: false, error: "Lease not found" };
    }

    const landlordId = (lease.rp_properties as any)?.landlord_id;
    if (landlordId !== rpUser.id) {
      return { success: false, error: "You do not own this property" };
    }

    if (lease.signing_status !== "draft") {
      return {
        success: false,
        error: "Lease has already been sent for signatures",
      };
    }

    if (!lease.lease_document_content) {
      return { success: false, error: "No lease document to sign" };
    }

    // Check all tenants have approved IDs
    const { data: leaseTenants } = await supabase
      .from("rp_lease_tenants")
      .select(
        "user_id, role, rp_users(id, first_name, last_name, email, id_document_status)"
      )
      .eq("lease_id", leaseId);

    const tenants = (leaseTenants ?? [])
      .filter((lt) => lt.role !== "occupant")
      .map((lt) => lt.rp_users as any)
      .filter(Boolean);

    const unverified = tenants.filter(
      (t) => t.id_document_status !== "approved"
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
    const documentHash = hashDocument(lease.lease_document_content);

    // Fetch property owners with signing authority (owner + signing_authority)
    const { data: propertyOwners } = await supabase
      .from("rp_property_owners")
      .select(
        "user_id, designation, is_primary, rp_users!inner(first_name, last_name, email)"
      )
      .eq("property_id", lease.property_id)
      .in("designation", ["owner", "signing_authority"]);

    // Build landlord signers: use property owners if available, otherwise fallback to current user
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

    // Create signing request
    const { data: signingRequest, error: srError } = await supabase
      .from("rp_signing_requests")
      .insert({
        lease_id: leaseId,
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

    // Create participants: tenants first, then landlord/owners
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

    // Update lease signing_status
    await supabase
      .from("rp_leases")
      .update({
        signing_status: "sent",
        sent_for_signing_at: new Date().toISOString(),
      })
      .eq("id", leaseId);

    // Audit log
    await supabase.from("rp_signing_audit_log").insert({
      signing_request_id: signingRequest.id,
      action: "signing_request_created",
      metadata: {
        lease_id: leaseId,
        participant_count: participants.length,
        created_by: rpUser.id,
        ...(unverified.length > 0 && options?.overrideIdCheck
          ? {
              id_verification_overridden: true,
              unverified_tenants: unverified.map(
                (t: any) => `${t.first_name} ${t.last_name}`
              ),
            }
          : {}),
      },
    });

    const propertyAddress =
      (lease.rp_properties as any)?.address_line1 ?? "your property";
    const landlordName = `${rpUser.first_name} ${rpUser.last_name}`;
    const landlordEmail = rpUser.email;
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://tenantporch.vercel.app";
    const expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Send signing emails to tenants ONLY (landlord signs after all tenants)
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
          landlordName,
          landlordEmail,
          signingUrl: `${appUrl}/sign/${tp.token}`,
          expiresAt,
        });

        // Update notified_at
        await supabase
          .from("rp_signing_participants")
          .update({ notified_at: new Date().toISOString() })
          .eq("id", tp.id);

        // Log the email
        if (emailResult.data?.id) {
          await supabase.from("rp_email_logs").insert({
            signing_request_id: signingRequest.id,
            participant_id: tp.id,
            recipient_email: tp.signer_email,
            recipient_name: tp.signer_name,
            email_type: "signing_request",
            resend_message_id: emailResult.data.id,
            status: "sent",
            subject: `Action Required: Sign Your Lease for ${propertyAddress}`,
          });
        }
      } catch {
        // Email failure should not break the signing flow
      }
    }

    // Create in-app notifications for tenants
    for (const t of tenants) {
      await createNotification(supabase, {
        userId: t.id,
        title: "Lease Ready for Signing",
        body: `Your lease for ${propertyAddress} is ready for electronic signature. Check your email for the signing link.`,
        type: "lease",
        urgency: "high",
      });
    }

    revalidatePath(`/admin/leases/${leaseId}/document`);
    revalidatePath(`/admin/properties/${lease.property_id}`);

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
 * Look up a signing participant by token (used on the public signing page).
 */
export async function getSigningData(token: string) {
  try {
    const supabase = await createClient();

    // Find participant by token
    const { data: participant, error: pError } = await supabase
      .from("rp_signing_participants")
      .select(
        "id, signing_request_id, signer_name, signer_email, signer_role, signing_order, status, signed_at, token"
      )
      .eq("token", token)
      .single();

    if (pError || !participant) {
      return { success: false, error: "Invalid signing link" };
    }

    if (participant.status === "signed") {
      return { success: false, error: "already_signed" };
    }

    // Get signing request + lease
    const { data: signingRequest } = await supabase
      .from("rp_signing_requests")
      .select(
        "id, lease_id, status, expires_at, document_hash"
      )
      .eq("id", participant.signing_request_id)
      .single();

    if (!signingRequest) {
      return { success: false, error: "Signing request not found" };
    }

    // Check for per-document signing (lease_document_id may not exist yet)
    let leaseDocumentId: string | null = null;
    try {
      const { data: srExtra } = await supabase
        .from("rp_signing_requests")
        .select("lease_document_id")
        .eq("id", signingRequest.id)
        .single();
      leaseDocumentId = srExtra?.lease_document_id ?? null;
    } catch {
      // Column may not exist yet — safe to ignore
    }

    // Check expiry
    if (
      signingRequest.expires_at &&
      new Date(signingRequest.expires_at) < new Date()
    ) {
      return { success: false, error: "This signing link has expired" };
    }

    if (
      signingRequest.status === "completed" ||
      signingRequest.status === "cancelled"
    ) {
      return {
        success: false,
        error:
          signingRequest.status === "completed"
            ? "already_signed"
            : "This signing request has been cancelled",
      };
    }

    // Fetch lease
    const { data: lease } = await supabase
      .from("rp_leases")
      .select(
        "id, lease_document_content, monthly_rent, currency_code, start_date, end_date, lease_type, property_id"
      )
      .eq("id", signingRequest.lease_id)
      .single();

    if (!lease) {
      return { success: false, error: "Lease not found" };
    }

    // Determine document content: use specific document if lease_document_id set, else fall back to lease
    let documentContent = lease.lease_document_content;
    let documentTitle = "Residential Lease Agreement";

    if (leaseDocumentId) {
      const { data: leaseDoc } = await supabase
        .from("rp_lease_documents")
        .select("document_content, title")
        .eq("id", leaseDocumentId)
        .single();

      if (leaseDoc?.document_content) {
        documentContent = leaseDoc.document_content;
        documentTitle = leaseDoc.title;
      }
    }

    // Fetch property
    const { data: property } = await supabase
      .from("rp_properties")
      .select("address_line1, city, province_state, postal_code")
      .eq("id", lease.property_id)
      .single();

    // Fetch all participants for progress display
    const { data: allParticipants } = await supabase
      .from("rp_signing_participants")
      .select(
        "id, signer_name, signer_role, signing_order, status, signed_at"
      )
      .eq("signing_request_id", signingRequest.id)
      .order("signing_order");

    return {
      success: true,
      participant: {
        id: participant.id,
        signerName: participant.signer_name,
        signerEmail: participant.signer_email,
        signerRole: participant.signer_role,
        signingOrder: participant.signing_order,
      },
      lease: {
        documentContent,
        monthlyRent: lease.monthly_rent,
        currencyCode: lease.currency_code,
        startDate: lease.start_date,
        endDate: lease.end_date,
        leaseType: lease.lease_type,
      },
      documentTitle,
      property: property
        ? {
            address: [
              property.address_line1,
              property.city,
              property.province_state,
              property.postal_code,
            ]
              .filter(Boolean)
              .join(", "),
          }
        : null,
      signingRequest: {
        id: signingRequest.id,
        expiresAt: signingRequest.expires_at,
      },
      participants: (allParticipants ?? []).map((p) => ({
        id: p.id,
        signerName: p.signer_name,
        signerRole: p.signer_role,
        signingOrder: p.signing_order,
        status: p.status,
        signedAt: p.signed_at,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Submit a signature for a lease.
 */
export async function submitSignature(
  token: string,
  signatureData: {
    method: "type" | "draw" | "upload";
    signedName: string;
    signatureImageUrl?: string;
  },
  clientInfo?: { ipAddress?: string; userAgent?: string }
) {
  try {
    const supabase = await createClient();

    // Find participant
    const { data: participant, error: pError } = await supabase
      .from("rp_signing_participants")
      .select("id, signing_request_id, signer_name, status, signer_role")
      .eq("token", token)
      .single();

    if (pError || !participant) {
      return { success: false, error: "Invalid signing token" };
    }

    if (participant.status === "signed") {
      return { success: false, error: "You have already signed this document" };
    }

    // Get signing request
    const { data: signingRequest } = await supabase
      .from("rp_signing_requests")
      .select("id, lease_id, status, expires_at")
      .eq("id", participant.signing_request_id)
      .single();

    if (!signingRequest) {
      return { success: false, error: "Signing request not found" };
    }

    // Check for per-document signing (lease_document_id may not exist yet)
    let leaseDocumentId: string | null = null;
    try {
      const { data: srExtra } = await supabase
        .from("rp_signing_requests")
        .select("lease_document_id")
        .eq("id", signingRequest.id)
        .single();
      leaseDocumentId = srExtra?.lease_document_id ?? null;
    } catch {
      // Column may not exist yet
    }

    if (
      signingRequest.expires_at &&
      new Date(signingRequest.expires_at) < new Date()
    ) {
      return { success: false, error: "This signing link has expired" };
    }

    // Map client method names to DB enum values
    const methodMap: Record<string, string> = { type: "typed", draw: "drawn", upload: "uploaded" };
    const dbMethod = methodMap[signatureData.method] ?? signatureData.method;

    // Update participant with signature
    const { error: updateError } = await supabase
      .from("rp_signing_participants")
      .update({
        status: "signed",
        signature_method: dbMethod,
        signed_name: signatureData.signedName,
        signature_image_url: signatureData.signatureImageUrl ?? null,
        signed_at: new Date().toISOString(),
        ip_address: clientInfo?.ipAddress ?? null,
        user_agent: clientInfo?.userAgent ?? null,
      })
      .eq("id", participant.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Audit log
    await supabase.from("rp_signing_audit_log").insert({
      signing_request_id: signingRequest.id,
      participant_id: participant.id,
      action: "signature_submitted",
      ip_address: clientInfo?.ipAddress ?? null,
      user_agent: clientInfo?.userAgent ?? null,
      metadata: {
        method: signatureData.method,
        signed_name: signatureData.signedName,
        signer_role: participant.signer_role,
      },
    });

    // Check if all participants have signed
    const { data: allParticipants } = await supabase
      .from("rp_signing_participants")
      .select(
        "id, status, signer_role, signer_name, signer_email, token, notified_at"
      )
      .eq("signing_request_id", signingRequest.id);

    const allSigned = (allParticipants ?? []).every(
      (p) => p.status === "signed"
    );
    const someSigned = (allParticipants ?? []).some(
      (p) => p.status === "signed"
    );

    if (allSigned) {
      // All parties signed — complete the signing request
      await supabase
        .from("rp_signing_requests")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", signingRequest.id);

      await supabase
        .from("rp_leases")
        .update({ signing_status: "completed", status: "active" })
        .eq("id", signingRequest.lease_id);

      // Update rp_lease_documents if this is a per-document signing
      if (leaseDocumentId) {
        await supabase
          .from("rp_lease_documents")
          .update({
            signing_status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", leaseDocumentId);
      }

      await supabase.from("rp_signing_audit_log").insert({
        signing_request_id: signingRequest.id,
        action: "signing_completed",
        metadata: {
          total_participants: allParticipants?.length,
          lease_id: signingRequest.lease_id,
          lease_document_id: leaseDocumentId,
        },
      });

      // --- Generate signed PDF, store, and send completion emails ---
      try {
        const adminClient = createAdminClient();
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://tenantporch.vercel.app";

        // Fetch lease with document content and property
        const { data: completedLease } = await supabase
          .from("rp_leases")
          .select(
            "id, property_id, lease_document_content, rp_properties(address_line1, landlord_id)"
          )
          .eq("id", signingRequest.lease_id)
          .single();

        if (completedLease?.lease_document_content) {
          const propertyAddress =
            (completedLease.rp_properties as any)?.address_line1 ??
            "Property";
          const propertyId = completedLease.property_id;
          const landlordId = (completedLease.rp_properties as any)
            ?.landlord_id;

          // Fetch full signature details for all participants
          const { data: sigParticipants } = await supabase
            .from("rp_signing_participants")
            .select(
              "signer_name, signer_role, signer_email, signed_name, signature_method, signature_image_url, signed_at"
            )
            .eq("signing_request_id", signingRequest.id)
            .order("signing_order");

          const signatures: SignatureInfo[] = (sigParticipants ?? []).map(
            (p) => ({
              signerName: p.signer_name,
              signerRole: p.signer_role,
              signedName: p.signed_name,
              signatureMethod: p.signature_method,
              signatureImageUrl: p.signature_image_url,
              signedAt: p.signed_at,
            })
          );

          // Generate signed PDF buffer
          const pdfBuffer = await generateLeaseBuffer(
            completedLease.lease_document_content as any,
            propertyAddress,
            signatures
          );

          // Upload to Supabase Storage
          const storagePath = `${propertyId}/${Date.now()}_Signed_Lease_Agreement.pdf`;
          const { data: uploadData, error: uploadError } =
            await adminClient.storage
              .from("documents")
              .upload(storagePath, pdfBuffer, {
                contentType: "application/pdf",
                upsert: false,
              });

          let documentUrl = "";
          if (!uploadError && uploadData) {
            const { data: urlData } = adminClient.storage
              .from("documents")
              .getPublicUrl(uploadData.path);
            documentUrl = urlData.publicUrl;

            // Create rp_documents record
            await adminClient.from("rp_documents").insert({
              property_id: propertyId,
              lease_id: completedLease.id,
              uploaded_by: landlordId,
              category: "lease",
              title: `Signed Lease Agreement — ${propertyAddress}`,
              file_url: documentUrl,
              file_size: pdfBuffer.length,
              mime_type: "application/pdf",
              visible_to_tenant: true,
            });
          }

          // Fetch landlord info for FROM/reply-to
          const { data: landlordUser } = await supabase
            .from("rp_users")
            .select("first_name, last_name, email")
            .eq("id", landlordId)
            .single();

          const ownerName = landlordUser
            ? `${landlordUser.first_name} ${landlordUser.last_name}`
            : "Your Landlord";
          const ownerEmail = landlordUser?.email;

          // Send completion emails to all participants
          for (const sp of sigParticipants ?? []) {
            try {
              const portalUrl =
                sp.signer_role === "landlord"
                  ? `${appUrl}/admin/leases/${completedLease.id}/document`
                  : `${appUrl}/tenant/documents`;

              const emailResult = await sendSigningCompletionEmail({
                to: sp.signer_email,
                recipientName: sp.signer_name,
                propertyAddress,
                landlordName: ownerName,
                landlordEmail: ownerEmail,
                documentUrl: portalUrl,
                signerCount: (sigParticipants ?? []).length,
              });

              if (emailResult.data?.id) {
                await adminClient.from("rp_email_logs").insert({
                  signing_request_id: signingRequest.id,
                  participant_id: null,
                  recipient_email: sp.signer_email,
                  recipient_name: sp.signer_name,
                  email_type: "signing_completed",
                  resend_message_id: emailResult.data.id,
                  status: "sent",
                  subject: `Lease Agreement Fully Signed — ${propertyAddress}`,
                });
              }
            } catch {
              // Email failure should not break the completion flow
            }
          }

          // In-app notifications for all parties
          for (const sp of sigParticipants ?? []) {
            const { data: rpUser } = await supabase
              .from("rp_users")
              .select("id")
              .eq("email", sp.signer_email)
              .single();

            if (rpUser) {
              await createNotification(supabase, {
                userId: rpUser.id,
                title: "Lease Fully Signed",
                body: `All parties have signed the lease for ${propertyAddress}. A signed copy is available in your documents.`,
                type: "lease",
                urgency: "high",
              });
            }
          }
        }
      } catch {
        // PDF generation / email failures should not break the signing completion
      }
    } else if (someSigned) {
      // Update to partially signed
      await supabase
        .from("rp_signing_requests")
        .update({ status: "partially_signed" })
        .eq("id", signingRequest.id);

      await supabase
        .from("rp_leases")
        .update({ signing_status: "partially_signed" })
        .eq("id", signingRequest.lease_id);

      // Update rp_lease_documents if this is a per-document signing
      if (leaseDocumentId) {
        await supabase
          .from("rp_lease_documents")
          .update({
            signing_status: "partially_signed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", leaseDocumentId);
      }

      // Check if all TENANTS have signed → send landlord signing email
      const tenantParts = (allParticipants ?? []).filter(
        (p) => p.signer_role === "tenant"
      );
      const landlordParts = (allParticipants ?? []).filter(
        (p) => p.signer_role === "landlord"
      );
      const allTenantsSigned = tenantParts.every(
        (p) => p.status === "signed"
      );

      if (allTenantsSigned && landlordParts.length > 0) {
        // Fetch property address for the email
        const { data: lease } = await supabase
          .from("rp_leases")
          .select("property_id, rp_properties(address_line1)")
          .eq("id", signingRequest.lease_id)
          .single();

        const propertyAddress =
          (lease?.rp_properties as any)?.address_line1 ?? "your property";
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          "https://tenantporch.vercel.app";

        for (const lp of landlordParts) {
          if (lp.status === "pending" && !lp.notified_at) {
            try {
              const emailResult = await sendSigningEmail({
                to: lp.signer_email,
                signerName: lp.signer_name,
                signerRole: "landlord",
                propertyAddress,
                landlordName: lp.signer_name,
                landlordEmail: lp.signer_email,
                signingUrl: `${appUrl}/sign/${lp.token}`,
                expiresAt:
                  signingRequest.expires_at ?? new Date().toISOString(),
              });

              await supabase
                .from("rp_signing_participants")
                .update({ notified_at: new Date().toISOString() })
                .eq("id", lp.id);

              if (emailResult.data?.id) {
                await supabase.from("rp_email_logs").insert({
                  signing_request_id: signingRequest.id,
                  participant_id: lp.id,
                  recipient_email: lp.signer_email,
                  recipient_name: lp.signer_name,
                  email_type: "signing_request",
                  resend_message_id: emailResult.data.id,
                  status: "sent",
                  subject: `All Tenants Have Signed — Your Signature Needed for ${propertyAddress}`,
                });
              }
            } catch {
              // Email failure should not break the signing flow
            }

            // In-app notification for landlord
            const { data: landlordRpUser } = await supabase
              .from("rp_users")
              .select("id")
              .eq("email", lp.signer_email)
              .single();

            if (landlordRpUser) {
              await createNotification(supabase, {
                userId: landlordRpUser.id,
                title: "All Tenants Have Signed",
                body: `All tenants have signed the lease for ${propertyAddress}. It's your turn to sign.`,
                type: "lease",
                urgency: "high",
              });
            }
          }
        }
      }
    }

    revalidatePath(`/admin/leases/${signingRequest.lease_id}/document`);

    return {
      success: true,
      allSigned,
      message: allSigned
        ? "All parties have signed. The lease is now fully executed."
        : "Your signature has been recorded. Waiting for other parties.",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Cancel an active signing request (landlord only).
 */
export async function cancelSigning(leaseId: string) {
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

    // Verify ownership
    const { data: lease } = await supabase
      .from("rp_leases")
      .select("id, property_id, rp_properties(landlord_id)")
      .eq("id", leaseId)
      .single();

    if (!lease) {
      return { success: false, error: "Lease not found" };
    }

    if ((lease.rp_properties as any)?.landlord_id !== rpUser.id) {
      return { success: false, error: "You do not own this property" };
    }

    // Find active signing request
    const { data: signingRequest } = await supabase
      .from("rp_signing_requests")
      .select("id")
      .eq("lease_id", leaseId)
      .in("status", ["sent", "partially_signed", "draft"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!signingRequest) {
      return { success: false, error: "No active signing request found" };
    }

    // Cancel the request
    await supabase
      .from("rp_signing_requests")
      .update({ status: "cancelled" })
      .eq("id", signingRequest.id);

    // Reset lease status
    await supabase
      .from("rp_leases")
      .update({ signing_status: "draft", sent_for_signing_at: null })
      .eq("id", leaseId);

    // Audit log
    await supabase.from("rp_signing_audit_log").insert({
      signing_request_id: signingRequest.id,
      action: "signing_cancelled",
      metadata: { cancelled_by: rpUser.id, lease_id: leaseId },
    });

    revalidatePath(`/admin/leases/${leaseId}/document`);
    revalidatePath(`/admin/properties/${lease.property_id}`);

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
 * Resend a signing email to a specific participant.
 */
export async function resendParticipantEmail(participantId: string) {
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
      .select("id, first_name, last_name")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser) {
      return { success: false, error: "User profile not found" };
    }

    // Fetch participant with signing request
    const { data: participant } = await supabase
      .from("rp_signing_participants")
      .select(
        "id, signing_request_id, signer_name, signer_email, signer_role, token, status"
      )
      .eq("id", participantId)
      .single();

    if (!participant) {
      return { success: false, error: "Participant not found" };
    }

    if (participant.status === "signed") {
      return { success: false, error: "This participant has already signed" };
    }

    // Verify ownership via signing request → lease → property
    const { data: signingRequest } = await supabase
      .from("rp_signing_requests")
      .select("id, lease_id, expires_at, rp_leases(property_id, rp_properties(landlord_id, address_line1))")
      .eq("id", participant.signing_request_id)
      .single();

    if (!signingRequest) {
      return { success: false, error: "Signing request not found" };
    }

    const landlordId = (signingRequest.rp_leases as any)?.rp_properties
      ?.landlord_id;
    if (landlordId !== rpUser.id) {
      return { success: false, error: "Not authorized" };
    }

    const propertyAddress =
      (signingRequest.rp_leases as any)?.rp_properties?.address_line1 ??
      "your property";
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://tenantporch.vercel.app";
    const landlordName = `${rpUser.first_name} ${rpUser.last_name}`;

    const emailResult = await sendSigningEmail({
      to: participant.signer_email,
      signerName: participant.signer_name,
      signerRole: participant.signer_role as "tenant" | "landlord",
      propertyAddress,
      landlordName,
      signingUrl: `${appUrl}/sign/${participant.token}`,
      expiresAt: signingRequest.expires_at ?? new Date().toISOString(),
    });

    // Update reminder_sent_at
    await supabase
      .from("rp_signing_participants")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", participant.id);

    // Log the email
    if (emailResult.data?.id) {
      await supabase.from("rp_email_logs").insert({
        signing_request_id: signingRequest.id,
        participant_id: participant.id,
        recipient_email: participant.signer_email,
        recipient_name: participant.signer_name,
        email_type: "signing_reminder",
        resend_message_id: emailResult.data.id,
        status: "sent",
        subject: `Reminder: Sign Your Lease for ${propertyAddress}`,
      });
    }

    revalidatePath(
      `/admin/leases/${(signingRequest.rp_leases as any)?.id ?? signingRequest.lease_id}/document`
    );

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
 * Mark a lease as signed offline (paper signing).
 * Sets signing_status to "completed" and lease status to "active".
 * Optionally accepts a scanned signed PDF upload.
 */
export async function markLeaseSignedOffline(
  leaseId: string,
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

    // Fetch lease with ownership check
    const { data: lease } = await supabase
      .from("rp_leases")
      .select(
        "id, property_id, signing_status, rp_properties(landlord_id, address_line1)"
      )
      .eq("id", leaseId)
      .single();

    if (!lease) {
      return { success: false, error: "Lease not found" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const landlordId = (lease.rp_properties as any)?.landlord_id;
    if (landlordId !== rpUser.id) {
      return { success: false, error: "You do not own this property" };
    }

    if (lease.signing_status === "completed") {
      return { success: false, error: "Lease is already signed" };
    }

    // Handle optional signed PDF upload
    let signedPdfUrl: string | null = null;
    const file = formData?.get("file") as File | null;
    if (file && file.size > 0) {
      if (file.type !== "application/pdf") {
        return { success: false, error: "Only PDF files are accepted" };
      }
      if (file.size > 20 * 1024 * 1024) {
        return { success: false, error: "File size must be under 20MB" };
      }

      const filePath = `lease-documents/${leaseId}/${Date.now()}-signed-lease.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        return {
          success: false,
          error: `Upload failed: ${uploadError.message}`,
        };
      }

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);
      signedPdfUrl = urlData.publicUrl;

      // Create rp_documents record for the signed PDF
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const propertyAddress =
        (lease.rp_properties as any)?.address_line1 ?? "Property";
      await supabase.from("rp_documents").insert({
        property_id: lease.property_id,
        lease_id: leaseId,
        uploaded_by: rpUser.id,
        category: "lease",
        title: `Signed Lease Agreement — ${propertyAddress}`,
        file_url: signedPdfUrl,
        file_size: file.size,
        mime_type: "application/pdf",
        visible_to_tenant: true,
      });
    }

    // Cancel any active e-sign requests for this lease
    if (
      lease.signing_status === "sent" ||
      lease.signing_status === "partially_signed"
    ) {
      await supabase
        .from("rp_signing_requests")
        .update({ status: "cancelled" })
        .eq("lease_id", leaseId)
        .in("status", ["sent", "partially_signed"]);
    }

    // Update lease: mark as signed and activate
    const { error: updateError } = await supabase
      .from("rp_leases")
      .update({
        signing_status: "completed",
        status: "active",
        sent_for_signing_at: lease.signing_status === "draft"
          ? new Date().toISOString()
          : undefined,
      })
      .eq("id", leaseId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Audit log
    await supabase.from("rp_signing_audit_log").insert({
      action: "signed_offline",
      metadata: {
        lease_id: leaseId,
        signed_by: rpUser.id,
        has_uploaded_pdf: !!signedPdfUrl,
      },
    });

    revalidatePath(`/admin/leases/${leaseId}/document`);
    revalidatePath(`/admin/properties/${lease.property_id}`);
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
