import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Properties", href: "#features" },
    { label: "Compliance Hub", href: "#features" },
    { label: "Rent Ledger", href: "#features" },
    { label: "Pricing", href: "/pricing" },
  ],
  Compliance: [
    { label: "Ontario LTB", href: "#" },
    { label: "BC RTB", href: "#" },
    { label: "Alberta SA", href: "#" },
    { label: "Privacy Policy", href: "#" },
  ],
  Connect: [
    { label: "LinkedIn", href: "#" },
    { label: "Support Center", href: "#" },
    { label: "Contact Us", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-primary text-inverse-primary py-12 md:py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12">
        <div className="col-span-2 md:col-span-1 space-y-4">
          <div className="text-2xl font-headline font-extrabold italic text-on-primary">
            TenantPorch
          </div>
          <p className="text-sm leading-relaxed opacity-70 text-inverse-primary">
            Elevating property management for the modern Canadian landlord.
            Structured serenity for your portfolio.
          </p>
        </div>

        {Object.entries(footerLinks).map(([heading, links]) => (
          <div key={heading}>
            <h4 className="text-on-primary font-bold mb-5 md:mb-6">
              {heading}
            </h4>
            <ul className="space-y-3 md:space-y-4 text-sm">
              {links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-secondary transition-colors opacity-70 hover:opacity-100"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto pt-12 md:pt-16 mt-12 md:mt-16 border-t border-on-primary/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs opacity-50">
        <p>&copy; {new Date().getFullYear()} TenantPorch. All rights reserved.</p>
        <div className="flex gap-6 md:gap-8">
          <a href="#">Terms of Service</a>
          <a href="#">Security</a>
          <a href="#">Accessibility</a>
        </div>
      </div>
    </footer>
  );
}
