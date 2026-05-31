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
import { CURRENCIES, Currency, ProjectFinancement } from "@/types/project";
import FinancementsEditor from "@/components/projects/FinancementsEditor";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, FileText, MapPin, Users, Target, Check, ChevronLeft, ChevronRight, Save, Building2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ZoneTreeSelector from "@/components/zones/ZoneTreeSelector";
import PersonnelSelector from "@/components/projects/PersonnelSelector";
import { ZoneIntervention } from "@/data/geoData";
import { AffectationPersonnel } from "@/data/personnel";
import { useState, useMemo } from "react";
import { getBailleursActifs } from "@/data/bailleurs";
import { mockServices, getEntiteByCode } from "@/data/entitesExecution";
import { SENEGAL_GEO } from "@/data/geoData";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Schema pour étape 1 - Informations générales
const step1Schema = z.object({
  code: z.string().min(1, "Le code est requis").max(20, "Max 20 caractères"),
  name: z.string().min(3, "Min 3 caractères").max(200, "Max 200 caractères"),
  description: z.string().max(1000, "Max 1000 caractères").optional(),
  region: z.string().min(1, "La région est requise"),
  bailleur: z.string().min(1, "Le bailleur est requis"),
  serviceResponsableId: z.string().min(1, "Le service responsable est requis"),
});

// Schema pour étape 2 - Budget et calendrier
const step2Schema = z.object({
  currency: z.string().min(1, "La devise est requise"),
  budget: z.number().min(0, "Le budget doit être positif"),
  budgetFCFA: z.number().min(0, "Le budget FCFA doit être positif"),
  startDate: z.date({ required_error: "La date de début est requise" }),
  endDate: z.date({ required_error: "La date de fin est requise" }),
}).refine((data) => data.endDate > data.startDate, {
  message: "La date de fin doit être postérieure à la date de début",
  path: ["endDate"],
});

// Schema pour étape 3 - Équipe (optionnel pour brouillon)
const step3Schema = z.object({
  responsible: z.string().max(100, "Max 100 caractères").optional(),
  responsibleEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  responsiblePhone: z.string().max(20, "Max 20 caractères").optional(),
});

// Schema pour étape 4 - Objectifs (optionnel)
const step4Schema = z.object({
  objectives: z.string().max(2000, "Max 2000 caractères").optional(),
});

// Schema complet pour validation
const fullProjectSchema = z.object({
  code: z.string().min(1, "Le code est requis").max(20, "Max 20 caractères"),
  name: z.string().min(3, "Min 3 caractères").max(200, "Max 200 caractères"),
  description: z.string().max(1000).optional(),
  region: z.string().min(1, "La région est requise"),
  bailleur: z.string().min(1, "Le bailleur est requis"),
  serviceResponsableId: z.string().min(1, "Le service responsable OFOR est requis"),
  currency: z.string().min(1, "La devise est requise"),
  budget: z.number().min(0, "Budget positif requis"),
  budgetFCFA: z.number().min(0, "Budget FCFA positif requis"),
  startDate: z.date({ required_error: "Date de début requise" }),
  endDate: z.date({ required_error: "Date de fin requise" }),
  responsible: z.string().min(2, "Le responsable est requis").max(100),
  responsibleEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  responsiblePhone: z.string().max(20).optional(),
  objectives: z.string().max(2000).optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: "La date de fin doit être postérieure à la date de début",
  path: ["endDate"],
});

// Schema brouillon (moins strict)
const draftProjectSchema = z.object({
  code: z.string().min(1, "Le code est requis"),
  name: z.string().min(3, "Min 3 caractères"),
  description: z.string().optional(),
  region: z.string().optional(),
  bailleur: z.string().optional(),
  serviceResponsableId: z.string().optional(),
  currency: z.string().optional(),
  budget: z.number().optional(),
  budgetFCFA: z.number().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  responsible: z.string().optional(),
  responsibleEmail: z.string().optional(),
  responsiblePhone: z.string().optional(),
  objectives: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof fullProjectSchema>;

export type ProjectStatus = "brouillon" | "en_validation" | "valide" | "rejete";

interface ProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any, status: ProjectStatus) => void;
  initialData?: Partial<ProjectFormValues & { 
    zonesIntervention?: ZoneIntervention[];
    equipeProjet?: AffectationPersonnel[];
    projectStatus?: ProjectStatus;
  }>;
  isEditing?: boolean;
}

