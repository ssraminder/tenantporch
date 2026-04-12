import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { JoinForm } from "./join-form";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  // Look up the invite by token
  const { data: invite } = await supabase
    .from("rp_tenant_invites")
    .select(
      "id, token, email, first_name, last_name, phone, property_id, lease_id, landlord_id, role, status, expires_at, rp_properties(address_line1, city), rp_users!rp_tenant_invites_landlord_id_fkey(first_name, last_name)"
    )
    .eq("token", token)
    .single();

  if (!invite) {
    return <InvalidInvite reason="not_found" />;
  }

  if (invite.status !== "pending") {
    return <InvalidInvite reason="already_used" />;
  }

  if (new Date(invite.expires_at) < new Date()) {
    return <InvalidInvite reason="expired" />;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const property = invite.rp_properties as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landlord = invite.rp_users as any;

  const propertyAddress = property
    ? `${property.address_line1}, ${property.city}`
    : "";
  const landlordName = landlord
    ? `${landlord.first_name ?? ""} ${landlord.last_name ?? ""}`.trim()
    : "Your landlord";

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo height={44} />
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-secondary text-2xl">
                person_add
              </span>
            </div>
            <h2 className="font-headline text-xl font-bold text-primary mb-2">
              Accept Your Invitation
            </h2>
            <p className="text-sm text-on-surface-variant">
              <strong>{landlordName}</strong> has invited you to join the tenant
              portal for <strong>{propertyAddress}</strong>.
            </p>
          </div>

          <JoinForm
            token={invite.token}
            email={invite.email}
            firstName={invite.first_name}
            lastName={invite.last_name}
          />
        </div>

        <p className="text-center text-xs text-on-surface-variant mt-6">
          Powered by{" "}
          <Link href="/" className="font-bold text-primary hover:underline">
            TenantPorch
          </Link>
        </p>
      </div>
    </div>
  );
}

function InvalidInvite({
  reason,
}: {
  reason: "not_found" | "already_used" | "expired";
}) {
  const messages = {
    not_found: {
      title: "Invitation Not Found",
      body: "This invitation link is invalid. Please check your email or contact your landlord.",
      icon: "link_off",
    },
    already_used: {
      title: "Invitation Already Used",
      body: "This invitation has already been accepted. You can log in with your account.",
      icon: "check_circle",
    },
    expired: {
      title: "Invitation Expired",
      body: "This invitation link has expired. Please contact your landlord to request a new one.",
      icon: "schedule",
    },
  };

  const msg = messages[reason];

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo height={44} />
        </div>

        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-error-container flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-on-error-container text-2xl">
              {msg.icon}
            </span>
          </div>
          <h2 className="font-headline text-xl font-bold text-primary mb-2">
            {msg.title}
          </h2>
          <p className="text-sm text-on-surface-variant mb-6">{msg.body}</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-sm">login</span>
            Go to Login
          </Link>
        </div>

        <p className="text-center text-xs text-on-surface-variant mt-6">
          Powered by{" "}
          <Link href="/" className="font-bold text-primary hover:underline">
            TenantPorch
          </Link>
        </p>
      </div>
    </div>
  );
}
