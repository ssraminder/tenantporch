/**
 * Renders a landlord-saved lease template into concrete LeaseDocumentContent
 * by substituting {{placeholder}} tokens in every clause text.
 *
 * Used by the "apply template to new lease" flow on /admin/leases/new.
 */

import type { LeaseDocumentContent, LeaseClause, LeaseSection } from "./alberta";

export type LandlordTemplateDocument = {
  document_type: "lease_agreement" | "schedule_a" | "schedule_b" | "custom";
  title: string;
  sort_order: number;
  document_content: LeaseDocumentContent;
};

export type LandlordTemplateDefaults = {
  utility_split_percent?: number;
  internet_included?: boolean;
  pets_allowed?: boolean;
  smoking_allowed?: boolean;
  max_occupants?: number;
  late_fee_type?: "flat" | "percentage" | "none";
  late_fee_amount?: number;
  late_fee_grace_days?: number;
  card_surcharge_percent?: number;
  holdover_rent?: number | null;
  nsf_fee?: number;
  early_term_notice_days?: number;
  rent_due_day?: number;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  guest_max_consecutive_nights?: number;
  guest_max_monthly_nights?: number;
};

export type LandlordTemplate = {
  id: string;
  landlord_id: string | null;
  name: string;
  description: string | null;
  province_code: string;
  country_code: string | null;
  version: string;
  is_active: boolean;
  defaults: LandlordTemplateDefaults;
  documents: LandlordTemplateDocument[];
  created_at: string;
  updated_at: string;
};

export type RenderContext = {
  // Property
  property_full_address: string;
  unit_description: string;
  sticker_no: string;

  // Landlord
  landlord_block: string;
  landlord_block_names: string; // names only, comma-separated
  landlord_address: string;
  landlord_etransfer_email: string;

  // Tenants
  tenant_block: string;
  tenant_names: string;
  tenant_count: number;

  // Permitted occupant (optional)
  permitted_occupant: string;

  // Lease term
  start_date_long: string;
  end_date_long: string;
  end_time_clause: string;
  rent_due_day_ordinal: string;

  // Money
  monthly_rent: string;
  first_rent_amount: string;
  first_rent_date: string;
  deposit_amount: string;
  deposit_paid_date: string;
  holdover_rent: string;
  late_fee_amount: string;
  late_fee_grace_days: string;
  nsf_fee: string;
  card_surcharge_pct: string;

  // Utilities
  utility_split_pct: string;
  utility_split_words: string;

  // Rules
  max_occupants: string;
  guest_consec_nights: string;
  guest_monthly_nights: string;
  early_term_notice_days: string;

  // Date metadata
  agreement_date_long: string;
};

const NUMBER_WORDS = [
  "zero","one","two","three","four","five","six","seven","eight","nine","ten",
  "eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen",
  "eighteen","nineteen","twenty","twenty-one","twenty-two","twenty-three",
  "twenty-four","twenty-five",
];

export function numberToWord(n: number): string {
  if (n >= 0 && n < NUMBER_WORDS.length) return NUMBER_WORDS[n];
  return String(n);
}

export function ordinal(n: number): string {
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function formatLongDate(iso: string | null | undefined): string {
  if (!iso) return "________________";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatCurrency(
  n: number | null | undefined,
  currency: string = "CAD"
): string {
  if (n == null || Number.isNaN(n)) return "________";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
  }).format(n);
}

export function pctWords(pct: number): string {
  // 40 -> "forty percent (40%)"
  const integers = ["zero","one","two","three","four","five","six","seven","eight","nine","ten",
    "eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
  const tens = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
  const whole = Math.floor(pct);
  let words: string;
  if (whole < 20) {
    words = integers[whole] ?? String(whole);
  } else if (whole < 100) {
    const t = Math.floor(whole / 10);
    const o = whole % 10;
    words = o === 0 ? tens[t] : `${tens[t]}-${integers[o]}`;
  } else {
    words = String(whole);
  }
  return `${words} percent (${whole}%)`;
}

/** Replace every `{{key}}` token in `text` using the provided context. */
export function renderText(text: string, ctx: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (key in ctx) return ctx[key];
    // Leave unknown tokens untouched so the editor surfaces them.
    return match;
  });
}

export function renderClause(
  clause: LeaseClause,
  ctx: Record<string, string>
): LeaseClause {
  return { ...clause, text: renderText(clause.text, ctx) };
}

export function renderSection(
  section: LeaseSection,
  ctx: Record<string, string>
): LeaseSection {
  return {
    ...section,
    clauses: section.clauses.map((c) => renderClause(c, ctx)),
  };
}

export function renderDocumentContent(
  content: LeaseDocumentContent,
  ctx: Record<string, string>
): LeaseDocumentContent {
  return {
    ...content,
    sections: content.sections.map((s) => renderSection(s, ctx)),
    additionalTerms: (content.additionalTerms ?? []).map((c) =>
      renderClause(c, ctx)
    ),
    generatedAt: new Date().toISOString(),
  };
}

// ============================================================
// Context builder — turns lease form data + lookups into placeholders
// ============================================================

export type LeaseFormInput = {
  start_date: string | null;
  end_date: string | null;
  monthly_rent: number;
  currency_code: string;
  security_deposit: number;
  deposit_paid_date: string | null;
  utility_split_percent: number | null;
  max_occupants: number | null;
  late_fee_amount: number | null;
  late_fee_grace_days?: number | null;
  rent_due_day?: number | null;
  first_rent_due_date?: string | null;
};

export type PropertyInput = {
  address_line1: string;
  address_line2?: string | null;
  city: string;
  province_state: string;
  postal_code: string;
  unit_description?: string | null;
};

export type PersonInput = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
};

