import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Target, Wallet, FolderOpen, Plus, LayoutGrid, GanttChart as GanttIcon, Eye, BarChart3, FileText, Lock, Unlock, Edit, CheckCircle, MoreHorizontal, Package } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import GanttChart from "@/components/planification/GanttChart";
import PTAActivityForm from "@/components/planification/PTAActivityForm";
import PTAActivityDetail from "@/components/planification/PTAActivityDetail";
import PTAManager from "@/components/planification/PTAManager";
import PTAIndicatorPlanningComponent from "@/components/planification/PTAIndicatorPlanning";
import PTADeliverablesSynthesis from "@/components/planification/PTADeliverablesSynthesis";
import ExportButtons from "@/components/ui/ExportButtons";
import { mockProjects } from "@/data/mockProjects";
import { mockServices, getServiceById } from "@/data/entitesExecution";
import { mockOperations, getOperationById, getOperationsByService } from "@/data/operations";
import { PTA, PTAActivity, PTAIndicatorPlanning, PTA_STATUS_LABELS, PTA_STATUS_COLORS, PTA_ITEM_VALIDATION_LABELS, PTA_ITEM_VALIDATION_COLORS, generatePTACode } from "@/types/pta";
import { exportPTAToCSV, exportPTAToPDF } from "@/lib/exportPTAUtils";
import { useUnites } from "@/contexts/UnitesContext";
import { cn } from "@/lib/utils";

// Générer les activités PTA depuis les projets existants
// Le seed permet de varier les statuts de validation entre les PTAs annuels
const generatePTAActivitiesFromProjects = (yearSeed: number = 0): PTAActivity[] => {
  const ptaActivities: PTAActivity[] = [];
  let counter = 0;
  
  mockProjects.forEach(project => {
    if (project.activities && project.activities.length > 0) {
      project.activities.forEach(activity => {
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
        quarters.forEach(q => {
          budgetByQ[q as keyof typeof budgetByQ] = budgetPerQuarter;
        });

        const nature = activity.nature || 
          (activity.name.toLowerCase().includes('étude') ? 'Étude' :
           activity.name.toLowerCase().includes('formation') ? 'Formation' :
           activity.name.toLowerCase().includes('travaux') ? 'Travaux' :
           activity.name.toLowerCase().includes('installation') ? 'Équipement' : 'Travaux');

        const deliverables = (activity.deliverables || []).map((del, idx) => {
          const tv = del.targetValue || 0;
          const per = quarters.length > 0 ? Math.floor(tv / quarters.length) : 0;
          const rest = quarters.length > 0 ? tv - per * quarters.length : 0;
          const tQ: Record<string, number> = { T1: 0, T2: 0, T3: 0, T4: 0 };
          quarters.forEach((q, i) => { tQ[q] = per + (i === 0 ? rest : 0); });
          return {
            id: `del-${activity.id}-${idx}`,
            unit: del.uniteMesure?.name || del.unit || "",
            targetValue: tv,
            targetT1: tQ.T1, targetT2: tQ.T2, targetT3: tQ.T3, targetT4: tQ.T4,
          };
        });

        // Distribution variée des statuts de validation : 70% validés, 30% brouillon
        const validationStatus = ((counter + yearSeed) % 10) < 7 ? "valide" : "brouillon";
        counter++;

        ptaActivities.push({
          id: `pta-${yearSeed}-${activity.id}`,
          activityId: activity.id,
          name: activity.name,
          project: project.name,
          projectId: project.id,
          serviceResponsableId: (project as any).serviceResponsableId,
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
          validationStatus,
          validatedAt: validationStatus === "valide" ? `${2024 + yearSeed}-02-15T10:00:00Z` : undefined,
          validatedBy: validationStatus === "valide" ? "Direction" : undefined,
        });
      });
    }
  });
  
  return ptaActivities;
};

// Activités PTA transverses (hors projet) — extraites dans un module partagé pour
// être réutilisées dans le Suivi des réalisations.
import { generateStandalonePTAActivities } from "@/data/standalonePTAActivities";

// Générer les indicateurs PTA depuis les projets
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

