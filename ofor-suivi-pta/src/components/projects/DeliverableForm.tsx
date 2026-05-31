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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Objective, 
  Indicator, 
  ActivityNature, 
  UNITES_MESURE_BY_NATURE,
  UniteMesure,
  getDeliverableCode,
  getDeliverableName,
  getDeliverableUnit,
} from "@/types/project";
import { toast } from "sonner";
import { useMemo } from "react";

const objectiveSchema = z.object({
  uniteMesureId: z.string().min(1, "L'unité de mesure est requise"),
  targetValue: z.number().min(0, "La valeur cible doit être positive"),
  currentValue: z.number().min(0, "La valeur actuelle doit être positive"),
  linkedPerformanceIndicatorId: z.string().optional(),
});

type ObjectiveFormValues = z.infer<typeof objectiveSchema>;

interface ObjectiveFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ObjectiveFormValues) => void;
  projectIndicators: Indicator[];
  activityNature?: ActivityNature;
  initialData?: Partial<Objective>;
  isEditing?: boolean;
  hideCurrentValue?: boolean;
}

const ObjectiveForm = ({
  open,
  onOpenChange,
  onSubmit,
  projectIndicators,
  activityNature,
  initialData,
  isEditing = false,
  hideCurrentValue = false,
}: ObjectiveFormProps) => {
  const form = useForm<ObjectiveFormValues>({
    resolver: zodResolver(objectiveSchema),
    defaultValues: {
      uniteMesureId: initialData?.uniteMesureId || "",
      targetValue: initialData?.targetValue || 0,
      currentValue: initialData?.currentValue || 0,
      linkedPerformanceIndicatorId: initialData?.linkedPerformanceIndicatorId || "",
    },
  });

  // Unités de mesure disponibles selon la nature de l'activité
  const availableUnits = useMemo(() => {
    if (!activityNature) return [];
    return UNITES_MESURE_BY_NATURE[activityNature] || [];
  }, [activityNature]);

  const selectedUnitId = form.watch("uniteMesureId");
  const selectedUnit = useMemo(() => {
    return availableUnits.find(u => u.id === selectedUnitId);
  }, [availableUnits, selectedUnitId]);

  const handleSubmit = (data: ObjectiveFormValues) => {
    const unit = availableUnits.find(u => u.id === data.uniteMesureId);
    onSubmit({
      ...data,
      // Inclure l'unité de mesure complète pour référence
    });
    toast.success(isEditing ? "Livrable modifié" : "Livrable ajouté");
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le livrable" : "Ajouter un livrable"}
          </DialogTitle>
          <DialogDescription>
            Sélectionnez une unité de mesure et définissez les valeurs cibles.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="uniteMesureId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unité de mesure *</FormLabel>
                  {availableUnits.length > 0 ? (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une unité" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {availableUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                                {unit.code}
                              </span>
                              <span>{unit.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                      Sélectionnez d'abord une nature d'activité pour voir les unités disponibles
                    </p>
                  )}
                  {activityNature && (
                    <FormDescription className="text-xs">
                      Unités disponibles pour ce type d'activité
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Affichage des détails de l'unité sélectionnée */}
            {selectedUnit && (
              <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Code:</span>
                  <span className="font-mono text-sm font-medium">{selectedUnit.code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Nom:</span>
                  <span className="text-sm font-medium">{selectedUnit.name}</span>
                </div>
                {selectedUnit.description && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {selectedUnit.description}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valeur cible *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!hideCurrentValue && (
                <FormField
                  control={form.control}
                  name="currentValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valeur actuelle</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="linkedPerformanceIndicatorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lié à l'indicateur de performance</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner (optionnel)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      <SelectItem value="__none__">Aucun</SelectItem>
                      {projectIndicators.map((indicator) => (
                        <SelectItem key={indicator.id} value={indicator.id}>
                          {indicator.code} - {indicator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
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

export default ObjectiveForm;