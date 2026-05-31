import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Target, Search, Eye, ChevronsUpDown, X } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  IndicatorType,
  ACTIVITY_NATURE_LABELS,
  ActivityNature,
} from "@/types/project";
import { useUnites } from "@/contexts/UnitesContext";
import { REFERENTIEL_INDICATEURS, ReferentielIndicator } from "@/data/referentielIndicateurs";
import UniteMesureBadge from "@/components/cdp/UniteMesureBadge";

const indicatorSchema = z.object({
  code: z.string().trim().min(1, "Le code est requis").max(20, "Maximum 20 caractères"),
  name: z.string().trim().min(3, "Le nom doit contenir au moins 3 caractères"),
  type: z.enum(["quantitatif", "qualitatif"]),
  uniteMesureIds: z.array(z.string()).min(1, "Sélectionnez au moins une unité de mesure"),
  methodeCalcul: z.string().optional(),
  unitResultat: z.string().optional(),
  description: z.string().optional(),
  source: z.string().optional(),
  frequence: z.enum(["mensuelle", "trimestrielle", "semestrielle", "annuelle"]).optional(),
});

type IndicatorFormValues = z.infer<typeof indicatorSchema>;

const FREQUENCE_LABELS: Record<string, string> = {
  mensuelle: "Mensuelle",
  trimestrielle: "Trimestrielle",
  semestrielle: "Semestrielle",
  annuelle: "Annuelle",
};

const ReferentielIndicateurs = () => {
  const [indicators, setIndicators] = useState<ReferentielIndicator[]>(REFERENTIEL_INDICATEURS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<ReferentielIndicator | null>(null);
  const [editing, setEditing] = useState<ReferentielIndicator | null>(null);

  const { allUnits, unitsByNature, getUnitById } = useUnites();
  const getUniteMesureById = getUnitById;

  const form = useForm<IndicatorFormValues>({
    resolver: zodResolver(indicatorSchema),
    defaultValues: {
      code: "",
      name: "",
      type: "quantitatif",
      uniteMesureIds: [],
      methodeCalcul: "",
      unitResultat: "",
      description: "",
      source: "",
      frequence: undefined,
    },
  });

  const openAdd = () => {
    setEditing(null);
    form.reset({
      code: "",
      name: "",
      type: "quantitatif",
      uniteMesureIds: [],
      methodeCalcul: "",
      unitResultat: "",
      description: "",
      source: "",
      frequence: undefined,
    });
    setFormOpen(true);
  };

  const openEdit = (ind: ReferentielIndicator) => {
    setEditing(ind);
    form.reset({
      code: ind.code,
      name: ind.name,
      type: ind.type,
      uniteMesureIds: ind.uniteMesureIds,
      methodeCalcul: ind.methodeCalcul || "",
      unitResultat: ind.unitResultat || "",
      description: ind.description || "",
      source: ind.source || "",
      frequence: ind.frequence,
    });
    setFormOpen(true);
  };

  const handleSubmit = (data: IndicatorFormValues) => {
    if (editing) {
      setIndicators((prev) =>
        prev.map((i) =>
          i.id === editing.id
            ? { ...i, ...data, updatedAt: new Date().toISOString() }
            : i,
        ),
      );
      toast.success("Indicateur modifié");
    } else {
      const exists = indicators.some((i) => i.code.toLowerCase() === data.code.toLowerCase());
      if (exists) {
        toast.error("Ce code existe déjà");
        return;
      }
      const newInd: ReferentielIndicator = {
        id: `ind-ref-${Date.now()}`,
        code: data.code,
        name: data.name,
        type: data.type,
        uniteMesureIds: data.uniteMesureIds,
        methodeCalcul: data.methodeCalcul,
        unitResultat: data.unitResultat,
        description: data.description,
        source: data.source,
        frequence: data.frequence,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setIndicators((prev) => [...prev, newInd]);
      toast.success("Indicateur ajouté");
    }
    form.reset();
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    setIndicators((prev) => prev.filter((i) => i.id !== id));
    toast.success("Indicateur supprimé");
  };

  const filtered = useMemo(() => {
    return indicators.filter((ind) => {
      if (filterType !== "all" && ind.type !== filterType) return false;
      if (searchQuery === "") return true;
      const q = searchQuery.toLowerCase();
      return (
        ind.code.toLowerCase().includes(q) ||
        ind.name.toLowerCase().includes(q) ||
        ind.description?.toLowerCase().includes(q)
      );
    });
  }, [indicators, filterType, searchQuery]);

  return (
    <DashboardLayout
      title="Référentiel des indicateurs"
      subtitle="Batterie d'indicateurs utilisables pour les projets et les CDP"
    >
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher (code, nom, description)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-72"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="quantitatif">Quantitatif</SelectItem>
                <SelectItem value="qualitatif">Qualitatif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un indicateur
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total indicateurs</p>
                  <p className="text-2xl font-bold">{indicators.length}</p>
                </div>
                <div className="p-2 rounded-xl bg-primary/10">
                  <Target className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Quantitatifs</p>
              <p className="text-2xl font-bold">
                {indicators.filter((i) => i.type === "quantitatif").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Qualitatifs</p>
              <p className="text-2xl font-bold">
                {indicators.filter((i) => i.type === "qualitatif").length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead className="w-28">Code</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="w-28">Type</TableHead>
                  <TableHead>Unités impliquées</TableHead>
                  <TableHead className="w-28">Résultat</TableHead>
                  <TableHead className="w-32">Fréquence</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ind) => (
                  <TableRow
                    key={ind.id}
                    className="group cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelected(ind);
                      setDetailOpen(true);
                    }}
                  >
                    <TableCell className="font-mono text-sm font-medium">{ind.code}</TableCell>
                    <TableCell className="font-medium">{ind.name}</TableCell>
                    <TableCell>
                      <Badge variant={ind.type === "quantitatif" ? "default" : "secondary"}>
                        {ind.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {ind.uniteMesureIds.slice(0, 3).map((uid) => (
                          <UniteMesureBadge key={uid} uniteId={uid} variant="code" />
                        ))}
                        {ind.uniteMesureIds.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{ind.uniteMesureIds.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{ind.unitResultat || "-"}</TableCell>
                    <TableCell className="text-sm">
                      {ind.frequence ? FREQUENCE_LABELS[ind.frequence] : "-"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setSelected(ind);
                            setDetailOpen(true);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(ind)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(ind.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun indicateur trouvé</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier l'indicateur" : "Ajouter un indicateur"}
            </DialogTitle>
            <DialogDescription>
              Définissez l'indicateur, sa méthode de calcul et les unités de mesure impliquées
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="IND-001" {...field} className="font-mono" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="quantitatif">Quantitatif</SelectItem>
                          <SelectItem value="qualitatif">Qualitatif</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="frequence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fréquence</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background z-50">
                          {Object.entries(FREQUENCE_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
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
                name="uniteMesureIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unités de mesure impliquées *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-between font-normal"
                          >
                            <span className="truncate">
                              {field.value.length === 0
                                ? "Sélectionner les unités..."
                                : `${field.value.length} unité(s) sélectionnée(s)`}
                            </span>
                            <ChevronsUpDown className="w-4 h-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-background z-50" align="start">
                        {(() => {
                          const NATURE_ORDER: ActivityNature[] = [
                            "etude", "travaux", "formation", "equipement", "sensibilisation", "suivi", "autre",
                          ];
                          const entries = NATURE_ORDER
                            .map((nature) => ({ nature, units: unitsByNature[nature] || [] }))
                            .filter((g) => g.units.length > 0);
                          return (
                            <div className="max-h-80 overflow-auto">
                              {entries.map(({ nature, units }, idx) => {
                                const selectedInGroup = units.filter((u) => field.value.includes(u.id)).length;
                                const allSelected = selectedInGroup === units.length;
                                return (
                                  <div key={nature} className={idx > 0 ? "border-t" : ""}>
                                    <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-2 bg-muted/80 backdrop-blur border-b">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wide text-foreground">
                                          {ACTIVITY_NATURE_LABELS[nature] || nature}
                                        </span>
                                        <Badge variant="outline" className="h-5 text-[10px] px-1.5">
                                          {selectedInGroup}/{units.length}
                                        </Badge>
                                      </div>
                                      <button
                                        type="button"
                                        className="text-[11px] text-primary hover:underline"
                                        onClick={() => {
                                          const ids = units.map((u) => u.id);
                                          if (allSelected) {
                                            field.onChange(field.value.filter((v) => !ids.includes(v)));
                                          } else {
                                            field.onChange(Array.from(new Set([...field.value, ...ids])));
                                          }
                                        }}
                                      >
                                        {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
                                      </button>
                                    </div>
                                    <div className="p-1">
                                      {units.map((u) => {
                                        const checked = field.value.includes(u.id);
                                        return (
                                          <label
                                            key={u.id}
                                            className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                                              checked ? "bg-primary/10" : "hover:bg-muted"
                                            }`}
                                          >
                                            <Checkbox
                                              checked={checked}
                                              onCheckedChange={(c) => {
                                                if (c) field.onChange([...field.value, u.id]);
                                                else field.onChange(field.value.filter((v) => v !== u.id));
                                              }}
                                            />
                                            <Badge variant="outline" className="font-mono text-[10px] h-5 px-1.5 w-14 justify-center">
                                              {u.code}
                                            </Badge>
                                            <span className="text-sm flex-1 truncate">{u.name}</span>
                                            {u.description && (
                                              <span className="text-[11px] text-muted-foreground truncate max-w-[40%] hidden sm:inline">
                                                {u.description}
                                              </span>
                                            )}
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </PopoverContent>
                    </Popover>
                    {field.value.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {field.value.map((uid) => {
                          const u = getUniteMesureById(uid);
                          if (!u) return null;
                          return (
                            <Badge key={uid} variant="secondary" className="gap-1">
                              <span className="font-mono">{u.code}</span>
                              <span>· {u.name}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  field.onChange(field.value.filter((v) => v !== uid))
                                }
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                    <FormDescription className="text-xs">
                      Unités du référentiel utilisées dans la méthode de calcul
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="methodeCalcul"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Méthode de calcul</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: (Bénéficiaires desservis / Population totale) × 100"
                        rows={2}
                        className="resize-none"
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
                  name="unitResultat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unité du résultat</FormLabel>
                      <FormControl>
                        <Input placeholder="%, nombre, ratio..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Enquête terrain" {...field} />
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
                      <Textarea
                        placeholder="Description de l'indicateur..."
                        rows={2}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">{editing ? "Enregistrer" : "Ajouter"}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Fiche indicateur
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xl font-bold text-primary">
                    {selected.code}
                  </span>
                  <div className="flex gap-2">
                    <Badge variant={selected.type === "quantitatif" ? "default" : "secondary"}>
                      {selected.type}
                    </Badge>
                    {selected.frequence && (
                      <Badge variant="outline">{FREQUENCE_LABELS[selected.frequence]}</Badge>
                    )}
                  </div>
                </div>
                <p className="font-semibold text-lg">{selected.name}</p>
                {selected.description && (
                  <p className="text-sm text-muted-foreground">{selected.description}</p>
                )}
              </div>

              <div>
                <p className="text-xs uppercase font-semibold text-muted-foreground mb-2">
                  Unités de mesure impliquées
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {selected.uniteMesureIds.map((uid) => (
                    <UniteMesureBadge key={uid} uniteId={uid} variant="full" />
                  ))}
                </div>
              </div>

              {selected.methodeCalcul && (
                <div>
                  <p className="text-xs uppercase font-semibold text-muted-foreground mb-1">
                    Méthode de calcul
                  </p>
                  <p className="text-sm p-3 bg-muted rounded font-mono">
                    {selected.methodeCalcul}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {selected.unitResultat && (
                  <div>
                    <p className="text-xs uppercase font-semibold text-muted-foreground">
                      Unité du résultat
                    </p>
                    <p>{selected.unitResultat}</p>
                  </div>
                )}
                {selected.source && (
                  <div>
                    <p className="text-xs uppercase font-semibold text-muted-foreground">Source</p>
                    <p>{selected.source}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ReferentielIndicateurs;
