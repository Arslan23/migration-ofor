import { useState } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { FicheSuivi, Deliverable, Activity, getDeliverableName } from "@/types/project";
import { toast } from "sonner";
import AttachmentManager from "@/components/ui/AttachmentManager";
import CommentManager from "@/components/ui/CommentManager";
import { Attachment } from "@/types/attachment";
import { Comment } from "@/types/comment";

const ficheSuiviSchema = z.object({
  code: z.string().min(1, "Le code est requis"),
  date: z.date({ required_error: "La date est requise" }),
  period: z.string().min(1, "La période est requise"),
  author: z.string().min(2, "L'auteur est requis"),
  observations: z.string().optional(),
  activityProgress: z.number().min(0).max(100),
  activitySpent: z.number().min(0),
});

type FicheSuiviFormValues = z.infer<typeof ficheSuiviSchema>;

interface FicheSuiviFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FicheSuiviFormValues) => void;
  deliverables: Deliverable[];
  activity: Activity;
  initialData?: Partial<FicheSuivi>;
  isEditing?: boolean;
}

const PERIODS = [
  "Q1 2024",
  "Q2 2024",
  "Q3 2024",
  "Q4 2024",
  "Q1 2025",
  "Q2 2025",
  "Q3 2025",
  "Q4 2025",
  "Janvier 2025",
  "Février 2025",
  "Mars 2025",
];

const formatBudget = (amount: number) => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)} Mds`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(0)} M`;
  }
  return new Intl.NumberFormat("fr-FR").format(amount);
};

const FicheSuiviForm = ({ 
  open, 
  onOpenChange, 
  onSubmit,
  deliverables,
  activity,
  initialData, 
  isEditing = false 
}: FicheSuiviFormProps) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const form = useForm<FicheSuiviFormValues>({
    resolver: zodResolver(ficheSuiviSchema),
    defaultValues: {
      code: initialData?.code || "",
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      period: initialData?.period || "",
      author: initialData?.author || "",
      observations: initialData?.observations || "",
      activityProgress: initialData?.activityProgress ?? activity.progress,
      activitySpent: initialData?.activitySpent ?? activity.spent,
    },
  });

  const handleSubmit = (data: FicheSuiviFormValues) => {
    onSubmit(data);
    toast.success(isEditing ? "Fiche modifiée" : "Fiche créée");
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la fiche de suivi" : "Nouvelle fiche de suivi"}
          </DialogTitle>
          <DialogDescription>
            Fiche de suivi pour l'activité: {activity.name}
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
                    <FormLabel>Code fiche *</FormLabel>
                    <FormControl>
                      <Input placeholder="FS-2025-Q1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Période *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PERIODS.map((period) => (
                          <SelectItem key={period} value={period}>
                            {period}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date *</FormLabel>
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
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auteur *</FormLabel>
                    <FormControl>
                      <Input placeholder="Votre nom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="activityProgress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avancement activité (%) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
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
                name="activitySpent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dépenses (FCFA) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      Budget: {formatBudget(activity.budget)} FCFA
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observations générales</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observations et commentaires sur la période..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {deliverables.length > 0 && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-2">Livrables à renseigner</p>
                <div className="space-y-1">
                  {deliverables.map((deliverable) => (
                    <div key={deliverable.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{getDeliverableName(deliverable)}</span>
                      <span className="font-mono">{deliverable.currentValue} / {deliverable.targetValue}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Les valeurs des livrables peuvent être mises à jour après création de la fiche.
                </p>
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
                    onAttachmentsChange={setAttachments}
                    compact
                  />
                  <CommentManager
                    comments={comments}
                    onCommentsChange={setComments}
                    currentUser="Utilisateur"
                    compact
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {isEditing ? "Enregistrer" : "Créer la fiche"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default FicheSuiviForm;
