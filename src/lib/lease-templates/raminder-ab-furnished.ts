/**
 * Seed content for Raminder Shah's "Alberta Furnished Suite" lease template.
 *
 * Derived from `01_Lease_Agreement Draft - Anmol and Lovepreet.pdf` (April 20, 2026).
 * The clauses are parameterized with `{{placeholders}}` so the same template can
 * be applied to any property/tenants. The placeholder set is documented in
 * `template-renderer.ts` (`RenderContext`).
 *
 * Used once by the seed script + can be re-applied via the templates UI.
 */

import type { LeaseDocumentContent } from "./alberta";
import type {
  LandlordTemplateDocument,
  LandlordTemplateDefaults,
} from "./template-renderer";

const TEMPLATE_VERSION = "AB-RAMINDER-FURNISHED-1.0";

export const RAMINDER_TEMPLATE_DEFAULTS: LandlordTemplateDefaults = {
  utility_split_percent: 40,
  internet_included: true,
  pets_allowed: false,
  smoking_allowed: false,
  max_occupants: 3,
  late_fee_type: "flat",
  late_fee_amount: 50,
  late_fee_grace_days: 5,
  card_surcharge_percent: 4,
  holdover_rent: null, // computed at render time as 1.5× monthly rent if blank
  nsf_fee: 50,
  early_term_notice_days: 60,
  rent_due_day: 1,
  quiet_hours_start: "10:00 PM",
  quiet_hours_end: "8:00 AM",
  guest_max_consecutive_nights: 3,
  guest_max_monthly_nights: 7,
};

