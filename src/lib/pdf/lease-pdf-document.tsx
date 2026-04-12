import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { LeaseDocumentContent } from "@/lib/lease-templates/alberta";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
    color: "#1a1a1a",
  },
  header: {
    textAlign: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    borderBottomStyle: "solid",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: "#666",
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#1a1a1a",
  },
  clause: {
    marginBottom: 8,
    fontSize: 10,
    lineHeight: 1.6,
  },
  signatureSection: {
    marginTop: 40,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    borderTopStyle: "solid",
  },
  signatureTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 20,
  },
  signatureGrid: {
    flexDirection: "row",
    gap: 40,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: "Helvetica-Bold",
    marginBottom: 30,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    borderBottomStyle: "solid",
    height: 24,
    marginBottom: 4,
  },
  signatureCaption: {
    fontSize: 8,
    color: "#666",
  },
  signatureNameLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    borderBottomStyle: "solid",
    height: 16,
    marginBottom: 4,
    marginTop: 12,
  },
  footer: {
    marginTop: 30,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    borderTopStyle: "solid",
    textAlign: "center",
    fontSize: 7,
    color: "#999",
  },
  watermark: {
    position: "absolute",
    top: "35%",
    left: "10%",
    fontSize: 80,
    color: "#e0e0e0",
    opacity: 0.3,
    transform: "rotate(-45deg)",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 10,
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    right: 50,
    fontSize: 8,
    color: "#999",
  },
  brandFooter: {
    position: "absolute",
    bottom: 20,
    left: 50,
    fontSize: 7,
    color: "#bbb",
  },
});

interface LeasePDFDocumentProps {
  content: LeaseDocumentContent;
  propertyAddress: string;
  isDraft: boolean;
}

export function LeasePDFDocument({
  content,
  propertyAddress,
  isDraft,
}: LeasePDFDocumentProps) {
  return (
    <Document
      title={`Lease Agreement — ${propertyAddress}`}
      author="TenantPorch"
      subject="Residential Tenancy Agreement"
    >
      <Page size="LETTER" style={styles.page}>
        {isDraft && <Text style={styles.watermark}>DRAFT</Text>}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>RESIDENTIAL TENANCY AGREEMENT</Text>
          <Text style={styles.subtitle}>
            Province of Alberta &bull; {content.templateVersion}
          </Text>
        </View>

        {/* Sections */}
        {content.sections.map((section) => (
          <View key={section.id} wrap={false}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.clauses.map((clause) => (
              <Text key={clause.id} style={styles.clause}>
                {clause.text}
              </Text>
            ))}
          </View>
        ))}

        {/* Additional Terms */}
        {content.additionalTerms.length > 0 && (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>13. Additional Terms</Text>
            {content.additionalTerms.map((clause, i) => (
              <Text key={clause.id} style={styles.clause}>
                {i + 1}. {clause.text}
              </Text>
            ))}
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signatureSection} wrap={false}>
          <Text style={styles.signatureTitle}>Signatures</Text>
          <View style={styles.signatureGrid}>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLabel}>Landlord</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureCaption}>Signature</Text>
              <View style={styles.signatureNameLine} />
              <Text style={styles.signatureCaption}>
                Printed Name & Date
              </Text>
            </View>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLabel}>Tenant</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureCaption}>Signature</Text>
              <View style={styles.signatureNameLine} />
              <Text style={styles.signatureCaption}>
                Printed Name & Date
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Generated by TenantPorch &bull; Alberta Standard Residential
            Tenancy Agreement &bull; {content.templateVersion}
          </Text>
        </View>

        <Text style={styles.brandFooter}>TenantPorch</Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}
