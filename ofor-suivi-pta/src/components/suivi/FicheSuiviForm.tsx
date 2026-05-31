import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  ArrowRight, CheckCircle, Calendar, Lock, Send, Save, Eye, Paperclip, 
  AlertTriangle, AlertCircle, Info, Plus, Trash2, ChevronDown, ListTodo, Target,
  MessageSquare, FileDown,
} from "lucide-react";
import AttachmentManager from "@/components/ui/AttachmentManager";
import CommentManager from "@/components/ui/CommentManager";
import { Attachment } from "@/types/attachment";
import { Comment } from "@/types/comment";
import { toast } from "sonner";
import { exportFicheSuiviToPDF } from "@/lib/exportFicheUtils";
import { 
  FicheSuivi, FicheSuiviStatus, Workflow, WorkflowStep, calculateWorkflowProgress,
  PointCritique, ActionSuivi, PointCritiqueNiveau, PointCritiqueStatut,
  ActionSuiviStatut, ActionSuiviPriorite,
  POINT_CRITIQUE_NIVEAU_LABELS, POINT_CRITIQUE_STATUT_LABELS,
  ACTION_SUIVI_STATUT_LABELS, ACTION_SUIVI_PRIORITE_LABELS,
} from "@/types/workflow";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useUnites } from "@/contexts/UnitesContext";

const formatBudget = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount);
};

const ficheSuiviSchema = z.object({
  depensesCumulees: z.number().min(0, "Les dépenses cumulées ne peuvent pas être négatives"),
  currentStepId: z.string().optional(),
  observations: z.string().optional(),
  livrables: z.array(z.object({
    livrableId: z.string(),
    currentValue: z.number().min(0, "La valeur ne peut pas être négative"),
  })),
});

type FicheSuiviFormValues = z.infer<typeof ficheSuiviSchema>;

interface FicheSuiviFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fiche: FicheSuivi | null;
  workflow?: Workflow;
  onSubmit: (ficheId: string, data: FicheSuiviFormValues, action: "save" | "submit") => void;
  onValidate?: (ficheId: string) => void;
  onApprove?: (ficheId: string) => void;
  canValidate?: boolean;
  canApprove?: boolean;
  // Données supplémentaires de l'activité pour rappel période/budget
  activityPeriod?: { startDate?: string; endDate?: string };
  activityBudgetByQuarter?: { t1: number; t2: number; t3: number; t4: number };
}

