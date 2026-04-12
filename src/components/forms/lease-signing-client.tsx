"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";
import { submitSignature } from "@/app/admin/actions/signing-actions";
import type { LeaseDocumentContent } from "@/lib/lease-templates/alberta";

type SignatureMethod = "type" | "draw" | "upload";

interface Participant {
  id: string;
  signerName: string;
  signerRole: string;
  signingOrder: number;
  status: string;
  signedAt: string | null;
}

interface LeaseSigningClientProps {
  token: string;
  participantName: string;
  participantRole: string;
  documentContent: LeaseDocumentContent;
  propertyAddress: string;
  participants: Participant[];
  expiresAt: string | null;
}

const SIGNATURE_FONTS = [
  { name: "Cursive", style: "italic 32px 'Segoe Script', 'Brush Script MT', cursive" },
  { name: "Formal", style: "italic 28px Georgia, 'Times New Roman', serif" },
  { name: "Script", style: "italic 34px 'Comic Sans MS', cursive" },
];

export function LeaseSigningClient({
  token,
  participantName,
  participantRole,
  documentContent,
  propertyAddress,
  participants,
  expiresAt,
}: LeaseSigningClientProps) {
  const [method, setMethod] = useState<SignatureMethod>("type");
  const [typedName, setTypedName] = useState(participantName);
  const [selectedFont, setSelectedFont] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValid =
    agreed &&
    ((method === "type" && typedName.trim().length > 0) ||
      (method === "draw" && sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) ||
      (method === "upload" && uploadedImage));

  const clearDrawing = useCallback(() => {
    sigCanvasRef.current?.clear();
  }, []);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setUploadedImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!isValid || submitting) return;

    setSubmitting(true);
    try {
      let signatureImageUrl: string | undefined;

      if (method === "draw" && sigCanvasRef.current) {
        signatureImageUrl = sigCanvasRef.current.toDataURL("image/png");
      } else if (method === "upload" && uploadedImage) {
        signatureImageUrl = uploadedImage;
      } else if (method === "type") {
        // Generate a typed signature image via canvas
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 80;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, 400, 80);
          ctx.fillStyle = "#1a1a1a";
          ctx.font = SIGNATURE_FONTS[selectedFont].style;
          ctx.fillText(typedName, 20, 55);
          signatureImageUrl = canvas.toDataURL("image/png");
        }
      }

      const result = await submitSignature(
        token,
        {
          method,
          signedName: method === "type" ? typedName : participantName,
          signatureImageUrl,
        },
        {
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        }
      );

      if (result.success) {
        setSigned(true);
        setAllDone(result.allSigned ?? false);
        toast.success(result.message ?? "Signature submitted successfully");
      } else {
        toast.error(result.error ?? "Failed to submit signature");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  // Success state
  if (signed) {
    return (
      <div className="space-y-6">
        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient-sm p-8 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-tertiary-fixed/20 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl text-on-tertiary-fixed-variant">
              task_alt
            </span>
          </div>
          <h2 className="font-headline text-xl font-bold text-on-surface">
            {allDone ? "Lease Fully Signed" : "Signature Recorded"}
          </h2>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto">
            {allDone
              ? "All parties have signed. The lease is now fully executed. A copy will be emailed to all parties."
              : "Your signature has been recorded. The other parties will be notified to sign."}
          </p>
        </div>
        <SigningProgress participants={participants} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lease Document (read-only) */}
      <section className="bg-surface-container-lowest rounded-2xl shadow-ambient-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-lg font-bold text-on-surface">
            Lease Document
          </h2>
          <span className="text-xs font-semibold text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full">
            Read Only
          </span>
        </div>
        <div className="bg-white rounded-xl p-6 space-y-6 max-h-[60vh] overflow-y-auto"
          style={{ border: "1px solid var(--outline-variant, #c5c6cf)" }}>
          <div className="text-center pb-4" style={{ borderBottom: "1px solid #e0e0e0" }}>
            <h3 className="text-lg font-bold tracking-wide">
              RESIDENTIAL TENANCY AGREEMENT
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Province of Alberta &bull; {documentContent.templateVersion}
            </p>
          </div>
          {documentContent.sections.map((section) => (
            <div key={section.id}>
              <h4 className="text-sm font-bold mb-2">{section.title}</h4>
              {section.clauses.map((clause) => (
                <p key={clause.id} className="text-xs leading-relaxed text-gray-700 mb-2">
                  {clause.text}
                </p>
              ))}
            </div>
          ))}
          {documentContent.additionalTerms.length > 0 && (
            <div>
              <h4 className="text-sm font-bold mb-2">Additional Terms</h4>
              {documentContent.additionalTerms.map((clause, i) => (
                <p key={clause.id} className="text-xs leading-relaxed text-gray-700 mb-2">
                  {i + 1}. {clause.text}
                </p>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Signing Progress */}
      <SigningProgress participants={participants} />

      {/* Signature Method Selection */}
      <section className="bg-surface-container-lowest rounded-2xl shadow-ambient-sm p-6 sm:p-8 space-y-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">
          Electronic Signature
        </h2>

        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">person</span>
          <span>
            Signing as{" "}
            <strong className="text-on-surface">{participantName}</strong>
            {" "}({participantRole})
          </span>
        </div>

        {/* Method Tabs */}
        <div className="flex gap-2">
          {(
            [
              { key: "type", icon: "keyboard", label: "Type" },
              { key: "draw", icon: "draw", label: "Draw" },
              { key: "upload", icon: "upload", label: "Upload" },
            ] as const
          ).map((m) => (
            <button
              key={m.key}
              onClick={() => setMethod(m.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                method === m.key
                  ? "bg-primary text-on-primary shadow-ambient-sm"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {m.icon}
              </span>
              {m.label}
            </button>
          ))}
        </div>

        {/* Type Signature */}
        {method === "type" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Full Legal Name
              </label>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type your full name"
                className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface-variant">
                Font Style
              </label>
              <div className="flex gap-2">
                {SIGNATURE_FONTS.map((font, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedFont(i)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      selectedFont === i
                        ? "bg-primary-fixed/20 ring-2 ring-primary/30"
                        : "bg-surface-container-low hover:bg-surface-container-high"
                    }`}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>
            {typedName.trim() && (
              <div className="bg-white rounded-xl p-6 text-center" style={{ border: "1px solid #e0e0e0" }}>
                <p
                  className="text-on-surface"
                  style={{
                    fontStyle: "italic",
                    fontSize: selectedFont === 1 ? "28px" : selectedFont === 2 ? "34px" : "32px",
                    fontFamily:
                      selectedFont === 0
                        ? "'Segoe Script', 'Brush Script MT', cursive"
                        : selectedFont === 1
                        ? "Georgia, 'Times New Roman', serif"
                        : "'Comic Sans MS', cursive",
                  }}
                >
                  {typedName}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Draw Signature */}
        {method === "draw" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-on-surface-variant">
                Draw Your Signature
              </label>
              <button
                onClick={clearDrawing}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Clear
              </button>
            </div>
            <div
              className="bg-white rounded-xl overflow-hidden"
              style={{ border: "2px dashed var(--outline-variant, #c5c6cf)" }}
            >
              <SignatureCanvas
                ref={sigCanvasRef}
                canvasProps={{
                  width: 500,
                  height: 160,
                  className: "w-full h-40",
                  style: { width: "100%", height: "160px" },
                }}
                penColor="#1a1a1a"
                backgroundColor="white"
              />
            </div>
            <p className="text-xs text-on-surface-variant text-center">
              Use your mouse or finger to draw your signature above
            </p>
          </div>
        )}

        {/* Upload Signature */}
        {method === "upload" && (
          <div className="space-y-3">
            <label className="text-sm font-semibold text-on-surface-variant">
              Upload Signature Image
            </label>
            {uploadedImage ? (
              <div className="space-y-3">
                <div
                  className="bg-white rounded-xl p-4 flex items-center justify-center"
                  style={{ border: "1px solid #e0e0e0" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedImage}
                    alt="Uploaded signature"
                    className="max-h-24 object-contain"
                  />
                </div>
                <button
                  onClick={() => {
                    setUploadedImage(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-xs font-semibold text-error hover:underline"
                >
                  Remove & re-upload
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 rounded-xl bg-surface-container-low flex flex-col items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
                style={{ border: "2px dashed var(--outline-variant, #c5c6cf)" }}
              >
                <span className="material-symbols-outlined text-3xl text-outline">
                  cloud_upload
                </span>
                <p className="text-sm text-on-surface-variant">
                  Click to upload your signature image
                </p>
                <p className="text-xs text-outline">PNG, JPG — max 2MB</p>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">schedule</span>
          <span>
            Signing timestamp:{" "}
            {new Date().toLocaleString("en-CA", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </span>
        </div>

        {/* Agreement Checkbox */}
        <div className="flex items-start gap-3 bg-surface-container-low rounded-xl px-5 py-4">
          <input
            type="checkbox"
            id="agree-terms"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded accent-primary flex-shrink-0"
          />
          <label
            htmlFor="agree-terms"
            className="text-sm text-on-surface leading-relaxed cursor-pointer"
          >
            I have read and agree to all terms of this lease agreement. I
            understand that this electronic signature is legally binding and
            constitutes my acceptance of the lease terms as presented above.
          </label>
        </div>

        {/* Sign Button */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="w-full py-3.5 rounded-xl bg-primary text-on-primary font-headline font-bold text-base shadow-ambient-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="material-symbols-outlined text-base animate-spin">
                progress_activity
              </span>
              Submitting...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">
                draw
              </span>
              Sign &amp; Submit
            </>
          )}
        </button>

        {/* Legal Disclaimer */}
        <p className="text-xs text-on-surface-variant leading-relaxed text-center">
          By clicking &quot;Sign &amp; Submit,&quot; you consent to use an
          electronic signature in accordance with the{" "}
          <span className="font-semibold">
            Electronic Transactions Act (SA 2001, c. E-5.5)
          </span>{" "}
          and the{" "}
          <span className="font-semibold">
            Personal Information Protection Act (PIPA)
          </span>
          . This electronic signature carries the same legal weight as a
          handwritten signature. A copy of the signed lease will be provided to
          all parties.
        </p>

        {expiresAt && (
          <p className="text-xs text-on-surface-variant text-center">
            <span className="material-symbols-outlined text-xs align-middle mr-1">
              timer
            </span>
            This signing link expires on{" "}
            {new Date(expiresAt).toLocaleDateString("en-CA", {
              dateStyle: "long",
            })}
          </p>
        )}
      </section>
    </div>
  );
}

/* ─── Signing Progress Sub-component ─────────────────────────────────────── */

function SigningProgress({ participants }: { participants: Participant[] }) {
  return (
    <section className="bg-surface-container-lowest rounded-2xl shadow-ambient-sm p-6 sm:p-8 space-y-4">
      <h3 className="font-headline text-base font-bold text-on-surface flex items-center gap-2">
        <span className="material-symbols-outlined text-lg text-primary">
          fact_check
        </span>
        Signing Progress
      </h3>
      <div className="space-y-3">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container-low"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                p.status === "signed"
                  ? "bg-tertiary-fixed/20"
                  : "bg-surface-container-highest"
              }`}
            >
              <span
                className={`material-symbols-outlined text-base ${
                  p.status === "signed"
                    ? "text-on-tertiary-fixed-variant"
                    : "text-outline"
                }`}
              >
                {p.status === "signed" ? "check_circle" : "pending"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-on-surface">
                {p.signerName}
              </p>
              <p className="text-xs text-on-surface-variant capitalize">
                {p.signerRole}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              {p.status === "signed" && p.signedAt ? (
                <p className="text-xs text-on-tertiary-fixed-variant font-semibold">
                  Signed{" "}
                  {new Date(p.signedAt).toLocaleDateString("en-CA", {
                    dateStyle: "short",
                  })}
                </p>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-container-highest text-on-surface-variant">
                  Pending
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
