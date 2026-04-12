"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Logo } from "@/components/shared/logo";
import { formatCurrency } from "@/lib/currency";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ApplicationFormProps {
  token: string;
  property: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
    rent: number;
  };
  landlordFirstName: string;
}

interface FormData {
  /* Step 1 — Personal Information */
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  currentAddress: string;

  /* Step 2 — Rental History */
  currentLandlordName: string;
  currentLandlordPhone: string;
  currentLandlordEmail: string;
  currentMonthlyRent: string;
  leaseEndDate: string;
  reasonForLeaving: string;
  previousAddress: string;
  previousLandlordName: string;
  previousLandlordPhone: string;
  previousLandlordEmail: string;
  hasBeenEvicted: boolean;
  evictionDetails: string;
  hasFiledBankruptcy: boolean;
  bankruptcyDetails: string;

  /* Step 3 — Employment & Income */
  employerName: string;
  jobTitle: string;
  employerAddress: string;
  employerPhone: string;
  employmentDuration: string;
  monthlyIncome: string;
  additionalIncomeAmount: string;
  additionalIncomeDescription: string;

  /* Step 4 — Occupancy Details */
  numberOfOccupants: number;
  occupantNames: string[];
  hasPets: boolean;
  petDetails: string;
  isSmoker: boolean;
  hasVehicle: boolean;
  vehicleDetails: string;
  desiredMoveInDate: string;
  desiredLeaseTerm: string;

  /* Step 5 — References */
  personalRefName: string;
  personalRefPhone: string;
  personalRefRelationship: string;

