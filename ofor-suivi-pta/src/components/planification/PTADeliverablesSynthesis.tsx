import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Package, Search, Eye, Briefcase, Settings2 } from "lucide-react";
import { PTAActivity } from "@/types/pta";
import { useUnites } from "@/contexts/UnitesContext";
import { cn } from "@/lib/utils";

interface Props {
  activities: PTAActivity[];
  year: number;
}

interface AggregatedDeliverable {
  unit: string;
  description: string;
  totalTarget: number;
  totalT1: number;
  totalT2: number;
  totalT3: number;
  totalT4: number;
  contributions: Array<{
    activityId: string;
    activityName: string;
    project: string;
    projectId?: string;
    operationName?: string;
    operationId?: string;
    serviceResponsableId?: string;
    target: number;
    t1: number;
    t2: number;
    t3: number;
    t4: number;
  }>;
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

const PTADeliverablesSynthesis: React.FC<Props> = ({ activities, year }) => {
  const [search, setSearch] = useState("");
  const [openUnit, setOpenUnit] = useState<AggregatedDeliverable | null>(null);

  const { allUnits } = useUnites();
  const unitDescByName = useMemo(() => {
    const m = new Map<string, string>();
    allUnits.forEach((u) => {
      if (u.name) m.set(u.name.trim().toLowerCase(), u.description || u.name);
    });
    return m;
  }, [allUnits]);

  const aggregated = useMemo<AggregatedDeliverable[]>(() => {
    const map = new Map<string, AggregatedDeliverable>();
    activities.forEach((act) => {
      (act.deliverables || []).forEach((del) => {
        const key = del.unit.trim().toLowerCase();
        if (!key) return;
        if (!map.has(key)) {
          map.set(key, {
            unit: del.unit,
            description: unitDescByName.get(key) || del.unit,
            totalTarget: 0,
            totalT1: 0, totalT2: 0, totalT3: 0, totalT4: 0,
            contributions: [],
          });
        }
        const agg = map.get(key)!;
        const t1 = Number(del.targetT1) || 0;
        const t2 = Number(del.targetT2) || 0;
        const t3 = Number(del.targetT3) || 0;
        const t4 = Number(del.targetT4) || 0;
        const tv = Number(del.targetValue) || 0;
        agg.totalTarget += tv;
        agg.totalT1 += t1;
        agg.totalT2 += t2;
        agg.totalT3 += t3;
        agg.totalT4 += t4;
        agg.contributions.push({
          activityId: act.id,
          activityName: act.name,
          project: act.project,
          projectId: act.projectId || undefined,
          operationName: act.operationName,
          operationId: act.operationId,
          serviceResponsableId: act.serviceResponsableId,
          target: tv,
          t1, t2, t3, t4,
        });
      });
    });
    return Array.from(map.values()).sort((a, b) => b.totalTarget - a.totalTarget);
  }, [activities, unitDescByName]);

  const filtered = useMemo(() => {
    if (!search.trim()) return aggregated;
    const q = search.trim().toLowerCase();
    return aggregated.filter((a) => a.unit.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
  }, [aggregated, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, a) => ({
        target: acc.target + a.totalTarget,
        t1: acc.t1 + a.totalT1,
        t2: acc.t2 + a.totalT2,
        t3: acc.t3 + a.totalT3,
        t4: acc.t4 + a.totalT4,
      }),
      { target: 0, t1: 0, t2: 0, t3: 0, t4: 0 },
    );
  }, [filtered]);

