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
import { ProductIndicator, Indicator } from "@/types/project";
import { toast } from "sonner";

const productIndicatorSchema = z.object({
  code: z.string().min(1, "Le code est requis"),
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  unit: z.string().min(1, "L'unité est requise"),
  targetValue: z.number().min(0, "La valeur cible doit être positive"),
  currentValue: z.number().min(0, "La valeur actuelle doit être positive"),
  description: z.string().optional(),
  linkedPerformanceIndicatorId: z.string().optional(),
});

type ProductIndicatorFormValues = z.infer<typeof productIndicatorSchema>;

interface ProductIndicatorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductIndicatorFormValues) => void;
  projectIndicators: Indicator[];
  initialData?: Partial<ProductIndicator>;
  isEditing?: boolean;
}

const ProductIndicatorForm = ({
  open,
  onOpenChange,
  onSubmit,
  projectIndicators,
  initialData,
  isEditing = false,
}: ProductIndicatorFormProps) => {
  const form = useForm<ProductIndicatorFormValues>({
    resolver: zodResolver(productIndicatorSchema),
    defaultValues: {
      code: initialData?.code || "",
      name: initialData?.name || "",
      unit: initialData?.unit || "",
      targetValue: initialData?.targetValue || 0,
      currentValue: initialData?.currentValue || 0,
      description: initialData?.description || "",
      linkedPerformanceIndicatorId: initialData?.linkedPerformanceIndicatorId || "",
    },
  });

  const handleSubmit = (data: ProductIndicatorFormValues) => {
    onSubmit(data);
    toast.success(isEditing ? "Indicateur modifié" : "Indicateur ajouté");
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier l'indicateur produit" : "Ajouter un indicateur produit"}
          </DialogTitle>
          <DialogDescription>
            Les indicateurs produit mesurent les livrables de l'activité et alimentent les indicateurs de performance du projet.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="PROD-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unité *</FormLabel>
                    <FormControl>
                      <Input placeholder="forages, km, %" {...field} />
                    </FormControl>
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
                    <Input placeholder="Nom de l'indicateur" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description de l'indicateur..."
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
                name="targetValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valeur cible *</FormLabel>
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
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valeur actuelle</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="linkedPerformanceIndicatorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lié à l'indicateur de performance</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner (optionnel)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Aucun</SelectItem>
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

export default ProductIndicatorForm;
