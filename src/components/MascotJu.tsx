import { cn } from "@/lib/utils";
import juHero from "@/assets/mascot/ju-hero.png";
import juStudying from "@/assets/mascot/ju-studying.png";
import juCelebrating from "@/assets/mascot/ju-celebrating.png";
import juThinking from "@/assets/mascot/ju-thinking.png";

type Pose = "happy" | "wave" | "study" | "celebrate" | "thinking";

const POSE_MAP: Record<Pose, string> = {
  happy: juHero,
  wave: juHero,
  study: juStudying,
  celebrate: juCelebrating,
  thinking: juThinking,
};

interface MascotJuProps {
  className?: string;
  size?: number;
  /** Different poses Ju can show. */
  pose?: Pose;
}

export function MascotJu({ className, size = 120, pose = "happy" }: MascotJuProps) {
  const src = POSE_MAP[pose] ?? juHero;
  const isHero = pose === "happy" || pose === "wave";
  return (
    <img
      src={src}
      width={size}
      height={size}
      data-pose={pose}
      alt="Ju, a raposinha mascote do Estudito"
      className={cn("select-none object-contain", className)}
      draggable={false}
      loading={isHero ? "eager" : "lazy"}
    />
  );
}
