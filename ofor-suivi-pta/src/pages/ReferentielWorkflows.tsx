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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  GitBranch,
  ArrowRight,
  GripVertical,
  Download,
  Eye,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Workflow, WorkflowStep, DEFAULT_WORKFLOWS } from "@/types/workflow";
import { ACTIVITY_NATURE_LABELS, ActivityNature } from "@/types/project";
import { cn } from "@/lib/utils";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";

const STEP_COLORS = [
  { value: "bg-slate-500", label: "Gris" },
  { value: "bg-blue-500", label: "Bleu" },
  { value: "bg-amber-500", label: "Orange" },
  { value: "bg-purple-500", label: "Violet" },
  { value: "bg-indigo-500", label: "Indigo" },
  { value: "bg-green-500", label: "Vert" },
  { value: "bg-red-500", label: "Rouge" },
  { value: "bg-pink-500", label: "Rose" },
];

const ReferentielWorkflows = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>(DEFAULT_WORKFLOWS);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [selectedNature, setSelectedNature] = useState<string>("all");

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    natures: [] as string[],
    steps: [] as WorkflowStep[],
  });

  const filteredWorkflows = workflows.filter((wf) => {
    const matchesSearch =
      wf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wf.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNature =
      selectedNature === "all" || wf.natures.includes(selectedNature);
    return matchesSearch && matchesNature;
  });

  const openCreateDialog = () => {
    setEditingWorkflow(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      natures: [],
      steps: [
        { id: `step-${Date.now()}`, code: "DEM", name: "Démarré", order: 1, color: "bg-blue-500" },
        { id: `step-${Date.now() + 1}`, code: "TERM", name: "Terminé", order: 2, isFinal: true, color: "bg-green-500" },
      ],
    });
    setDialogOpen(true);
  };

  const openEditDialog = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      code: workflow.code,
      name: workflow.name,
      description: workflow.description || "",
      natures: workflow.natures,
      steps: [...workflow.steps],
    });
    setDialogOpen(true);
  };

  const addStep = () => {
    const newOrder = formData.steps.length + 1;
    setFormData({
      ...formData,
      steps: [
        ...formData.steps.filter(s => !s.isFinal),
        {
          id: `step-${Date.now()}`,
          code: `STEP${newOrder}`,
          name: `Étape ${newOrder}`,
          order: newOrder,
          color: "bg-slate-500",
        },
        ...formData.steps.filter(s => s.isFinal).map(s => ({ ...s, order: newOrder + 1 })),
      ],
    });
  };

  const removeStep = (stepId: string) => {
    if (formData.steps.length <= 2) {
      toast.error("Un workflow doit avoir au moins 2 étapes");
      return;
    }
    const newSteps = formData.steps
      .filter(s => s.id !== stepId)
      .map((s, idx) => ({ ...s, order: idx + 1 }));
    setFormData({ ...formData, steps: newSteps });
  };

  const updateStep = (stepId: string, field: keyof WorkflowStep, value: string | boolean) => {
    setFormData({
      ...formData,
      steps: formData.steps.map(s =>
        s.id === stepId ? { ...s, [field]: value } : s
      ),
    });
  };

  const toggleNature = (nature: string) => {
    if (formData.natures.includes(nature)) {
      setFormData({ ...formData, natures: formData.natures.filter(n => n !== nature) });
    } else {
      setFormData({ ...formData, natures: [...formData.natures, nature] });
    }
  };

  const handleSave = () => {
    if (!formData.code || !formData.name || formData.natures.length === 0) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    if (formData.steps.length < 2) {
      toast.error("Un workflow doit avoir au moins 2 étapes");
      return;
    }

    const now = new Date().toISOString().split('T')[0];
    if (editingWorkflow) {
      setWorkflows(workflows.map(wf =>
        wf.id === editingWorkflow.id
          ? { ...wf, ...formData, updatedAt: now }
          : wf
      ));
      toast.success("Workflow modifié avec succès");
    } else {
      const newWorkflow: Workflow = {
        id: `wf-${Date.now()}`,
        ...formData,
        createdAt: now,
        updatedAt: now,
      };
      setWorkflows([...workflows, newWorkflow]);
      toast.success("Workflow créé avec succès");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const wf = workflows.find(w => w.id === id);
    if (wf?.isDefault) {
      toast.error("Impossible de supprimer un workflow par défaut");
      return;
    }
    setWorkflows(workflows.filter(w => w.id !== id));
    toast.success("Workflow supprimé");
  };

  const handleExportCSV = () => {
    const data = workflows.map(wf => ({
      Code: wf.code,
      Nom: wf.name,
      Description: wf.description || "",
      Natures: wf.natures.map(n => ACTIVITY_NATURE_LABELS[n as ActivityNature] || n).join(", "),
      NbEtapes: wf.steps.length,
      Etapes: wf.steps.map(s => s.name).join(" → "),
    }));
    const columns = [
      { key: "Code", header: "Code" },
      { key: "Nom", header: "Nom" },
      { key: "Natures", header: "Natures d'activité" },
      { key: "NbEtapes", header: "Nb étapes" },
      { key: "Etapes", header: "Étapes" },
    ];
    exportToCSV(data, columns, "workflows");
  };

  const handleExportPDF = () => {
    const data = workflows.map(wf => ({
      Code: wf.code,
      Nom: wf.name,
      Natures: wf.natures.map(n => ACTIVITY_NATURE_LABELS[n as ActivityNature] || n).join(", "),
      NbEtapes: wf.steps.length,
      Etapes: wf.steps.map(s => s.name).join(" → "),
    }));
    const columns = [
      { key: "Code", header: "Code", width: "10%" },
      { key: "Nom", header: "Nom", width: "20%" },
      { key: "Natures", header: "Natures d'activité", width: "20%" },
      { key: "NbEtapes", header: "Nb étapes", width: "10%" },
      { key: "Etapes", header: "Étapes", width: "40%" },
    ];
    exportToPDF("Référentiel Workflows", data, columns, "workflows");
  };

  return (
    <DashboardLayout title="Référentiel Workflows" subtitle="Gérer les workflows de suivi par nature d'activité">
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={selectedNature} onValueChange={setSelectedNature}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Nature" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {Object.entries(ACTIVITY_NATURE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-1" />
              PDF
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-1" />
              Nouveau workflow
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xl font-bold">{workflows.length}</p>
                  <p className="text-xs text-muted-foreground">Total workflows</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-secondary/20 text-secondary text-xs">Défaut</Badge>
                <div>
                  <p className="text-xl font-bold">{workflows.filter(w => w.isDefault).length}</p>
                  <p className="text-xs text-muted-foreground">Par défaut</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary text-xs">Custom</Badge>
                <div>
                  <p className="text-xl font-bold">{workflows.filter(w => !w.isDefault).length}</p>
                  <p className="text-xs text-muted-foreground">Personnalisés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Σ</span>
                <div>
                  <p className="text-xl font-bold">
                    {workflows.reduce((sum, w) => sum + w.steps.length, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total étapes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflows list */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Workflows ({filteredWorkflows.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Natures</TableHead>
                  <TableHead>Étapes</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkflows.map((wf) => (
                  <TableRow 
                    key={wf.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedWorkflow(wf);
                      setDetailDialogOpen(true);
                    }}
                  >
                    <TableCell className="font-mono text-xs">{wf.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{wf.name}</span>
                        {wf.isDefault && (
                          <Badge variant="outline" className="text-xs">Défaut</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {wf.natures.slice(0, 2).map(n => (
                          <Badge key={n} variant="secondary" className="text-xs">
                            {ACTIVITY_NATURE_LABELS[n as ActivityNature] || n}
                          </Badge>
                        ))}
                        {wf.natures.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{wf.natures.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {wf.steps.map((step, idx) => (
                          <div key={step.id} className="flex items-center">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                step.color || "bg-slate-500"
                              )}
                              title={step.name}
                            />
                            {idx < wf.steps.length - 1 && (
                              <ArrowRight className="w-3 h-3 text-muted-foreground mx-0.5" />
                            )}
                          </div>
                        ))}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({wf.steps.length})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditDialog(wf)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        {!wf.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDelete(wf.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingWorkflow ? "Modifier le workflow" : "Nouveau workflow"}
              </DialogTitle>
              <DialogDescription>
                Définissez les étapes du workflow pour le suivi d'avancement
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Code *</label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="WF-XXX"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Nom *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Workflow..."
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du workflow..."
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Natures d'activité concernées *</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(ACTIVITY_NATURE_LABELS).map(([key, label]) => (
                    <Badge
                      key={key}
                      variant={formData.natures.includes(key) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleNature(key)}
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Étapes du workflow</label>
                  <Button variant="outline" size="sm" onClick={addStep}>
                    <Plus className="w-3 h-3 mr-1" />
                    Ajouter
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.steps
                    .sort((a, b) => a.order - b.order)
                    .map((step, idx) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30"
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground w-4">{step.order}</span>
                        <Input
                          value={step.code}
                          onChange={(e) => updateStep(step.id, "code", e.target.value)}
                          placeholder="Code"
                          className="w-20 h-8 text-xs"
                        />
                        <Input
                          value={step.name}
                          onChange={(e) => updateStep(step.id, "name", e.target.value)}
                          placeholder="Nom de l'étape"
                          className="flex-1 h-8 text-sm"
                        />
                        <Select
                          value={step.color || "bg-slate-500"}
                          onValueChange={(v) => updateStep(step.id, "color", v)}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-3 h-3 rounded-full", step.color || "bg-slate-500")} />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {STEP_COLORS.map(c => (
                              <SelectItem key={c.value} value={c.value}>
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-3 h-3 rounded-full", c.value)} />
                                  <span>{c.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={step.isFinal || false}
                            onChange={(e) => updateStep(step.id, "isFinal", e.target.checked)}
                          />
                          Final
                        </label>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeStep(step.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Aperçu du workflow</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {formData.steps
                    .sort((a, b) => a.order - b.order)
                    .map((step, idx) => (
                      <div key={step.id} className="flex items-center">
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-background border">
                          <div className={cn("w-2 h-2 rounded-full", step.color)} />
                          <span className="text-xs">{step.name}</span>
                          {step.isFinal && <Badge variant="outline" className="text-[10px] ml-1">Fin</Badge>}
                        </div>
                        {idx < formData.steps.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-muted-foreground mx-1" />
                        )}
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave}>
                  {editingWorkflow ? "Enregistrer" : "Créer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Détail Workflow */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-primary" />
                Fiche Workflow
              </DialogTitle>
              <DialogDescription>
                Détails du workflow sélectionné
              </DialogDescription>
            </DialogHeader>
            {selectedWorkflow && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{selectedWorkflow.code}</span>
                    {selectedWorkflow.isDefault && (
                      <Badge variant="outline">Défaut</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {selectedWorkflow.updatedAt || selectedWorkflow.createdAt}
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Nom</p>
                    <p className="font-semibold text-lg">{selectedWorkflow.name}</p>
                  </div>
                  {selectedWorkflow.description && (
                    <div>
                      <p className="text-xs text-muted-foreground">Description</p>
                      <p className="text-sm">{selectedWorkflow.description}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Natures d'activité</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedWorkflow.natures.map((n) => (
                      <Badge key={n} variant="secondary" className="text-xs">
                        {ACTIVITY_NATURE_LABELS[n as ActivityNature] || n}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    Étapes ({selectedWorkflow.steps.length})
                  </p>
                  <div className="space-y-2">
                    {selectedWorkflow.steps.map((step, idx) => (
                      <div key={step.id} className="flex items-center gap-2 p-2 border rounded-lg bg-background">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                          {idx + 1}
                        </div>
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full",
                            step.color || "bg-slate-500"
                          )}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{step.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{step.code}</p>
                        </div>
                        {step.isFinal && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Final
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={() => setDetailDialogOpen(false)}>
                    Fermer
                  </Button>
                  <Button size="sm" onClick={() => {
                    setDetailDialogOpen(false);
                    openEditDialog(selectedWorkflow);
                  }}>
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ReferentielWorkflows;
