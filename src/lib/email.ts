import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const DEFAULT_FROM = "TenantPorch <noreply@tenantporch.com>";
const EMAIL_LOGO_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/branding/logo-tenant-lightbg.png`;
const EMAIL_LOGO_IMG = `<img src="${EMAIL_LOGO_URL}" alt="TenantPorch" height="36" style="height:36px;width:auto;margin-bottom:24px;" />`;

function buildFrom(ownerName?: string): string {
  if (ownerName) return `${ownerName} - TenantPorch <noreply@tenantporch.com>`;
  return DEFAULT_FROM;
}

export async function sendWelcomeEmail({
  to,
  firstName,
  landlordName,
  propertyAddress,
  tempPassword,
}: {
  to: string;
  firstName: string;
  landlordName: string;
  propertyAddress: string;
  tempPassword: string;
}) {
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tenantporch.vercel.app";

  return resend.emails.send({
    from: DEFAULT_FROM,
    to,
    subject: "Welcome to TenantPorch — Your tenant portal is ready",
    html: `
      <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
        ${EMAIL_LOGO_IMG}
        <h1 style="font-family: Manrope, sans-serif; color: #273f4f; font-size: 24px; margin-bottom: 8px;">
          Welcome to TenantPorch
        </h1>
        <p style="color: #45464e; font-size: 15px; line-height: 1.6;">
          Hi ${firstName},
        </p>
        <p style="color: #45464e; font-size: 15px; line-height: 1.6;">
          Your landlord <strong>${landlordName}</strong> has set up a tenant portal for you
          at <strong>${propertyAddress}</strong>.
        </p>
        <div style="background: #f2f3f7; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #45464e; font-weight: 600;">Login to your portal:</p>
          <p style="margin: 4px 0; font-size: 14px; color: #191c1f;">
            <strong>URL:</strong> <a href="${loginUrl}/login" style="color: #273f4f;">${loginUrl}/login</a>
          </p>
          <p style="margin: 4px 0; font-size: 14px; color: #191c1f;">
            <strong>Email:</strong> ${to}
          </p>
          <p style="margin: 4px 0; font-size: 14px; color: #191c1f;">
            <strong>Temporary password:</strong> <code style="background: #e1e2e6; padding: 2px 8px; border-radius: 4px; font-size: 14px;">${tempPassword}</code>
          </p>
        </div>
        <p style="color: #E8732C; font-size: 14px; font-weight: 600;">
          Please change your password after your first login.
        </p>
        <p style="color: #45464e; font-size: 14px; line-height: 1.6; margin-top: 20px;">
          Your portal gives you access to:
        </p>
        <ul style="color: #45464e; font-size: 14px; line-height: 1.8; padding-left: 20px;">
          <li>View your lease and documents</li>
          <li>Track rent payments</li>
          <li>Submit maintenance requests</li>
          <li>Message your landlord</li>
        </ul>
        <hr style="border: none; border-top: 1px solid #e1e2e6; margin: 32px 0 16px;" />
        <p style="color: #9a9ba3; font-size: 12px;">
          — TenantPorch &middot; Your front porch to smarter renting.
        </p>
      </div>
    `,
  });
}

export async function sendDepositReturnEmail({
  to,
  firstName,
  propertyAddress,
  refundAmount,
  currency,
}: {
  to: string;
  firstName: string;
  propertyAddress: string;
  refundAmount: string;
  currency: string;
}) {
  const portalUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tenantporch.vercel.app";

  return resend.emails.send({
    from: DEFAULT_FROM,
    to,
    subject: "Your Security Deposit Return Statement",
    html: `
      <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
        ${EMAIL_LOGO_IMG}
        <h1 style="font-family: Manrope, sans-serif; color: #273f4f; font-size: 24px; margin-bottom: 8px;">
          Security Deposit Return Statement
        </h1>
        <p style="color: #45464e; font-size: 15px; line-height: 1.6;">
          Hi ${firstName},
        </p>
        <p style="color: #45464e; font-size: 15px; line-height: 1.6;">
          A deposit return statement has been prepared for your tenancy at
          <strong>${propertyAddress}</strong>.
        </p>
        <div style="background: #f2f3f7; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 4px; font-size: 13px; color: #45464e; font-weight: 600;">Refund Amount</p>
          <p style="margin: 0; font-size: 28px; font-weight: 800; color: #273f4f;">
            ${currency} ${refundAmount}
          </p>
        </div>
        <p style="color: #45464e; font-size: 14px; line-height: 1.6;">
          Please log in to your tenant portal to review the full statement, including any deductions and supporting documentation.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${portalUrl}/tenant/documents" style="display: inline-block; background: #273f4f; color: #ffffff; padding: 12px 32px; border-radius: 12px; font-size: 14px; font-weight: 700; text-decoration: none;">
            View Statement
          </a>
        </div>
        <p style="color: #45464e; font-size: 13px; line-height: 1.6;">
          If you have any concerns about the deductions, you can submit a dispute through your portal.
        </p>
        <hr style="border: none; border-top: 1px solid #e1e2e6; margin: 32px 0 16px;" />
        <p style="color: #9a9ba3; font-size: 12px;">
          — TenantPorch &middot; Your front porch to smarter renting.
        </p>
      </div>
    `,
  });
}

export async function sendInviteEmail({
  to,
  firstName,
  landlordName,
  propertyAddress,
  inviteUrl,
}: {
  to: string;
  firstName: string;
  landlordName: string;
  propertyAddress: string;
  inviteUrl: string;
}) {
  return resend.emails.send({
    from: DEFAULT_FROM,
    to,
    subject: "You're invited to TenantPorch — Set up your account",
    html: `
      <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
        ${EMAIL_LOGO_IMG}
        <h1 style="font-family: Manrope, sans-serif; color: #273f4f; font-size: 24px; margin-bottom: 8px;">
          You're Invited to TenantPorch
        </h1>
        <p style="color: #45464e; font-size: 15px; line-height: 1.6;">
          Hi ${firstName},
        </p>
        <p style="color: #45464e; font-size: 15px; line-height: 1.6;">
          Your landlord <strong>${landlordName}</strong> has invited you to set up a tenant portal
          for <strong>${propertyAddress}</strong>.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${inviteUrl}" style="display: inline-block; background: #273f4f; color: #ffffff; padding: 14px 36px; border-radius: 12px; font-size: 15px; font-weight: 700; text-decoration: none;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #45464e; font-size: 14px; line-height: 1.6;">
          Click the button above to create your account and set your password. This link will expire in 14 days.
        </p>
        <p style="color: #45464e; font-size: 14px; line-height: 1.6; margin-top: 20px;">
          Your portal gives you access to:
        </p>
        <ul style="color: #45464e; font-size: 14px; line-height: 1.8; padding-left: 20px;">
          <li>View your lease and documents</li>
          <li>Track rent payments</li>
          <li>Submit maintenance requests</li>
          <li>Message your landlord</li>
        </ul>
        <hr style="border: none; border-top: 1px solid #e1e2e6; margin: 32px 0 16px;" />
        <p style="color: #9a9ba3; font-size: 12px;">
          — TenantPorch &middot; Your front porch to smarter renting.
        </p>
      </div>
    `,
  });
}

export async function sendSigningEmail({
  to,
  signerName,
  signerRole,
  propertyAddress,
  landlordName,
  landlordEmail,
  signingUrl,
  expiresAt,
}: {
  to: string;
  signerName: string;
  signerRole: "tenant" | "landlord";
  propertyAddress: string;
  landlordName: string;
  landlordEmail?: string;
  signingUrl: string;
  expiresAt: string;
}) {
  const isTenant = signerRole === "tenant";
  const subject = isTenant
    ? `Action Required: Sign Your Lease for ${propertyAddress}`
    : `All Tenants Have Signed — Your Signature Needed for ${propertyAddress}`;

  const expiryDate = new Date(expiresAt).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return resend.emails.send({
    from: buildFrom(landlordName),
    to,
    ...(landlordEmail ? { replyTo: landlordEmail } : {}),
    subject,
    html: `
      <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
        ${EMAIL_LOGO_IMG}
        <h1 style="font-family: Manrope, sans-serif; color: #273f4f; font-size: 24px; margin-bottom: 8px;">
          ${isTenant ? "Your Lease is Ready for Signing" : "All Tenants Have Signed"}
        </h1>
        <p style="color: #45464e; font-size: 15px; line-height: 1.6;">
          Hi ${signerName},
        </p>
        <p style="color: #45464e; font-size: 15px; line-height: 1.6;">
          ${
            isTenant
              ? `Your landlord <strong>${landlordName}</strong> has prepared a lease agreement for <strong>${propertyAddress}</strong> that requires your electronic signature.`
              : `All tenants have signed the lease agreement for <strong>${propertyAddress}</strong>. It&rsquo;s now your turn to review and sign.`
          }
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${signingUrl}" style="display: inline-block; background: #273f4f; color: #ffffff; padding: 14px 36px; border-radius: 12px; font-size: 15px; font-weight: 700; text-decoration: none;">
            Review &amp; Sign Lease
          </a>
        </div>
        <div style="background: #f2f3f7; border-radius: 12px; padding: 16px 20px; margin: 24px 0;">
          <p style="margin: 0 0 6px; font-size: 13px; color: #45464e; font-weight: 600;">Important Details</p>
          <p style="margin: 4px 0; font-size: 14px; color: #191c1f;">
            <strong>Property:</strong> ${propertyAddress}
          </p>
          <p style="margin: 4px 0; font-size: 14px; color: #191c1f;">
            <strong>Signing deadline:</strong> ${expiryDate}
          </p>
        </div>
        <p style="color: #45464e; font-size: 14px; line-height: 1.6;">
          Click the button above to review the full lease document and provide your electronic signature.
          No account or login is required &mdash; the link above is your secure, personal signing link.
        </p>
        <p style="color: #45464e; font-size: 13px; line-height: 1.6; margin-top: 20px;">
          This electronic signature process complies with the Alberta <em>Electronic Transactions Act</em>
          and the <em>Residential Tenancies Act</em>.
        </p>
        <hr style="border: none; border-top: 1px solid #e1e2e6; margin: 32px 0 16px;" />
        <p style="color: #9a9ba3; font-size: 12px;">
          &mdash; TenantPorch &middot; Your front porch to smarter renting.
        </p>
      </div>
    `,
  });
}

export async function sendSigningCompletionEmail({
  to,
  recipientName,
  propertyAddress,
  landlordName,
  landlordEmail,
  documentUrl,
  signerCount,
}: {
  to: string;
  recipientName: string;
  propertyAddress: string;
  landlordName: string;
  landlordEmail?: string;
  documentUrl: string;
  signerCount: number;
}) {
  return resend.emails.send({
    from: buildFrom(landlordName),
    to,
    ...(landlordEmail ? { replyTo: landlordEmail } : {}),
    subject: `Lease Agreement Fully Signed — ${propertyAddress}`,
    html: `
      <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
        ${EMAIL_LOGO_IMG}
        <h1 style="font-family: Manrope, sans-serif; color: #273f4f; font-size: 24px; margin-bottom: 8px;">
          Lease Agreement Signed
        </h1>
        <p style="color: #45464e; font-size: 15px; line-height: 1.6;">
          Hi ${recipientName},
        </p>
        <p style="color: #45464e; font-size: 15px; line-height: 1.6;">
          All ${signerCount} parties have signed the lease agreement for
          <strong>${propertyAddress}</strong>. A signed copy of the document is now available for download.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${documentUrl}" style="display: inline-block; background: #273f4f; color: #ffffff; padding: 14px 36px; border-radius: 12px; font-size: 15px; font-weight: 700; text-decoration: none;">
            Download Lease Document
          </a>
        </div>
        <div style="background: #f2f3f7; border-radius: 12px; padding: 16px 20px; margin: 24px 0;">
          <p style="margin: 0 0 6px; font-size: 13px; color: #45464e; font-weight: 600;">Details</p>
          <p style="margin: 4px 0; font-size: 14px; color: #191c1f;">
            <strong>Property:</strong> ${propertyAddress}
          </p>
          <p style="margin: 4px 0; font-size: 14px; color: #191c1f;">
            <strong>Signed by:</strong> ${signerCount} parties
          </p>
          <p style="margin: 4px 0; font-size: 14px; color: #191c1f;">
            <strong>Completed:</strong> ${new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <p style="color: #45464e; font-size: 14px; line-height: 1.6;">
          This document is also available in your TenantPorch portal under Documents.
          Please keep a copy for your records.
        </p>
        <p style="color: #45464e; font-size: 13px; line-height: 1.6; margin-top: 20px;">
          This electronic signature process complies with the Alberta <em>Electronic Transactions Act</em>
          and the <em>Residential Tenancies Act</em>.
        </p>
        <hr style="border: none; border-top: 1px solid #e1e2e6; margin: 32px 0 16px;" />
        <p style="color: #9a9ba3; font-size: 12px;">
          &mdash; TenantPorch &middot; Your front porch to smarter renting.
        </p>
      </div>
    `,
  });
}

export async function sendGenericEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return resend.emails.send({
    from: DEFAULT_FROM,
    to,
    subject,
    html,
  });
}
