import Image from "next/image";

type LogoProps = {
  /** Height in pixels — width auto-scales */
  height?: number;
  /** Which logo set: "tenant" (no subtitle) or "landlord" (with subtitle). Default: "tenant" */
  type?: "tenant" | "landlord";
  /** Background color the logo sits on: "light" or "dark". Default: "light" */
  background?: "light" | "dark";
  className?: string;
};

const LOGO_MAP: Record<string, string> = {
  "landlord-darkbg": "/branding/logo-landlord-darkbg.svg",
  "landlord-lightbg": "/branding/logo-landlord-lightbg.svg",
  "tenant-darkbg": "/branding/logo-tenant-darkbg.svg",
  "tenant-lightbg": "/branding/logo-tenant-lightbg.png",
};

export function Logo({
  height = 32,
  type = "tenant",
  background = "light",
  className = "",
}: LogoProps) {
  const bgSuffix = background === "dark" ? "darkbg" : "lightbg";
  const src = LOGO_MAP[`${type}-${bgSuffix}`];

  return (
    <Image
      src={src}
      alt={type === "landlord" ? "TenantPorch Landlord" : "TenantPorch"}
      width={Math.round(height * 4)}
      height={height}
      className={`object-contain ${className}`}
      priority
    />
  );
}