export type OwnerInput = PersonInput & { designation?: string };

export function buildRenderContext(args: {
  lease: LeaseFormInput;
  property: PropertyInput;
  landlord: PersonInput;
  owners?: OwnerInput[];
  tenants: PersonInput[];
  permittedOccupant?: string | null;
  defaults: LandlordTemplateDefaults;
}): RenderContext {
  const {
    lease,
    property,
    landlord,
    owners,
    tenants,
    permittedOccupant,
    defaults,
  } = args;

  const propAddress = `${property.address_line1}${
    property.address_line2 ? `, ${property.address_line2}` : ""
  }, ${property.city}, ${property.province_state} ${property.postal_code}`;

  // Build landlord block — show all owners if provided, else just the landlord.
  const ownersList: OwnerInput[] =
    owners && owners.length > 0 ? owners : [{ ...landlord, designation: "owner" }];
  const landlordBlock = ownersList
    .map((o) => {
      const parts = [`${o.first_name} ${o.last_name}`];
      if (o.phone) parts.push(`Phone: ${o.phone}`);
      parts.push(`Email: ${o.email}`);
      return parts.join(" — ");
    })
    .join("\n");

  const landlordBlockNames =
    ownersList.length === 0
      ? "________________"
      : ownersList.length === 1
        ? `${ownersList[0].first_name} ${ownersList[0].last_name}`
        : ownersList
            .map((o) => `${o.first_name} ${o.last_name}`)
            .join(" and ");

  // Tenant block — numbered list
  const tenantBlock =
    tenants.length === 0
      ? "________________"
      : tenants
          .map((t, i) => {
            const parts = [
              `${i + 1}. ${t.first_name} ${t.last_name}`,
              ...(t.phone ? [`Phone: ${t.phone}`] : []),
              `Email: ${t.email}`,
            ];
            return parts.join(" — ");
          })
          .join("\n");

  const tenantNames =
    tenants.length === 0
      ? "________________"
      : tenants.length === 1
        ? `${tenants[0].first_name} ${tenants[0].last_name}`
        : tenants
            .map((t) => `${t.first_name} ${t.last_name}`)
            .join(" and ");

  const utilityPct = lease.utility_split_percent ?? defaults.utility_split_percent ?? 0;
  const rentDueDay =
    lease.rent_due_day ??
    defaults.rent_due_day ??
    (lease.start_date ? new Date(lease.start_date + "T00:00:00").getDate() : 1);

  // Holdover defaults to 1.5× monthly rent if not supplied.
  const holdoverRent =
    defaults.holdover_rent != null
      ? defaults.holdover_rent
      : Math.round(lease.monthly_rent * 1.5);

  const endTimeClause = lease.end_date
    ? `11:59 PM on ${formatLongDate(lease.end_date)}`
    : "11:59 PM on the last day of the Term";

  return {
    property_full_address: propAddress,
    unit_description: property.unit_description ?? "________________",
    sticker_no: "________",

    landlord_block: landlordBlock,
    landlord_block_names: landlordBlockNames,
    landlord_address: propAddress, // landlord can override per template
    landlord_etransfer_email: landlord.email,

    tenant_block: tenantBlock,
    tenant_names: tenantNames,
    tenant_count: tenants.length,

    permitted_occupant: permittedOccupant?.trim() || "",

    start_date_long: formatLongDate(lease.start_date),
    end_date_long: formatLongDate(lease.end_date),
    end_time_clause: endTimeClause,
    rent_due_day_ordinal: ordinal(rentDueDay),

    monthly_rent: formatCurrency(lease.monthly_rent, lease.currency_code),
    first_rent_amount: formatCurrency(lease.monthly_rent, lease.currency_code),
    first_rent_date: formatLongDate(
      lease.first_rent_due_date ?? lease.start_date
    ),
    deposit_amount: formatCurrency(lease.security_deposit, lease.currency_code),
    deposit_paid_date: formatLongDate(lease.deposit_paid_date),
    holdover_rent: formatCurrency(holdoverRent, lease.currency_code),
    late_fee_amount: formatCurrency(
      lease.late_fee_amount ?? defaults.late_fee_amount ?? 0,
      lease.currency_code
    ),
    late_fee_grace_days: numberToWord(
      lease.late_fee_grace_days ?? defaults.late_fee_grace_days ?? 5
    ),
    nsf_fee: formatCurrency(defaults.nsf_fee ?? 50, lease.currency_code),
    card_surcharge_pct: `${defaults.card_surcharge_percent ?? 4}%`,

    utility_split_pct: `${utilityPct}%`,
    utility_split_words: pctWords(utilityPct),

    max_occupants: numberToWord(
      lease.max_occupants ?? defaults.max_occupants ?? 3
    ),
    guest_consec_nights: numberToWord(
      defaults.guest_max_consecutive_nights ?? 3
    ),
    guest_monthly_nights: numberToWord(
      defaults.guest_max_monthly_nights ?? 7
    ),
    early_term_notice_days: numberToWord(
      defaults.early_term_notice_days ?? 60
    ),

    agreement_date_long: formatLongDate(new Date().toISOString().slice(0, 10)),
  };
}

/** Convenience: render a `LandlordTemplate.documents[]` payload as concrete content. */
export function renderTemplateDocuments(
  documents: LandlordTemplateDocument[],
  ctx: RenderContext
): LandlordTemplateDocument[] {
  // Cast through Record because RenderContext fields are all strings/numbers.
  const stringCtx: Record<string, string> = Object.fromEntries(
    Object.entries(ctx).map(([k, v]) => [k, String(v)])
  );
  return documents.map((doc) => ({
    ...doc,
    document_content: renderDocumentContent(doc.document_content, stringCtx),
  }));
}
