import React, { useMemo, Fragment, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Calendar,
  Package,
  BarChart3,
  TrendingUp,
  Target,
  Wallet,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  FileSpreadsheet,
  Eye,
  Send,
} from "lucide-react";
import ShareByEmailDialog from "@/components/share/ShareByEmailDialog";
import { PTA } from "@/types/pta";
import { mockProjects } from "@/data/mockProjects";
import { mockServices as mockServicesRef } from "@/data/entitesExecution";
import { Building2, Folder, Package2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ReportHeaderSettings } from "@/lib/exportReportUtils";
import {
  exportPTADashboardToPDF,
  exportPTADashboardToCSV,
  PTAExportData,
  PTAExportFilters,
} from "@/lib/exportDashboardUtils";

interface PTADashboardTabProps {
  pta: PTA;
  selectedPeriod: string; // "annuel" | "cumul" | "T1" | "T2" | "T3" | "T4"
  selectedProjectId: string;
  selectedServiceId?: string;
  selectedOperationId?: string;
  headerSettings?: ReportHeaderSettings;
}

const formatBudget = (amount: number) => {
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} Mds`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} M`;
  return amount.toLocaleString("fr-FR");
};

const formatNumber = (num: number) => num.toLocaleString("fr-FR");

const getBadgeVariant = (perc: number): "default" | "secondary" | "destructive" => {
  if (perc >= 90) return "default";
  if (perc >= 70) return "secondary";
  return "destructive";
};

const getPerc = (real: number, plan: number) => plan > 0 ? Math.round((real / plan) * 100) : 0;

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

