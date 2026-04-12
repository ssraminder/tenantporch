"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createProperty } from "@/app/admin/actions/property-actions";
import { updateProperty } from "@/app/admin/actions/property-actions";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

const PROVINCES = [
  { value: "AB", label: "AB" },
  { value: "BC", label: "BC" },
  { value: "MB", label: "MB" },
  { value: "NB", label: "NB" },
  { value: "NL", label: "NL" },
  { value: "NS", label: "NS" },
  { value: "NT", label: "NT" },
  { value: "NU", label: "NU" },
  { value: "ON", label: "ON" },
  { value: "PE", label: "PE" },
  { value: "QC", label: "QC" },
  { value: "SK", label: "SK" },
  { value: "YT", label: "YT" },
];

const PARKING_OPTIONS = [
  { value: "none", label: "None" },
  { value: "driveway", label: "Driveway" },
  { value: "garage", label: "Garage" },
  { value: "carport", label: "Carport" },
  { value: "street", label: "Street" },
  { value: "underground", label: "Underground" },
  { value: "assigned", label: "Assigned" },
];

const LAUNDRY_OPTIONS = [
  { value: "none", label: "None" },
  { value: "in_unit", label: "In-Unit" },
  { value: "shared", label: "Shared" },
  { value: "coin_op", label: "Coin-Op" },
];

const HEATING_OPTIONS = [
  { value: "forced_air", label: "Forced Air" },
  { value: "baseboard", label: "Baseboard" },
  { value: "radiant", label: "Radiant Floor" },
  { value: "boiler", label: "Boiler" },
  { value: "heat_pump", label: "Heat Pump" },
  { value: "other", label: "Other" },
];

const COOLING_OPTIONS = [
  { value: "none", label: "None" },
  { value: "central_ac", label: "Central AC" },
  { value: "window_unit", label: "Window Unit" },
  { value: "mini_split", label: "Mini Split" },
  { value: "evaporative", label: "Evaporative" },
];

interface PropertyData {
  address_line1?: string;
  address_line2?: string;
  city?: string;
  province_state?: string;
  postal_code?: string;
  unit_description?: string;
  monthly_rent?: number;
  pet_deposit?: number;
  has_separate_entrance?: boolean;
  has_separate_mailbox?: boolean;
  is_furnished?: boolean;
  storage_included?: boolean;
  yard_access?: boolean;
  sticker_number?: string;
  parking_type?: string;
  parking_spots?: number;
  laundry_type?: string;
  heating_type?: string;
  cooling_type?: string;
  wifi_ssid?: string;
  wifi_password?: string;
}

interface PropertyFormProps {
  mode: "create" | "edit";
  property?: PropertyData;
  propertyId?: string;
  breadcrumbAddress?: string;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-on-surface">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
      </label>
    </div>
  );
}

