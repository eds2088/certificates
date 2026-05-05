import { cn } from "@/lib/utils";
import juImage from "@/assets/mascot-ju.png";

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
    <img
      src={juImage}
      width={size}
      height={size}
      data-pose={pose}
      alt="Ju, a raposinha mascote do Estudito"
      className={cn("select-none object-contain", className)}
      draggable={false}
    />
  );
}
