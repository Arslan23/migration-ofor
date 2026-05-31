import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  Mail,
  Phone,
  Building2,
  Eye,
  User,
  Filter,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import ExportButtons from "@/components/ui/ExportButtons";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import {
  mockPersonnel,
  Personnel,
  getPersonnelFullName,
} from "@/data/personnel";
import { 
  mockEntitesExecution, 
  getEntiteById, 
  mockServices, 
  getServiceById,
  getServicesByEntite,
  Service,
} from "@/data/entitesExecution";

const ReferentielPersonnel = () => {
  const [personnel, setPersonnel] = useState<Personnel[]>(mockPersonnel);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActif, setFilterActif] = useState<"all" | "actif" | "inactif">("all");
  const [filterEntite, setFilterEntite] = useState<string>("all");
  const [filterService, setFilterService] = useState<string>("all");
  const [filterFonction, setFilterFonction] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [formData, setFormData] = useState<Partial<Personnel & { serviceId?: string }>>({
    matricule: "",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    fonction: "",
    direction: "",
    entiteId: "",
    serviceId: "",
    actif: true,
  });

  // Get unique fonctions for filter
  const uniqueFonctions = [...new Set(personnel.map(p => p.fonction).filter(Boolean))];

  // Get services based on selected entity
  const availableServices = formData.entiteId 
    ? getServicesByEntite(formData.entiteId).filter(s => s.actif)
    : [];

  const filteredPersonnel = personnel.filter((p) => {
    const matchSearch =
      p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fonction.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.direction?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchActif =
      filterActif === "all" ||
      (filterActif === "actif" && p.actif) ||
      (filterActif === "inactif" && !p.actif);
    const matchEntite = filterEntite === "all" || p.entiteId === filterEntite;
    const matchService = filterService === "all" || p.direction === filterService;
    const matchFonction = filterFonction === "all" || p.fonction === filterFonction;
    return matchSearch && matchActif && matchEntite && matchService && matchFonction;
  });

  const handleOpenDialog = (p?: Personnel) => {
    if (p) {
      setSelectedPersonnel(p);
      setFormData(p);
    } else {
      setSelectedPersonnel(null);
      setFormData({
        matricule: "",
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        fonction: "",
        direction: "",
        entiteId: "",
        actif: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.matricule || !formData.nom || !formData.prenom || !formData.fonction) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (selectedPersonnel) {
      setPersonnel((prev) =>
        prev.map((p) =>
          p.id === selectedPersonnel.id ? { ...p, ...formData } as Personnel : p
        )
      );
      toast.success("Personnel modifié avec succès");
    } else {
      const newPersonnel: Personnel = {
        id: `pers-${Date.now()}`,
        matricule: formData.matricule!,
        nom: formData.nom!,
        prenom: formData.prenom!,
        email: formData.email,
        telephone: formData.telephone,
        fonction: formData.fonction!,
        direction: formData.direction,
        entiteId: formData.entiteId,
        actif: formData.actif ?? true,
      };
      setPersonnel((prev) => [...prev, newPersonnel]);
      toast.success("Personnel ajouté avec succès");
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (selectedPersonnel) {
      setPersonnel((prev) => prev.filter((p) => p.id !== selectedPersonnel.id));
      toast.success("Personnel supprimé avec succès");
      setDeleteDialogOpen(false);
      setSelectedPersonnel(null);
    }
  };

  const handleExportCSV = () => {
    const data = filteredPersonnel.map((p) => ({
      matricule: p.matricule,
      nom: p.nom,
      prenom: p.prenom,
      nomComplet: getPersonnelFullName(p),
      fonction: p.fonction,
      direction: p.direction || "",
      entite: p.entiteId ? getEntiteById(p.entiteId)?.nom || "" : "",
      email: p.email || "",
      telephone: p.telephone || "",
      statut: p.actif ? "Actif" : "Inactif",
    }));

    exportToCSV(
      data,
      [
        { key: "matricule", header: "Matricule" },
        { key: "nomComplet", header: "Nom complet" },
        { key: "fonction", header: "Fonction" },
        { key: "direction", header: "Direction" },
        { key: "entite", header: "Entité" },
        { key: "email", header: "Email" },
        { key: "telephone", header: "Téléphone" },
        { key: "statut", header: "Statut" },
      ],
      "referentiel_personnel"
    );
    toast.success("Export CSV généré");
  };

  const handleExportPDF = () => {
    const data = filteredPersonnel.map((p) => ({
      matricule: p.matricule,
      nomComplet: getPersonnelFullName(p),
      fonction: p.fonction,
      direction: p.direction || "-",
      entite: p.entiteId ? getEntiteById(p.entiteId)?.nom || "-" : "-",
      email: p.email || "-",
      telephone: p.telephone || "-",
      statut: p.actif ? "Actif" : "Inactif",
    }));

    exportToPDF(
      "Référentiel du Personnel",
      data,
      [
        { key: "matricule", header: "Matricule", width: "10%" },
        { key: "nomComplet", header: "Nom complet", width: "18%" },
        { key: "fonction", header: "Fonction", width: "15%" },
        { key: "direction", header: "Direction", width: "15%" },
        { key: "entite", header: "Entité", width: "15%" },
        { key: "email", header: "Email", width: "15%" },
        { key: "statut", header: "Statut", width: "7%" },
      ],
      "referentiel_personnel",
      {
        subtitle: "Liste du personnel enregistré",
        summary: [
          { label: "Total", value: String(filteredPersonnel.length) },
          { label: "Actifs", value: String(filteredPersonnel.filter((p) => p.actif).length) },
          { label: "Inactifs", value: String(filteredPersonnel.filter((p) => !p.actif).length) },
        ],
      }
    );
    toast.success("Export PDF généré");
  };

  return (
    <DashboardLayout title="Référentiel Personnel" subtitle="Gestion du personnel">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Référentiel Personnel
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestion du personnel pour l'affectation aux projets
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButtons onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
            <Button onClick={() => handleOpenDialog()} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={filterEntite} onValueChange={setFilterEntite}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="Entité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes entités</SelectItem>
              {mockEntitesExecution.filter(e => e.actif).map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterService} onValueChange={setFilterService}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous services</SelectItem>
              {mockServices.filter(s => s.actif).map((s) => (
                <SelectItem key={s.id} value={s.nom}>
                  {s.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterFonction} onValueChange={setFilterFonction}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Fonction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes fonctions</SelectItem>
              {uniqueFonctions.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterActif} onValueChange={(v) => setFilterActif(v as any)}>
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="actif">Actifs</SelectItem>
              <SelectItem value="inactif">Inactifs</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary">{filteredPersonnel.length} résultats</Badge>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Matricule</TableHead>
                <TableHead>Nom complet</TableHead>
                <TableHead>Fonction</TableHead>
                <TableHead>Entité</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="w-[80px]">Statut</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPersonnel.map((p) => {
                const entite = p.entiteId ? getEntiteById(p.entiteId) : null;
                const service = mockServices.find(s => s.nom === p.direction);
                return (
                  <TableRow 
                    key={p.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedPersonnel(p);
                      setDetailDialogOpen(true);
                    }}
                  >
                    <TableCell className="font-mono text-xs">{p.matricule}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getPersonnelFullName(p)}</p>
                        {p.direction && (
                          <p className="text-xs text-muted-foreground">{p.direction}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{p.fonction}</TableCell>
                    <TableCell>
                      {entite ? (
                        <div className="flex items-center gap-1 text-xs">
                          <Building2 className="w-3 h-3" />
                          {entite.code}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        {p.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{p.email}</span>
                          </div>
                        )}
                        {p.telephone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {p.telephone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.actif ? "default" : "secondary"} className="text-xs">
                        {p.actif ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedPersonnel(p);
                            setDetailDialogOpen(true);
                          }}>
                            <Eye className="w-4 h-4 mr-2" />
                            Voir détail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenDialog(p)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedPersonnel(p);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredPersonnel.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun personnel trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog Formulaire */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedPersonnel ? "Modifier le personnel" : "Ajouter un personnel"}
            </DialogTitle>
            <DialogDescription>
              {selectedPersonnel
                ? "Modifiez les informations du personnel"
                : "Remplissez les informations pour ajouter un nouveau personnel"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Matricule *</Label>
                <Input
                  value={formData.matricule || ""}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                  placeholder="OFOR-XXX"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Statut</Label>
                <div className="flex items-center gap-2 h-9">
                  <Switch
                    checked={formData.actif}
                    onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
                  />
                  <span className="text-sm">{formData.actif ? "Actif" : "Inactif"}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Prénom *</Label>
                <Input
                  value={formData.prenom || ""}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nom *</Label>
                <Input
                  value={formData.nom || ""}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Fonction *</Label>
                <Input
                  value={formData.fonction || ""}
                  onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Entité d'exécution</Label>
                <Select
                  value={formData.entiteId || "none"}
                  onValueChange={(v) => setFormData({ 
                    ...formData, 
                    entiteId: v === "none" ? "" : v,
                    serviceId: "",
                    direction: ""
                  })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Sélectionner une entité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {mockEntitesExecution
                      .filter((e) => e.actif)
                      .map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.code} - {e.nom}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Direction / Service (optionnel)</Label>
              <Select
                value={formData.serviceId || "none"}
                onValueChange={(v) => {
                  const selectedService = v !== "none" ? getServiceById(v) : null;
                  setFormData({ 
                    ...formData, 
                    serviceId: v === "none" ? "" : v,
                    direction: selectedService?.nom || ""
                  });
                }}
                disabled={!formData.entiteId}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={formData.entiteId ? "Sélectionner un service" : "Sélectionnez d'abord une entité"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {availableServices.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code} - {s.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Téléphone</Label>
                <Input
                  value={formData.telephone || ""}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {selectedPersonnel ? "Enregistrer" : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer{" "}
              <strong>{selectedPersonnel && getPersonnelFullName(selectedPersonnel)}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Détail Personnel */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Fiche Personnel
            </DialogTitle>
            <DialogDescription>
              Détails du personnel sélectionné
            </DialogDescription>
          </DialogHeader>
          {selectedPersonnel && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={selectedPersonnel.actif ? "default" : "secondary"}>
                  {selectedPersonnel.actif ? "Actif" : "Inactif"}
                </Badge>
                <span className="font-mono text-sm text-muted-foreground">
                  {selectedPersonnel.matricule}
                </span>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Nom complet</p>
                  <p className="font-semibold text-lg">{getPersonnelFullName(selectedPersonnel)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Fonction</p>
                    <p className="font-medium">{selectedPersonnel.fonction}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Direction</p>
                    <p className="font-medium">{selectedPersonnel.direction || "-"}</p>
                  </div>
                </div>
                {selectedPersonnel.entiteId && (
                  <div>
                    <p className="text-xs text-muted-foreground">Entité d'exécution</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {getEntiteById(selectedPersonnel.entiteId)?.nom || "-"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Contact</p>
                <div className="space-y-2">
                  {selectedPersonnel.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${selectedPersonnel.email}`} className="text-primary hover:underline">
                        {selectedPersonnel.email}
                      </a>
                    </div>
                  )}
                  {selectedPersonnel.telephone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${selectedPersonnel.telephone}`} className="text-primary hover:underline">
                        {selectedPersonnel.telephone}
                      </a>
                    </div>
                  )}
                  {!selectedPersonnel.email && !selectedPersonnel.telephone && (
                    <p className="text-sm text-muted-foreground italic">Aucun contact renseigné</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setDetailDialogOpen(false)}>
                  Fermer
                </Button>
                <Button size="sm" onClick={() => {
                  setDetailDialogOpen(false);
                  handleOpenDialog(selectedPersonnel);
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

export default ReferentielPersonnel;
