import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

// Use service role for webhook processing (no user context)
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = getAdminSupabase();

  try {
    switch (event.type) {
      // ─── Checkout completed — tenant paid rent OR landlord purchased ID verification ───
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // ── ID Verification Purchase (landlord-initiated) ──
        if (session.metadata?.type === "id_verification_purchase") {
          const tenantId = session.metadata.tenant_id;
          const landlordUserId = session.metadata.landlord_user_id;

          if (tenantId && landlordUserId) {
            try {
              const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

              // Create Stripe Identity verification session
              const verificationSession =
                await stripe.identity.verificationSessions.create({
                  type: "document",
                  metadata: {
                    rp_user_id: tenantId,
                    landlord_id: landlordUserId,
                    source: "purchased",
                    used_free_quota: "false",
                  },
                  options: {
                    document: {
                      require_matching_selfie: true,
                    },
                  },
                  return_url: `${appUrl}/tenant/profile?verification=complete`,
                });

              const expiresAt = new Date(
                Date.now() + 48 * 60 * 60 * 1000
              ).toISOString();

              // Insert audit record
              await supabase.from("rp_id_verifications").insert({
                tenant_id: tenantId,
                landlord_id: landlordUserId,
                stripe_session_id: verificationSession.id,
                stripe_checkout_session_id: session.id,
                verification_url: verificationSession.url,
                status: "pending",
                used_free_quota: false,
                expires_at: expiresAt,
              });

              // Update tenant's rp_users for quick lookups
              await supabase
                .from("rp_users")
                .update({
                  stripe_identity_session_id: verificationSession.id,
                  stripe_identity_status: "pending",
                  stripe_identity_verification_url: verificationSession.url,
                  stripe_identity_expires_at: expiresAt,
                  stripe_identity_purchased_by: landlordUserId,
                  id_document_status: "pending",
                  id_uploaded_at: new Date().toISOString(),
                })
                .eq("id", tenantId);

              // Get tenant name for notification
              const { data: tenantUser } = await supabase
                .from("rp_users")
                .select("first_name, last_name")
                .eq("id", tenantId)
                .single();

              // Notify tenant
              await supabase.from("rp_notifications").insert({
                user_id: tenantId,
                title: "ID Verification Requested",
                body: "Your landlord has requested identity verification. Please complete it from your profile page.",
                type: "general",
                link: "/tenant/profile",
              });

              // Notify landlord
              const tenantName = tenantUser
                ? `${tenantUser.first_name} ${tenantUser.last_name}`
                : "your tenant";
              await supabase.from("rp_notifications").insert({
                user_id: landlordUserId,
                title: "Verification Purchased",
                body: `ID verification has been sent to ${tenantName}. They will be notified.`,
                type: "general",
                link: `/admin/tenants/${tenantId}`,
              });
            } catch (identityErr: any) {
              console.error(`Stripe Identity error for tenant ${tenantId}:`, identityErr?.message ?? identityErr);

              // Notify landlord about the failure
              await supabase.from("rp_notifications").insert({
                user_id: landlordUserId,
                title: "Verification Setup Failed",
                body: "ID verification could not be created. Stripe Identity may not be enabled on this account.",
                type: "general",
                link: `/admin/tenants/${tenantId}`,
              });
            }
          }
          break;
        }

        // ── Plan upgrade/signup checkout ──
        if (session.metadata?.type === "plan_upgrade") {
          const landlordProfileId = session.metadata.landlord_profile_id;
          const planId = session.metadata.plan_id;
          if (landlordProfileId && planId) {
            await supabase
              .from("rp_landlord_profiles")
              .update({ plan_id: planId, subscription_status: "active" })
              .eq("id", landlordProfileId);
          }
          break;
        }

        // ── Add-on purchase checkout ──
        if (session.metadata?.type === "addon_purchase") {
          const landlordProfileId = session.metadata.landlord_profile_id;
          const addonId = session.metadata.addon_id;
          const addonSlug = session.metadata.addon_slug;
          if (landlordProfileId && addonId) {
            // Activate the add-on
            await supabase.from("rp_landlord_addons").upsert(
              {
                landlord_profile_id: landlordProfileId,
                addon_id: addonId,
                status: "active",
                stripe_subscription_item_id: session.subscription as string,
                activated_at: new Date().toISOString(),
                setup_fee_paid: true,
                setup_fee_paid_at: new Date().toISOString(),
              },
              { onConflict: "landlord_profile_id,addon_id" }
            );

            // Notify landlord
            const { data: profileData } = await supabase
              .from("rp_landlord_profiles")
              .select("user_id")
              .eq("id", landlordProfileId)
              .single();
            if (profileData) {
              await supabase.from("rp_notifications").insert({
                user_id: profileData.user_id,
                title: "Add-on Activated",
                body: `Your ${addonSlug} add-on is now active.`,
                type: "general",
                link: "/admin/plan",
              });
            }
          }
          break;
        }

        // ── Rent payment checkout ──
        const paymentId = session.metadata?.payment_id;
        const tenantUserId = session.metadata?.tenant_user_id;

        if (paymentId) {
          // Update payment status to confirmed
          await supabase
            .from("rp_payments")
            .update({
              status: "confirmed",
              stripe_payment_intent_id: session.payment_intent as string,
            })
            .eq("id", paymentId);

          // Update rent schedule entry if applicable
          const { data: payment } = await supabase
            .from("rp_payments")
            .select("lease_id, amount, payment_for_month")
            .eq("id", paymentId)
            .single();

          if (payment?.payment_for_month) {
            await supabase
              .from("rp_rent_schedule")
              .update({
                amount_paid: payment.amount,
                status: "paid",
              })
              .eq("lease_id", payment.lease_id)
              .eq("due_date", payment.payment_for_month);
          }

          // Notify the tenant
          if (tenantUserId) {
            await supabase.from("rp_notifications").insert({
              user_id: tenantUserId,
              title: "Payment Confirmed",
              body: `Your payment of $${(session.amount_total! / 100).toFixed(2)} has been processed successfully.`,
              type: "payment",
              urgency: "normal",
            });
          }
        }
        break;
      }

      // ─── Payment failed ───
      case "checkout.session.expired":
      case "payment_intent.payment_failed": {
        const obj = event.data.object as any;
        const paymentId = obj.metadata?.payment_id;

        if (paymentId) {
          await supabase
            .from("rp_payments")
            .update({ status: "failed" })
            .eq("id", paymentId);
        }
        break;
      }

      // ─── Stripe Connect: account updated ───
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        if (account.charges_enabled && account.details_submitted) {
          // Mark the landlord's Stripe Connect as fully onboarded
          await supabase
            .from("rp_landlord_profiles")
            .update({ stripe_connect_account_id: account.id })
            .eq("stripe_connect_account_id", account.id);
        }
        break;
      }

      // ─── Subscription events (for landlord billing) ───
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const updateData: Record<string, any> = {
          subscription_status: subscription.status === "active" ? "active" : subscription.status,
        };
        if ((subscription as any).current_period_start) {
          updateData.current_period_start = new Date((subscription as any).current_period_start * 1000).toISOString();
        }
        if ((subscription as any).current_period_end) {
          updateData.current_period_end = new Date((subscription as any).current_period_end * 1000).toISOString();
        }

        await supabase
          .from("rp_landlord_profiles")
          .update(updateData)
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
          .from("rp_landlord_profiles")
          .update({ subscription_status: "cancelled" })
          .eq("stripe_customer_id", customerId);
        break;
      }

      // ─── Invoice paid (subscription renewal) ───
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (invoice.billing_reason === "subscription_cycle") {
          await supabase
            .from("rp_landlord_profiles")
            .update({ subscription_status: "active" })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      // ─── Stripe Identity: verification verified ───
      case "identity.verification_session.verified": {
        const session = event.data.object as any;
        const rpUserId = session.metadata?.rp_user_id;

        if (rpUserId) {
          // Extract verified data from the session
          const verifiedDoc = session.last_verification_report;

          const updateData: Record<string, any> = {
            id_document_status: "approved",
            id_reviewed_at: new Date().toISOString(),
          };

          // If Stripe returned document details, store them
          if (session.verified_outputs?.first_name) {
            updateData.id_name_on_document = `${session.verified_outputs.first_name} ${session.verified_outputs.last_name ?? ""}`.trim();
          }
          if (session.verified_outputs?.id_number) {
            updateData.id_number = session.verified_outputs.id_number;
          }
          if (session.verified_outputs?.document?.type) {
            const docTypeMap: Record<string, string> = {
              driving_license: "drivers_license",
              passport: "passport",
              id_card: "provincial_id",
            };
            updateData.id_type =
              docTypeMap[session.verified_outputs.document.type] ??
              session.verified_outputs.document.type;
          }
          if (session.verified_outputs?.document?.expiration_date) {
            const exp = session.verified_outputs.document.expiration_date;
            updateData.id_expiry_date = `${exp.year}-${String(exp.month).padStart(2, "0")}-${String(exp.day).padStart(2, "0")}`;
          }
          if (session.verified_outputs?.document?.issuing_country) {
            updateData.id_place_of_issue =
              session.verified_outputs.document.issuing_country;
          }

          // Also clear the verification URL and mark stripe identity as verified
          updateData.stripe_identity_status = "verified";
          updateData.stripe_identity_verification_url = null;

          await supabase
            .from("rp_users")
            .update(updateData)
            .eq("id", rpUserId);

          // Update rp_id_verifications audit record
          if (session.id) {
            await supabase
              .from("rp_id_verifications")
              .update({
                status: "verified",
                completed_at: new Date().toISOString(),
              })
              .eq("stripe_session_id", session.id);
          }

          // Notify the tenant
          await supabase.from("rp_notifications").insert({
            user_id: rpUserId,
            title: "ID Verified",
            body: "Your identity has been verified successfully.",
            type: "general",
          });

          // Notify landlords who have this tenant
          const { data: leaseTenants } = await supabase
            .from("rp_lease_tenants")
            .select("rp_leases!inner(property_id, rp_properties!inner(landlord_id))")
            .eq("user_id", rpUserId);

          const landlordIds = Array.from(new Set(
            (leaseTenants ?? []).map(
              (lt: any) => lt.rp_leases?.rp_properties?.landlord_id
            ).filter(Boolean)
          ));

          for (const landlordId of landlordIds) {
            await supabase.from("rp_notifications").insert({
              user_id: landlordId,
              title: "Tenant ID Verified",
              body: `A tenant's identity has been verified via Stripe Identity.`,
              type: "general",
              link: `/admin/tenants/${rpUserId}`,
            });
          }
        }
        break;
      }

      // ─── Stripe Identity: verification requires input / failed ───
      case "identity.verification_session.requires_input": {
        const session = event.data.object as any;
        const rpUserId = session.metadata?.rp_user_id;

        if (rpUserId) {
          const lastError = session.last_error;
          const reason = lastError?.code ?? "verification_failed";

          await supabase
            .from("rp_users")
            .update({
              id_document_status: "rejected",
              id_reviewed_at: new Date().toISOString(),
              stripe_identity_status: "failed",
              stripe_identity_verification_url: null,
            })
            .eq("id", rpUserId);

          // Update rp_id_verifications audit record
          if (session.id) {
            await supabase
              .from("rp_id_verifications")
              .update({
                status: "failed",
                completed_at: new Date().toISOString(),
              })
              .eq("stripe_session_id", session.id);
          }

          await supabase.from("rp_notifications").insert({
            user_id: rpUserId,
            title: "ID Verification Failed",
            body: `Your identity verification could not be completed. Reason: ${reason}. Please try again.`,
            type: "general",
            link: "/tenant/profile",
          });
        }
        break;
      }

      default:
        // Unhandled event type — log but don't error
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Webhook handler error: ${err}`);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
