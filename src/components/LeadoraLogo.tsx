import { cn } from "@/lib/utils";

interface LeadoraLogoProps {
  className?: string;
  variant?: "light" | "dark";
}

export function LeadoraLogo({ className, variant = "light" }: LeadoraLogoProps) {
  const isDark = variant === "dark";
  const tile = isDark ? "#ffffff" : "#1a1a2e";
  const tileFg = isDark ? "#1a1a2e" : "#ffffff";
  const wordmark = isDark ? "#ffffff" : "#1a1a2e";
  const accent = "#4f8ef7";

  return (
    <svg
      viewBox="0 0 160 36"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-9 w-auto", className)}
      role="img"
      aria-label="Leadora"
    >
      <rect x="0" y="0" width="36" height="36" rx="8" fill={tile} />
      <rect x="10" y="8" width="5" height="20" rx="2" fill={tileFg} />
      <rect x="10" y="22" width="16" height="5" rx="2" fill={tileFg} />
      <rect x="21" y="8" width="5" height="14" rx="2" fill={accent} />
      <text x="46" y="25" fontFamily="Georgia, serif" fontSize="22" fontWeight="400" fill={wordmark} letterSpacing="1">Leadora</text>
    </svg>
  );
}