  return (
    <Card>
      <CardHeader className="border-b py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" />
            Synthèse des livrables planifiés — {year}
            <Badge variant="outline" className="ml-2">{filtered.length} unités</Badge>
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Rechercher une unité..."
              className="h-8 pl-7 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2 font-semibold text-muted-foreground text-xs min-w-[200px]">Livrable (unité)</th>
                <th className="text-center p-2 font-semibold text-muted-foreground text-xs w-20">Activités</th>
                <th className="text-right p-2 font-semibold text-muted-foreground text-xs w-28">Cible totale</th>
                <th className="text-right p-2 font-semibold text-muted-foreground text-xs bg-blue-50 dark:bg-blue-950/30 w-20">T1</th>
                <th className="text-right p-2 font-semibold text-muted-foreground text-xs bg-emerald-50 dark:bg-emerald-950/30 w-20">T2</th>
                <th className="text-right p-2 font-semibold text-muted-foreground text-xs bg-amber-50 dark:bg-amber-950/30 w-20">T3</th>
                <th className="text-right p-2 font-semibold text-muted-foreground text-xs bg-purple-50 dark:bg-purple-950/30 w-20">T4</th>
                <th className="w-16 p-2 text-center font-semibold text-muted-foreground text-xs">Détails</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">
                    Aucun livrable planifié pour les filtres sélectionnés
                  </td>
                </tr>
              ) : (
                filtered.map((agg) => {
                  const sumQ = agg.totalT1 + agg.totalT2 + agg.totalT3 + agg.totalT4;
                  const mismatch = agg.totalTarget > 0 && sumQ !== agg.totalTarget;
                  return (
                    <tr
                      key={agg.unit}
                      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setOpenUnit(agg)}
                    >
                      <td className="p-2 text-xs">
                        <div className="font-medium leading-tight">{agg.description}</div>
                        <div className="text-[10px] text-muted-foreground lowercase">{agg.unit}</div>
                      </td>
                      <td className="p-2 text-center text-xs">
                        <Badge variant="secondary" className="text-[10px] h-5">{agg.contributions.length}</Badge>
                      </td>
                      <td className={cn("p-2 text-right font-bold text-sm", mismatch && "text-amber-600")}>
                        {fmt(agg.totalTarget)}
                        {mismatch && (
                          <div className="text-[10px] text-muted-foreground font-normal">
                            (Σ trim. {fmt(sumQ)})
                          </div>
                        )}
                      </td>
                      <td className="p-2 text-right text-xs bg-blue-50/50 dark:bg-blue-950/20">
                        {agg.totalT1 > 0 ? fmt(agg.totalT1) : "-"}
                      </td>
                      <td className="p-2 text-right text-xs bg-emerald-50/50 dark:bg-emerald-950/20">
                        {agg.totalT2 > 0 ? fmt(agg.totalT2) : "-"}
                      </td>
                      <td className="p-2 text-right text-xs bg-amber-50/50 dark:bg-amber-950/20">
                        {agg.totalT3 > 0 ? fmt(agg.totalT3) : "-"}
                      </td>
                      <td className="p-2 text-right text-xs bg-purple-50/50 dark:bg-purple-950/20">
                        {agg.totalT4 > 0 ? fmt(agg.totalT4) : "-"}
                      </td>
                      <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpenUnit(agg)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
              {filtered.length > 0 && (
                <tr className="bg-primary/5 border-t-2 border-primary/30">
                  <td className="p-2 font-bold text-sm" colSpan={2}>Total général</td>
                  <td className="p-2 text-right font-bold text-sm">{fmt(totals.target)}</td>
                  <td className="p-2 text-right font-bold text-xs bg-blue-100/50 dark:bg-blue-950/40">{fmt(totals.t1)}</td>
                  <td className="p-2 text-right font-bold text-xs bg-emerald-100/50 dark:bg-emerald-950/40">{fmt(totals.t2)}</td>
                  <td className="p-2 text-right font-bold text-xs bg-amber-100/50 dark:bg-amber-950/40">{fmt(totals.t3)}</td>
                  <td className="p-2 text-right font-bold text-xs bg-purple-100/50 dark:bg-purple-950/40">{fmt(totals.t4)}</td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Popup contributions */}
      <Dialog open={!!openUnit} onOpenChange={(o) => !o && setOpenUnit(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Contributions au livrable « {openUnit?.description} »
              <span className="ml-2 text-xs font-normal text-muted-foreground lowercase">({openUnit?.unit})</span>
            </DialogTitle>
            <DialogDescription>
              Cible totale planifiée : <strong>{openUnit ? fmt(openUnit.totalTarget) : 0}</strong> <span className="lowercase">{openUnit?.unit}</span> —
              Répartition T1 {openUnit ? fmt(openUnit.totalT1) : 0} · T2 {openUnit ? fmt(openUnit.totalT2) : 0} ·
              T3 {openUnit ? fmt(openUnit.totalT3) : 0} · T4 {openUnit ? fmt(openUnit.totalT4) : 0}
            </DialogDescription>
          </DialogHeader>

          {openUnit && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-2 font-semibold text-muted-foreground text-xs">Projet / Opération</th>
                    <th className="text-left p-2 font-semibold text-muted-foreground text-xs">Activité PTA</th>
                    <th className="text-right p-2 font-semibold text-muted-foreground text-xs w-24">Contribution</th>
                    <th className="text-right p-2 font-semibold text-muted-foreground text-xs w-16 bg-blue-50 dark:bg-blue-950/30">T1</th>
                    <th className="text-right p-2 font-semibold text-muted-foreground text-xs w-16 bg-emerald-50 dark:bg-emerald-950/30">T2</th>
                    <th className="text-right p-2 font-semibold text-muted-foreground text-xs w-16 bg-amber-50 dark:bg-amber-950/30">T3</th>
                    <th className="text-right p-2 font-semibold text-muted-foreground text-xs w-16 bg-purple-50 dark:bg-purple-950/30">T4</th>
                    <th className="text-right p-2 font-semibold text-muted-foreground text-xs w-16">%</th>
                  </tr>
                </thead>
                <tbody>
                  {openUnit.contributions
                    .slice()
                    .sort((a, b) => b.target - a.target)
                    .map((c) => {
                      const pct = openUnit.totalTarget > 0 ? Math.round((c.target / openUnit.totalTarget) * 100) : 0;
                      const isOp = !!c.operationId;
                      return (
                        <tr key={c.activityId} className="border-b hover:bg-muted/30">
                          <td className="p-2">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className={cn(
                                "text-[9px] h-4 px-1.5 shrink-0",
                                isOp ? "border-amber-400 text-amber-700 dark:text-amber-300"
                                     : "border-blue-400 text-blue-700 dark:text-blue-300"
                              )}>
                                {isOp ? <Settings2 className="w-2.5 h-2.5 mr-0.5" /> : <Briefcase className="w-2.5 h-2.5 mr-0.5" />}
                                {isOp ? "Opération" : "Projet"}
                              </Badge>
                              <span className="text-xs truncate max-w-[220px]">
                                {isOp ? (c.operationName || c.project) : c.project}
                              </span>
                            </div>
                          </td>
                          <td className="p-2 text-xs truncate max-w-[260px]">{c.activityName}</td>
                          <td className="p-2 text-right font-semibold text-sm">{fmt(c.target)}</td>
                          <td className="p-2 text-right text-xs bg-blue-50/50 dark:bg-blue-950/20">{c.t1 > 0 ? fmt(c.t1) : "-"}</td>
                          <td className="p-2 text-right text-xs bg-emerald-50/50 dark:bg-emerald-950/20">{c.t2 > 0 ? fmt(c.t2) : "-"}</td>
                          <td className="p-2 text-right text-xs bg-amber-50/50 dark:bg-amber-950/20">{c.t3 > 0 ? fmt(c.t3) : "-"}</td>
                          <td className="p-2 text-right text-xs bg-purple-50/50 dark:bg-purple-950/20">{c.t4 > 0 ? fmt(c.t4) : "-"}</td>
                          <td className="p-2 text-right text-xs font-medium text-muted-foreground">{pct}%</td>
                        </tr>
                      );
                    })}
                  <tr className="bg-primary/5 border-t-2 border-primary/30">
                    <td className="p-2 font-bold text-xs" colSpan={2}>Total</td>
                    <td className="p-2 text-right font-bold text-sm">{fmt(openUnit.totalTarget)}</td>
                    <td className="p-2 text-right font-bold text-xs bg-blue-100/50 dark:bg-blue-950/40">{fmt(openUnit.totalT1)}</td>
                    <td className="p-2 text-right font-bold text-xs bg-emerald-100/50 dark:bg-emerald-950/40">{fmt(openUnit.totalT2)}</td>
                    <td className="p-2 text-right font-bold text-xs bg-amber-100/50 dark:bg-amber-950/40">{fmt(openUnit.totalT3)}</td>
                    <td className="p-2 text-right font-bold text-xs bg-purple-100/50 dark:bg-purple-950/40">{fmt(openUnit.totalT4)}</td>
                    <td className="p-2 text-right font-bold text-xs">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PTADeliverablesSynthesis;
