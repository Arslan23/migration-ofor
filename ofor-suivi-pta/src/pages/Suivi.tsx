import React, { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Wallet,
  BarChart3,
  ChevronRight,
  ArrowRight,
  Eye,
  Plus,
  Send,
  Lock,
  FolderOpen,
  Edit,
  FileDown,
  Package,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockProjects } from "@/data/mockProjects";
import { mockServices, getServiceById } from "@/data/entitesExecution";
import { mockOperations, getOperationById } from "@/data/operations";
import { generateStandalonePTAActivities } from "@/data/standalonePTAActivities";
import { mockPTARefs, getPTARefById, getOpenPTAs, getPTAForDate, PTARef } from "@/data/mockPTAs";
import { PTA, PTAActivity, PTAIndicatorPlanning, PTA_STATUS_LABELS } from "@/types/pta";
import { 
  FicheSuivi, 
  FicheSuiviStatus, 
  Collecte, 
  FicheIndicateur,
  Workflow, 
  DEFAULT_WORKFLOWS, 
  getWorkflowForNature, 
  calculateWorkflowProgress, 
  generateFicheSuiviCode,
  generateCollecteCode 
} from "@/types/workflow";
import FicheSuiviForm from "@/components/suivi/FicheSuiviForm";
import FicheIndicateurForm from "@/components/suivi/FicheIndicateurForm";
import IndicateurSuiviDetail from "@/components/suivi/IndicateurSuiviDetail";
import CollecteForm from "@/components/suivi/CollecteForm";
import ExportButtons from "@/components/ui/ExportButtons";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { 
  exportFicheActiviteEnrichieToPDF, 
  exportSuiviSyntheseToPDF,
  exportCollecteConsolideeToPDF,
  exportIndicateurSuiviDetailToPDF,
  FicheActiviteEnrichieExportData,
  SuiviSyntheseExportData,
  CollecteConsolideeExportData
} from "@/lib/exportFicheUtils";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Target, Briefcase } from "lucide-react";


// Générer les activités PTA depuis les projets
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
      for (let q = startQ; q <= endQ; q++) {
        trimestres.push(`T${q}`);
        budgetByQ[`T${q}` as keyof typeof budgetByQ] = budget / (endQ - startQ + 1);
      }
      const nature = activity.nature || 'travaux';
      const deliverables = (activity.deliverables || []).map((del, idx) => ({
        id: `del-${activity.id}-${idx}`,
        unit: del.uniteMesure?.name || del.unit || "",
        targetValue: del.targetValue,
        name: del.uniteMesure?.name || del.name || "",
      }));
      ptaActivities.push({
        id: `pta-${activity.id}`,
        activityId: activity.id,
        name: activity.name,
        project: project.name,
        projectId: project.id,
        budgetTotal: budget,
        budgetT1: budgetByQ.T1, budgetT2: budgetByQ.T2, budgetT3: budgetByQ.T3, budgetT4: budgetByQ.T4,
        deliverables, trimestres,
        responsable: activity.responsible || project.responsible,
        nature, description: activity.description,
      });
    });
  });
  return ptaActivities;
};

// Générer des collectes et fiches mock — couverture trimestrielle T1-T4 sur 2024-2026
const generateMockData = (activities: PTAActivity[]): { collectes: Collecte[], fiches: FicheSuivi[], fichesIndicateurs: FicheIndicateur[] } => {
  const collectes: Collecte[] = [];
  const fiches: FicheSuivi[] = [];
  const fichesIndicateurs: FicheIndicateur[] = [];
  
  const projectIds = [...new Set(activities.map(a => a.projectId))];
  
  // Périodes trimestrielles à couvrir : couvre 2024 (full), 2025 (full), 2026 (T1-T2 partiel)
  const periodes: { year: number; trimestre: "T1" | "T2" | "T3" | "T4"; date: string; status: "cloturee" | "en_cours"; ratio: number }[] = [
    { year: 2024, trimestre: "T1", date: "2024-03-25", status: "cloturee", ratio: 0.20 },
    { year: 2024, trimestre: "T2", date: "2024-06-25", status: "cloturee", ratio: 0.45 },
    { year: 2024, trimestre: "T3", date: "2024-09-25", status: "cloturee", ratio: 0.70 },
    { year: 2024, trimestre: "T4", date: "2024-12-20", status: "cloturee", ratio: 1.00 },
    { year: 2025, trimestre: "T1", date: "2025-03-25", status: "cloturee", ratio: 0.22 },
    { year: 2025, trimestre: "T2", date: "2025-06-25", status: "cloturee", ratio: 0.50 },
    { year: 2025, trimestre: "T3", date: "2025-09-25", status: "cloturee", ratio: 0.75 },
    { year: 2025, trimestre: "T4", date: "2025-12-20", status: "cloturee", ratio: 0.95 },
    { year: 2026, trimestre: "T1", date: "2026-03-25", status: "cloturee", ratio: 0.18 },
    { year: 2026, trimestre: "T2", date: "2026-06-15", status: "en_cours", ratio: 0.35 },
  ];
  
  projectIds.forEach((projectId) => {
    const projectActivities = activities.filter(a => a.projectId === projectId);
    const projectName = projectActivities[0]?.project || "";
    const projectCode = projectId.slice(0, 4).toUpperCase();
    const project = mockProjects.find(p => p.id === projectId);
    const projectIndicators = project?.indicators || [];
    
    periodes.forEach((periode, pIdx) => {
      const collecteId = `col-${projectId}-${periode.year}-${periode.trimestre}`;
      const dateCollecte = periode.date;
      const ptaId = getPTAForDate(dateCollecte)?.id || "pta-2026-1";
      
      const collecte: Collecte = {
        id: collecteId,
        code: generateCollecteCode(projectCode, dateCollecte),
        projectId,
        projectName,
        ptaId,
        dateCollecte,
        description: `Collecte ${periode.trimestre} ${periode.year}`,
        createdAt: dateCollecte,
        createdBy: "Admin",
        status: periode.status,
      };
      collectes.push(collecte);
      
      // Créer les fiches pour chaque activité du projet
      projectActivities.forEach((activity, aIdx) => {
        const workflow = getWorkflowForNature(activity.nature, DEFAULT_WORKFLOWS);
        const stepCount = workflow?.steps.length || 1;
        const stepIdx = Math.min(Math.floor(periode.ratio * stepCount), stepCount - 1);
        const currentStep = workflow?.steps[stepIdx];
        const progressPercentage = Math.min(100, Math.round(periode.ratio * 100));
        const depensesCumulees = Math.round(activity.budgetTotal * periode.ratio * 0.92);
        
        // Distribution variée des statuts
        let status: FicheSuiviStatus;
        if (periode.status === "cloturee") {
          status = (aIdx + pIdx) % 5 === 0 ? "valide" : "approuve";
        } else {
          const mod = (aIdx + pIdx) % 4;
          status = mod === 0 ? "brouillon" : mod === 1 ? "soumis" : mod === 2 ? "valide" : "approuve";
        }
        
        fiches.push({
          id: `fiche-${collecteId}-${activity.id}`,
          code: generateFicheSuiviCode(projectCode, activity.id.slice(0, 4).toUpperCase(), dateCollecte),
          collecteId,
          dateCollecte,
          projectId: activity.projectId,
          projectName: activity.project,
          activityId: activity.id,
          activityName: activity.name,
          budgetPrevu: activity.budgetTotal,
          depensesCumulees,
          workflowId: workflow?.id,
          workflowName: workflow?.name,
          currentStepId: currentStep?.id,
          currentStepName: currentStep?.name,
          progressPercentage,
          livrables: activity.deliverables.map(del => ({
            livrableId: del.id,
            livrableName: del.unit,
            unit: del.unit,
            targetValue: del.targetValue,
            currentValue: Math.round(del.targetValue * periode.ratio),
          })),
          status,
          responsable: activity.responsable,
          observations: pIdx === 0 ? "Démarrage conforme au planning" : pIdx === periodes.length - 1 ? "Avancement satisfaisant" : "",
          createdAt: dateCollecte,
          submittedAt: status !== "brouillon" ? dateCollecte : undefined,
          validatedAt: status === "valide" || status === "approuve" ? dateCollecte : undefined,
          approvedAt: status === "approuve" ? dateCollecte : undefined,
        });
      });
      
      // Créer la fiche indicateurs pour cette collecte
      if (projectIndicators.length > 0) {
        const indicStatus: FicheSuiviStatus = periode.status === "cloturee" ? "approuve" : (pIdx % 2 === 0 ? "soumis" : "brouillon");
        const previousRatio = pIdx > 0 ? periodes[pIdx - 1].ratio : 0;
        const ficheIndicateur: FicheIndicateur = {
          id: `fiche-ind-${collecteId}`,
          code: `FI-${projectCode}-${format(parseISO(dateCollecte), "yyyyMMdd")}`,
          collecteId,
          dateCollecte,
          projectId,
          projectName,
          indicateurs: projectIndicators.map(ind => ({
            indicateurId: ind.id,
            indicateurCode: ind.code,
            indicateurName: ind.name,
            unit: ind.unit,
            baselineValue: ind.baselineValue,
            targetValue: ind.targetValue,
            previousValue: Math.round(ind.baselineValue + (ind.targetValue - ind.baselineValue) * previousRatio),
            currentValue: Math.round(ind.baselineValue + (ind.targetValue - ind.baselineValue) * periode.ratio),
            comment: "",
          })),
          status: indicStatus,
          responsable: project?.responsible || "",
          observations: "",
          createdAt: dateCollecte,
          submittedAt: indicStatus !== "brouillon" ? dateCollecte : undefined,
          validatedAt: indicStatus === "approuve" ? dateCollecte : undefined,
          approvedAt: indicStatus === "approuve" ? dateCollecte : undefined,
        };
        fichesIndicateurs.push(ficheIndicateur);
      }
    });
  });
  
  return { 
    collectes: collectes.sort((a, b) => new Date(b.dateCollecte).getTime() - new Date(a.dateCollecte).getTime()),
    fiches: fiches.sort((a, b) => new Date(b.dateCollecte).getTime() - new Date(a.dateCollecte).getTime()),
    fichesIndicateurs: fichesIndicateurs.sort((a, b) => new Date(b.dateCollecte).getTime() - new Date(a.dateCollecte).getTime())
  };
};

const formatBudget = (amount: number) => {
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(2)} Mds`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} M`;
  return new Intl.NumberFormat("fr-FR").format(amount);
};

