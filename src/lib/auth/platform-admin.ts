/**
 * Platform admin authorization.
 *
 * "Platform admin" (a.k.a. TenantPorch staff) is intentionally separate from
 * the landlord/tenant role on rp_users — landlords manage their own portfolio,
 * but they MUST NOT be able to perform destructive operations like resetting
 * signatures on a lease that has already been signed.
 *
 * Membership is set via the TENANTPORCH_ADMIN_EMAILS env var, a comma-
 * separated list of email addresses. The check is server-side only; never
 * trust a client-supplied flag.
 */

function getAllowedEmails(): string[] {
  const raw = process.env.TENANTPORCH_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = getAllowedEmails();
  return allowed.includes(email.toLowerCase());
}
