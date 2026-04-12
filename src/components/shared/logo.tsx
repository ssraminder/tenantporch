import Image from "next/image";

const LOGO_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/branding/main_logo.svg`;

type LogoProps = {
  /** Height in pixels — width auto-scales */
  height?: number;
  /** "light" for dark backgrounds, "dark" for light backgrounds */
  variant?: "dark" | "light";
  className?: string;
};

export function Logo({ height = 32, variant = "dark", className = "" }: LogoProps) {
  return (
    <Image
      src={LOGO_URL}
      alt="TenantPorch"
      width={Math.round(height * 4)}
      height={height}
      className={`object-contain ${variant === "light" ? "brightness-0 invert" : ""} ${className}`}
      priority
      unoptimized
    />
  );
}
