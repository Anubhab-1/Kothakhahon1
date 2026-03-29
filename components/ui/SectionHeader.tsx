import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      {eyebrow ? <p className="font-ui text-xs tracking-[0.2em] text-gold">{eyebrow}</p> : null}
      <h2 className="mt-3 text-safe font-title text-4xl text-ivory md:text-5xl">{title}</h2>
      <div
        className={cn(
          "mt-3 h-px w-24 bg-gradient-to-r from-gold/70 to-transparent",
          align === "center" && "mx-auto",
        )}
      />
      {description ? (
        <p className={cn("mt-3 max-w-2xl font-body text-lg text-stone", align === "center" && "mx-auto")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

