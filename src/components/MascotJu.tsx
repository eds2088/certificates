import { cn } from "@/lib/utils";

interface MascotJuProps {
  className?: string;
  size?: number;
  /** Different poses Ju can show. Lovable can extend this. */
  pose?: "happy" | "wave" | "study";
}

/**
 * Ju — the Estudito mascot. Friendly fox with rounded shapes.
 *
 * NOTE for Lovable: this SVG is intentionally simple so it can be
 * easily replaced with a richer illustration later. Keep the same
 * props API so consumers don't break.
 */
export function MascotJu({ className, size = 120, pose = "happy" }: MascotJuProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={cn("select-none", className)}
      role="img"
      aria-label="Ju, a raposinha mascote do Estudito"
    >
      {/* Soft glow background */}
      <circle cx="100" cy="105" r="78" fill="var(--ju-soft)" opacity="0.6" />

      {/* Ears */}
      <path d="M55 75 Q60 32 88 55 Z" fill="var(--ju)" />
      <path d="M145 75 Q140 32 112 55 Z" fill="var(--ju)" />
      <path d="M62 70 Q66 45 82 60 Z" fill="var(--ju-soft)" />
      <path d="M138 70 Q134 45 118 60 Z" fill="var(--ju-soft)" />

      {/* Head */}
      <ellipse cx="100" cy="110" rx="58" ry="52" fill="var(--ju)" />

      {/* Cheek/chin lighter area */}
      <ellipse cx="100" cy="125" rx="38" ry="32" fill="#FFF8EC" />

      {/* Eyes */}
      {pose === "study" ? (
        <>
          <path d="M78 108 Q84 102 90 108" stroke="#1E1E1E" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M110 108 Q116 102 122 108" stroke="#1E1E1E" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="84" cy="108" rx="4.5" ry="5.5" fill="#1E1E1E" />
          <ellipse cx="116" cy="108" rx="4.5" ry="5.5" fill="#1E1E1E" />
          <circle cx="85.5" cy="106" r="1.5" fill="#FFFFFF" />
          <circle cx="117.5" cy="106" r="1.5" fill="#FFFFFF" />
        </>
      )}

      {/* Cheeks blush */}
      <ellipse cx="74" cy="128" rx="6" ry="3.5" fill="#F4B8B8" opacity="0.6" />
      <ellipse cx="126" cy="128" rx="6" ry="3.5" fill="#F4B8B8" opacity="0.6" />

      {/* Nose + mouth */}
      <ellipse cx="100" cy="128" rx="3.5" ry="2.5" fill="#1E1E1E" />
      <path d="M100 131 Q100 138 94 138" stroke="#1E1E1E" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M100 131 Q100 138 106 138" stroke="#1E1E1E" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Wave hand for "wave" pose */}
      {pose === "wave" && (
        <g>
          <ellipse cx="158" cy="98" rx="9" ry="11" fill="var(--ju)" transform="rotate(-15 158 98)" />
          <ellipse cx="158" cy="100" rx="5" ry="7" fill="#FFF8EC" transform="rotate(-15 158 98)" />
        </g>
      )}

      {/* Tail tip white tuft (peeking) */}
      <path d="M40 138 Q22 152 36 168 Q48 158 50 142 Z" fill="var(--ju)" />
      <path d="M30 156 Q22 160 28 168 Q34 164 34 158 Z" fill="#FFF8EC" />
    </svg>
  );
}
