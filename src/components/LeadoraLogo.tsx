import { cn } from "@/lib/utils";

interface LeadoraLogoProps {
  className?: string;
  variant?: "light" | "dark";
}

export function LeadoraLogo({ className, variant = "light" }: LeadoraLogoProps) {
  // Warm amber rounded tile with a dark inner dot — pin-drop motif.
  const tile = "#FF7A33";
  const dot = "#0A0E1A";
  const wordmark = variant === "dark" ? "#0A0E1A" : "#F5F6F8";

  return (
    <svg
      viewBox="0 0 170 36"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-auto", className)}
      role="img"
      aria-label="leadora"
    >
      <rect x="0" y="2" width="32" height="32" rx="8" fill={tile} />
      <circle cx="16" cy="18" r="4.5" fill={dot} />
      <text
        x="42"
        y="25"
        fontFamily="Space Grotesk, Inter, sans-serif"
        fontSize="20"
        fontWeight="700"
        fill={wordmark}
        letterSpacing="-0.5"
      >
        leadora
      </text>
    </svg>
  );
}
