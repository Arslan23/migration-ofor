import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Package,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  ArrowUpRight,
  Paperclip,
  MessageSquare,
  Download,
} from "lucide-react";
import {
  Activity,
  Deliverable,
  FicheSuivi,
  Indicator,
  FICHE_STATUS_LABELS,
  getDeliverableCode,
  getDeliverableName,
  getDeliverableUnit,
} from "@/types/project";
import { Comment } from "@/types/comment";
import { Attachment } from "@/types/attachment";
import DeliverableForm from "./DeliverableForm";
import FicheSuiviForm from "./FicheSuiviForm";
import DocumentsCommentsSection from "@/components/ui/DocumentsCommentsSection";
import ShareByEmailDialog from "@/components/share/ShareByEmailDialog";
import { exportActiviteDetailToPDF, ActivityExportData } from "@/lib/exportFicheUtils";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ActivityDetailProps {
  activity: Activity;
  projectIndicators: Indicator[];
  onUpdateActivity: (data: Partial<Activity>) => void;
  readOnly?: boolean;
  hideFiches?: boolean;
  planningMode?: boolean;
  projectCode?: string;
  projectName?: string;
}

const getStatusBadgeClass = (status: FicheSuivi["status"]) => {
  const classes = {
    brouillon: "bg-muted text-muted-foreground",
    soumis: "badge-warning",
    valide: "badge-success",
    rejete: "badge-danger",
  };
  return classes[status];
};

