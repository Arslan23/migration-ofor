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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { REGIONS, ENTITES_EXECUTION, CURRENCIES, Currency } from "@/types/project";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, FileText, MapPin, Users, Target, Paperclip } from "lucide-react";
import AttachmentManager from "@/components/ui/AttachmentManager";
import { Attachment } from "@/types/attachment";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ZoneTreeSelector from "@/components/zones/ZoneTreeSelector";
import PersonnelSelector from "@/components/projects/PersonnelSelector";
import { ZoneIntervention } from "@/data/geoData";
import { AffectationPersonnel } from "@/data/personnel";
import { useState, useMemo } from "react";
import { mockBailleurs, getBailleursActifs } from "@/data/bailleurs";
import { mockEntitesExecution } from "@/data/entitesExecution";
import { SENEGAL_GEO } from "@/data/geoData";

const projectSchema = z.object({
  code: z.string().min(1, "Le code est requis").max(20, "Le code doit faire moins de 20 caractères"),
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères").max(200, "Le nom doit faire moins de 200 caractères"),
  description: z.string().max(1000, "La description doit faire moins de 1000 caractères").optional(),
  region: z.string().min(1, "La région est requise"),
  bailleur: z.string().min(1, "Le bailleur est requis"),
  budget: z.number().min(0, "Le budget doit être positif"),
  currency: z.string().min(1, "La devise est requise"),
  budgetFCFA: z.number().min(0, "Le budget FCFA doit être positif"),
  startDate: z.date({ required_error: "La date de début est requise" }),
  endDate: z.date({ required_error: "La date de fin est requise" }),
  responsible: z.string().min(2, "Le responsable est requis").max(100, "Le nom doit faire moins de 100 caractères"),
  responsibleEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  responsiblePhone: z.string().max(20, "Le téléphone doit faire moins de 20 caractères").optional(),
  objectives: z.string().max(2000, "Les objectifs doivent faire moins de 2000 caractères").optional(),
  entiteExecution: z.string().optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: "La date de fin doit être postérieure à la date de début",
  path: ["endDate"],
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  initialData?: Partial<ProjectFormValues & { 
    zonesIntervention?: ZoneIntervention[];
    equipeProjet?: AffectationPersonnel[];
    currency?: Currency;
    budgetFCFA?: number;
  }>;
  isEditing?: boolean;
}

const ProjectForm = ({ open, onOpenChange, onSubmit, initialData, isEditing = false }: ProjectFormProps) => {
  const [zonesIntervention, setZonesIntervention] = useState<ZoneIntervention[]>(
    initialData?.zonesIntervention || []
  );
  const [equipeProjet, setEquipeProjet] = useState<AffectationPersonnel[]>(
    initialData?.equipeProjet || []
  );
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      code: initialData?.code || "",
      name: initialData?.name || "",
      description: initialData?.description || "",
      region: initialData?.region || "",
      bailleur: initialData?.bailleur || "",
      budget: initialData?.budget || 0,
      currency: initialData?.currency || "XOF",
      budgetFCFA: initialData?.budgetFCFA || initialData?.budget || 0,
      startDate: initialData?.startDate,
      endDate: initialData?.endDate,
      responsible: initialData?.responsible || "",
      responsibleEmail: initialData?.responsibleEmail || "",
      responsiblePhone: initialData?.responsiblePhone || "",
      objectives: initialData?.objectives || "",
      entiteExecution: initialData?.entiteExecution || "",
    },
  });

  const watchCurrency = form.watch("currency");
  const watchBudget = form.watch("budget");

  // Calculer automatiquement le budget FCFA si c'est XOF
  const isFCFA = watchCurrency === "XOF";

  // Handler pour synchroniser le budget FCFA quand la devise est XOF
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

  const handleSubmit = (data: ProjectFormValues) => {
    onSubmit({ ...data, zonesIntervention, equipeProjet });
    toast.success(isEditing ? "Projet modifié avec succès" : "Projet créé avec succès");
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading">
            {isEditing ? "Modifier le projet" : "Nouveau projet"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations du projet"
              : "Remplissez les informations pour créer un nouveau projet"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-9">
                <TabsTrigger value="general" className="flex items-center gap-1.5 text-xs">
                  <FileText className="w-3.5 h-3.5" />
                  Général
                </TabsTrigger>
                <TabsTrigger value="zones" className="flex items-center gap-1.5 text-xs">
                  <MapPin className="w-3.5 h-3.5" />
                  Zones
                </TabsTrigger>
                <TabsTrigger value="equipe" className="flex items-center gap-1.5 text-xs">
                  <Users className="w-3.5 h-3.5" />
                  Équipe
                </TabsTrigger>
                <TabsTrigger value="objectifs" className="flex items-center gap-1.5 text-xs">
                  <Target className="w-3.5 h-3.5" />
                  Objectifs
                </TabsTrigger>
              </TabsList>

              {/* Onglet Général */}
              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
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
                        <Textarea placeholder="Description du projet..." className="resize-none" rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Région principale *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <FormLabel>Bailleur *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                {/* Budget et devise */}
                <div className="grid grid-cols-3 gap-3">
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
                          defaultValue={field.value}
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
                            {...field}
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
                            {...field}
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

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="entiteExecution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entité d'exécution</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border shadow-lg z-50">
                            {mockEntitesExecution.filter(e => e.actif).map((entite) => (
                              <SelectItem key={entite.id} value={entite.nom}>
                                {entite.code} - {entite.nom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
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
              </TabsContent>

              {/* Onglet Zones */}
              <TabsContent value="zones" className="mt-4">
                <ZoneTreeSelector
                  value={zonesIntervention}
                  onChange={setZonesIntervention}
                  label="Zones d'intervention du projet"
                />
              </TabsContent>

              {/* Onglet Équipe */}
              <TabsContent value="equipe" className="space-y-4 mt-4">
                <PersonnelSelector
                  value={equipeProjet}
                  onChange={setEquipeProjet}
                />
                
                {/* Champs legacy optionnels */}
                <div className="border-t pt-4 mt-4">
                  <p className="text-xs text-muted-foreground mb-3">
                    Responsable principal (optionnel, pour compatibilité)
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="responsible"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Nom</FormLabel>
                          <FormControl>
                            <Input placeholder="Prénom Nom" {...field} className="h-8 text-xs" />
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
                            <Input type="email" placeholder="email@ofor.sn" {...field} className="h-8 text-xs" />
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
                            <Input placeholder="+221 77 XXX XX XX" {...field} className="h-8 text-xs" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Onglet Objectifs */}
              <TabsContent value="objectifs" className="mt-4">
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
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Enregistrer" : "Créer le projet"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectForm;
