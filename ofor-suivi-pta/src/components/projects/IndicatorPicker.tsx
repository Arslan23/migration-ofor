import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Target, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Activity,
  Indicator,
  ActivityNature,
  ACTIVITY_NATURE_LABELS,
  getDeliverableCode,
} from "@/types/project";
import { REFERENTIEL_INDICATEURS, ReferentielIndicator } from "@/data/referentielIndicateurs";

interface IndicatorPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: Activity[];
  existingIndicators: Indicator[];
  onConfirm: (indicators: Omit<Indicator, "id">[]) => void;
}

/**
 * Sélecteur d'indicateurs depuis le référentiel.
 * Propose en priorité les indicateurs pertinents selon les natures d'activité
 * et les unités de mesure des livrables du projet.
 */
const IndicatorPicker = ({
  open,
  onOpenChange,
  activities,
  existingIndicators,
  onConfirm,
}: IndicatorPickerProps) => {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Codes déjà utilisés dans le projet (sur la base du code référentiel)
  const usedCodes = useMemo(
    () => new Set(existingIndicators.map((i) => i.code)),
    [existingIndicators],
  );

  // Natures et unités de mesure exploitées par les activités du projet
  const { projectNatures, projectUnitIds } = useMemo(() => {
    const natures = new Set<ActivityNature>();
    const units = new Set<string>();
    activities.forEach((act) => {
      if (act.nature) natures.add(act.nature);
      act.deliverables?.forEach((d) => {
        if (d.uniteMesureId) units.add(d.uniteMesureId);
      });
    });
    return { projectNatures: natures, projectUnitIds: units };
  }, [activities]);

  // Score de pertinence: 2 pts par unité partagée, 1 pt par nature partagée
  const scoreOf = (ind: ReferentielIndicator): number => {
    let score = 0;
    ind.uniteMesureIds.forEach((u) => {
      if (projectUnitIds.has(u)) score += 2;
    });
    ind.natures?.forEach((n) => {
      if (projectNatures.has(n)) score += 1;
    });
    return score;
  };

  const { suggested, others } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = REFERENTIEL_INDICATEURS.filter((ind) => {
      if (q === "") return true;
      return (
        ind.code.toLowerCase().includes(q) ||
        ind.name.toLowerCase().includes(q) ||
        ind.description?.toLowerCase().includes(q)
      );
    });
    const withScore = matches.map((ind) => ({ ind, score: scoreOf(ind) }));
    const sug = withScore
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.ind);
    const oth = withScore
      .filter((x) => x.score === 0)
      .map((x) => x.ind)
      .sort((a, b) => a.code.localeCompare(b.code));
    return { suggested: sug, others: oth };
  }, [search, projectNatures, projectUnitIds]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleConfirm = () => {
    if (selected.size === 0) {
      toast.error("Sélectionnez au moins un indicateur");
      return;
    }
    const toAdd: Omit<Indicator, "id">[] = [];
    REFERENTIEL_INDICATEURS.filter((i) => selected.has(i.id)).forEach((ind) => {
      if (usedCodes.has(ind.code)) return; // skip déjà ajouté
      toAdd.push({
        code: ind.code,
        name: ind.name,
        type: ind.type,
        unit: ind.unitResultat || "unité",
        targetValue: 0,
        currentValue: 0,
        baselineValue: 0,
        description: ind.description,
      });
    });
    if (toAdd.length === 0) {
      toast.info("Tous les indicateurs sélectionnés sont déjà présents");
      onOpenChange(false);
      return;
    }
    onConfirm(toAdd);
    toast.success(`${toAdd.length} indicateur(s) ajouté(s)`);
    setSelected(new Set());
    setSearch("");
    onOpenChange(false);
  };

  const renderRow = (ind: ReferentielIndicator, isSuggested: boolean) => {
    const isUsed = usedCodes.has(ind.code);
    const isChecked = selected.has(ind.id);
    return (
      <div
        key={ind.id}
        className={`flex items-start gap-2 p-2 rounded-md border transition-colors ${
          isUsed
            ? "bg-muted/40 opacity-60"
            : isChecked
              ? "bg-primary/5 border-primary"
              : "hover:bg-muted/50 cursor-pointer"
        }`}
        onClick={() => !isUsed && toggle(ind.id)}
      >
        <Checkbox
          checked={isChecked}
          disabled={isUsed}
          onCheckedChange={() => toggle(ind.id)}
          className="mt-0.5"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground">{ind.code}</span>
            <span className="font-medium text-sm">{ind.name}</span>
            <Badge variant={ind.type === "quantitatif" ? "default" : "secondary"} className="text-[10px] py-0 h-4">
              {ind.type}
            </Badge>
            {isSuggested && (
              <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] py-0 h-4 gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Suggéré
              </Badge>
            )}
            {isUsed && (
              <Badge variant="outline" className="text-[10px] py-0 h-4">Déjà ajouté</Badge>
            )}
          </div>
          {ind.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ind.description}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {ind.natures?.slice(0, 3).map((n) => (
              <Badge key={n} variant="outline" className="text-[10px] py-0 h-4">
                {ACTIVITY_NATURE_LABELS[n]}
              </Badge>
            ))}
            {ind.unitResultat && (
              <span className="text-[10px] text-muted-foreground">→ {ind.unitResultat}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const hasContext = projectNatures.size > 0 || projectUnitIds.size > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Sélectionner des indicateurs depuis le référentiel
          </DialogTitle>
          <DialogDescription>
            {hasContext
              ? "Les indicateurs marqués « Suggérés » correspondent aux natures d'activité et unités de mesure de vos livrables."
              : "Ajoutez d'abord des activités et livrables au projet pour obtenir des suggestions ciblées."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par code, nom ou description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {hasContext && (
            <Button
              type="button"
              variant={showAll ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? "Voir suggérés" : "Voir tous"}
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 -mx-1 px-1">
          <div className="space-y-3 pb-2">
            {suggested.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">
                  Suggérés pour ce projet ({suggested.length})
                </p>
                <div className="space-y-1.5">
                  {suggested.map((ind) => renderRow(ind, true))}
                </div>
              </div>
            )}
            {(showAll || !hasContext || suggested.length === 0) && others.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">
                  {hasContext ? "Autres indicateurs" : "Tous les indicateurs"} ({others.length})
                </p>
                <div className="space-y-1.5">
                  {others.map((ind) => renderRow(ind, false))}
                </div>
              </div>
            )}
            {suggested.length === 0 && others.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Aucun indicateur ne correspond à votre recherche
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-3 flex-row sm:justify-between items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selected.size} indicateur(s) sélectionné(s)
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={selected.size === 0}>
              Ajouter au projet
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IndicatorPicker;
