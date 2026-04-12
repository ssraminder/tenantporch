"use client";

import { useState } from "react";
import { updateTenantProfile, changePassword } from "@/app/tenant/actions/profile-actions";
import { toast } from "sonner";

export function ProfileForm() {
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Submitting states
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append("phone", "");
      formData.append("emergency_contact_name", emergencyName);
      formData.append("emergency_contact_phone", emergencyPhone);
      const result = await updateTenantProfile(formData);
      if (result.success) {
        toast.success("Emergency contact saved successfully.");
      } else {
        toast.error(result.error ?? "Failed to save changes.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (!newPassword.trim()) {
      toast.error("New password is required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const formData = new FormData();
      formData.append("newPassword", newPassword);
      const result = await changePassword(formData);
      if (result.success) {
        toast.success("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.error ?? "Failed to update password.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setUpdatingPassword(false);
    }
  }

  return (
    <>
      {/* Communication Preferences */}
      <section className="bg-surface-container-lowest p-8 rounded-xl shadow-ambient">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h4 className="font-headline text-lg font-bold text-primary">
              Communication Preferences
            </h4>
            <p className="text-on-surface-variant text-sm mt-1">
              Manage how you receive alerts and property updates.
            </p>
          </div>
        </div>
        <div className="space-y-6">
          {/* Email Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">alternate_email</span>
              </div>
              <div>
                <p className="font-semibold text-primary">Email Notifications</p>
                <p className="text-xs text-on-surface-variant">
                  Monthly invoices and maintenance confirmations.
                </p>
              </div>
            </div>
            <button
              onClick={() => setEmailNotifs(!emailNotifs)}
              className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors ${
                emailNotifs ? "bg-secondary-container" : "bg-surface-variant"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                  emailNotifs ? "ml-auto" : ""
                }`}
              />
            </button>
          </div>

          {/* SMS Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">sms</span>
              </div>
              <div>
                <p className="font-semibold text-primary">SMS Alerts</p>
                <p className="text-xs text-on-surface-variant">
                  Urgent emergency and maintenance entries.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSmsNotifs(!smsNotifs)}
              className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors ${
                smsNotifs ? "bg-secondary-container" : "bg-surface-variant"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                  smsNotifs ? "ml-auto" : ""
                }`}
              />
            </button>
          </div>

          {/* Push Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">
                  notifications_active
                </span>
              </div>
              <div>
                <p className="font-semibold text-primary">App Push</p>
                <p className="text-xs text-on-surface-variant">
                  Real-time chat and document signing.
                </p>
              </div>
            </div>
            <button
              onClick={() => setPushNotifs(!pushNotifs)}
              className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors ${
                pushNotifs ? "bg-secondary-container" : "bg-surface-variant"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                  pushNotifs ? "ml-auto" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="bg-surface-container-lowest p-8 rounded-xl shadow-ambient">
        <div className="mb-8">
          <h4 className="font-headline text-lg font-bold text-primary">
            Emergency Contact
          </h4>
          <p className="text-on-surface-variant text-sm mt-1">
            Required for provincial safety compliance.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-on-surface-variant ml-1">
              Contact Name
            </label>
            <input
              type="text"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              className="bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-sm focus:ring-0 focus:border-secondary transition-all outline-none text-primary font-medium"
              placeholder="Jane Doe"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-on-surface-variant ml-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              className="bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-sm focus:ring-0 focus:border-secondary transition-all outline-none text-primary font-medium"
              placeholder="+1 (403) 555-0129"
            />
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="px-8 py-3 bg-primary text-white rounded-lg font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
          >
            {savingProfile ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>

      {/* Change Password */}
      <section className="bg-surface-container-lowest p-8 rounded-xl shadow-ambient border-l-4 border-secondary-container">
        <div className="mb-8">
          <h4 className="font-headline text-lg font-bold text-primary">
            Security & Access
          </h4>
          <p className="text-on-surface-variant text-sm mt-1">
            Update your password to keep your lease data secure.
          </p>
        </div>
        <div className="space-y-4 max-w-md">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-on-surface-variant ml-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-sm focus:ring-0 focus:border-secondary transition-all outline-none"
              placeholder="••••••••••••"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-on-surface-variant ml-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-sm focus:ring-0 focus:border-secondary transition-all outline-none"
              placeholder="Enter new password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-on-surface-variant ml-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-sm focus:ring-0 focus:border-secondary transition-all outline-none"
              placeholder="Confirm new password"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={updatingPassword}
            className="mt-4 text-secondary font-bold text-sm flex items-center gap-2 hover:translate-x-1 transition-transform disabled:opacity-50"
          >
            {updatingPassword ? "Updating..." : "Update Password"}{" "}
            <span className="material-symbols-outlined text-sm">
              arrow_forward_ios
            </span>
          </button>
        </div>
      </section>
    </>
  );
}
