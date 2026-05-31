import { useState, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  MapPin,
  ChevronRight,
  Eye,
  Users,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";
import ExportButtons from "@/components/ui/ExportButtons";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import {
  SENEGAL_GEO,
  getDepartementsByRegion,
  getCommunesByDepartement,
} from "@/data/geoData";

// Types pour le référentiel zones avec hiérarchie
type ZoneType = "region" | "departement" | "commune";

interface ZoneReferentiel {
  id: string;
  code: string;
  nom: string;
  type: ZoneType;
  parentId?: string;
  regionCode?: string;
  departementCode?: string;
  population?: number;
  superficie?: number;
  description?: string;
  actif: boolean;
}

const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  region: "Région",
  departement: "Département",
  commune: "Commune",
};

// Générer les données depuis geoData
const generateZonesFromGeo = (): ZoneReferentiel[] => {
  const zones: ZoneReferentiel[] = [];
  
  SENEGAL_GEO.forEach((region) => {
    zones.push({
      id: `reg-${region.code}`,
      code: region.code,
      nom: region.name,
      type: "region",
      actif: true,
    });
    
    region.departements.forEach((dept) => {
      zones.push({
        id: `dept-${dept.code}`,
        code: dept.code,
        nom: dept.name,
        type: "departement",
        parentId: `reg-${region.code}`,
        regionCode: region.code,
        actif: true,
      });
      
      dept.communes.forEach((commune) => {
        zones.push({
          id: `com-${commune.code}`,
          code: commune.code,
          nom: commune.name,
          type: "commune",
          parentId: `dept-${dept.code}`,
          regionCode: region.code,
          departementCode: dept.code,
          actif: true,
        });
      });
    });
  });
  
  return zones;
};

const formatNumber = (num?: number) => {
  if (!num) return "-";
  return num.toLocaleString("fr-FR");
};

