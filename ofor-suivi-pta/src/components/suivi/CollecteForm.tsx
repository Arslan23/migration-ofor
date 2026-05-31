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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, FileText, Loader2, FolderOpen, Building2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const collecteSchema = z.object({
  scope: z.enum(["project", "service"]),
  ptaId: z.string().min(1, "PTA requis"),
  projectId: z.string().min(1, "Sélection requise"),
  dateCollecte: z.string().min(1, "La date de collecte est requise"),
  description: z.string().optional(),
});

type CollecteFormValues = z.infer<typeof collecteSchema>;

interface Project {
  id: string;
  name: string;
}

interface Service {
  id: string;
  nom: string;
}

interface PTAOption {
  id: string;
  code: string;
  name: string;
  year: number;
}

interface CollecteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  services?: Service[];
  openPTAs: PTAOption[];
  onSubmit: (data: { ptaId: string; projectId: string; dateCollecte: string; description?: string }) => void;
}

const CollecteForm = ({
  open,
  onOpenChange,
  projects,
  services = [],
  openPTAs,
  onSubmit,
}: CollecteFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scope, setScope] = useState<"project" | "service">("project");

  const defaultPTA = openPTAs[0];
  const defaultDate = defaultPTA
    ? format(new Date(defaultPTA.year, new Date().getMonth(), Math.min(new Date().getDate(), 28)), "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");

  const form = useForm<CollecteFormValues>({
    resolver: zodResolver(collecteSchema),
    defaultValues: {
      scope: "project",
      ptaId: defaultPTA?.id || "",
      projectId: "",
      dateCollecte: defaultDate,
      description: "",
    },
  });

  const handleSubmit = async (data: CollecteFormValues) => {
    setIsSubmitting(true);
    try {
      // Normaliser : pour les collectes "service", on convertit l'id vers projectId virtuel
      const projectId = data.scope === "service" ? `service-${data.projectId}` : data.projectId;
      onSubmit({ ptaId: data.ptaId, projectId, dateCollecte: data.dateCollecte, description: data.description });
      toast.success(
        data.scope === "service"
          ? "Collecte hors projet créée. Les fiches ont été générées pour les activités du service."
          : "Collecte créée avec succès. Les fiches ont été générées pour toutes les activités du projet."
      );
      form.reset({ scope, ptaId: data.ptaId, projectId: "", dateCollecte: data.dateCollecte, description: "" });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const projectIdValue = form.watch("projectId");
  const selectedLabel =
    scope === "project"
      ? projects.find(p => p.id === projectIdValue)?.name
      : services.find(s => s.id === projectIdValue)?.nom;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Nouvelle collecte
          </DialogTitle>
          <DialogDescription>
            Créer une collecte génère automatiquement les fiches de suivi pour toutes les activités rattachées au projet ou au service sélectionné.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={scope}
          onValueChange={(v) => {
            const next = v as "project" | "service";
            setScope(next);
            form.setValue("scope", next);
            form.setValue("projectId", "");
          }}
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="project" className="flex items-center gap-2">
              <FolderOpen className="w-3.5 h-3.5" /> Projet
            </TabsTrigger>
            <TabsTrigger value="service" className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" /> Hors projet (service)
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4">
              <FormField
                control={form.control}
                name="ptaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PTA ouvert *</FormLabel>
                    {openPTAs.length === 0 ? (
                      <div className="text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-md px-3 py-2">
                        Aucun PTA ouvert. Ouvrez un PTA dans Planification pour créer une collecte.
                      </div>
                    ) : openPTAs.length === 1 ? (
                      <div className="text-sm border rounded-md px-3 py-2 bg-muted/50">
                        <span className="font-mono text-xs text-muted-foreground mr-2">{openPTAs[0].code}</span>
                        {openPTAs[0].name}
                      </div>
                    ) : (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un PTA ouvert" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {openPTAs.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              <span className="font-mono text-xs mr-2">{p.code}</span>{p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <TabsContent value="project" className="m-0">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Projet *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un projet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="service" className="m-0">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service responsable *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {services.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <FormField
                control={form.control}
                name="dateCollecte"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date de collecte *
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>Description (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description ou contexte de cette collecte..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedLabel && (
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <p className="text-sm font-medium">{selectedLabel}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.watch("dateCollecte") && (
                      <>Collecte du {format(new Date(form.watch("dateCollecte")), "dd MMMM yyyy", { locale: fr })}</>
                    )}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Créer la collecte
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CollecteForm;
