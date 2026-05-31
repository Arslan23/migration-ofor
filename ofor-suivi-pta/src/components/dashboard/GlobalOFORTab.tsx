import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Line, ComposedChart, PieChart, Pie, Cell,
} from "recharts";
import { mockProjects } from "@/data/mockProjects";
import { REGIONS } from "@/types/project";
import { mockServices, getServiceById } from "@/data/entitesExecution";
import { TrendingUp, FolderKanban, Package, Wallet, Award, Filter, BarChart3, Eye } from "lucide-react";

type Dimension = "region" | "bailleur" | "service" | "nature";

const formatMontant = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));
const formatShort = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} Mds`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} M`;
  return formatMontant(n);
};

const deliverableLabel = (d: any) => d?.name || d?.unit || "Livrable";

interface UnitBreakdown { target: number; produced: number; }
interface NatureBreakdown { budgetPlanned: number; budgetExecuted: number; livrablesProduits: number; activitiesCount: number; }

interface YearRow {
  year: string;
  budgetPlanned: number;
  budgetExecuted: number;
  projectsActive: number;
  deliverablesTarget: number;
  deliverablesProduced: number;
  activitiesCount: number;
  activitiesDone: number;
  tauxBudget: number;
  tauxLivrables: number;
  byUnit: Record<string, UnitBreakdown>;
  byNature: Record<string, NatureBreakdown>;
}

interface DimRow {
  name: string;
  budgetPlanned: number;
  budgetExecuted: number;
  livrablesProduits: number;
  projets: number;
  tauxExecution: number;
  byUnit: Record<string, UnitBreakdown>;
  byNature: Record<string, NatureBreakdown>;
}

interface Props { headerSettings?: any; }

