import React, { Fragment, useMemo, useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockProjects } from "@/data/mockProjects";
import { mockServices, getServiceById } from "@/data/entitesExecution";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ReportHeaderSettings } from "@/lib/exportReportUtils";
import {
  exportProjectsPerformanceToPDF,
  exportProjectsPerformanceToCSV,
  ProjectExportData,
  ProjectExportFilters,
} from "@/lib/exportDashboardUtils";
import { useToast } from "@/hooks/use-toast";
import {
  FolderKanban,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Package,
  Wallet,
  Timer,
  Download,
  FileSpreadsheet,
  Eye,
  Building2,
  PieChart as PieIcon,
  Send,
} from "lucide-react";
import ShareByEmailDialog from "@/components/share/ShareByEmailDialog";
import { PieChart, Pie, Cell } from "recharts";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";

interface ProjectsPerformanceTabProps {
  filteredProjects: typeof mockProjects;
  viewMode?: "graphique" | "tableau" | "combine";
  headerSettings?: ReportHeaderSettings;
  filters?: { year?: number; region?: string; projectName?: string; serviceName?: string };
}

interface ProjectPerformanceData {
  id: string;
  name: string;
  code: string;
  region: string;
  status: string;
  serviceId?: string;
  serviceName?: string;
  responsible?: string;
  // Délais
  startDate: string;
  endDate: string;
  daysElapsed: number;
  totalDays: number;
  timeProgress: number; // % du délai consommé
  // Budget
  budget: number;
  spent: number;
  budgetExecutionRate: number; // taux exécution budgétaire
  // Opérationnel
  activityProgress: number; // avancement moyen activités
  deliverableProgress: number; // avancement moyen livrables
  operationalRate: number; // taux opérationnel (moyenne activités + livrables)
  // Détails
  activities: ActivityPerformance[];
  indicators: IndicatorPerformance[];
  // Livrables résumés
  deliverables: DeliverablePerformance[];
}

interface DeliverablePerformance {
  id: string;
  name: string;
  activityName: string;
  unit: string;
  target: number;
  current: number;
  performance: number;
}

interface ActivityPerformance {
  id: string;
  code: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  timeProgress: number;
  progress: number;
  budget: number;
  spent: number;
  budgetExecutionRate: number;
  deliverables: { name: string; target: number; current: number; performance: number }[];
}

interface IndicatorPerformance {
  id: string;
  code: string;
  name: string;
  unit: string;
  baseline: number;
  target: number;
  current: number;
  performance: number;
}

const formatBudget = (amount: number) => {
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} Mds`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} M`;
  return amount.toLocaleString("fr-FR");
};

const formatNumber = (num: number) => num.toLocaleString("fr-FR");

const getStatusBadge = (status: string) => {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    en_cours: { variant: "secondary", label: "En cours" },
    termine: { variant: "default", label: "Terminé" },
    retard: { variant: "destructive", label: "En retard" },
    planifie: { variant: "outline", label: "Planifié" },
  };
  const { variant, label } = config[status] || { variant: "outline", label: status };
  return <Badge variant={variant} className="text-[10px]">{label}</Badge>;
};

const getPerformanceBadge = (value: number) => {
  if (value >= 90) return <Badge variant="default" className="text-[9px] px-1">{value}%</Badge>;
  if (value >= 70) return <Badge variant="secondary" className="text-[9px] px-1">{value}%</Badge>;
  return <Badge variant="destructive" className="text-[9px] px-1">{value}%</Badge>;
};

const getProgressColor = (value: number, type: "time" | "budget" | "operational" = "operational") => {
  if (type === "time") {
    // Pour le temps, rouge si avancement temps > avancement opérationnel
    if (value >= 90) return "bg-red-500";
    if (value >= 70) return "bg-amber-500";
    return "bg-green-500";
  }
  if (value >= 90) return "bg-green-500";
  if (value >= 70) return "bg-amber-500";
  return "bg-red-500";
};

