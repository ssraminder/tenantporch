import { NextResponse } from "next/server";

/**
 * Stripe Identity verification sessions are now landlord-initiated only.
 * Use POST /api/stripe/identity/purchase instead.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "ID verification is now managed by your landlord. Please contact your landlord to request Stripe Identity verification.",
    },
    { status: 410 }
  );
}
