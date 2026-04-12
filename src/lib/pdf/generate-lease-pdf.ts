import { pdf, renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { LeasePDFDocument } from "./lease-pdf-document";
import type { SignatureInfo } from "./lease-pdf-document";
import type { LeaseDocumentContent } from "@/lib/lease-templates/alberta";

export type { SignatureInfo };

/**
 * Generate and download a lease PDF on the client side.
 */
export async function downloadLeasePDF(
  content: LeaseDocumentContent,
  propertyAddress: string,
  isDraft: boolean
) {
  const doc = createElement(LeasePDFDocument, {
    content,
    propertyAddress,
    isDraft,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(doc as any).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Lease_Agreement_${isDraft ? "DRAFT_" : ""}${propertyAddress.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a signed lease PDF as a Buffer (server-side).
 */
export async function generateLeaseBuffer(
  content: LeaseDocumentContent,
  propertyAddress: string,
  signatures: SignatureInfo[]
): Promise<Buffer> {
  const doc = createElement(LeasePDFDocument, {
    content,
    propertyAddress,
    isDraft: false,
    signatures,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(doc as any);
}
