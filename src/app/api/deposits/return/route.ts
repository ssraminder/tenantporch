import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { sendDepositReturnEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id, first_name, last_name")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      leaseId,
      depositId,
      refundReason,
      refundReasonOther,
      refundType,
      refundAmount,
      deductions,
      returnMethod,
      returnReference,
      evidenceUrls,
    } = body;

    if (!leaseId || !depositId) {
      return NextResponse.json(
        { error: "Missing leaseId or depositId" },
        { status: 400 }
      );
    }

    // Fetch lease and verify landlord ownership
    const { data: lease } = await supabase
      .from("rp_leases")
      .select(
        "id, property_id, status, rp_properties!inner(landlord_id, address_line1, city)"
      )
      .eq("id", leaseId)
      .single();

    if (!lease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const property = lease.rp_properties as any;
    if (property.landlord_id !== rpUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch the deposit
    const { data: deposit } = await supabase
      .from("rp_security_deposits")
      .select("id, amount, interest_accrued, currency_code")
      .eq("id", depositId)
      .eq("lease_id", leaseId)
      .eq("status", "held")
      .single();

    if (!deposit) {
      return NextResponse.json(
        { error: "Deposit not found or already returned" },
        { status: 404 }
      );
    }

    const totalAvailable =
      Number(deposit.amount) + Number(deposit.interest_accrued ?? 0);
    const parsedRefundAmount = parseFloat(refundAmount);

    if (isNaN(parsedRefundAmount) || parsedRefundAmount < 0) {
      return NextResponse.json(
        { error: "Invalid refund amount" },
        { status: 400 }
      );
    }

    if (parsedRefundAmount > totalAvailable) {
      return NextResponse.json(
        { error: "Refund amount exceeds available deposit" },
        { status: 400 }
      );
    }

    const totalDeductions = totalAvailable - parsedRefundAmount;
    const reasonText =
      refundReason === "other" ? refundReasonOther || "Other" : refundReason;

    // Calculate per-category deduction totals
    const categoryMap: Record<string, { dbField: string }> = {
      rent_arrears: { dbField: "deduction_unpaid_rent" },
      utilities: { dbField: "deduction_unpaid_utilities" },
      damage: { dbField: "deduction_damages" },
      cleaning: { dbField: "deduction_cleaning" },
      other: { dbField: "deduction_other" },
    };

    const deductionTotals: Record<string, number> = {
      deduction_unpaid_rent: 0,
      deduction_unpaid_utilities: 0,
      deduction_damages: 0,
      deduction_cleaning: 0,
      deduction_other: 0,
    };

    const otherDescriptions: string[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsedDeductions = (deductions ?? []) as any[];
    for (const d of parsedDeductions) {
      const cat = d.category || "other";
      const mapping = categoryMap[cat] ?? categoryMap["other"];
      deductionTotals[mapping.dbField] += parseFloat(d.amount) || 0;
      if (cat === "other" && d.description) {
        otherDescriptions.push(d.description);
      }
    }

    // Create deposit return record
    const { data: depositReturn, error: returnError } = await supabase
      .from("rp_deposit_returns")
      .insert({
        deposit_id: depositId,
        lease_id: leaseId,
        original_deposit: deposit.amount,
        interest_accrued: deposit.interest_accrued ?? 0,
        currency_code: deposit.currency_code,
        deduction_unpaid_rent: deductionTotals.deduction_unpaid_rent,
        deduction_unpaid_utilities: deductionTotals.deduction_unpaid_utilities,
        deduction_damages: deductionTotals.deduction_damages,
        deduction_cleaning: deductionTotals.deduction_cleaning,
        deduction_other: deductionTotals.deduction_other,
        deduction_other_description:
          otherDescriptions.length > 0
            ? otherDescriptions.join("; ")
            : null,
        total_deductions: totalDeductions,
        refund_amount: parsedRefundAmount,
        evidence_urls: evidenceUrls ?? [],
        return_method: returnMethod || null,
        return_reference: returnReference || null,
        returned_at: new Date().toISOString(),
        status: "completed",
        refund_reason: reasonText,
      })
      .select("id")
      .single();

    if (returnError) {
      console.error("Error creating deposit return:", returnError);
      return NextResponse.json(
        { error: "Failed to create deposit return record" },
        { status: 500 }
      );
    }

    // Create deduction records
    for (const d of parsedDeductions) {
      await supabase.from("rp_deposit_deductions").insert({
        deposit_id: depositId,
        category: d.category || "other",
        description: d.description || "Deduction",
        amount: parseFloat(d.amount) || 0,
        currency_code: deposit.currency_code,
        evidence_url: d.evidenceUrl || null,
        evidence_urls: d.evidenceUrls ?? [],
      });
    }

    // Update security deposit status
    const { error: updateError } = await supabase
      .from("rp_security_deposits")
      .update({
        status: "returned",
        returned_date: new Date().toISOString().split("T")[0],
        returned_amount: parsedRefundAmount,
        deductions_total: totalDeductions,
      })
      .eq("id", depositId);

    if (updateError) {
      console.error("Error updating deposit:", updateError);
    }

    // Update lease status based on refund reason
    const leaseUpdates: Record<string, string> = {};
    if (
      refundReason === "did_not_proceed" ||
      refundReason === "early_termination"
    ) {
      leaseUpdates.status = "terminated";
      leaseUpdates.termination_reason = reasonText;
    } else if (refundReason === "end_of_lease") {
      leaseUpdates.status = "expired";
    }

    if (Object.keys(leaseUpdates).length > 0) {
      await supabase
        .from("rp_leases")
        .update(leaseUpdates)
        .eq("id", leaseId);
    }

    // Notify tenant(s)
    const { data: leaseTenants } = await supabase
      .from("rp_lease_tenants")
      .select("rp_users!inner(id, first_name, last_name, email)")
      .eq("lease_id", leaseId);

    const propertyAddress = `${property.address_line1}, ${property.city}`;
    const formattedRefund = parsedRefundAmount.toFixed(2);

    for (const lt of leaseTenants ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tenant = lt.rp_users as any;

      // Create in-app notification
      await createNotification(supabase, {
        userId: tenant.id,
        title: "Security Deposit Return Statement",
        body: `A deposit return statement of ${deposit.currency_code} $${formattedRefund} has been prepared for ${propertyAddress}.`,
        type: "lease",
        urgency: "high",
      });

      // Send email
      try {
        await sendDepositReturnEmail({
          to: tenant.email,
          firstName: tenant.first_name,
          propertyAddress,
          refundAmount: formattedRefund,
          currency: deposit.currency_code,
        });
      } catch (emailErr) {
        console.error("Failed to send deposit return email:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      depositReturnId: depositReturn?.id,
    });
  } catch (err) {
    console.error("Deposit return error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