const PTADashboardTab: React.FC<PTADashboardTabProps> = ({
  pta,
  selectedPeriod,
  selectedProjectId,
  selectedServiceId = "all",
  selectedOperationId = "all",
  headerSettings,
}) => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = React.useState<"budget" | "livrables">("budget");
  const [shareOpen, setShareOpen] = React.useState(false);
  const [synthBucket, setSynthBucket] = React.useState<{
    type: "projet" | "operation";
    name: string;
    serviceName: string;
    plan: number;
    real: number;
    activities: any[];
  } | null>(null);
  const [delSynthBucket, setDelSynthBucket] = React.useState<{
    type: "projet" | "operation";
    name: string;
    serviceName: string;
    dels: any[];
  } | null>(null);
  const [synthActivity, setSynthActivity] = React.useState<{
    activity: any;
    serviceName: string;
    bucketName: string;
    bucketType: "projet" | "operation";
  } | null>(null);

  const filteredActivities = useMemo(() => {
    return pta.activities.filter(a => {
      if (selectedProjectId !== "all" && a.projectId !== selectedProjectId) return false;
      if (selectedServiceId !== "all" && a.serviceResponsableId !== selectedServiceId) return false;
      if (selectedOperationId !== "all" && a.operationId !== selectedOperationId) return false;
      return true;
    });
  }, [pta.activities, selectedProjectId, selectedServiceId, selectedOperationId]);

  // Calculer les données selon le trimestre sélectionné
  const periodData = useMemo(() => {
    const isAnnual = selectedPeriod === "annuel";
    const isCumul = selectedPeriod === "cumul";
    const selectedQ = (isAnnual || isCumul) ? "T4" : (selectedPeriod as "T1" | "T2" | "T3" | "T4");

    const getRealized = (planned: number, qIndex: number) => {
      const rates = [0.85, 0.75, 0.65, 0.45];
      return Math.round(planned * (rates[qIndex] + Math.random() * 0.2));
    };

    const activitiesData = filteredActivities.map(act => {
      const budgets = {
        T1: { plan: act.budgetT1, real: getRealized(act.budgetT1, 0) },
        T2: { plan: act.budgetT2, real: getRealized(act.budgetT2, 1) },
        T3: { plan: act.budgetT3, real: getRealized(act.budgetT3, 2) },
        T4: { plan: act.budgetT4, real: getRealized(act.budgetT4, 3) },
      };

      if (isAnnual) {
        const totalPlan = act.budgetTotal;
        const totalReal = budgets.T1.real + budgets.T2.real + budgets.T3.real + budgets.T4.real;
        return { ...act, planValue: totalPlan, realValue: totalReal, budgets };
      } else if (isCumul) {
        // Cumulé jusqu'au trimestre courant (par défaut T4 = annuel cumulé réalisé)
        const planValue = budgets.T1.plan + budgets.T2.plan + budgets.T3.plan + budgets.T4.plan;
        const realValue = budgets.T1.real + budgets.T2.real + budgets.T3.real + budgets.T4.real;
        return { ...act, planValue, realValue, budgets };
      } else {
        const q = budgets[selectedQ];
        return { ...act, planValue: q.plan, realValue: q.real, budgets };
      }
    });

    // Totaux
    const totalPlan = activitiesData.reduce((sum, a) => sum + a.planValue, 0);
    const totalReal = activitiesData.reduce((sum, a) => sum + a.realValue, 0);
    const executionRate = totalPlan > 0 ? Math.round((totalReal / totalPlan) * 100) : 0;

    // Données par nature
    const byNature: Record<string, { plan: number; real: number; count: number }> = {};
    activitiesData.forEach(a => {
      const nature = a.nature || "Autre";
      if (!byNature[nature]) byNature[nature] = { plan: 0, real: 0, count: 0 };
      byNature[nature].plan += a.planValue;
      byNature[nature].real += a.realValue;
      byNature[nature].count++;
    });

    // Données par projet
    const byProject: Record<string, { name: string; plan: number; real: number; activities: typeof activitiesData }> = {};
    activitiesData.forEach(a => {
      if (!byProject[a.project]) {
        byProject[a.project] = { name: a.project, plan: 0, real: 0, activities: [] };
      }
      byProject[a.project].plan += a.planValue;
      byProject[a.project].real += a.realValue;
      byProject[a.project].activities.push(a);
    });

    // Données par service → (projet | opération)
    const byService: Record<string, {
      serviceId: string;
      serviceName: string;
      plan: number;
      real: number;
      buckets: Record<string, { type: "projet" | "operation"; name: string; plan: number; real: number; activities: typeof activitiesData }>;
    }> = {};
    activitiesData.forEach(a => {
      const sid = a.serviceResponsableId || "_none";
      const sname = sid !== "_none" ? (mockServicesRef.find(s => s.id === sid)?.nom || sid) : "Service non défini";
      if (!byService[sid]) byService[sid] = { serviceId: sid, serviceName: sname, plan: 0, real: 0, buckets: {} };
      byService[sid].plan += a.planValue;
      byService[sid].real += a.realValue;
      const isOp = !!a.operationId;
      const bucketKey = isOp ? `op:${a.operationId}` : `prj:${a.projectId || a.project}`;
      const bucketName = isOp ? (a.operationName || "Opération") : a.project;
      if (!byService[sid].buckets[bucketKey]) {
        byService[sid].buckets[bucketKey] = { type: isOp ? "operation" : "projet", name: bucketName, plan: 0, real: 0, activities: [] };
      }
      byService[sid].buckets[bucketKey].plan += a.planValue;
      byService[sid].buckets[bucketKey].real += a.realValue;
      byService[sid].buckets[bucketKey].activities.push(a);
    });

    // Livrables par activité
    const deliverables = activitiesData.flatMap(act => {
      return act.deliverables.map(d => {
        const targetPerQ = Math.ceil(d.targetValue / 4);
        const quarterTargets = {
          T1: targetPerQ,
          T2: targetPerQ,
          T3: targetPerQ,
          T4: d.targetValue - (targetPerQ * 3),
        };
        const quarterRealized = {
          T1: Math.round(quarterTargets.T1 * (0.7 + Math.random() * 0.4)),
          T2: Math.round(quarterTargets.T2 * (0.6 + Math.random() * 0.4)),
          T3: Math.round(quarterTargets.T3 * (0.5 + Math.random() * 0.4)),
          T4: Math.round(quarterTargets.T4 * (0.4 + Math.random() * 0.4)),
        };

        const ctx = {
          activityId: act.id,
          activityName: act.name,
          project: act.project,
          projectId: act.projectId,
          operationId: act.operationId,
          operationName: act.operationName,
          serviceResponsableId: act.serviceResponsableId,
        };
        if (isAnnual) {
          const totalTarget = d.targetValue;
          const totalRealized = quarterRealized.T1 + quarterRealized.T2 + quarterRealized.T3 + quarterRealized.T4;
          return { ...d, ...ctx, target: totalTarget, realized: totalRealized, quarterTargets, quarterRealized };
        } else {
          return { ...d, ...ctx, target: quarterTargets[selectedQ], realized: quarterRealized[selectedQ], quarterTargets, quarterRealized };
        }
      });
    });

    const delCompleted = deliverables.filter(d => d.target > 0 && (d.realized / d.target) >= 1).length;
    const delInProgress = deliverables.filter(d => d.target > 0 && (d.realized / d.target) >= 0.5 && (d.realized / d.target) < 1).length;
    const delDelayed = deliverables.filter(d => d.target > 0 && (d.realized / d.target) < 0.5).length;

    return {
      isAnnual,
      selectedQ,
      activitiesData,
      totalPlan,
      totalReal,
      executionRate,
      byNature: Object.entries(byNature).map(([name, data]) => ({
        name,
        plan: data.plan,
        real: data.real,
        count: data.count,
        rate: getPerc(data.real, data.plan),
      })),
      byProject: Object.values(byProject).sort((a, b) => b.plan - a.plan),
      byService: Object.values(byService).map(s => ({
        ...s,
        rate: getPerc(s.real, s.plan),
        buckets: Object.values(s.buckets).sort((a, b) => b.plan - a.plan),
      })).sort((a, b) => b.plan - a.plan),
      deliverables,
      delStats: { completed: delCompleted, inProgress: delInProgress, delayed: delDelayed, total: deliverables.length },
    };
  }, [filteredActivities, selectedPeriod]);

  const periodLabel = selectedPeriod === "annuel" 
    ? `Année ${pta.year}` 
    : `${selectedPeriod} ${pta.year}`;

  // Préparer les données pour l'export
  const exportData: PTAExportData = useMemo(() => {
    // Construire byProject enrichi avec type/serviceName depuis byService
    const bucketIndex: Record<string, { type: "projet" | "operation"; serviceName: string }> = {};
    periodData.byService.forEach(s => {
      s.buckets.forEach(b => {
        bucketIndex[b.name] = { type: b.type, serviceName: s.serviceName };
      });
    });
    return {
      ptaName: pta.name,
      ptaCode: pta.code,
      year: pta.year,
      selectedPeriod,
      periodLabel,
      totalPlan: periodData.totalPlan,
      totalReal: periodData.totalReal,
      executionRate: periodData.executionRate,
      byNature: periodData.byNature,
      byProject: periodData.byProject.map(p => ({
        name: p.name,
        plan: p.plan,
        real: p.real,
        type: bucketIndex[p.name]?.type || "projet",
        serviceName: bucketIndex[p.name]?.serviceName,
        activities: p.activities.map(a => ({
          name: a.name,
          nature: a.nature || "Autre",
          planValue: a.planValue,
          realValue: a.realValue,
          deliverables: a.deliverables.map(d => ({
            unit: d.unit,
            target: periodData.isAnnual ? d.targetValue : Math.ceil(d.targetValue / 4),
            realized: Math.round((periodData.isAnnual ? d.targetValue : Math.ceil(d.targetValue / 4)) * 0.7),
          })),
        })),
      })),
      byService: periodData.byService.map(s => ({
        serviceName: s.serviceName,
        plan: s.plan,
        real: s.real,
        rate: s.rate,
        buckets: s.buckets.map(b => ({
          type: b.type,
          name: b.name,
          plan: b.plan,
          real: b.real,
          activitiesCount: b.activities.length,
        })),
      })),
      deliverables: periodData.deliverables.map(d => ({
        project: d.project,
        activityName: d.activityName,
        unit: d.unit,
        target: d.target,
        realized: d.realized,
      })),
      delStats: periodData.delStats,
    };
  }, [pta, selectedPeriod, periodLabel, periodData]);

  const exportFilters: PTAExportFilters = useMemo(() => {
    const proj = selectedProjectId !== "all" ? pta.activities.find(a => a.projectId === selectedProjectId) : undefined;
    const op = selectedOperationId !== "all" ? pta.activities.find(a => a.operationId === selectedOperationId) : undefined;
    const srv = selectedServiceId !== "all" ? mockServicesRef.find(s => s.id === selectedServiceId) : undefined;
    return {
      ptaId: pta.id,
      period: selectedPeriod,
      projectId: selectedProjectId,
      projectName: proj?.project,
      serviceName: srv?.nom,
      operationName: op?.operationName,
    };
  }, [pta, selectedPeriod, selectedProjectId, selectedServiceId, selectedOperationId]);

  const handleExportPDF = useCallback(() => {
    exportPTADashboardToPDF(exportData, exportFilters, headerSettings);
    toast({
      title: "Export PDF",
      description: `Le rapport PTA ${periodLabel} a été généré avec les filtres appliqués.`,
    });
  }, [exportData, exportFilters, headerSettings, periodLabel, toast]);

  const handleExportExcel = useCallback(() => {
    exportPTADashboardToCSV(exportData, exportFilters);
    toast({
      title: "Export Excel",
      description: `Le fichier CSV PTA ${periodLabel} a été téléchargé.`,
    });
  }, [exportData, exportFilters, periodLabel, toast]);

  return (
    <div className="space-y-4">
      {/* Header avec boutons d'export */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">Suivi PTA - {periodLabel}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShareOpen(true)}>
            <Send className="w-3.5 h-3.5" /> Partager
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </Button>
          <Button size="sm" className="h-7 text-xs gap-1" onClick={handleExportPDF}>
            <Download className="w-3.5 h-3.5" /> PDF
          </Button>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        <Card>
          <CardContent className="p-2 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Calendar className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground">Période</p>
              <p className="text-sm font-bold">{periodLabel}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Wallet className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground">Budget prévu</p>
              <p className="text-sm font-bold text-blue-600">{formatBudget(periodData.totalPlan)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="w-3.5 h-3.5 text-green-600" />
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground">Budget réalisé</p>
              <p className="text-sm font-bold text-green-600">{formatBudget(periodData.totalReal)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-lg",
              periodData.executionRate >= 80 ? "bg-green-100 dark:bg-green-900/30" :
              periodData.executionRate >= 60 ? "bg-amber-100 dark:bg-amber-900/30" :
              "bg-red-100 dark:bg-red-900/30"
            )}>
              <Target className={cn(
                "w-3.5 h-3.5",
                periodData.executionRate >= 80 ? "text-green-600" :
                periodData.executionRate >= 60 ? "text-amber-600" : "text-red-600"
              )} />
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground">Taux exécution</p>
              <p className={cn(
                "text-sm font-bold",
                periodData.executionRate >= 80 ? "text-green-600" :
                periodData.executionRate >= 60 ? "text-amber-600" : "text-red-600"
              )}>{periodData.executionRate}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Activity className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground">Activités</p>
              <p className="text-sm font-bold">{periodData.activitiesData.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Package className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground">Livrables</p>
              <p className="text-sm font-bold">{periodData.delStats.total}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Budget par nature ({periodLabel})
            </CardTitle>
          </CardHeader>
          <CardContent className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={periodData.byNature} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" tickFormatter={v => formatBudget(v)} fontSize={9} />
                <YAxis dataKey="name" type="category" width={80} fontSize={9} />
                <Tooltip 
                  formatter={(value: number, name: string) => [formatBudget(value), name === "plan" ? "Prévu" : "Réalisé"]}
                  contentStyle={{ fontSize: 11, backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Bar dataKey="plan" name="Prévu" fill="#3b82f6" barSize={8} radius={[0, 2, 2, 0]} />
                <Bar dataKey="real" name="Réalisé" fill="#10b981" barSize={8} radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="w-4 h-4" /> Livrables ({periodLabel})
            </CardTitle>
          </CardHeader>
          <CardContent className="h-52 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={[
                      { name: "Atteints", value: periodData.delStats.completed, color: "#10b981" },
                      { name: "En cours", value: periodData.delStats.inProgress, color: "#f59e0b" },
                      { name: "En retard", value: periodData.delStats.delayed, color: "#ef4444" },
                    ].filter(d => d.value > 0)}
                    cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="value"
                  >
                    {[
                      { color: "#10b981" },
                      { color: "#f59e0b" },
                      { color: "#ef4444" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="flex-1">Atteints</span>
                <Badge variant="default" className="text-xs">{periodData.delStats.completed}</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="flex-1">En cours</span>
                <Badge variant="secondary" className="text-xs">{periodData.delStats.inProgress}</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="flex-1">En retard</span>
                <Badge variant="destructive" className="text-xs">{periodData.delStats.delayed}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toggle Vue Budget / Livrables */}
      <div className="flex items-center justify-end gap-1 -mb-1">
        <span className="text-[10px] text-muted-foreground mr-1">Vue :</span>
        <Button
          size="sm"
          variant={viewMode === "budget" ? "default" : "outline"}
          className="h-7 text-xs gap-1"
          onClick={() => setViewMode("budget")}
        >
          <Wallet className="w-3.5 h-3.5" /> Budget
        </Button>
        <Button
          size="sm"
          variant={viewMode === "livrables" ? "default" : "outline"}
          className="h-7 text-xs gap-1"
          onClick={() => setViewMode("livrables")}
        >
          <Package className="w-3.5 h-3.5" /> Livrables
        </Button>
      </div>

      {viewMode === "budget" && (
      <Card>
        <CardHeader className="py-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Exécution des activités - {periodLabel}
            </span>
            <Badge variant="outline" className="text-xs">
              {periodData.activitiesData.length} activités • {formatBudget(periodData.totalPlan)} prévu
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-2 px-2 font-medium">Activité</th>
                  <th className="text-left py-2 px-1 font-medium">Nature</th>
                  <th className="text-right py-2 px-2 font-medium">Budget prévu</th>
                  <th className="text-right py-2 px-2 font-medium">Budget réalisé</th>
                  <th className="text-center py-2 px-2 font-medium">Taux</th>
                  <th className="text-center py-2 px-2 font-medium">Livrables</th>
                </tr>
              </thead>
              <tbody>
                {periodData.byService.map((svc) => (
                  <Fragment key={svc.serviceId}>
                    {/* Header service */}
                    <tr className="bg-secondary/40 font-bold border-t-2 border-primary/30">
                      <td className="py-1.5 px-2 text-foreground" colSpan={3}>
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-primary" />
                          {svc.serviceName}
                          <Badge variant="outline" className="text-[9px] ml-1">{svc.buckets.length} rattachement(s)</Badge>
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-right">{formatBudget(svc.real)}</td>
                      <td className="py-1.5 px-2 text-center">
                        <Badge variant={getBadgeVariant(svc.rate)} className="text-[9px]">{svc.rate}%</Badge>
                      </td>
                      <td className="py-1.5 px-2 text-center text-muted-foreground">
                        {svc.buckets.reduce((sum, b) => sum + b.activities.reduce((s, a) => s + a.deliverables.length, 0), 0)}
                      </td>
                    </tr>
                    {svc.buckets.map((bucket) => (
                      <Fragment key={bucket.name + bucket.type}>
                        {/* Header projet/opération */}
                        <tr className="bg-primary/10 font-semibold">
                          <td className="py-1 px-2 pl-5 text-primary" colSpan={3}>
                            <span className="inline-flex items-center gap-1.5">
                              {bucket.type === "operation" ? <Package2 className="w-3 h-3" /> : <Folder className="w-3 h-3" />}
                              <Badge variant={bucket.type === "operation" ? "secondary" : "default"} className="text-[8px] h-4 px-1">
                                {bucket.type === "operation" ? "Opération" : "Projet"}
                              </Badge>
                              {bucket.name.length > 40 ? bucket.name.substring(0, 40) + "..." : bucket.name}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 ml-1"
                                title="Fiche synthèse"
                                onClick={(e) => { e.stopPropagation(); setSynthBucket({ ...bucket, serviceName: svc.serviceName }); }}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            </span>
                          </td>
                          <td className="py-1 px-2 text-right">{formatBudget(bucket.real)}</td>
                          <td className="py-1 px-2 text-center">
                            <Badge variant={getBadgeVariant(getPerc(bucket.real, bucket.plan))} className="text-[9px]">
                              {getPerc(bucket.real, bucket.plan)}%
                            </Badge>
                          </td>
                          <td className="py-1 px-2 text-center text-muted-foreground">
                            {bucket.activities.reduce((s, a) => s + a.deliverables.length, 0)}
                          </td>
                        </tr>
                        {bucket.activities.slice(0, 8).map(act => {
                          const delCount = act.deliverables.length;
                          const delPerf = delCount > 0
                            ? periodData.deliverables
                                .filter(d => d.activityName === act.name)
                                .reduce((sum, d) => sum + (d.target > 0 ? (d.realized / d.target) * 100 : 0), 0) / delCount
                            : 0;
                          return (
                            <tr key={act.id} className="border-b hover:bg-muted/30">
                              <td className="py-1.5 px-2 pl-9">
                                <span className="inline-flex items-center gap-1">
                                  {act.name.length > 40 ? act.name.substring(0, 40) + "..." : act.name}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    title="Fiche synthèse de l'activité"
                                    onClick={(e) => { e.stopPropagation(); setSynthActivity({ activity: act, serviceName: svc.serviceName, bucketName: bucket.name, bucketType: bucket.type }); }}
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                </span>
                              </td>
                              <td className="py-1.5 px-1">
                                <Badge variant="outline" className="text-[9px]">{act.nature}</Badge>
                              </td>
                              <td className="py-1.5 px-2 text-right">{formatBudget(act.planValue)}</td>
                              <td className="py-1.5 px-2 text-right">{formatBudget(act.realValue)}</td>
                              <td className="py-1.5 px-2 text-center">
                                <Badge variant={getBadgeVariant(getPerc(act.realValue, act.planValue))} className="text-[9px]">
                                  {getPerc(act.realValue, act.planValue)}%
                                </Badge>
                              </td>
                              <td className="py-1.5 px-2 text-center text-muted-foreground">
                                {delCount > 0 ? `${delCount} (${Math.round(delPerf)}%)` : "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}

      {viewMode === "livrables" && (
      <Card>
        <CardHeader className="py-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="w-4 h-4" /> Exécution des livrables - {periodLabel}
            </span>
            <Badge variant="outline" className="text-xs">
              {periodData.delStats.total} livrables • {periodData.delStats.completed} atteints
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-2 px-2 font-medium">Livrable / Activité</th>
                  <th className="text-center py-2 px-1 font-medium">Unité</th>
                  <th className="text-right py-2 px-2 font-medium">Cible</th>
                  <th className="text-right py-2 px-2 font-medium">Réalisé</th>
                  <th className="text-center py-2 px-2 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  type Bucket = { type: "projet" | "operation"; key: string; name: string; dels: typeof periodData.deliverables; target: number; realized: number; };
                  type Svc = { serviceId: string; serviceName: string; buckets: Map<string, Bucket>; target: number; realized: number; };
                  const svcMap = new Map<string, Svc>();
                  periodData.deliverables.forEach(d => {
                    const sid = (d as any).serviceResponsableId || "_none";
                    const sname = sid !== "_none" ? (mockServicesRef.find(s => s.id === sid)?.nom || sid) : "Service non défini";
                    if (!svcMap.has(sid)) svcMap.set(sid, { serviceId: sid, serviceName: sname, buckets: new Map(), target: 0, realized: 0 });
                    const svc = svcMap.get(sid)!;
                    const isOp = !!(d as any).operationId;
                    const bkey = isOp ? `op:${(d as any).operationId}` : `prj:${(d as any).projectId || d.project}`;
                    const bname = isOp ? ((d as any).operationName || "Opération") : d.project;
                    if (!svc.buckets.has(bkey)) svc.buckets.set(bkey, { type: isOp ? "operation" : "projet", key: bkey, name: bname, dels: [], target: 0, realized: 0 });
                    const b = svc.buckets.get(bkey)!;
                    b.dels.push(d);
                    b.target += d.target;
                    b.realized += d.realized;
                    svc.target += d.target;
                    svc.realized += d.realized;
                  });
                  const services = Array.from(svcMap.values()).sort((a, b) => b.target - a.target);
                  if (services.length === 0) {
                    return (
                      <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Aucun livrable pour les filtres sélectionnés</td></tr>
                    );
                  }
                  return services.map(svc => {
                    const unitsCountSvc = new Set(svc.buckets ? Array.from(svc.buckets.values()).flatMap(b => b.dels.map((d: any) => d.unit || "-")) : []).size;
                    return (
                      <Fragment key={svc.serviceId}>
                        <tr className="bg-secondary/40 font-bold border-t-2 border-primary/30">
                          <td className="py-1.5 px-2 text-foreground" colSpan={2}>
                            <span className="inline-flex items-center gap-1.5">
                              <Building2 className="w-3 h-3 text-primary" />
                              {svc.serviceName}
                              <Badge variant="outline" className="text-[9px] ml-1">{svc.buckets.size} rattachement(s)</Badge>
                              <Badge variant="outline" className="text-[9px]">{unitsCountSvc} unité(s)</Badge>
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-right text-muted-foreground">—</td>
                          <td className="py-1.5 px-2 text-right text-muted-foreground">—</td>
                          <td className="py-1.5 px-2 text-center text-muted-foreground">—</td>
                        </tr>
                        {Array.from(svc.buckets.values()).sort((a, b) => b.dels.length - a.dels.length).map(bucket => {
                          const unitsCount = new Set(bucket.dels.map((d: any) => d.unit || "-")).size;
                          return (
                            <Fragment key={bucket.key}>
                              <tr className="bg-primary/10 font-semibold">
                                <td className="py-1 px-2 pl-5 text-primary" colSpan={2}>
                                  <span className="inline-flex items-center gap-1.5">
                                    {bucket.type === "operation" ? <Package2 className="w-3 h-3" /> : <Folder className="w-3 h-3" />}
                                    <Badge variant={bucket.type === "operation" ? "secondary" : "default"} className="text-[8px] h-4 px-1">
                                      {bucket.type === "operation" ? "Opération" : "Projet"}
                                    </Badge>
                                    {bucket.name.length > 40 ? bucket.name.substring(0, 40) + "..." : bucket.name}
                                    <Badge variant="outline" className="text-[9px] ml-1">{bucket.dels.length} livrables</Badge>
                                    <Badge variant="outline" className="text-[9px]">{unitsCount} unité(s)</Badge>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 ml-1"
                                      title="Fiche synthèse des livrables"
                                      onClick={(e) => { e.stopPropagation(); setDelSynthBucket({ type: bucket.type, name: bucket.name, serviceName: svc.serviceName, dels: bucket.dels }); }}
                                    >
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                  </span>
                                </td>
                                <td className="py-1 px-2 text-right text-muted-foreground">—</td>
                                <td className="py-1 px-2 text-right text-muted-foreground">—</td>
                                <td className="py-1 px-2 text-center text-muted-foreground">—</td>
                              </tr>
                              {bucket.dels.map((d, idx) => {
                                const perf = d.target > 0 ? Math.round((d.realized / d.target) * 100) : 0;
                                return (
                                  <tr key={`${bucket.key}-${idx}`} className="border-b hover:bg-muted/30">
                                    <td className="py-1.5 px-2 pl-9">
                                      <div className="font-medium">{d.unit && d.unit.length > 0 ? d.unit : "Livrable"}</div>
                                      <div className="text-[10px] text-muted-foreground">
                                        {d.activityName.length > 50 ? d.activityName.substring(0, 50) + "..." : d.activityName}
                                      </div>
                                    </td>
                                    <td className="py-1.5 px-1 text-center">{d.unit || "-"}</td>
                                    <td className="py-1.5 px-2 text-right font-medium">{formatNumber(d.target)}</td>
                                    <td className="py-1.5 px-2 text-right font-medium">{formatNumber(d.realized)}</td>
                                    <td className="py-1.5 px-2 text-center">
                                      <Badge variant={getBadgeVariant(perf)} className="text-[9px]">{perf}%</Badge>
                                    </td>
                                  </tr>
                                );
                              })}
                            </Fragment>
                          );
                        })}
                      </Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Fiche synthèse projet/opération */}
      <Dialog open={!!synthBucket} onOpenChange={(o) => !o && setSynthBucket(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          {synthBucket && (() => {
            const totalPlan = synthBucket.plan;
            const totalReal = synthBucket.real;
            const rate = getPerc(totalReal, totalPlan);
            const acts = synthBucket.activities;
            const allDel = acts.flatMap((a: any) => a.deliverables || []);
            // Données T1-T4 pour graphique
            const tData = ["T1", "T2", "T3", "T4"].map((t) => {
              const plan = acts.reduce((s: number, a: any) => s + (a.budgets?.[t]?.plan || 0), 0);
              const real = acts.reduce((s: number, a: any) => s + (a.budgets?.[t]?.real || 0), 0);
              return { name: t, Prévu: plan, Réalisé: real };
            });
            // Top/Bottom activités
            const sorted = [...acts].sort((a: any, b: any) => getPerc(b.realValue, b.planValue) - getPerc(a.realValue, a.planValue));
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {synthBucket.type === "operation" ? <Package2 className="w-4 h-4 text-primary" /> : <Folder className="w-4 h-4 text-primary" />}
                    Fiche synthèse — {synthBucket.name}
                  </DialogTitle>
                  <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant={synthBucket.type === "operation" ? "secondary" : "default"}>
                      {synthBucket.type === "operation" ? "Opération" : "Projet"}
                    </Badge>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3" />{synthBucket.serviceName}</span>
                    <span>•</span>
                    <span>{acts.length} activité(s)</span>
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 pr-3">
                  <div className="space-y-3">
                    {/* KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Card><CardContent className="p-2"><p className="text-[10px] text-muted-foreground">Budget prévu</p><p className="text-base font-bold text-blue-600">{formatBudget(totalPlan)}</p></CardContent></Card>
                      <Card><CardContent className="p-2"><p className="text-[10px] text-muted-foreground">Budget réalisé</p><p className="text-base font-bold text-green-600">{formatBudget(totalReal)}</p></CardContent></Card>
                      <Card><CardContent className="p-2"><p className="text-[10px] text-muted-foreground">Taux exécution</p><p className={cn("text-base font-bold", rate >= 80 ? "text-green-600" : rate >= 60 ? "text-amber-600" : "text-red-600")}>{rate}%</p></CardContent></Card>
                      <Card><CardContent className="p-2"><p className="text-[10px] text-muted-foreground">Livrables</p><p className="text-base font-bold text-purple-600">{allDel.length}</p></CardContent></Card>
                    </div>

                    {/* Évolution trimestrielle */}
                    <Card>
                      <CardHeader className="py-2"><CardTitle className="text-xs flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5" /> Exécution par trimestre</CardTitle></CardHeader>
                      <CardContent className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={tData} margin={{ left: 10, right: 15, top: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="name" fontSize={9} />
                            <YAxis fontSize={9} tickFormatter={(v) => formatBudget(v)} />
                            <Tooltip formatter={(v: number) => formatBudget(v)} contentStyle={{ fontSize: 11 }} />
                            <Legend wrapperStyle={{ fontSize: 9 }} />
                            <Bar dataKey="Prévu" fill="#3b82f6" />
                            <Bar dataKey="Réalisé" fill="#10b981" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Activités */}
                    <Card>
                      <CardHeader className="py-2"><CardTitle className="text-xs flex items-center gap-2"><Activity className="w-3.5 h-3.5" /> Activités PTA</CardTitle></CardHeader>
                      <CardContent className="p-2 space-y-1.5">
                        {acts.slice(0, 10).map((act: any) => {
                          const r = getPerc(act.realValue, act.planValue);
                          return (
                            <div key={act.id} className="border rounded p-1.5">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-[11px] font-medium truncate flex-1">{act.name}</span>
                                <Badge variant="outline" className="text-[9px]">{act.nature}</Badge>
                                <Badge variant={getBadgeVariant(r)} className="text-[9px]">{r}%</Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                                <span>Prévu : <span className="font-semibold text-foreground">{formatBudget(act.planValue)}</span></span>
                                <span>Réalisé : <span className="font-semibold text-foreground">{formatBudget(act.realValue)}</span></span>
                              </div>
                            </div>
                          );
                        })}
                        {acts.length > 10 && <p className="text-[10px] text-muted-foreground italic">… et {acts.length - 10} autres</p>}
                      </CardContent>
                    </Card>

                    {/* Top / Bottom */}
                    {acts.length > 1 && (
                      <Card>
                        <CardHeader className="py-2"><CardTitle className="text-xs flex items-center gap-2"><Target className="w-3.5 h-3.5" /> Performance des activités</CardTitle></CardHeader>
                        <CardContent className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] font-semibold mb-1 text-green-600">Top 3 ✓</p>
                            {sorted.slice(0, 3).map((a: any) => (
                              <div key={a.id} className="flex items-center gap-1 text-[10px] mb-1">
                                <Badge variant="default" className="text-[9px] w-10 justify-center">{getPerc(a.realValue, a.planValue)}%</Badge>
                                <span className="truncate flex-1">{a.name}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold mb-1 text-red-600">À surveiller ⚠</p>
                            {sorted.slice(-3).reverse().map((a: any) => (
                              <div key={a.id} className="flex items-center gap-1 text-[10px] mb-1">
                                <Badge variant="destructive" className="text-[9px] w-10 justify-center">{getPerc(a.realValue, a.planValue)}%</Badge>
                                <span className="truncate flex-1">{a.name}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Fiche synthèse des livrables (par unité) */}
      <Dialog open={!!delSynthBucket} onOpenChange={(o) => !o && setDelSynthBucket(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          {delSynthBucket && (() => {
            const dels = delSynthBucket.dels;
            const byUnit = new Map<string, { unit: string; target: number; realized: number; items: any[] }>();
            dels.forEach((d: any) => {
              const u = d.unit || "—";
              if (!byUnit.has(u)) byUnit.set(u, { unit: u, target: 0, realized: 0, items: [] });
              const g = byUnit.get(u)!;
              g.target += d.target;
              g.realized += d.realized;
              g.items.push(d);
            });
            const groups = Array.from(byUnit.values()).sort((a, b) => b.items.length - a.items.length);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {delSynthBucket.type === "operation" ? <Package2 className="w-4 h-4 text-primary" /> : <Folder className="w-4 h-4 text-primary" />}
                    Fiche synthèse livrables — {delSynthBucket.name}
                  </DialogTitle>
                  <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant={delSynthBucket.type === "operation" ? "secondary" : "default"}>
                      {delSynthBucket.type === "operation" ? "Opération" : "Projet"}
                    </Badge>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3" />{delSynthBucket.serviceName}</span>
                    <span>•</span>
                    <span>{dels.length} livrable(s)</span>
                    <span>•</span>
                    <span>{groups.length} unité(s)</span>
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 pr-3">
                  <div className="space-y-3">
                    {groups.map((g) => {
                      const perf = getPerc(g.realized, g.target);
                      return (
                        <Card key={g.unit}>
                          <CardHeader className="py-2">
                            <CardTitle className="text-xs flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-2">
                                <Package className="w-3.5 h-3.5 text-primary" />
                                Unité : {g.unit}
                                <Badge variant="outline" className="text-[9px]">{g.items.length} livrable(s)</Badge>
                              </span>
                              <span className="inline-flex items-center gap-2 text-[10px] font-normal text-muted-foreground">
                                Cible : <span className="font-semibold text-foreground">{formatNumber(g.target)}</span>
                                • Réalisé : <span className="font-semibold text-foreground">{formatNumber(g.realized)}</span>
                                <Badge variant={getBadgeVariant(perf)} className="text-[9px]">{perf}%</Badge>
                              </span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b text-muted-foreground">
                                  <th className="text-left py-1 px-1 font-medium">Activité</th>
                                  <th className="text-right py-1 px-1 font-medium">Cible</th>
                                  <th className="text-right py-1 px-1 font-medium">Réalisé</th>
                                  <th className="text-center py-1 px-1 font-medium">Perf.</th>
                                </tr>
                              </thead>
                              <tbody>
                                {g.items.map((d: any, i: number) => {
                                  const p = d.target > 0 ? Math.round((d.realized / d.target) * 100) : 0;
                                  return (
                                    <tr key={i} className="border-b last:border-0">
                                      <td className="py-1 px-1">{d.activityName}</td>
                                      <td className="py-1 px-1 text-right">{formatNumber(d.target)}</td>
                                      <td className="py-1 px-1 text-right">{formatNumber(d.realized)}</td>
                                      <td className="py-1 px-1 text-center">
                                        <Badge variant={getBadgeVariant(p)} className="text-[9px]">{p}%</Badge>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Fiche synthèse activité PTA */}
      <Dialog open={!!synthActivity} onOpenChange={(o) => !o && setSynthActivity(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          {synthActivity && (() => {
            const a = synthActivity.activity;
            const rate = getPerc(a.realValue, a.planValue);
            const tData = ["T1", "T2", "T3", "T4"].map((t) => ({
              name: t,
              Prévu: a.budgets?.[t]?.plan || 0,
              Réalisé: a.budgets?.[t]?.real || 0,
            }));
            const dels = periodData.deliverables.filter((d: any) => d.activityName === a.name);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" /> Fiche synthèse activité — {a.name}
                  </DialogTitle>
                  <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline">{a.nature}</Badge>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3" />{synthActivity.serviceName}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      {synthActivity.bucketType === "operation" ? <Package2 className="w-3 h-3" /> : <Folder className="w-3 h-3" />}
                      {synthActivity.bucketName}
                    </span>
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 pr-3">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Card><CardContent className="p-2"><p className="text-[10px] text-muted-foreground">Budget prévu</p><p className="text-base font-bold text-blue-600">{formatBudget(a.planValue)}</p></CardContent></Card>
                      <Card><CardContent className="p-2"><p className="text-[10px] text-muted-foreground">Budget réalisé</p><p className="text-base font-bold text-green-600">{formatBudget(a.realValue)}</p></CardContent></Card>
                      <Card><CardContent className="p-2"><p className="text-[10px] text-muted-foreground">Taux exécution</p><p className={cn("text-base font-bold", rate >= 80 ? "text-green-600" : rate >= 60 ? "text-amber-600" : "text-red-600")}>{rate}%</p></CardContent></Card>
                      <Card><CardContent className="p-2"><p className="text-[10px] text-muted-foreground">Livrables</p><p className="text-base font-bold text-purple-600">{dels.length}</p></CardContent></Card>
                    </div>

                    <Card>
                      <CardHeader className="py-2"><CardTitle className="text-xs flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5" /> Exécution par trimestre</CardTitle></CardHeader>
                      <CardContent className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={tData} margin={{ left: 10, right: 15, top: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="name" fontSize={9} />
                            <YAxis fontSize={9} tickFormatter={(v) => formatBudget(v)} />
                            <Tooltip formatter={(v: number) => formatBudget(v)} contentStyle={{ fontSize: 11 }} />
                            <Legend wrapperStyle={{ fontSize: 9 }} />
                            <Bar dataKey="Prévu" fill="#3b82f6" />
                            <Bar dataKey="Réalisé" fill="#10b981" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {a.responsable && (
                      <Card>
                        <CardContent className="p-2 text-[11px] grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div><span className="text-muted-foreground">Responsable : </span><span className="font-semibold">{a.responsable}</span></div>
                          {a.trimestres?.length > 0 && (
                            <div><span className="text-muted-foreground">Trimestres planifiés : </span><span className="font-semibold">{a.trimestres.join(", ")}</span></div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {dels.length > 0 && (
                      <Card>
                        <CardHeader className="py-2"><CardTitle className="text-xs flex items-center gap-2"><Package className="w-3.5 h-3.5" /> Livrables ({dels.length})</CardTitle></CardHeader>
                        <CardContent className="pt-0">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b text-muted-foreground">
                                <th className="text-center py-1 px-1 font-medium">Unité</th>
                                <th className="text-right py-1 px-1 font-medium">Cible</th>
                                <th className="text-right py-1 px-1 font-medium">Réalisé</th>
                                <th className="text-center py-1 px-1 font-medium">Perf.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dels.map((d: any, i: number) => {
                                const p = d.target > 0 ? Math.round((d.realized / d.target) * 100) : 0;
                                return (
                                  <tr key={i} className="border-b last:border-0">
                                    <td className="py-1 px-1 text-center">{d.unit || "—"}</td>
                                    <td className="py-1 px-1 text-right">{formatNumber(d.target)}</td>
                                    <td className="py-1 px-1 text-right">{formatNumber(d.realized)}</td>
                                    <td className="py-1 px-1 text-center">
                                      <Badge variant={getBadgeVariant(p)} className="text-[9px]">{p}%</Badge>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
      <ShareByEmailDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        subject={`Tableau de bord PTA — ${pta.name} (${periodLabel})`}
        contextLabel={`PTA ${pta.code} • ${periodLabel}`}
        attachmentName={`tableau-bord-pta-${pta.code}-${selectedPeriod}.pdf`}
        htmlPreview={`
          <h2 style="margin:0 0 8px 0;">${pta.name}</h2>
          <p style="margin:0 0 12px 0;color:#666;font-size:12px;">${pta.code} • ${periodLabel}</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Budget planifié</strong></td><td style="padding:4px 8px;">${formatNumber(periodData.totalPlan)}</td></tr>
            <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Budget réalisé</strong></td><td style="padding:4px 8px;">${formatNumber(periodData.totalReal)}</td></tr>
            <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Taux d'exécution</strong></td><td style="padding:4px 8px;">${periodData.executionRate}%</td></tr>
            <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Activités</strong></td><td style="padding:4px 8px;">${filteredActivities.length}</td></tr>
            <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Livrables</strong></td><td style="padding:4px 8px;">${periodData.delStats.total} (${periodData.delStats.completed} achevés)</td></tr>
          </table>
        `}
      />
    </div>
  );
};

export default PTADashboardTab;
