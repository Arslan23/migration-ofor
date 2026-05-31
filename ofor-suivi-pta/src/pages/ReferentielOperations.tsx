import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Workflow,
  ChevronRight,
  Power,
} from "lucide-react";
import { toast } from "sonner";
import ExportButtons from "@/components/ui/ExportButtons";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { mockOperations, Operation, OPERATION_NATURES, OperationNature } from "@/data/operations";
import { mockServices, getServiceById } from "@/data/entitesExecution";
import OperationDetail from "@/components/referentiel/OperationDetail";

const ReferentielOperations = () => {
  const [operations, setOperations] = useState<Operation[]>(mockOperations);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterService, setFilterService] = useState<string>("all");
  const [filterStatut, setFilterStatut] = useState<"all" | "actif" | "inactif">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOperation, setDetailOperation] = useState<Operation | null>(null);
  const [selected, setSelected] = useState<Operation | null>(null);
  const [formData, setFormData] = useState<Partial<Operation>>({
    code: "",
    libelle: "",
    serviceId: "",
    nature: undefined,
    description: "",
    actif: true,
  });

  const services = useMemo(() => mockServices.filter(s => s.actif), []);

  const filtered = operations.filter(op => {
    const matchSearch =
      op.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchService = filterService === "all" || op.serviceId === filterService;
    const matchStatut =
      filterStatut === "all" ||
      (filterStatut === "actif" && op.actif) ||
      (filterStatut === "inactif" && !op.actif);
    return matchSearch && matchService && matchStatut;
  });

  // Grouper par service
  const grouped = useMemo(() => {
    const map = new Map<string, Operation[]>();
    filtered.forEach(op => {
      if (!map.has(op.serviceId)) map.set(op.serviceId, []);
      map.get(op.serviceId)!.push(op);
    });
    return Array.from(map.entries())
      .map(([serviceId, ops]) => ({
        service: getServiceById(serviceId),
        serviceId,
        operations: ops.sort((a, b) => a.code.localeCompare(b.code)),
      }))
      .sort((a, b) => (a.service?.nom || "").localeCompare(b.service?.nom || ""));
  }, [filtered]);

  const handleOpen = (op?: Operation) => {
    if (op) {
      setSelected(op);
      setFormData(op);
    } else {
      setSelected(null);
      setFormData({ code: "", libelle: "", serviceId: "", nature: undefined, description: "", actif: true });
    }
    setDialogOpen(true);
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!formData.code || !formData.libelle || !formData.serviceId) {
      toast.error("Veuillez renseigner code, libellé et service");
      return;
    }
    if (selected) {
      setOperations(prev => prev.map(o => (o.id === selected.id ? { ...o, ...formData } as Operation : o)));
      toast.success("Opération modifiée");
    } else {
      const newOp: Operation = {
        id: `op-${Date.now()}`,
        code: formData.code!,
        libelle: formData.libelle!,
        serviceId: formData.serviceId!,
        nature: formData.nature,
        description: formData.description,
        actif: formData.actif ?? true,
      };
      setOperations(prev => [...prev, newOp]);
      toast.success("Opération ajoutée");
    }
    setDialogOpen(false);
  };

  const toggleActif = (op: Operation) => {
    setOperations(prev => prev.map(o => (o.id === op.id ? { ...o, actif: !o.actif } : o)));
    toast.success(op.actif ? "Opération désactivée" : "Opération activée");
  };

  const handleExportCSV = () => {
    const data = filtered.map(o => ({
      service: getServiceById(o.serviceId)?.nom || "-",
      code: o.code,
      libelle: o.libelle,
      nature: o.nature || "-",
      description: o.description || "",
      statut: o.actif ? "Actif" : "Inactif",
    }));
    exportToCSV(
      data,
      [
        { key: "service", header: "Service" },
        { key: "code", header: "Code" },
        { key: "libelle", header: "Libellé" },
        { key: "nature", header: "Nature" },
        { key: "description", header: "Description" },
        { key: "statut", header: "Statut" },
      ],
      "referentiel_operations"
    );
    toast.success("Export CSV généré");
  };

  const handleExportPDF = () => {
    const data = filtered.map(o => ({
      service: getServiceById(o.serviceId)?.nom || "-",
      code: o.code,
      libelle: o.libelle,
      nature: o.nature || "-",
      description: o.description || "-",
      statut: o.actif ? "Actif" : "Inactif",
    }));
    exportToPDF(
      "Référentiel des Opérations",
      data,
      [
        { key: "service", header: "Service", width: "22%" },
        { key: "code", header: "Code", width: "10%" },
        { key: "libelle", header: "Libellé", width: "28%" },
        { key: "nature", header: "Nature", width: "13%" },
        { key: "description", header: "Description", width: "17%" },
        { key: "statut", header: "Statut", width: "10%" },
      ],
      "referentiel_operations",
      {
        subtitle: "Opérations institutionnelles par service",
        summary: [
          { label: "Total", value: String(filtered.length) },
          { label: "Actives", value: String(filtered.filter(o => o.actif).length) },
          { label: "Services", value: String(grouped.length) },
        ],
      }
    );
    toast.success("Export PDF généré");
  };

  return (
    <DashboardLayout title="Opérations" subtitle="Référentiel des opérations par service">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
              <Workflow className="w-6 h-6 text-primary" />
              Opérations
            </h1>
            <p className="text-sm text-muted-foreground">
              Activités institutionnelles récurrentes rattachées aux services
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButtons onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
            <Button onClick={() => handleOpen()} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher (code, libellé)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={filterService} onValueChange={setFilterService}>
            <SelectTrigger className="w-[260px] h-9">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les services</SelectItem>
              {services.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatut} onValueChange={v => setFilterStatut(v as any)}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="actif">Actifs</SelectItem>
              <SelectItem value="inactif">Inactifs</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary">{filtered.length} opérations</Badge>
        </div>

        {/* Listing groupé par service */}
        <div className="space-y-4">
          {grouped.map(group => (
            <div key={group.serviceId} className="border rounded-lg overflow-hidden">
              <div className="bg-muted/40 px-4 py-2 flex items-center gap-2 border-b">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-sm">{group.service?.nom || "Service inconnu"}</span>
                {group.service?.code && (
                  <Badge variant="outline" className="text-xs font-mono">{group.service.code}</Badge>
                )}
                <Badge variant="secondary" className="text-xs ml-auto">
                  {group.operations.length} opération{group.operations.length > 1 ? "s" : ""}
                </Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Code</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="w-[140px]">Nature</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Statut</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.operations.map(op => (
                    <TableRow
                      key={op.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => { setDetailOperation(op); setDetailOpen(true); }}
                    >
                      <TableCell className="font-mono text-xs font-medium">{op.code}</TableCell>
                      <TableCell className="font-medium text-sm">{op.libelle}</TableCell>
                      <TableCell>
                        {op.nature ? (
                          <Badge variant="outline" className="text-xs">{op.nature}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[300px]">
                        {op.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={op.actif ? "default" : "secondary"} className="text-xs">
                          {op.actif ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpen(op)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleActif(op)}>
                              <Power className="w-4 h-4 mr-2" />
                              {op.actif ? "Désactiver" : "Activer"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
          {grouped.length === 0 && (
            <div className="border rounded-lg py-12 text-center text-muted-foreground text-sm">
              Aucune opération trouvée
            </div>
          )}
        </div>
      </div>

      {/* Dialog Form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected ? "Modifier l'opération" : "Ajouter une opération"}</DialogTitle>
            <DialogDescription>
              {selected
                ? "Modifiez les informations de l'opération"
                : "Renseignez les informations de la nouvelle opération"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Service responsable *</Label>
              <Select
                value={formData.serviceId}
                onValueChange={v => setFormData({ ...formData, serviceId: v })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Sélectionner un service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Code *</Label>
                <Input
                  value={formData.code || ""}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="DAF-AUDIT"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs">Statut</Label>
                <div className="flex items-center gap-2 h-9">
                  <Switch
                    checked={formData.actif}
                    onCheckedChange={c => setFormData({ ...formData, actif: c })}
                  />
                  <span className="text-sm">{formData.actif ? "Actif" : "Inactif"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Libellé *</Label>
              <Input
                value={formData.libelle || ""}
                onChange={e => setFormData({ ...formData, libelle: e.target.value })}
                placeholder="Audit interne semestriel"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Nature d'activité</Label>
              <Select
                value={formData.nature || "__none__"}
                onValueChange={v => setFormData({ ...formData, nature: v === "__none__" ? undefined : (v as OperationNature) })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Sélectionner une nature" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Non spécifiée —</SelectItem>
                  {OPERATION_NATURES.map(n => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Héritée par défaut par les activités PTA rattachées à cette opération.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={formData.description || ""}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description optionnelle..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">{selected ? "Enregistrer" : "Ajouter"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <OperationDetail
        operation={detailOperation}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={(op) => { setDetailOpen(false); handleOpen(op); }}
      />
    </DashboardLayout>
  );
};

export default ReferentielOperations;