const formatBudget = (amount: number) => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(2)} Mds`;
  }
  if (amount === 0) return "-";
  return `${(amount / 1000000).toFixed(0)} M`;
};

const formatNumber = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

const Planification = () => {
  const [viewMode, setViewMode] = useState("table");
  const [displayMode, setDisplayMode] = useState<"budget" | "deliverables">("budget");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedService, setSelectedService] = useState("all");
  const [selectedOperation, setSelectedOperation] = useState("all");

  const { allUnits } = useUnites();
  const unitDescByName = useMemo(() => {
    const m = new Map<string, string>();
    allUnits.forEach((u) => {
      if (u.name) m.set(u.name.trim().toLowerCase(), u.description || u.name);
    });
    return m;
  }, [allUnits]);
  const getUnitDesc = (name: string) => unitDescByName.get((name || "").trim().toLowerCase()) || name;
  
  // PTA Management — 3 exercices : 2024 archivé, 2025 cloturé, 2026 ouvert
  // Chaque exercice combine activités issues des projets + activités transverses (hors projet)
  const activities2024 = useMemo(
    () => [...generatePTAActivitiesFromProjects(0), ...generateStandalonePTAActivities(0)],
    [],
  );
  const activities2025 = useMemo(
    () => [...generatePTAActivitiesFromProjects(1), ...generateStandalonePTAActivities(1)],
    [],
  );
  const activities2026 = useMemo(
    () => [...generatePTAActivitiesFromProjects(2), ...generateStandalonePTAActivities(2)],
    [],
  );
  const indicators2024 = useMemo(() => generatePTAIndicatorsFromProjects(), []);
  const indicators2025 = useMemo(() => generatePTAIndicatorsFromProjects(), []);
  const indicators2026 = useMemo(() => generatePTAIndicatorsFromProjects(), []);

  const [ptaList, setPtaList] = useState<PTA[]>(() => {
    const sumBudget = (acts: PTAActivity[]) => acts.reduce((s, a) => s + a.budgetTotal, 0);
    return [
      {
        id: "pta-2024-1",
        code: "PTA-2024-V01",
        name: "Plan de Travail Annuel 2024",
        year: 2024,
        status: "archive",
        version: 1,
        description: "PTA archivé — exercice clôturé et historisé",
        createdAt: "2024-01-15T10:00:00Z",
        createdBy: "Système",
        openedAt: "2024-01-20T08:00:00Z",
        openedBy: "Direction",
        closedAt: "2024-12-31T23:59:00Z",
        closedBy: "Direction",
        activities: activities2024,
        indicators: indicators2024,
        totalBudget: sumBudget(activities2024),
      },
      {
        id: "pta-2025-1",
        code: "PTA-2025-V01",
        name: "Plan de Travail Annuel 2025",
        year: 2025,
        status: "cloture",
        version: 1,
        description: "PTA exercice 2025 — clôturé en attente d'archivage",
        createdAt: "2024-12-10T09:00:00Z",
        createdBy: "Système",
        openedAt: "2025-01-15T08:00:00Z",
        openedBy: "Direction",
        closedAt: "2025-12-31T23:59:00Z",
        closedBy: "Direction",
        activities: activities2025,
        indicators: indicators2025,
        totalBudget: sumBudget(activities2025),
        previousVersionId: "pta-2024-1",
      },
      {
        id: "pta-2026-1",
        code: "PTA-2026-V01",
        name: "Plan de Travail Annuel 2026",
        year: 2026,
        status: "ouvert",
        version: 1,
        description: "PTA en cours — exercice courant",
        createdAt: "2025-12-05T10:00:00Z",
        createdBy: "Système",
        openedAt: "2026-01-08T08:00:00Z",
        openedBy: "Direction",
        activities: activities2026,
        indicators: indicators2026,
        totalBudget: sumBudget(activities2026),
        previousVersionId: "pta-2025-1",
      },
    ];
  });
  
  // Sélectionner par défaut le PTA en cours
  const [selectedPTA, setSelectedPTA] = useState<PTA | null>(
    ptaList.find(p => p.status === "ouvert") || ptaList[0] || null
  );
  
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<PTAActivity | null>(null);
  const [editingActivity, setEditingActivity] = useState<PTAActivity | null>(null);

  const projects = mockProjects.map(p => ({ id: p.id, name: p.name }));

  // Get activities from selected PTA
  const currentActivities = selectedPTA?.activities || [];
  const currentIndicators = selectedPTA?.indicators || [];
  const isReadOnly = selectedPTA?.status === "cloture" || selectedPTA?.status === "archive";

  const activeServices = useMemo(() => mockServices.filter(s => s.actif), []);

  // Projets disponibles selon le service sélectionné
  const availableProjects = useMemo(() => {
    if (selectedService === "all") return mockProjects;
    return mockProjects.filter(p => (p as any).serviceResponsableId === selectedService);
  }, [selectedService]);

  // Opérations disponibles selon le service sélectionné
  const availableOperations = useMemo(() => {
    if (selectedService === "all") return mockOperations.filter(o => o.actif);
    return getOperationsByService(selectedService);
  }, [selectedService]);

  // Filter activities — projet et opération sont mutuellement exclusifs
  const filteredActivities = currentActivities.filter(activity => {
    const matchService = selectedService === "all" || activity.serviceResponsableId === selectedService;
    const matchProject = selectedProject === "all" || activity.projectId === selectedProject;
    const matchOperation = selectedOperation === "all" || activity.operationId === selectedOperation;
    return matchService && matchProject && matchOperation;
  });

  const totalBudgetPrevu = filteredActivities.reduce((sum, a) => sum + a.budgetTotal, 0);
  const totalActivites = filteredActivities.length;

  const budgetByTrimestre = {
    T1: filteredActivities.reduce((sum, a) => sum + a.budgetT1, 0),
    T2: filteredActivities.reduce((sum, a) => sum + a.budgetT2, 0),
    T3: filteredActivities.reduce((sum, a) => sum + a.budgetT3, 0),
    T4: filteredActivities.reduce((sum, a) => sum + a.budgetT4, 0),
  };

  // Arborescence à 2 niveaux : Service → (Projet | Opération) → Activités
  type GroupNode = {
    type: "projet" | "operation";
    id: string;
    label: string;
    activities: PTAActivity[];
  };
  type ServiceGroup = {
    serviceId: string;
    serviceLabel: string;
    groups: Record<string, GroupNode>;
  };

  const activitiesByService = useMemo(() => {
    const acc: Record<string, ServiceGroup> = {};
    filteredActivities.forEach(activity => {
      const srvId = activity.serviceResponsableId || "no-service";
      const srv = srvId !== "no-service" ? getServiceById(srvId) : undefined;
      const serviceLabel = srv ? `${srv.code} — ${srv.nom}` : "Service non défini";

      if (!acc[srvId]) {
        acc[srvId] = { serviceId: srvId, serviceLabel, groups: {} };
      }

      // Niveau 2 : projet ou opération
      let groupKey: string;
      let groupNode: GroupNode;
      if (activity.operationId) {
        groupKey = `op-${activity.operationId}`;
        const op = getOperationById(activity.operationId);
        groupNode = {
          type: "operation",
          id: activity.operationId,
          label: op ? `${op.code} — ${op.libelle}` : (activity.operationName || "Opération"),
          activities: [],
        };
      } else if (activity.projectId) {
        groupKey = `prj-${activity.projectId}`;
        groupNode = {
          type: "projet",
          id: activity.projectId,
          label: activity.project,
          activities: [],
        };
      } else {
        groupKey = "autre";
        groupNode = { type: "operation", id: "autre", label: "Non rattaché", activities: [] };
      }

      if (!acc[srvId].groups[groupKey]) {
        acc[srvId].groups[groupKey] = groupNode;
      }
      acc[srvId].groups[groupKey].activities.push(activity);
    });
    return acc;
  }, [filteredActivities]);

  // PTA Management handlers
  const handleCreatePTA = (newPTA: PTA) => {
    setPtaList([...ptaList, newPTA]);
    setSelectedPTA(newPTA);
  };

  const handleUpdatePTA = (updatedPTA: PTA) => {
    setPtaList(ptaList.map(p => p.id === updatedPTA.id ? updatedPTA : p));
    if (selectedPTA?.id === updatedPTA.id) {
      setSelectedPTA(updatedPTA);
    }
  };

  const handleOpenPTA = (pta: PTA) => {
    const updatedPTA: PTA = {
      ...pta,
      status: "ouvert",
      openedAt: new Date().toISOString(),
      openedBy: "Utilisateur actuel",
    };
    handleUpdatePTA(updatedPTA);
  };

  const handleClosePTA = (pta: PTA) => {
    const updatedPTA: PTA = {
      ...pta,
      status: "cloture",
      closedAt: new Date().toISOString(),
      closedBy: "Utilisateur actuel",
    };
    handleUpdatePTA(updatedPTA);
  };

  const handleArchivePTA = (pta: PTA) => {
    const updatedPTA: PTA = {
      ...pta,
      status: "archive",
    };
    handleUpdatePTA(updatedPTA);
  };

  const handleDuplicatePTA = (pta: PTA, newYear: number) => {
    const existingVersions = ptaList.filter(p => p.year === newYear);
    const newVersion = existingVersions.length + 1;

    const newPTA: PTA = {
      id: `pta-${Date.now()}`,
      code: generatePTACode(newYear, newVersion),
      name: `Plan de Travail Annuel ${newYear}`,
      year: newYear,
      status: "brouillon",
      version: newVersion,
      description: `Dupliqué depuis ${pta.code}`,
      createdAt: new Date().toISOString(),
      createdBy: "Utilisateur actuel",
      activities: pta.activities.map(a => ({ ...a, id: `${a.id}-${Date.now()}` })),
      indicators: pta.indicators.map(i => ({ ...i })),
      totalBudget: pta.totalBudget,
      previousVersionId: pta.id,
    };

    setPtaList([...ptaList, newPTA]);
    setSelectedPTA(newPTA);
  };

  // Activity handlers
  const handleCreateActivity = (data: any) => {
    if (!selectedPTA || isReadOnly) return;

    const deliverables = data.objectives?.map((obj: any, idx: number) => ({
      id: obj.id || `del-${Date.now()}-${idx}`,
      unit: obj.unit,
      targetValue: obj.targetValue,
      targetT1: Number(obj.targetT1) || 0,
      targetT2: Number(obj.targetT2) || 0,
      targetT3: Number(obj.targetT3) || 0,
      targetT4: Number(obj.targetT4) || 0,
    })) || [];
    
    const newActivity: PTAActivity = {
      id: Date.now().toString(),
      name: data.name,
      project: data.project,
      projectId: data.projectId,
      activityId: data.activityId,
      operationId: data.operationId || undefined,
      operationName: data.operationName || undefined,
      serviceResponsableId: data.serviceResponsableId,
      budgetTotal: data.budgetT1 + data.budgetT2 + data.budgetT3 + data.budgetT4,
      budgetT1: data.budgetT1,
      budgetT2: data.budgetT2,
      budgetT3: data.budgetT3,
      budgetT4: data.budgetT4,
      deliverables,
      trimestres: data.trimestres,
      responsable: data.responsable,
      nature: data.nature,
      description: data.description,
    };

    const updatedPTA: PTA = {
      ...selectedPTA,
      activities: [...selectedPTA.activities, newActivity],
      totalBudget: selectedPTA.totalBudget + newActivity.budgetTotal,
    };

    handleUpdatePTA(updatedPTA);
    toast.success("Activité PTA créée avec succès");
  };

  const handleEditActivity = (data: any) => {
    if (!selectedPTA || !editingActivity || isReadOnly) return;

    const deliverables = data.objectives?.map((obj: any, idx: number) => ({
      id: obj.id || `del-${Date.now()}-${idx}`,
      unit: obj.unit,
      targetValue: obj.targetValue,
      targetT1: Number(obj.targetT1) || 0,
      targetT2: Number(obj.targetT2) || 0,
      targetT3: Number(obj.targetT3) || 0,
      targetT4: Number(obj.targetT4) || 0,
    })) || editingActivity.deliverables;

    const updatedActivity: PTAActivity = {
      ...editingActivity,
      ...data,
      deliverables,
      budgetTotal: data.budgetT1 + data.budgetT2 + data.budgetT3 + data.budgetT4,
    };

    const updatedActivities = selectedPTA.activities.map(a =>
      a.id === editingActivity.id ? updatedActivity : a
    );

    const updatedPTA: PTA = {
      ...selectedPTA,
      activities: updatedActivities,
      totalBudget: updatedActivities.reduce((sum, a) => sum + a.budgetTotal, 0),
    };

    handleUpdatePTA(updatedPTA);
    setEditingActivity(null);
    toast.success("Activité PTA modifiée avec succès");
  };

  const handleDeleteActivity = (activity: PTAActivity) => {
    if (!selectedPTA || isReadOnly) return;

    const updatedActivities = selectedPTA.activities.filter(a => a.id !== activity.id);
    const updatedPTA: PTA = {
      ...selectedPTA,
      activities: updatedActivities,
      totalBudget: updatedActivities.reduce((sum, a) => sum + a.budgetTotal, 0),
    };

    handleUpdatePTA(updatedPTA);
    setDetailOpen(false);
    toast.success("Activité PTA supprimée");
  };

  const handleIndicatorsChange = (newIndicators: PTAIndicatorPlanning[]) => {
    if (!selectedPTA || isReadOnly) return;

    const updatedPTA: PTA = {
      ...selectedPTA,
      indicators: newIndicators,
    };

    handleUpdatePTA(updatedPTA);
  };

  // Validation handlers for activities
  const handleValidateActivity = (activity: PTAActivity) => {
    if (!selectedPTA || isReadOnly) return;

    const updatedActivity: PTAActivity = {
      ...activity,
      validationStatus: "valide",
      validatedAt: new Date().toISOString(),
      validatedBy: "Utilisateur actuel",
    };

    const updatedActivities = selectedPTA.activities.map(a =>
      a.id === activity.id ? updatedActivity : a
    );

    const updatedPTA: PTA = {
      ...selectedPTA,
      activities: updatedActivities,
    };

    handleUpdatePTA(updatedPTA);
    toast.success("Activité validée - les modifications sont maintenant verrouillées");
  };

  const handleUnlockActivity = (activity: PTAActivity) => {
    if (!selectedPTA) return;

    const updatedActivity: PTAActivity = {
      ...activity,
      validationStatus: "brouillon",
      validatedAt: undefined,
      validatedBy: undefined,
    };

    const updatedActivities = selectedPTA.activities.map(a =>
      a.id === activity.id ? updatedActivity : a
    );

    const updatedPTA: PTA = {
      ...selectedPTA,
      activities: updatedActivities,
    };

    handleUpdatePTA(updatedPTA);
    toast.success("Activité déverrouillée - les modifications sont à nouveau possibles");
  };

  const openDetail = (activity: PTAActivity) => {
    setSelectedActivity(activity);
    setDetailOpen(true);
  };

  const openEdit = (activity: PTAActivity) => {
    setEditingActivity(activity);
    setDetailOpen(false);
    setFormOpen(true);
  };

  return (
    <DashboardLayout
      title="Planification PTA"
      subtitle={selectedPTA ? selectedPTA.name : "Gestion des Plans de Travail Annuel"}
    >
      <div className="space-y-4 animate-fade-in">
        {/* Header with PTA selector and filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <PTAManager
              ptaList={ptaList}
              selectedPTA={selectedPTA}
              onSelectPTA={setSelectedPTA}
              onCreatePTA={handleCreatePTA}
              onUpdatePTA={handleUpdatePTA}
              onOpenPTA={handleOpenPTA}
              onClosePTA={handleClosePTA}
              onArchivePTA={handleArchivePTA}
              onDuplicatePTA={handleDuplicatePTA}
            />
            {selectedPTA && (
              <>
                <Badge className={PTA_STATUS_COLORS[selectedPTA.status]}>
                  {selectedPTA.status === "ouvert" && <Unlock className="w-3 h-3 mr-1" />}
                  {(selectedPTA.status === "cloture" || selectedPTA.status === "archive") && <Lock className="w-3 h-3 mr-1" />}
                  {PTA_STATUS_LABELS[selectedPTA.status]}
                </Badge>
                <Select
                  value={selectedService}
                  onValueChange={(v) => {
                    setSelectedService(v);
                    setSelectedProject("all");
                    setSelectedOperation("all");
                  }}
                >
                  <SelectTrigger className="w-56 h-9">
                    <SelectValue placeholder="Service responsable" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="all">Tous les services</SelectItem>
                    {activeServices.map(srv => (
                      <SelectItem key={srv.id} value={srv.id}>
                        <span className="font-medium">{srv.code}</span>
                        <span className="text-muted-foreground"> — {srv.nom}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedProject}
                  onValueChange={(v) => {
                    setSelectedProject(v);
                    if (v !== "all") setSelectedOperation("all");
                  }}
                  disabled={selectedOperation !== "all"}
                >
                  <SelectTrigger className="w-48 h-9">
                    <SelectValue placeholder="Projet" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="all">Tous les projets</SelectItem>
                    {availableProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedOperation}
                  onValueChange={(v) => {
                    setSelectedOperation(v);
                    if (v !== "all") setSelectedProject("all");
                  }}
                  disabled={selectedProject !== "all"}
                >
                  <SelectTrigger className="w-48 h-9">
                    <SelectValue placeholder="Opération" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="all">Toutes les opérations</SelectItem>
                    {availableOperations.map(op => (
                      <SelectItem key={op.id} value={op.id}>
                        <span className="font-medium">{op.code}</span>
                        <span className="text-muted-foreground"> — {op.libelle}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedPTA && (
              <ExportButtons
                onExportCSV={() => exportPTAToCSV(selectedPTA)}
                onExportPDF={() => exportPTAToPDF(selectedPTA)}
              />
            )}
            {selectedPTA && !isReadOnly && (
              <Button size="sm" onClick={() => { setEditingActivity(null); setFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" />
                Ajouter activité
              </Button>
            )}
          </div>
        </div>

        {selectedPTA ? (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Card>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Budget total</p>
                      <p className="text-lg font-heading font-bold">{formatBudget(totalBudgetPrevu)}</p>
                    </div>
                    <Wallet className="w-4 h-4 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Activités</p>
                      <p className="text-lg font-heading font-bold">{totalActivites}</p>
                    </div>
                    <Target className="w-4 h-4 text-secondary opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              {(["T1", "T2", "T3", "T4"] as const).map((t) => (
                <Card key={t}>
                  <CardContent className="py-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{t} {selectedPTA.year}</p>
                      <p className="text-lg font-heading font-bold">{formatBudget(budgetByTrimestre[t])}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* View Toggle */}
            <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
              <TabsList>
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  Activités
                </TabsTrigger>
                <TabsTrigger value="deliverables" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Synthèse livrables
                </TabsTrigger>
                <TabsTrigger value="indicators" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Indicateurs
                </TabsTrigger>
                <TabsTrigger value="gantt" className="flex items-center gap-2">
                  <GanttIcon className="w-4 h-4" />
                  Gantt
                </TabsTrigger>
              </TabsList>

              <TabsContent value="table" className="mt-4">
                <Card>
                  <CardHeader className="border-b py-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" />
                        Planification par projet et activité
                      </CardTitle>
                      <div className="inline-flex rounded-md border bg-muted/30 p-0.5">
                        <Button
                          type="button"
                          size="sm"
                          variant={displayMode === "budget" ? "default" : "ghost"}
                          className="h-7 text-xs gap-1.5"
                          onClick={() => setDisplayMode("budget")}
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          Vue Budget
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={displayMode === "deliverables" ? "default" : "ghost"}
                          className="h-7 text-xs gap-1.5"
                          onClick={() => setDisplayMode("deliverables")}
                        >
                          <Package className="w-3.5 h-3.5" />
                          Vue Livrables
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left p-2 font-semibold text-muted-foreground text-xs min-w-[180px]">Activité / Livrable</th>
                            <th className="text-left p-2 font-semibold text-muted-foreground text-xs">Nature</th>
                            <th className="text-center p-2 font-semibold text-muted-foreground text-xs w-20">Statut</th>
                            <th className="text-right p-2 font-semibold text-muted-foreground text-xs">{displayMode === "budget" ? "Budget" : "Budget annuel"}</th>
                            {displayMode === "budget" ? (
                              <>
                                <th className="text-right p-2 font-semibold text-muted-foreground text-xs bg-blue-50 dark:bg-blue-950/30 w-16">T1</th>
                                <th className="text-right p-2 font-semibold text-muted-foreground text-xs bg-emerald-50 dark:bg-emerald-950/30 w-16">T2</th>
                                <th className="text-right p-2 font-semibold text-muted-foreground text-xs bg-amber-50 dark:bg-amber-950/30 w-16">T3</th>
                                <th className="text-right p-2 font-semibold text-muted-foreground text-xs bg-purple-50 dark:bg-purple-950/30 w-16">T4</th>
                                <th className="text-right p-2 font-semibold text-muted-foreground text-xs w-24">Objectif</th>
                              </>
                            ) : (
                              <>
                                <th className="text-right p-2 font-semibold text-muted-foreground text-xs w-24">Cible annuelle</th>
                                <th className="text-right p-2 font-semibold text-muted-foreground text-xs bg-blue-50 dark:bg-blue-950/30 w-16">T1</th>
                                <th className="text-right p-2 font-semibold text-muted-foreground text-xs bg-emerald-50 dark:bg-emerald-950/30 w-16">T2</th>
                                <th className="text-right p-2 font-semibold text-muted-foreground text-xs bg-amber-50 dark:bg-amber-950/30 w-16">T3</th>
                                <th className="text-right p-2 font-semibold text-muted-foreground text-xs bg-purple-50 dark:bg-purple-950/30 w-16">T4</th>
                              </>
                            )}
                            <th className="w-20 p-2 text-center font-semibold text-muted-foreground text-xs">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.values(activitiesByService).map((srvGroup) => {
                            const allSrvActivities = Object.values(srvGroup.groups).flatMap(g => g.activities);
                            const srvBudget = allSrvActivities.reduce((s, a) => s + a.budgetTotal, 0);
                            const srvT1 = allSrvActivities.reduce((s, a) => s + a.budgetT1, 0);
                            const srvT2 = allSrvActivities.reduce((s, a) => s + a.budgetT2, 0);
                            const srvT3 = allSrvActivities.reduce((s, a) => s + a.budgetT3, 0);
                            const srvT4 = allSrvActivities.reduce((s, a) => s + a.budgetT4, 0);

                            return (
                              <React.Fragment key={srvGroup.serviceId}>
                                {/* Niveau 1 : Service */}
                                <tr className="bg-primary/10 border-b border-primary/20">
                                  <td colSpan={3} className="p-2 font-bold text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-sm bg-primary"></span>
                                      <span>{srvGroup.serviceLabel}</span>
                                    </div>
                                  </td>
                                  <td className="p-2 text-right font-bold text-sm">{formatBudget(srvBudget)}</td>
                                  {displayMode === "budget" ? (
                                    <>
                                      <td className="p-2 text-right font-bold text-xs bg-blue-50 dark:bg-blue-950/30">{formatBudget(srvT1)}</td>
                                      <td className="p-2 text-right font-bold text-xs bg-emerald-50 dark:bg-emerald-950/30">{formatBudget(srvT2)}</td>
                                      <td className="p-2 text-right font-bold text-xs bg-amber-50 dark:bg-amber-950/30">{formatBudget(srvT3)}</td>
                                      <td className="p-2 text-right font-bold text-xs bg-purple-50 dark:bg-purple-950/30">{formatBudget(srvT4)}</td>
                                      <td colSpan={2}></td>
                                    </>
                                  ) : (
                                    <td colSpan={6}></td>
                                  )}
                                </tr>

                                {Object.entries(srvGroup.groups).map(([groupKey, group]) => {
                                  const grpBudget = group.activities.reduce((s, a) => s + a.budgetTotal, 0);
                                  const grpT1 = group.activities.reduce((s, a) => s + a.budgetT1, 0);
                                  const grpT2 = group.activities.reduce((s, a) => s + a.budgetT2, 0);
                                  const grpT3 = group.activities.reduce((s, a) => s + a.budgetT3, 0);
                                  const grpT4 = group.activities.reduce((s, a) => s + a.budgetT4, 0);
                                  const isOp = group.type === "operation";

                                  return (
                                    <React.Fragment key={groupKey}>
                                      {/* Niveau 2 : Projet ou Opération */}
                                      <tr className="bg-muted/40 border-b">
                                        <td colSpan={3} className="p-2 pl-6 font-semibold text-xs">
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={cn(
                                              "text-[9px] h-4 px-1.5 shrink-0",
                                              isOp ? "border-amber-400 text-amber-700 dark:text-amber-300" : "border-blue-400 text-blue-700 dark:text-blue-300"
                                            )}>
                                              {isOp ? "Opération" : "Projet"}
                                            </Badge>
                                            <span className="truncate">{group.label}</span>
                                          </div>
                                        </td>
                                        <td className="p-2 text-right font-semibold text-xs">{formatBudget(grpBudget)}</td>
                                        {displayMode === "budget" ? (
                                          <>
                                            <td className="p-2 text-right font-medium text-[11px] bg-blue-50/60 dark:bg-blue-950/20">{formatBudget(grpT1)}</td>
                                            <td className="p-2 text-right font-medium text-[11px] bg-emerald-50/60 dark:bg-emerald-950/20">{formatBudget(grpT2)}</td>
                                            <td className="p-2 text-right font-medium text-[11px] bg-amber-50/60 dark:bg-amber-950/20">{formatBudget(grpT3)}</td>
                                            <td className="p-2 text-right font-medium text-[11px] bg-purple-50/60 dark:bg-purple-950/20">{formatBudget(grpT4)}</td>
                                            <td colSpan={2}></td>
                                          </>
                                        ) : (
                                          <td colSpan={6}></td>
                                        )}
                                      </tr>

                                      {/* Niveau 3 : Activités */}
                                      {group.activities.map((activity) => {
                                        const isValidated = activity.validationStatus === "valide";
                                        return (
                                          <React.Fragment key={activity.id}>
                                          <tr
                                            className={cn(
                                              "border-b hover:bg-muted/30 transition-colors cursor-pointer",
                                              isValidated && "bg-green-50/30 dark:bg-green-950/10"
                                            )}
                                            onClick={() => openDetail(activity)}
                                          >
                                            <td className="p-2 pl-10">
                                              <div className="flex items-center gap-1.5">
                                                {isValidated && (
                                                  <Lock className="w-3 h-3 text-green-600 shrink-0" />
                                                )}
                                                <span className="text-foreground text-xs truncate max-w-[160px]">{activity.name}</span>
                                              </div>
                                            </td>
                                            <td className="p-2">
                                              <Badge variant="outline" className="text-[10px] h-5">{activity.nature}</Badge>
                                            </td>
                                            <td className="p-2 text-center">
                                              <Badge className={cn(
                                                "text-[10px] h-5",
                                                isValidated
                                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                  : "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300"
                                              )}>
                                                {isValidated ? "Validé" : "Brouillon"}
                                              </Badge>
                                            </td>
                                            <td className="p-2 text-right font-medium text-xs">{formatBudget(activity.budgetTotal)}</td>
                                            {displayMode === "budget" ? (
                                              <>
                                                <td className="p-2 text-right bg-blue-50/50 dark:bg-blue-950/20 text-[11px]">
                                                  {activity.budgetT1 > 0 ? formatBudget(activity.budgetT1) : "-"}
                                                </td>
                                                <td className="p-2 text-right bg-emerald-50/50 dark:bg-emerald-950/20 text-[11px]">
                                                  {activity.budgetT2 > 0 ? formatBudget(activity.budgetT2) : "-"}
                                                </td>
                                                <td className="p-2 text-right bg-amber-50/50 dark:bg-amber-950/20 text-[11px]">
                                                  {activity.budgetT3 > 0 ? formatBudget(activity.budgetT3) : "-"}
                                                </td>
                                                <td className="p-2 text-right bg-purple-50/50 dark:bg-purple-950/20 text-[11px]">
                                                  {activity.budgetT4 > 0 ? formatBudget(activity.budgetT4) : "-"}
                                                </td>
                                                <td className="p-2 text-right">
                                                  {activity.deliverables.length > 0 ? (
                                                    <div className="text-[11px] leading-tight">
                                                      <span className="font-medium">{activity.deliverables[0].targetValue}</span>{" "}
                                                      <span className="text-muted-foreground">{getUnitDesc(activity.deliverables[0].unit)}</span>
                                                      {activity.deliverables.length > 1 && (
                                                        <span className="text-muted-foreground"> +{activity.deliverables.length - 1}</span>
                                                      )}
                                                    </div>
                                                  ) : "-"}
                                                </td>
                                              </>
                                            ) : (
                                              <td colSpan={5} className="p-2 text-right text-[11px] text-muted-foreground italic">
                                                {activity.deliverables.length > 0
                                                  ? `${activity.deliverables.length} livrable${activity.deliverables.length > 1 ? "s" : ""} ↓`
                                                  : "Aucun livrable"}
                                              </td>
                                            )}
                                            <td className="p-2" onClick={(e) => e.stopPropagation()}>
                                              <div className="flex items-center justify-center gap-0.5">
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-6 w-6"
                                                  onClick={() => openDetail(activity)}
                                                >
                                                  <Eye className="h-3 w-3" />
                                                </Button>
                                                {!isReadOnly && (
                                                  <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                      <Button variant="ghost" size="icon" className="h-6 w-6">
                                                        <MoreHorizontal className="h-3 w-3" />
                                                      </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                      {!isValidated ? (
                                                        <>
                                                          <DropdownMenuItem onClick={() => openEdit(activity)}>
                                                            <Edit className="w-3 h-3 mr-2" />
                                                            Modifier
                                                          </DropdownMenuItem>
                                                          <DropdownMenuItem onClick={() => handleValidateActivity(activity)}>
                                                            <CheckCircle className="w-3 h-3 mr-2 text-green-600" />
                                                            Valider
                                                          </DropdownMenuItem>
                                                        </>
                                                      ) : (
                                                        <DropdownMenuItem onClick={() => handleUnlockActivity(activity)}>
                                                          <Unlock className="w-3 h-3 mr-2 text-amber-600" />
                                                          Déverrouiller
                                                        </DropdownMenuItem>
                                                      )}
                                                    </DropdownMenuContent>
                                                  </DropdownMenu>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                          {displayMode === "deliverables" && activity.deliverables.map((del) => {
                                            const sumQ = (Number(del.targetT1)||0)+(Number(del.targetT2)||0)+(Number(del.targetT3)||0)+(Number(del.targetT4)||0);
                                            const mismatch = del.targetValue > 0 && sumQ !== del.targetValue;
                                            return (
                                              <tr
                                                key={`${activity.id}-del-${del.id}`}
                                                className="border-b bg-muted/10 hover:bg-muted/20 cursor-pointer"
                                                onClick={() => openDetail(activity)}
                                              >
                                                <td className="p-1.5 pl-16 text-[11px]">
                                                  <div className="flex items-center gap-1.5">
                                                    <Package className="w-3 h-3 text-muted-foreground shrink-0" />
                                                    <div className="leading-tight min-w-0">
                                                      <div className="truncate max-w-[280px]">{getUnitDesc(del.unit)}</div>
                                                      <div className="text-[9px] text-muted-foreground lowercase truncate">{del.unit}</div>
                                                    </div>
                                                  </div>
                                                </td>
                                                <td colSpan={3}></td>
                                                <td className={cn("p-1.5 text-right text-[11px] font-semibold", mismatch && "text-amber-600")}>
                                                  {del.targetValue > 0 ? formatNumber(del.targetValue) : "-"}
                                                </td>
                                                <td className="p-1.5 text-right text-[11px] bg-blue-50/40 dark:bg-blue-950/10">
                                                  {del.targetT1 ? formatNumber(Number(del.targetT1)) : "-"}
                                                </td>
                                                <td className="p-1.5 text-right text-[11px] bg-emerald-50/40 dark:bg-emerald-950/10">
                                                  {del.targetT2 ? formatNumber(Number(del.targetT2)) : "-"}
                                                </td>
                                                <td className="p-1.5 text-right text-[11px] bg-amber-50/40 dark:bg-amber-950/10">
                                                  {del.targetT3 ? formatNumber(Number(del.targetT3)) : "-"}
                                                </td>
                                                <td className="p-1.5 text-right text-[11px] bg-purple-50/40 dark:bg-purple-950/10">
                                                  {del.targetT4 ? formatNumber(Number(del.targetT4)) : "-"}
                                                </td>
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

                          <tr className="bg-primary/5 border-t-2 border-primary/30">
                            <td colSpan={3} className="p-2 font-bold text-sm">Total général</td>
                            <td className="p-2 text-right font-bold text-sm">{formatBudget(totalBudgetPrevu)}</td>
                            <td className="p-2 text-right font-bold text-xs bg-blue-100/50 dark:bg-blue-950/40">{formatBudget(budgetByTrimestre.T1)}</td>
                            <td className="p-2 text-right font-bold text-xs bg-emerald-100/50 dark:bg-emerald-950/40">{formatBudget(budgetByTrimestre.T2)}</td>
                            <td className="p-2 text-right font-bold text-xs bg-amber-100/50 dark:bg-amber-950/40">{formatBudget(budgetByTrimestre.T3)}</td>
                            <td className="p-2 text-right font-bold text-xs bg-purple-100/50 dark:bg-purple-950/40">{formatBudget(budgetByTrimestre.T4)}</td>
                            <td colSpan={2}></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="indicators" className="mt-4">
                <PTAIndicatorPlanningComponent
                  indicators={currentIndicators}
                  onChange={handleIndicatorsChange}
                  year={selectedPTA.year}
                  isReadOnly={isReadOnly}
                />
              </TabsContent>

              <TabsContent value="deliverables" className="mt-4">
                <PTADeliverablesSynthesis activities={filteredActivities} year={selectedPTA.year} />
              </TabsContent>

              <TabsContent value="gantt" className="mt-4">
                <Card>
                  <CardHeader className="border-b py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Vue Gantt - {selectedPTA.year}
                      </CardTitle>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded bg-blue-500"></span>
                          <span>T1</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded bg-emerald-500"></span>
                          <span>T2</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded bg-amber-500"></span>
                          <span>T3</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded bg-purple-500"></span>
                          <span>T4</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <GanttChart activities={filteredActivities} year={selectedPTA.year.toString()} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucun PTA sélectionné</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sélectionnez un PTA existant ou créez-en un nouveau pour commencer la planification.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Form Dialog */}
      {selectedPTA && (
        <PTAActivityForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={editingActivity ? handleEditActivity : handleCreateActivity}
          initialData={editingActivity || undefined}
          year={selectedPTA.year.toString()}
        />
      )}

      {/* Detail Dialog */}
      {selectedPTA && (
        <PTAActivityDetail
          activity={selectedActivity}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onEdit={isReadOnly ? undefined : (selectedActivity?.validationStatus !== "valide" ? openEdit : undefined)}
          onValidate={isReadOnly ? undefined : handleValidateActivity}
          onUnlock={handleUnlockActivity}
          canUnlock={true}
          year={selectedPTA.year.toString()}
        />
      )}

    </DashboardLayout>
  );
};

export default Planification;
