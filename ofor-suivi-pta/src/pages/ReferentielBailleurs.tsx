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
  Landmark,
  Mail,
  Globe,
  Phone,
  Eye,
  MapPin,
  User,
} from "lucide-react";
import { toast } from "sonner";
import ExportButtons from "@/components/ui/ExportButtons";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import {
  mockBailleurs,
  Bailleur,
  BailleurType,
  BAILLEUR_TYPE_LABELS,
} from "@/data/bailleurs";

const ReferentielBailleurs = () => {
  const [bailleurs, setBailleurs] = useState<Bailleur[]>(mockBailleurs);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterActif, setFilterActif] = useState<"all" | "actif" | "inactif">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedBailleur, setSelectedBailleur] = useState<Bailleur | null>(null);
  const [formData, setFormData] = useState<Partial<Bailleur>>({
    code: "",
    nom: "",
    sigle: "",
    type: "multilateral",
    pays: "",
    adresse: "",
    telephone: "",
    email: "",
    siteWeb: "",
    responsable: "",
    actif: true,
  });

  const filteredBailleurs = bailleurs.filter((b) => {
    const matchSearch =
      b.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.sigle && b.sigle.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchType = filterType === "all" || b.type === filterType;
    const matchActif =
      filterActif === "all" ||
      (filterActif === "actif" && b.actif) ||
      (filterActif === "inactif" && !b.actif);
    return matchSearch && matchType && matchActif;
  });

  const handleOpenDialog = (b?: Bailleur) => {
    if (b) {
      setSelectedBailleur(b);
      setFormData(b);
    } else {
      setSelectedBailleur(null);
      setFormData({
        code: "",
        nom: "",
        sigle: "",
        type: "multilateral",
        pays: "",
        adresse: "",
        telephone: "",
        email: "",
        siteWeb: "",
        responsable: "",
        actif: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!formData.code || !formData.nom || !formData.type) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (selectedBailleur) {
      setBailleurs((prev) =>
        prev.map((b) =>
          b.id === selectedBailleur.id ? { ...b, ...formData } as Bailleur : b
        )
      );
      toast.success("Bailleur modifié avec succès");
    } else {
      const newBailleur: Bailleur = {
        id: `bail-${Date.now()}`,
        code: formData.code!,
        nom: formData.nom!,
        sigle: formData.sigle,
        type: formData.type as BailleurType,
        pays: formData.pays,
        adresse: formData.adresse,
        telephone: formData.telephone,
        email: formData.email,
        siteWeb: formData.siteWeb,
        responsable: formData.responsable,
        actif: formData.actif ?? true,
      };
      setBailleurs((prev) => [...prev, newBailleur]);
      toast.success("Bailleur ajouté avec succès");
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (selectedBailleur) {
      setBailleurs((prev) => prev.filter((b) => b.id !== selectedBailleur.id));
      toast.success("Bailleur supprimé avec succès");
      setDeleteDialogOpen(false);
      setSelectedBailleur(null);
    }
  };

  const handleExportCSV = () => {
    const data = filteredBailleurs.map((b) => ({
      code: b.code,
      sigle: b.sigle || "",
      nom: b.nom,
      type: BAILLEUR_TYPE_LABELS[b.type],
      pays: b.pays || "",
      email: b.email || "",
      siteWeb: b.siteWeb || "",
      statut: b.actif ? "Actif" : "Inactif",
    }));

    exportToCSV(
      data,
      [
        { key: "code", header: "Code" },
        { key: "sigle", header: "Sigle" },
        { key: "nom", header: "Nom" },
        { key: "type", header: "Type" },
        { key: "pays", header: "Pays" },
        { key: "email", header: "Email" },
        { key: "siteWeb", header: "Site Web" },
        { key: "statut", header: "Statut" },
      ],
      "referentiel_bailleurs"
    );
    toast.success("Export CSV généré");
  };

  const handleExportPDF = () => {
    const data = filteredBailleurs.map((b) => ({
      code: b.code,
      sigle: b.sigle || "-",
      nom: b.nom,
      type: BAILLEUR_TYPE_LABELS[b.type],
      pays: b.pays || "-",
      contact: [b.email, b.siteWeb].filter(Boolean).join(" | ") || "-",
      statut: b.actif ? "Actif" : "Inactif",
    }));

    exportToPDF(
      "Référentiel des Bailleurs",
      data,
      [
        { key: "code", header: "Code", width: "8%" },
        { key: "sigle", header: "Sigle", width: "10%" },
        { key: "nom", header: "Nom", width: "25%" },
        { key: "type", header: "Type", width: "15%" },
        { key: "pays", header: "Pays", width: "12%" },
        { key: "contact", header: "Contact", width: "22%" },
        { key: "statut", header: "Statut", width: "8%" },
      ],
      "referentiel_bailleurs",
      {
        subtitle: "Liste des bailleurs et partenaires financiers",
        summary: [
          { label: "Total", value: String(filteredBailleurs.length) },
          { label: "Actifs", value: String(filteredBailleurs.filter((b) => b.actif).length) },
        ],
      }
    );
    toast.success("Export PDF généré");
  };

  return (
    <DashboardLayout title="Bailleurs" subtitle="Gestion des partenaires financiers">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
              <Landmark className="w-6 h-6 text-primary" />
              Bailleurs
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestion des partenaires financiers et bailleurs de fonds
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
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {Object.entries(BAILLEUR_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterActif} onValueChange={(v) => setFilterActif(v as any)}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="actif">Actifs</SelectItem>
              <SelectItem value="inactif">Inactifs</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary">{filteredBailleurs.length} résultats</Badge>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px]">Code</TableHead>
                <TableHead className="w-[80px]">Sigle</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="w-[80px]">Statut</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBailleurs.map((b) => (
                <TableRow 
                  key={b.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedBailleur(b);
                    setDetailDialogOpen(true);
                  }}
                >
                  <TableCell className="font-mono text-xs font-medium">{b.code}</TableCell>
                  <TableCell className="font-medium text-sm">{b.sigle || "-"}</TableCell>
                  <TableCell>
                    <p className="font-medium text-sm truncate max-w-[200px]">{b.nom}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {BAILLEUR_TYPE_LABELS[b.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {b.pays || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      {b.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{b.email}</span>
                        </div>
                      )}
                      {b.siteWeb && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Globe className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{b.siteWeb}</span>
                        </div>
                      )}
                      {b.telephone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {b.telephone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={b.actif ? "default" : "secondary"} className="text-xs">
                      {b.actif ? "Actif" : "Inactif"}
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
                          setSelectedBailleur(b);
                          setDetailDialogOpen(true);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          Voir détail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenDialog(b)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedBailleur(b);
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
              ))}
              {filteredBailleurs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucun bailleur trouvé
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
              {selectedBailleur ? "Modifier le bailleur" : "Ajouter un bailleur"}
            </DialogTitle>
            <DialogDescription>
              {selectedBailleur
                ? "Modifiez les informations du bailleur"
                : "Remplissez les informations pour ajouter un nouveau bailleur"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Code *</Label>
                <Input
                  value={formData.code || ""}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="BM"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sigle</Label>
                <Input
                  value={formData.sigle || ""}
                  onChange={(e) => setFormData({ ...formData, sigle: e.target.value.toUpperCase() })}
                  placeholder="BM"
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

            <div className="space-y-1.5">
              <Label className="text-xs">Nom complet *</Label>
              <Input
                value={formData.nom || ""}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Banque Mondiale"
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as BailleurType })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BAILLEUR_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Pays</Label>
                <Input
                  value={formData.pays || ""}
                  onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                  placeholder="International"
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Adresse</Label>
              <Input
                value={formData.adresse || ""}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                className="h-9"
              />
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Site Web</Label>
                <Input
                  value={formData.siteWeb || ""}
                  onChange={(e) => setFormData({ ...formData, siteWeb: e.target.value })}
                  placeholder="www.example.org"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Responsable</Label>
                <Input
                  value={formData.responsable || ""}
                  onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {selectedBailleur ? "Enregistrer" : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le bailleur "{selectedBailleur?.nom}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Détail Bailleur */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-primary" />
              Fiche Bailleur
            </DialogTitle>
            <DialogDescription>
              Détails du bailleur sélectionné
            </DialogDescription>
          </DialogHeader>
          {selectedBailleur && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={selectedBailleur.actif ? "default" : "secondary"}>
                  {selectedBailleur.actif ? "Actif" : "Inactif"}
                </Badge>
                <div className="text-right">
                  <span className="font-mono text-sm font-medium">{selectedBailleur.code}</span>
                  {selectedBailleur.sigle && (
                    <span className="ml-2 text-muted-foreground">({selectedBailleur.sigle})</span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Nom complet</p>
                  <p className="font-semibold text-lg">{selectedBailleur.nom}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <Badge variant="outline" className="mt-1">
                      {BAILLEUR_TYPE_LABELS[selectedBailleur.type]}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pays</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{selectedBailleur.pays || "-"}</span>
                    </div>
                  </div>
                </div>
                {selectedBailleur.adresse && (
                  <div>
                    <p className="text-xs text-muted-foreground">Adresse</p>
                    <p className="font-medium">{selectedBailleur.adresse}</p>
                  </div>
                )}
                {selectedBailleur.responsable && (
                  <div>
                    <p className="text-xs text-muted-foreground">Responsable</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{selectedBailleur.responsable}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Contact</p>
                <div className="space-y-2">
                  {selectedBailleur.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${selectedBailleur.email}`} className="text-primary hover:underline">
                        {selectedBailleur.email}
                      </a>
                    </div>
                  )}
                  {selectedBailleur.telephone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${selectedBailleur.telephone}`} className="text-primary hover:underline">
                        {selectedBailleur.telephone}
                      </a>
                    </div>
                  )}
                  {selectedBailleur.siteWeb && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a href={selectedBailleur.siteWeb} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {selectedBailleur.siteWeb}
                      </a>
                    </div>
                  )}
                  {!selectedBailleur.email && !selectedBailleur.telephone && !selectedBailleur.siteWeb && (
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
                  handleOpenDialog(selectedBailleur);
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

export default ReferentielBailleurs;
