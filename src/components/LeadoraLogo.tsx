import { cn } from "@/lib/utils";

interface LeadoraLogoProps {
  className?: string;
  variant?: "light" | "dark";
}

export function LeadoraLogo({ className, variant = "light" }: LeadoraLogoProps) {
  // "Ping" mark — three concentric amber circles + Leadora wordmark.
  const amber = "#FF7A33";
  const wordmark = variant === "dark" ? "#0A0E1A" : "#F5F6F8";

  return (
    <svg
      viewBox="0 0 210 56"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-10 w-auto", className)}
      role="img"
      aria-label="Leadora"
    >
      <g>
        <circle cx="28" cy="28" r="20" fill="none" stroke={amber} strokeWidth="3" opacity="0.35" />
        <circle cx="28" cy="28" r="13" fill="none" stroke={amber} strokeWidth="3" opacity="0.65" />
        <circle cx="28" cy="28" r="5" fill={amber} />
      </g>
      <text
        x="62"
        y="37"
        fontFamily="Space Grotesk, Inter, sans-serif"
        fontSize="26"
        fontWeight="700"
        fill={wordmark}
        letterSpacing="-0.5"
      >
        Leadora
      </text>
    </svg>
  );
}