  /* Step 6 — Consent & Signature */
  consentCreditCheck: boolean;
  consentReferenceCheck: boolean;
  consentBackgroundCheck: boolean;
  consentPIPA: boolean;
  signatureFullName: string;
  signatureDate: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STEP_LABELS = [
  "Personal Info",
  "Rental History",
  "Employment",
  "Occupancy",
  "References",
  "Consent",
];

const LEASE_TERM_OPTIONS = [
  { value: "", label: "Select lease term" },
  { value: "month-to-month", label: "Month-to-month" },
  { value: "6-months", label: "6 months" },
  { value: "1-year", label: "1 year" },
  { value: "other", label: "Other" },
];

const RELATIONSHIP_OPTIONS = [
  { value: "", label: "Select relationship" },
  { value: "Friend", label: "Friend" },
  { value: "Colleague", label: "Colleague" },
  { value: "Family", label: "Family" },
  { value: "Other", label: "Other" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function todayFormatted(): string {
  return new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Small reusable sub-components                                      */
/* ------------------------------------------------------------------ */

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
      <span className="material-symbols-outlined text-[14px]">error</span>
      {message}
    </p>
  );
}

function YesNoToggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-on-surface">{label}</span>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            !value
              ? "bg-primary text-white"
              : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant"
          }`}
        >
          No
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            value
              ? "bg-primary text-white"
              : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant"
          }`}
        >
          Yes
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function ApplicationForm({
  token,
  property,
  landlordFirstName,
}: ApplicationFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    currentAddress: "",

    currentLandlordName: "",
    currentLandlordPhone: "",
    currentLandlordEmail: "",
    currentMonthlyRent: "",
    leaseEndDate: "",
    reasonForLeaving: "",
    previousAddress: "",
    previousLandlordName: "",
    previousLandlordPhone: "",
    previousLandlordEmail: "",
    hasBeenEvicted: false,
    evictionDetails: "",
    hasFiledBankruptcy: false,
    bankruptcyDetails: "",

    employerName: "",
    jobTitle: "",
    employerAddress: "",
    employerPhone: "",
    employmentDuration: "",
    monthlyIncome: "",
    additionalIncomeAmount: "",
    additionalIncomeDescription: "",

    numberOfOccupants: 1,
    occupantNames: [""],
    hasPets: false,
    petDetails: "",
    isSmoker: false,
    hasVehicle: false,
    vehicleDetails: "",
    desiredMoveInDate: "",
    desiredLeaseTerm: "",

    personalRefName: "",
    personalRefPhone: "",
    personalRefRelationship: "",

    consentCreditCheck: false,
    consentReferenceCheck: false,
    consentBackgroundCheck: false,
    consentPIPA: false,
    signatureFullName: "",
    signatureDate: todayISO(),
  });

  /* ---- generic updater ---- */
  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // clear error when user types
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  /* ---- occupant helpers ---- */
  function handleOccupantCountChange(count: number) {
    const clamped = Math.max(1, count);
    const names = [...form.occupantNames];
    if (clamped > names.length) {
      for (let i = names.length; i < clamped; i++) names.push("");
    } else {
      names.length = clamped;
    }
    setForm((prev) => ({
      ...prev,
      numberOfOccupants: clamped,
      occupantNames: names,
    }));
  }

  function updateOccupantName(index: number, value: string) {
    const names = [...form.occupantNames];
    names[index] = value;
    setForm((prev) => ({ ...prev, occupantNames: names }));
  }

  /* ---- validation per step ---- */
  function validateStep(step: number): boolean {
    const errs: Record<string, string> = {};

    if (step === 0) {
      if (!form.firstName.trim()) errs.firstName = "First name is required";
      if (!form.lastName.trim()) errs.lastName = "Last name is required";
      if (!form.email.trim()) errs.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        errs.email = "Enter a valid email address";
      if (!form.phone.trim()) errs.phone = "Phone number is required";
      if (!form.dateOfBirth) errs.dateOfBirth = "Date of birth is required";
      if (!form.currentAddress.trim())
        errs.currentAddress = "Current address is required";
    }

    if (step === 2) {
      if (!form.employerName.trim())
        errs.employerName = "Employer name is required";
      if (!form.jobTitle.trim()) errs.jobTitle = "Job title is required";
      if (!form.employmentDuration.trim())
        errs.employmentDuration = "Employment duration is required";
      if (!form.monthlyIncome.trim())
        errs.monthlyIncome = "Monthly income is required";
    }

    if (step === 3) {
      if (form.numberOfOccupants < 1)
        errs.numberOfOccupants = "At least 1 occupant is required";
      if (!form.desiredMoveInDate)
        errs.desiredMoveInDate = "Move-in date is required";
      if (!form.desiredLeaseTerm)
        errs.desiredLeaseTerm = "Lease term is required";
    }

    if (step === 4) {
      if (!form.personalRefName.trim())
        errs.personalRefName = "Reference name is required";
      if (!form.personalRefPhone.trim())
        errs.personalRefPhone = "Reference phone is required";
      if (!form.personalRefRelationship)
        errs.personalRefRelationship = "Relationship is required";
    }

    if (step === 5) {
      if (!form.consentCreditCheck)
        errs.consentCreditCheck = "Credit check consent is required";
      if (!form.consentReferenceCheck)
        errs.consentReferenceCheck = "Reference check consent is required";
      if (!form.consentPIPA)
        errs.consentPIPA = "PIPA consent is required";
      if (!form.signatureFullName.trim())
        errs.signatureFullName = "Signature is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /* ---- navigation ---- */
  function handleNext() {
    if (!validateStep(currentStep)) return;
    setCurrentStep((s) => Math.min(s + 1, 5));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setErrors({});
    setCurrentStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---- submit ---- */
  async function handleSubmit() {
    if (!validateStep(5)) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/applications/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, token }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit application");
      }

      router.push(`/apply/${token}/confirmation`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ================================================================ */
  /*  Shared field styling helpers                                     */
  /* ================================================================ */

  const inputBase =
    "w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors";
  const textareaBase = `${inputBase} min-h-[80px] resize-y`;
  const selectBase = `${inputBase} appearance-none cursor-pointer`;
  const labelBase = "block text-sm font-medium text-on-surface mb-1.5";
  const sectionTitle =
    "font-headline text-lg font-semibold text-on-surface mb-1";
  const sectionDesc = "text-sm text-on-surface-variant mb-5";

  /* ================================================================ */
  /*  Step renderers                                                   */
  /* ================================================================ */

  function renderStep0() {
    return (
      <div className="space-y-5">
        <div>
          <h3 className={sectionTitle}>Personal Information</h3>
          <p className={sectionDesc}>
            Tell us a little about yourself so the landlord can review your
            application.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label className={labelBase}>
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={inputBase}
              placeholder="Jane"
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
            />
            <FieldError message={errors.firstName} />
          </div>

          {/* Last Name */}
          <div>
            <label className={labelBase}>
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={inputBase}
              placeholder="Doe"
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
            />
            <FieldError message={errors.lastName} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email */}
          <div>
            <label className={labelBase}>
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className={inputBase}
              placeholder="jane@example.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
            <FieldError message={errors.email} />
          </div>

          {/* Phone */}
          <div>
            <label className={labelBase}>
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              className={inputBase}
              placeholder="(403) 555-1234"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
            <FieldError message={errors.phone} />
          </div>
        </div>

        {/* Date of Birth */}
        <div>
          <label className={labelBase}>
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className={inputBase}
            value={form.dateOfBirth}
            onChange={(e) => update("dateOfBirth", e.target.value)}
          />
          <FieldError message={errors.dateOfBirth} />
        </div>

        {/* Current Address */}
        <div>
          <label className={labelBase}>
            Current Address <span className="text-red-500">*</span>
          </label>
          <textarea
            className={textareaBase}
            placeholder="123 Main St, Unit 4, Calgary, AB T2P 1J9"
            rows={3}
            value={form.currentAddress}
            onChange={(e) => update("currentAddress", e.target.value)}
          />
          <FieldError message={errors.currentAddress} />
        </div>
      </div>
    );
  }

  function renderStep1() {
    return (
      <div className="space-y-5">
        <div>
          <h3 className={sectionTitle}>Rental History</h3>
          <p className={sectionDesc}>
            Provide details about your current and previous rental history.
          </p>
        </div>

        {/* Current Landlord Section */}
        <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-4 space-y-4">
          <p className="text-sm font-semibold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">
              person
            </span>
            Current Landlord
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelBase}>Name</label>
              <input
                type="text"
                className={inputBase}
                placeholder="Landlord name"
                value={form.currentLandlordName}
                onChange={(e) =>
                  update("currentLandlordName", e.target.value)
                }
              />
            </div>
            <div>
              <label className={labelBase}>Phone</label>
              <input
                type="tel"
                className={inputBase}
                placeholder="(403) 555-0000"
                value={form.currentLandlordPhone}
                onChange={(e) =>
                  update("currentLandlordPhone", e.target.value)
                }
              />
            </div>
          </div>

          <div>
            <label className={labelBase}>Email</label>
            <input
              type="email"
              className={inputBase}
              placeholder="landlord@email.com"
              value={form.currentLandlordEmail}
              onChange={(e) =>
                update("currentLandlordEmail", e.target.value)
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>Current Monthly Rent</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                $
              </span>
              <input
                type="number"
                className={`${inputBase} pl-7`}
                placeholder="1,500"
                value={form.currentMonthlyRent}
                onChange={(e) =>
                  update("currentMonthlyRent", e.target.value)
                }
              />
            </div>
          </div>
          <div>
            <label className={labelBase}>Lease End Date</label>
            <input
              type="date"
              className={inputBase}
              value={form.leaseEndDate}
              onChange={(e) => update("leaseEndDate", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelBase}>Reason for Leaving</label>
          <textarea
            className={textareaBase}
            placeholder="Why are you moving?"
            rows={3}
            value={form.reasonForLeaving}
            onChange={(e) => update("reasonForLeaving", e.target.value)}
          />
        </div>

        <div>
          <label className={labelBase}>Previous Address</label>
          <textarea
            className={textareaBase}
            placeholder="Previous address (if applicable)"
            rows={2}
            value={form.previousAddress}
            onChange={(e) => update("previousAddress", e.target.value)}
          />
        </div>

        {/* Previous Landlord Section */}
        <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-4 space-y-4">
          <p className="text-sm font-semibold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">
              history
            </span>
            Previous Landlord
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelBase}>Name</label>
              <input
                type="text"
                className={inputBase}
                placeholder="Previous landlord name"
                value={form.previousLandlordName}
                onChange={(e) =>
                  update("previousLandlordName", e.target.value)
                }
              />
            </div>
            <div>
              <label className={labelBase}>Phone</label>
              <input
                type="tel"
                className={inputBase}
                placeholder="(403) 555-0000"
                value={form.previousLandlordPhone}
                onChange={(e) =>
                  update("previousLandlordPhone", e.target.value)
                }
              />
            </div>
          </div>

          <div>
            <label className={labelBase}>Email</label>
            <input
              type="email"
              className={inputBase}
              placeholder="previous-landlord@email.com"
              value={form.previousLandlordEmail}
              onChange={(e) =>
                update("previousLandlordEmail", e.target.value)
              }
            />
          </div>
        </div>

        {/* Eviction & Bankruptcy */}
        <div className="space-y-3">
          <YesNoToggle
            label="Have you ever been evicted?"
            value={form.hasBeenEvicted}
            onChange={(v) => update("hasBeenEvicted", v)}
          />
          {form.hasBeenEvicted && (
            <div>
              <label className={labelBase}>Eviction Details</label>
              <textarea
                className={textareaBase}
                placeholder="Please explain the circumstances"
                rows={3}
                value={form.evictionDetails}
                onChange={(e) => update("evictionDetails", e.target.value)}
              />
            </div>
          )}

          <YesNoToggle
            label="Have you filed for bankruptcy?"
            value={form.hasFiledBankruptcy}
            onChange={(v) => update("hasFiledBankruptcy", v)}
          />
          {form.hasFiledBankruptcy && (
            <div>
              <label className={labelBase}>Bankruptcy Details</label>
              <textarea
                className={textareaBase}
                placeholder="Please explain the circumstances"
                rows={3}
                value={form.bankruptcyDetails}
                onChange={(e) =>
                  update("bankruptcyDetails", e.target.value)
                }
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="space-y-5">
        <div>
          <h3 className={sectionTitle}>Employment &amp; Income</h3>
          <p className={sectionDesc}>
            Provide your current employment and income details.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>
              Employer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={inputBase}
              placeholder="Company Inc."
              value={form.employerName}
              onChange={(e) => update("employerName", e.target.value)}
            />
            <FieldError message={errors.employerName} />
          </div>
          <div>
            <label className={labelBase}>
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={inputBase}
              placeholder="Software Developer"
              value={form.jobTitle}
              onChange={(e) => update("jobTitle", e.target.value)}
            />
            <FieldError message={errors.jobTitle} />
          </div>
        </div>

        <div>
          <label className={labelBase}>Employer Address</label>
          <textarea
            className={textareaBase}
            placeholder="Employer street address"
            rows={2}
            value={form.employerAddress}
            onChange={(e) => update("employerAddress", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>Employer Phone</label>
            <input
              type="tel"
              className={inputBase}
              placeholder="(403) 555-0000"
              value={form.employerPhone}
              onChange={(e) => update("employerPhone", e.target.value)}
            />
          </div>
          <div>
            <label className={labelBase}>
              Employment Duration <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={inputBase}
              placeholder="e.g. 2 years"
              value={form.employmentDuration}
              onChange={(e) =>
                update("employmentDuration", e.target.value)
              }
            />
            <FieldError message={errors.employmentDuration} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>
              Monthly Income <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                $
              </span>
              <input
                type="number"
                className={`${inputBase} pl-7`}
                placeholder="5,000"
                value={form.monthlyIncome}
                onChange={(e) => update("monthlyIncome", e.target.value)}
              />
            </div>
            <FieldError message={errors.monthlyIncome} />
          </div>
          <div>
            <label className={labelBase}>Additional Income</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                $
              </span>
              <input
                type="number"
                className={`${inputBase} pl-7`}
                placeholder="0"
                value={form.additionalIncomeAmount}
                onChange={(e) =>
                  update("additionalIncomeAmount", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        {form.additionalIncomeAmount &&
          Number(form.additionalIncomeAmount) > 0 && (
            <div>
              <label className={labelBase}>
                Additional Income Description
              </label>
              <input
                type="text"
                className={inputBase}
                placeholder="e.g. Freelance work, investments"
                value={form.additionalIncomeDescription}
                onChange={(e) =>
                  update("additionalIncomeDescription", e.target.value)
                }
              />
            </div>
          )}
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="space-y-5">
        <div>
          <h3 className={sectionTitle}>Occupancy Details</h3>
          <p className={sectionDesc}>
            Who will be living in the unit and any other details the landlord
            should know.
          </p>
        </div>

        {/* Number of Occupants */}
        <div>
          <label className={labelBase}>
            Number of Occupants <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            className={`${inputBase} max-w-[120px]`}
            value={form.numberOfOccupants}
            onChange={(e) =>
              handleOccupantCountChange(parseInt(e.target.value) || 1)
            }
          />
          <FieldError message={errors.numberOfOccupants} />
        </div>

        {/* Dynamic Occupant Name Fields */}
        {form.numberOfOccupants > 0 && (
          <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-4 space-y-3">
            <p className="text-sm font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">
                group
              </span>
              Occupant Names
            </p>
            {form.occupantNames.map((name, i) => (
              <div key={i}>
                <label className={labelBase}>Occupant {i + 1}</label>
                <input
                  type="text"
                  className={inputBase}
                  placeholder={`Full name of occupant ${i + 1}`}
                  value={name}
                  onChange={(e) => updateOccupantName(i, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Pets */}
        <YesNoToggle
          label="Do you have pets?"
          value={form.hasPets}
          onChange={(v) => update("hasPets", v)}
        />
        {form.hasPets && (
          <div>
            <label className={labelBase}>Pet Details</label>
            <textarea
              className={textareaBase}
              placeholder="Type, breed, weight (e.g. Dog, Golden Retriever, 65 lbs)"
              rows={3}
              value={form.petDetails}
              onChange={(e) => update("petDetails", e.target.value)}
            />
          </div>
        )}

        {/* Smoker */}
        <YesNoToggle
          label="Are you a smoker?"
          value={form.isSmoker}
          onChange={(v) => update("isSmoker", v)}
        />

        {/* Vehicle */}
        <YesNoToggle
          label="Do you have a vehicle?"
          value={form.hasVehicle}
          onChange={(v) => update("hasVehicle", v)}
        />
        {form.hasVehicle && (
          <div>
            <label className={labelBase}>Vehicle Details</label>
            <textarea
              className={textareaBase}
              placeholder="Make, model, license plate (e.g. Toyota Camry, ABC-1234)"
              rows={2}
              value={form.vehicleDetails}
              onChange={(e) => update("vehicleDetails", e.target.value)}
            />
          </div>
        )}

        {/* Move-in & Lease */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>
              Desired Move-in Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={inputBase}
              value={form.desiredMoveInDate}
              onChange={(e) =>
                update("desiredMoveInDate", e.target.value)
              }
            />
            <FieldError message={errors.desiredMoveInDate} />
          </div>
          <div>
            <label className={labelBase}>
              Desired Lease Term <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                className={selectBase}
                value={form.desiredLeaseTerm}
                onChange={(e) =>
                  update("desiredLeaseTerm", e.target.value)
                }
              >
                {LEASE_TERM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
                expand_more
              </span>
            </div>
            <FieldError message={errors.desiredLeaseTerm} />
          </div>
        </div>
      </div>
    );
  }

  function renderStep4() {
    return (
      <div className="space-y-5">
        <div>
          <h3 className={sectionTitle}>References</h3>
          <p className={sectionDesc}>
            Provide a personal reference who can vouch for your character.
          </p>
        </div>

        <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-4 space-y-4">
          <p className="text-sm font-semibold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">
              contact_phone
            </span>
            Personal Reference
          </p>

          <div>
            <label className={labelBase}>
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={inputBase}
              placeholder="Reference full name"
              value={form.personalRefName}
              onChange={(e) => update("personalRefName", e.target.value)}
            />
            <FieldError message={errors.personalRefName} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelBase}>
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                className={inputBase}
                placeholder="(403) 555-0000"
                value={form.personalRefPhone}
                onChange={(e) =>
                  update("personalRefPhone", e.target.value)
                }
              />
              <FieldError message={errors.personalRefPhone} />
            </div>
            <div>
              <label className={labelBase}>
                Relationship <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  className={selectBase}
                  value={form.personalRefRelationship}
                  onChange={(e) =>
                    update("personalRefRelationship", e.target.value)
                  }
                >
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
                  expand_more
                </span>
              </div>
              <FieldError message={errors.personalRefRelationship} />
            </div>
          </div>
        </div>

        {/* Note about landlord references */}
        <div className="flex gap-3 rounded-2xl bg-primary/5 border border-primary/15 p-4">
          <span className="material-symbols-outlined text-primary text-[20px] mt-0.5 shrink-0">
            info
          </span>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Previous landlord references were captured in Step 2. Your current
            and previous landlords may be contacted.
          </p>
        </div>
      </div>
    );
  }

  function renderStep5() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className={sectionTitle}>Consent &amp; Signature</h3>
          <p className={sectionDesc}>
            Please review each consent clause below and provide your digital
            signature.
          </p>
        </div>

        {/* Credit Check Consent */}
        <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-4 space-y-3">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            I authorize the landlord or their agent to obtain a consumer credit
            report from a credit reporting agency for the purpose of evaluating
            this rental application.
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.consentCreditCheck}
              onChange={(e) =>
                update("consentCreditCheck", e.target.checked)
              }
              className="mt-0.5 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/40 accent-[#273f4f] cursor-pointer"
            />
            <span className="text-sm font-medium text-on-surface">
              I consent to a credit check{" "}
              <span className="text-red-500">*</span>
            </span>
          </label>
          <FieldError message={errors.consentCreditCheck} />
        </div>

        {/* Reference Check Consent */}
        <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-4 space-y-3">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            I consent to the landlord contacting the references provided in this
            application.
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.consentReferenceCheck}
              onChange={(e) =>
                update("consentReferenceCheck", e.target.checked)
              }
              className="mt-0.5 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/40 accent-[#273f4f] cursor-pointer"
            />
            <span className="text-sm font-medium text-on-surface">
              I consent to reference checks{" "}
              <span className="text-red-500">*</span>
            </span>
          </label>
          <FieldError message={errors.consentReferenceCheck} />
        </div>

        {/* Background Check Consent (Optional) */}
        <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-4 space-y-3">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            I consent to a background check if required by the landlord.
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.consentBackgroundCheck}
              onChange={(e) =>
                update("consentBackgroundCheck", e.target.checked)
              }
              className="mt-0.5 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/40 accent-[#273f4f] cursor-pointer"
            />
            <span className="text-sm font-medium text-on-surface">
              I consent to a background check{" "}
              <span className="text-on-surface-variant font-normal">
                (optional)
              </span>
            </span>
          </label>
        </div>

        {/* PIPA Consent */}
        <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-4 space-y-3">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            I understand that the personal information collected in this
            application will be used solely for the purpose of evaluating my
            suitability as a tenant. This information will be stored securely and
            will not be disclosed to third parties except as authorized by me or
            as required by law. This collection is authorized under the Personal
            Information Protection Act (PIPA), SA 2003, c. P-6.5.
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.consentPIPA}
              onChange={(e) => update("consentPIPA", e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/40 accent-[#273f4f] cursor-pointer"
            />
            <span className="text-sm font-medium text-on-surface">
              I acknowledge the PIPA disclosure{" "}
              <span className="text-red-500">*</span>
            </span>
          </label>
          <FieldError message={errors.consentPIPA} />
        </div>

        {/* Signature */}
        <div className="rounded-2xl border-2 border-primary/20 bg-primary/[0.03] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">
              draw
            </span>
            <p className="text-sm font-semibold text-on-surface">
              Digital Signature
            </p>
          </div>

          <div>
            <label className={labelBase}>
              Type your full legal name as your digital signature{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`${inputBase} font-medium italic`}
              placeholder="Jane Elizabeth Doe"
              value={form.signatureFullName}
              onChange={(e) => update("signatureFullName", e.target.value)}
            />
            <FieldError message={errors.signatureFullName} />
          </div>

          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">
              calendar_today
            </span>
            <span>Date: {todayFormatted()}</span>
          </div>
        </div>
      </div>
    );
  }

  const stepRenderers = [
    renderStep0,
    renderStep1,
    renderStep2,
    renderStep3,
    renderStep4,
    renderStep5,
  ];

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="min-h-screen bg-surface pb-12">
      {/* ---- Header ---- */}
      <header className="bg-primary text-white">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2.5 mb-5">
            <Logo height={26} background="dark" />
          </div>

          {/* Property Card */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-4">
            <p className="text-xs uppercase tracking-wider text-white/60 mb-2">
              Application for
            </p>
            <p className="font-headline font-semibold text-base leading-snug">
              {property.address}
            </p>
            <p className="text-sm text-white/80 mt-0.5">
              {property.city}, {property.province} {property.postalCode}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-white/60">
                  payments
                </span>
                <span className="text-sm font-semibold">
                  {formatCurrency(property.rent)}
                  <span className="font-normal text-white/60">/mo</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-white/60">
                  person
                </span>
                <span className="text-sm text-white/80">
                  {landlordFirstName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ---- Progress Bar ---- */}
      <div className="sticky top-0 z-10 bg-surface border-b border-outline-variant/50 shadow-ambient-sm">
        <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            {STEP_LABELS.map((label, i) => {
              const isCompleted = i < currentStep;
              const isActive = i === currentStep;

              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1.5 flex-1"
                >
                  {/* Step indicator */}
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isCompleted
                        ? "bg-primary text-white"
                        : isActive
                          ? "bg-primary text-white ring-2 ring-primary/30 ring-offset-2 ring-offset-surface"
                          : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant"
                    }`}
                  >
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-[16px]">
                        check
                      </span>
                    ) : (
                      i + 1
                    )}
                  </div>
                  {/* Step label — hidden on mobile */}
                  <span
                    className={`hidden sm:block text-[11px] font-medium text-center leading-tight transition-colors ${
                      isActive
                        ? "text-primary"
                        : isCompleted
                          ? "text-primary/70"
                          : "text-on-surface-variant"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress line */}
          <div className="mt-2 h-1 w-full rounded-full bg-surface-container-lowest overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{
                width: `${((currentStep + 1) / STEP_LABELS.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ---- Form Body ---- */}
      <main className="mx-auto max-w-2xl px-4 sm:px-6 mt-6">
        <div className="rounded-3xl bg-white border border-outline-variant/30 shadow-ambient-sm p-5 sm:p-8">
          {stepRenderers[currentStep]()}
        </div>

        {/* ---- Navigation ---- */}
        <div className="flex items-center justify-between mt-6 gap-4">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant bg-white px-5 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-lowest transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                arrow_back
              </span>
              Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors shadow-ambient-sm"
            >
              Next
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-6 py-2.5 text-sm font-bold text-white hover:bg-secondary/90 transition-colors shadow-ambient-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                  Submitting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    send
                  </span>
                  Submit Application
                </>
              )}
            </button>
          )}
        </div>

        {/* Step count for mobile */}
        <p className="text-center text-xs text-on-surface-variant mt-4 sm:hidden">
          Step {currentStep + 1} of {STEP_LABELS.length}
        </p>
      </main>
    </div>
  );
}
