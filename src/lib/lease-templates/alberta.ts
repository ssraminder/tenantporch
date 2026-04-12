/**
 * Alberta Standard Residential Tenancy Agreement template.
 * Based on the Residential Tenancies Act (Alberta) requirements.
 */

export interface LeaseClause {
  id: string;
  text: string;
  editable: boolean;
}

export interface LeaseSection {
  id: string;
  title: string;
  clauses: LeaseClause[];
}

export interface LeaseDocumentContent {
  templateVersion: string;
  province: string;
  sections: LeaseSection[];
  additionalTerms: LeaseClause[];
  generatedAt: string;
}

interface LeaseData {
  lease_type: string;
  start_date: string;
  end_date: string | null;
  monthly_rent: number;
  currency_code: string;
  security_deposit: number;
  deposit_paid_date: string | null;
  utility_split_percent: number | null;
  internet_included: boolean;
  pad_enabled: boolean;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  max_occupants: number;
  late_fee_type: string;
  late_fee_amount: number;
}

interface PropertyData {
  address_line1: string;
  address_line2: string | null;
  city: string;
  province_state: string;
  postal_code: string;
  unit_description: string | null;
  parking_type: string | null;
  parking_spots: number | null;
  laundry_type: string | null;
  storage_included: boolean;
  yard_access: boolean;
  has_separate_entrance: boolean;
}

interface PersonData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  id_type?: string | null;
  id_number?: string | null;
  id_place_of_issue?: string | null;
  id_expiry_date?: string | null;
  id_name_on_document?: string | null;
}

export interface OwnerData extends PersonData {
  designation: string;
}

const DESIGNATION_LABELS: Record<string, string> = {
  owner: "Owner",
  property_manager: "Property Manager",
  signing_authority: "Signing Authority",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "________________";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

function formatCurrency(amount: number, currency = "CAD"): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(amount);
}

const ID_TYPE_LABELS: Record<string, string> = {
  drivers_license: "Driver's License",
  passport: "Passport",
  provincial_id: "Provincial ID",
  pr_card: "PR Card",
  other: "Other",
};

