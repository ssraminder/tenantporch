import { NextRequest, NextResponse } from "next/server";
import { processOverdueUtilityBills } from "@/app/admin/actions/utility-actions";

/**
 * Daily cron job: send overdue reminders for utility bills.
 *
 * Secured via CRON_SECRET header.
 * Configure in vercel.json:
 *   { "crons": [{ "path": "/api/cron/utility-reminders", "schedule": "0 10 * * *" }] }
 *
 * Or call manually: GET /api/cron/utility-reminders
 * with header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  // Verify the cron secret when set (skip auth in development)
  if (cronSecret) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await processOverdueUtilityBills();
    return NextResponse.json({
      success: true,
      processed: result.processed,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Utility reminders cron error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