export default function PropertyForm({
  mode,
  property,
  propertyId,
  breadcrumbAddress,
}: PropertyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Address
  const [addressLine1, setAddressLine1] = useState(property?.address_line1 ?? "");
  const [addressLine2, setAddressLine2] = useState(property?.address_line2 ?? "");
  const [city, setCity] = useState(property?.city ?? "");
  const [provinceState, setProvinceState] = useState(property?.province_state ?? "");
  const [postalCode, setPostalCode] = useState(property?.postal_code ?? "");
  const [unitDescription, setUnitDescription] = useState(property?.unit_description ?? "");

  // Financials
  const [monthlyRent, setMonthlyRent] = useState(property?.monthly_rent?.toString() ?? "");
  const [petDeposit, setPetDeposit] = useState(property?.pet_deposit?.toString() ?? "");

  // Unit Features
  const [hasSeparateEntrance, setHasSeparateEntrance] = useState(property?.has_separate_entrance ?? true);
  const [hasSeparateMailbox, setHasSeparateMailbox] = useState(property?.has_separate_mailbox ?? true);
  const [isFurnished, setIsFurnished] = useState(property?.is_furnished ?? false);
  const [storageIncluded, setStorageIncluded] = useState(property?.storage_included ?? false);
  const [yardAccess, setYardAccess] = useState(property?.yard_access ?? false);
  const [stickerNumber, setStickerNumber] = useState(property?.sticker_number ?? "");

  // Parking & Laundry
  const [parkingType, setParkingType] = useState(property?.parking_type ?? "none");
  const [parkingSpots, setParkingSpots] = useState(property?.parking_spots?.toString() ?? "0");
  const [laundryType, setLaundryType] = useState(property?.laundry_type ?? "none");

  // Climate Control
  const [heatingType, setHeatingType] = useState(property?.heating_type ?? "forced_air");
  const [coolingType, setCoolingType] = useState(property?.cooling_type ?? "none");

  // Internet
  const [wifiSsid, setWifiSsid] = useState(property?.wifi_ssid ?? "");
  const [wifiPassword, setWifiPassword] = useState(property?.wifi_password ?? "");

  const backHref = mode === "edit" ? `/admin/properties/${propertyId}` : "/admin/properties";
  const title = mode === "edit" ? "Edit Property" : "Add Property";
  const submitLabel = mode === "edit" ? "Save Changes" : "Save Property";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("address_line1", addressLine1);
    formData.set("address_line2", addressLine2);
    formData.set("city", city);
    formData.set("province_state", provinceState);
    formData.set("postal_code", postalCode);
    formData.set("unit_description", unitDescription);
    formData.set("monthly_rent", monthlyRent);
    formData.set("pet_deposit", petDeposit || "0");
    formData.set("has_separate_entrance", hasSeparateEntrance.toString());
    formData.set("has_separate_mailbox", hasSeparateMailbox.toString());
    formData.set("is_furnished", isFurnished.toString());
    formData.set("storage_included", storageIncluded.toString());
    formData.set("yard_access", yardAccess.toString());
    formData.set("sticker_number", stickerNumber);
    formData.set("parking_type", parkingType);
    formData.set("parking_spots", parkingSpots);
    formData.set("laundry_type", laundryType);
    formData.set("heating_type", heatingType);
    formData.set("cooling_type", coolingType);
    formData.set("wifi_ssid", wifiSsid);
    formData.set("wifi_password", wifiPassword);
    formData.set("country_code", "CA");

    try {
      const result =
        mode === "edit" && propertyId
          ? await updateProperty(propertyId, formData)
          : await createProperty(formData);

      if (result.success) {
        toast.success(mode === "edit" ? "Property updated" : "Property created");
        router.push(`/admin/properties/${result.propertyId}`);
      } else {
        setError(result.error ?? "Something went wrong");
        toast.error(result.error ?? "Something went wrong");
      }
    } catch {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";
  const selectCls =
    "w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none cursor-pointer";
  const labelCls = "block text-sm font-bold text-primary mb-2";

  return (
    <section className="space-y-8">
      {/* Breadcrumb */}
      {mode === "edit" && breadcrumbAddress ? (
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
            { label: "Properties", href: "/admin/properties", icon: "apartment" },
            { label: breadcrumbAddress, href: `/admin/properties/${propertyId}` },
            { label: "Edit" },
          ]}
        />
      ) : (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to Properties
        </Link>
      )}

      {/* Title */}
      <h1 className="font-headline text-2xl font-bold text-primary">{title}</h1>

      {/* Error banner */}
      {error && (
        <div className="bg-error-container rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-on-error-container mt-0.5">
            error
          </span>
          <p className="text-sm text-on-error-container">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Address */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">
              location_on
            </span>
            <h2 className="font-headline font-bold text-xl">Address</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address Line 1 */}
            <div className="md:col-span-2">
              <label className={labelCls}>
                Address Line 1 <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  location_on
                </span>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="123 Main Street"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Address Line 2 */}
            <div className="md:col-span-2">
              <label className={labelCls}>Address Line 2</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  add_location
                </span>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Suite, unit, building, floor, etc."
                  className={inputCls}
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className={labelCls}>
                City <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  location_city
                </span>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Toronto"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Province */}
            <div>
              <label className={labelCls}>
                Province <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  map
                </span>
                <select
                  required
                  value={provinceState}
                  onChange={(e) => setProvinceState(e.target.value)}
                  className={selectCls}
                >
                  <option value="">Select province</option>
                  {PROVINCES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Postal Code */}
            <div>
              <label className={labelCls}>
                Postal Code <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  markunread_mailbox
                </span>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="M5V 2T6"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Unit Description */}
          <div>
            <label className={labelCls}>Unit Description</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-lg">
                description
              </span>
              <textarea
                value={unitDescription}
                onChange={(e) => setUnitDescription(e.target.value)}
                placeholder="e.g. Basement apartment, Unit 4B, Garden suite..."
                rows={3}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Financials */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">
              payments
            </span>
            <h2 className="font-headline font-bold text-xl">Financials</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Rent */}
            <div>
              <label className={labelCls}>
                Monthly Rent <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  payments
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  placeholder="1500.00"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Pet Deposit */}
            <div>
              <label className={labelCls}>Pet Deposit</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  pets
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={petDeposit}
                  onChange={(e) => setPetDeposit(e.target.value)}
                  placeholder="0.00"
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Unit Features */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">
              apartment
            </span>
            <h2 className="font-headline font-bold text-xl">Unit Features</h2>
          </div>

          <div className="space-y-1">
            <Toggle
              checked={hasSeparateEntrance}
              onChange={setHasSeparateEntrance}
              label="Separate Entrance"
            />
            <div className="h-px bg-outline-variant/15" />
            <Toggle
              checked={hasSeparateMailbox}
              onChange={setHasSeparateMailbox}
              label="Separate Mailbox"
            />
            <div className="h-px bg-outline-variant/15" />
            <Toggle
              checked={isFurnished}
              onChange={setIsFurnished}
              label="Furnished"
            />
            <div className="h-px bg-outline-variant/15" />
            <Toggle
              checked={storageIncluded}
              onChange={setStorageIncluded}
              label="Storage Included"
            />
            <div className="h-px bg-outline-variant/15" />
            <Toggle
              checked={yardAccess}
              onChange={setYardAccess}
              label="Yard Access"
            />
          </div>

          <div className="h-px bg-outline-variant/15" />

          {/* Sticker Number */}
          <div className="max-w-sm">
            <label className={labelCls}>Sticker Number</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                confirmation_number
              </span>
              <input
                type="text"
                value={stickerNumber}
                onChange={(e) => setStickerNumber(e.target.value)}
                placeholder="Optional"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Parking & Laundry */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">
              local_parking
            </span>
            <h2 className="font-headline font-bold text-xl">
              Parking &amp; Laundry
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Parking Type */}
            <div>
              <label className={labelCls}>Parking Type</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  local_parking
                </span>
                <select
                  value={parkingType}
                  onChange={(e) => setParkingType(e.target.value)}
                  className={selectCls}
                >
                  {PARKING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Parking Spots */}
            <div>
              <label className={labelCls}>Parking Spots</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  directions_car
                </span>
                <input
                  type="number"
                  min="0"
                  value={parkingSpots}
                  onChange={(e) => setParkingSpots(e.target.value)}
                  placeholder="0"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Laundry Type */}
            <div>
              <label className={labelCls}>Laundry Type</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  local_laundry_service
                </span>
                <select
                  value={laundryType}
                  onChange={(e) => setLaundryType(e.target.value)}
                  className={selectCls}
                >
                  {LAUNDRY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Climate Control */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">
              thermostat
            </span>
            <h2 className="font-headline font-bold text-xl">Climate Control</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Heating Type */}
            <div>
              <label className={labelCls}>Heating Type</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  thermostat
                </span>
                <select
                  value={heatingType}
                  onChange={(e) => setHeatingType(e.target.value)}
                  className={selectCls}
                >
                  {HEATING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Cooling Type */}
            <div>
              <label className={labelCls}>Cooling Type</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  ac_unit
                </span>
                <select
                  value={coolingType}
                  onChange={(e) => setCoolingType(e.target.value)}
                  className={selectCls}
                >
                  {COOLING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Internet */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">wifi</span>
            <h2 className="font-headline font-bold text-xl">Internet</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* WiFi SSID */}
            <div>
              <label className={labelCls}>WiFi Network Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  wifi
                </span>
                <input
                  type="text"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  placeholder="Network SSID"
                  className={inputCls}
                />
              </div>
            </div>

            {/* WiFi Password */}
            <div>
              <label className={labelCls}>WiFi Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  key
                </span>
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="Password"
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <Link
            href={backHref}
            className="w-full sm:w-auto text-center bg-surface-container-low text-on-surface px-6 py-3 rounded-xl font-bold hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-primary text-on-primary px-8 py-3 rounded-xl text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
          >
            {loading && (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}
