import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Layers, TrendingUp, Info, Clock } from "lucide-react";
import { aggregateRealisationsByUniteIds, formatAggregationDate } from "@/lib/cdpUnitAggregation";
import { cn } from "@/lib/utils";

interface CDPUnitAggregationProps {
  /** Unités de mesure impliquées dans le calcul de l'indicateur */
  uniteMesureIds?: string[];
  /** Année active du CDP — filtre les contributions PTA */
  year?: number;
  /** Unité d'expression de l'indicateur (affichée à titre indicatif) */
  resultUnit?: string;
  variant?: "compact" | "full";
  className?: string;
}

const fmt = (n: number) => n.toLocaleString("fr-FR");

const perfColor = (rate: number) => {
  if (rate >= 100) return "text-green-600";
  if (rate >= 80) return "text-amber-600";
  return "text-red-600";
};

/**
 * Affichage cohérent — pour un indicateur CDP — des unités de mesure
 * impliquées dans son calcul et de la dernière situation agrégée
 * des réalisations PTA, avec date de la dernière mise à jour utilisée.
 */
const CDPUnitAggregation = ({ uniteMesureIds, year, resultUnit, variant = "full", className }: CDPUnitAggregationProps) => {
  const ids = useMemo(() => uniteMesureIds || [], [uniteMesureIds]);
  const agg = useMemo(() => aggregateRealisationsByUniteIds(ids, year), [ids, year]);

  if (ids.length === 0) {
    if (variant === "compact") return null;
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="p-3 text-[11px] text-muted-foreground italic flex items-center gap-2">
          <Info className="w-3 h-3" />
          Aucune unité de mesure n'est déclarée pour cet indicateur. Renseignez-les dans le référentiel pour activer l'agrégation automatique des réalisations PTA.
        </CardContent>
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-wrap items-center gap-2 text-[11px]", className)}>
        <TooltipProvider delayDuration={150}>
          {agg.units.map((u) => (
            <Tooltip key={u.uniteMesure.id}>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="gap-1 font-normal cursor-help">
                  <Layers className="w-3 h-3" />
                  <span className="font-mono opacity-60">{u.uniteMesure.code}</span>
                  <span className="font-semibold">{fmt(u.totalCurrent)}</span>
                  <span className="text-muted-foreground">/ {fmt(u.totalTarget)}</span>
                  <span className={cn("ml-1 font-semibold", perfColor(u.achievementRate))}>{u.achievementRate}%</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-semibold text-xs">{u.uniteMesure.name}</p>
                {u.uniteMesure.description && (
                  <p className="text-[11px] opacity-90">{u.uniteMesure.description}</p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
        <Badge variant="outline" className="gap-1 font-normal">
          <Clock className="w-3 h-3" /> MAJ : {formatAggregationDate(agg.lastUpdate)}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5 text-primary" />
            Situation agrégée par unité de mesure
            {resultUnit && <Badge variant="outline" className="text-[10px] font-normal">Résultat : {resultUnit}</Badge>}
            {year && <Badge variant="outline" className="text-[10px] font-normal">Année {year}</Badge>}
          </div>
          <Badge variant="outline" className="gap-1 text-[10px] font-medium">
            <Clock className="w-3 h-3" /> Dernière MAJ utilisée : <span className="font-semibold">{formatAggregationDate(agg.lastUpdate)}</span>
          </Badge>
        </div>

        <div className="space-y-2">
          {agg.units.map((u) => (
            <div key={u.uniteMesure.id} className="border rounded">
              <div className="flex items-start justify-between gap-2 px-2 py-1.5 bg-muted/40 border-b">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] flex-wrap">
                    <Badge variant="outline" className="text-[10px] font-mono">{u.uniteMesure.code}</Badge>
                    <span className="font-medium">{u.uniteMesure.name}</span>
                    <Badge variant="secondary" className="text-[9px]">{u.mode === "average" ? "Moyenne" : "Somme"}</Badge>
                  </div>
                  {u.uniteMesure.description && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{u.uniteMesure.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px] shrink-0">
                  <span><span className="text-muted-foreground">Réalisé : </span><span className="font-semibold">{fmt(u.totalCurrent)}</span></span>
                  <span><span className="text-muted-foreground">Cible : </span>{fmt(u.totalTarget)}</span>
                  <span className={cn("font-bold", perfColor(u.achievementRate))}>{u.achievementRate}%</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatAggregationDate(u.lastUpdate)}
                  </span>
                </div>
              </div>
              {u.contributors.length === 0 ? (
                <div className="p-2 text-[10px] text-muted-foreground italic">Aucune contribution PTA pour cette unité.</div>
              ) : (
                <div className="max-h-32 overflow-y-auto">
                  <table className="w-full text-[10px]">
                    <thead className="bg-muted/20 sticky top-0">
                      <tr>
                        <th className="text-left py-1 px-2 font-medium text-muted-foreground">Contribution PTA</th>
                        <th className="text-left py-1 px-2 font-medium text-muted-foreground">Projet</th>
                        <th className="text-right py-1 px-2 font-medium text-muted-foreground">Réalisé</th>
                        <th className="text-right py-1 px-2 font-medium text-muted-foreground">Cible</th>
                        <th className="text-center py-1 px-2 font-medium text-muted-foreground">MAJ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {u.contributors.map((c, i) => (
                        <tr key={i} className="border-t">
                          <td className="py-1 px-2">{c.name}</td>
                          <td className="py-1 px-2 text-muted-foreground truncate max-w-[140px]">{c.projectName}</td>
                          <td className="py-1 px-2 text-right font-medium">{fmt(c.current)}</td>
                          <td className="py-1 px-2 text-right text-muted-foreground">{fmt(c.target)}</td>
                          <td className="py-1 px-2 text-center text-muted-foreground">{formatAggregationDate(c.updatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-[9px] text-muted-foreground">
          Agrégation automatique depuis les livrables PTA partageant les unités de mesure déclarées sur cet indicateur dans le référentiel CDP.
        </p>
      </CardContent>
    </Card>
  );
};

export default CDPUnitAggregation;