function leaseAgreementContent(): LeaseDocumentContent {
  return {
    templateVersion: TEMPLATE_VERSION,
    province: "AB",
    additionalTerms: [],
    generatedAt: new Date().toISOString(),
    sections: [
      {
        id: "definitions",
        title: "Definitions",
        clauses: [
          { id: "def-intro", editable: false, text: "In this Agreement, the following terms have the meanings set out below:" },
          { id: "def-landlord", editable: true, text: '"Landlord" means {{landlord_block_names}}, jointly and severally, and includes their authorized agents.' },
          { id: "def-tenant", editable: true, text: '"Tenant" means {{tenant_names}}, jointly and severally.' },
          { id: "def-occupant", editable: true, text: '"Permitted Occupant" means {{permitted_occupant}}, who is authorized to reside at the Premises for the Term but is not a party to this Agreement and has no financial obligations hereunder. (Delete this clause if no permitted occupant.)' },
          { id: "def-premises", editable: true, text: '"Premises" means {{unit_description}} located at {{property_full_address}}.' },
          { id: "def-term", editable: true, text: '"Term" means the period from {{start_date_long}} to {{end_date_long}}.' },
          { id: "def-rta", editable: false, text: '"RTA" means the Residential Tenancies Act, SA 2004, c. R-17.1, as amended from time to time.' },
          { id: "def-rtdrs", editable: false, text: '"RTDRS" means the Residential Tenancy Dispute Resolution Service of Alberta.' },
        ],
      },
      {
        id: "parties",
        title: "1. Parties",
        clauses: [
          { id: "parties-landlord", editable: true, text: "Landlord:\n\n{{landlord_block}}\n\nLandlord Address: {{landlord_address}}" },
          { id: "parties-tenant", editable: true, text: "Tenant (jointly and severally liable):\n\n{{tenant_block}}\n\nFull identification details are set out in Schedule B (Tenant Identification)." },
          { id: "parties-occupant", editable: true, text: "Permitted Occupant:\n\n{{permitted_occupant}}\n\nFull identification details are set out in Schedule B (Tenant Identification).\n\nThe Permitted Occupant is authorized to reside at the Premises for the duration of the Term. They are not a party to this Agreement, are not required to sign this lease, and bear no independent financial obligations hereunder. The Tenant assumes full liability for the Permitted Occupant's conduct, actions, omissions, negligence, and any resulting damages, costs, or claims, as if such acts were the Tenant's own. (Delete this clause if no permitted occupant.)" },
        ],
      },
      {
        id: "premises",
        title: "2. Rental Premises",
        clauses: [
          { id: "premises-intro", editable: false, text: "The Landlord agrees to rent to the Tenant the following Premises:" },
          { id: "premises-address", editable: true, text: "Address: {{property_full_address}}" },
          { id: "premises-unit", editable: true, text: "Unit Description: {{unit_description}}" },
          { id: "premises-included", editable: true, text: "Included: The Premises include dedicated bins for garbage (black), recycling (blue), and compost (green). One (1) driveway parking spot is included." },
          { id: "premises-backyard", editable: true, text: "Backyard: Shared use of the backyard with the main dwelling occupants. The Tenant shall keep the shared area clean and shall not store personal belongings in the backyard without the Landlord's prior written approval." },
        ],
      },
      {
        id: "term",
        title: "3. Term of Tenancy",
        clauses: [
          { id: "term-fixed", editable: true, text: "This is a fixed-term tenancy commencing on {{start_date_long}} and ending on {{end_date_long}}." },
          { id: "term-vacate", editable: true, text: "The Tenant shall vacate the Premises no later than {{end_time_clause}}, unless a new written agreement is executed by both parties." },
          { id: "term-no-renewal", editable: false, text: "No Automatic Renewal: This lease shall not automatically renew or convert to a periodic tenancy." },
          { id: "term-holdover", editable: true, text: "Holdover: If the Tenant remains in possession after the Term without the Landlord's written consent, the Landlord may pursue all remedies available under the RTA, including an application for possession. If the Landlord elects, in writing, to accept the Tenant as a month-to-month tenant, the monthly rent during such holdover shall be {{holdover_rent}} (being the agreed holdover rate), terminable by either party with the notice periods prescribed by the RTA." },
        ],
      },
      {
        id: "rent",
        title: "4. Rent",
        clauses: [
          { id: "rent-amount", editable: true, text: "Monthly Rent: {{monthly_rent}}" },
          { id: "rent-due", editable: true, text: "Due Date: The {{rent_due_day_ordinal}} day of each calendar month, in advance." },
          { id: "rent-first", editable: true, text: "First Rent Payment: {{first_rent_amount}} due on or before {{first_rent_date}}." },
          { id: "rent-method", editable: true, text: "Payment Method: Rent may be paid by: (a) Interac e-transfer to {{landlord_etransfer_email}} (the Tenant shall include the unit address {{property_full_address}} in the memo); (b) credit card; or (c) debit card. A processing surcharge of {{card_surcharge_pct}} of the payment amount applies to all credit card and debit card transactions. This surcharge reflects the actual third-party processing fees incurred by the Landlord and is not a penalty." },
          { id: "rent-late-fee", editable: true, text: "Late Fee: If rent is not received in full by 11:59 PM on the {{late_fee_grace_days}} day of the month, the Tenant shall pay a one-time administrative late fee of {{late_fee_amount}}, representing the Landlord's reasonable administrative costs arising from late payment. This fee does not limit any other remedies available to the Landlord under the RTA." },
          { id: "rent-nsf", editable: true, text: "NSF Fee: A fee of {{nsf_fee}} shall be charged for any payment returned due to non-sufficient funds, reflecting the Landlord's actual bank charges and administrative costs." },
          { id: "rent-joint", editable: false, text: "Joint and Several Liability: All Tenants are jointly and severally liable for the full amount of rent and all obligations under this Agreement. The Landlord may pursue any one or all Tenants for any unpaid amounts." },
        ],
      },
      {
        id: "deposit",
        title: "5. Security Deposit",
        clauses: [
          { id: "deposit-amount", editable: true, text: "Amount: {{deposit_amount}}" },
          { id: "deposit-paid", editable: true, text: "Date Paid: {{deposit_paid_date}}" },
          { id: "deposit-trust", editable: false, text: "Trust Requirement: The Landlord shall place the security deposit in a trust account at an Alberta financial institution within two (2) banking days of receiving it, as required by the RTA." },
          { id: "deposit-interest", editable: false, text: "Interest: Interest shall accrue on the security deposit at the rate prescribed by the Residential Tenancies Ministerial Regulation and shall be paid to the Tenant at the end of the tenancy, together with the return of the deposit or remaining balance." },
          { id: "deposit-not-rent", editable: false, text: "Not Rent: The security deposit shall not be applied as rent for any month, including the last month of the tenancy. Any attempt by the Tenant to withhold rent and apply the deposit as rent shall constitute a breach of this Agreement." },
          { id: "deposit-return", editable: false, text: "Return and Deductions: The Landlord shall return the security deposit or any balance owing, together with accrued interest and a written statement of deductions, within the time and in the manner required by the RTA. The Landlord may make deductions from the security deposit only as permitted by the RTA, including rent arrears and proven lawful charges, and for damages beyond normal wear and tear where supported by compliant move-in and move-out inspection reports as required by law." },
        ],
      },
      {
        id: "utilities",
        title: "6. Utilities",
        clauses: [
          { id: "utilities-split", editable: true, text: "The Tenant shall pay {{utility_split_words}} of the actual utility charges for the property for each billing period, including electricity, natural gas, water, sewer, and waste removal." },
          { id: "utilities-billing", editable: true, text: "Billing Evidence: The Landlord shall provide a copy or screenshot of the actual utility bill to the Tenant, showing the total amount and the Tenant's {{utility_split_pct}} share. Payment is due within seven (7) days of written delivery of the statement." },
          { id: "utilities-internet", editable: true, text: "Internet: Internet service is included in the rent. The Landlord shall provide reasonable internet access. The Tenant shall not tamper with, modify, or share the internet service outside of the Premises." },
          { id: "utilities-default", editable: false, text: "Failure to pay utility charges when due shall be treated as unpaid rent and subject to the same remedies available under the RTA." },
        ],
      },
      {
        id: "furnished",
        title: "7. Furnished Premises",
        clauses: [
          { id: "furnished-listing", editable: true, text: "The Premises are rented as a fully furnished unit. The items provided by the Landlord are listed in Schedule A (Furnished Inventory) attached to this Agreement." },
          { id: "furnished-care", editable: true, text: "The Tenant shall maintain all furnished items in good condition, ordinary wear and tear excepted. The Tenant shall be responsible for the cost of repair or replacement of any furnished item that is damaged, destroyed, or missing at the end of the tenancy, as documented by the inspection reports." },
          { id: "furnished-removal", editable: false, text: "The Tenant shall not remove any furnished item from the Premises without the prior written consent of the Landlord." },
        ],
      },
      {
        id: "use",
        title: "8. Use and Occupancy",
        clauses: [
          { id: "use-residential", editable: false, text: "The Premises shall be used exclusively as a private residential dwelling for the Tenant and the Permitted Occupant only." },
          { id: "use-max-occupancy", editable: true, text: "Maximum Occupancy: {{max_occupants}} ({{max_occupants}}) persons." },
          { id: "use-guests", editable: true, text: "Guests: Guests (other than the Permitted Occupant) may not stay for more than {{guest_consec_nights}} ({{guest_consec_nights}}) consecutive nights or more than {{guest_monthly_nights}} ({{guest_monthly_nights}}) nights in any thirty (30) day period without the prior written consent of the Landlord. Unauthorized occupants shall constitute a material breach of this Agreement." },
          { id: "use-prohibited", editable: false, text: "The Tenant shall not operate any business, conduct illegal activities, or use the Premises for any purpose other than residential use." },
          { id: "use-assignment", editable: false, text: "The Tenant shall not assign this lease or sublet the Premises or any portion thereof without the prior written consent of the Landlord." },
        ],
      },
      {
        id: "parking",
        title: "9. Parking",
        clauses: [
          { id: "parking-spot", editable: true, text: "One (1) driveway parking spot is included with this tenancy. The Tenant shall park only in the designated area and shall not block the driveway or other vehicles." },
          { id: "parking-rules", editable: false, text: "No vehicle repairs, maintenance involving fluids, or storage of inoperable vehicles shall be permitted on the property. The Tenant's vehicle must be properly insured and registered at all times." },
        ],
      },
      {
        id: "cameras",
        title: "10. Security Cameras",
        clauses: [
          { id: "cameras-exterior", editable: true, text: "The Landlord maintains exterior security cameras covering the periphery of the property, including the driveway and common outdoor areas. These cameras are for the security and protection of all occupants and the property. The cameras record video only (no audio) and are motion-triggered. Footage is retained for a maximum of thirty (30) days and is accessible only to the Landlord." },
          { id: "cameras-doorbell", editable: true, text: "Doorbell Camera: A doorbell camera is installed at the side entrance of the suite. The camera captures motion-triggered video at the suite entrance only. Any audio capture is incidental to the motion-triggered recording and is limited to the immediate entrance area. The Tenant may: (a) request access to the doorbell camera feed by written request to the Landlord; or (b) request that the Landlord remove the doorbell camera by written request. If the Tenant requests removal, the Landlord shall remove the camera within a reasonable time, and the Landlord shall bear no responsibility for any security incidents at the suite entrance thereafter." },
          { id: "cameras-consent", editable: false, text: "The Tenant acknowledges and consents to the presence of the exterior security cameras and the doorbell camera. No cameras record any interior areas of the Premises." },
        ],
      },
      {
        id: "security",
        title: "11. Tenant Security Responsibility",
        clauses: [
          { id: "security-locks", editable: false, text: "The Tenant is solely responsible for locking and securing all doors and windows of the Premises at all times. The Tenant is also responsible for securing their personal belongings, including any vehicle parked on the driveway." },
          { id: "security-liability", editable: false, text: "The Landlord shall not be liable for any theft, break-in, vandalism, or damage to the Tenant's personal property or vehicle, regardless of whether the security cameras were operational at the time of the incident." },
        ],
      },
      {
        id: "garbage",
        title: "12. Garbage and Waste Disposal",
        clauses: [
          { id: "garbage-bins", editable: true, text: "The Tenant has been provided with dedicated bins for garbage (black), recycling (blue), and compost (green), separate from the main dwelling." },
          { id: "garbage-rules", editable: false, text: "The Tenant is solely responsible for placing the bins at the curb on the scheduled collection day and retrieving them promptly. Failure to manage waste properly, including contamination of recycling or compost, shall be a breach of this Agreement. Any fines levied by the City of Calgary for improper waste disposal shall be the Tenant's responsibility." },
        ],
      },
      {
        id: "pets",
        title: "13. No Pets",
        clauses: [
          { id: "pets-prohibition", editable: false, text: "No pets of any kind are permitted on the Premises or anywhere on the property, including but not limited to dogs, cats, birds, fish, reptiles, rodents, or insects. This prohibition includes temporary or visiting pets." },
          { id: "pets-breach", editable: false, text: "A breach of this clause shall entitle the Landlord to recover the reasonable costs of professional cleaning and deodorizing, and may constitute grounds for a 14-day notice to terminate the tenancy under the RTA." },
        ],
      },
      {
        id: "smoking",
        title: "14. No Smoking",
        clauses: [
          { id: "smoking-prohibition", editable: false, text: "Smoking of any kind is strictly prohibited anywhere on the entire property, including inside the Premises, the backyard, driveway, and all common areas. This includes cigarettes, cigars, pipes, e-cigarettes, vaporizers, cannabis, hookah, and any other smoking device." },
          { id: "smoking-breach", editable: false, text: "A breach of this clause shall entitle the Landlord to recover the reasonable costs of professional cleaning and deodorizing, and may constitute grounds for a 14-day notice to terminate the tenancy under the RTA." },
        ],
      },
      {
        id: "laundry",
        title: "15. Laundry",
        clauses: [
          { id: "laundry-access", editable: true, text: "In-suite laundry facilities (washer and dryer) are available within the Premises. The Tenant shall use the laundry equipment with reasonable care and report any malfunction promptly." },
          { id: "laundry-care", editable: false, text: "The Tenant shall not overload the machines. Damage caused by misuse or negligence shall be the Tenant's responsibility. The Landlord shall be responsible for repairs due to normal wear and tear." },
        ],
      },
      {
        id: "keys",
        title: "16. Keys and Locks",
        clauses: [
          { id: "keys-provided", editable: true, text: "The Landlord shall provide _______ set(s) of keys to the Tenant at move-in. The number and type of keys shall be recorded in the move-in inspection report." },
          { id: "keys-locks", editable: false, text: "The Tenant shall not change, alter, or add any lock to the Premises without the prior written consent of the Landlord. If the Landlord consents to a lock change, the Tenant shall provide the Landlord with a copy of the new key within twenty-four (24) hours." },
          { id: "keys-lost", editable: false, text: "Lost keys shall be replaced at the Tenant's expense. All keys must be returned to the Landlord at the end of the tenancy." },
        ],
      },
      {
        id: "maintenance",
        title: "17. Maintenance and Repairs",
        clauses: [
          { id: "maintenance-tenant", editable: false, text: "The Tenant shall keep the Premises clean, sanitary, and in good repair. The Tenant shall promptly notify the Landlord in writing of any maintenance issues or defects." },
          { id: "maintenance-tenant-damage", editable: false, text: "The Tenant shall be responsible for the cost of any repairs necessitated by the Tenant's negligence, misuse, or willful act, including but not limited to: plumbing blockages caused by improper use; damage to walls, floors, or fixtures; broken windows or locks; and damage to appliances or furnishings." },
          { id: "maintenance-entry", editable: false, text: "Landlord Entry: The Landlord or Landlord's agent may enter the Premises for inspection, maintenance, or emergency purposes in accordance with the RTA. Written notice of at least twenty-four (24) hours shall be provided, stating the date, time, and reason for entry, except in cases of emergency." },
        ],
      },
      {
        id: "insurance",
        title: "18. Tenant's Insurance",
        clauses: [
          { id: "insurance-advised", editable: false, text: "The Tenant is strongly advised to obtain tenant's (renter's) insurance for personal belongings and liability. The Landlord's insurance does not cover the Tenant's personal property or liability." },
          { id: "insurance-liability", editable: false, text: "The Landlord shall not be liable for any loss or damage to the Tenant's personal property, including but not limited to loss from fire, flood, theft, or plumbing failure, except to the extent caused by the Landlord's negligence or willful act." },
        ],
      },
      {
        id: "alterations",
        title: "19. Alterations",
        clauses: [
          { id: "alterations-prohibition", editable: false, text: "The Tenant shall not make any alterations, additions, or improvements to the Premises without the prior written consent of the Landlord. This includes but is not limited to: painting, wallpapering, installing shelving, drilling holes, changing locks, or modifying any fixture." },
          { id: "alterations-restoration", editable: false, text: "Any unauthorized alterations shall be restored at the Tenant's expense, or the cost of restoration shall be deducted from the security deposit in accordance with the RTA." },
        ],
      },
      {
        id: "noise",
        title: "20. Noise and Conduct",
        clauses: [
          { id: "noise-conduct", editable: true, text: "The Tenant shall not cause or permit any noise or conduct that disturbs the reasonable enjoyment of the main dwelling occupants, neighbours, or any other person. Quiet hours are from 10:00 PM to 8:00 AM daily." },
          { id: "noise-breach", editable: false, text: "Repeated noise complaints may constitute grounds for termination of the tenancy under the RTA." },
        ],
      },
      {
        id: "early-termination",
        title: "21. Early Termination",
        clauses: [
          { id: "early-termination-liability", editable: false, text: "If the Tenant vacates before the end of the Term without lawful entitlement or mutual written agreement, the Tenant remains responsible for rent and other lawful charges until the earlier of:\n\n(a) the end of the Term; or\n(b) the date a suitable replacement tenant, approved by the Landlord acting reasonably, begins paying rent." },
          { id: "early-termination-mitigation", editable: false, text: "The Landlord shall make reasonable efforts to mitigate losses by re-renting the Premises. The Tenant shall also reimburse the Landlord for reasonable, documented costs incurred in re-renting the Premises, including advertising costs." },
          { id: "early-termination-notice", editable: true, text: "The Tenant shall provide a minimum of {{early_term_notice_days}} ({{early_term_notice_days}}) days' written notice of intent to vacate early." },
        ],
      },
      {
        id: "occupant-obligations",
        title: "22. Permitted Occupant Obligations",
        clauses: [
          { id: "occupant-liability", editable: true, text: "The Permitted Occupant, {{permitted_occupant}}, is not a signatory to this lease and has no independent financial obligations hereunder. The Tenant assumes full and complete liability for the Permitted Occupant's actions, omissions, negligence, and any damages caused by the Permitted Occupant, as if such actions were the Tenant's own. (Delete this section if no permitted occupant.)" },
          { id: "occupant-breach", editable: false, text: "Any breach of this Agreement by the Permitted Occupant shall be deemed a breach by the Tenant. Without limiting the foregoing, the Tenant shall be liable for: (a) any damage to the Premises or furnished items caused by the Permitted Occupant; (b) any costs arising from the Permitted Occupant's violation of the no-pets, no-smoking, noise, or conduct provisions; (c) any fines, penalties, or claims arising from the Permitted Occupant's actions on the property; and (d) any costs of remediation, repair, or professional cleaning attributable to the Permitted Occupant." },
          { id: "occupant-revocation", editable: true, text: "The Landlord reserves the right to revoke the Permitted Occupant's status, subject to any applicable requirements of the RTA, by providing fourteen (14) days' written notice if the Permitted Occupant's conduct constitutes a breach of this Agreement. Upon revocation, the Permitted Occupant must vacate the Premises within the notice period." },
        ],
      },
      {
        id: "default",
        title: "23. Default and Remedies",
        clauses: [
          { id: "default-list", editable: false, text: "The following shall constitute a material breach of this Agreement, entitling the Landlord to pursue all remedies available under the RTA:\n\n(a) Non-payment of rent or utilities; (b) Unauthorized occupants or guests exceeding the permitted limits; (c) Breach of the no-pets or no-smoking clauses; (d) Damage to the Premises beyond normal wear and tear; (e) Illegal activity on the Premises; (f) Failure to maintain the Premises in a clean and sanitary condition; (g) Subletting or assignment without consent." },
          { id: "default-remedies", editable: false, text: "The Landlord may serve a 14-day notice for substantial breach. If the breach is not remedied, the Landlord may apply to the RTDRS or the Court of King's Bench of Alberta for an order of possession and damages." },
        ],
      },
      {
        id: "inspections",
        title: "24. Inspections",
        clauses: [
          { id: "inspections-schedule", editable: false, text: "A move-in inspection shall be conducted jointly by the Landlord and Tenant within one (1) week before or after the commencement of the tenancy. A move-out inspection shall be conducted jointly within one (1) week before or after the end of the tenancy." },
          { id: "inspections-documentation", editable: false, text: "Both inspections shall be documented using the attached Inspection Report forms and shall comply with the requirements of the RTA and applicable regulations. Both parties shall sign the inspection reports." },
          { id: "inspections-failure", editable: false, text: "If the Tenant fails to attend a scheduled inspection after receiving reasonable written notice, the Landlord may conduct the inspection and provide the Tenant with a copy of the report. Deductions from the security deposit for damages shall be made only where supported by compliant inspection reports as required by the RTA." },
        ],
      },
      {
        id: "moveout",
        title: "25. Move-Out Condition",
        clauses: [
          { id: "moveout-condition", editable: false, text: "Upon vacating, the Tenant shall return the Premises in a reasonably clean condition and substantially in the same condition as at the commencement of the tenancy, subject to normal wear and tear. All personal belongings must be removed, all keys returned, and all garbage disposed of." },
        ],
      },
      {
        id: "notices",
        title: "26. Notices",
        clauses: [
          { id: "notices-methods", editable: false, text: "Any notice required or permitted under this Agreement shall be in writing and may be delivered as set out below, subject always to any mandatory method of service required by the RTA for a particular notice:\n\n(a) personal delivery to the party or to the Premises;\n(b) email to the addresses listed in Section 1 (deemed received on the date sent if sent before 5:00 PM, otherwise the next business day);\n(c) regular mail to the addresses listed in Section 1 (deemed received three (3) business days after mailing)." },
          { id: "notices-change", editable: false, text: "Either party may change their notice address by providing written notice to the other party." },
        ],
      },
      {
        id: "governing-law",
        title: "27. Governing Law",
        clauses: [
          { id: "governing-law-clause", editable: false, text: "This Agreement is governed by and construed in accordance with the laws of the Province of Alberta, including the RTA and any amendments thereto. Any disputes shall be resolved through the RTDRS or the Court of King's Bench of Alberta." },
        ],
      },
      {
        id: "entire-agreement",
        title: "28. Entire Agreement",
        clauses: [
          { id: "entire-agreement-clause", editable: false, text: "This Agreement, including Schedule A (Furnished Inventory), Schedule B (Tenant Identification), and the inspection reports attached hereto, constitutes the entire agreement between the Landlord and Tenant. No oral agreements, representations, or warranties have been made. Any amendments must be in writing and signed by all parties." },
        ],
      },
      {
        id: "severability",
        title: "29. Severability",
        clauses: [
          { id: "severability-clause", editable: false, text: "If any provision of this Agreement is found to be invalid or unenforceable by a court or tribunal of competent jurisdiction, the remaining provisions shall continue in full force and effect." },
        ],
      },
      {
        id: "acknowledgement",
        title: "30. Acknowledgement",
        clauses: [
          { id: "acknowledgement-clause", editable: false, text: "The Tenant acknowledges that they have read this Agreement in its entirety, understand its terms and conditions, have had the opportunity to seek independent legal advice, and agree to be bound by all provisions herein. The Tenant acknowledges receiving a copy of this signed Agreement." },
          { id: "acknowledgement-electronic", editable: false, text: "Electronic Execution: This Agreement may be executed and delivered electronically, and electronic signatures shall be deemed original signatures for all purposes, pursuant to the Electronic Transactions Act, SA 2001, c. E-5.5. Each party signing electronically consents to the use of electronic records and signatures and acknowledges that an electronic signature has the same legal effect as a handwritten signature. A signed electronic copy of this Agreement delivered by email or through the TenantPorch portal shall constitute an original for all purposes." },
        ],
      },
    ],
  };
}

