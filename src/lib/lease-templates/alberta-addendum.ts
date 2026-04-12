/**
 * Alberta Residential Tenancy Agreement — Addendum Template
 *
 * Compliant with the Residential Tenancies Act (RSA 2000, c. R-17.1)
 * and the Electronic Transactions Act (SA 2001, c. E-5.5).
 */

export interface AddendumClause {
  id: string;
  text: string;
}

export interface AddendumDocumentContent {
  templateVersion: string;
  province: string;
  addendumType: string;
  title: string;
  clauses: AddendumClause[];
  generatedAt: string;
}

export const ADDENDUM_TYPE_LABELS: Record<string, string> = {
  occupant: "Additional Permitted Occupant",
  pet: "Pet Agreement",
  parking: "Parking Arrangement",
  utility: "Utility Adjustment",
  storage: "Storage Agreement",
  maintenance: "Maintenance / Repair Charge",
  other: "General Addendum",
};

interface AddendumParams {
  addendumType: string;
  title: string;
  description: string;
  additionalRentAmount: number;
  currencyCode: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  lease: {
    startDate: string;
    endDate: string | null;
    monthlyRent: number;
  };
  property: {
    addressLine1: string;
    city: string;
    provinceState: string;
    postalCode: string;
  };
  landlord: {
    firstName: string;
    lastName: string;
  };
  tenants: {
    firstName: string;
    lastName: string;
  }[];
  // Extra fields for specific addendum types
  occupantName?: string;
  petDescription?: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCurrency(amount: number, code: string): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: code,
  }).format(amount);
}

export function generateAlbertaAddendumContent(
  params: AddendumParams
): AddendumDocumentContent {
  const {
    addendumType,
    title,
    description,
    additionalRentAmount,
    currencyCode,
    effectiveFrom,
    effectiveTo,
    lease,
    property,
    landlord,
    tenants,
  } = params;

  const fullAddress = [
    property.addressLine1,
    property.city,
    property.provinceState,
    property.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  const landlordName = `${landlord.firstName} ${landlord.lastName}`;
  const tenantNames = tenants
    .map((t) => `${t.firstName} ${t.lastName}`)
    .join(", ");

  const effectivePeriod = effectiveTo
    ? `${formatDate(effectiveFrom)} to ${formatDate(effectiveTo)}`
    : `${formatDate(effectiveFrom)} onward (until lease termination)`;

  const newTotalRent = lease.monthlyRent + additionalRentAmount;

  const clauses: AddendumClause[] = [];
  let clauseNum = 0;

  // 1. Recitals — reference to original lease
  clauses.push({
    id: `clause-${++clauseNum}`,
    text: `WHEREAS the Landlord, ${landlordName}, and the Tenant(s), ${tenantNames}, entered into a Residential Tenancy Agreement ("Original Lease") dated ${formatDate(lease.startDate)}${lease.endDate ? ` to ${formatDate(lease.endDate)}` : ""} for the premises located at ${fullAddress}, Province of Alberta;`,
  });

  clauses.push({
    id: `clause-${++clauseNum}`,
    text: `AND WHEREAS the parties wish to amend the Original Lease as set out below, in accordance with the Residential Tenancies Act (RSA 2000, c. R-17.1);`,
  });

  clauses.push({
    id: `clause-${++clauseNum}`,
    text: `NOW THEREFORE, in consideration of the mutual covenants herein, the parties agree as follows:`,
  });

  // 2. Amendment type and description
  clauses.push({
    id: `clause-${++clauseNum}`,
    text: `AMENDMENT TYPE: ${ADDENDUM_TYPE_LABELS[addendumType] ?? title}`,
  });

  clauses.push({
    id: `clause-${++clauseNum}`,
    text: `DESCRIPTION OF AMENDMENT: ${description}`,
  });

  // 3. Type-specific clauses
  if (addendumType === "occupant" && params.occupantName) {
    clauses.push({
      id: `clause-${++clauseNum}`,
      text: `PERMITTED OCCUPANT: ${params.occupantName} is hereby added as a permitted occupant of the premises. The permitted occupant is not a party to the Original Lease and does not assume the obligations of a tenant. The Tenant(s) remain fully responsible for all obligations under the Original Lease, including the conduct of the permitted occupant.`,
    });
  }

  if (addendumType === "pet" && params.petDescription) {
    clauses.push({
      id: `clause-${++clauseNum}`,
      text: `PET AUTHORIZATION: The Tenant is permitted to keep the following pet(s) at the premises: ${params.petDescription}. The Tenant accepts full responsibility for any damage caused by the pet(s) and agrees to comply with all municipal bylaws regarding animals. This permission may be revoked if the pet causes a nuisance or damage, in accordance with section 29 of the Residential Tenancies Act.`,
    });
  }

  // 4. Effective period
  clauses.push({
    id: `clause-${++clauseNum}`,
    text: `EFFECTIVE PERIOD: This addendum shall be effective from ${effectivePeriod}.${effectiveTo ? ` Upon expiry of this addendum, the terms of the Original Lease shall revert to their prior state, including the original monthly rent of ${formatCurrency(lease.monthlyRent, currencyCode)}.` : ""}`,
  });

  // 5. Rent adjustment (if applicable)
  if (additionalRentAmount > 0) {
    clauses.push({
      id: `clause-${++clauseNum}`,
      text: `RENT ADJUSTMENT: During the effective period of this addendum, the monthly rent shall be increased by ${formatCurrency(additionalRentAmount, currencyCode)} from ${formatCurrency(lease.monthlyRent, currencyCode)} to ${formatCurrency(newTotalRent, currencyCode)}. This increase is in addition to any rent increases permitted under the Original Lease and the Residential Tenancies Act.`,
    });

    clauses.push({
      id: `clause-${++clauseNum}`,
      text: `PAYMENT TERMS: The adjusted rent of ${formatCurrency(newTotalRent, currencyCode)} per month is due on the same date and in the same manner as specified in the Original Lease.`,
    });
  }

  // 6. General provisions
  clauses.push({
    id: `clause-${++clauseNum}`,
    text: `REMAINDER OF LEASE: Except as expressly amended by this addendum, all other terms and conditions of the Original Lease shall remain in full force and effect. In the event of any conflict between this addendum and the Original Lease, the terms of this addendum shall prevail for the duration of the effective period.`,
  });

  clauses.push({
    id: `clause-${++clauseNum}`,
    text: `GOVERNING LAW: This addendum is governed by the laws of the Province of Alberta, including the Residential Tenancies Act (RSA 2000, c. R-17.1). Any disputes arising from this addendum shall be resolved in accordance with the dispute resolution provisions of the Original Lease and the Act.`,
  });

  clauses.push({
    id: `clause-${++clauseNum}`,
    text: `NOTICE: The landlord shall provide the tenant with a copy of this signed addendum within 21 days of execution, as required by section 5(2) of the Residential Tenancies Act.`,
  });

  clauses.push({
    id: `clause-${++clauseNum}`,
    text: `ELECTRONIC SIGNATURES: The parties agree that this addendum may be executed electronically in accordance with the Electronic Transactions Act (SA 2001, c. E-5.5). Electronic signatures shall have the same legal effect as handwritten signatures.`,
  });

  clauses.push({
    id: `clause-${++clauseNum}`,
    text: `COUNTERPARTS: This addendum may be executed in counterparts, each of which shall be deemed an original, and all of which together shall constitute one and the same instrument.`,
  });

  return {
    templateVersion: "Alberta Addendum v1.0",
    province: "Alberta",
    addendumType,
    title,
    clauses,
    generatedAt: new Date().toISOString(),
  };
}