const statusConfig: Record<FicheSuiviStatus, { label: string; color: string; borderColor: string }> = {
  brouillon: { label: "Brouillon", color: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400", borderColor: "border-l-slate-400" },
  soumis: { label: "Soumis", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", borderColor: "border-l-blue-500" },
  valide: { label: "Validé", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", borderColor: "border-l-amber-500" },
  approuve: { label: "Approuvé", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", borderColor: "border-l-green-500" },
};

const Suivi = () => {
  const [view, setView] = useState<"collectes" | "fiches" | "execution">("execution");
  const [executionDisplayMode, setExecutionDisplayMode] = useState<"budget" | "deliverables" | "pipeline">("budget");
  const [selectedPTA, setSelectedPTA] = useState<string>(() => {
    const open = getOpenPTAs();
    return open[0]?.id || mockPTARefs[mockPTARefs.length - 1]?.id || "all";
  });
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedService, setSelectedService] = useState("all");
  const [selectedOperation, setSelectedOperation] = useState("all");
  const [selectedCollecte, setSelectedCollecte] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showAllCollectes, setShowAllCollectes] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiche, setSelectedFiche] = useState<FicheSuivi | null>(null);
  const [selectedFicheIndicateur, setSelectedFicheIndicateur] = useState<FicheIndicateur | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [ficheIndicateurFormOpen, setFicheIndicateurFormOpen] = useState(false);
  const [pipelineDrill, setPipelineDrill] = useState<{ workflowName: string; stepName: string; stepColor?: string; fiches: FicheSuivi[] } | null>(null);
  const [collecteFormOpen, setCollecteFormOpen] = useState(false);
  const [ficheTab, setFicheTab] = useState<"activites" | "indicateurs">("activites");
  
  // État pour la visualisation détaillée d'un indicateur individuel
  const [selectedIndicateurDetail, setSelectedIndicateurDetail] = useState<{
    indicateur: FicheIndicateur["indicateurs"][0];
    ficheId: string;
    ficheCode: string;
    projectName: string;
    dateCollecte: string;
    projectId: string;
  } | null>(null);
  const [indicateurDetailOpen, setIndicateurDetailOpen] = useState(false);

  // Liste des projets uniques (incluant entrées virtuelles pour les activités hors projet, regroupées par service)
  const projectsList = useMemo(() => {
    return mockProjects.map(p => ({ id: p.id, name: p.name, type: "projet" as const, serviceResponsableId: p.serviceResponsableId }));
  }, []);

  // Services actifs pour le filtre
  const servicesList = useMemo(() => mockServices.filter(s => s.actif), []);

  // PTA data — combine activités issues des projets + activités transverses (hors projet)
  // Les activités hors projet utilisent un projectId virtuel "service-{id}" pour réutiliser
  // le même pipeline de collectes/fiches, regroupées par service responsable.
  const initialActivities = useMemo(() => {
    const projectActivities = generatePTAActivitiesFromProjects();
    const standalone = generateStandalonePTAActivities(0).map(a => ({
      ...a,
      projectId: `service-${a.serviceResponsableId}`,
      project: getServiceById(a.serviceResponsableId)?.nom || "Service",
    }));
    return [...projectActivities, ...standalone];
  }, []);

  // Collectes et fiches
  const [data, setData] = useState(() => generateMockData(initialActivities));
  const { collectes, fiches, fichesIndicateurs } = data;

  // Opérations filtrées par service (cascade)
  const operationsList = useMemo(() => {
    return mockOperations.filter(o => o.actif && (selectedService === "all" || o.serviceId === selectedService));
  }, [selectedService]);

  // projectId virtuel induit par l'opération sélectionnée (hors-projet)
  const operationVirtualProjectId = useMemo(() => {
    if (selectedOperation === "all") return null;
    const op = mockOperations.find(o => o.id === selectedOperation);
    return op ? `service-${op.serviceId}` : null;
  }, [selectedOperation]);

  // Map projectId (réel ou virtuel "service-…") -> serviceResponsableId, pour le filtre service
  const projectServiceMap = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    initialActivities.forEach(a => {
      if (a.projectId && !map[a.projectId]) {
        map[a.projectId] = a.serviceResponsableId;
      }
    });
    mockProjects.forEach(p => {
      if (!map[p.id]) map[p.id] = p.serviceResponsableId;
    });
    return map;
  }, [initialActivities]);

  // Indique si un projectId correspond à une activité hors projet (entrée virtuelle)
  const isStandaloneProjectId = (id: string) => id.startsWith("service-");

  // Map collecteId -> ptaId pour propager le filtre PTA aux fiches
  const collecteToPTA = useMemo(() => {
    const m: Record<string, string> = {};
    collectes.forEach(c => { m[c.id] = c.ptaId; });
    return m;
  }, [collectes]);

  // Collectes filtrées (par PTA / service / projet / opération)
  const collectesFiltered = useMemo(() => {
    let result = [...collectes];

    if (selectedPTA !== "all") {
      result = result.filter(c => c.ptaId === selectedPTA);
    }
    if (selectedProject !== "all") {
      result = result.filter(c => c.projectId === selectedProject);
    }
    if (selectedOperation !== "all" && operationVirtualProjectId) {
      result = result.filter(c => c.projectId === operationVirtualProjectId);
    }
    if (selectedService !== "all") {
      result = result.filter(c => projectServiceMap[c.projectId] === selectedService);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.projectName.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term)
      );
    }
    return result;
  }, [collectes, selectedPTA, selectedProject, selectedService, selectedOperation, operationVirtualProjectId, searchTerm, projectServiceMap]);
  
  // Regrouper les collectes par projet (ou service pour les hors projet)
  // Par défaut: n'affiche que la dernière collecte clôturée + toutes les collectes en cours.
  const collectesByProject = useMemo(() => {
    const grouped: Record<string, { project: { id: string; name: string; isStandalone: boolean }; collectes: typeof collectesFiltered }> = {};
    collectesFiltered.forEach(c => {
      if (!grouped[c.projectId]) {
        grouped[c.projectId] = {
          project: { id: c.projectId, name: c.projectName, isStandalone: isStandaloneProjectId(c.projectId) },
          collectes: []
        };
      }
      grouped[c.projectId].collectes.push(c);
    });

    if (!showAllCollectes) {
      Object.values(grouped).forEach(g => {
        const sorted = [...g.collectes].sort((a, b) => new Date(b.dateCollecte).getTime() - new Date(a.dateCollecte).getTime());
        const enCours = sorted.filter(c => c.status === "en_cours");
        const lastCloturee = sorted.find(c => c.status === "cloturee");
        const kept = [...enCours];
        if (lastCloturee) kept.push(lastCloturee);
        g.collectes = kept.sort((a, b) => new Date(b.dateCollecte).getTime() - new Date(a.dateCollecte).getTime());
      });
    }

    return Object.values(grouped).filter(g => g.collectes.length > 0);
  }, [collectesFiltered, showAllCollectes]);

  // Map activityId -> operationId (pour filtre opération sur les fiches)
  const activityToOperation = useMemo(() => {
    const m: Record<string, string | undefined> = {};
    initialActivities.forEach(a => { m[a.id] = (a as any).operationId; });
    return m;
  }, [initialActivities]);

  // Fiches filtrées
  const fichesFiltered = useMemo(() => {
    let result = [...fiches];

    if (selectedPTA !== "all") {
      result = result.filter(f => collecteToPTA[f.collecteId] === selectedPTA);
    }
    
    if (selectedProject !== "all") {
      result = result.filter(f => f.projectId === selectedProject);
    }
    
    if (selectedService !== "all") {
      result = result.filter(f => projectServiceMap[f.projectId] === selectedService);
    }

    if (selectedOperation !== "all") {
      result = result.filter(f => activityToOperation[f.activityId] === selectedOperation);
    }

    if (selectedCollecte !== "all") {
      result = result.filter(f => f.collecteId === selectedCollecte);
    }
    
    if (selectedStatus !== "all") {
      result = result.filter(f => f.status === selectedStatus);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(f => 
        f.activityName.toLowerCase().includes(term) ||
        f.projectName.toLowerCase().includes(term) ||
        f.code.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [fiches, selectedPTA, selectedProject, selectedService, selectedOperation, activityToOperation, selectedCollecte, selectedStatus, searchTerm, projectServiceMap, collecteToPTA]);

  // Stats
  const stats = useMemo(() => {
    const total = fichesFiltered.length;
    const brouillons = fichesFiltered.filter(f => f.status === "brouillon").length;
    const soumises = fichesFiltered.filter(f => f.status === "soumis").length;
    const validees = fichesFiltered.filter(f => f.status === "valide").length;
    const approuvees = fichesFiltered.filter(f => f.status === "approuve").length;
    const budgetTotal = fichesFiltered.reduce((sum, f) => sum + f.budgetPrevu, 0);
    const depensesCumulees = fichesFiltered.reduce((sum, f) => sum + f.depensesCumulees, 0);
    const tauxGlobal = budgetTotal > 0 ? Math.round((depensesCumulees / budgetTotal) * 100) : 0;
    return { total, brouillons, soumises, validees, approuvees, budgetTotal, depensesCumulees, tauxGlobal };
  }, [fichesFiltered]);

  // Créer une collecte (génère les fiches pour toutes les activités du projet — ou du service pour le hors projet — + fiche indicateurs)
  const handleCreateCollecte = (formData: { ptaId: string; projectId: string; dateCollecte: string; description?: string }) => {
    const isStandalone = isStandaloneProjectId(formData.projectId);
    const project = isStandalone ? null : mockProjects.find(p => p.id === formData.projectId);

    // Pour les collectes hors projet, le "groupe" est le service responsable
    let groupName = "";
    if (isStandalone) {
      const serviceId = formData.projectId.replace("service-", "");
      groupName = getServiceById(serviceId)?.nom || "Service";
    } else {
      if (!project) return;
      groupName = project.name;
    }

    const projectActivities = initialActivities.filter(a => a.projectId === formData.projectId);
    const projectCode = formData.projectId.slice(0, 6).toUpperCase();
    const collecteId = `col-${Date.now()}`;
    
    // Créer la collecte
    const newCollecte: Collecte = {
      id: collecteId,
      code: generateCollecteCode(projectCode, formData.dateCollecte),
      projectId: formData.projectId,
      projectName: groupName,
      ptaId: formData.ptaId,
      dateCollecte: formData.dateCollecte,
      description: formData.description,
      createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      createdBy: "Utilisateur actuel",
      status: "en_cours",
    };
    
    // Créer les fiches pour toutes les activités du projet ou du service
    const newFiches: FicheSuivi[] = projectActivities.map(activity => {
      const workflow = getWorkflowForNature(activity.nature, DEFAULT_WORKFLOWS);
      const firstStep = workflow?.steps[0];
      
      return {
        id: `fiche-${collecteId}-${activity.id}`,
        code: generateFicheSuiviCode(projectCode, activity.id.slice(0, 4).toUpperCase(), formData.dateCollecte),
        collecteId,
        dateCollecte: formData.dateCollecte,
        projectId: activity.projectId,
        projectName: activity.project,
        activityId: activity.id,
        activityName: activity.name,
        budgetPrevu: activity.budgetTotal,
        depensesCumulees: 0,
        workflowId: workflow?.id,
        workflowName: workflow?.name,
        currentStepId: firstStep?.id,
        currentStepName: firstStep?.name,
        progressPercentage: 0,
        livrables: activity.deliverables.map(del => ({
          livrableId: del.id,
          livrableName: del.unit,
          unit: del.unit,
          targetValue: del.targetValue,
          currentValue: 0,
        })),
        status: "brouillon" as FicheSuiviStatus,
        responsable: activity.responsable,
        observations: "",
        createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      };
    });
    
    // Créer la fiche indicateurs (uniquement pour les collectes liées à un projet)
    const newFicheIndicateur: FicheIndicateur | null = (!isStandalone && project && project.indicators.length > 0) ? {
      id: `fiche-ind-${collecteId}`,
      code: `FI-${projectCode}-${format(parseISO(formData.dateCollecte), "yyyyMMdd")}`,
      collecteId,
      dateCollecte: formData.dateCollecte,
      projectId: formData.projectId,
      projectName: groupName,
      indicateurs: project.indicators.map(ind => {
        // Chercher la valeur précédente depuis les fiches existantes
        const previousFiche = fichesIndicateurs.find(fi => fi.projectId === formData.projectId);
        const previousInd = previousFiche?.indicateurs.find(i => i.indicateurId === ind.id);
        
        return {
          indicateurId: ind.id,
          indicateurCode: ind.code,
          indicateurName: ind.name,
          unit: ind.unit,
          baselineValue: ind.baselineValue,
          targetValue: ind.targetValue,
          previousValue: previousInd?.currentValue || ind.baselineValue,
          currentValue: previousInd?.currentValue || ind.baselineValue,
          comment: "",
        };
      }),
      status: "brouillon" as FicheSuiviStatus,
      responsable: project.responsible,
      observations: "",
      createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
    } : null;
    
    setData(prev => ({
      collectes: [newCollecte, ...prev.collectes],
      fiches: [...newFiches, ...prev.fiches],
      fichesIndicateurs: newFicheIndicateur 
        ? [newFicheIndicateur, ...prev.fichesIndicateurs]
        : prev.fichesIndicateurs,
    }));
    
    // Sélectionner la nouvelle collecte
    setSelectedCollecte(collecteId);
    setView("fiches");
  };

  const handleOpenFiche = (fiche: FicheSuivi) => {
    setSelectedFiche(fiche);
    setFormOpen(true);
  };

  const handleSubmitFiche = (ficheId: string, formData: any, action: "save" | "submit") => {
    setData(prev => ({
      ...prev,
      fiches: prev.fiches.map(f => {
        if (f.id === ficheId) {
          const workflow = DEFAULT_WORKFLOWS.find(w => w.id === f.workflowId);
          const currentStep = workflow?.steps.find(s => s.id === formData.currentStepId);
          const progressPercentage = workflow ? calculateWorkflowProgress(formData.currentStepId, workflow) : f.progressPercentage;
          
          return {
            ...f,
            depensesCumulees: formData.depensesCumulees,
            currentStepId: formData.currentStepId,
            currentStepName: currentStep?.name,
            progressPercentage,
            observations: formData.observations,
            livrables: f.livrables.map((l, idx) => ({
              ...l,
              currentValue: formData.livrables[idx]?.currentValue || l.currentValue,
            })),
            status: action === "submit" ? "soumis" as FicheSuiviStatus : "brouillon" as FicheSuiviStatus,
            updatedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
            submittedAt: action === "submit" ? format(new Date(), "yyyy-MM-dd'T'HH:mm:ss") : f.submittedAt,
            submittedBy: action === "submit" ? "Utilisateur actuel" : f.submittedBy,
          };
        }
        return f;
      }),
    }));
  };

  const handleValidateFiche = (ficheId: string) => {
    setData(prev => ({
      ...prev,
      fiches: prev.fiches.map(f => {
        if (f.id === ficheId && f.status === "soumis") {
          return {
            ...f,
            status: "valide" as FicheSuiviStatus,
            validatedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
            validatedBy: "Validateur",
          };
        }
        return f;
      }),
    }));
  };

  const handleApproveFiche = (ficheId: string) => {
    setData(prev => ({
      ...prev,
      fiches: prev.fiches.map(f => {
        if (f.id === ficheId && f.status === "valide") {
          return {
            ...f,
            status: "approuve" as FicheSuiviStatus,
            approvedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
            approvedBy: "Approbateur",
          };
        }
        return f;
      }),
    }));
  };

  // Handlers pour les fiches indicateurs
  const handleOpenFicheIndicateur = (fiche: FicheIndicateur) => {
    setSelectedFicheIndicateur(fiche);
    setFicheIndicateurFormOpen(true);
  };

  const handleSubmitFicheIndicateur = (ficheId: string, formData: any, action: "save" | "submit") => {
    setData(prev => ({
      ...prev,
      fichesIndicateurs: prev.fichesIndicateurs.map(f => {
        if (f.id === ficheId) {
          return {
            ...f,
            indicateurs: formData.indicateurs,
            observations: formData.observations,
            status: action === "submit" ? "soumis" as FicheSuiviStatus : "brouillon" as FicheSuiviStatus,
            updatedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
            submittedAt: action === "submit" ? format(new Date(), "yyyy-MM-dd'T'HH:mm:ss") : f.submittedAt,
            submittedBy: action === "submit" ? "Utilisateur actuel" : f.submittedBy,
          };
        }
        return f;
      }),
    }));
  };

  const handleValidateFicheIndicateur = (ficheId: string) => {
    setData(prev => ({
      ...prev,
      fichesIndicateurs: prev.fichesIndicateurs.map(f => {
        if (f.id === ficheId && f.status === "soumis") {
          return {
            ...f,
            status: "valide" as FicheSuiviStatus,
            validatedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
            validatedBy: "Validateur",
          };
        }
        return f;
      }),
    }));
  };

  const handleApproveFicheIndicateur = (ficheId: string) => {
    setData(prev => ({
      ...prev,
      fichesIndicateurs: prev.fichesIndicateurs.map(f => {
        if (f.id === ficheId && f.status === "valide") {
          return {
            ...f,
            status: "approuve" as FicheSuiviStatus,
            approvedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
            approvedBy: "Approbateur",
          };
        }
        return f;
      }),
    }));
  };

  // Mise à jour d'un indicateur unique (édition par popup)
  const handleUpdateSingleIndicateur = (
    ficheId: string,
    indicateurId: string,
    updates: { currentValue: number; comment?: string }
  ) => {
    setData(prev => ({
      ...prev,
      fichesIndicateurs: prev.fichesIndicateurs.map(f => {
        if (f.id !== ficheId) return f;
        return {
          ...f,
          indicateurs: f.indicateurs.map(i =>
            i.indicateurId === indicateurId
              ? { ...i, currentValue: updates.currentValue, comment: updates.comment ?? i.comment }
              : i
          ),
          updatedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        };
      }),
    }));
    // Synchroniser le state du popup
    setSelectedIndicateurDetail(prev =>
      prev && prev.ficheId === ficheId && prev.indicateur.indicateurId === indicateurId
        ? { ...prev, indicateur: { ...prev.indicateur, currentValue: updates.currentValue, comment: updates.comment ?? prev.indicateur.comment } }
        : prev
    );
  };

  // Export Fiches Activités
  const handleExportFichesCSV = () => {
    const data = fichesFiltered.map(f => ({
      Code: f.code,
      DateCollecte: format(parseISO(f.dateCollecte), "dd/MM/yyyy"),
      Projet: f.projectName,
      Activite: f.activityName,
      Responsable: f.responsable,
      Etape: f.currentStepName || "-",
      Avancement: `${f.progressPercentage}%`,
      BudgetPrevu: f.budgetPrevu,
      DepensesCumulees: f.depensesCumulees,
      Status: statusConfig[f.status].label,
    }));
    const columns = [
      { key: "Code", header: "Code" },
      { key: "DateCollecte", header: "Date collecte" },
      { key: "Projet", header: "Projet" },
      { key: "Activite", header: "Activité" },
      { key: "Etape", header: "Étape workflow" },
      { key: "Avancement", header: "Avancement" },
      { key: "BudgetPrevu", header: "Budget prévu" },
      { key: "DepensesCumulees", header: "Dépenses cumulées" },
      { key: "Status", header: "Statut" },
    ];
    exportToCSV(data, columns, `fiches-suivi-${format(new Date(), "yyyyMMdd")}`);
  };

  const handleExportFichesPDF = () => {
    const currentCollecte = collectes.find(c => c.id === selectedCollecte);
    const pdfData = fichesFiltered.map(f => ({
      Code: f.code,
      Activite: f.activityName,
      Etape: f.currentStepName || "-",
      Avancement: `${f.progressPercentage}%`,
      Budget: f.budgetPrevu,
      Depenses: f.depensesCumulees,
      Status: statusConfig[f.status].label,
    }));
    const columns = [
      { key: "Code", header: "Code", width: "14%" },
      { key: "Activite", header: "Activité", width: "28%" },
      { key: "Etape", header: "Étape", width: "15%" },
      { key: "Avancement", header: "Avanc.", width: "10%" },
      { key: "Budget", header: "Budget", width: "13%" },
      { key: "Depenses", header: "Dépenses", width: "13%" },
      { key: "Status", header: "Statut", width: "10%" },
    ];
    exportToPDF(
      `Fiches de suivi - Activités`,
      pdfData,
      columns,
      `fiches-activites-${format(new Date(), "yyyyMMdd")}`,
      {
        subtitle: (() => {
          const ptaRef = getPTARefById(selectedPTA);
          const ptaPart = ptaRef ? `PTA ${ptaRef.code}` : "Tous PTA";
          return currentCollecte
            ? `${ptaPart} • Collecte: ${currentCollecte.code} • ${currentCollecte.projectName} • ${format(parseISO(currentCollecte.dateCollecte), "dd/MM/yyyy")}`
            : `${ptaPart} • Toutes collectes`;
        })(),
        summary: [
          { label: "Total fiches", value: stats.total.toString() },
          { label: "Approuvées", value: stats.approuvees.toString() },
          { label: "Brouillons", value: stats.brouillons.toString() },
          { label: "Taux exec.", value: `${stats.tauxGlobal}%` },
        ],
      }
    );
  };

  // Export Collectes
  const handleExportCollectesCSV = () => {
    const data = collectesFiltered.map(c => {
      const collecteFiches = fiches.filter(f => f.collecteId === c.id);
      const avgProgress = collecteFiches.length > 0 
        ? Math.round(collecteFiches.reduce((sum, f) => sum + f.progressPercentage, 0) / collecteFiches.length) 
        : 0;
      return {
        Code: c.code,
        Projet: c.projectName,
        DateCollecte: format(parseISO(c.dateCollecte), "dd/MM/yyyy"),
        Description: c.description || "-",
        NombreFiches: collecteFiches.length,
        AvancementMoyen: `${avgProgress}%`,
        Brouillons: collecteFiches.filter(f => f.status === "brouillon").length,
        Soumis: collecteFiches.filter(f => f.status === "soumis").length,
        Valides: collecteFiches.filter(f => f.status === "valide").length,
        Approuves: collecteFiches.filter(f => f.status === "approuve").length,
        Statut: c.status === "cloturee" ? "Clôturée" : "En cours",
      };
    });
    const columns = [
      { key: "Code", header: "Code" },
      { key: "Projet", header: "Projet" },
      { key: "DateCollecte", header: "Date collecte" },
      { key: "NombreFiches", header: "Nb fiches" },
      { key: "AvancementMoyen", header: "Avancement" },
      { key: "Brouillons", header: "Brouillons" },
      { key: "Soumis", header: "Soumis" },
      { key: "Valides", header: "Validés" },
      { key: "Approuves", header: "Approuvés" },
      { key: "Statut", header: "Statut" },
    ];
    exportToCSV(data, columns, `collectes-${format(new Date(), "yyyyMMdd")}`);
  };

  const handleExportCollectesPDF = () => {
    const pdfData = collectesFiltered.map(c => {
      const collecteFiches = fiches.filter(f => f.collecteId === c.id);
      const avgProgress = collecteFiches.length > 0 
        ? Math.round(collecteFiches.reduce((sum, f) => sum + f.progressPercentage, 0) / collecteFiches.length) 
        : 0;
      return {
        Code: c.code,
        Projet: c.projectName,
        Date: format(parseISO(c.dateCollecte), "dd/MM/yyyy"),
        Fiches: collecteFiches.length,
        Avancement: `${avgProgress}%`,
        Approuves: collecteFiches.filter(f => f.status === "approuve").length,
        Statut: c.status === "cloturee" ? "Clôturée" : "En cours",
      };
    });
    const columns = [
      { key: "Code", header: "Code", width: "15%" },
      { key: "Projet", header: "Projet", width: "25%" },
      { key: "Date", header: "Date", width: "12%" },
      { key: "Fiches", header: "Fiches", width: "10%" },
      { key: "Avancement", header: "Avanc.", width: "12%" },
      { key: "Approuves", header: "Approv.", width: "12%" },
      { key: "Statut", header: "Statut", width: "14%" },
    ];
    exportToPDF(
      `Liste des opérations de collecte`,
      pdfData,
      columns,
      `collectes-${format(new Date(), "yyyyMMdd")}`,
      {
        subtitle: (() => {
          const ptaRef = getPTARefById(selectedPTA);
          const ptaPart = ptaRef ? `PTA ${ptaRef.code}` : "Tous PTA";
          const projectPart = selectedProject !== "all"
            ? `Projet: ${projectsList.find(p => p.id === selectedProject)?.name}`
            : "Tous projets";
          return `${ptaPart} • ${projectPart}`;
        })(),
        summary: [
          { label: "Total collectes", value: collectesFiltered.length.toString() },
          { label: "En cours", value: collectesFiltered.filter(c => c.status === "en_cours").length.toString() },
          { label: "Clôturées", value: collectesFiltered.filter(c => c.status === "cloturee").length.toString() },
        ],
      }
    );
  };

  // Export Fiche Indicateurs
  const handleExportIndicateursCSV = () => {
    const ficheInd = fichesIndicateurs.find(f => f.collecteId === selectedCollecte);
    if (!ficheInd) return;
    
    const data = ficheInd.indicateurs.map(ind => ({
      Indicateur: ind.indicateurName,
      Unite: ind.unit,
      Reference: ind.baselineValue,
      Cible: ind.targetValue,
      Precedent: ind.previousValue,
      Actuel: ind.currentValue,
      Atteinte: `${ind.targetValue > 0 ? Math.round((ind.currentValue / ind.targetValue) * 100) : 0}%`,
      Commentaire: ind.comment || "-",
    }));
    const columns = [
      { key: "Indicateur", header: "Indicateur" },
      { key: "Unite", header: "Unité" },
      { key: "Reference", header: "Référence" },
      { key: "Cible", header: "Cible" },
      { key: "Precedent", header: "Précédent" },
      { key: "Actuel", header: "Actuel" },
      { key: "Atteinte", header: "% Atteinte" },
      { key: "Commentaire", header: "Commentaire" },
    ];
    exportToCSV(data, columns, `indicateurs-${ficheInd.code}-${format(new Date(), "yyyyMMdd")}`);
  };

  const handleExportIndicateursPDF = () => {
    const ficheInd = fichesIndicateurs.find(f => f.collecteId === selectedCollecte);
    if (!ficheInd) return;
    
    const globalProgress = ficheInd.indicateurs.length > 0
      ? Math.round(ficheInd.indicateurs.reduce((sum, ind) => sum + (ind.targetValue > 0 ? (ind.currentValue / ind.targetValue) * 100 : 0), 0) / ficheInd.indicateurs.length)
      : 0;
    
    // Calculer les valeurs atteintes par trimestre pour chaque indicateur
    const getIndicatorQuarterValue = (indicateurId: string, quarter: number) => {
      const qFiches = fichesIndicateurs.filter(fi => {
        const month = new Date(fi.dateCollecte).getMonth();
        return fi.projectId === ficheInd.projectId && Math.floor(month / 3) + 1 === quarter;
      });
      if (qFiches.length === 0) return null;
      // Prendre la dernière fiche du trimestre
      const lastFiche = qFiches.sort((a, b) => new Date(b.dateCollecte).getTime() - new Date(a.dateCollecte).getTime())[0];
      const matchingInd = lastFiche.indicateurs.find(i => i.indicateurId === indicateurId);
      return matchingInd ? matchingInd.currentValue : null;
    };
    
    const pdfData = ficheInd.indicateurs.map(ind => {
      const atteinte = ind.targetValue > 0 ? Math.round((ind.currentValue / ind.targetValue) * 100) : 0;
      return {
        Indicateur: ind.indicateurName,
        Unite: ind.unit,
        Cible: new Intl.NumberFormat("fr-FR").format(ind.targetValue),
        T1: getIndicatorQuarterValue(ind.indicateurId, 1) !== null ? new Intl.NumberFormat("fr-FR").format(getIndicatorQuarterValue(ind.indicateurId, 1) as number) : '-',
        T2: getIndicatorQuarterValue(ind.indicateurId, 2) !== null ? new Intl.NumberFormat("fr-FR").format(getIndicatorQuarterValue(ind.indicateurId, 2) as number) : '-',
        T3: getIndicatorQuarterValue(ind.indicateurId, 3) !== null ? new Intl.NumberFormat("fr-FR").format(getIndicatorQuarterValue(ind.indicateurId, 3) as number) : '-',
        T4: getIndicatorQuarterValue(ind.indicateurId, 4) !== null ? new Intl.NumberFormat("fr-FR").format(getIndicatorQuarterValue(ind.indicateurId, 4) as number) : '-',
        Actuel: new Intl.NumberFormat("fr-FR").format(ind.currentValue),
        Atteinte: `${atteinte}%`,
      };
    });
    const columns = [
      { key: "Indicateur", header: "Indicateur", width: "22%" },
      { key: "Cible", header: "Cible", width: "10%" },
      { key: "T1", header: "Val. T1", width: "10%" },
      { key: "T2", header: "Val. T2", width: "10%" },
      { key: "T3", header: "Val. T3", width: "10%" },
      { key: "T4", header: "Val. T4", width: "10%" },
      { key: "Actuel", header: "Cumulé", width: "10%" },
      { key: "Atteinte", header: "Atteinte", width: "8%" },
    ];
    exportToPDF(
      `Fiche Indicateurs - ${ficheInd.code}`,
      pdfData,
      columns,
      `indicateurs-${ficheInd.code}-${format(new Date(), "yyyyMMdd")}`,
      {
        subtitle: `${ficheInd.projectName} • Collecte du ${format(parseISO(ficheInd.dateCollecte), "dd/MM/yyyy")}`,
        summary: [
          { label: "Indicateurs", value: ficheInd.indicateurs.length.toString() },
          { label: "Atteinte globale", value: `${globalProgress}%` },
          { label: "Statut", value: statusConfig[ficheInd.status].label },
        ],
      }
    );
  };

  // Export PDF enrichi d'une fiche activité
  const handleExportFicheEnrichiePDF = (fiche: FicheSuivi) => {
    const workflow = DEFAULT_WORKFLOWS.find(w => w.id === fiche.workflowId);
    const project = mockProjects.find(p => p.id === fiche.projectId);
    const activity = project?.activities?.find(a => a.id.includes(fiche.activityId.replace('pta-', '')));
    
    // Calculer les étapes du workflow avec leur statut
    const workflowSteps = workflow?.steps.map(step => {
      const currentStep = workflow.steps.find(s => s.id === fiche.currentStepId);
      const currentOrder = currentStep?.order || 0;
      let status: 'completed' | 'current' | 'pending' = 'pending';
      if (step.order < currentOrder) status = 'completed';
      else if (step.order === currentOrder) status = 'current';
      return {
        id: step.id,
        name: step.name,
        color: step.color,
        order: step.order,
        status
      };
    });

    const tauxExecution = fiche.budgetPrevu > 0 
      ? Math.round((fiche.depensesCumulees / fiche.budgetPrevu) * 100) 
      : 0;

    // Calculer les dépenses trimestrielles pour cette activité
    const activityFiches = fiches.filter(f => f.activityId === fiche.activityId);
    const getQuarterExpenses = (quarter: number): number | null => {
      const qFiches = activityFiches.filter(f => {
        const month = new Date(f.dateCollecte).getMonth();
        return Math.floor(month / 3) + 1 === quarter;
      });
      if (qFiches.length === 0) return null;
      // Prendre la dernière fiche du trimestre
      const lastFiche = qFiches.sort((a, b) => new Date(b.dateCollecte).getTime() - new Date(a.dateCollecte).getTime())[0];
      return lastFiche.depensesCumulees;
    };
    
    const performancesTrimestres = {
      t1: getQuarterExpenses(1),
      t2: getQuarterExpenses(2),
      t3: getQuarterExpenses(3),
      t4: getQuarterExpenses(4),
    };

    const exportData: FicheActiviteEnrichieExportData = {
      code: fiche.code,
      dateCollecte: fiche.dateCollecte,
      projectId: fiche.projectId,
      projectName: fiche.projectName,
      activityId: fiche.activityId,
      activityName: fiche.activityName,
      activityDescription: activity?.description,
      responsable: fiche.responsable,
      entiteExecution: activity?.entiteExecution,
      nature: activity?.nature,
      workflowId: fiche.workflowId,
      workflowName: fiche.workflowName,
      workflowSteps,
      currentStepId: fiche.currentStepId,
      currentStepName: fiche.currentStepName,
      progressPercentage: fiche.progressPercentage,
      performancesTrimestres,
      budgetPrevu: fiche.budgetPrevu,
      depensesCumulees: fiche.depensesCumulees,
      tauxExecution,
      livrables: fiche.livrables.map(l => ({
        id: l.livrableId,
        name: l.livrableName,
        unit: l.unit,
        targetValue: l.targetValue,
        currentValue: l.currentValue,
        progressPct: l.targetValue > 0 ? Math.round((l.currentValue / l.targetValue) * 100) : 0,
      })),
      pointsCritiques: (fiche.pointsCritiques || []).map(pc => ({
        id: pc.id,
        titre: pc.titre,
        description: pc.description,
        niveau: pc.niveau,
        niveauLabel: pc.niveau === 'info' ? 'Information' : pc.niveau === 'attention' ? 'Attention' : 'Critique',
        statut: pc.statut,
        statutLabel: pc.statut === 'ouvert' ? 'Ouvert' : pc.statut === 'en_cours' ? 'En cours' : 'Résolu',
        dateIdentification: pc.dateIdentification,
        dateResolution: pc.dateResolution,
      })),
      actionsSuivi: (fiche.actionsSuivi || []).map(a => ({
        id: a.id,
        titre: a.titre,
        description: a.description,
        responsable: a.responsable,
        echeance: a.echeance,
        priorite: a.priorite,
        prioriteLabel: a.priorite === 'basse' ? 'Basse' : a.priorite === 'normale' ? 'Normale' : a.priorite === 'haute' ? 'Haute' : 'Urgente',
        statut: a.statut,
        statutLabel: a.statut === 'a_faire' ? 'À faire' : a.statut === 'en_cours' ? 'En cours' : a.statut === 'termine' ? 'Terminé' : 'Annulé',
      })),
      status: fiche.status,
      statusLabel: statusConfig[fiche.status].label,
      observations: fiche.observations,
      createdAt: fiche.createdAt,
      submittedAt: fiche.submittedAt,
      submittedBy: fiche.submittedBy,
      validatedAt: fiche.validatedAt,
      validatedBy: fiche.validatedBy,
      approvedAt: fiche.approvedAt,
      approvedBy: fiche.approvedBy,
      projectBudgetTotal: project?.budget,
      projectProgress: project?.progress,
      activityStartDate: activity?.startDate,
      activityEndDate: activity?.endDate,
      activityBudgetByQuarter: (() => {
        const cleanActivityId = fiche.activityId.replace('pta-', '');
        const ptaAct = initialActivities.find(a => a.activityId === cleanActivityId || a.activityId === fiche.activityId || a.id === fiche.activityId);
        return ptaAct ? { t1: ptaAct.budgetT1, t2: ptaAct.budgetT2, t3: ptaAct.budgetT3, t4: ptaAct.budgetT4 } : undefined;
      })(),
    };

    exportFicheActiviteEnrichieToPDF(exportData);
  };

  // Export PDF synthèse globale du suivi
  const handleExportSynthesePDF = () => {
    const filteredFiches = selectedProject !== "all" 
      ? fiches.filter(f => f.projectId === selectedProject)
      : fiches;
    
    // Stats globales
    const totalProjets = [...new Set(filteredFiches.map(f => f.projectId))].length;
    const totalActivites = [...new Set(filteredFiches.map(f => f.activityId))].length;
    const avancementMoyen = filteredFiches.length > 0 
      ? Math.round(filteredFiches.reduce((s, f) => s + f.progressPercentage, 0) / filteredFiches.length)
      : 0;
    const budgetTotal = filteredFiches.reduce((s, f) => s + f.budgetPrevu, 0);
    const depensesCumulees = filteredFiches.reduce((s, f) => s + f.depensesCumulees, 0);
    const tauxExecutionBudgetaire = budgetTotal > 0 ? Math.round((depensesCumulees / budgetTotal) * 100) : 0;

    // Répartition par statut
    const repartitionStatut = (Object.keys(statusConfig) as FicheSuiviStatus[]).map(status => ({
      status,
      label: statusConfig[status].label,
      count: filteredFiches.filter(f => f.status === status).length,
      percentage: filteredFiches.length > 0 
        ? Math.round((filteredFiches.filter(f => f.status === status).length / filteredFiches.length) * 100) 
        : 0,
      color: statusConfig[status].color,
    }));

    // Calcul des performances trimestrielles globales
    const getQuarterFiches = (quarter: number) => {
      return filteredFiches.filter(f => {
        const month = new Date(f.dateCollecte).getMonth();
        return Math.floor(month / 3) + 1 === quarter;
      });
    };
    
    const getQuarterAvancement = (quarter: number) => {
      const qFiches = getQuarterFiches(quarter);
      if (qFiches.length === 0) return null;
      return Math.round(qFiches.reduce((s, f) => s + f.progressPercentage, 0) / qFiches.length);
    };
    
    const performancesTrimestres = {
      t1: { 
        avancement: getQuarterAvancement(1), 
        budget: getQuarterFiches(1).reduce((s, f) => s + f.budgetPrevu, 0),
        depenses: getQuarterFiches(1).reduce((s, f) => s + f.depensesCumulees, 0),
        nbFiches: getQuarterFiches(1).length 
      },
      t2: { 
        avancement: getQuarterAvancement(2), 
        budget: getQuarterFiches(2).reduce((s, f) => s + f.budgetPrevu, 0),
        depenses: getQuarterFiches(2).reduce((s, f) => s + f.depensesCumulees, 0),
        nbFiches: getQuarterFiches(2).length 
      },
      t3: { 
        avancement: getQuarterAvancement(3), 
        budget: getQuarterFiches(3).reduce((s, f) => s + f.budgetPrevu, 0),
        depenses: getQuarterFiches(3).reduce((s, f) => s + f.depensesCumulees, 0),
        nbFiches: getQuarterFiches(3).length 
      },
      t4: { 
        avancement: getQuarterAvancement(4), 
        budget: getQuarterFiches(4).reduce((s, f) => s + f.budgetPrevu, 0),
        depenses: getQuarterFiches(4).reduce((s, f) => s + f.depensesCumulees, 0),
        nbFiches: getQuarterFiches(4).length 
      },
    };

    // Avancement par projet avec trimestres
    const projectIds = [...new Set(filteredFiches.map(f => f.projectId))];
    const avancementParProjet = projectIds.map(projectId => {
      const projectFiches = filteredFiches.filter(f => f.projectId === projectId);
      const projectName = projectFiches[0]?.projectName || "";
      const nbActivites = [...new Set(projectFiches.map(f => f.activityId))].length;
      const avancementMoyenProjet = Math.round(projectFiches.reduce((s, f) => s + f.progressPercentage, 0) / projectFiches.length);
      const budgetPrevuProjet = projectFiches.reduce((s, f) => s + f.budgetPrevu, 0);
      const depensesCumuleesProjet = projectFiches.reduce((s, f) => s + f.depensesCumulees, 0);
      const tauxExecutionProjet = budgetPrevuProjet > 0 ? Math.round((depensesCumuleesProjet / budgetPrevuProjet) * 100) : 0;
      
      // Calcul des dépenses par trimestre pour ce projet
      const getProjectQuarterExpenses = (quarter: number) => {
        const qFiches = projectFiches.filter(f => {
          const month = new Date(f.dateCollecte).getMonth();
          return Math.floor(month / 3) + 1 === quarter;
        });
        if (qFiches.length === 0) return null;
        return qFiches.reduce((s, f) => s + f.depensesCumulees, 0);
      };
      
      return {
        projectId,
        projectName,
        nbActivites,
        avancementMoyen: avancementMoyenProjet,
        budgetPrevu: budgetPrevuProjet,
        depensesCumulees: depensesCumuleesProjet,
        tauxExecution: tauxExecutionProjet,
        nbFiches: projectFiches.length,
        nbBrouillons: projectFiches.filter(f => f.status === "brouillon").length,
        nbSoumis: projectFiches.filter(f => f.status === "soumis").length,
        nbValides: projectFiches.filter(f => f.status === "valide").length,
        nbApprouves: projectFiches.filter(f => f.status === "approuve").length,
        t1: getProjectQuarterExpenses(1),
        t2: getProjectQuarterExpenses(2),
        t3: getProjectQuarterExpenses(3),
        t4: getProjectQuarterExpenses(4),
      };
    });

    // Détail des fiches
    const fichesDetail = filteredFiches.map(f => ({
      code: f.code,
      projectName: f.projectName,
      activityName: f.activityName,
      responsable: f.responsable,
      dateCollecte: f.dateCollecte,
      workflowName: f.workflowName,
      currentStepName: f.currentStepName,
      progressPercentage: f.progressPercentage,
      budgetPrevu: f.budgetPrevu,
      depensesCumulees: f.depensesCumulees,
      tauxExecution: f.budgetPrevu > 0 ? Math.round((f.depensesCumulees / f.budgetPrevu) * 100) : 0,
      status: f.status,
      statusLabel: statusConfig[f.status].label,
      nbLivrables: f.livrables.length,
      tauxLivrables: f.livrables.length > 0 
        ? Math.round(f.livrables.reduce((s, l) => s + (l.targetValue > 0 ? (l.currentValue / l.targetValue) * 100 : 0), 0) / f.livrables.length)
        : 0,
      nbPointsCritiques: (f.pointsCritiques || []).length,
      nbActionsSuivi: (f.actionsSuivi || []).length,
    }));

    // Alertes
    const alertes: SuiviSyntheseExportData['alertes'] = [];
    filteredFiches.forEach(f => {
      const tauxExec = f.budgetPrevu > 0 ? Math.round((f.depensesCumulees / f.budgetPrevu) * 100) : 0;
      
      if (f.progressPercentage < 30) {
        alertes.push({
          type: 'retard',
          label: 'Avancement faible',
          ficheCode: f.code,
          activityName: f.activityName,
          projectName: f.projectName,
          details: `Avancement à ${f.progressPercentage}% seulement`,
        });
      }
      if (tauxExec > 100) {
        alertes.push({
          type: 'depassement',
          label: 'Dépassement budgétaire',
          ficheCode: f.code,
          activityName: f.activityName,
          projectName: f.projectName,
          details: `Taux d'exécution de ${tauxExec}% (dépassement de ${tauxExec - 100}%)`,
        });
      }
      if ((f.pointsCritiques || []).some(pc => pc.niveau === 'critique' && pc.statut === 'ouvert')) {
        alertes.push({
          type: 'critique',
          label: 'Point critique non résolu',
          ficheCode: f.code,
          activityName: f.activityName,
          projectName: f.projectName,
          details: 'Point critique de niveau élevé en attente de résolution',
        });
      }
    });

    // Top/Bottom performers
    const sortedByProgress = [...filteredFiches].sort((a, b) => b.progressPercentage - a.progressPercentage);
    const topPerformers = sortedByProgress.slice(0, 5).map(f => ({
      activityName: f.activityName,
      projectName: f.projectName,
      progress: f.progressPercentage,
    }));
    const bottomPerformers = sortedByProgress.slice(-5).reverse().map(f => ({
      activityName: f.activityName,
      projectName: f.projectName,
      progress: f.progressPercentage,
    }));

    const ptaRef = getPTARefById(selectedPTA);
    const ptaPart = ptaRef ? `PTA: ${ptaRef.code} (${PTA_STATUS_LABELS[ptaRef.status]})` : "Tous les PTA";
    const projectPart = selectedProject !== "all"
      ? `Projet: ${projectsList.find(p => p.id === selectedProject)?.name}`
      : "Tous les projets";
    const exportData: SuiviSyntheseExportData = {
      dateGeneration: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      periode: `${ptaPart} • ${projectPart}`,
      projectFilter: selectedProject !== "all" ? selectedProject : undefined,
      stats: {
        totalProjets,
        totalActivites,
        totalFiches: filteredFiches.length,
        avancementMoyen,
        tauxExecutionBudgetaire,
        budgetTotal,
        depensesCumulees,
      },
      performancesTrimestres,
      repartitionStatut,
      avancementParProjet,
      fiches: fichesDetail,
      alertes,
      topPerformers,
      bottomPerformers,
    };

    exportSuiviSyntheseToPDF(exportData);
  };

  // Export PDF consolidé pour une collecte
  const handleExportCollecteConsolideePDF = (collecteId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    const collecte = collectes.find(c => c.id === collecteId);
    if (!collecte) return;
    
    const collecteFiches = fiches.filter(f => f.collecteId === collecteId);
    const collecteFicheIndicateur = fichesIndicateurs.find(fi => fi.collecteId === collecteId);
    
    // Stats
    const brouillons = collecteFiches.filter(f => f.status === "brouillon").length;
    const soumis = collecteFiches.filter(f => f.status === "soumis").length;
    const valides = collecteFiches.filter(f => f.status === "valide").length;
    const approuves = collecteFiches.filter(f => f.status === "approuve").length;
    const budgetTotal = collecteFiches.reduce((s, f) => s + f.budgetPrevu, 0);
    const depensesCumulees = collecteFiches.reduce((s, f) => s + f.depensesCumulees, 0);
    const tauxExecutionGlobal = budgetTotal > 0 ? Math.round((depensesCumulees / budgetTotal) * 100) : 0;
    const avancementMoyen = collecteFiches.length > 0 
      ? Math.round(collecteFiches.reduce((s, f) => s + f.progressPercentage, 0) / collecteFiches.length)
      : 0;
    
    // Préparer les données des fiches
    const fichesData = collecteFiches.map(f => ({
      code: f.code,
      activityName: f.activityName,
      responsable: f.responsable,
      workflowName: f.workflowName,
      currentStepName: f.currentStepName,
      progressPercentage: f.progressPercentage,
      budgetPrevu: f.budgetPrevu,
      depensesCumulees: f.depensesCumulees,
      tauxExecution: f.budgetPrevu > 0 ? Math.round((f.depensesCumulees / f.budgetPrevu) * 100) : 0,
      status: f.status,
      statusLabel: statusConfig[f.status].label,
      livrables: f.livrables.map(l => ({
        name: l.livrableName,
        unit: l.unit,
        targetValue: l.targetValue,
        currentValue: l.currentValue,
        percentage: l.targetValue > 0 ? Math.round((l.currentValue / l.targetValue) * 100) : 0,
      })),
      pointsCritiques: (f.pointsCritiques || []).map(pc => ({
        titre: pc.titre,
        niveau: pc.niveau,
        niveauLabel: pc.niveau === 'critique' ? 'Critique' : pc.niveau === 'attention' ? 'Attention' : 'Info',
        statut: pc.statut,
        statutLabel: pc.statut === 'ouvert' ? 'Ouvert' : pc.statut === 'en_cours' ? 'En cours' : 'Résolu',
      })),
      actionsSuivi: (f.actionsSuivi || []).map(a => ({
        titre: a.titre,
        responsable: a.responsable,
        echeance: a.echeance,
        priorite: a.priorite,
        prioriteLabel: a.priorite === 'urgente' ? 'Urgente' : a.priorite === 'haute' ? 'Haute' : a.priorite === 'normale' ? 'Normale' : 'Basse',
        statut: a.statut,
        statutLabel: a.statut === 'a_faire' ? 'À faire' : a.statut === 'en_cours' ? 'En cours' : a.statut === 'termine' ? 'Terminé' : 'Annulé',
      })),
      observations: f.observations,
    }));
    
    // Préparer la fiche indicateurs
    const ficheIndicateursData = collecteFicheIndicateur ? {
      code: collecteFicheIndicateur.code,
      status: collecteFicheIndicateur.status,
      statusLabel: statusConfig[collecteFicheIndicateur.status].label,
      indicateurs: collecteFicheIndicateur.indicateurs.map(ind => ({
        code: ind.indicateurCode,
        name: ind.indicateurName,
        unit: ind.unit,
        baselineValue: ind.baselineValue,
        targetValue: ind.targetValue,
        currentValue: ind.currentValue,
        percentage: ind.targetValue > 0 ? Math.round((ind.currentValue / ind.targetValue) * 100) : 0,
      })),
    } : undefined;
    
    const exportData: CollecteConsolideeExportData = {
      collecte: {
        code: collecte.code,
        projectName: collecte.projectName,
        dateCollecte: collecte.dateCollecte,
        description: collecte.description,
        status: collecte.status,
        createdBy: collecte.createdBy,
      },
      stats: {
        totalFiches: collecteFiches.length,
        brouillons,
        soumis,
        valides,
        approuves,
        budgetTotal,
        depensesCumulees,
        tauxExecutionGlobal,
        avancementMoyen,
      },
      fiches: fichesData,
      ficheIndicateurs: ficheIndicateursData,
      dateGeneration: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
    };
    
    exportCollecteConsolideeToPDF(exportData);
  };

  return (
    <DashboardLayout title="Suivi des réalisations" subtitle="Collectes et fiches de suivi par activité PTA">
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <TabsList>
              <TabsTrigger value="execution" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Synthèse
              </TabsTrigger>
              <TabsTrigger value="collectes" className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Collectes
              </TabsTrigger>
              <TabsTrigger value="fiches" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Fiches
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtre PTA global — articule l'ensemble des espaces de suivi avec un PTA */}
            <Select value={selectedPTA} onValueChange={(v) => { setSelectedPTA(v); setSelectedCollecte("all"); }}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="PTA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les PTA</SelectItem>
                {mockPTARefs.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="font-mono text-xs mr-2">{p.code}</span>
                    <span className="text-xs text-muted-foreground">{PTA_STATUS_LABELS[p.status]}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {view !== "fiches" && (<></>)}
          </div>
          {view !== "fiches" && (
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedService} onValueChange={(v) => { setSelectedService(v); setSelectedProject("all"); setSelectedOperation("all"); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les services</SelectItem>
                {servicesList.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedProject}
              onValueChange={(v) => { setSelectedProject(v); if (v !== "all") setSelectedOperation("all"); }}
              disabled={selectedOperation !== "all"}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Projet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les projets</SelectItem>
                {projectsList
                  .filter(p => selectedService === "all" || p.serviceResponsableId === selectedService)
                  .map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedOperation}
              onValueChange={(v) => { setSelectedOperation(v); if (v !== "all") setSelectedProject("all"); }}
              disabled={selectedProject !== "all"}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Opération (hors projet)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les opérations</SelectItem>
                {operationsList.map(o => (
                  <SelectItem key={o.id} value={o.id}>
                    <span className="font-mono text-xs mr-2">{o.code}</span>{o.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          )}
        </div>

        {view === "collectes" && (
          <>
            {/* Header collectes avec filtre période */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher..." 
                    className="pl-10 w-56"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button
                  variant={showAllCollectes ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAllCollectes(v => !v)}
                  title="Afficher l'historique complet ou seulement la dernière clôturée + en cours"
                >
                  {showAllCollectes ? "Tout l'historique" : "Dernières clôturées + en cours"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <ExportButtons onExportCSV={handleExportCollectesCSV} onExportPDF={handleExportCollectesPDF} />
                <Button onClick={() => setCollecteFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle collecte
                </Button>
              </div>
            </div>

            {/* Liste des collectes regroupées par projet (ou par service pour les activités hors projet) */}
            <div className="space-y-4">
              {collectesByProject.map(({ project, collectes: projectCollectes }) => {
                const allFiches = projectCollectes.flatMap(c => fiches.filter(f => f.collecteId === c.id));
                const avgProgress = allFiches.length > 0 
                  ? Math.round(allFiches.reduce((sum, f) => sum + f.progressPercentage, 0) / allFiches.length)
                  : 0;
                
                return (
                  <Card key={project.id}>
                    <CardHeader className="py-2 px-4 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FolderOpen className={cn("w-4 h-4", project.isStandalone ? "text-amber-600" : "text-primary")} />
                          <CardTitle className="text-sm font-medium">{project.name}</CardTitle>
                          {project.isStandalone && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Hors projet · Service</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">{projectCollectes.length} collecte(s)</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Avancement moyen:</span>
                          <Progress value={avgProgress} className="w-16 h-1.5" />
                          <span className="font-medium">{avgProgress}%</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {projectCollectes.map(collecte => {
                          const collecteFiches = fiches.filter(f => f.collecteId === collecte.id);
                          const brouillons = collecteFiches.filter(f => f.status === "brouillon").length;
                          const soumises = collecteFiches.filter(f => f.status === "soumis").length;
                          const validees = collecteFiches.filter(f => f.status === "valide").length;
                          const approuvees = collecteFiches.filter(f => f.status === "approuve").length;
                          const cProgress = collecteFiches.length > 0 
                            ? Math.round(collecteFiches.reduce((sum, f) => sum + f.progressPercentage, 0) / collecteFiches.length)
                            : 0;
                          
                          return (
                            <div 
                              key={collecte.id}
                              className={cn(
                                "flex items-center justify-between gap-4 px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors border-l-4",
                                collecte.status === "cloturee" ? "border-l-green-500" : "border-l-blue-500"
                              )}
                              onClick={() => {
                                setSelectedCollecte(collecte.id);
                                setView("fiches");
                              }}
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-28">
                                  <span className="font-mono text-xs">{collecte.code}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="w-3 h-3 text-muted-foreground" />
                                  <span>{format(parseISO(collecte.dateCollecte), "dd MMM yyyy", { locale: fr })}</span>
                                </div>
                                <Badge className={cn("text-xs", collecte.status === "cloturee" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800")}>
                                  {collecte.status === "cloturee" ? "Clôturée" : "En cours"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{collecteFiches.length} fiches</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Progress value={cProgress} className="w-16 h-1.5" />
                                  <span className="text-xs font-medium w-8">{cProgress}%</span>
                                </div>
                                
                                <div className="flex gap-1">
                                  {brouillons > 0 && <Badge variant="outline" className="text-xs text-slate-600 px-1.5">{brouillons} br.</Badge>}
                                  {soumises > 0 && <Badge variant="outline" className="text-xs text-blue-600 px-1.5">{soumises} so.</Badge>}
                                  {validees > 0 && <Badge variant="outline" className="text-xs text-amber-600 px-1.5">{validees} va.</Badge>}
                                  {approuvees > 0 && <Badge variant="outline" className="text-xs text-green-600 px-1.5">{approuvees} ap.</Badge>}
                                </div>
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-7 w-7"
                                  title="Exporter PDF consolidé"
                                  onClick={(e) => handleExportCollecteConsolideePDF(collecte.id, e)}
                                >
                                  <FileDown className="w-4 h-4 text-primary" />
                                </Button>
                                
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {collectesByProject.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Aucune collecte trouvée pour la période sélectionnée</p>
                  <Button variant="link" onClick={() => setCollecteFormOpen(true)}>
                    Créer une collecte
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {view === "fiches" && (
          <>
            {/* Sélecteur de collecte obligatoire */}
            {selectedCollecte === "all" ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <h3 className="font-medium mb-2">Sélectionnez une collecte</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pour afficher les fiches de suivi, veuillez d'abord sélectionner une opération de collecte.
                  </p>
                  <Select value={selectedCollecte} onValueChange={setSelectedCollecte}>
                    <SelectTrigger className="w-72 mx-auto">
                      <SelectValue placeholder="Choisir une collecte" />
                    </SelectTrigger>
                    <SelectContent>
                      {collectes.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="font-mono text-xs">{c.code}</span>
                          <span className="mx-2">-</span>
                          <span>{c.projectName}</span>
                          <span className="mx-2">-</span>
                          <span className="text-muted-foreground">{format(parseISO(c.dateCollecte), "dd/MM/yyyy")}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="link" className="mt-2" onClick={() => setView("collectes")}>
                    Voir la liste des collectes
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Entête avec infos collecte et projet */}
                {(() => {
                  const currentCollecte = collectes.find(c => c.id === selectedCollecte);
                  if (!currentCollecte) return null;
                  
                  return (
                    <Card className="bg-muted/30 border-l-4 border-l-primary">
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-6">
                            <div>
                              <p className="text-xs text-muted-foreground">Collecte</p>
                              <p className="font-mono font-medium">{currentCollecte.code}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">{isStandaloneProjectId(currentCollecte.projectId) ? "Service responsable" : "Projet"}</p>
                              <p className="font-medium">{currentCollecte.projectName}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Date de collecte</p>
                              <p className="font-medium">{format(parseISO(currentCollecte.dateCollecte), "dd MMMM yyyy", { locale: fr })}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Statut</p>
                              <Badge className={currentCollecte.status === "cloturee" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                                {currentCollecte.status === "cloturee" ? "Clôturée" : "En cours"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select value={selectedCollecte} onValueChange={setSelectedCollecte}>
                              <SelectTrigger className="w-52">
                                <SelectValue placeholder="Changer de collecte" />
                              </SelectTrigger>
                              <SelectContent>
                                {collectes.map(c => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.code} - {format(parseISO(c.dateCollecte), "dd/MM/yy")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm" onClick={() => { setSelectedCollecte("all"); setView("collectes"); }}>
                              Retour
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Card className="border-l-4 border-l-slate-400">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-2">
                        <Edit className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-xl font-bold">{stats.brouillons}</p>
                          <p className="text-xs text-muted-foreground">Brouillons</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-xl font-bold">{stats.soumises}</p>
                          <p className="text-xs text-muted-foreground">Soumises</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-amber-500" />
                        <div>
                          <p className="text-xl font-bold">{stats.validees}</p>
                          <p className="text-xs text-muted-foreground">Validées</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-xl font-bold">{stats.approuvees}</p>
                          <p className="text-xs text-muted-foreground">Approuvées</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xl font-bold">{stats.tauxGlobal}%</p>
                          <p className="text-xs text-muted-foreground">Taux exec.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Onglets Activités / Indicateurs */}
                <Tabs value={ficheTab} onValueChange={(v) => setFicheTab(v as typeof ficheTab)} className="w-full">
                  <div className="flex items-center justify-between gap-3">
                    <TabsList>
                      <TabsTrigger value="activites" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Fiches Activités
                        <Badge variant="secondary" className="text-xs">{fichesFiltered.length}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="indicateurs" className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Fiche Indicateurs
                        {(() => {
                          const ficheInd = fichesIndicateurs.find(f => f.collecteId === selectedCollecte);
                          return ficheInd ? (
                            <Badge className={cn("text-xs", statusConfig[ficheInd.status].color)}>
                              {statusConfig[ficheInd.status].label}
                            </Badge>
                          ) : null;
                        })()}
                      </TabsTrigger>
                    </TabsList>
                    
                    {ficheTab === "activites" && (
                      <div className="flex items-center gap-2">
                        <div className="relative max-w-xs">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="Rechercher..." 
                            className="pl-10 h-8 w-48"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue placeholder="Statut" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous</SelectItem>
                            <SelectItem value="brouillon">Brouillon</SelectItem>
                            <SelectItem value="soumis">Soumis</SelectItem>
                            <SelectItem value="valide">Validé</SelectItem>
                            <SelectItem value="approuve">Approuvé</SelectItem>
                          </SelectContent>
                        </Select>
                        <ExportButtons onExportCSV={handleExportFichesCSV} onExportPDF={handleExportFichesPDF} size="sm" />
                      </div>
                    )}
                    
                    {ficheTab === "indicateurs" && (
                      <div className="flex items-center gap-2">
                        <ExportButtons onExportCSV={handleExportIndicateursCSV} onExportPDF={handleExportIndicateursPDF} size="sm" />
                      </div>
                    )}
                  </div>

                  <TabsContent value="activites" className="mt-3">
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-24">Code</TableHead>
                              <TableHead>Activité</TableHead>
                              <TableHead className="w-20 text-center">Dép. T1</TableHead>
                              <TableHead className="w-20 text-center">Dép. T2</TableHead>
                              <TableHead className="w-20 text-center">Dép. T3</TableHead>
                              <TableHead className="w-20 text-center">Dép. T4</TableHead>
                              <TableHead className="w-24 text-center">Cumulé</TableHead>
                              <TableHead className="w-20">Statut</TableHead>
                              <TableHead className="w-16"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {fichesFiltered.map((fiche) => {
                              const workflow = DEFAULT_WORKFLOWS.find(w => w.id === fiche.workflowId);
                              const isEditable = fiche.status === "brouillon";
                              
                              // Calculer les dépenses par trimestre pour cette activité
                              const activityFiches = fiches.filter(f => f.activityId === fiche.activityId);
                              const getQuarterExpenses = (quarter: number) => {
                                const qFiches = activityFiches.filter(f => {
                                  const month = new Date(f.dateCollecte).getMonth();
                                  return Math.floor(month / 3) + 1 === quarter;
                                });
                                if (qFiches.length === 0) return null;
                                // Prendre la dernière fiche du trimestre
                                const lastFiche = qFiches.sort((a, b) => new Date(b.dateCollecte).getTime() - new Date(a.dateCollecte).getTime())[0];
                                return lastFiche.depensesCumulees;
                              };
                              const t1 = getQuarterExpenses(1);
                              const t2 = getQuarterExpenses(2);
                              const t3 = getQuarterExpenses(3);
                              const t4 = getQuarterExpenses(4);
                              
                              return (
                                <TableRow 
                                  key={fiche.id} 
                                  className={cn(
                                    "cursor-pointer hover:bg-muted/50",
                                    !isEditable && "opacity-80"
                                  )}
                                  onClick={() => handleOpenFiche(fiche)}
                                >
                                  <TableCell className="font-mono text-xs">{fiche.code}</TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium text-sm truncate max-w-[200px]">{fiche.activityName}</p>
                                      <p className="text-xs text-muted-foreground">{fiche.responsable}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {t1 !== null ? (
                                      <span className="text-xs font-medium font-mono">{formatBudget(t1)}</span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {t2 !== null ? (
                                      <span className="text-xs font-medium font-mono">{formatBudget(t2)}</span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {t3 !== null ? (
                                      <span className="text-xs font-medium font-mono">{formatBudget(t3)}</span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {t4 !== null ? (
                                      <span className="text-xs font-medium font-mono">{formatBudget(t4)}</span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <Progress value={fiche.progressPercentage} className="h-1.5 w-10" />
                                      <span className="text-xs font-bold">{fiche.progressPercentage}%</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={cn("text-xs", statusConfig[fiche.status].color)}>
                                      {!isEditable && <Lock className="w-3 h-3 mr-1" />}
                                      {statusConfig[fiche.status].label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Button variant="ghost" size="icon" className="h-6 w-6">
                                        {isEditable ? <Edit className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleExportFicheEnrichiePDF(fiche);
                                        }}
                                        title="Exporter PDF"
                                      >
                                        <FileDown className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="indicateurs" className="mt-3">
                    {(() => {
                      const ficheInd = fichesIndicateurs.find(f => f.collecteId === selectedCollecte);
                      
                      if (!ficheInd) {
                        return (
                          <Card className="py-8">
                            <CardContent className="text-center">
                              <Target className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                              <p className="text-muted-foreground">Aucun indicateur défini pour ce projet</p>
                            </CardContent>
                          </Card>
                        );
                      }

                      const isEditable = ficheInd.status === "brouillon";
                      const globalProgress = ficheInd.indicateurs.length > 0
                        ? Math.round(ficheInd.indicateurs.reduce((sum, ind) => sum + (ind.targetValue > 0 ? (ind.currentValue / ind.targetValue) * 100 : 0), 0) / ficheInd.indicateurs.length)
                        : 0;

                      return (
                        <Card>
                          <CardHeader className="py-3 border-b bg-muted/30">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <Target className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <CardTitle className="text-sm">{ficheInd.code}</CardTitle>
                                  <p className="text-xs text-muted-foreground">
                                    {ficheInd.indicateurs.length} indicateur(s) • Atteinte globale: {globalProgress}%
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={cn("text-xs", statusConfig[ficheInd.status].color)}>
                                  {!isEditable && <Lock className="w-3 h-3 mr-1" />}
                                  {statusConfig[ficheInd.status].label}
                                </Badge>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleOpenFicheIndicateur(ficheInd)}
                                  title={isEditable ? "Soumettre / consulter la fiche globale" : "Consulter la fiche globale"}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  {isEditable ? "Soumettre" : "Consulter"}
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs">Indicateur</TableHead>
                                  <TableHead className="text-xs w-16 text-right">Cible</TableHead>
                                  <TableHead className="text-xs w-16 text-center">Val. T1</TableHead>
                                  <TableHead className="text-xs w-16 text-center">Val. T2</TableHead>
                                  <TableHead className="text-xs w-16 text-center">Val. T3</TableHead>
                                  <TableHead className="text-xs w-16 text-center">Val. T4</TableHead>
                                  <TableHead className="text-xs w-20 text-right">Actuel</TableHead>
                                  <TableHead className="text-xs w-24">Atteinte</TableHead>
                                  <TableHead className="text-xs w-12"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {ficheInd.indicateurs.map((ind) => {
                                  const progress = ind.targetValue > 0 ? Math.round((ind.currentValue / ind.targetValue) * 100) : 0;
                                  const progressColor = progress >= 100 ? "text-green-600" : progress >= 75 ? "text-amber-600" : "text-red-600";
                                  
                                  // Calculer les valeurs atteintes par trimestre pour cet indicateur
                                  const getIndicatorQuarterValue = (quarter: number) => {
                                    const qFiches = fichesIndicateurs.filter(fi => {
                                      const month = new Date(fi.dateCollecte).getMonth();
                                      return fi.projectId === ficheInd.projectId && Math.floor(month / 3) + 1 === quarter;
                                    });
                                    if (qFiches.length === 0) return null;
                                    // Prendre la dernière fiche du trimestre
                                    const lastFiche = qFiches.sort((a, b) => new Date(b.dateCollecte).getTime() - new Date(a.dateCollecte).getTime())[0];
                                    const matchingInd = lastFiche.indicateurs.find(i => i.indicateurId === ind.indicateurId);
                                    return matchingInd ? matchingInd.currentValue : null;
                                  };
                                  const t1 = getIndicatorQuarterValue(1);
                                  const t2 = getIndicatorQuarterValue(2);
                                  const t3 = getIndicatorQuarterValue(3);
                                  const t4 = getIndicatorQuarterValue(4);
                                  
                                  const handleOpenIndicateurDetail = () => {
                                    setSelectedIndicateurDetail({
                                      indicateur: ind,
                                      ficheId: ficheInd.id,
                                      ficheCode: ficheInd.code,
                                      projectName: ficheInd.projectName,
                                      dateCollecte: ficheInd.dateCollecte,
                                      projectId: ficheInd.projectId,
                                    });
                                    setIndicateurDetailOpen(true);
                                  };
                                  
                                  return (
                                    <TableRow 
                                      key={ind.indicateurId}
                                      className="cursor-pointer hover:bg-muted/50"
                                      onClick={handleOpenIndicateurDetail}
                                    >
                                      <TableCell>
                                        <div>
                                          <p className="font-medium text-sm">{ind.indicateurName}</p>
                                          <p className="text-xs text-muted-foreground">{ind.unit}</p>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right text-xs font-medium">
                                        {new Intl.NumberFormat("fr-FR").format(ind.targetValue)}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {t1 !== null ? <span className="text-xs font-medium">{new Intl.NumberFormat("fr-FR").format(t1)}</span> : <span className="text-xs text-muted-foreground">-</span>}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {t2 !== null ? <span className="text-xs font-medium">{new Intl.NumberFormat("fr-FR").format(t2)}</span> : <span className="text-xs text-muted-foreground">-</span>}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {t3 !== null ? <span className="text-xs font-medium">{new Intl.NumberFormat("fr-FR").format(t3)}</span> : <span className="text-xs text-muted-foreground">-</span>}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {t4 !== null ? <span className="text-xs font-medium">{new Intl.NumberFormat("fr-FR").format(t4)}</span> : <span className="text-xs text-muted-foreground">-</span>}
                                      </TableCell>
                                      <TableCell className="text-right text-sm font-medium">
                                        {new Intl.NumberFormat("fr-FR").format(ind.currentValue)}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <Progress value={Math.min(progress, 100)} className="h-1.5 w-12" />
                                          <span className={cn("text-xs font-bold", progressColor)}>{progress}%</span>
                                        </div>
                                      </TableCell>
                                      <TableCell onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-1">
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6"
                                            onClick={handleOpenIndicateurDetail}
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6"
                                            onClick={() => {
                                              exportIndicateurSuiviDetailToPDF({
                                                indicateur: {
                                                  id: ind.indicateurId,
                                                  code: ind.indicateurCode,
                                                  name: ind.indicateurName,
                                                  unit: ind.unit,
                                                  baselineValue: ind.baselineValue,
                                                  targetValue: ind.targetValue,
                                                  currentValue: ind.currentValue,
                                                  previousValue: ind.previousValue,
                                                },
                                                projectName: ficheInd.projectName,
                                                dateCollecte: ficheInd.dateCollecte,
                                                ficheCode: ficheInd.code,
                                                quarterlyValues: { t1, t2, t3, t4 },
                                              });
                                            }}
                                            title="Exporter PDF"
                                          >
                                            <FileDown className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      );
                    })()}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </>
        )}

        {view === "execution" && (
          <>
            {/* Header synthèse avec bouton export */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Vue d'ensemble de l'exécution</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportSynthesePDF}
                className="gap-2"
              >
                <FileDown className="w-4 h-4" />
                Rapport synthèse PDF
              </Button>
            </div>
            
            {/* KPIs principaux */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card className="border-l-4 border-l-primary">
                <CardContent className="py-3">
                  <p className="text-xs text-muted-foreground">Projets actifs</p>
                  <p className="text-2xl font-bold">{projectsList.filter(p => fiches.some(f => f.projectId === p.id)).length}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="py-3">
                  <p className="text-xs text-muted-foreground">Activités suivies</p>
                  <p className="text-2xl font-bold">{[...new Set(fiches.map(f => f.activityId))].length}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="py-3">
                  <p className="text-xs text-muted-foreground">Avancement moyen</p>
                  <p className="text-2xl font-bold">{fiches.length > 0 ? Math.round(fiches.reduce((s, f) => s + f.progressPercentage, 0) / fiches.length) : 0}%</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="py-3">
                  <p className="text-xs text-muted-foreground">Taux d'exécution</p>
                  <p className="text-2xl font-bold">{stats.tauxGlobal}%</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-secondary">
                <CardContent className="py-3">
                  <p className="text-xs text-muted-foreground">Dépenses cumulées</p>
                  <p className="text-2xl font-bold">{formatBudget(stats.depensesCumulees)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Tableau hiérarchique : Service → Projet/Opération → Activité (avec mode Budget / Livrables) */}
            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-primary" />
                    Situation des activités PTA
                  </CardTitle>
                  <div className="inline-flex rounded-md border bg-muted/30 p-0.5">
                    <Button
                      type="button"
                      size="sm"
                      variant={executionDisplayMode === "budget" ? "default" : "ghost"}
                      className="h-7 text-xs gap-1.5"
                      onClick={() => setExecutionDisplayMode("budget")}
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      Vue Budget
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={executionDisplayMode === "deliverables" ? "default" : "ghost"}
                      className="h-7 text-xs gap-1.5"
                      onClick={() => setExecutionDisplayMode("deliverables")}
                    >
                      <Package className="w-3.5 h-3.5" />
                      Vue Livrables
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={executionDisplayMode === "pipeline" ? "default" : "ghost"}
                      className="h-7 text-xs gap-1.5"
                      onClick={() => setExecutionDisplayMode("pipeline")}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      Vue Pipeline
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {executionDisplayMode === "pipeline" ? (
                  <div className="p-3 space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Progression des activités à travers les étapes de leur workflow (filtres service / projet / opération appliqués). Cliquez sur une étape pour voir et ouvrir les fiches concernées.
                    </p>
                    {DEFAULT_WORKFLOWS.map(workflow => {
                      const wfFiches = fichesFiltered.filter(f => f.workflowId === workflow.id);
                      if (wfFiches.length === 0) return null;
                      // Latest fiche per activity to avoid double counting across collectes
                      const latestByAct = new Map<string, FicheSuivi>();
                      wfFiches.forEach(f => {
                        const prev = latestByAct.get(f.activityId);
                        if (!prev || new Date(f.dateCollecte) > new Date(prev.dateCollecte)) {
                          latestByAct.set(f.activityId, f);
                        }
                      });
                      const latestFiches = Array.from(latestByAct.values());
                      const total = latestFiches.length;
                      const avgProgress = Math.round(
                        latestFiches.reduce((s, f) => s + (f.progressPercentage || 0), 0) / total
                      );
                      const finalStep = workflow.steps.find(s => s.isFinal);
                      const finishedCount = finalStep
                        ? latestFiches.filter(f => f.currentStepId === finalStep.id).length
                        : 0;
                      return (
                        <div key={workflow.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{workflow.name}</span>
                              <Badge variant="outline" className="text-xs">{total} activité{total > 1 ? "s" : ""}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-muted-foreground">
                                Avancement moyen <span className="font-semibold text-foreground">{avgProgress}%</span>
                              </span>
                              <span className="text-muted-foreground">
                                Terminées <span className="font-semibold text-green-600">{finishedCount}/{total}</span>
                              </span>
                            </div>
                          </div>
                          <div className="relative">
                            <div className="flex items-stretch gap-1">
                              {workflow.steps.map((step, i) => {
                                const atFiches = latestFiches.filter(f => f.currentStepId === step.id);
                                const reached = latestFiches.filter(f => {
                                  const s = workflow.steps.find(st => st.id === f.currentStepId);
                                  return (s?.order ?? 0) >= step.order;
                                }).length;
                                const reachedPct = Math.round((reached / total) * 100);
                                const atStep = atFiches.length;
                                const clickable = atStep > 0;
                                return (
                                  <button
                                    key={step.id}
                                    type="button"
                                    disabled={!clickable}
                                    onClick={() => setPipelineDrill({ workflowName: workflow.name, stepName: step.name, stepColor: step.color, fiches: atFiches })}
                                    className={cn(
                                      "flex-1 min-w-0 text-left rounded-md p-1 -m-1 transition-colors",
                                      clickable ? "hover:bg-muted/60 cursor-pointer" : "cursor-default opacity-90"
                                    )}
                                    title={clickable ? `Voir les ${atStep} activité(s) à l'étape « ${step.name} »` : "Aucune activité à cette étape"}
                                  >
                                    <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                                      <div className={cn("absolute inset-y-0 left-0", step.color)} style={{ width: `${reachedPct}%` }} />
                                    </div>
                                    <div className="mt-1.5 flex items-start gap-1.5">
                                      <div className={cn("w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white", step.color)}>
                                        {i + 1}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className={cn("text-[11px] font-medium truncate leading-tight", clickable && "underline-offset-2 group-hover:underline")} title={step.name}>{step.name}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                          <span className={cn("font-semibold", clickable ? "text-primary" : "text-foreground")}>{atStep}</span> en cours · {reachedPct}% atteint
                                        </p>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {fichesFiltered.filter(f => f.workflowId).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Aucune activité avec workflow renseigné pour les filtres sélectionnés.
                      </p>
                    )}
                  </div>
                ) : (
                <div className="overflow-x-auto">
                  {(() => {
                    const isBudget = executionDisplayMode === "budget";
                    const fmtN = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
                    // Index PTA activity meta
                    const actMeta = new Map<string, PTAActivity>();
                    initialActivities.forEach(a => actMeta.set(a.id, a));

                    // Latest fiche per activity (within fichesFiltered scope)
                    const latestByActivity = new Map<string, FicheSuivi>();
                    fichesFiltered.forEach(f => {
                      const prev = latestByActivity.get(f.activityId);
                      if (!prev || new Date(f.dateCollecte) > new Date(prev.dateCollecte)) {
                        latestByActivity.set(f.activityId, f);
                      }
                    });

                    // Aggregate cumulated currentValue per livrable across all fiches of the activity
                    const livrableCurrentByActivity = new Map<string, Map<string, number>>();
                    fichesFiltered.forEach(f => {
                      const m = livrableCurrentByActivity.get(f.activityId) || new Map<string, number>();
                      f.livrables.forEach(l => {
                        const cur = m.get(l.livrableId) || 0;
                        // Take the max (cumulated value, latest is the highest in this mock)
                        if (l.currentValue > cur) m.set(l.livrableId, l.currentValue);
                      });
                      livrableCurrentByActivity.set(f.activityId, m);
                    });

                    // Build hierarchy:
                    //  - Projects: Service responsable activité (L0) → Projet (L1) → Activities (L2)
                    //  - Operations: Service (L0) → Operation (L1) → Activities (L2)
                    type SubNode = { type: "projet" | "operation"; id: string; label: string; activities: PTAActivity[] };
                    type TopNode = { id: string; label: string; subs: Record<string, SubNode> };
                    const tree: Record<string, TopNode> = {};

                    Array.from(latestByActivity.keys()).forEach(actId => {
                      const meta = actMeta.get(actId);
                      if (!meta) return;

                      // Niveau 0 : structure responsable
                      // - Activité rattachée à un projet : on utilise le service responsable du PROJET (héritage)
                      // - Activité d'opération (hors projet) : on utilise le service responsable de l'activité
                      let srvId: string = "no-service";
                      if (meta.projectId && !meta.operationId) {
                        const prj = mockProjects.find(p => p.id === meta.projectId);
                        srvId = prj?.serviceResponsableId || meta.serviceResponsableId || "no-service";
                      } else {
                        srvId = meta.serviceResponsableId || "no-service";
                      }
                      const srv = srvId !== "no-service" ? getServiceById(srvId) : undefined;
                      const srvLabel = srv ? `${srv.code} — ${srv.nom}` : "Service non défini";
                      const topKey = `srv-${srvId}`;
                      if (!tree[topKey]) tree[topKey] = { id: srvId, label: srvLabel, subs: {} };

                      if (meta.operationId) {
                        const op = getOperationById(meta.operationId);
                        const subKey = `op-${meta.operationId}`;
                        if (!tree[topKey].subs[subKey]) tree[topKey].subs[subKey] = {
                          type: "operation", id: meta.operationId,
                          label: op ? `${op.code} — ${op.libelle}` : (meta.operationName || "Opération"),
                          activities: [],
                        };
                        tree[topKey].subs[subKey].activities.push(meta);
                      } else if (meta.projectId) {
                        const subKey = `prj-${meta.projectId}`;
                        if (!tree[topKey].subs[subKey]) tree[topKey].subs[subKey] = {
                          type: "projet", id: meta.projectId, label: meta.project, activities: [],
                        };
                        tree[topKey].subs[subKey].activities.push(meta);
                      }
                    });

                    // Quarter helper from fiche date
                    const getActQuarter = (actId: string, q: number): number | null => {
                      const fs = fichesFiltered.filter(f => f.activityId === actId && (Math.floor(new Date(f.dateCollecte).getMonth() / 3) + 1) === q);
                      if (fs.length === 0) return null;
                      const last = fs.sort((a, b) => new Date(b.dateCollecte).getTime() - new Date(a.dateCollecte).getTime())[0];
                      return last.progressPercentage;
                    };

                    // Taux d'exécution sur livrables d'une activité (moyenne des % de réalisation)
                    const getActDelivRate = (act: PTAActivity): number => {
                      if (!act.deliverables.length) return 0;
                      const livMap = livrableCurrentByActivity.get(act.id) || new Map<string, number>();
                      let total = 0; let count = 0;
                      act.deliverables.forEach(d => {
                        if (d.targetValue > 0) {
                          const cur = livMap.get(d.id) || 0;
                          total += Math.min(cur / d.targetValue, 1) * 100;
                          count++;
                        }
                      });
                      return count > 0 ? Math.round(total / count) : 0;
                    };
                    // Date de dernière mise à jour pour un ensemble d'activités
                    const getLastUpdate = (acts: PTAActivity[]): string | null => {
                      let latest: string | null = null;
                      acts.forEach(a => {
                        const f = latestByActivity.get(a.id);
                        if (f && (!latest || new Date(f.dateCollecte) > new Date(latest))) latest = f.dateCollecte;
                      });
                      return latest;
                    };
                    const fmtDate = (d: string | null) => d ? format(parseISO(d), "dd/MM/yy") : "-";

                    const services = Object.values(tree);
                    if (services.length === 0) {
                      return <div className="p-6 text-center text-sm text-muted-foreground">Aucune activité ne correspond aux filtres.</div>;
                    }

                    return (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left p-2 font-semibold text-muted-foreground text-xs min-w-[220px]">Activité / Livrable</th>
                            {isBudget ? (
                              <>
                                <th className="text-right p-2 font-semibold text-muted-foreground text-xs w-24">Budget</th>
                                <th className="text-right p-2 font-semibold text-muted-foreground text-xs w-24">Dépenses</th>
                                <th className="text-right p-2 font-semibold text-muted-foreground text-xs w-16" title="Taux d'exécution budgétaire">Taux $</th>
                                <th className="text-center p-2 font-semibold text-muted-foreground text-xs w-14">T1</th>
                                <th className="text-center p-2 font-semibold text-muted-foreground text-xs w-14">T2</th>
                                <th className="text-center p-2 font-semibold text-muted-foreground text-xs w-14">T3</th>
                                <th className="text-center p-2 font-semibold text-muted-foreground text-xs w-14">T4</th>
                                <th className="text-center p-2 font-semibold text-muted-foreground text-xs w-20">Cumulé</th>
                                <th className="text-right p-2 font-semibold text-muted-foreground text-xs w-16" title="Taux d'exécution sur livrables">Taux livr.</th>
                                <th className="text-center p-2 font-semibold text-muted-foreground text-xs w-20">Dernière MAJ</th>
                              </>
                            ) : (
                              <>
                                <th className="text-right p-2 font-semibold text-muted-foreground text-xs w-24">Budget annuel</th>
                                <th className="text-right p-2 font-semibold text-muted-foreground text-xs w-24">Dépenses</th>
                                <th className="text-right p-2 font-semibold text-muted-foreground text-xs w-16" title="Taux d'exécution budgétaire">Taux $</th>
                                <th className="text-right p-2 font-semibold text-muted-foreground text-xs w-20">Cible</th>
                                <th className="text-right p-2 font-semibold text-muted-foreground text-xs w-20">Réalisé</th>
                                <th className="text-right p-2 font-semibold text-muted-foreground text-xs w-16" title="Taux d'exécution sur livrables">Taux livr.</th>
                                <th className="text-center p-2 font-semibold text-muted-foreground text-xs w-20">Dernière MAJ</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {services.map(top => {
                            const allActs = Object.values(top.subs).flatMap(g => g.activities);
                            const topBudget = allActs.reduce((s, a) => s + a.budgetTotal, 0);
                            const topDep = allActs.reduce((s, a) => s + (latestByActivity.get(a.id)?.depensesCumulees || 0), 0);
                            const topTaux = topBudget > 0 ? Math.round((topDep / topBudget) * 100) : 0;
                            const topLivRates = allActs.map(getActDelivRate).filter(r => r > 0 || allActs.some(a => a.deliverables.length));
                            const topLivRate = allActs.length > 0 ? Math.round(allActs.reduce((s, a) => s + getActDelivRate(a), 0) / allActs.length) : 0;
                            const topLastUpd = getLastUpdate(allActs);

                            return (
                              <React.Fragment key={top.id}>
                                {/* Niveau 0 : Structure responsable (service) */}
                                <tr className="bg-primary/10 border-b border-primary/20">
                                  <td className="p-2 font-bold text-sm">
                                    <div className="flex items-center gap-2">
                                      <Building2 className="w-3.5 h-3.5 text-primary" />
                                      <span>{top.label}</span>
                                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{allActs.length} act.</Badge>
                                    </div>
                                  </td>
                                  {isBudget ? (
                                    <>
                                      <td className="p-2 text-right font-bold text-xs">{formatBudget(topBudget)}</td>
                                      <td className="p-2 text-right font-bold text-xs">{formatBudget(topDep)}</td>
                                      <td className={cn("p-2 text-right text-xs font-bold", topTaux >= 80 ? "text-green-600" : topTaux >= 50 ? "text-amber-600" : "text-red-600")}>{topTaux}%</td>
                                      <td colSpan={5}></td>
                                      <td className={cn("p-2 text-right text-xs font-bold", topLivRate >= 80 ? "text-green-600" : topLivRate >= 50 ? "text-amber-600" : "text-red-600")}>{topLivRate}%</td>
                                      <td className="p-2 text-center text-[11px] font-medium text-muted-foreground">{fmtDate(topLastUpd)}</td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="p-2 text-right font-bold text-xs">{formatBudget(topBudget)}</td>
                                      <td className="p-2 text-right font-bold text-xs">{formatBudget(topDep)}</td>
                                      <td className={cn("p-2 text-right text-xs font-bold", topTaux >= 80 ? "text-green-600" : topTaux >= 50 ? "text-amber-600" : "text-red-600")}>{topTaux}%</td>
                                      <td colSpan={2}></td>
                                      <td className={cn("p-2 text-right text-xs font-bold", topLivRate >= 80 ? "text-green-600" : topLivRate >= 50 ? "text-amber-600" : "text-red-600")}>{topLivRate}%</td>
                                      <td className="p-2 text-center text-[11px] font-medium text-muted-foreground">{fmtDate(topLastUpd)}</td>
                                    </>
                                  )}
                                </tr>

                                {Object.entries(top.subs).map(([gKey, group]) => {
                                  const grpBudget = group.activities.reduce((s, a) => s + a.budgetTotal, 0);
                                  const grpDep = group.activities.reduce((s, a) => s + (latestByActivity.get(a.id)?.depensesCumulees || 0), 0);
                                  const grpTaux = grpBudget > 0 ? Math.round((grpDep / grpBudget) * 100) : 0;
                                  const grpLivRate = group.activities.length > 0 ? Math.round(group.activities.reduce((s, a) => s + getActDelivRate(a), 0) / group.activities.length) : 0;
                                  const grpLastUpd = getLastUpdate(group.activities);
                                  const subIsOp = group.type === "operation";

                                  return (
                                    <React.Fragment key={gKey}>
                                      {/* Niveau 1 : Projet ou Opération */}
                                      <tr className="bg-muted/40 border-b">
                                        <td className="p-2 pl-6 font-semibold text-xs">
                                          <div className="flex items-center gap-2">
                                            {subIsOp ? <Building2 className="w-3 h-3 text-muted-foreground shrink-0" /> : <Briefcase className="w-3 h-3 text-muted-foreground shrink-0" />}
                                            <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 shrink-0",
                                              subIsOp ? "border-amber-400 text-amber-700 dark:text-amber-300" : "border-blue-400 text-blue-700 dark:text-blue-300")}>
                                              {subIsOp ? "Opération" : "Projet"}
                                            </Badge>
                                            <span className="truncate">{group.label}</span>
                                          </div>
                                        </td>
                                        {isBudget ? (
                                          <>
                                            <td className="p-2 text-right font-semibold text-[11px]">{formatBudget(grpBudget)}</td>
                                            <td className="p-2 text-right font-semibold text-[11px]">{formatBudget(grpDep)}</td>
                                            <td className={cn("p-2 text-right text-[11px] font-semibold", grpTaux >= 80 ? "text-green-600" : grpTaux >= 50 ? "text-amber-600" : "text-red-600")}>{grpTaux}%</td>
                                            <td colSpan={5}></td>
                                            <td className={cn("p-2 text-right text-[11px] font-semibold", grpLivRate >= 80 ? "text-green-600" : grpLivRate >= 50 ? "text-amber-600" : "text-red-600")}>{grpLivRate}%</td>
                                            <td className="p-2 text-center text-[11px] text-muted-foreground">{fmtDate(grpLastUpd)}</td>
                                          </>
                                        ) : (
                                          <>
                                            <td className="p-2 text-right font-semibold text-[11px]">{formatBudget(grpBudget)}</td>
                                            <td className="p-2 text-right font-semibold text-[11px]">{formatBudget(grpDep)}</td>
                                            <td className={cn("p-2 text-right text-[11px] font-semibold", grpTaux >= 80 ? "text-green-600" : grpTaux >= 50 ? "text-amber-600" : "text-red-600")}>{grpTaux}%</td>
                                            <td colSpan={2}></td>
                                            <td className={cn("p-2 text-right text-[11px] font-semibold", grpLivRate >= 80 ? "text-green-600" : grpLivRate >= 50 ? "text-amber-600" : "text-red-600")}>{grpLivRate}%</td>
                                            <td className="p-2 text-center text-[11px] text-muted-foreground">{fmtDate(grpLastUpd)}</td>
                                          </>
                                        )}
                                      </tr>

                                      {/* Niveau 2 : Activités */}
                                      {group.activities.map(act => {
                                        const fi = latestByActivity.get(act.id);
                                        if (!fi) return null;
                                        const taux = act.budgetTotal > 0 ? Math.round((fi.depensesCumulees / act.budgetTotal) * 100) : 0;
                                        const livMap = livrableCurrentByActivity.get(act.id) || new Map();
                                        const actLivRate = getActDelivRate(act);
                                        return (
                                          <React.Fragment key={act.id}>
                                            <tr className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => handleOpenFiche(fi)}>
                                              <td className="p-1.5 pl-10">
                                                <span className="text-xs truncate block max-w-[300px]">{act.name}</span>
                                              </td>
                                              {isBudget ? (
                                                <>
                                                  <td className="text-right font-mono text-[11px] py-1.5">{formatBudget(act.budgetTotal)}</td>
                                                  <td className="text-right font-mono text-[11px] py-1.5">{formatBudget(fi.depensesCumulees)}</td>
                                                  <td className={cn("text-right text-[11px] font-medium py-1.5", taux >= 80 ? "text-green-600" : taux >= 50 ? "text-amber-600" : "text-red-600")}>{taux}%</td>
                                                  {[1, 2, 3, 4].map(q => {
                                                    const v = getActQuarter(act.id, q);
                                                    return (
                                                      <td key={q} className="text-center py-1.5">
                                                        {v !== null ? <span className={cn("text-[11px]", v >= 75 ? "text-green-600" : v >= 50 ? "text-amber-600" : "text-muted-foreground")}>{v}%</span> : <span className="text-[11px] text-muted-foreground/50">-</span>}
                                                      </td>
                                                    );
                                                  })}
                                                  <td className="text-center py-1.5">
                                                    <div className="flex items-center justify-center gap-1">
                                                      <Progress value={fi.progressPercentage} className="h-1 w-10" />
                                                      <span className="text-[11px] font-medium">{fi.progressPercentage}%</span>
                                                    </div>
                                                  </td>
                                                  <td className={cn("text-right text-[11px] font-medium py-1.5", actLivRate >= 80 ? "text-green-600" : actLivRate >= 50 ? "text-amber-600" : "text-red-600")}>{actLivRate}%</td>
                                                  <td className="text-center text-[11px] text-muted-foreground py-1.5 pr-2">{fmtDate(fi.dateCollecte)}</td>
                                                </>
                                              ) : (
                                                <>
                                                  <td className="text-right font-mono text-[11px] py-1.5">{formatBudget(act.budgetTotal)}</td>
                                                  <td className="text-right font-mono text-[11px] py-1.5">{formatBudget(fi.depensesCumulees)}</td>
                                                  <td className={cn("text-right text-[11px] font-medium py-1.5", taux >= 80 ? "text-green-600" : taux >= 50 ? "text-amber-600" : "text-red-600")}>{taux}%</td>
                                                  <td colSpan={2} className="p-1.5 text-right text-[10px] text-muted-foreground italic">
                                                    {act.deliverables.length > 0 ? `${act.deliverables.length} livrable${act.deliverables.length > 1 ? "s" : ""} ↓` : "Aucun livrable"}
                                                  </td>
                                                  <td className={cn("text-right text-[11px] font-medium py-1.5", actLivRate >= 80 ? "text-green-600" : actLivRate >= 50 ? "text-amber-600" : "text-red-600")}>{actLivRate}%</td>
                                                  <td className="text-center text-[11px] text-muted-foreground py-1.5 pr-2">{fmtDate(fi.dateCollecte)}</td>
                                                </>
                                              )}
                                            </tr>

                                            {/* Lignes livrables (mode deliverables) */}
                                            {!isBudget && act.deliverables.map(del => {
                                              const cur = livMap.get(del.id) || 0;
                                              const tauxL = del.targetValue > 0 ? Math.round((cur / del.targetValue) * 100) : 0;
                                              return (
                                                <tr key={`${act.id}-${del.id}`} className="border-b bg-muted/10">
                                                  <td className="p-1.5 pl-16 text-[11px]">
                                                    <div className="flex items-center gap-1.5">
                                                      <Package className="w-3 h-3 text-muted-foreground shrink-0" />
                                                      <span className="truncate">{del.unit}</span>
                                                    </div>
                                                  </td>
                                                  <td colSpan={3}></td>
                                                  <td className="p-1.5 text-right text-[11px] font-medium">{del.targetValue > 0 ? fmtN(del.targetValue) : "-"}</td>
                                                  <td className="p-1.5 text-right text-[11px] font-medium">{cur > 0 ? fmtN(cur) : "-"}</td>
                                                  <td className={cn("p-1.5 text-right text-[11px] font-medium", tauxL >= 80 ? "text-green-600" : tauxL >= 50 ? "text-amber-600" : "text-muted-foreground")}>{del.targetValue > 0 ? `${tauxL}%` : "-"}</td>
                                                  <td></td>
                                                </tr>
                                              );
                                            })}
                                          </React.Fragment>
                                        );
                                      })}
                                    </React.Fragment>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Pipeline drill-down dialog */}
        <Dialog open={!!pipelineDrill} onOpenChange={(o) => !o && setPipelineDrill(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                {pipelineDrill?.stepColor && (
                  <span className={cn("w-3 h-3 rounded-full", pipelineDrill.stepColor)} />
                )}
                {pipelineDrill?.workflowName} — Étape « {pipelineDrill?.stepName} »
              </DialogTitle>
              <DialogDescription>
                {pipelineDrill?.fiches.length || 0} activité{(pipelineDrill?.fiches.length || 0) > 1 ? "s" : ""} actuellement à cette étape. Cliquez pour ouvrir la fiche.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto -mx-2">
              <div className="divide-y">
                {pipelineDrill?.fiches.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setSelectedFiche(f);
                      setFormOpen(true);
                      setPipelineDrill(null);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{f.activityName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {f.projectName} · {f.code} · {format(parseISO(f.dateCollecte), "dd MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="text-xs">{f.progressPercentage}%</Badge>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Form dialogs */}
        <FicheSuiviForm
          open={formOpen}
          onOpenChange={setFormOpen}
          fiche={selectedFiche}
          workflow={selectedFiche ? DEFAULT_WORKFLOWS.find(w => w.id === selectedFiche.workflowId) : undefined}
          onSubmit={handleSubmitFiche}
          onValidate={handleValidateFiche}
          onApprove={handleApproveFiche}
          canValidate={true}
          canApprove={true}
          activityPeriod={selectedFiche ? (() => {
            // L'activityId dans la fiche peut être sous forme "pta-xxx" ou juste "xxx"
            const cleanActivityId = selectedFiche.activityId.replace('pta-', '');
            const ptaAct = initialActivities.find(a => a.activityId === cleanActivityId || a.activityId === selectedFiche.activityId);
            if (!ptaAct) {
              // Chercher directement dans le projet
              const project = mockProjects.find(p => p.id === selectedFiche.projectId);
              const activity = project?.activities?.find(a => a.id === cleanActivityId || a.id.includes(cleanActivityId));
              return activity ? { startDate: activity.startDate, endDate: activity.endDate } : undefined;
            }
            const project = mockProjects.find(p => p.id === selectedFiche.projectId);
            const activity = project?.activities?.find(a => a.id === cleanActivityId || a.id.includes(cleanActivityId));
            return activity ? { startDate: activity.startDate, endDate: activity.endDate } : undefined;
          })() : undefined}
          activityBudgetByQuarter={selectedFiche ? (() => {
            const cleanActivityId = selectedFiche.activityId.replace('pta-', '');
            const ptaAct = initialActivities.find(a => a.activityId === cleanActivityId || a.activityId === selectedFiche.activityId || a.id === selectedFiche.activityId);
            return ptaAct ? { t1: ptaAct.budgetT1, t2: ptaAct.budgetT2, t3: ptaAct.budgetT3, t4: ptaAct.budgetT4 } : undefined;
          })() : undefined}
        />
        
        <CollecteForm
          open={collecteFormOpen}
          onOpenChange={setCollecteFormOpen}
          projects={projectsList.map(p => ({ id: p.id, name: p.name }))}
          services={servicesList.map(s => ({ id: s.id, nom: s.nom }))}
          openPTAs={getOpenPTAs().map(p => ({ id: p.id, code: p.code, name: p.name, year: p.year }))}
          onSubmit={handleCreateCollecte}
        />
        
        <FicheIndicateurForm
          open={ficheIndicateurFormOpen}
          onOpenChange={setFicheIndicateurFormOpen}
          fiche={selectedFicheIndicateur}
          onSubmit={handleSubmitFicheIndicateur}
          onValidate={handleValidateFicheIndicateur}
          onApprove={handleApproveFicheIndicateur}
        />
        
        {/* Visualisation détaillée d'un indicateur individuel */}
        {selectedIndicateurDetail && (
          <IndicateurSuiviDetail
            open={indicateurDetailOpen}
            onOpenChange={setIndicateurDetailOpen}
            indicateur={selectedIndicateurDetail.indicateur}
            projectName={selectedIndicateurDetail.projectName}
            dateCollecte={selectedIndicateurDetail.dateCollecte}
            ficheCode={selectedIndicateurDetail.ficheCode}
            quarterlyValues={{
              t1: (() => {
                const qFiches = fichesIndicateurs.filter(fi => {
                  const month = new Date(fi.dateCollecte).getMonth();
                  return fi.projectId === selectedIndicateurDetail.projectId && Math.floor(month / 3) + 1 === 1;
                });
                if (qFiches.length === 0) return null;
                const lastFiche = qFiches.sort((a, b) => new Date(b.dateCollecte).getTime() - new Date(a.dateCollecte).getTime())[0];
                const matchingInd = lastFiche.indicateurs.find(i => i.indicateurId === selectedIndicateurDetail.indicateur.indicateurId);
                return matchingInd ? matchingInd.currentValue : null;
              })(),
              t2: (() => {
                const qFiches = fichesIndicateurs.filter(fi => {
                  const month = new Date(fi.dateCollecte).getMonth();
                  return fi.projectId === selectedIndicateurDetail.projectId && Math.floor(month / 3) + 1 === 2;
                });
                if (qFiches.length === 0) return null;
                const lastFiche = qFiches.sort((a, b) => new Date(b.dateCollecte).getTime() - new Date(a.dateCollecte).getTime())[0];
                const matchingInd = lastFiche.indicateurs.find(i => i.indicateurId === selectedIndicateurDetail.indicateur.indicateurId);
                return matchingInd ? matchingInd.currentValue : null;
              })(),
              t3: (() => {
                const qFiches = fichesIndicateurs.filter(fi => {
                  const month = new Date(fi.dateCollecte).getMonth();
                  return fi.projectId === selectedIndicateurDetail.projectId && Math.floor(month / 3) + 1 === 3;
                });
                if (qFiches.length === 0) return null;
                const lastFiche = qFiches.sort((a, b) => new Date(b.dateCollecte).getTime() - new Date(a.dateCollecte).getTime())[0];
                const matchingInd = lastFiche.indicateurs.find(i => i.indicateurId === selectedIndicateurDetail.indicateur.indicateurId);
                return matchingInd ? matchingInd.currentValue : null;
              })(),
              t4: (() => {
                const qFiches = fichesIndicateurs.filter(fi => {
                  const month = new Date(fi.dateCollecte).getMonth();
                  return fi.projectId === selectedIndicateurDetail.projectId && Math.floor(month / 3) + 1 === 4;
                });
                if (qFiches.length === 0) return null;
                const lastFiche = qFiches.sort((a, b) => new Date(b.dateCollecte).getTime() - new Date(a.dateCollecte).getTime())[0];
                const matchingInd = lastFiche.indicateurs.find(i => i.indicateurId === selectedIndicateurDetail.indicateur.indicateurId);
                return matchingInd ? matchingInd.currentValue : null;
              })(),
            }}
            editable={(() => {
              const f = fichesIndicateurs.find(fi => fi.id === selectedIndicateurDetail.ficheId);
              return f?.status === "brouillon";
            })()}
            onSave={(updated) => handleUpdateSingleIndicateur(
              selectedIndicateurDetail.ficheId,
              selectedIndicateurDetail.indicateur.indicateurId,
              updated
            )}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Suivi;