export const ProjectsPerformanceTab: React.FC<ProjectsPerformanceTabProps> = ({
  filteredProjects,
  headerSettings,
  filters = {},
}) => {
  const { toast } = useToast();
  const [synthProject, setSynthProject] = useState<ProjectPerformanceData | null>(null);
  const [synthActivity, setSynthActivity] = useState<{ activity: ActivityPerformance; projectName: string; projectCode: string } | null>(null);
  const [groupBy, setGroupBy] = useState<"none" | "service">("service");
  const [shareOpen, setShareOpen] = useState(false);

  // Calculer les données de performance par projet
  const projectsPerformance: ProjectPerformanceData[] = useMemo(() => {
    const today = new Date();
    
    return filteredProjects.map((project) => {
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.endDate);
      const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const daysElapsed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const timeProgress = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
      
      const budgetExecutionRate = project.budget > 0 ? Math.round(((project.spent || 0) / project.budget) * 100) : 0;
      
      // Calculer performance activités et livrables
      const activities = (project.activities || []).map((act) => {
        const actStart = new Date(act.startDate);
        const actEnd = new Date(act.endDate);
        const actTotalDays = Math.max(1, Math.ceil((actEnd.getTime() - actStart.getTime()) / (1000 * 60 * 60 * 24)));
        const actDaysElapsed = Math.max(0, Math.ceil((today.getTime() - actStart.getTime()) / (1000 * 60 * 60 * 24)));
        const actTimeProgress = Math.min(100, Math.round((actDaysElapsed / actTotalDays) * 100));
        const actBudgetRate = act.budget > 0 ? Math.round(((act.spent || 0) / act.budget) * 100) : 0;
        
        const deliverables = (act.deliverables || []).map((d) => ({
          name: d.name,
          target: d.targetValue,
          current: d.currentValue || 0,
          performance: d.targetValue > 0 ? Math.round((d.currentValue || 0) / d.targetValue * 100) : 0,
        }));
        
        return {
          id: act.id,
          code: act.code,
          name: act.name,
          status: act.status,
          startDate: act.startDate,
          endDate: act.endDate,
          timeProgress: actTimeProgress,
          progress: act.progress || 0,
          budget: act.budget,
          spent: act.spent || 0,
          budgetExecutionRate: actBudgetRate,
          deliverables,
        };
      });
      
      const avgActivityProgress = activities.length > 0 
        ? Math.round(activities.reduce((sum, a) => sum + a.progress, 0) / activities.length) 
        : 0;
      
      const allDeliverables = activities.flatMap(a => a.deliverables);
      const avgDeliverableProgress = allDeliverables.length > 0
        ? Math.round(allDeliverables.reduce((sum, d) => sum + d.performance, 0) / allDeliverables.length)
        : 0;
      
      const operationalRate = Math.round((avgActivityProgress + avgDeliverableProgress) / 2);
      
      const indicators = (project.indicators || []).map((ind) => ({
        id: ind.id,
        code: ind.code,
        name: ind.name,
        unit: ind.unit,
        baseline: ind.baselineValue || 0,
        target: ind.targetValue,
        current: ind.currentValue || 0,
        performance: ind.targetValue > 0 ? Math.round((ind.currentValue || 0) / ind.targetValue * 100) : 0,
      }));
      
      // Collecter tous les livrables pour l'affichage
      const projectDeliverables: DeliverablePerformance[] = (project.activities || []).flatMap(act => 
        (act.deliverables || []).map((d, idx) => ({
          id: `${act.id}-del-${idx}`,
          name: d.name,
          activityName: act.name,
          unit: d.uniteMesure?.name || d.unit || "",
          target: d.targetValue,
          current: d.currentValue || 0,
          performance: d.targetValue > 0 ? Math.round((d.currentValue || 0) / d.targetValue * 100) : 0,
        }))
      );
      
      return {
        id: project.id,
        name: project.name,
        code: project.code,
        region: project.region,
        status: project.status,
        serviceId: project.serviceResponsableId,
        serviceName: project.serviceResponsableId ? getServiceById(project.serviceResponsableId)?.nom : undefined,
        responsible: project.responsible,
        startDate: project.startDate,
        endDate: project.endDate,
        daysElapsed,
        totalDays,
        timeProgress,
        budget: project.budget,
        spent: project.spent || 0,
        budgetExecutionRate,
        activityProgress: avgActivityProgress,
        deliverableProgress: avgDeliverableProgress,
        operationalRate,
        activities,
        indicators,
        deliverables: projectDeliverables,
      };
    });
  }, [filteredProjects]);
  
  // KPIs globaux avec données livrables
  const globalKPIs = useMemo(() => {
    const total = projectsPerformance.length;
    const avgTimeProgress = total > 0 ? Math.round(projectsPerformance.reduce((s, p) => s + p.timeProgress, 0) / total) : 0;
    const avgBudgetRate = total > 0 ? Math.round(projectsPerformance.reduce((s, p) => s + p.budgetExecutionRate, 0) / total) : 0;
    const avgActivityProgress = total > 0 ? Math.round(projectsPerformance.reduce((s, p) => s + p.activityProgress, 0) / total) : 0;
    const avgDeliverableProgress = total > 0 ? Math.round(projectsPerformance.reduce((s, p) => s + p.deliverableProgress, 0) / total) : 0;
    const avgOperationalRate = total > 0 ? Math.round(projectsPerformance.reduce((s, p) => s + p.operationalRate, 0) / total) : 0;
    const onTrack = projectsPerformance.filter(p => p.operationalRate >= p.timeProgress).length;
    const delayed = projectsPerformance.filter(p => p.operationalRate < p.timeProgress - 10).length;
    
    // Statistiques livrables
    const allDeliverables = projectsPerformance.flatMap(p => p.activities.flatMap(a => a.deliverables));
    const totalDeliverables = allDeliverables.length;
    const deliverablesCompleted = allDeliverables.filter(d => d.performance >= 100).length;
    const deliverablesInProgress = allDeliverables.filter(d => d.performance >= 50 && d.performance < 100).length;
    const deliverablesDelayed = allDeliverables.filter(d => d.performance < 50).length;
    
    return { 
      total, avgTimeProgress, avgBudgetRate, avgActivityProgress, avgDeliverableProgress, 
      avgOperationalRate, onTrack, delayed,
      totalDeliverables, deliverablesCompleted, deliverablesInProgress, deliverablesDelayed
    };
  }, [projectsPerformance]);
  
  // Données pour graphique comparatif amélioré avec livrables
  const chartData = useMemo(() => {
    return projectsPerformance.slice(0, 10).map(p => ({
      name: p.name.length > 18 ? p.name.substring(0, 18) + "..." : p.name,
      fullName: p.name,
      delaiConsomme: p.timeProgress,
      avancActivites: p.activityProgress,
      avancLivrables: p.deliverableProgress,
      execBudget: p.budgetExecutionRate,
    }));
  }, [projectsPerformance]);
  
  // Données pour graphique radial amélioré avec livrables
  const radialData = useMemo(() => [
    { name: "Délai consommé", value: globalKPIs.avgTimeProgress, fill: "#f59e0b" },
    { name: "Exéc. budget", value: globalKPIs.avgBudgetRate, fill: "#3b82f6" },
    { name: "Avancement activités", value: globalKPIs.avgActivityProgress, fill: "#10b981" },
    { name: "Avancement livrables", value: globalKPIs.avgDeliverableProgress, fill: "#8b5cf6" },
  ], [globalKPIs]);
  
  // Préparer les données pour l'export
  const exportData: ProjectExportData[] = useMemo(() => {
    return projectsPerformance.map(p => ({
      id: p.id,
      code: p.code,
      name: p.name,
      region: p.region,
      status: p.status,
      timeProgress: p.timeProgress,
      budgetExecutionRate: p.budgetExecutionRate,
      activityProgress: p.activityProgress,
      deliverableProgress: p.deliverableProgress,
      operationalRate: p.operationalRate,
      budget: p.budget,
      spent: p.spent,
      activities: p.activities.map(a => ({
        code: a.code,
        name: a.name,
        status: a.status,
        timeProgress: a.timeProgress,
        progress: a.progress,
        budget: a.budget,
        spent: a.spent,
        budgetExecutionRate: a.budgetExecutionRate,
        deliverables: a.deliverables,
      })),
      indicators: p.indicators,
      deliverables: p.deliverables,
    }));
  }, [projectsPerformance]);

  // Export PDF fidèle au contenu affiché
  const handleExportPDF = useCallback(() => {
    exportProjectsPerformanceToPDF(exportData, globalKPIs, filters, headerSettings);
    toast({
      title: "Export PDF",
      description: "Le rapport de performance des projets a été généré avec les filtres appliqués.",
    });
  }, [exportData, globalKPIs, filters, headerSettings, toast]);
  
  // Export Excel fidèle au contenu affiché
  const handleExportExcel = useCallback(() => {
    exportProjectsPerformanceToCSV(exportData, globalKPIs, filters);
    toast({
      title: "Export Excel",
      description: "Le fichier CSV a été téléchargé avec les filtres appliqués.",
    });
  }, [exportData, globalKPIs, filters, toast]);
  
  return (
    <div className="space-y-4">
      {/* Header avec boutons d'export */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">Performance des projets</h2>
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
      
      {/* KPIs Performance Projets - 2 lignes */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        <Card>
          <CardContent className="p-2 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <FolderKanban className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground">Projets</p>
              <p className="text-base font-bold">{globalKPIs.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Timer className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground">Délai consommé</p>
              <p className="text-base font-bold text-amber-600">{globalKPIs.avgTimeProgress}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Wallet className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground">Exéc. budget</p>
              <p className="text-base font-bold text-blue-600">{globalKPIs.avgBudgetRate}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Activity className="w-3.5 h-3.5 text-green-600" />
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground">Avanc. activités</p>
              <p className="text-base font-bold text-green-600">{globalKPIs.avgActivityProgress}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Package className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground">Avanc. livrables</p>
              <p className="text-base font-bold text-purple-600">{globalKPIs.avgDeliverableProgress}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-secondary/20">
              <Package className="w-3.5 h-3.5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground">Total livrables</p>
              <p className="text-base font-bold">{globalKPIs.totalDeliverables}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground">Livrables atteints</p>
              <p className="text-base font-bold text-green-600">{globalKPIs.deliverablesCompleted}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground">Projets retard</p>
              <p className="text-base font-bold text-red-600">{globalKPIs.delayed}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Graphiques - toujours affichés en mode combiné */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Graphique comparatif par projet amélioré */}
        <Card className="lg:col-span-2">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Comparaison avancement par projet
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 15, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={9} />
                  <YAxis dataKey="name" type="category" width={110} fontSize={9} tick={{ fill: 'hsl(var(--foreground))' }} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                    labelFormatter={(label) => chartData.find(d => d.name === label)?.fullName || label}
                    contentStyle={{ fontSize: 11, backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 9, paddingTop: 8 }} />
                  <Bar dataKey="delaiConsomme" name="Délai consommé" fill="#f59e0b" barSize={5} radius={[0, 2, 2, 0]} />
                  <Bar dataKey="avancActivites" name="Avanc. activités" fill="#10b981" barSize={5} radius={[0, 2, 2, 0]} />
                  <Bar dataKey="avancLivrables" name="Avanc. livrables" fill="#8b5cf6" barSize={5} radius={[0, 2, 2, 0]} />
                  <Bar dataKey="execBudget" name="Exéc. budget" fill="#3b82f6" barSize={5} radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Graphique radial global amélioré */}
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4" /> Moyennes globales
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="85%" data={radialData} startAngle={180} endAngle={0}>
                  <RadialBar background dataKey="value" cornerRadius={4} />
                  <Legend 
                    iconSize={8} 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    wrapperStyle={{ fontSize: 9, paddingTop: 8 }} 
                  />
                  <Tooltip 
                    formatter={(value: number) => `${value}%`} 
                    contentStyle={{ fontSize: 11, backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tableau détaillé par projet avec activités et indicateurs */}
      <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4" /> Situation détaillée par projet
              </span>
              <div className="flex items-center gap-1 text-xs font-normal">
                <span className="text-muted-foreground">Regrouper :</span>
                <Button size="sm" variant={groupBy === "service" ? "default" : "outline"} className="h-6 px-2 text-[10px]" onClick={() => setGroupBy("service")}>
                  <Building2 className="w-3 h-3 mr-1" />Service
                </Button>
                <Button size="sm" variant={groupBy === "none" ? "default" : "outline"} className="h-6 px-2 text-[10px]" onClick={() => setGroupBy("none")}>
                  Aucun
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {(() => {
              // Groupes
              const groups: { key: string; label: string; projects: ProjectPerformanceData[] }[] = [];
              if (groupBy === "service") {
                const map: Record<string, { label: string; projects: ProjectPerformanceData[] }> = {};
                projectsPerformance.forEach(p => {
                  const key = p.serviceId || "_none";
                  const label = p.serviceName || "Service non défini";
                  if (!map[key]) map[key] = { label, projects: [] };
                  map[key].projects.push(p);
                });
                Object.entries(map).forEach(([key, v]) => groups.push({ key, label: v.label, projects: v.projects }));
                groups.sort((a, b) => a.label.localeCompare(b.label));
              } else {
                groups.push({ key: "all", label: "", projects: projectsPerformance });
              }

              const renderProject = (project: ProjectPerformanceData) => (
                <AccordionItem key={project.id} value={project.id} className="border rounded-lg px-2">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center gap-3 w-full pr-4">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{project.name.length > 40 ? project.name.substring(0, 40) + "..." : project.name}</span>
                          {getStatusBadge(project.status)}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{project.region}</span>
                          {project.serviceName && (<><span>•</span><span className="truncate max-w-[180px]">{project.serviceName}</span></>)}
                          <span>•</span>
                          <span>{project.activities.length} act.</span>
                          <span>•</span>
                          <span>{project.indicators.length} ind.</span>
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-3 text-xs">
                        <div className="text-center">
                          <p className="text-muted-foreground text-[10px]">Délai</p>
                          <p className="font-bold text-amber-600">{project.timeProgress}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-[10px]">Budget</p>
                          <p className="font-bold text-blue-600">{project.budgetExecutionRate}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-[10px]">Opér.</p>
                          <p className={`font-bold ${project.operationalRate >= 70 ? "text-green-600" : project.operationalRate >= 50 ? "text-amber-600" : "text-red-600"}`}>
                            {project.operationalRate}%
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={(e) => { e.stopPropagation(); setSynthProject(project); }}
                        title="Fiche synthèse"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Timer className="w-3.5 h-3.5 text-amber-600" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Délai consommé</p>
                          <p className="text-sm font-bold text-amber-600">{project.timeProgress}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wallet className="w-3.5 h-3.5 text-blue-600" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Exéc. budgétaire</p>
                          <p className="text-sm font-bold text-blue-600">{project.budgetExecutionRate}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-green-600" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Avancement activités</p>
                          <p className="text-sm font-bold text-green-600">{project.activityProgress}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-purple-600" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Avancement livrables</p>
                          <p className="text-sm font-bold text-purple-600">{project.deliverableProgress}%</p>
                        </div>
                      </div>
                    </div>

                    {project.activities.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Activités
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="text-left py-1.5 px-2 font-medium">Activité</th>
                                <th className="text-center py-1.5 px-1 font-medium">Statut</th>
                                <th className="text-center py-1.5 px-1 font-medium">Délai</th>
                                <th className="text-center py-1.5 px-1 font-medium">Avancement</th>
                                <th className="text-right py-1.5 px-1 font-medium">Budget</th>
                                <th className="text-center py-1.5 px-1 font-medium">Exéc.</th>
                                <th className="text-center py-1.5 px-1 font-medium">Livrables</th>
                                <th className="text-center py-1.5 px-1 font-medium w-10"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {project.activities.map((act) => {
                                const avgDelPerf = act.deliverables.length > 0
                                  ? Math.round(act.deliverables.reduce((s, d) => s + d.performance, 0) / act.deliverables.length)
                                  : 0;
                                return (
                                  <tr key={act.id} className="border-b hover:bg-muted/30">
                                    <td className="py-1.5 px-2">
                                      <span className="font-medium">{act.code}</span>
                                      <span className="text-muted-foreground ml-1">
                                        {act.name.length > 30 ? act.name.substring(0, 30) + "..." : act.name}
                                      </span>
                                    </td>
                                    <td className="py-1.5 px-1 text-center">{getStatusBadge(act.status)}</td>
                                    <td className="py-1.5 px-1 text-center">{getPerformanceBadge(act.timeProgress)}</td>
                                    <td className="py-1.5 px-1 text-center">
                                      <div className="flex items-center gap-1 justify-center">
                                        <Progress value={act.progress} className="w-12 h-1.5" />
                                        <span className="text-[10px]">{act.progress}%</span>
                                      </div>
                                    </td>
                                    <td className="py-1.5 px-1 text-right">{formatBudget(act.budget)}</td>
                                    <td className="py-1.5 px-1 text-center">{getPerformanceBadge(act.budgetExecutionRate)}</td>
                                    <td className="py-1.5 px-1 text-center">
                                      <span className="text-[10px]">{act.deliverables.length} ({avgDelPerf}%)</span>
                                    </td>
                                    <td className="py-1.5 px-1 text-center">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        title="Fiche synthèse de l'activité"
                                        onClick={(e) => { e.stopPropagation(); setSynthActivity({ activity: act, projectName: project.name, projectCode: project.code }); }}
                                      >
                                        <Eye className="w-3 h-3" />
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {project.deliverables.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" /> Livrables
                          <Badge variant="outline" className="ml-1 text-[9px]">
                            {project.deliverables.length} livrables • {Math.round(project.deliverables.filter(d => d.performance >= 100).length / Math.max(1, project.deliverables.length) * 100)}% atteints
                          </Badge>
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="text-left py-1.5 px-2 font-medium">Livrable</th>
                                <th className="text-left py-1.5 px-1 font-medium">Activité</th>
                                <th className="text-center py-1.5 px-1 font-medium">Unité</th>
                                <th className="text-right py-1.5 px-1 font-medium">Cible</th>
                                <th className="text-right py-1.5 px-1 font-medium">Réalisé</th>
                                <th className="text-center py-1.5 px-1 font-medium">Performance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {project.deliverables.map((del) => (
                                <tr key={del.id} className="border-b hover:bg-muted/30">
                                  <td className="py-1.5 px-2 font-medium">
                                    {del.name.length > 25 ? del.name.substring(0, 25) + "..." : del.name}
                                  </td>
                                  <td className="py-1.5 px-1 text-muted-foreground">
                                    {del.activityName.length > 20 ? del.activityName.substring(0, 20) + "..." : del.activityName}
                                  </td>
                                  <td className="py-1.5 px-1 text-center">{del.unit}</td>
                                  <td className="py-1.5 px-1 text-right font-medium">{formatNumber(del.target)}</td>
                                  <td className="py-1.5 px-1 text-right font-medium">{formatNumber(del.current)}</td>
                                  <td className="py-1.5 px-1 text-center">{getPerformanceBadge(del.performance)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {project.indicators.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" /> Indicateurs de performance
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="text-left py-1.5 px-2 font-medium">Indicateur</th>
                                <th className="text-center py-1.5 px-1 font-medium">Unité</th>
                                <th className="text-right py-1.5 px-1 font-medium">Réf.</th>
                                <th className="text-right py-1.5 px-1 font-medium">Cible</th>
                                <th className="text-right py-1.5 px-1 font-medium">Réalisé</th>
                                <th className="text-center py-1.5 px-1 font-medium">Performance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {project.indicators.map((ind) => (
                                <tr key={ind.id} className="border-b hover:bg-muted/30">
                                  <td className="py-1.5 px-2">
                                    <span className="font-medium">{ind.code}</span>
                                    <span className="text-muted-foreground ml-1">
                                      {ind.name.length > 30 ? ind.name.substring(0, 30) + "..." : ind.name}
                                    </span>
                                  </td>
                                  <td className="py-1.5 px-1 text-center">{ind.unit}</td>
                                  <td className="py-1.5 px-1 text-right">{formatNumber(ind.baseline)}</td>
                                  <td className="py-1.5 px-1 text-right font-medium">{formatNumber(ind.target)}</td>
                                  <td className="py-1.5 px-1 text-right font-medium">{formatNumber(ind.current)}</td>
                                  <td className="py-1.5 px-1 text-center">{getPerformanceBadge(ind.performance)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {project.activities.length === 0 && project.indicators.length === 0 && project.deliverables.length === 0 && (
                      <p className="text-xs text-muted-foreground italic py-2">
                        Aucune activité, livrable ni indicateur défini pour ce projet.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );

              if (groupBy === "none") {
                return (
                  <Accordion type="multiple" className="space-y-2">
                    {projectsPerformance.map(renderProject)}
                  </Accordion>
                );
              }

              return (
                <div className="space-y-3">
                  {groups.map(g => {
                    const avgOper = g.projects.length > 0 ? Math.round(g.projects.reduce((s, p) => s + p.operationalRate, 0) / g.projects.length) : 0;
                    const avgBudget = g.projects.length > 0 ? Math.round(g.projects.reduce((s, p) => s + p.budgetExecutionRate, 0) / g.projects.length) : 0;
                    const totalBudget = g.projects.reduce((s, p) => s + p.budget, 0);
                    return (
                      <div key={g.key} className="border rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between bg-primary/10 px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-primary" />
                            <span className="text-sm font-semibold text-primary">{g.label}</span>
                            <Badge variant="outline" className="text-[10px]">{g.projects.length} projet(s)</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span>Budget: <span className="font-bold text-foreground">{formatBudget(totalBudget)}</span></span>
                            <span>Exéc.: <span className="font-bold text-blue-600">{avgBudget}%</span></span>
                            <span>Opér.: <span className={`font-bold ${avgOper >= 70 ? "text-green-600" : avgOper >= 50 ? "text-amber-600" : "text-red-600"}`}>{avgOper}%</span></span>
                          </div>
                        </div>
                        <div className="p-2">
                          <Accordion type="multiple" className="space-y-2">
                            {g.projects.map(renderProject)}
                          </Accordion>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
      </Card>

      {/* Dialog Fiche synthèse projet */}
      <Dialog open={!!synthProject} onOpenChange={(o) => !o && setSynthProject(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          {synthProject && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-primary" /> Fiche synthèse — {synthProject.name}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline">{synthProject.code}</Badge>
                  <span>{synthProject.region}</span>
                  {synthProject.serviceName && <><span>•</span><span>{synthProject.serviceName}</span></>}
                  {synthProject.responsible && <><span>•</span><span>{synthProject.responsible}</span></>}
                  {getStatusBadge(synthProject.status)}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="flex-1 pr-3">
                <div className="space-y-3">
                  {/* KPI row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { label: "Délai consommé", value: synthProject.timeProgress, icon: Timer, cls: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
                      { label: "Exéc. budget", value: synthProject.budgetExecutionRate, icon: Wallet, cls: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
                      { label: "Avanc. activités", value: synthProject.activityProgress, icon: Activity, cls: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
                      { label: "Avanc. livrables", value: synthProject.deliverableProgress, icon: Package, cls: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
                    ].map((k) => (
                      <Card key={k.label}>
                        <CardContent className="p-2 flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${k.bg}`}>
                            <k.icon className={`w-3.5 h-3.5 ${k.cls}`} />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">{k.label}</p>
                            <p className={`text-base font-bold ${k.cls}`}>{k.value}%</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Illustration: comparaison délai vs avancement */}
                  <Card>
                    <CardHeader className="py-2"><CardTitle className="text-xs flex items-center gap-2"><PieIcon className="w-3.5 h-3.5" /> Comparaison délai vs avancement</CardTitle></CardHeader>
                    <CardContent className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{
                          name: synthProject.code,
                          Délai: synthProject.timeProgress,
                          Activités: synthProject.activityProgress,
                          Livrables: synthProject.deliverableProgress,
                          Budget: synthProject.budgetExecutionRate,
                        }]} margin={{ left: 10, right: 15, top: 5, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="name" fontSize={9} />
                          <YAxis domain={[0, 100]} fontSize={9} tickFormatter={(v) => `${v}%`} />
                          <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ fontSize: 11 }} />
                          <Legend wrapperStyle={{ fontSize: 9 }} />
                          <Bar dataKey="Délai" fill="#f59e0b" />
                          <Bar dataKey="Activités" fill="#10b981" />
                          <Bar dataKey="Livrables" fill="#8b5cf6" />
                          <Bar dataKey="Budget" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Activités illustrées */}
                  {synthProject.activities.length > 0 && (
                    <Card>
                      <CardHeader className="py-2"><CardTitle className="text-xs flex items-center gap-2"><Activity className="w-3.5 h-3.5" /> Activités ({synthProject.activities.length})</CardTitle></CardHeader>
                      <CardContent className="p-2 space-y-1.5">
                        {synthProject.activities.slice(0, 8).map(act => (
                          <div key={act.id} className="border rounded p-1.5">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[11px] font-medium truncate flex-1">
                                <span className="text-muted-foreground mr-1">{act.code}</span>{act.name}
                              </span>
                              {getStatusBadge(act.status)}
                            </div>
                            <div className="grid grid-cols-3 gap-1 items-center">
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-muted-foreground w-12">Avanc.</span>
                                <Progress value={act.progress} className="h-1.5 flex-1" />
                                <span className="text-[10px] font-bold w-8 text-right">{act.progress}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-muted-foreground w-12">Délai</span>
                                <Progress value={act.timeProgress} className="h-1.5 flex-1" />
                                <span className="text-[10px] font-bold w-8 text-right">{act.timeProgress}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-muted-foreground w-12">Budget</span>
                                <Progress value={act.budgetExecutionRate} className="h-1.5 flex-1" />
                                <span className="text-[10px] font-bold w-8 text-right">{act.budgetExecutionRate}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {synthProject.activities.length > 8 && (
                          <p className="text-[10px] text-muted-foreground italic">… et {synthProject.activities.length - 8} autres activités</p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Livrables top/bottom */}
                  {synthProject.deliverables.length > 0 && (
                    <Card>
                      <CardHeader className="py-2"><CardTitle className="text-xs flex items-center gap-2"><Package className="w-3.5 h-3.5" /> Top livrables</CardTitle></CardHeader>
                      <CardContent className="p-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] font-semibold mb-1 text-green-600">Top 3 ✓</p>
                            {[...synthProject.deliverables].sort((a, b) => b.performance - a.performance).slice(0, 3).map((d, i) => (
                              <div key={i} className="flex items-center gap-1 text-[10px] mb-1">
                                <Progress value={Math.min(100, d.performance)} className="h-1 flex-1" />
                                <span className="font-bold w-8 text-right text-green-600">{d.performance}%</span>
                                <span className="truncate w-32">{d.name}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold mb-1 text-red-600">À surveiller ⚠</p>
                            {[...synthProject.deliverables].sort((a, b) => a.performance - b.performance).slice(0, 3).map((d, i) => (
                              <div key={i} className="flex items-center gap-1 text-[10px] mb-1">
                                <Progress value={Math.min(100, d.performance)} className="h-1 flex-1" />
                                <span className="font-bold w-8 text-right text-red-600">{d.performance}%</span>
                                <span className="truncate w-32">{d.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Fiche synthèse activité */}
      <Dialog open={!!synthActivity} onOpenChange={(o) => !o && setSynthActivity(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          {synthActivity && (() => {
            const a = synthActivity.activity;
            const avgDelPerf = a.deliverables.length > 0
              ? Math.round(a.deliverables.reduce((s, d) => s + d.performance, 0) / a.deliverables.length)
              : 0;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" /> Fiche synthèse activité — {a.name}
                  </DialogTitle>
                  <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline">{a.code}</Badge>
                    <span>•</span>
                    <span>{synthActivity.projectCode} — {synthActivity.projectName}</span>
                    {getStatusBadge(a.status)}
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 pr-3">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Card><CardContent className="p-2"><p className="text-[10px] text-muted-foreground">Délai consommé</p><p className="text-base font-bold text-amber-600">{a.timeProgress}%</p></CardContent></Card>
                      <Card><CardContent className="p-2"><p className="text-[10px] text-muted-foreground">Avancement</p><p className="text-base font-bold text-green-600">{a.progress}%</p></CardContent></Card>
                      <Card><CardContent className="p-2"><p className="text-[10px] text-muted-foreground">Exéc. budget</p><p className="text-base font-bold text-blue-600">{a.budgetExecutionRate}%</p></CardContent></Card>
                      <Card><CardContent className="p-2"><p className="text-[10px] text-muted-foreground">Livrables</p><p className="text-base font-bold text-purple-600">{a.deliverables.length} ({avgDelPerf}%)</p></CardContent></Card>
                    </div>

                    <Card>
                      <CardHeader className="py-2"><CardTitle className="text-xs flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Période & budget</CardTitle></CardHeader>
                      <CardContent className="p-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                        <div><p className="text-muted-foreground text-[10px]">Début</p><p className="font-semibold">{a.startDate}</p></div>
                        <div><p className="text-muted-foreground text-[10px]">Fin</p><p className="font-semibold">{a.endDate}</p></div>
                        <div><p className="text-muted-foreground text-[10px]">Budget prévu</p><p className="font-semibold text-blue-600">{formatBudget(a.budget)}</p></div>
                        <div><p className="text-muted-foreground text-[10px]">Budget consommé</p><p className="font-semibold text-green-600">{formatBudget(a.spent)}</p></div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="py-2"><CardTitle className="text-xs flex items-center gap-2"><PieIcon className="w-3.5 h-3.5" /> Comparaison délai vs avancement</CardTitle></CardHeader>
                      <CardContent className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[{ name: a.code, Délai: a.timeProgress, Avancement: a.progress, Budget: a.budgetExecutionRate, Livrables: avgDelPerf }]} margin={{ left: 10, right: 15, top: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="name" fontSize={9} />
                            <YAxis domain={[0, 100]} fontSize={9} tickFormatter={(v) => `${v}%`} />
                            <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ fontSize: 11 }} />
                            <Legend wrapperStyle={{ fontSize: 9 }} />
                            <Bar dataKey="Délai" fill="#f59e0b" />
                            <Bar dataKey="Avancement" fill="#10b981" />
                            <Bar dataKey="Budget" fill="#3b82f6" />
                            <Bar dataKey="Livrables" fill="#8b5cf6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {a.deliverables.length > 0 && (
                      <Card>
                        <CardHeader className="py-2"><CardTitle className="text-xs flex items-center gap-2"><Package className="w-3.5 h-3.5" /> Livrables ({a.deliverables.length})</CardTitle></CardHeader>
                        <CardContent className="pt-0">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b text-muted-foreground">
                                <th className="text-left py-1 px-1 font-medium">Livrable</th>
                                <th className="text-right py-1 px-1 font-medium">Cible</th>
                                <th className="text-right py-1 px-1 font-medium">Réalisé</th>
                                <th className="text-center py-1 px-1 font-medium">Perf.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {a.deliverables.map((d, i) => (
                                <tr key={i} className="border-b last:border-0">
                                  <td className="py-1 px-1">{d.name}</td>
                                  <td className="py-1 px-1 text-right">{formatNumber(d.target)}</td>
                                  <td className="py-1 px-1 text-right">{formatNumber(d.current)}</td>
                                  <td className="py-1 px-1 text-center">{getPerformanceBadge(d.performance)}</td>
                                </tr>
                              ))}
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
        subject={`Tableau de bord — Performance des projets`}
        contextLabel={`Performance projets • ${exportData.length} projet(s)`}
        attachmentName={`tableau-bord-projets.pdf`}
        htmlPreview={`
          <h2 style="margin:0 0 8px 0;">Performance des projets</h2>
          <p style="margin:0 0 12px 0;color:#666;font-size:12px;">${exportData.length} projet(s) suivi(s)</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Avancement moyen</strong></td><td style="padding:4px 8px;">${globalKPIs.avgActivityProgress}%</td></tr>
            <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Taux exécution budget</strong></td><td style="padding:4px 8px;">${globalKPIs.avgBudgetRate}%</td></tr>
            <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Projets sur les rails</strong></td><td style="padding:4px 8px;">${globalKPIs.onTrack}</td></tr>
            <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Projets en retard</strong></td><td style="padding:4px 8px;">${globalKPIs.delayed}</td></tr>
          </table>
        `}
      />
    </div>
  );
};

export default ProjectsPerformanceTab;