const statusConfig: Record<FicheSuiviStatus, { label: string; color: string; icon: React.ReactNode }> = {
  brouillon: { label: "Brouillon", color: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400", icon: null },
  soumis: { label: "Soumis", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: <Send className="w-3 h-3" /> },
  valide: { label: "Validé", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: <CheckCircle className="w-3 h-3" /> },
  approuve: { label: "Approuvé", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle className="w-3 h-3" /> },
};

const FicheSuiviForm = ({
  open,
  onOpenChange,
  fiche,
  workflow,
  onSubmit,
  onValidate,
  onApprove,
  canValidate = false,
  canApprove = false,
  activityPeriod,
  activityBudgetByQuarter,
}: FicheSuiviFormProps) => {
  const isReadOnly = fiche ? fiche.status !== "brouillon" : false;
  const { allUnits } = useUnites();
  const getUnitDesc = (name: string) => {
    const key = (name || "").trim().toLowerCase();
    const u = allUnits.find((x) => (x.name || "").trim().toLowerCase() === key);
    return u?.description || name;
  };
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [pointsCritiques, setPointsCritiques] = useState<PointCritique[]>(fiche?.pointsCritiques || []);
  const [actionsSuivi, setActionsSuivi] = useState<ActionSuivi[]>(fiche?.actionsSuivi || []);
  const [pointsCritiquesOpen, setPointsCritiquesOpen] = useState(false);
  const [actionsSuiviOpen, setActionsSuiviOpen] = useState(false);

  const form = useForm<FicheSuiviFormValues>({
    resolver: zodResolver(ficheSuiviSchema),
    defaultValues: {
      depensesCumulees: fiche?.depensesCumulees || 0,
      currentStepId: fiche?.currentStepId || workflow?.steps[0]?.id,
      observations: fiche?.observations || "",
      livrables: fiche?.livrables.map(l => ({
        livrableId: l.livrableId,
        currentValue: l.currentValue,
      })) || [],
    },
  });

  useEffect(() => {
    if (fiche) {
      form.reset({
        depensesCumulees: fiche.depensesCumulees,
        currentStepId: fiche.currentStepId || workflow?.steps[0]?.id,
        observations: fiche.observations || "",
        livrables: fiche.livrables.map(l => ({
          livrableId: l.livrableId,
          currentValue: l.currentValue,
        })),
      });
      setPointsCritiques(fiche.pointsCritiques || []);
      setActionsSuivi(fiche.actionsSuivi || []);
    }
  }, [fiche, workflow, form]);

  const currentStepId = form.watch("currentStepId");
  const progressPercentage = workflow
    ? calculateWorkflowProgress(currentStepId, workflow)
    : fiche?.progressPercentage || 0;

  const budgetPrevu = fiche?.budgetPrevu || 0;
  const livrables = fiche?.livrables || [];

  // Ajouter un point critique
  const addPointCritique = () => {
    const newPoint: PointCritique = {
      id: `pc-${Date.now()}`,
      titre: "",
      description: "",
      niveau: "attention",
      statut: "ouvert",
      dateIdentification: new Date().toISOString().split("T")[0],
    };
    setPointsCritiques([...pointsCritiques, newPoint]);
  };

  // Supprimer un point critique
  const removePointCritique = (id: string) => {
    setPointsCritiques(pointsCritiques.filter(p => p.id !== id));
  };

  // Mettre à jour un point critique
  const updatePointCritique = (id: string, field: keyof PointCritique, value: any) => {
    setPointsCritiques(pointsCritiques.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  // Ajouter une action de suivi
  const addActionSuivi = (pointCritiqueId?: string) => {
    const newAction: ActionSuivi = {
      id: `as-${Date.now()}`,
      titre: "",
      responsable: "",
      echeance: new Date().toISOString().split("T")[0],
      priorite: "normale",
      statut: "a_faire",
      pointCritiqueId,
    };
    setActionsSuivi([...actionsSuivi, newAction]);
  };

  // Supprimer une action de suivi
  const removeActionSuivi = (id: string) => {
    setActionsSuivi(actionsSuivi.filter(a => a.id !== id));
  };

  // Mettre à jour une action de suivi
  const updateActionSuivi = (id: string, field: keyof ActionSuivi, value: any) => {
    setActionsSuivi(actionsSuivi.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const handleSave = () => {
    if (!fiche) return;
    onSubmit(fiche.id, { ...form.getValues(), pointsCritiques, actionsSuivi } as any, "save");
    toast.success("Fiche enregistrée");
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!fiche) return;
    onSubmit(fiche.id, { ...form.getValues(), pointsCritiques, actionsSuivi } as any, "submit");
    toast.success("Fiche soumise avec succès");
    onOpenChange(false);
  };

  const handleValidate = () => {
    if (!fiche || !onValidate) return;
    onValidate(fiche.id);
    toast.success("Fiche validée");
    onOpenChange(false);
  };

  const handleApprove = () => {
    if (!fiche || !onApprove) return;
    onApprove(fiche.id);
    toast.success("Fiche approuvée");
    onOpenChange(false);
  };

  const getStepStatus = (step: WorkflowStep) => {
    if (!workflow || !currentStepId) return "pending";
    const currentStep = workflow.steps.find(s => s.id === currentStepId);
    if (!currentStep) return "pending";
    if (step.order < currentStep.order) return "completed";
    if (step.order === currentStep.order) return "current";
    return "pending";
  };

  if (!fiche) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isReadOnly && <Lock className="w-4 h-4 text-muted-foreground" />}
            <span>Fiche de suivi</span>
            <Badge className={cn("ml-2", statusConfig[fiche.status].color)}>
              {statusConfig[fiche.status].icon}
              <span className="ml-1">{statusConfig[fiche.status].label}</span>
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {fiche.activityName} • {fiche.projectName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4">
            {/* Info fiche */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Code: </span>
                  <span className="font-mono font-medium">{fiche.code}</span>
                </div>
                <div className="text-sm">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  <span className="font-medium">
                    {format(new Date(fiche.dateCollecte), "dd MMMM yyyy", { locale: fr })}
                  </span>
                </div>
              </div>
            </div>

            {/* Rappel période et budget trimestriel de l'activité */}
            {(activityPeriod || activityBudgetByQuarter) && (
              <div className="p-3 border rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Rappel Activité</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Période d'exécution */}
                  {activityPeriod && (activityPeriod.startDate || activityPeriod.endDate) && (
                    <div className="p-2 bg-white dark:bg-background rounded-md border">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Période d'exécution</div>
                      <div className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-600" />
                        <span>
                          {activityPeriod.startDate ? format(new Date(activityPeriod.startDate), "dd/MM/yyyy") : "?"}
                          {" → "}
                          {activityPeriod.endDate ? format(new Date(activityPeriod.endDate), "dd/MM/yyyy") : "?"}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Budget total de l'activité */}
                  {activityBudgetByQuarter && (
                    <div className="p-2 bg-white dark:bg-background rounded-md border">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Budget total prévisionnel</div>
                      <div className="text-sm font-bold text-primary">
                        {formatBudget(activityBudgetByQuarter.t1 + activityBudgetByQuarter.t2 + activityBudgetByQuarter.t3 + activityBudgetByQuarter.t4)} FCFA
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Répartition trimestrielle du budget */}
                {activityBudgetByQuarter && (
                  <div className="mt-3">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Répartition trimestrielle du budget prévu</div>
                    <div className="grid grid-cols-4 gap-2">
                      {(['T1', 'T2', 'T3', 'T4'] as const).map((trimestre, idx) => {
                        const key = trimestre.toLowerCase() as 't1' | 't2' | 't3' | 't4';
                        const value = activityBudgetByQuarter[key];
                        const colors = [
                          'bg-blue-100 text-blue-700 border-blue-300',
                          'bg-green-100 text-green-700 border-green-300',
                          'bg-amber-100 text-amber-700 border-amber-300',
                          'bg-purple-100 text-purple-700 border-purple-300',
                        ];
                        return (
                          <div 
                            key={trimestre} 
                            className={cn("text-center p-2 rounded-md border", colors[idx])}
                          >
                            <div className="text-[10px] font-semibold mb-1">
                              {trimestre}
                            </div>
                            <div className="text-xs font-bold font-mono">
                              {formatBudget(value)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dépenses trimestrielles (si disponibles) */}
            {fiche.performancesTrimestres && (
              <div className="p-3 border rounded-lg bg-muted/20">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Dépenses cumulées par trimestre
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['T1', 'T2', 'T3', 'T4'] as const).map((trimestre, idx) => {
                    const key = trimestre.toLowerCase() as 't1' | 't2' | 't3' | 't4';
                    const value = fiche.performancesTrimestres?.[key];
                    const textColors = ['text-blue-600', 'text-green-600', 'text-amber-600', 'text-purple-600'];
                    return (
                      <div key={trimestre} className="text-center p-2 border rounded-md bg-background">
                        <div className={cn("text-[10px] font-semibold mb-1", textColors[idx])}>
                          {trimestre}
                        </div>
                        <div className="text-sm font-bold font-mono">
                          {value !== null && value !== undefined ? `${formatBudget(value)}` : '-'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Workflow steps */}
            {workflow && (
              <div>
                <label className="text-sm font-medium mb-2 block">État d'avancement (Workflow)</label>
                <div className="flex items-center gap-1 flex-wrap mb-2">
                  {workflow.steps.map((step, idx) => {
                    const status = getStepStatus(step);
                    return (
                      <div key={step.id} className="flex items-center">
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => !isReadOnly && form.setValue("currentStepId", step.id)}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded border text-xs transition-colors",
                            status === "completed" && "bg-green-100 border-green-300 text-green-800",
                            status === "current" && "bg-primary/10 border-primary text-primary ring-2 ring-primary/20",
                            status === "pending" && "bg-muted border-muted-foreground/20 text-muted-foreground",
                            isReadOnly && "cursor-default"
                          )}
                        >
                          {status === "completed" && <CheckCircle className="w-3 h-3" />}
                          <div className={cn("w-2 h-2 rounded-full", step.color)} />
                          {step.name}
                        </button>
                        {idx < workflow.steps.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-muted-foreground mx-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={progressPercentage} className="h-2" />
                  <span className="text-sm font-medium">{progressPercentage}%</span>
                </div>
              </div>
            )}

            {/* Budget */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Budget prévu</p>
                <p className="font-bold">{formatBudget(budgetPrevu)} FCFA</p>
              </div>
              <FormField
                control={form.control}
                name="depensesCumulees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Dépenses cumulées depuis le début</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        disabled={isReadOnly}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="h-9"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Taux d'exécution budgétaire:</span>
              <span className="font-semibold text-foreground">
                {budgetPrevu > 0 ? Math.round((form.watch("depensesCumulees") / budgetPrevu) * 100) : 0}%
              </span>
            </div>

            {/* Livrables */}
            {livrables.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Réalisations cumulées sur les livrables</label>
                <div className="space-y-2">
                  {livrables.map((livrable, idx) => {
                    const currentVal = form.watch(`livrables.${idx}.currentValue`) || 0;
                    const progressPct = livrable.targetValue > 0 ? Math.round((currentVal / livrable.targetValue) * 100) : 0;
                    return (
                      <div
                        key={livrable.livrableId}
                        className="flex items-center gap-3 p-2 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{getUnitDesc(livrable.livrableName)}</p>
                          <p className="text-[10px] text-muted-foreground lowercase">{livrable.livrableName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={Math.min(progressPct, 100)} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground">{progressPct}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Cible: {livrable.targetValue} {livrable.unit}
                          </p>
                        </div>
                        <FormField
                          control={form.control}
                          name={`livrables.${idx}.currentValue`}
                          render={({ field }) => (
                            <FormItem className="w-24">
                              <FormLabel className="text-xs text-muted-foreground">Réalisé</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  max={livrable.targetValue}
                                  disabled={isReadOnly}
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  className="h-8 text-center"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <span className="text-xs text-muted-foreground w-16">{livrable.unit}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Observations */}
            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observations</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observations, difficultés rencontrées, points d'attention..."
                      className="resize-none"
                      rows={2}
                      disabled={isReadOnly}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Points critiques */}
            <Collapsible open={pointsCritiquesOpen} onOpenChange={setPointsCritiquesOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" type="button" className="w-full justify-between h-9 px-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">Points critiques</span>
                    {pointsCritiques.length > 0 && (
                      <Badge variant="secondary" className="text-xs">{pointsCritiques.length}</Badge>
                    )}
                  </div>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", pointsCritiquesOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {pointsCritiques.map((point, idx) => (
                  <div key={point.id} className="p-3 border rounded-lg space-y-2 bg-muted/20">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Titre du point critique"
                          value={point.titre}
                          onChange={(e) => updatePointCritique(point.id, "titre", e.target.value)}
                          disabled={isReadOnly}
                          className="h-8 text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={point.niveau}
                            onValueChange={(v) => updatePointCritique(point.id, "niveau", v)}
                            disabled={isReadOnly}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background border shadow-lg z-50">
                              <SelectItem value="info">
                                <div className="flex items-center gap-1">
                                  <Info className="w-3 h-3 text-blue-500" />
                                  Information
                                </div>
                              </SelectItem>
                              <SelectItem value="attention">
                                <div className="flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-amber-500" />
                                  Attention
                                </div>
                              </SelectItem>
                              <SelectItem value="critique">
                                <div className="flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-red-500" />
                                  Critique
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={point.statut}
                            onValueChange={(v) => updatePointCritique(point.id, "statut", v)}
                            disabled={isReadOnly}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background border shadow-lg z-50">
                              <SelectItem value="ouvert">Ouvert</SelectItem>
                              <SelectItem value="en_cours">En cours</SelectItem>
                              <SelectItem value="resolu">Résolu</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Textarea
                          placeholder="Description..."
                          value={point.description}
                          onChange={(e) => updatePointCritique(point.id, "description", e.target.value)}
                          disabled={isReadOnly}
                          className="resize-none text-xs"
                          rows={2}
                        />
                      </div>
                      {!isReadOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removePointCritique(point.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {!isReadOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={addPointCritique}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter un point critique
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Actions de suivi */}
            <Collapsible open={actionsSuiviOpen} onOpenChange={setActionsSuiviOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" type="button" className="w-full justify-between h-9 px-3">
                  <div className="flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Actions de suivi</span>
                    {actionsSuivi.length > 0 && (
                      <Badge variant="secondary" className="text-xs">{actionsSuivi.length}</Badge>
                    )}
                  </div>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", actionsSuiviOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {actionsSuivi.map((action, idx) => (
                  <div key={action.id} className="p-3 border rounded-lg space-y-2 bg-muted/20">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Titre de l'action"
                          value={action.titre}
                          onChange={(e) => updateActionSuivi(action.id, "titre", e.target.value)}
                          disabled={isReadOnly}
                          className="h-8 text-sm"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="Responsable"
                            value={action.responsable}
                            onChange={(e) => updateActionSuivi(action.id, "responsable", e.target.value)}
                            disabled={isReadOnly}
                            className="h-8 text-xs"
                          />
                          <Input
                            type="date"
                            value={action.echeance}
                            onChange={(e) => updateActionSuivi(action.id, "echeance", e.target.value)}
                            disabled={isReadOnly}
                            className="h-8 text-xs"
                          />
                          <Select
                            value={action.priorite}
                            onValueChange={(v) => updateActionSuivi(action.id, "priorite", v)}
                            disabled={isReadOnly}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background border shadow-lg z-50">
                              <SelectItem value="basse">Basse</SelectItem>
                              <SelectItem value="normale">Normale</SelectItem>
                              <SelectItem value="haute">Haute</SelectItem>
                              <SelectItem value="urgente">Urgente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={action.statut}
                            onValueChange={(v) => updateActionSuivi(action.id, "statut", v)}
                            disabled={isReadOnly}
                          >
                            <SelectTrigger className="h-8 text-xs w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background border shadow-lg z-50">
                              <SelectItem value="a_faire">À faire</SelectItem>
                              <SelectItem value="en_cours">En cours</SelectItem>
                              <SelectItem value="termine">Terminé</SelectItem>
                              <SelectItem value="annule">Annulé</SelectItem>
                            </SelectContent>
                          </Select>
                          <Textarea
                            placeholder="Description de l'action..."
                            value={action.description || ""}
                            onChange={(e) => updateActionSuivi(action.id, "description", e.target.value)}
                            disabled={isReadOnly}
                            className="resize-none text-xs flex-1"
                            rows={1}
                          />
                        </div>
                      </div>
                      {!isReadOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeActionSuivi(action.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {!isReadOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => addActionSuivi()}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter une action de suivi
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Historique validation */}
            {(fiche.submittedAt || fiche.validatedAt || fiche.approvedAt) && (
              <div className="p-3 bg-muted/30 rounded-lg text-xs space-y-1">
                <p className="font-medium mb-2">Historique</p>
                {fiche.submittedAt && (
                  <p><span className="text-muted-foreground">Soumis le:</span> {format(new Date(fiche.submittedAt), "dd/MM/yyyy HH:mm")} {fiche.submittedBy && `par ${fiche.submittedBy}`}</p>
                )}
                {fiche.validatedAt && (
                  <p><span className="text-muted-foreground">Validé le:</span> {format(new Date(fiche.validatedAt), "dd/MM/yyyy HH:mm")} {fiche.validatedBy && `par ${fiche.validatedBy}`}</p>
                )}
                {fiche.approvedAt && (
                  <p><span className="text-muted-foreground">Approuvé le:</span> {format(new Date(fiche.approvedAt), "dd/MM/yyyy HH:mm")} {fiche.approvedBy && `par ${fiche.approvedBy}`}</p>
                )}
              </div>
            )}

            {/* Documents & Commentaires */}
            <div className="border-t pt-3 mt-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Documents & Commentaires</span>
                </div>
                <div className="flex items-center gap-2">
                  <AttachmentManager
                    attachments={attachments}
                    onAttachmentsChange={!isReadOnly ? setAttachments : undefined}
                    readOnly={isReadOnly}
                    compact
                  />
                  <CommentManager
                    comments={comments}
                    onCommentsChange={setComments}
                    readOnly={false}
                    currentUser="Utilisateur"
                    compact
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => exportFicheSuiviToPDF(fiche, workflow)}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {isReadOnly ? "Fermer" : "Annuler"}
                </Button>
              
              {fiche.status === "brouillon" && (
                <>
                  <Button type="button" variant="secondary" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                  <Button type="button" onClick={handleSubmit}>
                    <Send className="w-4 h-4 mr-2" />
                    Soumettre
                  </Button>
                </>
              )}
              
              {fiche.status === "soumis" && canValidate && (
                <Button type="button" onClick={handleValidate} className="bg-amber-600 hover:bg-amber-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Valider
                </Button>
              )}
              
              {fiche.status === "valide" && canApprove && (
                <Button type="button" onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approuver
                </Button>
              )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default FicheSuiviForm;
