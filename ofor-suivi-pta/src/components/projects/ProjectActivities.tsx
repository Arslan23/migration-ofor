import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  ListTodo,
  ChevronDown,
  ChevronUp,
  Target,
  FileText,
  Eye,
  MapPin,
} from "lucide-react";
import { 
  Activity, 
  Indicator, 
  ACTIVITY_STATUS_LABELS, 
  ACTIVITY_NATURE_LABELS,
  getDeliverableCode,
  getDeliverableName,
  getDeliverableUnit,
} from "@/types/project";
import ActivityForm from "./ActivityForm";
import ActivityDetail from "./ActivityDetail";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatZoneIntervention } from "@/data/geoData";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ExportButtons from "@/components/ui/ExportButtons";
import { exportToCSV, exportToPDF, formatMontant, exportDetailToPDF } from "@/lib/exportUtils";
import { toast } from "sonner";

interface ProjectActivitiesProps {
  activities: Activity[];
  projectIndicators: Indicator[];
  onAdd: (activity: Omit<Activity, "id" | "spent" | "progress" | "deliverables" | "fichesSuivi">) => void;
  onEdit: (id: string, activity: Partial<Activity>) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
  planningMode?: boolean;
  viewOnly?: boolean;
  projectCode?: string;
  projectName?: string;
  projectServiceResponsableId?: string;
}

const getStatusBadgeClass = (status: Activity["status"]) => {
  const classes = {
    planifie: "bg-muted text-muted-foreground",
    en_cours: "badge-info",
    termine: "badge-success",
    annule: "badge-danger",
  };
  return classes[status];
};

const formatBudget = (amount: number) => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)} Mds`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(0)} M`;
  }
  return new Intl.NumberFormat("fr-FR").format(amount);
};