function scheduleAContent(): LeaseDocumentContent {
  return {
    templateVersion: TEMPLATE_VERSION,
    province: "AB",
    additionalTerms: [],
    generatedAt: new Date().toISOString(),
    sections: [
      {
        id: "schedule-a-header",
        title: "Schedule A — Furnished Inventory",
        clauses: [
          { id: "schedule-a-intro", editable: false, text: "This Schedule A forms part of the Residential Tenancy Agreement dated {{agreement_date_long}} between the Landlord ({{landlord_block_names}}) and the Tenant ({{tenant_names}}) for the Premises located at {{property_full_address}}.\n\nThe Premises are rented as a fully furnished unit. The following items are provided by the Landlord and shall be returned at the end of the Term in the same condition, ordinary wear and tear excepted." },
        ],
      },
      {
        id: "schedule-a-living",
        title: "Living Room",
        clauses: [
          { id: "schedule-a-living-items", editable: true, text: "• Sofa (3-seater)\n• Coffee table\n• TV stand / media console\n• Floor lamp\n• Area rug\n• Window curtains and rods" },
        ],
      },
      {
        id: "schedule-a-bedrooms",
        title: "Bedrooms",
        clauses: [
          { id: "schedule-a-bedrooms-items", editable: true, text: "Primary Bedroom:\n• Queen bed frame and mattress\n• Nightstand (×2)\n• Dresser\n• Bedside lamp (×2)\n• Closet shelving\n• Window blinds and curtains\n\nSecond Bedroom:\n• Queen bed frame and mattress\n• Nightstand\n• Dresser\n• Bedside lamp\n• Closet shelving\n• Window blinds and curtains" },
        ],
      },
      {
        id: "schedule-a-kitchen",
        title: "Kitchen",
        clauses: [
          { id: "schedule-a-kitchen-items", editable: true, text: "Appliances (Landlord-provided):\n• Refrigerator with freezer\n• Electric stove with oven\n• Range hood / over-the-range microwave\n• Dishwasher\n\nCookware and dinnerware:\n• Pot and pan set\n• Dinnerware set for 4 (plates, bowls, mugs)\n• Cutlery set for 4\n• Drinking glasses (×6)\n• Cooking utensils (spatula, ladle, tongs)\n• Kettle\n• Toaster" },
        ],
      },
      {
        id: "schedule-a-dining",
        title: "Dining Area",
        clauses: [
          { id: "schedule-a-dining-items", editable: true, text: "• Dining table\n• Dining chairs (×4)" },
        ],
      },
      {
        id: "schedule-a-bathroom",
        title: "Bathroom",
        clauses: [
          { id: "schedule-a-bathroom-items", editable: true, text: "• Shower curtain and rod\n• Bathroom vanity with mirror\n• Toilet paper holder\n• Towel rack" },
        ],
      },
      {
        id: "schedule-a-laundry",
        title: "Laundry / Utility",
        clauses: [
          { id: "schedule-a-laundry-items", editable: true, text: "• In-suite washing machine\n• In-suite dryer\n• Iron and ironing board" },
        ],
      },
      {
        id: "schedule-a-other",
        title: "Other / Property",
        clauses: [
          { id: "schedule-a-other-items", editable: true, text: "• Smoke detectors (×2)\n• Carbon monoxide detector\n• Garbage bin (black) — City of Calgary issued\n• Recycling bin (blue) — City of Calgary issued\n• Compost bin (green) — City of Calgary issued\n• Internet router (modem provided by Landlord)" },
        ],
      },
      {
        id: "schedule-a-acknowledgement",
        title: "Acknowledgement",
        clauses: [
          { id: "schedule-a-acknowledgement-clause", editable: false, text: "The Tenant acknowledges that the items listed in this Schedule A were present and in working condition at the commencement of the Term, except as documented in the move-in inspection report. The Tenant agrees to be responsible for the cost of repair or replacement of any of the above items that are damaged, destroyed, or missing at the end of the Term, beyond ordinary wear and tear, as documented by the inspection reports." },
        ],
      },
    ],
  };
}

