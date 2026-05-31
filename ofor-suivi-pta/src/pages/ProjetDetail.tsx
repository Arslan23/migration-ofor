import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ArrowLeft,
  Edit,
  Download,
  MapPin,
  Calendar,
  User,
  Wallet,
  Target,
  ListTodo,
  Building2,
  FileText,
  Users,
  Banknote,
  ChevronDown,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Package,
  Activity as ActivityIcon,
} from "lucide-react";
import { mockProjects } from "@/data/mockProjects";
import { Indicator, Activity, ACTIVITY_STATUS_LABELS, STATUS_LABELS, getDeliverableCode, getDeliverableName, getDeliverableUnit } from "@/types/project";
import { format, differenceInDays, differenceInMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import ProjectIndicators from "@/components/projects/ProjectIndicators";
import ProjectActivities from "@/components/projects/ProjectActivities";
import ProjectWizard from "@/components/projects/ProjectWizard";
import ProjectDetailDialog from "@/components/projects/ProjectDetailDialog";
import { toast } from "sonner";
import { formatMontant } from "@/lib/exportUtils";
import { exportProjetDetailToPDF, ProjectExportData } from "@/lib/exportFicheUtils";
import { mockPersonnel, ROLE_LABELS, getPersonnelFullName } from "@/data/personnel";
import { getServiceById, getEntiteById } from "@/data/entitesExecution";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const formatBudget = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount);
};

const ProjetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showFicheProjet, setShowFicheProjet] = useState(false);
  
  const project = mockProjects.find((p) => p.id === id);
  
  const [indicators, setIndicators] = useState<Indicator[]>(project?.indicators || []);
  const [activities, setActivities] = useState<Activity[]>(project?.activities || []);

  if (!project) {
    return (
      <DashboardLayout title="Projet non trouvé" subtitle="">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Ce projet n'existe pas.</p>
          <Button onClick={() => navigate("/projets")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux projets
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Indicator handlers
  const handleAddIndicator = (data: Omit<Indicator, "id">) => {
    const newIndicator: Indicator = {
      ...data,
      id: `ind-${Date.now()}`,
    };
    setIndicators([...indicators, newIndicator]);
    toast.success("Indicateur ajouté avec succès");
  };

  const handleEditIndicator = (id: string, data: Partial<Indicator>) => {
    setIndicators(indicators.map((ind) => (ind.id === id ? { ...ind, ...data } : ind)));
    toast.success("Indicateur modifié");
  };

  const handleDeleteIndicator = (id: string) => {
    setIndicators(indicators.filter((ind) => ind.id !== id));
    toast.success("Indicateur supprimé");
  };

  // Activity handlers
  const handleAddActivity = (
    data: Omit<Activity, "id" | "spent" | "progress" | "deliverables" | "fichesSuivi">,
  ) => {
    const newActivity: Activity = {
      ...data,
      id: `act-${Date.now()}`,
      spent: 0,
      progress: 0,
      deliverables: [],
      fichesSuivi: [],
    };
    setActivities([...activities, newActivity]);
    toast.success("Activité ajoutée avec succès");
  };

  const handleEditActivity = (id: string, data: Partial<Activity>) => {
    setActivities(activities.map((act) => (act.id === id ? { ...act, ...data } : act)));
    toast.success("Activité modifiée");
  };

  const handleDeleteActivity = (id: string) => {
    setActivities(activities.filter((act) => act.id !== id));
    toast.success("Activité supprimée");
  };

  const totalDeliverables = activities.reduce((sum, act) => sum + act.deliverables.length, 0);

  // Export PDF élaboré du projet
  const handleExportCompletePDF = () => {
    const projectData: ProjectExportData = {
      code: project.code,
      name: project.name,
      description: project.description,
      objectives: project.objectives,
      region: project.region,
      bailleur: project.bailleur,
      responsible: project.responsible,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
      currency: project.currency || "FCFA",
      spent: project.spent,
      progress: project.progress,
      status: project.status,
      zonesIntervention: project.zonesIntervention,
      equipeProjet: project.equipeProjet?.map(aff => {
        const personnel = mockPersonnel.find(p => p.id === aff.personnelId);
        return {
          personnelName: personnel ? `${personnel.prenom} ${personnel.nom}` : "Inconnu",
          roleName: ROLE_LABELS[aff.role] || aff.role,
        };
      }),
      activities: activities.map(a => ({
        code: a.code,
        name: a.name,
        status: ACTIVITY_STATUS_LABELS[a.status],
        budget: a.budget,
        spent: a.spent,
        progress: a.progress,
        nature: a.nature,
        deliverables: a.deliverables.map(d => ({
          code: getDeliverableCode(d),
          name: getDeliverableName(d),
          unit: getDeliverableUnit(d),
          targetValue: d.targetValue,
          currentValue: d.currentValue,
        })),
      })),
      indicators: indicators.map(i => ({
        code: i.code,
        name: i.name,
        unit: i.unit,
        targetValue: i.targetValue,
        currentValue: i.currentValue,
        baselineValue: i.baselineValue,
      })),
    };
    
    exportProjetDetailToPDF(projectData);
    toast.success("PDF élaboré généré");
  };

  return (
    <DashboardLayout title={project.name} subtitle={`Code: ${project.code}`}>
      <div className="space-y-2 animate-fade-in">
        {/* Header with Actions - Compact */}
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate("/projets")} className="h-8 px-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </Button>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowFicheProjet(true)} className="h-8 px-2">
              <FileText className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExportCompletePDF} className="h-8 px-2">
              <Download className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={() => setShowEditForm(true)} className="h-8 px-3">
              <Edit className="w-4 h-4 mr-1" />
              Modifier
            </Button>
          </div>
        </div>

        {/* Project Hero Header */}
        {(() => {
          const service = project.serviceResponsableId ? getServiceById(project.serviceResponsableId) : undefined;
          const entite = service ? getEntiteById(service.entiteId) : undefined;
          const totalDays = differenceInDays(new Date(project.endDate), new Date(project.startDate));
          const elapsedDays = Math.max(0, Math.min(totalDays, differenceInDays(new Date(), new Date(project.startDate))));
          const timeProgress = totalDays > 0 ? Math.round((elapsedDays / totalDays) * 100) : 0;
          const remainingDays = Math.max(0, differenceInDays(new Date(project.endDate), new Date()));
          const months = differenceInMonths(new Date(project.endDate), new Date(project.startDate));
          const spent = project.spent || 0;
          const budgetProgress = project.budget > 0 ? Math.round((spent / project.budget) * 100) : 0;
          const totalDeliverablesCount = activities.reduce((s, a) => s + a.deliverables.length, 0);
          const completedActivities = activities.filter(a => a.status === "termine").length;

          return (
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3 border-b">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono text-xs">{project.code}</Badge>
                  <Badge className="text-xs">{STATUS_LABELS[project.status]}</Badge>
                  {entite && <Badge variant="secondary" className="text-xs gap-1"><Building2 className="w-3 h-3" />{entite.code}</Badge>}
                  {service && <Badge variant="outline" className="text-xs">{service.code} — {service.nom}</Badge>}
                </div>
                <h2 className="text-lg sm:text-xl font-semibold leading-tight">{project.name}</h2>
                {project.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                )}
              </div>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide">
                      <Banknote className="w-3 h-3" /> Budget
                    </div>
                    <p className="font-bold text-sm leading-tight mt-0.5">{formatMontant(project.budget)} <span className="text-[10px] font-normal text-muted-foreground">{project.currency || "FCFA"}</span></p>
                    {spent > 0 && (
                      <div className="mt-1">
                        <Progress value={budgetProgress} className="h-1" />
                        <p className="text-[10px] text-muted-foreground mt-0.5">Conso. {budgetProgress}%</p>
                      </div>
                    )}
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/20">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide">
                      <TrendingUp className="w-3 h-3" /> Avancement
                    </div>
                    <p className="font-bold text-sm leading-tight mt-0.5">{project.progress}%</p>
                    <Progress value={project.progress} className="h-1 mt-1" />
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide">
                      <Clock className="w-3 h-3" /> Temps écoulé
                    </div>
                    <p className="font-bold text-sm leading-tight mt-0.5">{timeProgress}%</p>
                    <Progress value={timeProgress} className="h-1 mt-1" />
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30 border">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide">
                      <Calendar className="w-3 h-3" /> Durée
                    </div>
                    <p className="font-bold text-sm leading-tight mt-0.5">{months} mois</p>
                    <p className="text-[10px] text-muted-foreground">Reste {remainingDays} j</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30 border">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide">
                      <ListTodo className="w-3 h-3" /> Activités
                    </div>
                    <p className="font-bold text-sm leading-tight mt-0.5">{activities.length}</p>
                    <p className="text-[10px] text-muted-foreground">{completedActivities} terminées · {totalDeliverablesCount} livrables</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30 border">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide">
                      <Target className="w-3 h-3" /> Indicateurs
                    </div>
                    <p className="font-bold text-sm leading-tight mt-0.5">{indicators.length}</p>
                    <p className="text-[10px] text-muted-foreground">de performance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Main Tabs */}
        <Tabs defaultValue="fiche" className="space-y-3">
          <TabsList className="grid w-full grid-cols-3 h-11">
            <TabsTrigger value="fiche" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Fiche Projet</span>
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              <span className="hidden sm:inline">Activités</span>
              <span className="ml-1 bg-secondary/20 text-secondary text-xs px-2 py-0.5 rounded-full">{activities.length}</span>
            </TabsTrigger>
            <TabsTrigger value="indicators" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Indicateurs</span>
              <span className="ml-1 bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">{indicators.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activities" className="mt-2">
            <div className="bg-muted/40 border rounded px-3 py-2 mb-2 flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Activités avec livrables • <strong>{totalDeliverables}</strong> livrables au total</span>
            </div>
            <ProjectActivities
              activities={activities}
              projectIndicators={indicators}
              onAdd={handleAddActivity}
              onEdit={handleEditActivity}
              onDelete={handleDeleteActivity}
              planningMode
              projectCode={project.code}
              projectName={project.name}
              projectServiceResponsableId={project.serviceResponsableId}
            />
          </TabsContent>

          <TabsContent value="indicators" className="mt-2">
            <div className="bg-muted/40 border rounded px-3 py-2 mb-2 text-xs text-muted-foreground">
              Indicateurs de performance liés aux livrables des activités
            </div>
            <ProjectIndicators
              indicators={indicators}
              onAdd={handleAddIndicator}
              onEdit={handleEditIndicator}
              onDelete={handleDeleteIndicator}
              activities={activities}
              planningMode
            />
          </TabsContent>

          {/* Fiche Projet Tab - Responsive */}
          <TabsContent value="fiche" className="mt-2">
            {/* Mobile: Accordion layout */}
            <div className="md:hidden space-y-2">
              <Accordion type="multiple" defaultValue={["description", "budget"]} className="space-y-2">
                <AccordionItem value="description" className="border rounded-lg px-3">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      Description & Objectifs
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 space-y-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">Description</p>
                      {project.description ? (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{project.description}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Non renseignée</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">Objectifs</p>
                      {project.objectives ? (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{project.objectives}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Non renseignés</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="zones" className="border rounded-lg px-3">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      Zones ({project.zonesIntervention?.length || 0})
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    {project.zonesIntervention && project.zonesIntervention.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {project.zonesIntervention.map((zone, index) => (
                          <Badge key={index} variant="outline" className="text-[10px] h-5">
                            {zone.communeName || zone.departementName || zone.regionName}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Aucune zone définie</p>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="equipe" className="border rounded-lg px-3">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      Équipe ({project.equipeProjet?.length || 0})
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    {project.equipeProjet && project.equipeProjet.length > 0 ? (
                      <div className="space-y-2">
                        {project.equipeProjet.map((affectation, index) => {
                          const personnel = mockPersonnel.find(p => p.id === affectation.personnelId);
                          return personnel ? (
                            <div key={index} className="flex items-center gap-2 bg-muted/50 rounded p-2">
                              <User className="w-3.5 h-3.5 text-primary shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-xs truncate">{personnel.prenom} {personnel.nom}</p>
                                <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[affectation.role]}</p>
                              </div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Aucune équipe définie</p>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="budget" className="border rounded-lg border-primary/20 bg-primary/5 px-3">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 text-primary" />
                      Budget: {formatMontant(project.budget)} {project.currency || "FCFA"}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between py-1 border-b border-dashed">
                        <span className="text-muted-foreground">Chef de file</span>
                        <span className="font-medium">{project.bailleur}</span>
                      </div>
                      {(project as any).financements?.length > 0 && (
                        <div className="py-1 border-b border-dashed">
                          <p className="text-muted-foreground mb-1">Financements ({(project as any).financements.length})</p>
                          <div className="space-y-1">
                            {(project as any).financements.map((f: any) => {
                              const total = (project as any).financements.reduce((s: number, x: any) => s + (x.amountFCFA || 0), 0);
                              const part = total > 0 ? (f.amountFCFA / total) * 100 : 0;
                              return (
                                <div key={f.id} className="flex justify-between gap-2">
                                  <span className="truncate">{f.bailleur}</span>
                                  <span className="font-mono text-[10px]">{formatMontant(f.amount)} {f.currency} <span className="text-muted-foreground">({part.toFixed(0)}%)</span></span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between py-1 border-b border-dashed">
                        <span className="text-muted-foreground">Durée</span>
                        <span className="font-medium">{Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} mois</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Desktop: Rich structured layout */}
            <div className="hidden md:block space-y-3">
              {(() => {
                const service = project.serviceResponsableId ? getServiceById(project.serviceResponsableId) : undefined;
                const entite = service ? getEntiteById(service.entiteId) : undefined;
                const fin = ((project as any).financements || []) as any[];
                const totalFCFA = fin.reduce((s, f) => s + (f.amountFCFA || 0), 0);
                const months = differenceInMonths(new Date(project.endDate), new Date(project.startDate));
                const totalActBudget = activities.reduce((s, a) => s + (a.budget || 0), 0);
                const actCoverage = project.budget > 0 ? Math.round((totalActBudget / project.budget) * 100) : 0;
                return (
                  <>
                    {/* Row 1: Identification + Responsabilité + Calendrier */}
                    <div className="grid grid-cols-12 gap-3">
                      <Card className="col-span-12 lg:col-span-4 border-l-4 border-l-primary">
                        <CardHeader className="py-2 px-3">
                          <CardTitle className="text-sm flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-primary" />
                            Identification
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 px-3 pb-3 space-y-1.5 text-xs">
                          <div className="flex justify-between gap-2 py-1 border-b border-dashed">
                            <span className="text-muted-foreground">Code</span>
                            <span className="font-mono font-medium">{project.code}</span>
                          </div>
                          <div className="flex justify-between gap-2 py-1 border-b border-dashed">
                            <span className="text-muted-foreground">Statut</span>
                            <Badge variant="outline" className="text-[10px] h-5">{STATUS_LABELS[project.status]}</Badge>
                          </div>
                          <div className="flex justify-between gap-2 py-1 border-b border-dashed">
                            <span className="text-muted-foreground">Région</span>
                            <span className="font-medium truncate">{project.region}</span>
                          </div>
                          <div className="flex justify-between gap-2 py-1 border-b border-dashed">
                            <span className="text-muted-foreground">Bailleur principal</span>
                            <span className="font-medium truncate">{project.bailleur}</span>
                          </div>
                          <div className="flex justify-between gap-2 py-1">
                            <span className="text-muted-foreground">Mise à jour</span>
                            <span className="font-medium">{format(new Date(project.updatedAt), "dd/MM/yyyy", { locale: fr })}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="col-span-12 lg:col-span-4 border-l-4 border-l-secondary">
                        <CardHeader className="py-2 px-3">
                          <CardTitle className="text-sm flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-secondary" />
                            Responsabilité OFOR
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 px-3 pb-3 space-y-1.5 text-xs">
                          {entite && (
                            <div className="flex justify-between gap-2 py-1 border-b border-dashed">
                              <span className="text-muted-foreground">Entité</span>
                              <span className="font-medium truncate">{entite.code} — {entite.nom}</span>
                            </div>
                          )}
                          {service && (
                            <div className="flex justify-between gap-2 py-1 border-b border-dashed">
                              <span className="text-muted-foreground">Structure</span>
                              <span className="font-medium truncate">{service.code} — {service.nom}</span>
                            </div>
                          )}
                          <div className="flex justify-between gap-2 py-1 border-b border-dashed">
                            <span className="text-muted-foreground">Responsable</span>
                            <span className="font-medium truncate">{project.responsible || "-"}</span>
                          </div>
                          {project.responsibleEmail && (
                            <div className="flex justify-between gap-2 py-1 border-b border-dashed">
                              <span className="text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />Email</span>
                              <span className="font-medium truncate">{project.responsibleEmail}</span>
                            </div>
                          )}
                          {project.responsiblePhone && (
                            <div className="flex justify-between gap-2 py-1">
                              <span className="text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />Téléphone</span>
                              <span className="font-medium">{project.responsiblePhone}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="col-span-12 lg:col-span-4 border-l-4 border-l-primary/60">
                        <CardHeader className="py-2 px-3">
                          <CardTitle className="text-sm flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            Calendrier
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 px-3 pb-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-center p-2 bg-muted/50 rounded">
                              <p className="text-[10px] text-muted-foreground uppercase">Début</p>
                              <p className="font-semibold text-xs">{format(new Date(project.startDate), "dd MMM yyyy", { locale: fr })}</p>
                            </div>
                            <div className="text-center p-2 bg-muted/50 rounded">
                              <p className="text-[10px] text-muted-foreground uppercase">Fin</p>
                              <p className="font-semibold text-xs">{format(new Date(project.endDate), "dd MMM yyyy", { locale: fr })}</p>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs py-1 border-t pt-2">
                            <span className="text-muted-foreground">Durée totale</span>
                            <span className="font-medium">{months} mois</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Reste</span>
                            <span className="font-medium">{Math.max(0, differenceInDays(new Date(project.endDate), new Date()))} jours</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Row 2: Description / Objectifs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Card className="border-l-4 border-l-primary">
                        <CardHeader className="py-2 px-3">
                          <CardTitle className="text-sm flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-primary" /> Description
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 px-3 pb-3">
                          {project.description
                            ? <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{project.description}</p>
                            : <p className="text-xs text-muted-foreground italic">Non renseignée</p>}
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-secondary">
                        <CardHeader className="py-2 px-3">
                          <CardTitle className="text-sm flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-secondary" /> Objectifs
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 px-3 pb-3">
                          {project.objectives
                            ? <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{project.objectives}</p>
                            : <p className="text-xs text-muted-foreground italic">Non renseignés</p>}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Row 3: Budget & Financements + Zones */}
                    <div className="grid grid-cols-12 gap-3">
                      <Card className="col-span-12 lg:col-span-7 bg-primary/5 border-primary/20">
                        <CardHeader className="py-2 px-3">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Banknote className="w-3.5 h-3.5 text-primary" /> Budget & financements
                            </span>
                            {fin.length > 0 && <Badge variant="outline" className="text-[10px] h-5">{fin.length} bailleur{fin.length > 1 ? "s" : ""}</Badge>}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 px-3 pb-3">
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="p-2 bg-background rounded border text-center">
                              <p className="text-[10px] text-muted-foreground uppercase">Budget total</p>
                              <p className="font-bold text-sm text-primary">{formatMontant(project.budget)} <span className="text-[10px] font-normal">{project.currency || "FCFA"}</span></p>
                            </div>
                            <div className="p-2 bg-background rounded border text-center">
                              <p className="text-[10px] text-muted-foreground uppercase">Dépensé</p>
                              <p className="font-bold text-sm">{formatMontant(project.spent || 0)}</p>
                            </div>
                            <div className="p-2 bg-background rounded border text-center">
                              <p className="text-[10px] text-muted-foreground uppercase">Couverture activités</p>
                              <p className="font-bold text-sm">{actCoverage}%</p>
                            </div>
                          </div>
                          {fin.length > 0 ? (
                            <div className="space-y-1.5">
                              {fin.map(f => {
                                const part = totalFCFA > 0 ? (f.amountFCFA / totalFCFA) * 100 : 0;
                                return (
                                  <div key={f.id} className="space-y-0.5 pb-1.5 border-b border-dashed last:border-0">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-medium truncate">{f.bailleur}</span>
                                      <span className="text-[10px] font-semibold text-primary">{part.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                                      <span className="font-mono">{formatMontant(f.amount)} {f.currency}</span>
                                      {f.currency !== "XOF" && <span className="font-mono">≈ {formatMontant(f.amountFCFA)} FCFA</span>}
                                    </div>
                                    <Progress value={part} className="h-1" />
                                  </div>
                                );
                              })}
                              <div className="flex justify-between pt-1 text-xs font-semibold">
                                <span>Total financé (FCFA)</span>
                                <span className="font-mono">{formatMontant(totalFCFA)}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Bailleur unique : {project.bailleur}</p>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="col-span-12 lg:col-span-5">
                        <CardHeader className="py-2 px-3">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-primary" /> Zones d'intervention
                            </span>
                            <Badge variant="outline" className="text-[10px] h-5">{project.zonesIntervention?.length || 0}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 px-3 pb-3">
                          {project.zonesIntervention && project.zonesIntervention.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {project.zonesIntervention.map((zone, i) => (
                                <Badge key={i} variant="outline" className="text-[10px] h-5 gap-0.5">
                                  <MapPin className="w-2.5 h-2.5" />
                                  {zone.communeName || zone.departementName || zone.regionName}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Aucune zone définie</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Row 4: Équipe */}
                    <Card>
                      <CardHeader className="py-2 px-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-primary" /> Équipe projet
                          </span>
                          <Badge variant="outline" className="text-[10px] h-5">{project.equipeProjet?.length || 0} membre{(project.equipeProjet?.length || 0) > 1 ? "s" : ""}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 px-3 pb-3">
                        {project.equipeProjet && project.equipeProjet.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {project.equipeProjet.map((aff, i) => {
                              const p = mockPersonnel.find(pp => pp.id === aff.personnelId);
                              if (!p) return null;
                              return (
                                <div key={i} className="flex items-center gap-2 bg-muted/40 rounded p-2 border">
                                  <div className="p-1.5 bg-primary/10 rounded-full shrink-0">
                                    <User className="w-3 h-3 text-primary" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-xs truncate">{p.prenom} {p.nom}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{ROLE_LABELS[aff.role]}</p>
                                    {p.fonction && <p className="text-[9px] text-muted-foreground/70 truncate">{p.fonction}</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Aucune équipe définie</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Row 5: Top activities & indicators preview */}
                    {(activities.length > 0 || indicators.length > 0) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {activities.length > 0 && (
                          <Card>
                            <CardHeader className="py-2 px-3">
                              <CardTitle className="text-sm flex items-center justify-between">
                                <span className="flex items-center gap-1.5"><ListTodo className="w-3.5 h-3.5 text-primary" /> Activités principales</span>
                                <Badge variant="outline" className="text-[10px] h-5">{activities.length}</Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 px-3 pb-3">
                              <div className="space-y-1.5">
                                {activities.slice(0, 5).map(a => (
                                  <div key={a.id} className="flex items-center gap-2 text-xs py-1 border-b border-dashed last:border-0">
                                    <Badge variant="outline" className="font-mono text-[9px] h-4 px-1">{a.code}</Badge>
                                    <span className="flex-1 truncate font-medium">{a.name}</span>
                                    <span className="text-[10px] text-muted-foreground">{a.progress}%</span>
                                    <Badge variant="secondary" className="text-[9px] h-4 px-1">{ACTIVITY_STATUS_LABELS[a.status]}</Badge>
                                  </div>
                                ))}
                                {activities.length > 5 && (
                                  <p className="text-[10px] text-muted-foreground italic text-center pt-1">+ {activities.length - 5} autre{activities.length - 5 > 1 ? "s" : ""} — voir l'onglet Activités</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {indicators.length > 0 && (
                          <Card>
                            <CardHeader className="py-2 px-3">
                              <CardTitle className="text-sm flex items-center justify-between">
                                <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-secondary" /> Indicateurs clés</span>
                                <Badge variant="outline" className="text-[10px] h-5">{indicators.length}</Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 px-3 pb-3">
                              <div className="space-y-1.5">
                                {indicators.slice(0, 5).map(ind => {
                                  const pct = ind.targetValue > 0 ? Math.round(((ind.currentValue || 0) / ind.targetValue) * 100) : 0;
                                  return (
                                    <div key={ind.id} className="space-y-0.5 py-1 border-b border-dashed last:border-0">
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="flex-1 truncate font-medium">{ind.name}</span>
                                        <span className="text-[10px] font-mono text-muted-foreground">{formatMontant(ind.currentValue || 0)}/{formatMontant(ind.targetValue)} {ind.unit}</span>
                                        <span className="text-[10px] font-semibold text-primary">{pct}%</span>
                                      </div>
                                      <Progress value={Math.min(100, pct)} className="h-1" />
                                    </div>
                                  );
                                })}
                                {indicators.length > 5 && (
                                  <p className="text-[10px] text-muted-foreground italic text-center pt-1">+ {indicators.length - 5} autre{indicators.length - 5 > 1 ? "s" : ""} — voir l'onglet Indicateurs</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Fiche Projet Dialog */}
      <ProjectDetailDialog
        project={project}
        open={showFicheProjet}
        onOpenChange={setShowFicheProjet}
      />

      {/* Edit Wizard */}
      <ProjectWizard
        open={showEditForm}
        onOpenChange={setShowEditForm}
        onSubmit={(data) => {
          console.log("Update project:", data);
          setShowEditForm(false);
          toast.success("Projet modifié avec succès");
        }}
        initialData={{
          code: project.code,
          name: project.name,
          description: project.description,
          region: project.region,
          zonesIntervention: project.zonesIntervention,
          bailleur: project.bailleur,
          budget: project.budget,
          currency: project.currency as any,
          budgetFCFA: (project as any).budgetFCFA || project.budget,
          startDate: new Date(project.startDate),
          endDate: new Date(project.endDate),
          responsible: project.responsible,
          responsibleEmail: project.responsibleEmail,
          responsiblePhone: project.responsiblePhone,
          objectives: project.objectives,
          serviceResponsableId: (project as any).serviceResponsableId,
          equipeProjet: project.equipeProjet,
          financements: (project as any).financements,
        } as any}
        isEditing
      />
    </DashboardLayout>
  );
};

export default ProjetDetail;
