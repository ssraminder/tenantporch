import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "TenantPorch <noreply@tenantporch.com>";

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
    from: FROM_EMAIL,
    to,
    subject: "Welcome to TenantPorch — Your tenant portal is ready",
    html: `
      <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
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
    from: FROM_EMAIL,
    to,
    subject: "Your Security Deposit Return Statement",
    html: `
      <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
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
    from: FROM_EMAIL,
    to,
    subject: "You're invited to TenantPorch — Set up your account",
    html: `
      <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
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
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
}