const GlobalOFORTab = ({ headerSettings }: Props) => {
  const [dimension, setDimension] = useState<Dimension>("region");
  const [yearFrom, setYearFrom] = useState<string>("2022");
  const [yearTo, setYearTo] = useState<string>("2026");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [bailleurFilter, setBailleurFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [deliverableFilter, setDeliverableFilter] = useState<string>("all");

  const [detail, setDetail] = useState<{ kind: "year" | "dim"; key: string } | null>(null);

  const data = useMemo(() => {
    const yFrom = parseInt(yearFrom);
    const yTo = parseInt(yearTo);
    const years: number[] = [];
    for (let y = yFrom; y <= yTo; y++) years.push(y);

    const filtered = mockProjects.filter(p => {
      if (regionFilter !== "all" && p.region !== regionFilter) return false;
      if (bailleurFilter !== "all" && p.bailleur !== bailleurFilter) return false;
      if (serviceFilter !== "all" && p.serviceResponsableId !== serviceFilter) return false;
      return true;
    });

    const unitsSet = new Set<string>();

    const yearly: YearRow[] = years.map(year => {
      let budgetPlanned = 0, budgetExecuted = 0, projectsActive = 0;
      let deliverablesTarget = 0, deliverablesProduced = 0;
      let activitiesCount = 0, activitiesDone = 0;
      const byUnit: Record<string, UnitBreakdown> = {};
      const byNature: Record<string, NatureBreakdown> = {};

      filtered.forEach(p => {
        const ps = new Date(p.startDate).getFullYear();
        const pe = new Date(p.endDate).getFullYear();
        if (year < ps || year > pe) return;
        const span = pe - ps + 1;
        projectsActive++;
        budgetPlanned += (p.budget || 0) / span;
        budgetExecuted += (p.spent || 0) / span;

        p.activities?.forEach(a => {
          const as = new Date(a.startDate).getFullYear();
          const ae = new Date(a.endDate).getFullYear();
          if (year < as || year > ae) return;
          const sp = ae - as + 1;
          activitiesCount++;
          if (a.status === "termine") activitiesDone++;

          const nature = a.nature || "Autre";
          if (!byNature[nature]) byNature[nature] = { budgetPlanned: 0, budgetExecuted: 0, livrablesProduits: 0, activitiesCount: 0 };
          byNature[nature].activitiesCount++;
          byNature[nature].budgetPlanned += (a.budget || 0) / sp;
          byNature[nature].budgetExecuted += ((a.budget || 0) * ((a as any).progress || 70) / 100) / sp;

          a.deliverables?.forEach(d => {
            const label = deliverableLabel(d);
            unitsSet.add(label);
            const t = (d.targetValue || 0) / sp;
            const current = d.currentValue ?? (d.targetValue || 0) * 0.75;
            const c = current / sp;
            deliverablesTarget += t;
            deliverablesProduced += c;
            if (!byUnit[label]) byUnit[label] = { target: 0, produced: 0 };
            byUnit[label].target += t;
            byUnit[label].produced += c;
            byNature[nature].livrablesProduits += c;
          });
        });
      });

      const tauxBudget = budgetPlanned > 0 ? Math.round((budgetExecuted / budgetPlanned) * 100) : 0;
      const tauxLivrables = deliverablesTarget > 0 ? Math.round((deliverablesProduced / deliverablesTarget) * 100) : 0;

      return {
        year: year.toString(),
        budgetPlanned: Math.round(budgetPlanned),
        budgetExecuted: Math.round(budgetExecuted),
        projectsActive,
        deliverablesTarget: Math.round(deliverablesTarget),
        deliverablesProduced: Math.round(deliverablesProduced),
        activitiesCount, activitiesDone,
        tauxBudget, tauxLivrables,
        byUnit, byNature,
      };
    });

    const totals = yearly.reduce((acc, y) => ({
      budgetPlanned: acc.budgetPlanned + y.budgetPlanned,
      budgetExecuted: acc.budgetExecuted + y.budgetExecuted,
      deliverablesTarget: acc.deliverablesTarget + y.deliverablesTarget,
      deliverablesProduced: acc.deliverablesProduced + y.deliverablesProduced,
      activitiesCount: acc.activitiesCount + y.activitiesCount,
      activitiesDone: acc.activitiesDone + y.activitiesDone,
    }), { budgetPlanned: 0, budgetExecuted: 0, deliverablesTarget: 0, deliverablesProduced: 0, activitiesCount: 0, activitiesDone: 0 });

    const getDimKey = (p: typeof filtered[number]): string => {
      if (dimension === "region") return p.region || "Non défini";
      if (dimension === "bailleur") return p.bailleur || "Non défini";
      if (dimension === "service") {
        const s = p.serviceResponsableId ? getServiceById(p.serviceResponsableId) : null;
        return s ? `${s.code} — ${s.nom}` : "Non défini";
      }
      return "Tous";
    };

    const dimMap: Record<string, { budgetPlanned: number; budgetExecuted: number; livrablesProduits: number; projets: number; byUnit: Record<string, UnitBreakdown>; byNature: Record<string, NatureBreakdown> }> = {};
    const ensureDim = (key: string) => {
      if (!dimMap[key]) dimMap[key] = { budgetPlanned: 0, budgetExecuted: 0, livrablesProduits: 0, projets: 0, byUnit: {}, byNature: {} };
      return dimMap[key];
    };

    filtered.forEach(p => {
      const ps = new Date(p.startDate).getFullYear();
      const pe = new Date(p.endDate).getFullYear();
      const overlapFrom = Math.max(ps, yFrom);
      const overlapTo = Math.min(pe, yTo);
      if (overlapTo < overlapFrom) return;
      const overlap = overlapTo - overlapFrom + 1;
      const span = pe - ps + 1;

      if (dimension === "nature") {
        p.activities?.forEach(a => {
          const nature = a.nature || "Autre";
          const slot = ensureDim(nature);
          const as = new Date(a.startDate).getFullYear();
          const ae = new Date(a.endDate).getFullYear();
          const oFrom = Math.max(as, yFrom);
          const oTo = Math.min(ae, yTo);
          if (oTo < oFrom) return;
          const aSpan = ae - as + 1;
          const aOverlap = oTo - oFrom + 1;
          slot.budgetPlanned += ((a.budget || 0) / aSpan) * aOverlap;
          slot.budgetExecuted += ((a.budget || 0) * ((a as any).progress || 70) / 100 / aSpan) * aOverlap;
          a.deliverables?.forEach(d => {
            const label = deliverableLabel(d);
            unitsSet.add(label);
            const current = d.currentValue ?? (d.targetValue || 0) * 0.75;
            const t = ((d.targetValue || 0) / aSpan) * aOverlap;
            const c = (current / aSpan) * aOverlap;
            slot.livrablesProduits += c;
            if (!slot.byUnit[label]) slot.byUnit[label] = { target: 0, produced: 0 };
            slot.byUnit[label].target += t;
            slot.byUnit[label].produced += c;
          });
        });
      } else {
        const key = getDimKey(p);
        const slot = ensureDim(key);
        slot.budgetPlanned += ((p.budget || 0) / span) * overlap;
        slot.budgetExecuted += ((p.spent || 0) / span) * overlap;
        slot.projets += 1;
        p.activities?.forEach(a => {
          const nature = a.nature || "Autre";
          const as = new Date(a.startDate).getFullYear();
          const ae = new Date(a.endDate).getFullYear();
          const oFrom = Math.max(as, yFrom);
          const oTo = Math.min(ae, yTo);
          if (oTo < oFrom) return;
          const aSpan = ae - as + 1;
          const aOverlap = oTo - oFrom + 1;
          if (!slot.byNature[nature]) slot.byNature[nature] = { budgetPlanned: 0, budgetExecuted: 0, livrablesProduits: 0, activitiesCount: 0 };
          slot.byNature[nature].activitiesCount++;
          slot.byNature[nature].budgetPlanned += ((a.budget || 0) / aSpan) * aOverlap;
          slot.byNature[nature].budgetExecuted += ((a.budget || 0) * ((a as any).progress || 70) / 100 / aSpan) * aOverlap;
          a.deliverables?.forEach(d => {
            const label = deliverableLabel(d);
            unitsSet.add(label);
            const current = d.currentValue ?? (d.targetValue || 0) * 0.75;
            const t = ((d.targetValue || 0) / aSpan) * aOverlap;
            const c = (current / aSpan) * aOverlap;
            slot.livrablesProduits += c;
            if (!slot.byUnit[label]) slot.byUnit[label] = { target: 0, produced: 0 };
            slot.byUnit[label].target += t;
            slot.byUnit[label].produced += c;
            slot.byNature[nature].livrablesProduits += c;
          });
        });
      }
    });

    const byDimension: DimRow[] = Object.entries(dimMap)
      .map(([name, v]) => ({
        name,
        budgetPlanned: Math.round(v.budgetPlanned),
        budgetExecuted: Math.round(v.budgetExecuted),
        livrablesProduits: Math.round(v.livrablesProduits),
        projets: v.projets,
        tauxExecution: v.budgetPlanned > 0 ? Math.round((v.budgetExecuted / v.budgetPlanned) * 100) : 0,
        byUnit: v.byUnit,
        byNature: v.byNature,
      }))
      .sort((a, b) => b.budgetExecuted - a.budgetExecuted);

    const statusCount = { en_cours: 0, termine: 0, retard: 0, planifie: 0 };
    filtered.forEach(p => {
      const ps = new Date(p.startDate).getFullYear();
      const pe = new Date(p.endDate).getFullYear();
      if (pe < yFrom || ps > yTo) return;
      statusCount[p.status as keyof typeof statusCount] = (statusCount[p.status as keyof typeof statusCount] || 0) + 1;
    });

    return { yearly, totals, byDimension, statusCount, filteredCount: filtered.length, units: Array.from(unitsSet).sort() };
  }, [dimension, yearFrom, yearTo, regionFilter, bailleurFilter, serviceFilter]);

  const bailleurs = useMemo(() => Array.from(new Set(mockProjects.map(p => p.bailleur).filter(Boolean))), []);

  const tauxBudgetGlobal = data.totals.budgetPlanned > 0 ? Math.round((data.totals.budgetExecuted / data.totals.budgetPlanned) * 100) : 0;
  const tauxLivrablesGlobal = data.totals.deliverablesTarget > 0 ? Math.round((data.totals.deliverablesProduced / data.totals.deliverablesTarget) * 100) : 0;

  const statusPie = [
    { name: "Terminés", value: data.statusCount.termine, color: "#10b981" },
    { name: "En cours", value: data.statusCount.en_cours, color: "#3b82f6" },
    { name: "En retard", value: data.statusCount.retard, color: "#ef4444" },
    { name: "Planifiés", value: data.statusCount.planifie, color: "#94a3b8" },
  ].filter(s => s.value > 0);

  // Livrables chart data: filtered by deliverable unit if selected
  const livrablesChart = useMemo(() => {
    return data.yearly.map(y => {
      if (deliverableFilter === "all") {
        return { year: y.year, target: y.deliverablesTarget, produced: y.deliverablesProduced, taux: y.tauxLivrables };
      }
      const u = y.byUnit[deliverableFilter];
      const t = Math.round(u?.target || 0);
      const c = Math.round(u?.produced || 0);
      return { year: y.year, target: t, produced: c, taux: t > 0 ? Math.round((c / t) * 100) : 0 };
    });
  }, [data.yearly, deliverableFilter]);

  // Detail dialog content
  const detailData = useMemo(() => {
    if (!detail) return null;
    if (detail.kind === "year") {
      const row = data.yearly.find(y => y.year === detail.key);
      if (!row) return null;
      return {
        title: `Synthèse — Année ${row.year}`,
        budgetPlanned: row.budgetPlanned,
        budgetExecuted: row.budgetExecuted,
        tauxBudget: row.tauxBudget,
        projets: row.projectsActive,
        activitiesCount: row.activitiesCount,
        activitiesDone: row.activitiesDone,
        byUnit: row.byUnit,
        yearly: null as null | Array<{ year: string; budgetPlanned: number; budgetExecuted: number; tauxBudget: number; byUnit: Record<string, UnitBreakdown> }>,
      };
    }
    const row = data.byDimension.find(d => d.name === detail.key);
    if (!row) return null;

    // Compute per-year breakdown for this dimension key
    const yFrom = parseInt(yearFrom);
    const yTo = parseInt(yearTo);
    const years: number[] = [];
    for (let y = yFrom; y <= yTo; y++) years.push(y);

    const filtered = mockProjects.filter(p => {
      if (regionFilter !== "all" && p.region !== regionFilter) return false;
      if (bailleurFilter !== "all" && p.bailleur !== bailleurFilter) return false;
      if (serviceFilter !== "all" && p.serviceResponsableId !== serviceFilter) return false;
      return true;
    });

    const dimMatches = (p: typeof filtered[number], a?: any): boolean => {
      if (dimension === "region") return (p.region || "Non défini") === detail.key;
      if (dimension === "bailleur") return (p.bailleur || "Non défini") === detail.key;
      if (dimension === "service") {
        const s = p.serviceResponsableId ? getServiceById(p.serviceResponsableId) : null;
        return (s ? `${s.code} — ${s.nom}` : "Non défini") === detail.key;
      }
      if (dimension === "nature") return (a?.nature || "Autre") === detail.key;
      return false;
    };

    const yearly = years.map(year => {
      let budgetPlanned = 0, budgetExecuted = 0;
      const byUnit: Record<string, UnitBreakdown> = {};
      filtered.forEach(p => {
        const ps = new Date(p.startDate).getFullYear();
        const pe = new Date(p.endDate).getFullYear();
        if (year < ps || year > pe) return;
        const span = pe - ps + 1;
        if (dimension !== "nature" && dimMatches(p)) {
          budgetPlanned += (p.budget || 0) / span;
          budgetExecuted += (p.spent || 0) / span;
        }
        p.activities?.forEach(a => {
          const as = new Date(a.startDate).getFullYear();
          const ae = new Date(a.endDate).getFullYear();
          if (year < as || year > ae) return;
          const sp = ae - as + 1;
          const match = dimension === "nature" ? dimMatches(p, a) : dimMatches(p);
          if (!match) return;
          if (dimension === "nature") {
            budgetPlanned += (a.budget || 0) / sp;
            budgetExecuted += ((a.budget || 0) * ((a as any).progress || 70) / 100) / sp;
          }
          a.deliverables?.forEach(d => {
            const label = deliverableLabel(d);
            const current = d.currentValue ?? (d.targetValue || 0) * 0.75;
            const t = (d.targetValue || 0) / sp;
            const c = current / sp;
            if (!byUnit[label]) byUnit[label] = { target: 0, produced: 0 };
            byUnit[label].target += t;
            byUnit[label].produced += c;
          });
        });
      });
      const taux = budgetPlanned > 0 ? Math.round((budgetExecuted / budgetPlanned) * 100) : 0;
      return {
        year: year.toString(),
        budgetPlanned: Math.round(budgetPlanned),
        budgetExecuted: Math.round(budgetExecuted),
        tauxBudget: taux,
        byUnit,
      };
    });

    return {
      title: `Synthèse — ${row.name}`,
      budgetPlanned: row.budgetPlanned,
      budgetExecuted: row.budgetExecuted,
      tauxBudget: row.tauxExecution,
      projets: row.projets,
      activitiesCount: Object.values(row.byNature).reduce((s, n) => s + n.activitiesCount, 0),
      activitiesDone: 0,
      byUnit: row.byUnit,
      yearly,
    };
  }, [detail, data, dimension, yearFrom, yearTo, regionFilter, bailleurFilter, serviceFilter]);

  return (
    <div className="space-y-3">
      {/* Filtres dédiés */}
      <Card className="py-2">
        <CardContent className="py-2 px-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Comparer:</span>
            </div>

            <Select value={dimension} onValueChange={(v) => setDimension(v as Dimension)}>
              <SelectTrigger className="w-40 h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="region">Par région</SelectItem>
                <SelectItem value="bailleur">Par bailleur</SelectItem>
                <SelectItem value="service">Par service</SelectItem>
                <SelectItem value="nature">Par nature d'activité</SelectItem>
              </SelectContent>
            </Select>

            <span className="text-xs text-muted-foreground ml-2">Période:</span>
            <Select value={yearFrom} onValueChange={setYearFrom}>
              <SelectTrigger className="w-20 h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2020, 2021, 2022, 2023, 2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-xs">→</span>
            <Select value={yearTo} onValueChange={setYearTo}>
              <SelectTrigger className="w-20 h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="h-5 w-px bg-border mx-1" />

            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-32 h-7 text-xs"><SelectValue placeholder="Région" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes régions</SelectItem>
                {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={bailleurFilter} onValueChange={setBailleurFilter}>
              <SelectTrigger className="w-36 h-7 text-xs"><SelectValue placeholder="Bailleur" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous bailleurs</SelectItem>
                {bailleurs.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-44 h-7 text-xs"><SelectValue placeholder="Service" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous services</SelectItem>
                {mockServices.filter(s => s.actif).map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.code} — {s.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Badge variant="outline" className="text-xs ml-auto">{data.filteredCount} projets</Badge>
          </div>
        </CardContent>
      </Card>

      {/* KPIs globaux */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <Card><CardContent className="p-3 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10"><FolderKanban className="w-4 h-4 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">Projets actifs</p><p className="text-lg font-bold">{data.filteredCount}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-100"><Wallet className="w-4 h-4 text-blue-600" /></div>
          <div><p className="text-xs text-muted-foreground">Budget planifié</p><p className="text-sm font-bold">{formatShort(data.totals.budgetPlanned)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-green-100"><TrendingUp className="w-4 h-4 text-green-600" /></div>
          <div><p className="text-xs text-muted-foreground">Budget exécuté</p><p className="text-sm font-bold text-green-700">{formatShort(data.totals.budgetExecuted)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-100"><BarChart3 className="w-4 h-4 text-amber-600" /></div>
          <div><p className="text-xs text-muted-foreground">Taux exécution</p><p className="text-lg font-bold text-amber-700">{tauxBudgetGlobal}%</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-100"><Package className="w-4 h-4 text-purple-600" /></div>
          <div><p className="text-xs text-muted-foreground">Livrables (toutes unités)</p><p className="text-xs font-bold leading-tight">{data.units.length} types</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-100"><Award className="w-4 h-4 text-emerald-600" /></div>
          <div><p className="text-xs text-muted-foreground">Taux livraison moy.</p><p className="text-lg font-bold text-emerald-700">{tauxLivrablesGlobal}%</p></div>
        </CardContent></Card>
      </div>

      {/* Graphiques: évolution annuelle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Budget annuel: planifié vs exécuté</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.yearly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatShort(v)} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatMontant(v) + " FCFA"} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="budgetPlanned" name="Planifié" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="budgetExecuted" name="Exécuté" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="tauxBudget" name="Taux %" stroke="#ef4444" strokeWidth={2} yAxisId="right" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 120]} tick={{ fontSize: 10 }} unit="%" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">
              Livrables annuels — {deliverableFilter === "all" ? "tous types confondus (somme indicative)" : deliverableFilter}
            </CardTitle>
            <Select value={deliverableFilter} onValueChange={setDeliverableFilter}>
              <SelectTrigger className="w-44 h-7 text-xs"><SelectValue placeholder="Livrable" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous (indicatif)</SelectItem>
                {data.units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={livrablesChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="target" name="Cible" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="produced" name="Produit" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="taux" name="Taux %" stroke="#f59e0b" strokeWidth={2} yAxisId="right" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 120]} tick={{ fontSize: 10 }} unit="%" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Comparaison — Budget exécuté {dimension === "region" ? "par région" : dimension === "bailleur" ? "par bailleur" : dimension === "service" ? "par service" : "par nature d'activité"}</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byDimension.slice(0, 10)} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => formatShort(v)} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatMontant(v) + " FCFA"} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="budgetPlanned" name="Planifié" fill="#94a3b8" />
                <Bar dataKey="budgetExecuted" name="Exécuté" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Répartition des projets par statut</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            {statusPie.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPie} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tableau performance annuelle */}
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Performance globale annuelle <span className="text-xs text-muted-foreground font-normal">(cliquer pour voir le détail)</span></CardTitle></CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Année</TableHead>
                <TableHead className="text-xs text-center">Projets</TableHead>
                <TableHead className="text-xs text-right">Budget planifié</TableHead>
                <TableHead className="text-xs text-right">Budget exécuté</TableHead>
                <TableHead className="text-xs text-center w-32">Taux exéc.</TableHead>
                <TableHead className="text-xs text-center">Types livrables</TableHead>
                <TableHead className="text-xs text-center">Activités</TableHead>
                <TableHead className="text-xs w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.yearly.map(y => (
                <TableRow key={y.year} className="cursor-pointer" onClick={() => setDetail({ kind: "year", key: y.year })}>
                  <TableCell className="text-xs font-medium">{y.year}</TableCell>
                  <TableCell className="text-xs text-center">{y.projectsActive}</TableCell>
                  <TableCell className="text-xs text-right">{formatMontant(y.budgetPlanned)}</TableCell>
                  <TableCell className="text-xs text-right font-medium">{formatMontant(y.budgetExecuted)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={Math.min(y.tauxBudget, 100)} className="h-2" />
                      <span className="text-xs w-10 text-right">{y.tauxBudget}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-center">{Object.keys(y.byUnit).length}</TableCell>
                  <TableCell className="text-xs text-center">{y.activitiesDone}/{y.activitiesCount}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetail({ kind: "year", key: y.year })}><Eye className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tableau comparatif par dimension */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">
            Comparatif détaillé — {dimension === "region" ? "Régions" : dimension === "bailleur" ? "Bailleurs" : dimension === "service" ? "Services" : "Natures d'activité"}
            <span className="text-xs text-muted-foreground font-normal ml-2">(cliquer pour voir le détail)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{dimension === "region" ? "Région" : dimension === "bailleur" ? "Bailleur" : dimension === "service" ? "Service" : "Nature"}</TableHead>
                {dimension !== "nature" && <TableHead className="text-xs text-center">Projets</TableHead>}
                <TableHead className="text-xs text-right">Budget planifié</TableHead>
                <TableHead className="text-xs text-right">Budget exécuté</TableHead>
                <TableHead className="text-xs text-center w-32">Taux exéc.</TableHead>
                <TableHead className="text-xs text-center">Types livrables</TableHead>
                <TableHead className="text-xs w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.byDimension.map((d, i) => (
                <TableRow key={i} className="cursor-pointer" onClick={() => setDetail({ kind: "dim", key: d.name })}>
                  <TableCell className="text-xs font-medium">{d.name}</TableCell>
                  {dimension !== "nature" && <TableCell className="text-xs text-center">{d.projets}</TableCell>}
                  <TableCell className="text-xs text-right">{formatMontant(d.budgetPlanned)}</TableCell>
                  <TableCell className="text-xs text-right font-medium">{formatMontant(d.budgetExecuted)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={Math.min(d.tauxExecution, 100)} className="h-2" />
                      <span className="text-xs w-10 text-right">{d.tauxExecution}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-center">{Object.keys(d.byUnit).length}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetail({ kind: "dim", key: d.name })}><Eye className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {data.byDimension.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-4">Aucune donnée</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {detailData && (
            <>
              <DialogHeader>
                <DialogTitle>{detailData.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Card><CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Budget planifié</p>
                    <p className="text-sm font-bold">{formatMontant(detailData.budgetPlanned)} FCFA</p>
                  </CardContent></Card>
                  <Card><CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Budget exécuté</p>
                    <p className="text-sm font-bold text-green-700">{formatMontant(detailData.budgetExecuted)} FCFA</p>
                  </CardContent></Card>
                  <Card><CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Taux d'exécution</p>
                    <p className="text-sm font-bold text-amber-700">{detailData.tauxBudget}%</p>
                  </CardContent></Card>
                  <Card><CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Projets / Activités</p>
                    <p className="text-sm font-bold">{detailData.projets} / {detailData.activitiesCount}</p>
                  </CardContent></Card>
                </div>

                {detailData.yearly && detailData.yearly.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Budget par année</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Année</TableHead>
                          <TableHead className="text-xs text-right">Budget planifié</TableHead>
                          <TableHead className="text-xs text-right">Budget exécuté</TableHead>
                          <TableHead className="text-xs text-center w-40">Taux exéc.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailData.yearly.map(y => (
                          <TableRow key={y.year}>
                            <TableCell className="text-xs font-medium">{y.year}</TableCell>
                            <TableCell className="text-xs text-right">{formatMontant(y.budgetPlanned)}</TableCell>
                            <TableCell className="text-xs text-right font-medium">{formatMontant(y.budgetExecuted)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={Math.min(y.tauxBudget, 100)} className="h-2" />
                                <span className="text-xs w-10 text-right">{y.tauxBudget}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {detailData.yearly && detailData.yearly.length > 0 && (() => {
                  const units = Array.from(new Set(detailData.yearly!.flatMap(y => Object.keys(y.byUnit)))).sort();
                  const years = detailData.yearly!.map(y => y.year);
                  if (units.length === 0) return null;
                  return (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Livrables — Réalisé / Taux par année</h3>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Livrable</TableHead>
                              {years.map(yr => (
                                <TableHead key={yr} className="text-xs text-center" colSpan={2}>{yr}</TableHead>
                              ))}
                              <TableHead className="text-xs text-center bg-muted/40" colSpan={2}>Total</TableHead>
                            </TableRow>
                            <TableRow>
                              <TableHead className="text-xs"></TableHead>
                              {years.flatMap(yr => [
                                <TableHead key={`${yr}-r`} className="text-xs text-right">Réalisé</TableHead>,
                                <TableHead key={`${yr}-t`} className="text-xs text-right">Taux</TableHead>,
                              ])}
                              <TableHead className="text-xs text-right bg-muted/40">Réalisé</TableHead>
                              <TableHead className="text-xs text-right bg-muted/40">Taux</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {units.map(u => {
                              const total = detailData.byUnit[u] || { target: 0, produced: 0 };
                              const tauxTotal = total.target > 0 ? Math.round((total.produced / total.target) * 100) : 0;
                              return (
                                <TableRow key={u}>
                                  <TableCell className="text-xs font-medium">{u}</TableCell>
                                  {detailData.yearly!.flatMap(y => {
                                    const v = y.byUnit[u];
                                    const taux = v && v.target > 0 ? Math.round((v.produced / v.target) * 100) : null;
                                    return [
                                      <TableCell key={`${u}-${y.year}-r`} className="text-xs text-right font-medium">{v ? formatMontant(v.produced) : "—"}</TableCell>,
                                      <TableCell key={`${u}-${y.year}-t`} className="text-xs text-right text-muted-foreground">{taux !== null ? `${taux}%` : "—"}</TableCell>,
                                    ];
                                  })}
                                  <TableCell className="text-xs text-right font-semibold bg-muted/40">{formatMontant(total.produced)}</TableCell>
                                  <TableCell className="text-xs text-right font-semibold bg-muted/40">{tauxTotal}%</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GlobalOFORTab;
