import type { Metadata, Viewport } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-headline",
  display: "swap",
});

export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "TenantPorch — Canadian Rental Property Management",
  description:
    "Your front porch to smarter renting. Manage leases, rent, maintenance, and documents for Canadian rental properties.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(dmSans.variable, manrope.variable)}>
      <body className="antialiased" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
