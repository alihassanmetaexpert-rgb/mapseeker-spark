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
  const subtitle = isDark ? "#cbd5e1" : "#888888";
  const accent = "#4f8ef7";

  return (
    <svg
      viewBox="180 60 360 110"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-10 w-auto", className)}
      role="img"
      aria-label="Leadora"
    >
      <rect x="180" y="70" width="80" height="80" rx="18" fill={tile} />
      <rect x="198" y="88" width="12" height="44" rx="3" fill={tileFg} />
      <rect x="198" y="120" width="36" height="12" rx="3" fill={tileFg} />
      <rect x="226" y="104" width="12" height="28" rx="3" fill={accent} />
      <text x="278" y="122" fontFamily="Georgia, serif" fontSize="42" fontWeight="400" fill={wordmark} letterSpacing="2">Leadora</text>
      <text x="279" y="143" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="400" fill={subtitle} letterSpacing="6">LEAD INTELLIGENCE</text>
      <line x1="278" y1="152" x2="530" y2="152" stroke={accent} strokeWidth="1.5" />
    </svg>
  );
}