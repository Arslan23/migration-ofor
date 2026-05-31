import React, { useState, useMemo, useCallback, Fragment } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import ProjectProgress from "@/components/dashboard/ProjectProgress";
import BudgetChart from "@/components/dashboard/BudgetChart";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import RegionMap from "@/components/dashboard/RegionMap";
import PerformanceIndicators from "@/components/dashboard/PerformanceIndicators";
import PTAExecutionDashboard from "@/components/dashboard/PTAExecutionDashboard";
import PTADashboardTab from "@/components/dashboard/PTADashboardTab";
import CDPDashboardTab from "@/components/dashboard/CDPDashboardTab";
import DeliverablesStatus from "@/components/dashboard/DeliverablesStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProjectsPerformanceTab from "@/components/dashboard/ProjectsPerformanceTab";
import GlobalOFORTab from "@/components/dashboard/GlobalOFORTab";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { mockProjects } from "@/data/mockProjects";
import { REGIONS } from "@/types/project";
import { PTA, PTAActivity, PTAIndicatorPlanning } from "@/types/pta";
import { mockCDPs, mockCDPFichesSuivi, mockCDPEvaluations, mockCDPCategories, mockCDPComposantes } from "@/types/cdp";
import { mockServices, getServiceById } from "@/data/entitesExecution";
import { generateStandalonePTAActivities } from "@/data/standalonePTAActivities";
import { exportReportToPDF, exportReportToExcel, printReport, formatBudgetShort, ReportConfig, ReportHeaderSettings } from "@/lib/exportReportUtils";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { ReportingProjets, ReportingPTA, ReportingCDP } from "@/components/reporting";
import {
  FolderKanban,
  Droplets,
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  FileText,
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  PieChart,
  Filter,
  Download,
  Printer,
  FileSpreadsheet,
  Package,
  LayoutGrid,
  Table2,
  Layers,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell, Pie, PieChart as RechartsPieChart, Legend } from "recharts";

// Générer les activités PTA depuis les projets (avec service hérité)
const generatePTAActivitiesFromProjects = (): PTAActivity[] => {
  const ptaActivities: PTAActivity[] = [];
  mockProjects.forEach(project => {
    project.activities?.forEach(activity => {
      const startDate = new Date(activity.startDate);
      const endDate = new Date(activity.endDate);
      const budget = activity.budget;
      const getQuarter = (date: Date) => Math.ceil((date.getMonth() + 1) / 3);
      const startQ = getQuarter(startDate);
      const endQ = getQuarter(endDate);
      const trimestres: string[] = [];
      const budgetByQ = { T1: 0, T2: 0, T3: 0, T4: 0 };
      const quarters = [];
      for (let q = startQ; q <= endQ; q++) {
        quarters.push(`T${q}`);
        trimestres.push(`T${q}`);
      }
      const budgetPerQuarter = budget / quarters.length;
      quarters.forEach(q => { budgetByQ[q as keyof typeof budgetByQ] = budgetPerQuarter; });
      const nature = activity.nature ||
        (activity.name.toLowerCase().includes('étude') ? 'Étude' :
         activity.name.toLowerCase().includes('formation') ? 'Formation' :
         activity.name.toLowerCase().includes('travaux') ? 'Travaux' :
         activity.name.toLowerCase().includes('installation') ? 'Équipement' : 'Travaux');
      const deliverables = (activity.deliverables || []).map((del, idx) => ({
        id: `del-${activity.id}-${idx}`,
        unit: del.uniteMesure?.name || del.unit || "",
        targetValue: del.targetValue,
      }));
      ptaActivities.push({
        id: `pta-${activity.id}`,
        activityId: activity.id,
        name: activity.name,
        project: project.name,
        projectId: project.id,
        serviceResponsableId: activity.serviceResponsableId || project.serviceResponsableId,
        budgetTotal: budget,
        budgetT1: budgetByQ.T1,
        budgetT2: budgetByQ.T2,
        budgetT3: budgetByQ.T3,
        budgetT4: budgetByQ.T4,
        deliverables: deliverables,
        trimestres: trimestres,
        responsable: activity.responsible || project.responsible,
        nature: nature,
        description: activity.description,
      });
    });
  });
  return ptaActivities;
};

const generatePTAIndicatorsFromProjects = (): PTAIndicatorPlanning[] => {
  const indicators: PTAIndicatorPlanning[] = [];
  mockProjects.forEach(project => {
    project.indicators?.forEach(indicator => {
      const annualTarget = Math.round(indicator.targetValue * 0.25);
      const perQuarter = Math.floor(annualTarget / 4);
      indicators.push({
        indicatorId: indicator.id,
        indicatorName: indicator.name,
        indicatorCode: indicator.code,
        unit: indicator.unit,
        baselineValue: indicator.baselineValue,
        annualTarget,
        targetT1: perQuarter,
        targetT2: perQuarter,
        targetT3: perQuarter,
        targetT4: perQuarter,
      });
    });
  });
  return indicators;
};

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

type MainTab = "global" | "avancement" | "pta" | "cdp";
type ViewMode = "graphique" | "tableau" | "combine";

