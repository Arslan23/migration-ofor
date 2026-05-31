import { Project, STATUS_LABELS, ACTIVITY_STATUS_LABELS, CURRENCIES } from "@/types/project";
import { ROLE_LABELS, getPersonnelById, getPersonnelFullName, RoleProjet } from "@/data/personnel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Calendar,
  Users,
  Wallet,
  Target,
  ListTodo,
  Mail,
  Phone,
  Building2,
  Package,
  FileText,
  UserCircle,
  Download,
  Send,
} from "lucide-react";
import { useState } from "react";
import ShareByEmailDialog from "@/components/share/ShareByEmailDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatMontant } from "@/lib/exportUtils";
import { exportProjetDetailToPDF, ProjectExportData } from "@/lib/exportFicheUtils";
import { toast } from "sonner";
import { getDeliverableCode, getDeliverableName, getDeliverableUnit } from "@/types/project";
import { useIsMobile } from "@/hooks/use-mobile";

const formatBudget = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount);
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case "en_cours":
      return "default";
    case "termine":
      return "secondary";
    case "retard":
      return "destructive";
    case "planifie":
      return "outline";
    default:
      return "outline";
  }
};

interface ProjectDetailDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProjectDetailDialog = ({
  project,
  open,
  onOpenChange,
}: ProjectDetailDialogProps) => {
  const isMobile = useIsMobile();
  const [shareOpen, setShareOpen] = useState(false);
  
  if (!project) return null;

  const totalDeliverables = project.activities.reduce(
    (sum, act) => sum + act.deliverables.length,
    0
  );
  const totalFiches = project.activities.reduce(
    (sum, act) => sum + act.fichesSuivi.length,
    0
  );

  const handleExportProjectPDF = () => {
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
      status: STATUS_LABELS[project.status],
      zonesIntervention: project.zonesIntervention,
      equipeProjet: project.equipeProjet?.map(aff => {
        const personnel = getPersonnelById(aff.personnelId);
        return {
          personnelName: personnel ? getPersonnelFullName(personnel) : "Inconnu",
          roleName: ROLE_LABELS[aff.role as RoleProjet] || aff.role,
        };
      }),
      activities: project.activities.map(a => ({
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
      indicators: project.indicators.map(i => ({
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

  const sharePreview = `
    <h2 style="margin:0 0 8px 0;">${project.name}</h2>
    <p style="margin:0 0 12px 0;color:#666;font-size:12px;">${project.code} • ${STATUS_LABELS[project.status]}</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Bailleur</strong></td><td style="padding:4px 8px;">${project.bailleur ?? '-'}</td></tr>
      <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Région</strong></td><td style="padding:4px 8px;">${project.region ?? '-'}</td></tr>
      <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Budget</strong></td><td style="padding:4px 8px;">${formatBudget(project.budget)} ${project.currency || 'XOF'}</td></tr>
      <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Avancement</strong></td><td style="padding:4px 8px;">${project.progress}%</td></tr>
      <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Activités</strong></td><td style="padding:4px 8px;">${project.activities.length}</td></tr>
      <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Livrables</strong></td><td style="padding:4px 8px;">${totalDeliverables}</td></tr>
    </table>
    <p style="margin:12px 0 0 0;font-size:12px;color:#666;">${project.description ?? ''}</p>
  `;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:!max-w-[900px] lg:!max-w-[1100px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">
                  {project.code}
                </Badge>
                <Badge variant={getStatusVariant(project.status)} className="text-[10px] sm:text-xs">
                  {STATUS_LABELS[project.status]}
                </Badge>
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold truncate">
                {project.name}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setShareOpen(true)} className="h-7 sm:h-8 px-2 sm:px-3">
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Partager</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportProjectPDF} className="h-7 sm:h-8 px-2 sm:px-3">
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)] sm:max-h-[calc(90vh-100px)]">
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            {/* Mobile: Accordion layout */}
            {isMobile ? (
              <Accordion type="multiple" defaultValue={["general", "activities"]} className="space-y-2">
                <AccordionItem value="general" className="border rounded-lg px-3">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      Général
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 space-y-3">
                    {/* Stats rapides - Mobile */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-primary">
                          {formatBudget(project.budget)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Budget {project.currency || "XOF"}
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="text-lg font-bold">{project.progress}%</p>
                        <p className="text-[10px] text-muted-foreground">Avancement</p>
                      </div>
                    </div>

                    {/* Progression */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progression</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-1.5" />
                    </div>

                    {/* Infos principales */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">
                          {format(new Date(project.startDate), "dd/MM/yy", { locale: fr })} -{" "}
                          {format(new Date(project.endDate), "dd/MM/yy", { locale: fr })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{project.bailleur}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{project.region}</span>
                      </div>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <div className="border-t pt-2">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">Description</p>
                        <p className="text-xs line-clamp-4">{project.description}</p>
                      </div>
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
                        {project.equipeProjet.map((affectation) => {
                          const personnel = getPersonnelById(affectation.personnelId);
                          if (!personnel) return null;
                          return (
                            <div key={affectation.role} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                              <UserCircle className="w-6 h-6 text-primary shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-xs truncate">{getPersonnelFullName(personnel)}</p>
                                <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[affectation.role as RoleProjet]}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">Aucune équipe</p>
                    )}
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
                      <p className="text-xs text-muted-foreground text-center py-4">Aucune zone</p>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="activities" className="border rounded-lg px-3">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <ListTodo className="w-3.5 h-3.5 text-primary" />
                      Activités ({project.activities.length})
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    {project.activities.length > 0 ? (
                      <div className="space-y-2">
                        {project.activities.map((activity) => (
                          <div key={activity.id} className="p-2 border rounded-lg">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <Badge variant="outline" className="text-[10px]">{activity.code}</Badge>
                              <span className="text-xs font-bold">{activity.progress}%</span>
                            </div>
                            <p className="text-xs font-medium truncate">{activity.name}</p>
                            <Progress value={activity.progress} className="h-1 mt-1" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">Aucune activité</p>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="indicators" className="border rounded-lg px-3">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-primary" />
                      Indicateurs ({project.indicators.length})
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    {project.indicators.length > 0 ? (
                      <div className="space-y-2">
                        {project.indicators.map((indicator) => {
                          const progressPercent = indicator.targetValue > 0
                            ? Math.round((indicator.currentValue / indicator.targetValue) * 100)
                            : 0;
                          return (
                            <div key={indicator.id} className="p-2 border rounded-lg">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <Badge variant="outline" className="text-[10px]">{indicator.code}</Badge>
                                <span className="text-xs font-bold">{progressPercent}%</span>
                              </div>
                              <p className="text-xs font-medium truncate">{indicator.name}</p>
                              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                                <span>{indicator.currentValue} / {indicator.targetValue}</span>
                                <span>{indicator.unit}</span>
                              </div>
                              <Progress value={progressPercent} className="h-1 mt-1" />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">Aucun indicateur</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              /* Desktop: Tabs layout */
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="w-full grid grid-cols-5 mb-4">
                  <TabsTrigger value="general" className="text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    Général
                  </TabsTrigger>
                  <TabsTrigger value="equipe" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    Équipe
                  </TabsTrigger>
                  <TabsTrigger value="zones" className="text-xs">
                    <MapPin className="w-3 h-3 mr-1" />
                    Zones
                  </TabsTrigger>
                  <TabsTrigger value="activities" className="text-xs">
                    <ListTodo className="w-3 h-3 mr-1" />
                    Activités
                  </TabsTrigger>
                  <TabsTrigger value="indicators" className="text-xs">
                    <Target className="w-3 h-3 mr-1" />
                    Indicateurs
                  </TabsTrigger>
                </TabsList>

              {/* Onglet Général */}
              <TabsContent value="general" className="space-y-4 mt-0">
                {/* Stats rapides - 6 cartes alignées sur grands écrans */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-primary">
                      {formatBudget(project.budget)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Budget {project.currency || "XOF"}
                    </p>
                  </div>
                  {project.currency && project.currency !== "XOF" && (
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-secondary">
                        {formatBudget(project.budgetFCFA || project.budget)}
                      </p>
                      <p className="text-xs text-muted-foreground">Équiv. FCFA</p>
                    </div>
                  )}
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold">{project.progress}%</p>
                    <p className="text-xs text-muted-foreground">Avancement</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold">{project.activities.length}</p>
                    <p className="text-xs text-muted-foreground">Activités</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold">{project.indicators.length}</p>
                    <p className="text-xs text-muted-foreground">Indicateurs</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold">{project.equipeProjet?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Équipe</p>
                  </div>
                </div>

                {/* Progression */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progression globale</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                {/* Infos principales - 4 colonnes sur grands écrans */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="text-sm min-w-0">
                      <p className="text-xs text-muted-foreground">Période</p>
                      <p className="font-medium truncate">
                        {format(new Date(project.startDate), "dd/MM/yy", { locale: fr })} -{" "}
                        {format(new Date(project.endDate), "dd/MM/yy", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="text-sm min-w-0">
                      <p className="text-xs text-muted-foreground">Bailleur</p>
                      <p className="font-medium truncate">{project.bailleur}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="text-sm min-w-0">
                      <p className="text-xs text-muted-foreground">Région</p>
                      <p className="font-medium truncate">{project.region}</p>
                    </div>
                  </div>
                </div>

                {/* Description & Objectifs côte à côte */}
                {(project.description || project.objectives) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border-t pt-3">
                    {project.description && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                        <p className="text-sm">{project.description}</p>
                      </div>
                    )}
                    {project.objectives && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Objectifs</p>
                        <p className="text-sm">{project.objectives}</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Onglet Équipe */}
              <TabsContent value="equipe" className="mt-0">
                <div className="space-y-4">
                  {/* Équipe projet depuis référentiel */}
                  {project.equipeProjet && project.equipeProjet.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {project.equipeProjet.map((affectation) => {
                        const personnel = getPersonnelById(affectation.personnelId);
                        if (!personnel) return null;
                        return (
                          <div
                            key={affectation.role}
                            className="p-3 bg-muted/50 rounded-lg"
                          >
                            <p className="text-xs text-muted-foreground mb-1">
                              {ROLE_LABELS[affectation.role as RoleProjet]}
                            </p>
                            <div className="flex items-center gap-2">
                              <UserCircle className="w-8 h-8 text-primary" />
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {getPersonnelFullName(personnel)}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {personnel.fonction}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                              {personnel.email && (
                                <div className="flex items-center gap-1 truncate">
                                  <Mail className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{personnel.email}</span>
                                </div>
                              )}
                              {personnel.telephone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 shrink-0" />
                                  {personnel.telephone}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucune équipe assignée</p>
                    </div>
                  )}

                  {/* Responsable legacy si pas d'équipe */}
                  {(!project.equipeProjet || project.equipeProjet.length === 0) && project.responsible && (
                    <div className="border-t pt-4">
                      <p className="text-xs text-muted-foreground mb-2">Responsable principal</p>
                      <div className="flex items-center gap-3">
                        <UserCircle className="w-10 h-10 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{project.responsible}</p>
                          {project.responsibleEmail && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {project.responsibleEmail}
                            </p>
                          )}
                          {project.responsiblePhone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {project.responsiblePhone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Onglet Zones */}
              <TabsContent value="zones" className="mt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    Zones d'intervention du projet
                  </div>

                  {project.zonesIntervention && project.zonesIntervention.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {project.zonesIntervention.map((zone, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm"
                        >
                          <MapPin className="w-3 h-3 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {zone.communeName || zone.departementName || zone.regionName}
                            </p>
                            {(zone.communeName || zone.departementName) && (
                              <p className="text-xs text-muted-foreground truncate">
                                {zone.communeName && zone.departementName
                                  ? `${zone.departementName}, ${zone.regionName}`
                                  : zone.regionName}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucune zone spécifiée</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Onglet Activités */}
              <TabsContent value="activities" className="mt-0">
                <div className="space-y-2">
                  {project.activities.length > 0 ? (
                    project.activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs shrink-0">
                                {activity.code}
                              </Badge>
                              <Badge variant={getStatusVariant(activity.status)} className="text-xs">
                                {ACTIVITY_STATUS_LABELS[activity.status]}
                              </Badge>
                            </div>
                            <p className="font-medium text-sm truncate">{activity.name}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(activity.startDate), "dd/MM/yy")} -{" "}
                                {format(new Date(activity.endDate), "dd/MM/yy")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Wallet className="w-3 h-3" />
                                {formatBudget(activity.budget)} FCFA
                              </span>
                              <span className="flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {activity.deliverables.length} livrables
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold">{activity.progress}%</p>
                            <Progress value={activity.progress} className="w-16 h-1.5" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucune activité</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t flex justify-between text-sm text-muted-foreground">
                  <span>{project.activities.length} activités</span>
                  <span>{totalDeliverables} livrables • {totalFiches} fiches de suivi</span>
                </div>
              </TabsContent>

              {/* Onglet Indicateurs */}
              <TabsContent value="indicators" className="mt-0">
                <div className="space-y-2">
                  {project.indicators.length > 0 ? (
                    project.indicators.map((indicator) => {
                      const progressPercent =
                        indicator.targetValue > 0
                          ? Math.round((indicator.currentValue / indicator.targetValue) * 100)
                          : 0;
                      return (
                        <div
                          key={indicator.id}
                          className="p-3 border rounded-lg"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {indicator.code}
                                </Badge>
                                <Badge
                                  variant={indicator.type === "quantitatif" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {indicator.type}
                                </Badge>
                              </div>
                              <p className="font-medium text-sm">{indicator.name}</p>
                              {indicator.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {indicator.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-lg font-bold">{progressPercent}%</p>
                              <p className="text-xs text-muted-foreground">
                                {indicator.currentValue} / {indicator.targetValue} {indicator.unit}
                              </p>
                            </div>
                          </div>
                          <Progress value={progressPercent} className="h-1.5 mt-2" />
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucun indicateur</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
    <ShareByEmailDialog
      open={shareOpen}
      onOpenChange={setShareOpen}
      subject={`Synthèse projet — ${project.name}`}
      contextLabel={`Projet ${project.code}`}
      attachmentName={`synthese-projet-${project.code}.pdf`}
      htmlPreview={sharePreview}
    />
    </>
  );
};

export default ProjectDetailDialog;
