import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  descricao_visual: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-24 w-24",
  md: "h-40 w-40",
  lg: "h-52 w-52",
};

export function PlaceholderIlustracao({ descricao_visual, size = "md", className }: Props) {
  return (
    <figure className={cn("flex flex-col items-center gap-2", className)}>
      <div
        role="img"
        aria-label={descricao_visual}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground/50",
          SIZE_CLASS[size],
        )}
      >
        <ImageIcon size={size === "sm" ? 22 : size === "md" ? 32 : 40} aria-hidden="true" />
      </div>
      {descricao_visual && (
        <figcaption className="max-w-xs text-center text-[12px] italic" style={{ color: "#777" }}>
          {descricao_visual}
        </figcaption>
      )}
    </figure>
  );
}