const ReferentielZones = () => {
  const [zones, setZones] = useState<ZoneReferentiel[]>(generateZonesFromGeo());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [filterActif, setFilterActif] = useState<"all" | "actif" | "inactif">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ZoneReferentiel | null>(null);
  
  // Form state avec sélection en cascade
  const [formType, setFormType] = useState<ZoneType>("region");
  const [formRegionCode, setFormRegionCode] = useState<string>("");
  const [formDeptCode, setFormDeptCode] = useState<string>("");
  const [formData, setFormData] = useState<Partial<ZoneReferentiel>>({
    code: "",
    nom: "",
    population: undefined,
    superficie: undefined,
    description: "",
    actif: true,
  });

  // Options en cascade
  const regions = useMemo(() => SENEGAL_GEO.map((r) => ({ code: r.code, name: r.name })), []);
  const departements = useMemo(() => getDepartementsByRegion(formRegionCode), [formRegionCode]);
  const communes = useMemo(() => getCommunesByDepartement(formDeptCode), [formDeptCode]);

  // Obtenir le nom de la région parente
  const getRegionName = (zone: ZoneReferentiel) => {
    if (zone.type === "region") return "-";
    const region = SENEGAL_GEO.find((r) => r.code === zone.regionCode);
    return region?.name || "-";
  };

  // Obtenir le nom du département parent
  const getDeptName = (zone: ZoneReferentiel) => {
    if (zone.type !== "commune") return "-";
    for (const region of SENEGAL_GEO) {
      const dept = region.departements.find((d) => d.code === zone.departementCode);
      if (dept) return dept.name;
    }
    return "-";
  };

  const filteredZones = zones.filter((z) => {
    const matchSearch =
      z.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      z.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "all" || z.type === filterType;
    const matchRegion = filterRegion === "all" || 
      z.regionCode === filterRegion || 
      (z.type === "region" && z.code === filterRegion);
    const matchActif =
      filterActif === "all" ||
      (filterActif === "actif" && z.actif) ||
      (filterActif === "inactif" && !z.actif);
    return matchSearch && matchType && matchRegion && matchActif;
  });

  const handleOpenDialog = (z?: ZoneReferentiel) => {
    if (z) {
      setSelectedZone(z);
      setFormType(z.type);
      setFormRegionCode(z.regionCode || (z.type === "region" ? z.code : ""));
      setFormDeptCode(z.departementCode || "");
      setFormData({
        code: z.code,
        nom: z.nom,
        population: z.population,
        superficie: z.superficie,
        description: z.description,
        actif: z.actif,
      });
    } else {
      setSelectedZone(null);
      setFormType("region");
      setFormRegionCode("");
      setFormDeptCode("");
      setFormData({
        code: "",
        nom: "",
        population: undefined,
        superficie: undefined,
        description: "",
        actif: true,
      });
    }
    setDialogOpen(true);
  };

  const handleFormTypeChange = (type: ZoneType) => {
    setFormType(type);
    setFormRegionCode("");
    setFormDeptCode("");
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!formData.code || !formData.nom) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (formType === "departement" && !formRegionCode) {
      toast.error("Veuillez sélectionner une région");
      return;
    }

    if (formType === "commune" && (!formRegionCode || !formDeptCode)) {
      toast.error("Veuillez sélectionner une région et un département");
      return;
    }

    if (selectedZone) {
      setZones((prev) =>
        prev.map((z) =>
          z.id === selectedZone.id
            ? {
                ...z,
                ...formData,
                type: formType,
                regionCode: formType !== "region" ? formRegionCode : undefined,
                departementCode: formType === "commune" ? formDeptCode : undefined,
                parentId:
                  formType === "departement"
                    ? `reg-${formRegionCode}`
                    : formType === "commune"
                    ? `dept-${formDeptCode}`
                    : undefined,
              } as ZoneReferentiel
            : z
        )
      );
      toast.success("Zone modifiée avec succès");
    } else {
      const newZone: ZoneReferentiel = {
        id: `zone-${Date.now()}`,
        code: formData.code!,
        nom: formData.nom!,
        type: formType,
        regionCode: formType !== "region" ? formRegionCode : undefined,
        departementCode: formType === "commune" ? formDeptCode : undefined,
        parentId:
          formType === "departement"
            ? `reg-${formRegionCode}`
            : formType === "commune"
            ? `dept-${formDeptCode}`
            : undefined,
        population: formData.population,
        superficie: formData.superficie,
        description: formData.description,
        actif: formData.actif ?? true,
      };
      setZones((prev) => [...prev, newZone]);
      toast.success("Zone ajoutée avec succès");
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (selectedZone) {
      // Vérifier si des zones enfants existent
      const hasChildren = zones.some((z) => z.parentId === selectedZone.id);
      if (hasChildren) {
        toast.error("Impossible de supprimer: cette zone a des sous-zones");
        setDeleteDialogOpen(false);
        return;
      }
      setZones((prev) => prev.filter((z) => z.id !== selectedZone.id));
      toast.success("Zone supprimée avec succès");
      setDeleteDialogOpen(false);
      setSelectedZone(null);
    }
  };

  const handleExportCSV = () => {
    const data = filteredZones.map((z) => ({
      code: z.code,
      nom: z.nom,
      type: ZONE_TYPE_LABELS[z.type],
      region: getRegionName(z),
      departement: getDeptName(z),
      population: z.population || "",
      superficie: z.superficie || "",
      statut: z.actif ? "Actif" : "Inactif",
    }));

    exportToCSV(
      data,
      [
        { key: "code", header: "Code" },
        { key: "nom", header: "Nom" },
        { key: "type", header: "Type" },
        { key: "region", header: "Région" },
        { key: "departement", header: "Département" },
        { key: "population", header: "Population" },
        { key: "superficie", header: "Superficie (km²)" },
        { key: "statut", header: "Statut" },
      ],
      "referentiel_zones"
    );
    toast.success("Export CSV généré");
  };

  const handleExportPDF = () => {
    const data = filteredZones.map((z) => ({
      code: z.code,
      nom: z.nom,
      type: ZONE_TYPE_LABELS[z.type],
      hierarchie:
        z.type === "region"
          ? "-"
          : z.type === "departement"
          ? getRegionName(z)
          : `${getRegionName(z)} > ${getDeptName(z)}`,
      population: formatNumber(z.population),
      statut: z.actif ? "Actif" : "Inactif",
    }));

    exportToPDF(
      "Référentiel des Zones d'Intervention",
      data,
      [
        { key: "code", header: "Code", width: "10%" },
        { key: "nom", header: "Nom", width: "25%" },
        { key: "type", header: "Type", width: "12%" },
        { key: "hierarchie", header: "Hiérarchie", width: "28%" },
        { key: "population", header: "Population", width: "15%" },
        { key: "statut", header: "Statut", width: "10%" },
      ],
      "referentiel_zones",
      {
        subtitle: "Liste des zones d'intervention avec hiérarchie",
        summary: [
          { label: "Total", value: String(filteredZones.length) },
          { label: "Régions", value: String(filteredZones.filter((z) => z.type === "region").length) },
          { label: "Départements", value: String(filteredZones.filter((z) => z.type === "departement").length) },
          { label: "Communes", value: String(filteredZones.filter((z) => z.type === "commune").length) },
        ],
      }
    );
    toast.success("Export PDF généré");
  };

  return (
    <DashboardLayout title="Zones d'Intervention" subtitle="Gestion hiérarchique des zones géographiques">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              Zones d'Intervention
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Hiérarchie: Région <ChevronRight className="w-3 h-3" /> Département <ChevronRight className="w-3 h-3" /> Commune
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
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="all">Tous les types</SelectItem>
              {Object.entries(ZONE_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterRegion} onValueChange={setFilterRegion}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Région" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="all">Toutes les régions</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r.code} value={r.code}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterActif} onValueChange={(v) => setFilterActif(v as any)}>
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="actif">Actifs</SelectItem>
              <SelectItem value="inactif">Inactifs</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary">{filteredZones.length} résultats</Badge>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead>Hiérarchie</TableHead>
                <TableHead className="text-right w-[100px]">Population</TableHead>
                <TableHead className="w-[70px]">Statut</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredZones.slice(0, 100).map((z) => (
                <TableRow 
                  key={z.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedZone(z);
                    setDetailDialogOpen(true);
                  }}
                >
                  <TableCell className="font-mono text-xs font-medium">{z.code}</TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{z.nom}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={z.type === "region" ? "default" : z.type === "departement" ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {ZONE_TYPE_LABELS[z.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {z.type === "region" ? (
                      "-"
                    ) : z.type === "departement" ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {getRegionName(z)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs">
                        {getRegionName(z)} <ChevronRight className="w-3 h-3" /> {getDeptName(z)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatNumber(z.population)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={z.actif ? "default" : "secondary"} className="text-xs">
                      {z.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                        <DropdownMenuItem onClick={() => {
                          setSelectedZone(z);
                          setDetailDialogOpen(true);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          Voir détail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenDialog(z)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedZone(z);
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
              {filteredZones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucune zone trouvée
                  </TableCell>
                </TableRow>
              )}
              {filteredZones.length > 100 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-2 text-muted-foreground text-xs">
                    Affichage limité à 100 résultats. Utilisez les filtres pour affiner.
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
              {selectedZone ? "Modifier la zone" : "Ajouter une zone"}
            </DialogTitle>
            <DialogDescription>
              Sélectionnez le type puis complétez la hiérarchie
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selector */}
            <div className="space-y-1.5">
              <Label className="text-xs">Type de zone *</Label>
              <div className="flex gap-2">
                {(["region", "departement", "commune"] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={formType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFormTypeChange(type)}
                  >
                    {ZONE_TYPE_LABELS[type]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Cascade selectors */}
            {formType !== "region" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Région parente *</Label>
                  <Select value={formRegionCode} onValueChange={(v) => { setFormRegionCode(v); setFormDeptCode(""); }}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {regions.map((r) => (
                        <SelectItem key={r.code} value={r.code}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formType === "commune" && formRegionCode && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Département parent *</Label>
                    <Select value={formDeptCode} onValueChange={setFormDeptCode}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {departements.map((d) => (
                          <SelectItem key={d.code} value={d.code}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Code *</Label>
                <Input
                  value={formData.code || ""}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: DK"
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
              <Label className="text-xs">Nom *</Label>
              <Input
                value={formData.nom || ""}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Nom de la zone"
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Population</Label>
                <Input
                  type="number"
                  value={formData.population || ""}
                  onChange={(e) => setFormData({ ...formData, population: Number(e.target.value) || undefined })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Superficie (km²)</Label>
                <Input
                  type="number"
                  value={formData.superficie || ""}
                  onChange={(e) => setFormData({ ...formData, superficie: Number(e.target.value) || undefined })}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de la zone"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {selectedZone ? "Enregistrer" : "Ajouter"}
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
              Êtes-vous sûr de vouloir supprimer la zone "{selectedZone?.nom}" ?
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

      {/* Dialog Détail Zone */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Fiche Zone d'Intervention
            </DialogTitle>
            <DialogDescription>
              Détails de la zone sélectionnée
            </DialogDescription>
          </DialogHeader>
          {selectedZone && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={selectedZone.actif ? "default" : "secondary"}>
                  {selectedZone.actif ? "Actif" : "Inactif"}
                </Badge>
                <span className="font-mono text-sm font-medium">{selectedZone.code}</span>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Nom</p>
                  <p className="font-semibold text-lg">{selectedZone.nom}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <Badge
                      variant={selectedZone.type === "region" ? "default" : selectedZone.type === "departement" ? "secondary" : "outline"}
                      className="mt-1"
                    >
                      {ZONE_TYPE_LABELS[selectedZone.type]}
                    </Badge>
                  </div>
                  {selectedZone.type !== "region" && (
                    <div>
                      <p className="text-xs text-muted-foreground">Région</p>
                      <p className="font-medium">{getRegionName(selectedZone)}</p>
                    </div>
                  )}
                </div>
                {selectedZone.type === "commune" && (
                  <div>
                    <p className="text-xs text-muted-foreground">Département</p>
                    <p className="font-medium">{getDeptName(selectedZone)}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Données géographiques</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Population</span>
                    </div>
                    <p className="font-semibold text-lg mt-1">{formatNumber(selectedZone.population)}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Maximize2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Superficie</span>
                    </div>
                    <p className="font-semibold text-lg mt-1">{selectedZone.superficie ? `${formatNumber(selectedZone.superficie)} km²` : "-"}</p>
                  </div>
                </div>
              </div>

              {selectedZone.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Description</p>
                  <p className="text-sm">{selectedZone.description}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setDetailDialogOpen(false)}>
                  Fermer
                </Button>
                <Button size="sm" onClick={() => {
                  setDetailDialogOpen(false);
                  handleOpenDialog(selectedZone);
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

export default ReferentielZones;