function scheduleBContent(): LeaseDocumentContent {
  return {
    templateVersion: TEMPLATE_VERSION,
    province: "AB",
    additionalTerms: [],
    generatedAt: new Date().toISOString(),
    sections: [
      {
        id: "schedule-b-header",
        title: "Schedule B — Tenant Identification",
        clauses: [
          { id: "schedule-b-intro", editable: false, text: "This Schedule B forms part of the Residential Tenancy Agreement dated {{agreement_date_long}} between the Landlord ({{landlord_block_names}}) and the Tenant ({{tenant_names}}) for the Premises located at {{property_full_address}}.\n\nThe parties identified in this Schedule B confirm the accuracy of the information set out below as of the date of execution." },
        ],
      },
      {
        id: "schedule-b-tenants",
        title: "Tenants",
        clauses: [
          { id: "schedule-b-tenants-info", editable: true, text: "{{tenant_block}}\n\nFor each Tenant, complete:\n• Full Legal Name\n• Email\n• Phone\n• ID Type\n• ID Number\n• Name on Document\n• Place of Issue\n• Expiry Date" },
        ],
      },
      {
        id: "schedule-b-occupant",
        title: "Permitted Occupant",
        clauses: [
          { id: "schedule-b-occupant-info", editable: true, text: "The following individual is identified as a Permitted Occupant pursuant to Section 1 (Definitions) and Section 22 (Permitted Occupant Obligations) of the Agreement. The Permitted Occupant is not a signatory and is not required to sign this Schedule B.\n\n• Full Legal Name:    {{permitted_occupant}}\n• ID Type:            ________________\n• ID Number:          ________________\n• Name on Document:   ________________\n• Place of Issue:     ________________\n• Expiry Date:        ________________\n\n(Delete this section if no permitted occupant.)" },
        ],
      },
      {
        id: "schedule-b-acknowledgement",
        title: "Acknowledgement",
        clauses: [
          { id: "schedule-b-acknowledgement-clause", editable: false, text: "Each Tenant confirms that the identification information set out above is true and accurate, and consents to the Landlord retaining this information for the purposes of the tenancy in accordance with applicable privacy laws (PIPA Alberta)." },
        ],
      },
    ],
  };
}

export function buildRaminderTemplateDocuments(): LandlordTemplateDocument[] {
  return [
    {
      document_type: "lease_agreement",
      title: "Lease Agreement",
      sort_order: 0,
      document_content: leaseAgreementContent(),
    },
    {
      document_type: "schedule_a",
      title: "Schedule A — Furnished Inventory",
      sort_order: 1,
      document_content: scheduleAContent(),
    },
    {
      document_type: "schedule_b",
      title: "Schedule B — Tenant Identification",
      sort_order: 2,
      document_content: scheduleBContent(),
    },
  ];
}

export const RAMINDER_TEMPLATE_NAME =
  "Alberta Furnished Suite (Standard)";
export const RAMINDER_TEMPLATE_DESCRIPTION =
  "Raminder Shah's standard Alberta residential tenancy agreement for furnished suites. Based on the 220B Red Sky Terrace template — joint and several tenants, fixed term, 4% card surcharge, 40% utility split, no pets, no smoking, security cameras, $50 late fee + NSF.";
