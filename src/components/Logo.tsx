import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  withIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { text: "text-lg", icon: 22 },
  md: { text: "text-2xl", icon: 30 },
  lg: { text: "text-4xl", icon: 44 },
};

export function Logo({ className, withIcon = true, size = "md" }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {withIcon && (
        <svg
          viewBox="0 0 64 64"
          width={s.icon}
          height={s.icon}
          aria-hidden="true"
          className="shrink-0"
        >
          <rect width="64" height="64" rx="16" fill="var(--primary)" />
          {/* Mini fox face */}
          <path d="M16 22 L20 12 L28 18 Z" fill="var(--ju)" />
          <path d="M48 22 L44 12 L36 18 Z" fill="var(--ju)" />
          <ellipse cx="32" cy="36" rx="18" ry="16" fill="var(--ju)" />
          <ellipse cx="32" cy="42" rx="11" ry="9" fill="#FFF8EC" />
          <circle cx="26" cy="34" r="2.4" fill="#1E1E1E" />
          <circle cx="38" cy="34" r="2.4" fill="#1E1E1E" />
          <ellipse cx="32" cy="42" rx="2" ry="1.4" fill="#1E1E1E" />
        </svg>
      )}
      <span className={cn("font-display font-bold tracking-tight text-primary", s.text)}>
        Estudito
      </span>
    </div>
  );
}
