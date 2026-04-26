"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

export default function NewLeaseTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [provinceCode, setProvinceCode] = useState("AB");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Template name is required.");
      return;
    }
    setSubmitting(true);
    try {
      const { createLeaseTemplate } = await import(
        "@/app/admin/actions/lease-template-actions"
      );
      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("description", description.trim());
      formData.set("province_code", provinceCode);
      const result = await createLeaseTemplate(formData);
      if (result.success) {
        toast.success(
          "Template created. Tip: apply it to a draft lease, edit clauses on the document page, then 'Save as my template' to capture changes."
        );
        router.push(`/admin/lease-templates/${result.templateId}`);
      } else {
        toast.error(result.error ?? "Failed to create template.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-8">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
          { label: "Lease Templates", href: "/admin/lease-templates" },
          { label: "New" },
        ]}
      />

      <div>
        <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
          New Lease Template
        </h1>
        <p className="text-sm text-on-surface-variant font-medium mt-1">
          Create a blank template, then fill it in by applying to a draft lease and editing.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 md:p-8 space-y-6 max-w-2xl"
      >
        <div>
          <label htmlFor="name" className="block text-sm font-bold text-primary mb-2">
            Template Name <span className="text-error">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alberta Furnished Suite (Standard)"
            className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-bold text-primary mb-2"
          >
            Description (optional)
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What kind of property / clauses does this template cover?"
            className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label
            htmlFor="province"
            className="block text-sm font-bold text-primary mb-2"
          >
            Province
          </label>
          <select
            id="province"
            value={provinceCode}
            onChange={(e) => setProvinceCode(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="AB">Alberta</option>
            <option value="BC">British Columbia</option>
            <option value="ON">Ontario</option>
            <option value="QC">Quebec</option>
            <option value="MB">Manitoba</option>
            <option value="SK">Saskatchewan</option>
            <option value="NS">Nova Scotia</option>
            <option value="NB">New Brunswick</option>
            <option value="NL">Newfoundland and Labrador</option>
            <option value="PE">Prince Edward Island</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/lease-templates"
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-high"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">
              {submitting ? "progress_activity" : "add"}
            </span>
            {submitting ? "Creating..." : "Create Template"}
          </button>
        </div>
      </form>
    </section>
  );
}
