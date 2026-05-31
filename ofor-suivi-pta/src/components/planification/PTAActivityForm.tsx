import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockProjects } from "@/data/mockProjects";
import { mockServices, getServiceById } from "@/data/entitesExecution";
import { getOperationsByService, getOperationById } from "@/data/operations";
import { useEffect, useMemo, useState } from "react";
import { Link2, Link2Off, Plus, Trash2, FileText, Target, Paperclip, MessageSquare, Building2, Briefcase, Settings2 } from "lucide-react";
import AttachmentManager from "@/components/ui/AttachmentManager";
import CommentManager from "@/components/ui/CommentManager";
import { Attachment } from "@/types/attachment";
import { Comment } from "@/types/comment";
import { cn } from "@/lib/utils";

const NATURES = [
  "Infrastructure",
  "Maintenance",
  "Équipement",
  "Formation",
  "Étude",
  "Sensibilisation",
  "Suivi-évaluation",
  "Travaux",
];

const UNITS_BY_NATURE: Record<string, string[]> = {
  "Infrastructure": ["forages", "ouvrages", "km", "réseaux", "branchements", "bornes-fontaines"],
  "Maintenance": ["forages", "équipements", "interventions", "ouvrages réhabilités"],
  "Équipement": ["pompes", "groupes électrogènes", "véhicules", "équipements", "kits"],
  "Formation": ["personnes formées", "sessions", "ASUFOR", "opérateurs", "modules"],
  "Étude": ["études", "rapports", "diagnostics", "sites identifiés", "dossiers"],
  "Sensibilisation": ["séances", "villages", "bénéficiaires", "campagnes"],
  "Suivi-évaluation": ["missions", "rapports", "évaluations", "audits"],
  "Travaux": ["forages", "km", "ouvrages", "bâtiments", "réservoirs"],
};

const objectiveSchema = z.object({
  id: z.string().optional(),
  unit: z.string().min(1, "L'unité est requise"),
  targetValue: z.coerce.number().min(0, "La valeur doit être positive"),
  targetT1: z.coerce.number().min(0).optional().default(0),
  targetT2: z.coerce.number().min(0).optional().default(0),
  targetT3: z.coerce.number().min(0).optional().default(0),
  targetT4: z.coerce.number().min(0).optional().default(0),
});

const formSchema = z.object({
  serviceResponsableId: z.string().min(1, "Le service responsable est requis"),
  rattachementType: z.enum(["projet", "operation"]),
  name: z.string().trim().min(1, "Le nom est requis").max(200, "Maximum 200 caractères"),
  projectId: z.string().optional().or(z.literal("")),
  activityId: z.string().optional(),
  operationId: z.string().optional().or(z.literal("")),
  nature: z.string().min(1, "La nature est requise"),
  responsable: z.string().min(1, "Le responsable est requis"),
  objectives: z.array(objectiveSchema).min(1, "Au moins un objectif est requis"),
  budgetT1: z.coerce.number().min(0, "Le budget doit être positif"),
  budgetT2: z.coerce.number().min(0, "Le budget doit être positif"),
  budgetT3: z.coerce.number().min(0, "Le budget doit être positif"),
  budgetT4: z.coerce.number().min(0, "Le budget doit être positif"),
  trimestres: z.array(z.string()).min(1, "Sélectionnez au moins un trimestre"),
  description: z.string().max(1000, "Maximum 1000 caractères").optional(),
}).refine(
  (data) => data.rattachementType === "operation" ? !!data.operationId : !!data.projectId,
  { message: "Sélectionnez un projet ou une opération selon le type de rattachement", path: ["rattachementType"] }
);

type FormValues = z.infer<typeof formSchema>;

export interface PTAObjective {
  id?: string;
  unit: string;
  targetValue: number;
  targetT1?: number;
  targetT2?: number;
  targetT3?: number;
  targetT4?: number;
}

interface PTAActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormValues & { project: string }) => void;
  initialData?: Partial<FormValues & { project: string; objectives?: PTAObjective[] }>;
  year: string;
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('fr-FR').format(value);
};

