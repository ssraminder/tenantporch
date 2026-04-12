import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { formatCurrency } from "@/lib/currency";
import {
  ApplicationActions,
  LandlordNotes,
  RequestReferenceButton,
} from "./client-components";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <NotFound />;

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!rpUser) return <NotFound />;

  // Fetch application with property info
  const { data: application } = await supabase
    .from("rp_tenant_applications")
    .select(
      "*, rp_properties(address_line1, city, province_state, monthly_rent)"
    )
    .eq("id", id)
    .single();

  if (!application) return <NotFound />;

  // Authorization: verify landlord owns this application
  if (application.landlord_id !== rpUser.id) return <NotFound />;

  // Fetch reference checks for this application
  const { data: referenceChecks } = await supabase
    .from("rp_reference_checks")
    .select("*")
    .eq("application_id", id)
    .order("created_at", { ascending: true });

  const refs = referenceChecks ?? [];
  const property = application.rp_properties as any;
  const status = application.status ?? "submitted";
  const applicantName = application.first_name
    ? `${application.first_name} ${application.last_name}`
    : "Pending Applicant";

  const canAct = status === "submitted" || status === "reviewing";

  return (
    <section className="space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
          {
            label: "Applications",
            href: "/admin/applications",
            icon: "assignment",
          },
          { label: applicantName },
        ]}
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient-sm">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-primary-fixed/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-3xl text-on-primary-fixed-variant">
                  person
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
                    {applicantName}
                  </h1>
                  <StatusBadge status={status} />
                </div>
                <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">
                    calendar_month
                  </span>
                  Submitted{" "}
                  <DateDisplay date={application.created_at} format="long" />
                </div>
              </div>
            </div>
          </div>

          {/* Summary card */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">
                summarize
              </span>
              <h2 className="font-headline font-bold text-xl">
                Quick Summary
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5">
              <SummaryItem
                label="Email"
                value={application.email ?? "\u2014"}
                icon="mail"
              />
              <SummaryItem
                label="Phone"
                value={application.phone ?? "\u2014"}
                icon="phone"
              />
              <SummaryItem
                label="Date of Birth"
                value={
                  application.date_of_birth ? (
                    <DateDisplay
                      date={application.date_of_birth}
                      format="medium"
                    />
                  ) : (
                    "\u2014"
                  )
                }
                icon="cake"
              />
              <SummaryItem
                label="Monthly Income"
                value={
                  application.monthly_income
                    ? formatCurrency(Number(application.monthly_income))
                    : "\u2014"
                }
                icon="attach_money"
              />
              <SummaryItem
                label="Occupants"
                value={String(application.number_of_occupants ?? 1)}
                icon="group"
              />
              <SummaryItem
                label="Move-in Date"
                value={
                  application.move_in_date ? (
                    <DateDisplay
                      date={application.move_in_date}
                      format="medium"
                    />
                  ) : (
                    "\u2014"
                  )
                }
                icon="event"
              />
            </div>
          </div>

          {/* Personal Information */}
          <SectionCard title="Personal Information" icon="person">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <FieldDisplay
                label="First Name"
                value={application.first_name}
              />
              <FieldDisplay label="Last Name" value={application.last_name} />
              <FieldDisplay label="Email" value={application.email} />
              <FieldDisplay label="Phone" value={application.phone} />
              <FieldDisplay
                label="Date of Birth"
                value={
                  application.date_of_birth ? (
                    <DateDisplay
                      date={application.date_of_birth}
                      format="medium"
                    />
                  ) : null
                }
              />
              <FieldDisplay
                label="Current Address"
                value={application.current_address}
              />
            </div>
          </SectionCard>

          {/* Rental History */}
          <SectionCard title="Rental History" icon="history">
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
                  Current Landlord
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <FieldDisplay
                    label="Landlord Name"
                    value={application.current_landlord_name}
                  />
                  <FieldDisplay
                    label="Landlord Phone"
                    value={application.current_landlord_phone}
                  />
                  <FieldDisplay
                    label="Landlord Email"
                    value={application.current_landlord_email}
                  />
                  <FieldDisplay
                    label="Current Rent"
                    value={
                      application.current_rent
                        ? formatCurrency(Number(application.current_rent))
                        : null
                    }
                  />
                  <FieldDisplay
                    label="Lease End Date"
                    value={
                      application.current_lease_end ? (
                        <DateDisplay
                          date={application.current_lease_end}
                          format="medium"
                        />
                      ) : null
                    }
                  />
                  <FieldDisplay
                    label="Reason for Leaving"
                    value={application.reason_for_leaving}
                  />
                </div>
              </div>

              <div className="border-t border-outline-variant/10 pt-6">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
                  Previous Landlord
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <FieldDisplay
                    label="Previous Address"
                    value={application.previous_address}
                  />
                  <FieldDisplay
                    label="Landlord Name"
                    value={application.previous_landlord_name}
                  />
                  <FieldDisplay
                    label="Landlord Phone"
                    value={application.previous_landlord_phone}
                  />
                  <FieldDisplay
                    label="Landlord Email"
                    value={application.previous_landlord_email}
                  />
                </div>
              </div>

              <div className="border-t border-outline-variant/10 pt-6">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
                  Background
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                      Eviction History
                    </p>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-on-surface">
                      <span className="material-symbols-outlined text-sm">
                        {application.has_been_evicted
                          ? "warning"
                          : "check_circle"}
                      </span>
                      {application.has_been_evicted
                        ? "Has been evicted"
                        : "No evictions"}
                    </div>
                    {application.has_been_evicted &&
                      application.eviction_details && (
                        <p className="text-xs text-on-surface-variant mt-1">
                          {application.eviction_details}
                        </p>
                      )}
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                      Bankruptcy History
                    </p>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-on-surface">
                      <span className="material-symbols-outlined text-sm">
                        {application.has_filed_bankruptcy
                          ? "warning"
                          : "check_circle"}
                      </span>
                      {application.has_filed_bankruptcy
                        ? "Has filed bankruptcy"
                        : "No bankruptcies"}
                    </div>
                    {application.has_filed_bankruptcy &&
                      application.bankruptcy_details && (
                        <p className="text-xs text-on-surface-variant mt-1">
                          {application.bankruptcy_details}
                        </p>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Employment & Income */}
          <SectionCard title="Employment & Income" icon="work">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <FieldDisplay
                label="Employer Name"
                value={application.employer_name}
              />
              <FieldDisplay label="Job Title" value={application.job_title} />
              <FieldDisplay
                label="Employer Address"
                value={application.employer_address}
              />
              <FieldDisplay
                label="Employer Phone"
                value={application.employer_phone}
              />
              <FieldDisplay
                label="Employment Duration"
                value={application.employment_duration}
              />
              <FieldDisplay
                label="Monthly Income"
                value={
                  application.monthly_income
                    ? formatCurrency(Number(application.monthly_income))
                    : null
                }
              />
              <FieldDisplay
                label="Additional Income"
                value={
                  application.additional_income
                    ? formatCurrency(Number(application.additional_income))
                    : null
                }
              />
              {application.additional_income_description && (
                <FieldDisplay
                  label="Additional Income Source"
                  value={application.additional_income_description}
                />
              )}
            </div>
          </SectionCard>

          {/* Occupancy Details */}
          <SectionCard title="Occupancy Details" icon="house">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <FieldDisplay
                label="Number of Occupants"
                value={String(application.number_of_occupants ?? 1)}
              />
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                  Occupant Names
                </p>
                {application.occupant_names &&
                (application.occupant_names as string[]).length > 0 ? (
                  <ul className="text-sm text-on-surface space-y-0.5">
                    {(application.occupant_names as string[]).map(
                      (name: string, i: number) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-xs text-on-surface-variant">
                            person
                          </span>
                          {name}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-on-surface-variant">{"\u2014"}</p>
                )}
              </div>

              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                  Pets
                </p>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-sm">
                    {application.has_pets ? "pets" : "block"}
                  </span>
                  {application.has_pets ? "Yes" : "No pets"}
                </div>
                {application.has_pets && application.pet_details && (
                  <p className="text-xs text-on-surface-variant mt-1">
                    {application.pet_details}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                  Smoker
                </p>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-sm">
                    {application.is_smoker
                      ? "smoking_rooms"
                      : "smoke_free"}
                  </span>
                  {application.is_smoker ? "Yes" : "Non-smoker"}
                </div>
              </div>

              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                  Vehicle
                </p>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-sm">
                    {application.has_vehicle
                      ? "directions_car"
                      : "no_transfer"}
                  </span>
                  {application.has_vehicle ? "Yes" : "No vehicle"}
                </div>
                {application.has_vehicle && application.vehicle_details && (
                  <p className="text-xs text-on-surface-variant mt-1">
                    {application.vehicle_details}
                  </p>
                )}
              </div>

              <FieldDisplay
                label="Desired Move-in Date"
                value={
                  application.move_in_date ? (
                    <DateDisplay
                      date={application.move_in_date}
                      format="medium"
                    />
                  ) : null
                }
              />
              <FieldDisplay
                label="Desired Lease Term"
                value={application.desired_lease_term}
              />
            </div>
          </SectionCard>

          {/* References */}
          <SectionCard title="References" icon="contact_phone">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <FieldDisplay
                label="Reference Name"
                value={application.personal_reference_name}
              />
              <FieldDisplay
                label="Reference Phone"
                value={application.personal_reference_phone}
              />
              <FieldDisplay
                label="Relationship"
                value={application.personal_reference_relationship}
              />
            </div>
          </SectionCard>

          {/* Consent & Signature */}
          <SectionCard title="Consent & Signature" icon="verified_user">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ConsentItem
                  label="Credit Check"
                  consented={application.consent_credit_check}
                />
                <ConsentItem
                  label="Reference Check"
                  consented={application.consent_reference_check}
                />
                <ConsentItem
                  label="Background Check"
                  consented={application.consent_background_check}
                />
                <ConsentItem
                  label="PIPA Consent"
                  consented={application.consent_pipa}
                />
              </div>

              <div className="border-t border-outline-variant/10 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                      Signature
                    </p>
                    {application.applicant_signature ? (
                      <p className="text-sm font-semibold text-on-surface italic">
                        &ldquo;{application.applicant_signature}&rdquo;
                      </p>
                    ) : (
                      <p className="text-sm text-on-surface-variant">
                        {"\u2014"}
                      </p>
                    )}
                  </div>
                  <FieldDisplay
                    label="Signature Date"
                    value={
                      application.signature_date ? (
                        <DateDisplay
                          date={application.signature_date}
                          format="medium"
                        />
                      ) : null
                    }
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Reference Checks Section */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">
                fact_check
              </span>
              <h2 className="font-headline font-bold text-xl">
                Reference Checks
              </h2>
              {refs.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-primary-fixed/30 text-on-primary-fixed-variant text-xs font-bold">
                  {refs.length}
                </span>
              )}
            </div>

            {refs.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-outline-variant mb-3 block">
                  mail
                </span>
                <p className="text-sm text-on-surface-variant">
                  No reference checks requested yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {refs.map((ref: any) => (
                  <div
                    key={ref.id}
                    className="rounded-2xl border border-outline-variant/15 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div>
                        <p className="text-sm font-bold text-on-surface">
                          {ref.referee_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant mt-1">
                          {ref.referee_email && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">
                                mail
                              </span>
                              {ref.referee_email}
                            </span>
                          )}
                          {ref.referee_phone && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">
                                phone
                              </span>
                              {ref.referee_phone}
                            </span>
                          )}
                          {ref.relationship && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">
                                group
                              </span>
                              {ref.relationship}
                            </span>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={ref.status} />
                    </div>

                    {ref.status === "completed" && ref.response ? (
                      <div className="bg-surface-container-low rounded-xl p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                          <RefResponseItem
                            label="Tenancy Duration"
                            value={ref.response.tenancy_duration}
                          />
                          <RefResponseItem
                            label="Rent on Time"
                            value={ref.response.rent_on_time}
                          />
                          <RefResponseItem
                            label="Lease Violations"
                            value={
                              ref.response.lease_violations ? "Yes" : "No"
                            }
                            warn={ref.response.lease_violations}
                          />
                          {ref.response.violation_details && (
                            <RefResponseItem
                              label="Violation Details"
                              value={ref.response.violation_details}
                            />
                          )}
                          <RefResponseItem
                            label="Property Maintained Well"
                            value={
                              ref.response.maintained_well ? "Yes" : "No"
                            }
                            warn={!ref.response.maintained_well}
                          />
                          <RefResponseItem
                            label="Noise Complaints"
                            value={
                              ref.response.noise_complaints ? "Yes" : "No"
                            }
                            warn={ref.response.noise_complaints}
                          />
                          <RefResponseItem
                            label="Would Rent Again"
                            value={
                              ref.response.would_rent_again ? "Yes" : "No"
                            }
                            warn={!ref.response.would_rent_again}
                          />
                          {ref.response.additional_comments && (
                            <div className="sm:col-span-2">
                              <RefResponseItem
                                label="Additional Comments"
                                value={ref.response.additional_comments}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : ref.status === "sent" ? (
                      <div className="bg-secondary-fixed/10 rounded-xl p-4 flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary text-lg">
                          hourglass_top
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">
                            Waiting for response
                          </p>
                          {ref.created_at && (
                            <p className="text-xs text-on-surface-variant">
                              Sent{" "}
                              <DateDisplay
                                date={ref.created_at}
                                format="relative"
                              />
                            </p>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column (sidebar) */}
        <div className="space-y-6">
          {/* Property card */}
          {property && (
            <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-ambient-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary">
                  apartment
                </span>
                <h3 className="font-headline font-bold text-lg">Property</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-on-surface">
                    {property.address_line1}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {property.city}
                    {property.province_state
                      ? `, ${property.province_state}`
                      : ""}
                  </p>
                </div>
                {property.monthly_rent && (
                  <div>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-0.5">
                      Monthly Rent
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(Number(property.monthly_rent))}
                    </p>
                  </div>
                )}
              </div>
              <Link
                href={`/admin/properties/${application.property_id}`}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-sm">
                  open_in_new
                </span>
                View Property
              </Link>
            </div>
          )}

          {/* Actions card */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-ambient-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-primary">
                gavel
              </span>
              <h3 className="font-headline font-bold text-lg">Actions</h3>
            </div>
            <ApplicationActions
              applicationId={id}
              status={status}
              propertyId={application.property_id}
              applicantName={applicantName}
              applicantEmail={application.email ?? ""}
              moveInDate={application.move_in_date ?? null}
            />
          </div>

          {/* Landlord Notes card */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-ambient-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-primary">
                sticky_note_2
              </span>
              <h3 className="font-headline font-bold text-lg">
                Private Notes
              </h3>
            </div>
            <LandlordNotes
              applicationId={id}
              initialNotes={application.landlord_notes ?? ""}
            />
          </div>

          {/* Request Reference buttons */}
          {canAct && (
            <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-ambient-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary">
                  contact_mail
                </span>
                <h3 className="font-headline font-bold text-lg">
                  Request References
                </h3>
              </div>
              <div className="space-y-3">
                {application.current_landlord_email && (
                  <RequestReferenceButton
                    applicationId={id}
                    refereeName={application.current_landlord_name ?? "Current Landlord"}
                    refereeEmail={application.current_landlord_email}
                    refereePhone={application.current_landlord_phone ?? ""}
                    relationship="Current Landlord"
                    existingRefs={refs}
                  />
                )}
                {application.previous_landlord_email && (
                  <RequestReferenceButton
                    applicationId={id}
                    refereeName={application.previous_landlord_name ?? "Previous Landlord"}
                    refereeEmail={application.previous_landlord_email}
                    refereePhone={application.previous_landlord_phone ?? ""}
                    relationship="Previous Landlord"
                    existingRefs={refs}
                  />
                )}
                {!application.current_landlord_email &&
                  !application.previous_landlord_email && (
                    <p className="text-sm text-on-surface-variant text-center py-2">
                      No landlord emails provided by applicant.
                    </p>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper sub-components                                             */
/* ------------------------------------------------------------------ */

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient-sm">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        <h2 className="font-headline font-bold text-xl">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SummaryItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="material-symbols-outlined text-on-surface-variant text-lg mt-0.5">
        {icon}
      </span>
      <div>
        <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-0.5">
          {label}
        </p>
        <p className="text-sm font-semibold text-on-surface">{value}</p>
      </div>
    </div>
  );
}

function FieldDisplay({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
        {label}
      </p>
      {typeof value === "string" || typeof value === "number" ? (
        <p className="text-sm font-semibold text-on-surface">
          {value || "\u2014"}
        </p>
      ) : value ? (
        <div className="text-sm font-semibold text-on-surface">{value}</div>
      ) : (
        <p className="text-sm text-on-surface-variant">{"\u2014"}</p>
      )}
    </div>
  );
}

function ConsentItem({
  label,
  consented,
}: {
  label: string;
  consented: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-surface-container-low">
      <span
        className={`material-symbols-outlined text-lg ${
          consented
            ? "text-tertiary-fixed-dim"
            : "text-error"
        }`}
      >
        {consented ? "check_circle" : "cancel"}
      </span>
      <span className="text-sm font-semibold text-on-surface">{label}</span>
    </div>
  );
}

function RefResponseItem({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-on-surface-variant font-semibold mb-0.5">
        {label}
      </p>
      <p
        className={`text-sm font-semibold ${
          warn ? "text-error" : "text-on-surface"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function NotFound() {
  return (
    <section className="space-y-8">
      <Link
        href="/admin/applications"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Applications
      </Link>
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">
          search_off
        </span>
        <h2 className="font-headline text-xl font-bold text-primary mb-2">
          Application Not Found
        </h2>
        <p className="text-on-surface-variant">
          This application doesn&apos;t exist or you don&apos;t have permission
          to view it.
        </p>
      </div>
    </section>
  );
}
