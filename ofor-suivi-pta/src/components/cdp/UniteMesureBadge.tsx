import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getUniteMesureById } from "@/types/project";
import { cn } from "@/lib/utils";

interface UniteMesureBadgeProps {
  uniteId: string;
  /** "code" → only code; "code-name" → code + name; "full" → code + name + description below */
  variant?: "code" | "code-name" | "full";
  className?: string;
}

/**
 * Affichage cohérent d'une unité de mesure avec sa description.
 * - variant="code" / "code-name": description en tooltip (économie d'espace dans tableaux)
 * - variant="full": description visible sous le nom (vues détaillées)
 */
const UniteMesureBadge = ({ uniteId, variant = "code-name", className }: UniteMesureBadgeProps) => {
  const u = getUniteMesureById(uniteId);
  if (!u) return null;

  if (variant === "full") {
    return (
      <div className={cn("border rounded px-2 py-1 bg-muted/30", className)}>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-[10px] text-muted-foreground">{u.code}</span>
          <span className="font-medium">{u.name}</span>
        </div>
        {u.description && (
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{u.description}</p>
        )}
      </div>
    );
  }

  const badge = (
    <Badge variant="outline" className={cn("text-[10px] gap-1 font-normal cursor-help", className)}>
      <span className="font-mono opacity-60">{u.code}</span>
      {variant === "code-name" && <span>{u.name}</span>}
    </Badge>
  );

  if (!u.description) return badge;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-semibold text-xs">{u.name}</p>
          <p className="text-[11px] opacity-90">{u.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default UniteMesureBadge;