const TableauDeBord = () => {
  const { toast } = useToast();
  const { settings } = useSettings();
  
  const [mainTab, setMainTab] = useState<MainTab>("global");
  // Mode combiné par défaut (graphiques + tableaux)
  const viewMode: ViewMode = "combine";
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedPeriod, setSelectedPeriod] = useState("annuel"); // annuel | T1..T4 | cumul
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedServiceId, setSelectedServiceId] = useState("all");
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [selectedOperationId, setSelectedOperationId] = useState("all");
  const [selectedCDPId, setSelectedCDPId] = useState(mockCDPs[0]?.id || "");
  const [selectedCDPYear, setSelectedCDPYear] = useState<number>(mockCDPs[0]?.startYear || 2024);

  const headerSettings: ReportHeaderSettings = useMemo(() => ({
    showLogo: settings.reportHeader.showLogo,
    showOrganizationName: settings.reportHeader.showOrganizationName,
    showSlogan: settings.reportHeader.showSlogan,
    headerTitle: settings.reportHeader.headerTitle,
    headerSubtitle: settings.reportHeader.headerSubtitle,
    headerColor: settings.reportHeader.headerColor,
    footerLeftText: settings.reportHeader.footerLeftText,
    footerRightText: settings.reportHeader.footerRightText,
    showPageNumbers: settings.reportHeader.showPageNumbers,
    showGenerationDate: settings.reportHeader.showGenerationDate,
    confidentialityNotice: settings.reportHeader.confidentialityNotice,
    organizationName: settings.organization.name,
    organizationAcronym: settings.organization.acronym,
    organizationSlogan: settings.organization.slogan,
  }), [settings]);

  // PTA data — combine project-derived + standalone (operations)
  const initialActivities = useMemo(() => {
    const fromProjects = generatePTAActivitiesFromProjects();
    const standalone = generateStandalonePTAActivities(0);
    return [...fromProjects, ...standalone];
  }, []);
  const initialIndicators = useMemo(() => generatePTAIndicatorsFromProjects(), []);

  const ptaList = useMemo<PTA[]>(() => {
    const totalBudget = initialActivities.reduce((sum, a) => sum + a.budgetTotal, 0);
    return [{
      id: "pta-2024-1",
      code: "PTA-2024-V01",
      name: "Plan de Travail Annuel 2024",
      year: 2024,
      status: "ouvert",
      version: 1,
      description: "PTA initial — projets + opérations transversales",
      createdAt: "2024-01-15T10:00:00Z",
      createdBy: "Système",
      openedAt: "2024-01-20T08:00:00Z",
      openedBy: "Direction",
      activities: initialActivities,
      indicators: initialIndicators,
      totalBudget,
    }];
  }, [initialActivities, initialIndicators]);

  const [selectedPTAId, setSelectedPTAId] = useState(ptaList[0]?.id || "");
  const selectedPTA = ptaList.find(p => p.id === selectedPTAId) || ptaList[0];
  const selectedCDP = mockCDPs.find(c => c.id === selectedCDPId) || mockCDPs[0];

  // Filtrage des projets
  const filteredProjects = useMemo(() => {
    return mockProjects.filter(p => {
      if (selectedRegion !== "all" && p.region !== selectedRegion) return false;
      if (selectedServiceId !== "all" && p.serviceResponsableId !== selectedServiceId) return false;
      if (selectedProjectId !== "all" && p.id !== selectedProjectId) return false;
      return true;
    });
  }, [selectedRegion, selectedServiceId, selectedProjectId]);

  // CDP data pour le dashboard
  const cdpYears = selectedCDP ? [selectedCDP.startYear, selectedCDP.startYear + 1, selectedCDP.startYear + 2] : [];
  const cdpFiches = mockCDPFichesSuivi.filter(f => {
    const eval_ = mockCDPEvaluations.find(e => e.id === f.evaluationId);
    return eval_?.year === selectedCDPYear && eval_?.cdpId === selectedCDPId;
  });
  const cdpFichesWithData = cdpFiches.filter(f => f.currentValue !== undefined);
  const cdpAvgPerformance = cdpFichesWithData.length > 0 
    ? Math.round(cdpFichesWithData.reduce((acc, f) => acc + (f.performanceRate || 0), 0) / cdpFichesWithData.length)
    : 0;
  const cdpAtteints = cdpFichesWithData.filter(f => (f.performanceRate || 0) >= 100).length;
  const cdpEnProgres = cdpFichesWithData.filter(f => (f.performanceRate || 0) >= 80 && (f.performanceRate || 0) < 100).length;
  const cdpEnRetard = cdpFichesWithData.filter(f => (f.performanceRate || 0) < 80).length;

  // Performance par catégorie pour radar
  const performanceByCategorie = mockCDPCategories.map(cat => {
    const catComposantes = mockCDPComposantes.filter(c => c.categorieId === cat.id);
    const catFiches = cdpFichesWithData.filter(f => catComposantes.some(c => c.id === f.composanteId));
    const avgPerf = catFiches.length > 0 
      ? Math.round(catFiches.reduce((acc, f) => acc + (f.performanceRate || 0), 0) / catFiches.length)
      : 0;
    return { category: cat.name, performance: avgPerf, fullMark: 100 };
  });

  // Performance par composante
  const performanceByComposante = mockCDPComposantes.map(comp => {
    const compFiches = cdpFichesWithData.filter(f => f.composanteId === comp.id);
    const avgPerf = compFiches.length > 0 
      ? Math.round(compFiches.reduce((acc, f) => acc + (f.performanceRate || 0), 0) / compFiches.length)
      : 0;
    return { name: comp.name.length > 20 ? comp.name.substring(0, 20) + "..." : comp.name, fullName: comp.name, performance: avgPerf, count: compFiches.length };
  }).filter(c => c.count > 0);

  // Données pour le pie chart des statuts CDP
  const cdpStatusData = [
    { name: "Atteints", value: cdpAtteints, color: "#10b981" },
    { name: "En progression", value: cdpEnProgres, color: "#f59e0b" },
    { name: "En retard", value: cdpEnRetard, color: "#ef4444" },
  ].filter(s => s.value > 0);

  // Stats générales
  const totalProjects = filteredProjects.length;
  const totalActivities = filteredProjects.reduce((sum, p) => sum + (p.activities?.length || 0), 0);
  const totalBudget = selectedPTA?.totalBudget || 0;
  const tauxExecution = 89;
  const totalIndicators = filteredProjects.reduce((sum, p) => sum + (p.indicators?.length || 0), 0);
  const completedActivities = Math.floor(totalActivities * 0.72);
  const inProgressActivities = Math.floor(totalActivities * 0.18);
  const pendingActivities = totalActivities - completedActivities - inProgressActivities;

  const formatBudget = (amount: number) => {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} Mds`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} M`;
    return amount.toLocaleString("fr-FR");
  };

  // ===== DONNÉES POUR REPORTING =====
  const projectsReportData = useMemo(() => {
    const byStatus = {
      en_cours: filteredProjects.filter(p => p.status === "en_cours").length,
      termine: filteredProjects.filter(p => p.status === "termine").length,
      retard: filteredProjects.filter(p => p.status === "retard").length,
      planifie: filteredProjects.filter(p => p.status === "planifie").length,
    };
    const byRegion = REGIONS.filter(r => r !== "National").map(region => {
      const regionProjects = filteredProjects.filter(p => p.region === region);
      const budget = regionProjects.reduce((sum, p) => sum + p.budget, 0);
      const spent = regionProjects.reduce((sum, p) => sum + (p.spent || 0), 0);
      const avgProgress = regionProjects.length > 0 ? Math.round(regionProjects.reduce((sum, p) => sum + p.progress, 0) / regionProjects.length) : 0;
      return { region, count: regionProjects.length, budget, spent, avgProgress };
    }).filter(r => r.count > 0);
    const bailleurMap: Record<string, { count: number; budget: number; spent: number }> = {};
    filteredProjects.forEach(p => {
      const bailleur = p.bailleur || "Non défini";
      if (!bailleurMap[bailleur]) bailleurMap[bailleur] = { count: 0, budget: 0, spent: 0 };
      bailleurMap[bailleur].count++;
      bailleurMap[bailleur].budget += p.budget;
      bailleurMap[bailleur].spent += p.spent || 0;
    });
    const byBailleur = Object.entries(bailleurMap).map(([name, data]) => ({ name, ...data, execution: data.budget > 0 ? Math.round((data.spent / data.budget) * 100) : 0 })).sort((a, b) => b.budget - a.budget);
    const sortedByProgress = [...filteredProjects].sort((a, b) => b.progress - a.progress);
    const topProjects = sortedByProgress.slice(0, 5);
    const bottomProjects = sortedByProgress.slice(-5).reverse();
    const criticalProjects = filteredProjects.filter(p => p.status === "retard" || p.progress < 30);
    const totalBudget = filteredProjects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = filteredProjects.reduce((sum, p) => sum + (p.spent || 0), 0);
    const avgProgress = filteredProjects.length > 0 ? Math.round(filteredProjects.reduce((sum, p) => sum + p.progress, 0) / filteredProjects.length) : 0;
    const executionRate = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    return { byStatus, byRegion, byBailleur, topProjects, bottomProjects, criticalProjects, totalBudget, totalSpent, avgProgress, executionRate };
  }, [filteredProjects]);

  const ptaReportData = useMemo(() => {
    const allActivities = filteredProjects.flatMap(p => (p.activities || []).map(a => ({ ...a, projectName: p.name, projectRegion: p.region })));
    const byNature: Record<string, { count: number; budget: number; termine: number }> = {};
    const byQuarter = { T1: { count: 0, budget: 0 }, T2: { count: 0, budget: 0 }, T3: { count: 0, budget: 0 }, T4: { count: 0, budget: 0 } };
    allActivities.forEach(a => {
      const nature = a.nature || "Autre";
      if (!byNature[nature]) byNature[nature] = { count: 0, budget: 0, termine: 0 };
      byNature[nature].count++;
      byNature[nature].budget += a.budget || 0;
      if (a.status === "termine") byNature[nature].termine++;
      const startMonth = new Date(a.startDate).getMonth();
      if (startMonth < 3) { byQuarter.T1.count++; byQuarter.T1.budget += a.budget || 0; }
      else if (startMonth < 6) { byQuarter.T2.count++; byQuarter.T2.budget += a.budget || 0; }
      else if (startMonth < 9) { byQuarter.T3.count++; byQuarter.T3.budget += a.budget || 0; }
      else { byQuarter.T4.count++; byQuarter.T4.budget += a.budget || 0; }
    });
    const byStatus = { planifie: allActivities.filter(a => a.status === "planifie").length, en_cours: allActivities.filter(a => a.status === "en_cours").length, termine: allActivities.filter(a => a.status === "termine").length, annule: allActivities.filter(a => a.status === "annule").length };
    const projectMap: Record<string, { count: number; termine: number; budget: number }> = {};
    allActivities.forEach(a => {
      const pName = a.projectName;
      if (!projectMap[pName]) projectMap[pName] = { count: 0, termine: 0, budget: 0 };
      projectMap[pName].count++;
      projectMap[pName].budget += a.budget || 0;
      if (a.status === "termine") projectMap[pName].termine++;
    });
    const byProject = Object.entries(projectMap).map(([name, data]) => ({ name: name.length > 25 ? name.substring(0, 25) + "..." : name, fullName: name, ...data, tauxExecution: data.count > 0 ? Math.round((data.termine / data.count) * 100) : 0 })).sort((a, b) => b.budget - a.budget);
    const criticalActivities = allActivities.filter(a => a.status === "en_cours" && (a.progress || 0) < 30).slice(0, 10);
    const totalBudget = allActivities.reduce((sum, a) => sum + (a.budget || 0), 0);
    const budgetTermine = allActivities.filter(a => a.status === "termine").reduce((sum, a) => sum + (a.budget || 0), 0);
    return { total: allActivities.length, allActivities, byNature: Object.entries(byNature).map(([name, data]) => ({ name, ...data, tauxExecution: data.count > 0 ? Math.round((data.termine / data.count) * 100) : 0 })).sort((a, b) => b.budget - a.budget), byQuarter: Object.entries(byQuarter).map(([quarter, data]) => ({ quarter, ...data })), byStatus, byProject, criticalActivities, totalBudget, budgetTermine, tauxExecution: byStatus.planifie + byStatus.en_cours + byStatus.termine > 0 ? Math.round((byStatus.termine / (byStatus.planifie + byStatus.en_cours + byStatus.termine)) * 100) : 0 };
  }, [filteredProjects]);

  const cdpReportData = useMemo(() => {
    const selectedCDPLocal = mockCDPs.find(c => c.id === selectedCDPId);
    if (!selectedCDPLocal) return null;
    const cdpEvaluations = mockCDPEvaluations.filter(e => e.cdpId === selectedCDPId);
    const cdpFichesLocal = mockCDPFichesSuivi.filter(f => cdpEvaluations.some(e => e.id === f.evaluationId));
    const byYear = [selectedCDPLocal.startYear, selectedCDPLocal.startYear + 1, selectedCDPLocal.startYear + 2].map(year => {
      const yearEval = cdpEvaluations.find(e => e.year === year);
      const yearFiches = cdpFichesLocal.filter(f => f.evaluationId === yearEval?.id);
      const fichesWithData = yearFiches.filter(f => f.currentValue !== undefined);
      const avgPerf = fichesWithData.length > 0 ? Math.round(fichesWithData.reduce((sum, f) => sum + (f.performanceRate || 0), 0) / fichesWithData.length) : 0;
      const atteints = fichesWithData.filter(f => (f.performanceRate || 0) >= 100).length;
      const enCours = fichesWithData.filter(f => (f.performanceRate || 0) >= 80 && (f.performanceRate || 0) < 100).length;
      const enRetard = fichesWithData.filter(f => (f.performanceRate || 0) < 80).length;
      return { year, performance: avgPerf, count: yearFiches.length, fichesWithData: fichesWithData.length, atteints, enCours, enRetard };
    });
    const byCategorie = mockCDPCategories.map(cat => {
      const catComposantes = mockCDPComposantes.filter(c => c.categorieId === cat.id);
      const catFiches = cdpFichesLocal.filter(f => catComposantes.some(c => c.id === f.composanteId) && f.currentValue !== undefined);
      const avgPerf = catFiches.length > 0 ? Math.round(catFiches.reduce((sum, f) => sum + (f.performanceRate || 0), 0) / catFiches.length) : 0;
      const atteints = catFiches.filter(f => (f.performanceRate || 0) >= 100).length;
      const enRetard = catFiches.filter(f => (f.performanceRate || 0) < 80).length;
      return { id: cat.id, name: cat.name, code: cat.code, performance: avgPerf, count: catFiches.length, atteints, enRetard, composantes: [] };
    }).filter(c => c.count > 0);
    const fichesWithData = cdpFichesLocal.filter(f => f.currentValue !== undefined);
    const criticalIndicators = fichesWithData.filter(f => (f.performanceRate || 0) < 50).sort((a, b) => (a.performanceRate || 0) - (b.performanceRate || 0)).slice(0, 10);
    const topPerformers = fichesWithData.filter(f => (f.performanceRate || 0) >= 100).sort((a, b) => (b.performanceRate || 0) - (a.performanceRate || 0)).slice(0, 10);
    const avgPerformance = fichesWithData.length > 0 ? Math.round(fichesWithData.reduce((sum, f) => sum + (f.performanceRate || 0), 0) / fichesWithData.length) : 0;
    const atteints = fichesWithData.filter(f => (f.performanceRate || 0) >= 100).length;
    const enCours = fichesWithData.filter(f => (f.performanceRate || 0) >= 80 && (f.performanceRate || 0) < 100).length;
    const enRetard = fichesWithData.filter(f => (f.performanceRate || 0) < 80).length;
    return { cdp: selectedCDPLocal, byYear, byCategorie, avgPerformance, totalIndicateurs: selectedCDPLocal.indicateurs.length, fichesRenseignees: fichesWithData.length, atteints, enCours, enRetard, criticalIndicators, topPerformers };
  }, [selectedCDPId]);

  const deliverablesReportData = useMemo(() => {
    const allDeliverables: Array<{ name: string; projectName: string; activityName: string; unit: string; target: number; current: number; performance: number }> = [];
    filteredProjects.forEach(project => {
      project.activities?.forEach(activity => {
        activity.deliverables?.forEach((del, idx) => {
          const target = del.targetValue || 0;
          const current = del.currentValue || Math.round(target * (0.5 + Math.random() * 0.5));
          allDeliverables.push({ name: del.name || `Livrable ${idx + 1}`, projectName: project.name, activityName: activity.name, unit: del.uniteMesure?.name || del.unit || "unité", target, current, performance: target > 0 ? Math.round((current / target) * 100) : 0 });
        });
      });
    });
    const completed = allDeliverables.filter(d => d.performance >= 100).length;
    const inProgress = allDeliverables.filter(d => d.performance >= 50 && d.performance < 100).length;
    const delayed = allDeliverables.filter(d => d.performance < 50).length;
    const projectMap: Record<string, { count: number; completed: number; avgPerf: number }> = {};
    allDeliverables.forEach(d => {
      if (!projectMap[d.projectName]) projectMap[d.projectName] = { count: 0, completed: 0, avgPerf: 0 };
      projectMap[d.projectName].count++;
      if (d.performance >= 100) projectMap[d.projectName].completed++;
    });
    Object.keys(projectMap).forEach(key => {
      const prjDeliverables = allDeliverables.filter(d => d.projectName === key);
      projectMap[key].avgPerf = prjDeliverables.length > 0 ? Math.round(prjDeliverables.reduce((sum, d) => sum + d.performance, 0) / prjDeliverables.length) : 0;
    });
    const byProject = Object.entries(projectMap).map(([name, data]) => ({ name: name.length > 25 ? name.substring(0, 25) + "..." : name, fullName: name, ...data, tauxLivraison: data.count > 0 ? Math.round((data.completed / data.count) * 100) : 0 })).sort((a, b) => b.count - a.count);
    const sortedByPerf = [...allDeliverables].sort((a, b) => b.performance - a.performance);
    const topDeliverables = sortedByPerf.slice(0, 5);
    const bottomDeliverables = sortedByPerf.slice(-5).reverse();
    const unitMap: Record<string, { count: number; completed: number }> = {};
    allDeliverables.forEach(d => { if (!unitMap[d.unit]) unitMap[d.unit] = { count: 0, completed: 0 }; unitMap[d.unit].count++; if (d.performance >= 100) unitMap[d.unit].completed++; });
    const byUnit = Object.entries(unitMap).map(([unit, data]) => ({ unit, ...data, tauxLivraison: data.count > 0 ? Math.round((data.completed / data.count) * 100) : 0 })).sort((a, b) => b.count - a.count);
    return { deliverables: allDeliverables, total: allDeliverables.length, completed, inProgress, delayed, byProject, byUnit, topDeliverables, bottomDeliverables, avgPerformance: allDeliverables.length > 0 ? Math.round(allDeliverables.reduce((sum, d) => sum + d.performance, 0) / allDeliverables.length) : 0, tauxLivraison: allDeliverables.length > 0 ? Math.round((completed / allDeliverables.length) * 100) : 0 };
  }, [filteredProjects]);

  const budgetReportData = useMemo(() => {
    const byProject = filteredProjects.map(p => ({ name: p.name.length > 20 ? p.name.substring(0, 20) + "..." : p.name, fullName: p.name, region: p.region, budget: p.budget, spent: p.spent || 0, disponible: p.budget - (p.spent || 0), execution: p.budget > 0 ? Math.round(((p.spent || 0) / p.budget) * 100) : 0 })).sort((a, b) => b.budget - a.budget);
    const byRegion = REGIONS.filter(r => r !== "National").map(region => { const regionProjects = filteredProjects.filter(p => p.region === region); const budget = regionProjects.reduce((sum, p) => sum + p.budget, 0); const spent = regionProjects.reduce((sum, p) => sum + (p.spent || 0), 0); return { region, budget, spent, disponible: budget - spent, execution: budget > 0 ? Math.round((spent / budget) * 100) : 0, projectCount: regionProjects.length }; }).filter(r => r.budget > 0).sort((a, b) => b.budget - a.budget);
    const bailleurMap: Record<string, { budget: number; spent: number }> = {};
    filteredProjects.forEach(p => { const bailleur = p.bailleur || "Non défini"; if (!bailleurMap[bailleur]) bailleurMap[bailleur] = { budget: 0, spent: 0 }; bailleurMap[bailleur].budget += p.budget; bailleurMap[bailleur].spent += p.spent || 0; });
    const byBailleur = Object.entries(bailleurMap).map(([name, data]) => ({ name, ...data, disponible: data.budget - data.spent, execution: data.budget > 0 ? Math.round((data.spent / data.budget) * 100) : 0 })).sort((a, b) => b.budget - a.budget);
    const projectsUnderExecution = byProject.filter(p => p.execution < 50);
    const projectsOverExecution = byProject.filter(p => p.execution > 90);
    const totalBudgetLocal = filteredProjects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = filteredProjects.reduce((sum, p) => sum + (p.spent || 0), 0);
    const totalDisponible = totalBudgetLocal - totalSpent;
    const globalExecution = totalBudgetLocal > 0 ? Math.round((totalSpent / totalBudgetLocal) * 100) : 0;
    return { byProject, byRegion, byBailleur, projectsUnderExecution, projectsOverExecution, totalBudget: totalBudgetLocal, totalSpent, totalDisponible, globalExecution };
  }, [filteredProjects]);

  const indicateursReportData = useMemo(() => {
    const allIndicators = filteredProjects.flatMap(p => (p.indicators || []).map(ind => ({ ...ind, projectName: p.name, projectRegion: p.region, performance: ind.targetValue > 0 ? Math.round((ind.currentValue / ind.targetValue) * 100) : 0 })));
    const byType = { quantitatif: allIndicators.filter(i => i.type === "quantitatif").length, qualitatif: allIndicators.filter(i => i.type === "qualitatif").length };
    const projectMap: Record<string, { count: number; avgPerf: number; atteints: number }> = {};
    allIndicators.forEach(ind => { if (!projectMap[ind.projectName]) projectMap[ind.projectName] = { count: 0, avgPerf: 0, atteints: 0 }; projectMap[ind.projectName].count++; if (ind.performance >= 100) projectMap[ind.projectName].atteints++; });
    Object.keys(projectMap).forEach(key => { const prjIndicators = allIndicators.filter(i => i.projectName === key); projectMap[key].avgPerf = prjIndicators.length > 0 ? Math.round(prjIndicators.reduce((sum, i) => sum + i.performance, 0) / prjIndicators.length) : 0; });
    const byProject = Object.entries(projectMap).map(([name, data]) => ({ name: name.length > 25 ? name.substring(0, 25) + "..." : name, fullName: name, ...data, tauxAtteinte: data.count > 0 ? Math.round((data.atteints / data.count) * 100) : 0 })).sort((a, b) => b.count - a.count);
    const sortedByPerf = [...allIndicators].sort((a, b) => a.performance - b.performance);
    const criticalIndicators = sortedByPerf.filter(i => i.performance < 50).slice(0, 10);
    const topIndicators = sortedByPerf.reverse().filter(i => i.performance >= 100).slice(0, 10);
    const atteints = allIndicators.filter(i => i.performance >= 100).length;
    const enCours = allIndicators.filter(i => i.performance >= 80 && i.performance < 100).length;
    const enRetard = allIndicators.filter(i => i.performance < 80).length;
    const avgPerformance = allIndicators.length > 0 ? Math.round(allIndicators.reduce((sum, i) => sum + i.performance, 0) / allIndicators.length) : 0;
    return { indicators: allIndicators, total: allIndicators.length, byType, byProject, criticalIndicators, topIndicators, atteints, enCours, enRetard, avgPerformance, tauxAtteinte: allIndicators.length > 0 ? Math.round((atteints / allIndicators.length) * 100) : 0 };
  }, [filteredProjects]);

  // Export functions
  const getAppliedFilters = useCallback(() => {
    const filters: { label: string; value: string }[] = [
      { label: "Année", value: selectedYear },
      { label: "Période", value: selectedPeriod === "annuel" ? "Annuel" : selectedPeriod === "cumul" ? "Cumulé T1→T4" : selectedPeriod },
    ];
    if (mainTab !== "cdp") {
      filters.push({ label: "Région", value: selectedRegion === "all" ? "Toutes" : selectedRegion });
      if (selectedServiceId !== "all") {
        const srv = getServiceById(selectedServiceId);
        filters.push({ label: "Service", value: srv ? `${srv.code} — ${srv.nom}` : selectedServiceId });
      }
      if (selectedProjectId !== "all") {
        const project = mockProjects.find(p => p.id === selectedProjectId);
        filters.push({ label: "Projet", value: project?.name || selectedProjectId });
      }
      if (mainTab === "pta" && selectedOperationId !== "all") {
        filters.push({ label: "Opération", value: selectedOperationId });
      }
    } else {
      const cdp = mockCDPs.find(c => c.id === selectedCDPId);
      if (cdp) filters.push({ label: "CDP", value: cdp.name });
    }
    return filters;
  }, [mainTab, selectedYear, selectedPeriod, selectedRegion, selectedServiceId, selectedOperationId, selectedProjectId, selectedCDPId]);

  const getReportConfig = useCallback((): ReportConfig => {
    const filters = getAppliedFilters();
    const periodLabel = selectedPeriod === "annuel" ? `Année ${selectedYear}` : `${selectedPeriod} ${selectedYear}`;
    const baseConfig = { headerSettings };

    const reportTypeMap: Record<MainTab, ReportConfig> = {
      global: {
        ...baseConfig,
        title: "Situation globale OFOR",
        subtitle: "Performance globale pluriannuelle",
        period: periodLabel,
        filters,
        kpis: [
          { label: "Projets", value: filteredProjects.length },
          { label: "Budget exécuté", value: formatBudget(projectsReportData.totalSpent) + " FCFA", color: "green" },
          { label: "Taux exéc.", value: `${projectsReportData.executionRate}%` },
        ],
        columns: [
          { key: "name", header: "Projet", width: "35%" },
          { key: "region", header: "Région", width: "15%" },
          { key: "budget", header: "Budget", width: "20%", align: "right", format: "budget" },
          { key: "spent", header: "Exécuté", width: "20%", align: "right", format: "budget" },
          { key: "progress", header: "Avance.", width: "10%", align: "center", format: "percent" },
        ],
        data: filteredProjects.map(p => ({ name: p.name, region: p.region, budget: p.budget, spent: p.spent || 0, progress: p.progress })),
        totals: { budget: projectsReportData.totalBudget, spent: projectsReportData.totalSpent },
      },
      avancement: { 
        ...baseConfig, 
        title: "Avancement des Projets", 
        subtitle: "Suivi de l'avancement et de la performance des projets", 
        period: periodLabel, 
        filters, 
        kpis: [
          { label: "Total Projets", value: filteredProjects.length }, 
          { label: "Terminés", value: projectsReportData.byStatus.termine, color: "green" }, 
          { label: "En cours", value: projectsReportData.byStatus.en_cours, color: "blue" }, 
          { label: "En retard", value: projectsReportData.byStatus.retard, color: "red" },
          { label: "Avancement moy.", value: `${projectsReportData.avgProgress}%` },
          { label: "Taux exécution", value: `${projectsReportData.executionRate}%` },
        ],
        summaries: [
          {
            title: "Répartition par statut",
            items: [
              { label: "Terminés", value: projectsReportData.byStatus.termine.toString(), color: "green" },
              { label: "En cours", value: projectsReportData.byStatus.en_cours.toString(), color: "blue" },
              { label: "En retard", value: projectsReportData.byStatus.retard.toString(), color: "red" },
              { label: "Planifiés", value: projectsReportData.byStatus.planifie.toString() },
            ]
          },
          {
            title: "Synthèse budgétaire globale",
            items: [
              { label: "Budget total", value: formatBudget(projectsReportData.totalBudget) + " FCFA" },
              { label: "Dépensé", value: formatBudget(projectsReportData.totalSpent) + " FCFA", color: "green" },
              { label: "Disponible", value: formatBudget(projectsReportData.totalBudget - projectsReportData.totalSpent) + " FCFA", color: "amber" },
              { label: "Taux d'exécution", value: `${projectsReportData.executionRate}%` },
            ]
          },
        ],
        executionData: {
          globalRate: projectsReportData.executionRate,
          budgetTotal: projectsReportData.totalBudget,
          budgetSpent: projectsReportData.totalSpent,
          budgetAvailable: projectsReportData.totalBudget - projectsReportData.totalSpent,
        },
        breakdowns: [
          {
            title: "Budget par région",
            columns: [
              { key: "region", header: "Région", width: "20%" },
              { key: "count", header: "Projets", width: "10%", align: "center" },
              { key: "budget", header: "Budget", width: "20%", align: "right", format: "budget" },
              { key: "spent", header: "Dépensé", width: "20%", align: "right", format: "budget" },
              { key: "avgProgress", header: "Avancement", width: "15%", align: "center", format: "percent" },
            ],
            data: projectsReportData.byRegion,
          },
          {
            title: "Budget par bailleur",
            columns: [
              { key: "name", header: "Bailleur", width: "25%" },
              { key: "count", header: "Projets", width: "10%", align: "center" },
              { key: "budget", header: "Budget", width: "20%", align: "right", format: "budget" },
              { key: "spent", header: "Dépensé", width: "20%", align: "right", format: "budget" },
              { key: "execution", header: "Exécution", width: "15%", align: "center", format: "percent" },
            ],
            data: projectsReportData.byBailleur,
          },
          {
            title: "Indicateurs par projet",
            columns: [
              { key: "fullName", header: "Projet", width: "35%" },
              { key: "count", header: "Indicateurs", width: "15%", align: "center" },
              { key: "atteints", header: "Atteints", width: "15%", align: "center" },
              { key: "avgPerf", header: "Perf. moy.", width: "15%", align: "center", format: "percent" },
              { key: "tauxAtteinte", header: "Taux atteinte", width: "15%", align: "center", format: "percent" },
            ],
            data: indicateursReportData.byProject,
          },
        ],
        columns: [
          { key: "name", header: "Projet", width: "25%" }, 
          { key: "region", header: "Région", width: "10%" }, 
          { key: "bailleur", header: "Bailleur", width: "12%" },
          { key: "budget", header: "Budget", width: "13%", align: "right", format: "budget" }, 
          { key: "spent", header: "Dépensé", width: "13%", align: "right", format: "budget" }, 
          { key: "progress", header: "Avance.", width: "10%", align: "center", format: "percent" }, 
          { key: "status", header: "Statut", width: "10%", align: "center" }
        ], 
        data: filteredProjects.map(p => ({ name: p.name, region: p.region, bailleur: p.bailleur || "-", budget: p.budget, spent: p.spent || 0, progress: p.progress, status: p.status })), 
        totals: { budget: projectsReportData.totalBudget, spent: projectsReportData.totalSpent } 
      },
      pta: (() => {
        // Construire les données des activités par projet avec détails trimestriels
        const activitiesByProject: Record<string, typeof selectedPTA.activities> = {};
        selectedPTA?.activities?.forEach(act => {
          const proj = act.project || "Sans projet";
          if (!activitiesByProject[proj]) activitiesByProject[proj] = [];
          activitiesByProject[proj].push(act);
        });

        // Générer les lignes du tableau activités avec détails trimestriels
        const activitiesQuarterlyData: Record<string, any>[] = [];
        Object.entries(activitiesByProject).forEach(([projectName, activities]) => {
          // Ligne header projet
          activitiesQuarterlyData.push({
            isProjectHeader: true,
            name: projectName,
            activityCount: activities.length,
          });
          
          // Lignes activités
          activities.forEach(act => {
            const realT1 = Math.round((act.budgetT1 || 0) * (0.7 + Math.random() * 0.3));
            const realT2 = Math.round((act.budgetT2 || 0) * (0.6 + Math.random() * 0.3));
            const realT3 = Math.round((act.budgetT3 || 0) * (0.5 + Math.random() * 0.3));
            const realT4 = Math.round((act.budgetT4 || 0) * (0.4 + Math.random() * 0.3));
            const totalPlan = (act.budgetT1 || 0) + (act.budgetT2 || 0) + (act.budgetT3 || 0) + (act.budgetT4 || 0);
            const totalReal = realT1 + realT2 + realT3 + realT4;
            const getPerc = (real: number, plan: number) => plan > 0 ? Math.round((real / plan) * 100) : 0;
            
            activitiesQuarterlyData.push({
              isProjectHeader: false,
              name: act.name,
              planT1: act.budgetT1 || 0,
              realT1,
              percT1: getPerc(realT1, act.budgetT1 || 0),
              planT2: act.budgetT2 || 0,
              realT2,
              percT2: getPerc(realT2, act.budgetT2 || 0),
              planT3: act.budgetT3 || 0,
              realT3,
              percT3: getPerc(realT3, act.budgetT3 || 0),
              planT4: act.budgetT4 || 0,
              realT4,
              percT4: getPerc(realT4, act.budgetT4 || 0),
              totalPlan,
              totalReal,
              totalPerc: getPerc(totalReal, totalPlan),
            });
          });
          
          // Ligne sous-total projet
          const projectTotals = {
            planT1: activities.reduce((sum, a) => sum + (a.budgetT1 || 0), 0),
            planT2: activities.reduce((sum, a) => sum + (a.budgetT2 || 0), 0),
            planT3: activities.reduce((sum, a) => sum + (a.budgetT3 || 0), 0),
            planT4: activities.reduce((sum, a) => sum + (a.budgetT4 || 0), 0),
            realT1: activities.reduce((sum, a) => sum + Math.round((a.budgetT1 || 0) * 0.85), 0),
            realT2: activities.reduce((sum, a) => sum + Math.round((a.budgetT2 || 0) * 0.75), 0),
            realT3: activities.reduce((sum, a) => sum + Math.round((a.budgetT3 || 0) * 0.65), 0),
            realT4: activities.reduce((sum, a) => sum + Math.round((a.budgetT4 || 0) * 0.55), 0),
          };
          const totalPlan = projectTotals.planT1 + projectTotals.planT2 + projectTotals.planT3 + projectTotals.planT4;
          const totalReal = projectTotals.realT1 + projectTotals.realT2 + projectTotals.realT3 + projectTotals.realT4;
          activitiesQuarterlyData.push({
            isSubtotal: true,
            name: `Sous-total ${projectName.length > 25 ? projectName.substring(0, 25) + "..." : projectName}`,
            ...projectTotals,
            totalPlan,
            totalReal,
            percT1: projectTotals.planT1 > 0 ? Math.round((projectTotals.realT1 / projectTotals.planT1) * 100) : 0,
            percT2: projectTotals.planT2 > 0 ? Math.round((projectTotals.realT2 / projectTotals.planT2) * 100) : 0,
            percT3: projectTotals.planT3 > 0 ? Math.round((projectTotals.realT3 / projectTotals.planT3) * 100) : 0,
            percT4: projectTotals.planT4 > 0 ? Math.round((projectTotals.realT4 / projectTotals.planT4) * 100) : 0,
            totalPerc: totalPlan > 0 ? Math.round((totalReal / totalPlan) * 100) : 0,
          });
        });

        // Générer les données des livrables par projet avec détails trimestriels
        const deliverablesByProject: Record<string, typeof deliverablesReportData.deliverables> = {};
        deliverablesReportData.deliverables.forEach(d => {
          if (!deliverablesByProject[d.projectName]) deliverablesByProject[d.projectName] = [];
          deliverablesByProject[d.projectName].push(d);
        });

        const deliverablesQuarterlyData: Record<string, any>[] = [];
        Object.entries(deliverablesByProject).forEach(([projectName, deliverables]) => {
          // Ligne header projet
          deliverablesQuarterlyData.push({
            isProjectHeader: true,
            name: projectName,
            deliverableCount: deliverables.length,
          });
          
          // Lignes livrables
          deliverables.forEach(d => {
            const targetPerQ = Math.ceil(d.target / 4);
            const t1Plan = targetPerQ;
            const t2Plan = targetPerQ;
            const t3Plan = targetPerQ;
            const t4Plan = Math.max(0, d.target - (t1Plan + t2Plan + t3Plan));
            const t1Real = Math.round(t1Plan * (0.7 + Math.random() * 0.4));
            const t2Real = Math.round(t2Plan * (0.6 + Math.random() * 0.4));
            const t3Real = Math.round(t3Plan * (0.5 + Math.random() * 0.4));
            const t4Real = Math.round(t4Plan * (0.4 + Math.random() * 0.4));
            const getPerc = (real: number, plan: number) => plan > 0 ? Math.round((real / plan) * 100) : 0;
            
            deliverablesQuarterlyData.push({
              isProjectHeader: false,
              name: d.name,
              unit: d.unit,
              planT1: t1Plan,
              realT1: t1Real,
              percT1: getPerc(t1Real, t1Plan),
              planT2: t2Plan,
              realT2: t2Real,
              percT2: getPerc(t2Real, t2Plan),
              planT3: t3Plan,
              realT3: t3Real,
              percT3: getPerc(t3Real, t3Plan),
              planT4: t4Plan,
              realT4: t4Real,
              percT4: getPerc(t4Real, t4Plan),
              totalTarget: d.target,
              totalCurrent: d.current,
              totalPerc: d.performance,
            });
          });
        });

        return { 
          ...baseConfig, 
          title: "Rapport PTA / Activités", 
          subtitle: "Suivi de l'exécution des activités du Plan de Travail Annuel", 
          period: periodLabel, 
          filters, 
          kpis: [
            { label: "Total Activités", value: ptaReportData.total }, 
            { label: "Terminées", value: ptaReportData.byStatus.termine, color: "green" }, 
            { label: "En cours", value: ptaReportData.byStatus.en_cours, color: "blue" }, 
            { label: "Planifiées", value: ptaReportData.byStatus.planifie },
            { label: "Taux exécution", value: `${ptaReportData.tauxExecution}%` },
            { label: "Budget total", value: formatBudget(ptaReportData.totalBudget) },
          ],
          summaries: [
            {
              title: "Répartition par statut",
              items: [
                { label: "Terminées", value: ptaReportData.byStatus.termine.toString(), color: "green" },
                { label: "En cours", value: ptaReportData.byStatus.en_cours.toString(), color: "blue" },
                { label: "Planifiées", value: ptaReportData.byStatus.planifie.toString() },
                { label: "Annulées", value: ptaReportData.byStatus.annule.toString(), color: "red" },
              ]
            },
            {
              title: "Synthèse budgétaire PTA",
              items: [
                { label: "Budget total", value: formatBudget(ptaReportData.totalBudget) + " FCFA" },
                { label: "Budget terminé", value: formatBudget(ptaReportData.budgetTermine) + " FCFA", color: "green" },
                { label: "Taux d'exécution", value: `${ptaReportData.tauxExecution}%`, color: ptaReportData.tauxExecution >= 80 ? "green" : "amber" },
              ]
            },
            {
              title: "Livrables",
              items: [
                { label: "Total livrables", value: deliverablesReportData.total.toString() },
                { label: "Atteints", value: deliverablesReportData.completed.toString(), color: "green" },
                { label: "En cours", value: deliverablesReportData.inProgress.toString(), color: "amber" },
                { label: "En retard", value: deliverablesReportData.delayed.toString(), color: "red" },
                { label: "Taux livraison", value: `${deliverablesReportData.tauxLivraison}%` },
              ]
            },
          ],
          executionData: {
            globalRate: ptaReportData.tauxExecution,
            budgetTotal: ptaReportData.totalBudget,
            budgetSpent: ptaReportData.budgetTermine,
            activitiesTotal: ptaReportData.total,
            activitiesCompleted: ptaReportData.byStatus.termine,
            deliverablesTotal: deliverablesReportData.total,
            deliverablesCompleted: deliverablesReportData.completed,
          },
          planningData: {
            byStatus: ptaReportData.byStatus,
            byPeriod: ptaReportData.byQuarter.map(q => ({
              period: q.quarter,
              planned: q.budget,
              realized: Math.round(q.budget * (ptaReportData.tauxExecution / 100)),
              rate: ptaReportData.tauxExecution
            })),
            byCategory: ptaReportData.byNature.map(n => ({
              name: n.name,
              count: n.count,
              budget: n.budget,
              realized: Math.round(n.budget * (n.tauxExecution / 100)),
              rate: n.tauxExecution
            })),
          },
          breakdowns: [
            {
              title: "Activités par nature",
              columns: [
                { key: "name", header: "Nature", width: "25%" },
                { key: "count", header: "Nombre", width: "12%", align: "center" },
                { key: "termine", header: "Terminées", width: "12%", align: "center" },
                { key: "budget", header: "Budget", width: "20%", align: "right", format: "budget" },
                { key: "tauxExecution", header: "Taux exec.", width: "15%", align: "center", format: "percent" },
              ],
              data: ptaReportData.byNature,
            },
            {
              title: "Activités par projet - Exécution trimestrielle (Budget en FCFA)",
              columns: [
                { key: "name", header: "Activité / Projet", width: "18%" },
                { key: "planT1", header: "T1 Plan.", width: "6%", align: "right", format: "budget" },
                { key: "realT1", header: "T1 Réal.", width: "6%", align: "right", format: "budget" },
                { key: "percT1", header: "T1 %", width: "4%", align: "center", format: "percent" },
                { key: "planT2", header: "T2 Plan.", width: "6%", align: "right", format: "budget" },
                { key: "realT2", header: "T2 Réal.", width: "6%", align: "right", format: "budget" },
                { key: "percT2", header: "T2 %", width: "4%", align: "center", format: "percent" },
                { key: "planT3", header: "T3 Plan.", width: "6%", align: "right", format: "budget" },
                { key: "realT3", header: "T3 Réal.", width: "6%", align: "right", format: "budget" },
                { key: "percT3", header: "T3 %", width: "4%", align: "center", format: "percent" },
                { key: "planT4", header: "T4 Plan.", width: "6%", align: "right", format: "budget" },
                { key: "realT4", header: "T4 Réal.", width: "6%", align: "right", format: "budget" },
                { key: "percT4", header: "T4 %", width: "4%", align: "center", format: "percent" },
                { key: "totalPlan", header: "Total Plan.", width: "7%", align: "right", format: "budget" },
                { key: "totalReal", header: "Total Réal.", width: "7%", align: "right", format: "budget" },
                { key: "totalPerc", header: "Perf.", width: "4%", align: "center", format: "percent" },
              ],
              data: activitiesQuarterlyData.filter(d => !d.isProjectHeader),
            },
            {
              title: "Livrables par projet - Exécution trimestrielle",
              columns: [
                { key: "name", header: "Livrable", width: "16%" },
                { key: "unit", header: "Unité", width: "5%", align: "center" },
                { key: "planT1", header: "T1 Prévu", width: "5%", align: "right", format: "number" },
                { key: "realT1", header: "T1 Réal.", width: "5%", align: "right", format: "number" },
                { key: "percT1", header: "T1 %", width: "4%", align: "center", format: "percent" },
                { key: "planT2", header: "T2 Prévu", width: "5%", align: "right", format: "number" },
                { key: "realT2", header: "T2 Réal.", width: "5%", align: "right", format: "number" },
                { key: "percT2", header: "T2 %", width: "4%", align: "center", format: "percent" },
                { key: "planT3", header: "T3 Prévu", width: "5%", align: "right", format: "number" },
                { key: "realT3", header: "T3 Réal.", width: "5%", align: "right", format: "number" },
                { key: "percT3", header: "T3 %", width: "4%", align: "center", format: "percent" },
                { key: "planT4", header: "T4 Prévu", width: "5%", align: "right", format: "number" },
                { key: "realT4", header: "T4 Réal.", width: "5%", align: "right", format: "number" },
                { key: "percT4", header: "T4 %", width: "4%", align: "center", format: "percent" },
                { key: "totalTarget", header: "Cible", width: "6%", align: "right", format: "number" },
                { key: "totalCurrent", header: "Réalisé", width: "6%", align: "right", format: "number" },
                { key: "totalPerc", header: "Perf.", width: "4%", align: "center", format: "percent" },
              ],
              data: deliverablesQuarterlyData.filter(d => !d.isProjectHeader),
            },
          ],
          columns: [
            { key: "name", header: "Activité", width: "25%" }, 
            { key: "projectName", header: "Projet", width: "18%" }, 
            { key: "nature", header: "Nature", width: "12%" }, 
            { key: "budget", header: "Budget", width: "15%", align: "right", format: "budget" }, 
            { key: "status", header: "Statut", width: "10%", align: "center" }
          ], 
          data: ptaReportData.allActivities.map(a => ({ name: a.name, projectName: a.projectName, nature: a.nature || "-", budget: a.budget, status: a.status })) 
        };
      })(),
      cdp: (() => {
        const cdpLocal = mockCDPs.find(c => c.id === selectedCDPId);
        if (!cdpLocal) return { ...baseConfig, title: "CDP", columns: [], data: [] };
        return { 
          ...baseConfig, 
          title: `Rapport CDP - ${cdpLocal.name}`, 
          subtitle: `Contrat de Performance ${cdpLocal.startYear} - ${cdpLocal.endYear}`, 
          period: periodLabel, 
          filters, 
          kpis: [
            { label: "Indicateurs", value: cdpReportData?.totalIndicateurs || 0 }, 
            { label: "Renseignés", value: cdpReportData?.fichesRenseignees || 0, color: "blue" },
            { label: "Atteints", value: cdpReportData?.atteints || 0, color: "green" },
            { label: "En progression", value: cdpReportData?.enCours || 0, color: "amber" },
            { label: "En retard", value: cdpReportData?.enRetard || 0, color: "red" },
            { label: "Performance moy.", value: `${cdpReportData?.avgPerformance || 0}%` }
          ],
          summaries: [
            {
              title: "Informations CDP",
              items: [
                { label: "Contrat", value: cdpLocal.name },
                { label: "Période", value: `${cdpLocal.startYear} - ${cdpLocal.endYear}` },
                { label: "Statut", value: cdpLocal.status },
                { label: "Catégories", value: mockCDPCategories.length.toString() },
              ]
            },
            {
              title: "Synthèse des indicateurs",
              items: [
                { label: "Total indicateurs", value: (cdpReportData?.totalIndicateurs || 0).toString() },
                { label: "Fiches renseignées", value: (cdpReportData?.fichesRenseignees || 0).toString(), color: "blue" },
                { label: "Performance moyenne", value: `${cdpReportData?.avgPerformance || 0}%`, color: (cdpReportData?.avgPerformance || 0) >= 80 ? "green" : "amber" },
              ]
            },
            {
              title: "Répartition par statut",
              items: [
                { label: "Atteints (≥100%)", value: (cdpReportData?.atteints || 0).toString(), color: "green" },
                { label: "En progression (80-99%)", value: (cdpReportData?.enCours || 0).toString(), color: "amber" },
                { label: "En retard (<80%)", value: (cdpReportData?.enRetard || 0).toString(), color: "red" },
              ]
            },
          ],
          breakdowns: [
            {
              title: "Performance par catégorie",
              columns: [
                { key: "name", header: "Catégorie", width: "35%" },
                { key: "count", header: "Indicateurs", width: "15%", align: "center" },
                { key: "atteints", header: "Atteints", width: "15%", align: "center" },
                { key: "enRetard", header: "En retard", width: "15%", align: "center" },
                { key: "performance", header: "Performance", width: "18%", align: "center", format: "percent" },
              ],
              data: cdpReportData?.byCategorie || [],
            },
            {
              title: "Évolution annuelle",
              columns: [
                { key: "year", header: "Année", width: "15%", align: "center" },
                { key: "count", header: "Indicateurs", width: "15%", align: "center" },
                { key: "fichesWithData", header: "Renseignés", width: "15%", align: "center" },
                { key: "atteints", header: "Atteints", width: "15%", align: "center" },
                { key: "enRetard", header: "En retard", width: "15%", align: "center" },
                { key: "performance", header: "Performance", width: "18%", align: "center", format: "percent" },
              ],
              data: cdpReportData?.byYear || [],
            },
            {
              title: "Performance par composante",
              columns: [
                { key: "fullName", header: "Composante", width: "50%" },
                { key: "count", header: "Indicateurs", width: "18%", align: "center" },
                { key: "performance", header: "Performance", width: "25%", align: "center", format: "percent" },
              ],
              data: performanceByComposante,
            },
          ],
          columns: [
            { key: "indicateurName", header: "Indicateur", width: "32%" }, 
            { key: "composanteName", header: "Composante", width: "18%" }, 
            { key: "unit", header: "Unité", width: "8%", align: "center" }, 
            { key: "baselineValue", header: "Base", width: "8%", align: "right", format: "number" }, 
          ], 
          data: cdpLocal.indicateurs.map(ind => ({ indicateurName: ind.indicateurName, composanteName: ind.composanteName, unit: ind.unit, baselineValue: ind.baselineValue })) 
        };
      })(),
    };

    return reportTypeMap[mainTab];
  }, [mainTab, filteredProjects, projectsReportData, ptaReportData, cdpReportData, deliverablesReportData, indicateursReportData, performanceByComposante, selectedYear, selectedPeriod, selectedCDPId, getAppliedFilters, headerSettings, totalProjects, totalActivities, totalIndicators, tauxExecution, cdpAvgPerformance, completedActivities, inProgressActivities, pendingActivities, formatBudget]);



  const handleExportPDF = useCallback(() => { 
    const config = getReportConfig(); 
    exportReportToPDF(config); 
    toast({ title: "Export PDF", description: "Le rapport PDF est en cours de génération..." }); 
  }, [getReportConfig, toast]);

  const handleExportExcel = useCallback(() => { 
    const config = getReportConfig(); 
    exportReportToExcel(config); 
    toast({ title: "Export Excel", description: "Le fichier Excel a été téléchargé" }); 
  }, [getReportConfig, toast]);

  const handleExportConsolidatedPDF = useCallback(() => {
    // Génère séquentiellement les 3 PDFs (un fichier par onglet)
    const tabs: MainTab[] = ["avancement", "pta", "cdp"];
    const original = mainTab;
    tabs.forEach((t, i) => {
      setTimeout(() => {
        setMainTab(t);
        setTimeout(() => {
          exportReportToPDF(getReportConfig());
          if (i === tabs.length - 1) {
            setTimeout(() => setMainTab(original), 400);
          }
        }, 250);
      }, i * 800);
    });
    toast({ title: "Export consolidé", description: "Génération des 3 rapports (Projets, PTA, CDP)…" });
  }, [getReportConfig, mainTab, toast]);

  const handleExportConsolidatedExcel = useCallback(() => {
    const tabs: MainTab[] = ["avancement", "pta", "cdp"];
    const original = mainTab;
    tabs.forEach((t, i) => {
      setTimeout(() => {
        setMainTab(t);
        setTimeout(() => {
          exportReportToExcel(getReportConfig());
          if (i === tabs.length - 1) {
            setTimeout(() => setMainTab(original), 400);
          }
        }, 250);
      }, i * 800);
    });
    toast({ title: "Export Excel consolidé", description: "Génération des 3 fichiers (Projets, PTA, CDP)…" });
  }, [getReportConfig, mainTab, toast]);

  const handlePrint = useCallback(() => { 
    const config = getReportConfig(); 
    printReport(config); 
  }, [getReportConfig]);

  const getViewModeForReporting = (): "graphique" | "tableau" => {
    if (viewMode === "combine") return "graphique";
    return viewMode;
  };

  return (
    <DashboardLayout title="Tableau de bord" subtitle="Vue d'ensemble et reporting des projets OFOR">
      <div className="space-y-3 animate-fade-in">
        {/* Header avec onglets et actions */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)}>
              <TabsList className="h-9">
                <TabsTrigger value="global" className="text-xs gap-1"><BarChart3 className="w-3.5 h-3.5" /> Situation OFOR</TabsTrigger>
                <TabsTrigger value="avancement" className="text-xs gap-1"><FolderKanban className="w-3.5 h-3.5" /> Avancement des projets</TabsTrigger>
                <TabsTrigger value="pta" className="text-xs gap-1"><Calendar className="w-3.5 h-3.5" /> Suivi PTA</TabsTrigger>
                <TabsTrigger value="cdp" className="text-xs gap-1"><Target className="w-3.5 h-3.5" /> Suivi CDP</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5" /> Imprimer
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleExportExcel}>
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </Button>
              <Button size="sm" className="h-8 text-xs gap-1" onClick={handleExportPDF}>
                <Download className="w-3.5 h-3.5" /> PDF
              </Button>
              <div className="h-5 w-px bg-border mx-1" />
              <Button variant="secondary" size="sm" className="h-8 text-xs gap-1" onClick={handleExportConsolidatedExcel} title="Excel consolidé (Projets + PTA + CDP)">
                <Layers className="w-3.5 h-3.5" /> Excel consolidé
              </Button>
              <Button variant="secondary" size="sm" className="h-8 text-xs gap-1" onClick={handleExportConsolidatedPDF} title="PDF consolidé (Projets + PTA + CDP)">
                <Layers className="w-3.5 h-3.5" /> PDF consolidé
              </Button>
            </div>
          </div>

          {/* Filtres et modes de vue - adaptatifs selon l'onglet */}
          {mainTab !== "global" && (
          <Card className="py-2">
            <CardContent className="py-2 px-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Filtres:</span>
                </div>

                {/* Filtres pour Avancement des projets */}
                {mainTab === "avancement" && (
                  <>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="w-20 h-7 text-xs">
                        <SelectValue placeholder="Année" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger className="w-32 h-7 text-xs">
                        <SelectValue placeholder="Région" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes régions</SelectItem>
                        {REGIONS.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                      <SelectTrigger className="w-44 h-7 text-xs">
                        <SelectValue placeholder="Service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous services</SelectItem>
                        {mockServices.filter(s => s.actif).map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.code} — {s.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                      <SelectTrigger className="w-40 h-7 text-xs">
                        <SelectValue placeholder="Projet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous projets</SelectItem>
                        {mockProjects
                          .filter(p => selectedRegion === "all" || p.region === selectedRegion)
                          .filter(p => selectedServiceId === "all" || p.serviceResponsableId === selectedServiceId)
                          .map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </>
                )}

                {/* Filtres pour Suivi PTA */}
                {mainTab === "pta" && (
                  <>
                    {ptaList.length > 0 && (
                      <Select value={selectedPTAId} onValueChange={setSelectedPTAId}>
                        <SelectTrigger className="w-48 h-7 text-xs">
                          <SelectValue placeholder="PTA" />
                        </SelectTrigger>
                        <SelectContent>
                          {ptaList.map((pta) => (
                            <SelectItem key={pta.id} value={pta.id}>{pta.code} - {pta.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="w-24 h-7 text-xs">
                        <SelectValue placeholder="Période" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annuel">Annuel</SelectItem>
                        <SelectItem value="cumul">Cumulé</SelectItem>
                        <SelectItem value="T1">T1</SelectItem>
                        <SelectItem value="T2">T2</SelectItem>
                        <SelectItem value="T3">T3</SelectItem>
                        <SelectItem value="T4">T4</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Service en tête */}
                    <Select value={selectedServiceId} onValueChange={(v) => { setSelectedServiceId(v); setSelectedProjectId("all"); setSelectedOperationId("all"); }}>
                      <SelectTrigger className="w-44 h-7 text-xs">
                        <SelectValue placeholder="Service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous services</SelectItem>
                        {mockServices.filter(s => s.actif).map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.code} — {s.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Projet en cascade du service */}
                    <Select value={selectedProjectId} onValueChange={(v) => { setSelectedProjectId(v); if (v !== "all") setSelectedOperationId("all"); }}>
                      <SelectTrigger className="w-40 h-7 text-xs">
                        <SelectValue placeholder="Projet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous projets</SelectItem>
                        {mockProjects
                          .filter(p => selectedServiceId === "all" || p.serviceResponsableId === selectedServiceId)
                          .map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    {/* Opération en cascade du service */}
                    <Select value={selectedOperationId} onValueChange={(v) => { setSelectedOperationId(v); if (v !== "all") setSelectedProjectId("all"); }}>
                      <SelectTrigger className="w-40 h-7 text-xs">
                        <SelectValue placeholder="Opération" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes opérations</SelectItem>
                        {(() => {
                          const ops = Array.from(new Set(
                            (selectedPTA?.activities || [])
                              .filter(a => !!a.operationId)
                              .filter(a => selectedServiceId === "all" || a.serviceResponsableId === selectedServiceId)
                              .map(a => `${a.operationId}|||${a.operationName || a.operationId}`)
                          )).map(s => { const [id, name] = s.split("|||"); return { id, name }; });
                          return ops.map(o => <SelectItem key={o.id} value={o.id!}>{o.name}</SelectItem>);
                        })()}
                      </SelectContent>
                    </Select>

                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger className="w-32 h-7 text-xs">
                        <SelectValue placeholder="Région" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes régions</SelectItem>
                        {REGIONS.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}

                {mainTab === "cdp" && (
                  <span className="text-xs text-muted-foreground italic">Les filtres sont disponibles ci-dessous</span>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSelectedYear("2024");
                    setSelectedPeriod("annuel");
                    setSelectedRegion("all");
                    setSelectedServiceId("all");
                    setSelectedProjectId("all");
                    setSelectedOperationId("all");
                    if (mockCDPs.length > 0) {
                      setSelectedCDPId(mockCDPs[0].id);
                      setSelectedCDPYear(mockCDPs[0].startYear);
                    }
                    if (ptaList.length > 0) {
                      setSelectedPTAId(ptaList[0].id);
                    }
                  }}
                >
                  Réinitialiser
                </Button>

              </div>
            </CardContent>
          </Card>
          )}
        </div>

        {/* Contenu selon onglet */}
        {mainTab === "global" ? (
          <GlobalOFORTab headerSettings={headerSettings} />
        ) : mainTab === "avancement" ? (
          <ProjectsPerformanceTab
            filteredProjects={filteredProjects}
            headerSettings={headerSettings}
            filters={{
              year: parseInt(selectedYear),
              region: selectedRegion !== "all" ? selectedRegion : undefined,
              projectName: selectedProjectId !== "all" ? filteredProjects.find(p => p.id === selectedProjectId)?.name : undefined,
              serviceName: selectedServiceId !== "all" ? getServiceById(selectedServiceId)?.nom : undefined,
            }}
          />
        ) : mainTab === "pta" && selectedPTA ? (
          <PTADashboardTab
            pta={selectedPTA}
            selectedPeriod={selectedPeriod}
            selectedProjectId={selectedProjectId}
            selectedServiceId={selectedServiceId}
            selectedOperationId={selectedOperationId}
            headerSettings={headerSettings}
          />
        ) : mainTab === "cdp" && mockCDPs.length > 0 ? (
          <CDPDashboardTab 
            selectedCDPId={selectedCDPId}
            onCDPChange={setSelectedCDPId}
            selectedYear={selectedCDPYear}
            onYearChange={setSelectedCDPYear}
            headerSettings={headerSettings}
          />
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucune donnée disponible</h3>
              <p className="text-sm text-muted-foreground">Veuillez sélectionner un autre onglet ou modifier les filtres.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TableauDeBord;
