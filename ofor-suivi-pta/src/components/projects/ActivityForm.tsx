import { useForm, useFieldArray } from "react-hook-form";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileText, Target, Plus, Trash2, MapPin, Paperclip } from "lucide-react";
import AttachmentManager from "@/components/ui/AttachmentManager";
import { Attachment } from "@/types/attachment";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Activity, ENTITES_EXECUTION, ActivityNature, UNITES_MESURE_BY_NATURE, UniteMesure, getDeliverableUnit } from "@/types/project";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";
import ZoneTreeSelector from "@/components/zones/ZoneTreeSelector";
import { ZoneIntervention } from "@/data/geoData";
import { getServiceById } from "@/data/entitesExecution";
import { Building2 } from "lucide-react";

const ACTIVITY_NATURES: { value: ActivityNature; label: string }[] = [
  { value: "etude", label: "Étude" },
  { value: "travaux", label: "Travaux" },
  { value: "formation", label: "Formation" },
  { value: "equipement", label: "Équipement" },
  { value: "sensibilisation", label: "Sensibilisation" },
  { value: "suivi", label: "Suivi & Évaluation" },
  { value: "autre", label: "Autre" },
];

const objectiveSchema = z.object({
  id: z.string().optional(),
  uniteMesureId: z.string().min(1, "L'unité est requise"),
  unit: z.string().min(1, "L'unité est requise"),
  targetValue: z.coerce.number().min(0, "La valeur doit être positive"),
  currentValue: z.coerce.number().min(0).optional(),
});

const activitySchema = z.object({
  code: z.string().min(1, "Le code est requis"),
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  startDate: z.date({ required_error: "La date de début est requise" }),
  endDate: z.date({ required_error: "La date de fin est requise" }),
  budget: z.number().min(0, "Le budget doit être positif"),
  responsible: z.string().min(2, "Le responsable est requis"),
  status: z.enum(["planifie", "en_cours", "termine", "annule"]),
  entiteExecution: z.string().optional(),
  nature: z.enum(["etude", "travaux", "formation", "equipement", "sensibilisation", "suivi", "autre"]).optional(),
  objectives: z.array(objectiveSchema).optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: "La date de fin doit être postérieure à la date de début",
  path: ["endDate"],
});

type ActivityFormValues = z.infer<typeof activitySchema>;

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ActivityFormValues) => void;
  initialData?: Partial<Activity>;
  isEditing?: boolean;
  projectServiceResponsableId?: string;
}

