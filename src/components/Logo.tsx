import { cn } from "@/lib/utils";
import logoImage from "@/assets/brand/estudito-logo.png";

interface LogoProps {
  className?: string;
  withIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

const heightMap = {
  sm: 24,
  md: 36,
  lg: 56,
};

const textSizeMap = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
};

export function Logo({ className, withIcon = true, size = "md" }: LogoProps) {
  if (withIcon) {
    const h = heightMap[size];
    return (
      <img
        src={logoImage}
        alt="Estudito"
        loading="eager"
        height={h}
        style={{ height: h, width: "auto" }}
        className={cn("inline-block select-none", className)}
        draggable={false}
      />
    );
  }

  return (
    <span
      className={cn(
        "font-display font-bold tracking-tight text-primary",
        textSizeMap[size],
        className
      )}
    >
      Estudito
    </span>
  );
}