const STEPS = [
  { id: 1, name: "Général", icon: FileText, description: "Informations de base" },
  { id: 2, name: "Budget", icon: Target, description: "Budget et calendrier" },
  { id: 3, name: "Zones", icon: MapPin, description: "Zones d'intervention" },
  { id: 4, name: "Équipe", icon: Users, description: "Équipe projet" },
];

const ProjectWizard = ({ open, onOpenChange, onSubmit, initialData, isEditing = false }: ProjectWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [zonesIntervention, setZonesIntervention] = useState<ZoneIntervention[]>(
    initialData?.zonesIntervention || []
  );
  const [equipeProjet, setEquipeProjet] = useState<AffectationPersonnel[]>(
    initialData?.equipeProjet || []
  );
  const [financements, setFinancements] = useState<ProjectFinancement[]>(
    (initialData as any)?.financements || []
  );
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(draftProjectSchema as any), // Mode brouillon par défaut
    defaultValues: {
      code: initialData?.code || "",
      name: initialData?.name || "",
      description: initialData?.description || "",
      region: initialData?.region || "",
      bailleur: initialData?.bailleur || "",
      budget: initialData?.budget || 0,
      currency: (initialData as any)?.currency || "XOF",
      budgetFCFA: initialData?.budgetFCFA || initialData?.budget || 0,
      startDate: initialData?.startDate,
      endDate: initialData?.endDate,
      responsible: initialData?.responsible || "",
      responsibleEmail: initialData?.responsibleEmail || "",
      responsiblePhone: initialData?.responsiblePhone || "",
      objectives: initialData?.objectives || "",
      serviceResponsableId: (initialData as any)?.serviceResponsableId || "",
    },
  });

  const watchCurrency = form.watch("currency");
  const isFCFA = watchCurrency === "XOF";

  const handleBudgetChange = (value: number) => {
    form.setValue("budget", value);
    if (isFCFA) {
      form.setValue("budgetFCFA", value);
    }
  };

  const handleCurrencyChange = (value: string) => {
    form.setValue("currency", value);
    if (value === "XOF") {
      form.setValue("budgetFCFA", form.getValues("budget"));
    }
  };

  // Calcul du pourcentage de complétion
  const completionPercentage = useMemo(() => {
    const values = form.getValues();
    let filled = 0;
    let total = 10; // Champs obligatoires pour validation

    if (values.code) filled++;
    if (values.name) filled++;
    if (values.region) filled++;
    if (values.bailleur) filled++;
    if (values.budget && values.budget > 0) filled++;
    if (values.currency) filled++;
    if (values.startDate) filled++;
    if (values.endDate) filled++;
    if (values.responsible) filled++;
    if (zonesIntervention.length > 0) filled++;

    return Math.round((filled / total) * 100);
  }, [form.watch(), zonesIntervention]);

  // Validation de l'étape courante
  const validateCurrentStep = async (): Promise<boolean> => {
    let schema;
    switch (currentStep) {
      case 1:
        schema = step1Schema;
        break;
      case 2:
        schema = step2Schema;
        break;
      case 3:
        return true; // Zones - pas de validation form
      case 4:
        schema = step3Schema;
        break;
      default:
        return true;
    }

    const values = form.getValues();
    const result = schema.safeParse(values);
    
    if (!result.success) {
      result.error.issues.forEach(issue => {
        form.setError(issue.path[0] as any, { message: issue.message });
      });
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Sauvegarde en brouillon
  const handleSaveDraft = () => {
    const values = form.getValues();
    if (!values.code || !values.name) {
      toast.error("Le code et le nom sont requis pour sauvegarder");
      return;
    }
    
    onSubmit({ 
      ...values, 
      zonesIntervention,
      financements,
      equipeProjet,
      projectStatus: "brouillon" as ProjectStatus
    }, "brouillon");
    
    toast.success("Projet sauvegardé en brouillon");
    form.reset();
    setCurrentStep(1);
    onOpenChange(false);
  };

  // Validation complète pour soumission
  const validateForSubmission = (): string[] => {
    const values = form.getValues();
    const errors: string[] = [];

    const result = fullProjectSchema.safeParse(values);
    if (!result.success) {
      result.error.issues.forEach(issue => {
        errors.push(`${issue.path.join(".")}: ${issue.message}`);
      });
    }

    if (zonesIntervention.length === 0) {
      errors.push("Au moins une zone d'intervention est requise");
    }

    return errors;
  };

  // Soumettre pour validation
  const handleSubmitForValidation = () => {
    const errors = validateForSubmission();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationDialog(true);
      return;
    }

    const values = form.getValues();
    onSubmit({ 
      ...values, 
      zonesIntervention,
      financements,
      equipeProjet,
      projectStatus: "en_validation" as ProjectStatus
    }, "en_validation");
    
    toast.success("Projet soumis pour validation");
    form.reset();
    setCurrentStep(1);
    onOpenChange(false);
  };

  // Reset à la fermeture
  const handleClose = (open: boolean) => {
    if (!open) {
      setCurrentStep(1);
    }
    onOpenChange(open);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-heading">
                  {isEditing ? "Modifier le projet" : "Nouveau projet"}
                </DialogTitle>
                <DialogDescription>
                  Étape {currentStep} sur {STEPS.length}
                </DialogDescription>
              </div>
              <Badge variant={completionPercentage === 100 ? "default" : "secondary"} className="text-xs">
                {completionPercentage}% complété
              </Badge>
            </div>
          </DialogHeader>

          {/* Indicateur d'étapes */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-3">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(step.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left",
                        isActive && "bg-primary text-primary-foreground",
                        isCompleted && "bg-primary/10 text-primary",
                        !isActive && !isCompleted && "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                        isActive && "bg-primary-foreground text-primary",
                        isCompleted && "bg-primary text-primary-foreground",
                        !isActive && !isCompleted && "bg-muted"
                      )}>
                        {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                      </div>
                      <div className="hidden md:block">
                        <p className="text-sm font-medium">{step.name}</p>
                        <p className="text-xs opacity-75">{step.description}</p>
                      </div>
                    </button>
                    {index < STEPS.length - 1 && (
                      <div className={cn(
                        "flex-1 h-0.5 mx-2",
                        isCompleted ? "bg-primary" : "bg-border"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
            <Progress value={(currentStep / STEPS.length) * 100} className="h-1" />
          </div>

          {/* Contenu du formulaire */}
          <div className="flex-1 overflow-y-auto py-4">
            <Form {...form}>
              <form className="space-y-4">
                {/* Étape 1: Informations générales */}
                {currentStep === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Structure responsable - mise en évidence (point d'entrée) */}
                    <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3">
                      <FormField
                        control={form.control}
                        name={"serviceResponsableId" as any}
                        render={({ field }) => {
                          const oforId = getEntiteByCode("OFOR")?.id;
                          const oforServices = mockServices.filter(s => s.actif && s.entiteId === oforId);
                          return (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                                <Building2 className="w-4 h-4 text-primary" />
                                Structure responsable OFOR *
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9 bg-background">
                                    <SelectValue placeholder="Sélectionner la structure responsable du projet" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-background border shadow-lg z-50 max-h-60">
                                  {oforServices.map((srv) => (
                                    <SelectItem key={srv.id} value={srv.id}>
                                      {srv.code} - {srv.nom}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-[11px] text-muted-foreground mt-1">
                                Hérité par toutes les activités du projet et les activités PTA rattachées.
                              </p>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code projet *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: PUDC-2024-001" {...field} className="h-9" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du projet *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nom complet" {...field} className="h-9" />
                            </FormControl>
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
                            <Textarea placeholder="Description du projet..." className="resize-none" rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="region"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Région principale *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-background border shadow-lg z-50">
                                {SENEGAL_GEO.map((region) => (
                                  <SelectItem key={region.code} value={region.name}>{region.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bailleur"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bailleur principal / chef de file *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-background border shadow-lg z-50">
                                {getBailleursActifs().map((bailleur) => (
                                  <SelectItem key={bailleur.id} value={bailleur.nom}>
                                    {bailleur.sigle ? `${bailleur.sigle} - ${bailleur.nom}` : bailleur.nom}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                  </div>
                )}

                {/* Étape 2: Budget et calendrier */}
                {currentStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Devise *</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                handleCurrencyChange(value);
                                field.onChange(value);
                              }} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Devise" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-background border shadow-lg z-50">
                                {CURRENCIES.map((currency) => (
                                  <SelectItem key={currency.code} value={currency.code}>
                                    {currency.code} - {currency.symbol}
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
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                className="h-9"
                                value={field.value || ""}
                                onChange={(e) => handleBudgetChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="budgetFCFA"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Équivalent FCFA *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                className="h-9"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                disabled={isFCFA}
                              />
                            </FormControl>
                            {!isFCFA && (
                              <p className="text-xs text-muted-foreground">
                                Taux appliqué pour calculs
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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
                                    className={cn("h-9 w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                  >
                                    {field.value ? format(field.value, "dd/MM/yyyy", { locale: fr }) : <span>Sélectionner</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="pointer-events-auto" />
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
                                    className={cn("h-9 w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                  >
                                    {field.value ? format(field.value, "dd/MM/yyyy", { locale: fr }) : <span>Sélectionner</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="pointer-events-auto" />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Financements multi-bailleur */}
                    <FinancementsEditor
                      value={financements}
                      onChange={setFinancements}
                      budgetTotalFCFA={form.watch("budgetFCFA") || 0}
                    />

                    <FormField
                      control={form.control}
                      name="objectives"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Objectifs du projet</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Décrivez les objectifs principaux du projet..."
                              className="resize-none"
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Étape 3: Zones d'intervention */}
                {currentStep === 3 && (
                  <div className="animate-fade-in">
                    <ZoneTreeSelector
                      value={zonesIntervention}
                      onChange={setZonesIntervention}
                      label="Zones d'intervention du projet"
                    />
                    {zonesIntervention.length === 0 && (
                      <p className="text-sm text-amber-600 mt-2">
                        ⚠️ Au moins une zone d'intervention est requise pour valider le projet
                      </p>
                    )}
                  </div>
                )}

                {/* Étape 4: Équipe projet */}
                {currentStep === 4 && (
                  <div className="space-y-4 animate-fade-in">
                    <PersonnelSelector
                      value={equipeProjet}
                      onChange={setEquipeProjet}
                    />
                    
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-3">Responsable principal *</p>
                      <div className="grid grid-cols-3 gap-3">
                        <FormField
                          control={form.control}
                          name="responsible"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Nom</FormLabel>
                              <FormControl>
                                <Input placeholder="Prénom Nom" {...field} className="h-9" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="responsibleEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="email@ofor.sn" {...field} className="h-9" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="responsiblePhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Téléphone</FormLabel>
                              <FormControl>
                                <Input placeholder="+221 77 XXX XX XX" {...field} className="h-9" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Sauvegarder brouillon
            </Button>

            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handlePrevious}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Précédent
                </Button>
              )}
              
              {currentStep < STEPS.length ? (
                <Button type="button" onClick={handleNext}>
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmitForValidation} className="bg-primary">
                  <Check className="w-4 h-4 mr-1" />
                  Soumettre pour validation
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'erreurs de validation */}
      <AlertDialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Validation incomplète</AlertDialogTitle>
            <AlertDialogDescription>
              Le projet ne peut pas être soumis pour validation. Corrigez les erreurs suivantes :
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-48 overflow-y-auto">
            <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Corriger</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveDraft}>
              Sauvegarder en brouillon
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectWizard;