const ActivityDetail = ({
  activity,
  projectIndicators,
  onUpdateActivity,
  readOnly = false,
  hideFiches = false,
  planningMode = false,
  projectCode = "",
  projectName = "",
}: ActivityDetailProps) => {
  const [showDeliverableForm, setShowDeliverableForm] = useState(false);
  const [showFicheForm, setShowFicheForm] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<Deliverable | null>(null);
  const [editingFiche, setEditingFiche] = useState<FicheSuivi | null>(null);
  const [viewingFiche, setViewingFiche] = useState<FicheSuivi | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const sharePreview = `
    <h2 style="margin:0 0 8px 0;">${activity.name}</h2>
    <p style="margin:0 0 12px 0;color:#666;font-size:12px;">${activity.code} • ${projectName || ''}</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Avancement</strong></td><td style="padding:4px 8px;">${activity.progress}%</td></tr>
      <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Budget</strong></td><td style="padding:4px 8px;">${new Intl.NumberFormat('fr-FR').format(activity.budget)}</td></tr>
      <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Consommé</strong></td><td style="padding:4px 8px;">${new Intl.NumberFormat('fr-FR').format(activity.spent)}</td></tr>
      <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Livrables</strong></td><td style="padding:4px 8px;">${activity.deliverables.length}</td></tr>
      <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Fiches de suivi</strong></td><td style="padding:4px 8px;">${activity.fichesSuivi.length}</td></tr>
    </table>
  `;

  // Deliverable handlers
  const handleAddDeliverable = (data: Omit<Deliverable, "id">) => {
    const newDeliverable: Deliverable = {
      ...data,
      id: `del-${Date.now()}`,
    };
    onUpdateActivity({
      deliverables: [...activity.deliverables, newDeliverable],
    });
  };

  const handleEditDeliverable = (id: string, data: Partial<Deliverable>) => {
    onUpdateActivity({
      deliverables: activity.deliverables.map((del) =>
        del.id === id ? { ...del, ...data } : del
      ),
    });
  };

  const handleDeleteDeliverable = (id: string) => {
    onUpdateActivity({
      deliverables: activity.deliverables.filter((del) => del.id !== id),
    });
    toast.success("Livrable supprimé");
  };

  // Fiche handlers
  const handleAddFiche = (data: any) => {
    const newFiche: FicheSuivi = {
      ...data,
      id: `fiche-${Date.now()}`,
      date: format(data.date, "yyyy-MM-dd"),
      status: "brouillon",
      deliverables: [],
      activityProgress: activity.progress,
      activitySpent: activity.spent,
    };
    onUpdateActivity({
      fichesSuivi: [newFiche, ...activity.fichesSuivi],
    });
  };

  const handleEditFiche = (id: string, data: Partial<FicheSuivi>) => {
    onUpdateActivity({
      fichesSuivi: activity.fichesSuivi.map((fiche) =>
        fiche.id === id ? { ...fiche, ...data } : fiche
      ),
    });
  };

  const handleDeleteFiche = (id: string) => {
    onUpdateActivity({
      fichesSuivi: activity.fichesSuivi.filter((fiche) => fiche.id !== id),
    });
    toast.success("Fiche supprimée");
  };

  const handleSubmitFiche = (id: string) => {
    onUpdateActivity({
      fichesSuivi: activity.fichesSuivi.map((fiche) =>
        fiche.id === id
          ? { ...fiche, status: "soumis" as const, submittedAt: new Date().toISOString() }
          : fiche
      ),
    });
    toast.success("Fiche soumise pour validation");
  };

  const handleValidateFiche = (id: string) => {
    onUpdateActivity({
      fichesSuivi: activity.fichesSuivi.map((fiche) =>
        fiche.id === id
          ? {
              ...fiche,
              status: "valide" as const,
              validatedAt: new Date().toISOString(),
              validatedBy: "Responsable Projet",
            }
          : fiche
      ),
    });
    toast.success("Fiche validée");
  };

  const handleRejectFiche = (id: string) => {
    onUpdateActivity({
      fichesSuivi: activity.fichesSuivi.map((fiche) =>
        fiche.id === id ? { ...fiche, status: "rejete" as const } : fiche
      ),
    });
    toast.error("Fiche rejetée");
  };

  const handleDeliverableSubmit = (data: any) => {
    if (editingDeliverable) {
      handleEditDeliverable(editingDeliverable.id, data);
    } else {
      handleAddDeliverable(data);
    }
    setEditingDeliverable(null);
  };

  const handleFicheSubmit = (data: any) => {
    if (editingFiche) {
      handleEditFiche(editingFiche.id, { ...data, date: format(data.date, "yyyy-MM-dd") });
    } else {
      handleAddFiche(data);
    }
    setEditingFiche(null);
  };

  const handleExportActivityPDF = () => {
    const activityData: ActivityExportData = {
      code: activity.code,
      name: activity.name,
      description: activity.description,
      nature: activity.nature,
      status: activity.status,
      responsible: activity.responsible,
      entiteExecution: activity.entiteExecution,
      startDate: activity.startDate,
      endDate: activity.endDate,
      budget: activity.budget,
      spent: activity.spent,
      progress: activity.progress,
      zonesIntervention: activity.zonesIntervention,
      deliverables: activity.deliverables.map(d => ({
        code: getDeliverableCode(d),
        name: getDeliverableName(d),
        unit: getDeliverableUnit(d),
        targetValue: d.targetValue,
        currentValue: d.currentValue,
      })),
      fichesSuivi: activity.fichesSuivi.map(f => ({
        code: f.code,
        date: f.date,
        period: f.period,
        status: f.status,
        author: f.author,
        activityProgress: f.activityProgress,
      })),
      projectCode,
      projectName,
    };
    exportActiviteDetailToPDF(activityData);
    toast.success("PDF activité généré");
  };

  const renderDeliverablesCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {activity.deliverables.map((deliverable) => {
        const progress = deliverable.targetValue > 0
          ? Math.round((deliverable.currentValue / deliverable.targetValue) * 100)
          : 0;
        const linkedIndicator = projectIndicators.find(
          (i) => i.id === deliverable.linkedPerformanceIndicatorId
        );

        return (
          <div
            key={deliverable.id}
            className="border rounded-lg p-3 bg-card hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {getDeliverableCode(deliverable)}
                  </span>
                  <span className="badge-status bg-muted text-muted-foreground text-xs">
                    {getDeliverableUnit(deliverable)}
                  </span>
                </div>
                <p className="font-medium text-sm truncate" title={getDeliverableName(deliverable)}>
                  {getDeliverableName(deliverable)}
                </p>
              </div>
              {!readOnly && (
                <div className="flex gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setEditingDeliverable(deliverable);
                      setShowDeliverableForm(true);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le livrable ?</AlertDialogTitle>
                        <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteDeliverable(deliverable.id)}>
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cible:</span>
                <span className="font-mono font-medium">
                  {deliverable.targetValue.toLocaleString("fr-FR")}
                </span>
              </div>
              {!planningMode && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Réalisé:</span>
                    <span className="font-mono font-semibold text-primary">
                      {deliverable.currentValue.toLocaleString("fr-FR")}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Progress value={Math.min(progress, 100)} className="h-1.5" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progression</span>
                      <span className={cn(progress >= 100 ? "text-green-600" : "")}>{progress}%</span>
                    </div>
                  </div>
                </>
              )}
              {linkedIndicator && (
                <div className="flex items-center gap-1 text-xs text-primary pt-1 border-t">
                  <ArrowUpRight className="w-3 h-3" />
                  <span className="truncate" title={linkedIndicator.name}>
                    Lié: {linkedIndicator.code}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4 pt-4 border-t">
      {hideFiches ? (
        // Mode simple : uniquement les livrables sans tabs
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              Livrables ({activity.deliverables.length})
            </CardTitle>
            <div className="flex gap-1">
              <Button onClick={() => setShareOpen(true)} size="sm" variant="ghost" title="Partager par email">
                <Send className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleExportActivityPDF}
                size="sm"
                variant="ghost"
                title="Exporter en PDF"
              >
                <Download className="w-4 h-4" />
              </Button>
              {!readOnly && (
                <Button
                  onClick={() => setShowDeliverableForm(true)}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {activity.deliverables.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun livrable défini</p>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setShowDeliverableForm(true)}
                  >
                    Ajouter un livrable
                  </Button>
                )}
              </div>
            ) : (
              renderDeliverablesCards()
            )}
            
            {/* Documents & Commentaires */}
            <DocumentsCommentsSection
              attachments={activity.attachments || []}
              onAttachmentsChange={!readOnly ? (attachments) => onUpdateActivity({ attachments }) : undefined}
              comments={activity.comments || []}
              onCommentsChange={(comments) => onUpdateActivity({ comments })}
              readOnly={readOnly}
              currentUser="Utilisateur"
            />
          </CardContent>
        </Card>
      ) : (
        // Mode complet avec tabs
        <Tabs defaultValue="deliverables" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deliverables" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Livrables ({activity.deliverables.length})
            </TabsTrigger>
            <TabsTrigger value="fiches" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Fiches de suivi ({activity.fichesSuivi.length})
            </TabsTrigger>
          </TabsList>

        <TabsContent value="deliverables">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle className="text-sm font-medium">
                Livrables
              </CardTitle>
              <div className="flex gap-1">
                <Button onClick={() => setShareOpen(true)} size="sm" variant="ghost" title="Partager par email">
                  <Send className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleExportActivityPDF}
                  size="sm"
                  variant="ghost"
                  title="Exporter en PDF"
                >
                  <Download className="w-4 h-4" />
                </Button>
                {!readOnly && (
                  <Button
                    onClick={() => setShowDeliverableForm(true)}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {activity.deliverables.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun livrable défini</p>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => setShowDeliverableForm(true)}
                    >
                      Ajouter un livrable
                    </Button>
                  )}
                </div>
              ) : (
                renderDeliverablesCards()
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiches">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle className="text-sm font-medium">Fiches de suivi</CardTitle>
              {!readOnly && (
                <Button
                  onClick={() => setShowFicheForm(true)}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Nouvelle fiche
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {activity.fichesSuivi.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune fiche de suivi</p>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => setShowFicheForm(true)}
                    >
                      Créer une fiche
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead className="w-28">Code</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Auteur</TableHead>
                      <TableHead>Avancement</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-28"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activity.fichesSuivi.map((fiche) => (
                      <TableRow key={fiche.id}>
                        <TableCell className="font-mono text-xs">{fiche.code}</TableCell>
                        <TableCell className="font-medium text-sm">{fiche.period}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(fiche.date), "dd/MM/yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell className="text-sm">{fiche.author}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Progress value={fiche.activityProgress} className="h-1.5 w-16" />
                            <span className="text-xs">{fiche.activityProgress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn("badge-status text-xs", getStatusBadgeClass(fiche.status))}>
                            {FICHE_STATUS_LABELS[fiche.status]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setViewingFiche(fiche)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>

                            {!readOnly && fiche.status === "brouillon" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setEditingFiche(fiche);
                                    setShowFicheForm(true);
                                  }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-primary"
                                  onClick={() => handleSubmitFiche(fiche.id)}
                                >
                                  <Send className="w-3 h-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Supprimer la fiche ?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Cette action est irréversible.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteFiche(fiche.id)}>
                                        Supprimer
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}

                            {!readOnly && fiche.status === "soumis" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-secondary"
                                  onClick={() => handleValidateFiche(fiche.id)}
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => handleRejectFiche(fiche.id)}
                                >
                                  <XCircle className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}
      {/* Deliverable Form */}
      <DeliverableForm
        open={showDeliverableForm}
        onOpenChange={(open) => {
          setShowDeliverableForm(open);
          if (!open) setEditingDeliverable(null);
        }}
        onSubmit={handleDeliverableSubmit}
        projectIndicators={projectIndicators}
        activityNature={activity.nature}
        initialData={editingDeliverable || undefined}
        isEditing={!!editingDeliverable}
        hideCurrentValue={planningMode}
      />

      {/* Fiche Form */}
      <FicheSuiviForm
        open={showFicheForm}
        onOpenChange={(open) => {
          setShowFicheForm(open);
          if (!open) setEditingFiche(null);
        }}
        onSubmit={handleFicheSubmit}
        deliverables={activity.deliverables}
        activity={activity}
        initialData={editingFiche || undefined}
        isEditing={!!editingFiche}
      />

      {/* View Fiche Dialog */}
      <Dialog open={!!viewingFiche} onOpenChange={() => setViewingFiche(null)}>
        <DialogContent className="w-[95vw] sm:!max-w-[900px] lg:!max-w-[1100px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fiche de suivi - {viewingFiche?.code}</DialogTitle>
          </DialogHeader>
          {viewingFiche && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Période</p>
                  <p className="font-medium">{viewingFiche.period}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(viewingFiche.date), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Auteur</p>
                  <p className="font-medium">{viewingFiche.author}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <span className={cn("badge-status", getStatusBadgeClass(viewingFiche.status))}>
                    {FICHE_STATUS_LABELS[viewingFiche.status]}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Avancement activité</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={viewingFiche.activityProgress} className="h-2 flex-1" />
                    <span className="font-medium">{viewingFiche.activityProgress}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dépenses</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat("fr-FR").format(viewingFiche.activitySpent)} FCFA
                  </p>
                </div>
              </div>

              {viewingFiche.observations && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Observations</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{viewingFiche.observations}</p>
                </div>
              )}

              {viewingFiche.deliverables.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    Livrables ({viewingFiche.deliverables.length})
                  </p>
                  <div className="space-y-2">
                    {viewingFiche.deliverables.map((del, idx) => {
                      const deliverable = activity.deliverables.find(
                        (d) => d.id === del.deliverableId
                      );
                      return (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-muted/50 p-2 rounded"
                        >
                          <span className="text-sm">{deliverable ? getDeliverableName(deliverable) : del.deliverableId}</span>
                          <span className="font-mono text-sm">
                            {del.actualValue} / {del.plannedValue}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewingFiche.validatedAt && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Validé le {format(new Date(viewingFiche.validatedAt), "dd/MM/yyyy")} par{" "}
                    {viewingFiche.validatedBy}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ShareByEmailDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        subject={`Synthèse activité — ${activity.name}`}
        contextLabel={`Activité ${activity.code}`}
        attachmentName={`synthese-activite-${activity.code}.pdf`}
        htmlPreview={sharePreview}
      />
    </div>
  );
};

export default ActivityDetail;