const PTAActivityForm = ({ open, onOpenChange, onSubmit, initialData, year }: PTAActivityFormProps) => {
  const [activeTab, setActiveTab] = useState("general");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const getInitialProjectId = () => {
    if (initialData?.projectId) return initialData.projectId;
    if (initialData?.project) {
      const found = mockProjects.find(p => p.name === initialData.project);
      return found?.id || "";
    }
    return "";
  };

  const getInitialObjectives = (): PTAObjective[] => {
    if (initialData?.objectives && initialData.objectives.length > 0) {
      return initialData.objectives;
    }
    // Fallback: mapper les deliverables (modèle PTAActivity) vers objectives
    const deliverables = (initialData as any)?.deliverables;
    if (Array.isArray(deliverables) && deliverables.length > 0) {
      return deliverables.map((d: any, idx: number) => ({
        id: d.id || `obj-${idx}`,
        unit: d.unit || "",
        targetValue: Number(d.targetValue) || 0,
        targetT1: Number(d.targetT1) || 0,
        targetT2: Number(d.targetT2) || 0,
        targetT3: Number(d.targetT3) || 0,
        targetT4: Number(d.targetT4) || 0,
      }));
    }
    return [];
  };

  const initialRattachement: "projet" | "operation" =
    (initialData as any)?.operationId ? "operation" : "projet";

  const isEditMode = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceResponsableId: (initialData as any)?.serviceResponsableId || "",
      rattachementType: initialRattachement,
      name: initialData?.name || "",
      projectId: getInitialProjectId(),
      activityId: initialData?.activityId || "",
      operationId: (initialData as any)?.operationId || "",
      nature: initialData?.nature || "",
      responsable: initialData?.responsable || "",
      objectives: getInitialObjectives(),
      budgetT1: initialData?.budgetT1 || 0,
      budgetT2: initialData?.budgetT2 || 0,
      budgetT3: initialData?.budgetT3 || 0,
      budgetT4: initialData?.budgetT4 || 0,
      trimestres: initialData?.trimestres || [],
      description: initialData?.description || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "objectives",
  });

  // Recharger les valeurs du formulaire à chaque ouverture / changement d'activité éditée
  useEffect(() => {
    if (!open) return;
    form.reset({
      serviceResponsableId: (initialData as any)?.serviceResponsableId || "",
      rattachementType: (initialData as any)?.operationId ? "operation" : "projet",
      name: initialData?.name || "",
      projectId: getInitialProjectId(),
      activityId: initialData?.activityId || "",
      operationId: (initialData as any)?.operationId || "",
      nature: initialData?.nature || "",
      responsable: initialData?.responsable || "",
      objectives: getInitialObjectives(),
      budgetT1: initialData?.budgetT1 || 0,
      budgetT2: initialData?.budgetT2 || 0,
      budgetT3: initialData?.budgetT3 || 0,
      budgetT4: initialData?.budgetT4 || 0,
      trimestres: initialData?.trimestres || [],
      description: initialData?.description || "",
    });
    setAttachments((initialData as any)?.attachments || []);
    setActiveTab("general");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData]);

  const trimestres = form.watch("trimestres");
  const budgetT1 = form.watch("budgetT1") || 0;
  const budgetT2 = form.watch("budgetT2") || 0;
  const budgetT3 = form.watch("budgetT3") || 0;
  const budgetT4 = form.watch("budgetT4") || 0;
  const budgetTotal = budgetT1 + budgetT2 + budgetT3 + budgetT4;
  
  const selectedServiceId = form.watch("serviceResponsableId");
  const rattachementType = form.watch("rattachementType");
  const selectedProjectId = form.watch("projectId");
  const selectedActivityId = form.watch("activityId");
  const selectedOperationId = form.watch("operationId");
  const selectedNature = form.watch("nature");

  // Services actifs du référentiel
  const activeServices = useMemo(() => mockServices.filter(s => s.actif), []);

  // Projets filtrés selon le service responsable choisi
  const projects = useMemo(() => {
    if (!selectedServiceId) return [] as typeof mockProjects;
    return mockProjects.filter(p => (p as any).serviceResponsableId === selectedServiceId);
  }, [selectedServiceId]);

  // Opérations du service responsable
  const serviceOperations = useMemo(() => {
    if (!selectedServiceId) return [];
    return getOperationsByService(selectedServiceId);
  }, [selectedServiceId]);

  const projectActivities = useMemo(() => {
    const project = projects.find(p => p.id === selectedProjectId);
    return project?.activities || [];
  }, [selectedProjectId, projects]);

  const availableUnits = useMemo(() => {
    if (!selectedNature) return [];
    return UNITS_BY_NATURE[selectedNature] || [];
  }, [selectedNature]);

  // Pré-remplir depuis l'activité projet sélectionnée
  useEffect(() => {
    if (selectedActivityId && selectedActivityId !== "" && selectedActivityId !== "__none__") {
      const activity = projectActivities.find(a => a.id === selectedActivityId);
      if (activity) {
        form.setValue("name", activity.name);
        form.setValue("description", activity.description || "");
        form.setValue("responsable", activity.responsible || "");
        
        const nature = activity.nature || 
          (activity.name.toLowerCase().includes('étude') ? 'Étude' :
           activity.name.toLowerCase().includes('formation') ? 'Formation' :
           activity.name.toLowerCase().includes('travaux') ? 'Travaux' :
           activity.name.toLowerCase().includes('installation') ? 'Équipement' : 'Travaux');
        form.setValue("nature", nature);

        // Livrables depuis l'activité projet
        if (activity.deliverables && activity.deliverables.length > 0) {
          const deliverables: PTAObjective[] = activity.deliverables.map((del, idx) => ({
            id: `del-${activity.id}-${idx}`,
            unit: del.uniteMesure?.name || del.unit || "",
            targetValue: del.targetValue,
          }));
          form.setValue("objectives", deliverables);
        }

        // Répartition budgétaire par trimestre
        const startDate = new Date(activity.startDate);
        const endDate = new Date(activity.endDate);
        const budget = activity.budget;
        
        const getQuarter = (date: Date) => Math.ceil((date.getMonth() + 1) / 3);
        const startQ = getQuarter(startDate);
        const endQ = getQuarter(endDate);
        
        const quarters: string[] = [];
        for (let q = startQ; q <= endQ; q++) {
          quarters.push(`T${q}`);
        }
        form.setValue("trimestres", quarters);
        
        const budgetPerQuarter = budget / quarters.length;
        form.setValue("budgetT1", quarters.includes("T1") ? budgetPerQuarter : 0);
        form.setValue("budgetT2", quarters.includes("T2") ? budgetPerQuarter : 0);
        form.setValue("budgetT3", quarters.includes("T3") ? budgetPerQuarter : 0);
        form.setValue("budgetT4", quarters.includes("T4") ? budgetPerQuarter : 0);
      }
    }
  }, [selectedActivityId, projectActivities, form]);

  useEffect(() => {
    if (!initialData) {
      form.setValue("activityId", "");
    }
  }, [selectedProjectId, form, initialData]);

  // Quand le service responsable change, réinitialiser le projet/activité et auto-remplir le nom du service
  useEffect(() => {
    if (!selectedServiceId) return;
    const service = getServiceById(selectedServiceId);
    if (service) {
      const currentResp = form.getValues("responsable");
      if (!currentResp) form.setValue("responsable", service.nom);
    }
    if (!initialData) {
      form.setValue("projectId", "");
      form.setValue("activityId", "");
      form.setValue("operationId", "");
    }
  }, [selectedServiceId, form, initialData]);

  // Mutuelle exclusion projet/opération : reset le champ opposé quand on change de type
  useEffect(() => {
    if (rattachementType === "projet") {
      form.setValue("operationId", "");
    } else {
      form.setValue("projectId", "");
      form.setValue("activityId", "");
    }
  }, [rattachementType, form]);

  // Héritage de la nature depuis l'opération sélectionnée
  useEffect(() => {
    if (rattachementType === "operation" && selectedOperationId) {
      const op = getOperationById(selectedOperationId);
      if (op?.nature) {
        const currentNature = form.getValues("nature");
        // N'écrase pas une nature déjà saisie manuellement, sauf en création
        if (!currentNature || !initialData) {
          form.setValue("nature", op.nature);
        }
      }
    }
  }, [selectedOperationId, rattachementType, form, initialData]);

  // Héritage : la structure responsable d'une activité PTA rattachée à un projet
  // est toujours celle du projet (la liaison est portée par le projet).
  useEffect(() => {
    if (rattachementType !== "projet" || !selectedProjectId) return;
    const project = mockProjects.find(p => p.id === selectedProjectId);
    const projectSrv = (project as any)?.serviceResponsableId;
    if (projectSrv && projectSrv !== form.getValues("serviceResponsableId")) {
      form.setValue("serviceResponsableId", projectSrv);
    }
  }, [selectedProjectId, rattachementType, form]);

  const handleSubmit = (data: FormValues) => {
    const project = projects.find(p => p.id === data.projectId);
    const operation = data.operationId ? getOperationById(data.operationId) : undefined;
    onSubmit({
      ...data,
      project: project?.name || (operation ? operation.libelle : ""),
      operationName: operation?.libelle,
    } as any);
    form.reset();
    onOpenChange(false);
  };

  const handleTrimestreChange = (trimestre: string, checked: boolean) => {
    const current = form.getValues("trimestres");
    if (checked) {
      form.setValue("trimestres", [...current, trimestre]);
    } else {
      form.setValue("trimestres", current.filter(t => t !== trimestre));
    }
  };

  const addObjective = (unit: string) => {
    // Vérifier si l'unité n'est pas déjà utilisée
    const existingUnits = form.getValues("objectives").map(o => o.unit);
    if (existingUnits.includes(unit)) {
      return;
    }
    append({ id: `obj-${Date.now()}`, unit, targetValue: 0, targetT1: 0, targetT2: 0, targetT3: 0, targetT4: 0 });
  };

  const isLinkedToActivity = selectedActivityId && selectedActivityId !== "" && selectedActivityId !== "__none__";

  // Unités disponibles (non encore utilisées)
  const unusedUnits = useMemo(() => {
    const usedUnits = fields.map(f => f.unit);
    return availableUnits.filter(u => !usedUnits.includes(u));
  }, [availableUnits, fields]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Modifier l'activité PTA" : "Nouvelle activité PTA"} - {year}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Données générales
                </TabsTrigger>
                <TabsTrigger value="objectives" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Objectifs ({fields.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6 mt-4">
                {/* Service responsable - point d'entrée */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Service responsable
                  </h3>
                  {isEditMode ? (
                    (() => {
                      const srv = selectedServiceId ? getServiceById(selectedServiceId) : undefined;
                      return (
                        <div className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-muted/30">
                          <div className="text-sm">
                            {srv ? (
                              <>
                                <span className="font-medium">{srv.code}</span>
                                <span className="text-muted-foreground"> — {srv.nom}</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground italic">Service non défini</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">Non modifiable</span>
                        </div>
                      );
                    })()
                  ) : (
                    <FormField
                      control={form.control}
                      name="serviceResponsableId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service responsable *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner d'abord le service responsable" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border shadow-lg z-50 max-h-72">
                              {activeServices.map((srv) => (
                                <SelectItem key={srv.id} value={srv.id}>
                                  <span className="font-medium">{srv.code}</span>
                                  <span className="text-muted-foreground"> — {srv.nom}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">
                            Le service détermine les projets disponibles pour la liaison.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {!selectedServiceId ? (
                  <div className="text-center py-8 border rounded-lg bg-muted/30">
                    <Building2 className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Sélectionnez un service responsable pour continuer
                    </p>
                  </div>
                ) : (
                <>
                {/* Rattachement : Projet OU Opération (mutuellement exclusif) */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-primary" />
                    Rattachement de l'activité
                  </h3>

                  <FormField
                    control={form.control}
                    name="rattachementType"
                    render={({ field }) => (
                      <FormItem>
                        <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                          <TabsList className="grid grid-cols-2 w-full">
                            <TabsTrigger value="projet" className="flex items-center gap-2" disabled={projects.length === 0}>
                              <Briefcase className="w-4 h-4" />
                              Projet {projects.length === 0 && "(aucun)"}
                            </TabsTrigger>
                            <TabsTrigger value="operation" className="flex items-center gap-2" disabled={serviceOperations.length === 0}>
                              <Settings2 className="w-4 h-4" />
                              Opération {serviceOperations.length === 0 && "(aucune)"}
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="projet" className="mt-3">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="projectId"
                                render={({ field: pField }) => (
                                  <FormItem>
                                    <FormLabel>Projet du service *</FormLabel>
                                    <Select onValueChange={pField.onChange} value={pField.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder={projects.length === 0 ? "Aucun projet" : "Sélectionner un projet"} />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="bg-background border shadow-lg z-50">
                                        {projects.map((projet) => (
                                          <SelectItem key={projet.id} value={projet.id}>{projet.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="activityId"
                                render={({ field: aField }) => (
                                  <FormItem>
                                    <FormLabel>Activité projet *</FormLabel>
                                    <Select
                                      onValueChange={aField.onChange}
                                      value={aField.value}
                                      disabled={!selectedProjectId || projectActivities.length === 0}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder={
                                            !selectedProjectId
                                              ? "Sélectionner d'abord un projet"
                                              : projectActivities.length === 0
                                                ? "Aucune activité"
                                                : "Lier à une activité"
                                          } />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="bg-background border shadow-lg z-50">
                                        {projectActivities.map((activity) => (
                                          <SelectItem key={activity.id} value={activity.id}>
                                            {activity.code} - {activity.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormDescription className="text-xs">
                                      Pré-remplit le formulaire à partir de l'activité projet.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </TabsContent>

                          <TabsContent value="operation" className="mt-3">
                            <FormField
                              control={form.control}
                              name="operationId"
                              render={({ field: oField }) => (
                                <FormItem>
                                  <FormLabel>Opération du service *</FormLabel>
                                  <Select onValueChange={oField.onChange} value={oField.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={serviceOperations.length === 0 ? "Aucune opération" : "Sélectionner une opération"} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-background border shadow-lg z-50 max-h-72">
                                      {serviceOperations.map((op) => (
                                        <SelectItem key={op.id} value={op.id}>
                                          <span className="font-medium">{op.code}</span>
                                          <span className="text-muted-foreground"> — {op.libelle}</span>
                                          {op.nature && (
                                            <span className="ml-2 text-[10px] text-muted-foreground">[{op.nature}]</span>
                                          )}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormDescription className="text-xs">
                                    Activité hors projet, rattachée à une opération institutionnelle du service.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TabsContent>
                        </Tabs>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Informations générales */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Informations générales
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de l'activité *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Construction nouveaux forages" {...field} />
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
                          <FormLabel>Nature *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une nature" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border shadow-lg z-50">
                              {NATURES.map((nature) => (
                                <SelectItem key={nature} value={nature}>
                                  {nature}
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
                      name="responsable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Responsable *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Personne responsable de l'exécution"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Pré-rempli avec le service ; vous pouvez préciser une personne.
                          </FormDescription>
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
                            placeholder="Description détaillée de l'activité..." 
                            className="resize-none"
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Planification temporelle */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Planification temporelle
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="trimestres"
                    render={() => (
                      <FormItem>
                        <FormLabel>Trimestres d'exécution *</FormLabel>
                        <div className="flex gap-6 mt-2">
                          {["T1", "T2", "T3", "T4"].map((t) => (
                            <div key={t} className="flex items-center space-x-2">
                              <Checkbox
                                id={t}
                                checked={trimestres.includes(t)}
                                onCheckedChange={(checked) => handleTrimestreChange(t, checked as boolean)}
                              />
                              <label htmlFor={t} className="text-sm font-medium cursor-pointer">
                                {t} {year}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Budget par trimestre */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Répartition budgétaire
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <FormField
                      control={form.control}
                      name="budgetT1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            T1
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="0" 
                              disabled={!trimestres.includes("T1")}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="budgetT2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            T2
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="0" 
                              disabled={!trimestres.includes("T2")}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="budgetT3"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            T3
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="0" 
                              disabled={!trimestres.includes("T3")}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="budgetT4"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            T4
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="0" 
                              disabled={!trimestres.includes("T4")}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">Budget total</span>
                      <span className="text-lg font-bold text-primary">
                        {formatNumber(budgetTotal)} FCFA
                      </span>
                    </div>
                  </div>
                </div>
                </>
                )}
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
                        Unités disponibles pour "{selectedNature}"
                      </p>
                    </div>

                    {/* Unités disponibles à ajouter */}
                    {unusedUnits.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/20">
                        <span className="text-xs text-muted-foreground w-full mb-1">Cliquez pour ajouter :</span>
                        {unusedUnits.map((unit) => (
                          <Button
                            key={unit}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => addObjective(unit)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            {unit}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Liste des objectifs */}
                    {fields.length === 0 ? (
                      <div className="text-center py-6 border rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground">Aucun objectif défini</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cliquez sur une unité ci-dessus pour l'ajouter
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-12 gap-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                          <div className="col-span-3">Unité</div>
                          <div className="col-span-2 text-center">Cible totale</div>
                          <div className="col-span-1 text-center">T1</div>
                          <div className="col-span-1 text-center">T2</div>
                          <div className="col-span-1 text-center">T3</div>
                          <div className="col-span-1 text-center">T4</div>
                          <div className="col-span-2 text-center">Σ trim.</div>
                          <div className="col-span-1"></div>
                        </div>
                        {fields.map((field, index) => {
                          const t1 = Number(form.watch(`objectives.${index}.targetT1`)) || 0;
                          const t2 = Number(form.watch(`objectives.${index}.targetT2`)) || 0;
                          const t3 = Number(form.watch(`objectives.${index}.targetT3`)) || 0;
                          const t4 = Number(form.watch(`objectives.${index}.targetT4`)) || 0;
                          const target = Number(form.watch(`objectives.${index}.targetValue`)) || 0;
                          const sumTrim = t1 + t2 + t3 + t4;
                          const mismatch = target > 0 && sumTrim !== target;
                          const distributeEvenly = () => {
                            const active = trimestres.length > 0 ? trimestres : ["T1", "T2", "T3", "T4"];
                            const per = Math.floor(target / active.length);
                            const rest = target - per * active.length;
                            (["T1","T2","T3","T4"] as const).forEach((q, i) => {
                              const isActive = active.includes(q);
                              const v = isActive ? per + (i === 0 ? rest : 0) : 0;
                              form.setValue(`objectives.${index}.target${q}` as any, v);
                            });
                          };
                          return (
                            <div key={field.id} className="grid grid-cols-12 gap-2 items-center p-2 border rounded-lg bg-background">
                              <div className="col-span-3 font-medium text-sm truncate">{field.unit}</div>
                              <FormField control={form.control} name={`objectives.${index}.targetValue`}
                                render={({ field }) => (
                                  <FormItem className="col-span-2">
                                    <FormControl>
                                      <Input type="number" min="0" placeholder="Cible" className="text-center h-8" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}/>
                              {(["T1","T2","T3","T4"] as const).map((q) => (
                                <FormField key={q} control={form.control} name={`objectives.${index}.target${q}` as any}
                                  render={({ field }) => (
                                    <FormItem className="col-span-1">
                                      <FormControl>
                                        <Input type="number" min="0" placeholder="0"
                                          className="text-center h-8 text-xs px-1"
                                          disabled={!trimestres.includes(q)}
                                          {...field} />
                                      </FormControl>
                                    </FormItem>
                                  )}/>
                              ))}
                              <div className={cn("col-span-2 text-center text-xs font-semibold",
                                mismatch ? "text-destructive" : "text-muted-foreground")}>
                                <div className="flex items-center justify-center gap-1">
                                  <span>{sumTrim}</span>
                                  <Button type="button" variant="ghost" size="sm" className="h-6 px-1 text-[10px]"
                                    onClick={distributeEvenly} title="Répartir équitablement">
                                    ÷
                                  </Button>
                                </div>
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <Button type="button" variant="ghost" size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  onClick={() => remove(index)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>

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
                    onAttachmentsChange={setAttachments}
                    compact
                  />
                  <CommentManager
                    comments={[]}
                    onCommentsChange={() => {}}
                    currentUser="Utilisateur"
                    compact
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {initialData ? "Enregistrer" : "Créer l'activité"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PTAActivityForm;