export function generateAlbertaLeaseContent(
  lease: LeaseData,
  property: PropertyData,
  landlord: PersonData,
  tenants: PersonData[],
  owners?: OwnerData[]
): LeaseDocumentContent {
  const fullAddress = `${property.address_line1}${property.address_line2 ? `, ${property.address_line2}` : ""}, ${property.city}, ${property.province_state} ${property.postal_code}`;
  const tenantNames = tenants.map((t) => `${t.first_name} ${t.last_name}`).join(", ");
  const leaseTypeLabel = lease.lease_type === "fixed" ? "Fixed Term" : "Month-to-Month (Periodic)";

  // Build landlord/owner section text
  const ownersList = owners && owners.length > 0 ? owners : [{ ...landlord, designation: "owner" }];
  const ownersText = ownersList
    .map(
      (o) =>
        `• ${o.first_name} ${o.last_name} (${DESIGNATION_LABELS[o.designation] ?? o.designation})\n  Email: ${o.email}${o.phone ? `  |  Phone: ${o.phone}` : ""}`
    )
    .join("\n");

  const sections: LeaseSection[] = [
    {
      id: "parties",
      title: "1. Parties to the Agreement",
      clauses: [
        {
          id: "parties-landlord",
          text: `This Residential Tenancy Agreement ("Agreement") is entered into between:\n\nLandlord / Owner(s):\n${ownersText}`,
          editable: true,
        },
        {
          id: "parties-tenant",
          text: `Tenant(s):\n\n${"Name".padEnd(25)} ${"Email".padEnd(30)} Phone\n${"─".repeat(80)}\n${tenants.map((t) => `${(t.first_name + " " + t.last_name).padEnd(25)} ${t.email.padEnd(30)} ${t.phone ?? "—"}`).join("\n")}`,
          editable: true,
        },
      ],
    },
    {
      id: "premises",
      title: "2. Residential Premises",
      clauses: [
        {
          id: "premises-address",
          text: `The landlord agrees to rent to the tenant(s) the residential premises located at:\n\n${fullAddress}${property.unit_description ? `\nUnit Description: ${property.unit_description}` : ""}`,
          editable: true,
        },
        {
          id: "premises-features",
          text: `The premises includes the following:\n• Separate entrance: ${property.has_separate_entrance ? "Yes" : "No"}\n• Parking: ${property.parking_type && property.parking_type !== "none" ? `${property.parking_type} (${property.parking_spots ?? 0} spot${(property.parking_spots ?? 0) !== 1 ? "s" : ""})` : "None"}\n• Laundry: ${property.laundry_type && property.laundry_type !== "none" ? property.laundry_type.replace("_", " ") : "None"}\n• Storage: ${property.storage_included ? "Included" : "Not included"}\n• Yard access: ${property.yard_access ? "Yes" : "No"}`,
          editable: true,
        },
      ],
    },
    {
      id: "term",
      title: "3. Term of Tenancy",
      clauses: [
        {
          id: "term-type",
          text: `This tenancy is a ${leaseTypeLabel} tenancy.`,
          editable: false,
        },
        {
          id: "term-dates",
          text: `The tenancy begins on ${formatDate(lease.start_date)}${lease.end_date ? ` and ends on ${formatDate(lease.end_date)}` : " and continues on a month-to-month basis until terminated by either party in accordance with the Residential Tenancies Act (Alberta)"}.`,
          editable: true,
        },
      ],
    },
    {
      id: "rent",
      title: "4. Rent",
      clauses: [
        {
          id: "rent-amount",
          text: `The tenant agrees to pay rent in the amount of ${formatCurrency(lease.monthly_rent, lease.currency_code)} per month.`,
          editable: true,
        },
        {
          id: "rent-due",
          text: "Rent is due on the first (1st) day of each month. If rent is not paid by the due date, the landlord may issue a 14-day notice to terminate the tenancy for non-payment of rent pursuant to the Residential Tenancies Act.",
          editable: true,
        },
        {
          id: "rent-method",
          text: lease.pad_enabled
            ? "Rent shall be collected via pre-authorized debit (PAD) from the tenant's designated bank account."
            : "Rent shall be paid by the method agreed upon by both parties (e-Transfer, cheque, bank transfer, or other accepted method).",
          editable: true,
        },
        ...(lease.late_fee_amount > 0
          ? [
              {
                id: "rent-late-fee",
                text: `A late fee of ${lease.late_fee_type === "percent" ? `${lease.late_fee_amount}% of monthly rent` : formatCurrency(lease.late_fee_amount, lease.currency_code)} will apply if rent is not received within 3 days of the due date.`,
                editable: true,
              },
            ]
          : []),
      ],
    },
    {
      id: "deposit",
      title: "5. Security Deposit",
      clauses: [
        {
          id: "deposit-amount",
          text: lease.security_deposit > 0
            ? `The tenant has paid a security deposit of ${formatCurrency(lease.security_deposit, lease.currency_code)}${lease.deposit_paid_date ? ` on ${formatDate(lease.deposit_paid_date)}` : ""}. Pursuant to the Residential Tenancies Act, the security deposit shall not exceed one month's rent.`
            : "No security deposit is required for this tenancy.",
          editable: true,
        },
        ...(lease.security_deposit > 0
          ? [
              {
                id: "deposit-return",
                text: "The landlord shall return the security deposit, with accrued interest as prescribed by regulation, within 10 days after the tenant vacates the premises and the condition inspection has been completed, less any deductions permitted under the Residential Tenancies Act.",
                editable: true,
              },
              {
                id: "deposit-inspection",
                text: "An inspection report shall be completed and signed by both parties at the start and end of the tenancy, as required by the Residential Tenancies Act. The condition of the premises at move-in and move-out shall be documented.",
                editable: true,
              },
            ]
          : []),
      ],
    },
    {
      id: "utilities",
      title: "6. Utilities and Services",
      clauses: [
        {
          id: "utilities-split",
          text: lease.utility_split_percent != null && lease.utility_split_percent > 0
            ? `The tenant is responsible for ${lease.utility_split_percent}% of utility costs (electricity, gas, water, sewer, waste removal) as applicable.`
            : "All utilities are included in the monthly rent.",
          editable: true,
        },
        {
          id: "utilities-internet",
          text: lease.internet_included
            ? "Internet service is included in the monthly rent and provided by the landlord."
            : "Internet service is NOT included. The tenant is responsible for arranging and paying for their own internet service.",
          editable: true,
        },
      ],
    },
    {
      id: "rules",
      title: "7. Rules and Policies",
      clauses: [
        {
          id: "rules-occupants",
          text: `The maximum number of occupants permitted in the premises is ${lease.max_occupants}. All occupants over the age of 18 must be listed in this agreement.`,
          editable: true,
        },
        {
          id: "rules-pets",
          text: lease.pets_allowed
            ? "Pets are permitted in the premises, subject to any applicable condominium bylaws or restrictions. The tenant is responsible for any damage caused by pets."
            : "No pets are permitted in the premises without the prior written consent of the landlord.",
          editable: true,
        },
        {
          id: "rules-smoking",
          text: lease.smoking_allowed
            ? "Smoking is permitted in designated areas only. The tenant is responsible for any damage or additional cleaning costs resulting from smoking."
            : "Smoking (including cannabis and vaping) is NOT permitted anywhere on the premises, including balconies and patios.",
          editable: true,
        },
        {
          id: "rules-quiet",
          text: "The tenant agrees to conduct themselves in a manner that does not unreasonably disturb other tenants or neighbours. Quiet enjoyment hours are from 10:00 PM to 8:00 AM.",
          editable: true,
        },
      ],
    },
    {
      id: "maintenance",
      title: "8. Maintenance and Repairs",
      clauses: [
        {
          id: "maintenance-landlord",
          text: "The landlord is responsible for maintaining the premises in a condition that meets the health, safety, and housing standards required by law. The landlord shall make repairs within a reasonable time after receiving notice from the tenant.",
          editable: true,
        },
        {
          id: "maintenance-tenant",
          text: "The tenant is responsible for keeping the premises reasonably clean and for repairing any damage caused by the tenant, the tenant's guests, or pets (if permitted). The tenant shall promptly notify the landlord of any repairs needed.",
          editable: true,
        },
      ],
    },
    {
      id: "entry",
      title: "9. Landlord's Right of Entry",
      clauses: [
        {
          id: "entry-notice",
          text: "The landlord may enter the premises after giving the tenant at least 24 hours' written notice, stating the date, time (which must be between 8:00 AM and 8:00 PM), and reason for entry. Entry without notice is permitted only in cases of emergency or if the tenant consents at the time of entry.",
          editable: false,
        },
      ],
    },
    {
      id: "termination",
      title: "10. Termination and Notice",
      clauses: [
        {
          id: "termination-periodic",
          text: lease.lease_type === "month_to_month"
            ? "Either party may terminate this periodic tenancy by giving at least one full tenancy month's written notice (minimum 30 days), with the termination date being the last day of a tenancy month."
            : "This fixed-term tenancy ends on the date specified in Section 3. If neither party gives written notice to end the tenancy at least 30 days before the end date, the tenancy continues as a periodic (month-to-month) tenancy.",
          editable: true,
        },
        {
          id: "termination-cause",
          text: "The landlord may terminate the tenancy for substantial breach (14-day notice) or non-payment of rent (14-day notice) as provided under the Residential Tenancies Act. The tenant may apply to the Residential Tenancy Dispute Resolution Service (RTDRS) or Provincial Court to challenge any termination.",
          editable: false,
        },
      ],
    },
    {
      id: "dispute",
      title: "11. Dispute Resolution",
      clauses: [
        {
          id: "dispute-resolution",
          text: "Disputes arising under this agreement may be resolved through the Residential Tenancy Dispute Resolution Service (RTDRS) or the Provincial Court of Alberta, as provided under the Residential Tenancies Act.",
          editable: false,
        },
      ],
    },
    {
      id: "general",
      title: "12. General Provisions",
      clauses: [
        {
          id: "general-copy",
          text: "The landlord shall provide the tenant with a copy of this agreement within 21 days of signing, as required by the Residential Tenancies Act.",
          editable: false,
        },
        {
          id: "general-governing",
          text: "This agreement is governed by the Residential Tenancies Act (Alberta) and the Residential Tenancy Ministerial Regulation. In the event of any conflict between this agreement and the Act, the Act prevails.",
          editable: false,
        },
      ],
    },
    {
      id: "schedule-a",
      title: "Schedule A — Property Details",
      clauses: [
        {
          id: "schedule-a-details",
          text: `Property Address: ${fullAddress}${property.unit_description ? `\nUnit Description: ${property.unit_description}` : ""}\n\nParking: ${property.parking_type && property.parking_type !== "none" ? `${property.parking_type} — ${property.parking_spots ?? 0} spot(s)` : "None"}\nLaundry: ${property.laundry_type && property.laundry_type !== "none" ? property.laundry_type.replace("_", " ") : "None"}\nStorage: ${property.storage_included ? "Included" : "Not included"}\nYard Access: ${property.yard_access ? "Yes" : "No"}\nSeparate Entrance: ${property.has_separate_entrance ? "Yes" : "No"}`,
          editable: true,
        },
      ],
    },
    {
      id: "schedule-b",
      title: "Schedule B — Tenant Identification",
      clauses: tenants.map((t, i) => ({
        id: `schedule-b-tenant-${i}`,
        text: `Tenant ${i + 1}: ${t.first_name} ${t.last_name}\n${"─".repeat(40)}\n• Name:              ${t.first_name} ${t.last_name}\n• Email:             ${t.email}\n• Phone:             ${t.phone ?? "—"}\n• ID Type:           ${t.id_type ? ID_TYPE_LABELS[t.id_type] ?? t.id_type : "Not provided"}\n• ID Number:         ${t.id_number ?? "Not provided"}\n• Name on Document:  ${t.id_name_on_document ?? "Not provided"}\n• Place of Issue:    ${t.id_place_of_issue ?? "Not provided"}\n• Expiry Date:       ${t.id_expiry_date ? formatDate(t.id_expiry_date) : "Not provided"}`,
        editable: false,
      })),
    },
  ];

  return {
    templateVersion: "AB-2026-1.0",
    province: "AB",
    sections,
    additionalTerms: [],
    generatedAt: new Date().toISOString(),
  };
}