const ProjectActivities = ({
  activities,
  projectIndicators,
  onAdd,
  onEdit,
  onDelete,
  readOnly = false,
  planningMode = false,
  viewOnly = false,
  projectCode = "",
  projectName = "",
  projectServiceResponsableId,
}: ProjectActivitiesProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // In viewOnly mode, show details in popup instead of expanding
  const hideActionButtons = viewOnly || readOnly;

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setShowForm(true);
  };

  const handleSubmit = (data: any) => {
    const formattedData = {
      ...data,
      startDate: format(data.startDate, "yyyy-MM-dd"),
      endDate: format(data.endDate, "yyyy-MM-dd"),
    };

    if (editingActivity) {
      onEdit(editingActivity.id, formattedData);
    } else {
      onAdd(formattedData);
    }
    setEditingActivity(null);
  };

  const toggleExpanded = (activityId: string) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  const totalBudget = activities.reduce((sum, a) => sum + a.budget, 0);
  const totalSpent = activities.reduce((sum, a) => sum + a.spent, 0);

  // Export functions
  const handleExportCSV = () => {
    const columns = [
      { key: "code", header: "Code" },
      { key: "name", header: "Activité" },
      { key: "nature", header: "Nature" },
      { key: "budget", header: "Budget (FCFA)" },
      { key: "spent", header: "Dépensé (FCFA)" },
      { key: "startDate", header: "Début" },
      { key: "endDate", header: "Fin" },
      { key: "status", header: "Statut" },
      { key: "progress", header: "Avancement (%)" },
    ];
    const data = activities.map((a) => ({
      ...a,
      nature: a.nature ? ACTIVITY_NATURE_LABELS[a.nature] : "-",
      status: ACTIVITY_STATUS_LABELS[a.status],
      startDate: format(new Date(a.startDate), "dd/MM/yyyy"),
      endDate: format(new Date(a.endDate), "dd/MM/yyyy"),
    }));
    exportToCSV(data, columns, "activites");
    toast.success("Export CSV généré");
  };

  const handleExportPDF = () => {
    const columns = [
      { key: "code", header: "Code", width: "10%" },
      { key: "name", header: "Activité", width: "30%" },
      { key: "budget", header: "Budget", width: "15%" },
      { key: "spent", header: "Dépensé", width: "15%" },
      { key: "periode", header: "Période", width: "18%" },
      { key: "progress", header: "Avt.", width: "12%" },
    ];
    const data = activities.map((a) => ({
      code: a.code,
      name: a.name,
      budget: a.budget,
      spent: a.spent,
      periode: `${format(new Date(a.startDate), "dd/MM/yy")} - ${format(new Date(a.endDate), "dd/MM/yy")}`,
      progress: `${a.progress}%`,
    }));
    exportToPDF("Liste des Activités", data, columns, "activites", {
      subtitle: `${activities.length} activité(s)`,
      summary: [
        { label: "Budget total", value: `${formatMontant(totalBudget)} FCFA` },
        { label: "Dépensé", value: `${formatMontant(totalSpent)} FCFA` },
      ],
    });
    toast.success("Export PDF généré");
  };

  const handleExportActivityDetail = (activity: Activity) => {
    const sections = [
      {
        title: "Informations générales",
        content: [
          { label: "Code", value: activity.code },
          { label: "Nom", value: activity.name },
          { label: "Nature", value: activity.nature ? ACTIVITY_NATURE_LABELS[activity.nature] : "-" },
          { label: "Statut", value: ACTIVITY_STATUS_LABELS[activity.status] },
          { label: "Description", value: activity.description || "-" },
        ],
      },
      {
        title: "Période et budget",
        content: [
          { label: "Date début", value: format(new Date(activity.startDate), "dd MMMM yyyy", { locale: fr }) },
          { label: "Date fin", value: format(new Date(activity.endDate), "dd MMMM yyyy", { locale: fr }) },
          { label: "Budget", value: `${formatMontant(activity.budget)} FCFA` },
          { label: "Dépensé", value: `${formatMontant(activity.spent)} FCFA` },
          { label: "Avancement", value: `${activity.progress}%` },
        ],
      },
      {
        title: `Livrables (${activity.deliverables.length})`,
        content: activity.deliverables.length > 0
          ? activity.deliverables.map((d) => ({
              label: getDeliverableCode(d),
              value: `${getDeliverableName(d)} - Cible: ${d.targetValue} ${getDeliverableUnit(d)} | Réalisé: ${d.currentValue}`,
            }))
          : [{ label: "-", value: "Aucun livrable défini" }],
      },
    ];
    exportDetailToPDF(`Fiche Activité - ${activity.code}`, sections, `fiche_activite_${activity.code}`);
    toast.success("Fiche PDF générée");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary" />
            Activités planifiées ({activities.length})
          </CardTitle>
          {!planningMode && (
            <p className="text-sm text-muted-foreground mt-1">
              Budget: {formatBudget(totalBudget)} FCFA | Dépensé: {formatBudget(totalSpent)} FCFA
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activities.length > 0 && (
            <ExportButtons onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
          )}
          {!hideActionButtons && (
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune activité planifiée</p>
            {!hideActionButtons && (
              <Button variant="outline" className="mt-4" onClick={() => setShowForm(true)}>
                Ajouter une activité
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const isExpanded = expandedActivities.has(activity.id);

              // In viewOnly mode, render clickable row that opens popup
              if (viewOnly) {
                return (
                  <div
                    key={activity.id}
                    className="border rounded-lg bg-card p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedActivity(activity)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-muted-foreground">
                            {activity.code}
                          </span>
                        </div>
                        <h4 className="font-medium">{activity.name}</h4>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {activity.description}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Activity Summary Row */}
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {format(new Date(activity.startDate), "dd/MM/yy", { locale: fr })}
                          {" → "}
                          {format(new Date(activity.endDate), "dd/MM/yy", { locale: fr })}
                        </span>
                      </div>

                      <div className="text-muted-foreground">
                        Budget: <span className="font-mono">{formatBudget(activity.budget)}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {activity.deliverables.length} livrables
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Normal mode with collapsible
              return (
                <Collapsible
                  key={activity.id}
                  open={isExpanded}
                  onOpenChange={() => toggleExpanded(activity.id)}
                >
                  <div 
                    className="border rounded-lg bg-card"
                  >
                    {/* Activity Header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-xs text-muted-foreground">
                              {activity.code}
                            </span>
                            {activity.nature && (
                              <span className="badge-status bg-primary/10 text-primary text-xs">
                                {ACTIVITY_NATURE_LABELS[activity.nature]}
                              </span>
                            )}
                            {!planningMode && (
                              <span className={cn("badge-status text-xs", getStatusBadgeClass(activity.status))}>
                                {ACTIVITY_STATUS_LABELS[activity.status]}
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium">{activity.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            {activity.entiteExecution && (
                              <span className="text-xs text-muted-foreground">
                                Exécution: {activity.entiteExecution}
                              </span>
                            )}
                            {activity.zonesIntervention && activity.zonesIntervention.length > 0 && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {activity.zonesIntervention.slice(0, 2).map(z => z.departementName || z.communeName || z.regionName).join(", ")}
                                  {activity.zonesIntervention.length > 2 && ` +${activity.zonesIntervention.length - 2}`}
                                </span>
                              </div>
                            )}
                          </div>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {activity.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedActivity(activity);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!hideActionButtons && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(activity);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer l'activité ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Cette action est irréversible. L'activité "{activity.name}" et toutes ses données (livrables) seront définitivement supprimées.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(activity.id)}>
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>

                      {/* Activity Summary Row */}
                      <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {format(new Date(activity.startDate), "dd/MM/yy", { locale: fr })}
                            {" → "}
                            {format(new Date(activity.endDate), "dd/MM/yy", { locale: fr })}
                          </span>
                        </div>

                        <div className="text-muted-foreground">
                          Budget: <span className="font-mono">{formatBudget(activity.budget)}</span>
                        </div>

                        {!planningMode && (
                          <>
                            <div className="text-muted-foreground">
                              Dépensé:{" "}
                              <span className={cn("font-mono", activity.spent > activity.budget && "text-destructive")}>
                                {formatBudget(activity.spent)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                              <Progress value={activity.progress} className="h-2 flex-1" />
                              <span className="font-medium w-10 text-right">{activity.progress}%</span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {activity.deliverables.length} liv.
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {activity.fichesSuivi.length} fiches
                              </span>
                            </div>
                          </>
                        )}

                        {planningMode && (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {activity.deliverables.length} livrables
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <CollapsibleContent>
                      <ActivityDetail
                        activity={activity}
                        projectIndicators={projectIndicators}
                        onUpdateActivity={(data) => onEdit(activity.id, data)}
                        readOnly={readOnly}
                        hideFiches={readOnly || planningMode}
                        planningMode={planningMode}
                        projectCode={projectCode}
                        projectName={projectName}
                      />
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}

        <ActivityForm
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) setEditingActivity(null);
          }}
          onSubmit={handleSubmit}
          initialData={editingActivity || undefined}
          isEditing={!!editingActivity}
          projectServiceResponsableId={projectServiceResponsableId}
        />

        {/* Detail popup for viewOnly mode */}
        <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-primary" />
                  Détail de l'activité
                </DialogTitle>
                {selectedActivity && (
                  <Button variant="outline" size="sm" onClick={() => handleExportActivityDetail(selectedActivity)}>
                    <FileText className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                )}
              </div>
            </DialogHeader>
            {selectedActivity && (
              <div className="space-y-6">
                {/* Activity Info Header */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {selectedActivity.code}
                        </span>
                        {selectedActivity.nature && (
                          <span className="badge-status bg-primary/10 text-primary text-xs">
                            {ACTIVITY_NATURE_LABELS[selectedActivity.nature]}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold">{selectedActivity.name}</h3>
                      {selectedActivity.entiteExecution && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium">Entité d'exécution:</span> {selectedActivity.entiteExecution}
                        </p>
                      )}
                      {selectedActivity.zonesIntervention && selectedActivity.zonesIntervention.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Zones:</span>
                          {selectedActivity.zonesIntervention.map((zone, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {formatZoneIntervention(zone)}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {selectedActivity.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {selectedActivity.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Activity Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Date de début</p>
                      <p className="font-medium">
                        {format(new Date(selectedActivity.startDate), "dd MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date de fin</p>
                      <p className="font-medium">
                        {format(new Date(selectedActivity.endDate), "dd MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Budget alloué</p>
                      <p className="font-medium font-mono">{formatBudget(selectedActivity.budget)} FCFA</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Livrables</p>
                      <p className="font-medium">{selectedActivity.deliverables.length}</p>
                    </div>
                  </div>

                  {selectedActivity.responsible && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Responsable:</span>
                      <span className="font-medium">{selectedActivity.responsible}</span>
                    </div>
                  )}
                </div>

                {/* Product Indicators Section */}
                <ActivityDetail
                  activity={selectedActivity}
                  projectIndicators={projectIndicators}
                  onUpdateActivity={() => {}}
                  readOnly={true}
                  hideFiches={true}
                  planningMode={planningMode}
                  projectCode={projectCode}
                  projectName={projectName}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ProjectActivities;