const ActivityForm = ({ open, onOpenChange, onSubmit, initialData, isEditing = false, projectServiceResponsableId }: ActivityFormProps) => {
  const [activeTab, setActiveTab] = useState("general");
  const [zonesIntervention, setZonesIntervention] = useState<ZoneIntervention[]>(
    initialData?.zonesIntervention || []
  );
  const [attachments, setAttachments] = useState<Attachment[]>(initialData?.attachments || []);

  const buildDefaults = (data?: Partial<Activity>): ActivityFormValues => ({
    code: data?.code || "",
    name: data?.name || "",
    description: data?.description || "",
    startDate: data?.startDate ? new Date(data.startDate) : (undefined as any),
    endDate: data?.endDate ? new Date(data.endDate) : (undefined as any),
    budget: data?.budget ?? 0,
    responsible: data?.responsible || "",
    status: data?.status || "planifie",
    entiteExecution: data?.entiteExecution || "",
    nature: data?.nature || (undefined as any),
    objectives: data?.deliverables?.map(d => ({
      id: d.id,
      uniteMesureId: d.uniteMesureId || d.uniteMesure?.id || "",
      unit: d.uniteMesure?.name || d.unit || d.name || "",
      targetValue: d.targetValue,
      currentValue: d.currentValue,
    })) || [],
  });

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: buildDefaults(initialData),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "objectives",
  });

  // Recharger les valeurs quand on ouvre le formulaire ou que les données changent
  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(initialData));
      setZonesIntervention(initialData?.zonesIntervention || []);
      setAttachments(initialData?.attachments || []);
      setActiveTab("general");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData?.id]);

  const selectedNature = form.watch("nature");

  const availableUnits = useMemo<UniteMesure[]>(() => {
    if (!selectedNature) return [];
    return UNITES_MESURE_BY_NATURE[selectedNature] || [];
  }, [selectedNature]);

  // Unités non encore utilisées
  const unusedUnits = useMemo(() => {
    const usedIds = fields.map((f: any) => f.uniteMesureId);
    return availableUnits.filter(u => !usedIds.includes(u.id));
  }, [availableUnits, fields]);

  const handleSubmit = (data: ActivityFormValues) => {
    // Reconstruire les deliverables enrichis
    const deliverables = (data.objectives || []).map(o => {
      const unite = availableUnits.find(u => u.id === o.uniteMesureId)
        || Object.values(UNITES_MESURE_BY_NATURE).flat().find(u => u.id === o.uniteMesureId);
      return {
        id: o.id || `obj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        uniteMesureId: o.uniteMesureId,
        uniteMesure: unite,
        code: unite?.code,
        name: unite?.name || o.unit,
        unit: unite?.name || o.unit,
        targetValue: Number(o.targetValue) || 0,
        currentValue: Number(o.currentValue) || 0,
      };
    });
    onSubmit({
      ...data,
      zonesIntervention,
      attachments,
      deliverables,
      serviceResponsableId: projectServiceResponsableId,
    } as any);
    toast.success(isEditing ? "Activité modifiée" : "Activité ajoutée");
    onOpenChange(false);
  };

  const projectService = projectServiceResponsableId ? getServiceById(projectServiceResponsableId) : undefined;

  const addObjective = (unite: UniteMesure) => {
    const existing = form.getValues("objectives")?.map(o => o.uniteMesureId) || [];
    if (existing.includes(unite.id)) return;
    append({
      id: `obj-${Date.now()}`,
      uniteMesureId: unite.id,
      unit: unite.name,
      targetValue: 0,
      currentValue: 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                {isEditing ? "Modifier l'activité" : "Ajouter une activité"}
              </DialogTitle>
              <DialogDescription>
                Définissez les paramètres de l'activité
              </DialogDescription>
            </div>
            <AttachmentManager
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general" className="flex items-center gap-1 text-xs">
                  <FileText className="w-3 h-3" />
                  Général
                </TabsTrigger>
                <TabsTrigger value="zones" className="flex items-center gap-1 text-xs">
                  <MapPin className="w-3 h-3" />
                  Zones ({zonesIntervention.length})
                </TabsTrigger>
                <TabsTrigger value="objectives" className="flex items-center gap-1 text-xs">
                  <Target className="w-3 h-3" />
                  Livrables ({fields.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="ACT-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border shadow-lg z-50">
                            <SelectItem value="planifie">Planifié</SelectItem>
                            <SelectItem value="en_cours">En cours</SelectItem>
                            <SelectItem value="termine">Terminé</SelectItem>
                            <SelectItem value="annule">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Libellé *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de l'activité" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nature de l'activité</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border shadow-lg z-50">
                            {ACTIVITY_NATURES.map((nature) => (
                              <SelectItem key={nature.value} value={nature.value}>
                                {nature.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="entiteExecution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entité d'exécution</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border shadow-lg z-50">
                            {ENTITES_EXECUTION.map((entite) => (
                              <SelectItem key={entite} value={entite}>
                                {entite}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description de l'activité..."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date de début *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy", { locale: fr })
                                ) : (
                                  <span>Sélectionner</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date de fin *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy", { locale: fr })
                                ) : (
                                  <span>Sélectionner</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget (FCFA) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responsible"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsable *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom du responsable" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {projectService && (
                  <div className="flex items-start gap-2 p-3 rounded-lg border bg-muted/40">
                    <Building2 className="w-4 h-4 mt-0.5 text-primary" />
                    <div className="text-xs">
                      <p className="font-medium text-foreground">Service responsable (hérité du projet)</p>
                      <p className="text-muted-foreground">
                        {projectService.code} — {projectService.nom}
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="zones" className="space-y-4 mt-4">
                <ZoneTreeSelector
                  value={zonesIntervention}
                  onChange={setZonesIntervention}
                  label="Zones d'intervention de l'activité"
                />
              </TabsContent>

              <TabsContent value="objectives" className="space-y-4 mt-4">
                {!selectedNature ? (
                  <div className="text-center py-8 border rounded-lg bg-muted/30">
                    <Target className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Sélectionnez d'abord une nature d'activité dans l'onglet "Données générales"
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Unités disponibles pour "{ACTIVITY_NATURES.find(n => n.value === selectedNature)?.label}"
                      </p>
                    </div>

                    {/* Unités disponibles à ajouter */}
                    {unusedUnits.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/20">
                        <span className="text-xs text-muted-foreground w-full mb-1">Cliquez pour ajouter un livrable :</span>
                        {unusedUnits.map((unite) => (
                          <Button
                            key={unite.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => addObjective(unite)}
                            title={unite.description}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            <span className="font-mono mr-1.5 text-[10px] bg-muted px-1 rounded">{unite.code}</span>
                            {unite.name}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Liste des objectifs */}
                    {fields.length === 0 ? (
                      <div className="text-center py-6 border rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground">Aucun livrable défini</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cliquez sur une unité ci-dessus pour l'ajouter
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {fields.map((field: any, index) => {
                          const unite = availableUnits.find(u => u.id === field.uniteMesureId)
                            || Object.values(UNITES_MESURE_BY_NATURE).flat().find(u => u.id === field.uniteMesureId);
                          return (
                          <div key={field.id} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {unite?.code && (
                                  <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                                    {unite.code}
                                  </span>
                                )}
                                <span className="font-medium text-sm truncate">
                                  {unite?.name || field.unit}
                                </span>
                              </div>
                              {unite?.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{unite.description}</p>
                              )}
                            </div>
                            <FormField
                              control={form.control}
                              name={`objectives.${index}.targetValue`}
                              render={({ field }) => (
                                <FormItem className="flex-shrink-0 w-24">
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="0" 
                                      placeholder="Cible" 
                                      className="text-center text-sm"
                                      {...field} 
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`objectives.${index}.currentValue`}
                              render={({ field }) => (
                                <FormItem className="flex-shrink-0 w-24">
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="0" 
                                      placeholder="Réalisé" 
                                      className="text-center text-sm"
                                      {...field} 
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {isEditing ? "Enregistrer" : "Ajouter"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityForm;