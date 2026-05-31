import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Ruler, Search, Eye, Info } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UniteMesure, ActivityNature, ACTIVITY_NATURE_LABELS } from "@/types/project";
import { useUnites } from "@/contexts/UnitesContext";

const NATURES: { value: ActivityNature; label: string }[] = [
  { value: "etude", label: "Étude" },
  { value: "travaux", label: "Travaux" },
  { value: "formation", label: "Formation" },
  { value: "equipement", label: "Équipement" },
  { value: "sensibilisation", label: "Sensibilisation" },
  { value: "suivi", label: "Suivi & Évaluation" },
  { value: "autre", label: "Autre" },
];

const unitSchema = z.object({
  code: z.string().trim().min(1, "Le code est requis").max(10, "Maximum 10 caractères"),
  name: z.string().trim().min(1, "Le nom est requis").max(50, "Maximum 50 caractères"),
  description: z.string().max(200, "Maximum 200 caractères").optional(),
  nature: z.string().min(1, "La nature est requise"),
});

type UnitFormValues = z.infer<typeof unitSchema>;

const ReferentielUnites = () => {
  const { unitsByNature: unitsData, addUnit, updateUnit, deleteUnit } = useUnites();
  const [selectedNature, setSelectedNature] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<{ nature: string; unit: UniteMesure } | null>(null);
  const [editingUnit, setEditingUnit] = useState<{ nature: string; unit: UniteMesure } | null>(null);

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      nature: "",
    },
  });

  const handleAddUnit = (data: UnitFormValues) => {
    const { code, name, description, nature } = data;
    
    // Vérifier si le code existe déjà
    const existingCodes = unitsData[nature]?.map(u => u.code.toLowerCase()) || [];
    if (existingCodes.includes(code.toLowerCase())) {
      toast.error("Ce code existe déjà pour cette nature");
      return;
    }

    const newUnit: UniteMesure = {
      id: `${nature}-${Date.now()}`,
      code: code.toUpperCase(),
      name,
      description,
      nature: nature as ActivityNature,
    };

    addUnit(nature, newUnit);
    
    toast.success("Unité ajoutée avec succès");
    form.reset();
    setFormOpen(false);
  };

  const handleEditUnit = (data: UnitFormValues) => {
    if (!editingUnit) return;

    const updatedUnit: UniteMesure = {
      ...editingUnit.unit,
      code: data.code.toUpperCase(),
      name: data.name,
      description: data.description,
      nature: data.nature as ActivityNature,
    };

    updateUnit(editingUnit.nature, data.nature, updatedUnit);

    toast.success("Unité modifiée avec succès");
    setEditingUnit(null);
    form.reset();
    setFormOpen(false);
  };

  const handleDeleteUnit = (nature: string, unit: UniteMesure) => {
    deleteUnit(nature, unit.id);
    toast.success("Unité supprimée");
  };

  const openEditForm = (nature: string, unit: UniteMesure) => {
    setEditingUnit({ nature, unit });
    form.reset({ 
      code: unit.code, 
      name: unit.name, 
      description: unit.description || "",
      nature 
    });
    setFormOpen(true);
  };

  const openAddForm = () => {
    setEditingUnit(null);
    form.reset({ 
      code: "", 
      name: "", 
      description: "",
      nature: selectedNature !== "all" ? selectedNature : "" 
    });
    setFormOpen(true);
  };

  // Filtrer les unités
  const filteredData = Object.entries(unitsData)
    .filter(([nature]) => selectedNature === "all" || nature === selectedNature)
    .map(([nature, units]) => ({
      nature,
      natureLabel: ACTIVITY_NATURE_LABELS[nature as ActivityNature] || nature,
      units: units.filter(unit => 
        searchQuery === "" || 
        unit.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (unit.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    }))
    .filter(item => item.units.length > 0);

  const totalUnits = Object.values(unitsData).reduce((sum, units) => sum + units.length, 0);

  return (
    <DashboardLayout
      title="Gestion des unités de mesure"
      subtitle="Référentiel des unités de mesure par nature d'activité"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
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
            <Select value={selectedNature} onValueChange={setSelectedNature}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par nature" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="all">Toutes les natures</SelectItem>
                {NATURES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openAddForm}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une unité
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total unités</p>
                  <p className="text-2xl font-bold">{totalUnits}</p>
                </div>
                <div className="p-2 rounded-xl bg-primary/10">
                  <Ruler className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div>
                <p className="text-sm text-muted-foreground">Natures</p>
                <p className="text-2xl font-bold">{NATURES.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste par nature avec tableau */}
        <div className="grid gap-4">
          {filteredData.map(({ nature, natureLabel, units }) => (
            <Card key={nature}>
              <CardHeader className="py-3 border-b">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{natureLabel}</span>
                  <Badge variant="secondary">{units.length} unité(s)</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead className="w-24">Code</TableHead>
                      <TableHead className="w-48">Nom</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((unit) => (
                      <TableRow 
                        key={unit.id} 
                        className="group cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedUnit({ nature, unit });
                          setDetailDialogOpen(true);
                        }}
                      >
                        <TableCell className="font-mono text-sm font-medium">
                          {unit.code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {unit.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {unit.description || "-"}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEditForm(nature, unit)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteUnit(nature, unit)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}

          {filteredData.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Ruler className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune unité trouvée</p>
            </div>
          )}
        </div>
      </div>

      {/* Dialog ajout/modification */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? "Modifier l'unité" : "Ajouter une unité"}
            </DialogTitle>
            <DialogDescription>
              Définissez le code, le nom et la description de l'unité
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(editingUnit ? handleEditUnit : handleAddUnit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nature d'activité *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une nature" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {NATURES.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="FOR" 
                          {...field} 
                          className="uppercase font-mono"
                          maxLength={10}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Max 10 car.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input placeholder="Forages" {...field} />
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
                        placeholder="Description détaillée de l'unité de mesure..." 
                        className="resize-none"
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Optionnel - précise le contexte d'utilisation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingUnit ? "Enregistrer" : "Ajouter"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Détail Unité */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ruler className="w-5 h-5 text-primary" />
              Fiche Unité de Mesure
            </DialogTitle>
            <DialogDescription>
              Détails de l'unité sélectionnée
            </DialogDescription>
          </DialogHeader>
          {selectedUnit && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-bold text-primary">{selectedUnit.unit.code}</span>
                  <Badge variant="secondary">
                    {ACTIVITY_NATURE_LABELS[selectedUnit.nature as ActivityNature] || selectedUnit.nature}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Libellé</p>
                  <p className="font-semibold text-lg">{selectedUnit.unit.name}</p>
                </div>
              </div>

              {selectedUnit.unit.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Description</p>
                  <p className="text-sm">{selectedUnit.unit.description}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="w-4 h-4" />
                <span>Identifiant: {selectedUnit.unit.id}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setDetailDialogOpen(false)}>
                  Fermer
                </Button>
                <Button size="sm" onClick={() => {
                  setDetailDialogOpen(false);
                  openEditForm(selectedUnit.nature, selectedUnit.unit);
                }}>
                  <Pencil className="w-4 h-4 mr-1" />
                  Modifier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ReferentielUnites;