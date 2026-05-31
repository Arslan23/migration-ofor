import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  Mail,
  Phone,
  User,
  Eye,
  Globe,
  ChevronRight,
  Network,
} from "lucide-react";
import { toast } from "sonner";
import ExportButtons from "@/components/ui/ExportButtons";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import {
  mockEntitesExecution,
  mockServices,
  EntiteExecution,
  Service,
  EntiteType,
  ServiceType,
  ENTITE_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
  getServicesByEntite,
  getServiceById,
  getServicePath,
} from "@/data/entitesExecution";

const ReferentielEntites = () => {
  const [activeTab, setActiveTab] = useState("entites");
  const [entites, setEntites] = useState<EntiteExecution[]>(mockEntitesExecution);
  const [services, setServices] = useState<Service[]>(mockServices);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterActif, setFilterActif] = useState<"all" | "actif" | "inactif">("all");
  const [filterEntite, setFilterEntite] = useState<string>("all");
  const [filterServiceType, setFilterServiceType] = useState<string>("all");
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [serviceDeleteDialogOpen, setServiceDeleteDialogOpen] = useState(false);
  const [serviceDetailDialogOpen, setServiceDetailDialogOpen] = useState(false);
  
  const [selectedEntite, setSelectedEntite] = useState<EntiteExecution | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  const [formData, setFormData] = useState<Partial<EntiteExecution>>({
    code: "",
    nom: "",
    type: "entreprise",
    adresse: "",
    telephone: "",
    email: "",
    siteWeb: "",
    responsable: "",
    description: "",
    actif: true,
  });

  const [serviceFormData, setServiceFormData] = useState<Partial<Service>>({
    code: "",
    nom: "",
    type: "direction",
    entiteId: "",
    parentServiceId: "",
    responsable: "",
    email: "",
    telephone: "",
    description: "",
    actif: true,
  });

  // Filtered data
  const filteredEntites = entites.filter((e) => {
    const matchSearch =
      e.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "all" || e.type === filterType;
    const matchActif =
      filterActif === "all" ||
      (filterActif === "actif" && e.actif) ||
      (filterActif === "inactif" && !e.actif);
    return matchSearch && matchType && matchActif;
  });

  const filteredServices = services.filter((s) => {
    const matchSearch =
      s.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEntite = filterEntite === "all" || s.entiteId === filterEntite;
    const matchType = filterServiceType === "all" || s.type === filterServiceType;
    const matchActif =
      filterActif === "all" ||
      (filterActif === "actif" && s.actif) ||
      (filterActif === "inactif" && !s.actif);
    return matchSearch && matchEntite && matchType && matchActif;
  });

  // Entite handlers
  const handleOpenDialog = (e?: EntiteExecution) => {
    if (e) {
      setSelectedEntite(e);
      setFormData(e);
    } else {
      setSelectedEntite(null);
      setFormData({
        code: "",
        nom: "",
        type: "entreprise",
        adresse: "",
        telephone: "",
        email: "",
        siteWeb: "",
        responsable: "",
        description: "",
        actif: true,
      });
    }
    setDialogOpen(true);
  };

  const handleOpenDetail = (e: EntiteExecution) => {
    setSelectedEntite(e);
    setDetailDialogOpen(true);
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!formData.code || !formData.nom || !formData.type) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (selectedEntite) {
      setEntites((prev) =>
        prev.map((e) =>
          e.id === selectedEntite.id ? { ...e, ...formData } as EntiteExecution : e
        )
      );
      toast.success("Entité modifiée avec succès");
    } else {
      const newEntite: EntiteExecution = {
        id: `ent-${Date.now()}`,
        code: formData.code!,
        nom: formData.nom!,
        type: formData.type as EntiteType,
        adresse: formData.adresse,
        telephone: formData.telephone,
        email: formData.email,
        siteWeb: formData.siteWeb,
        responsable: formData.responsable,
        description: formData.description,
        actif: formData.actif ?? true,
      };
      setEntites((prev) => [...prev, newEntite]);
      toast.success("Entité ajoutée avec succès");
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (selectedEntite) {
      // Vérifier si des services existent
      const hasServices = services.some((s) => s.entiteId === selectedEntite.id);
      if (hasServices) {
        toast.error("Impossible de supprimer: cette entité a des services rattachés");
        setDeleteDialogOpen(false);
        return;
      }
      setEntites((prev) => prev.filter((e) => e.id !== selectedEntite.id));
      toast.success("Entité supprimée avec succès");
      setDeleteDialogOpen(false);
      setSelectedEntite(null);
    }
  };

  // Service handlers
  const handleOpenServiceDialog = (s?: Service) => {
    if (s) {
      setSelectedService(s);
      setServiceFormData(s);
    } else {
      setSelectedService(null);
      setServiceFormData({
        code: "",
        nom: "",
        type: "direction",
        entiteId: "",
        parentServiceId: "",
        responsable: "",
        email: "",
        telephone: "",
        description: "",
        actif: true,
      });
    }
    setServiceDialogOpen(true);
  };

  const handleOpenServiceDetail = (s: Service) => {
    setSelectedService(s);
    setServiceDetailDialogOpen(true);
  };

  const handleServiceSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!serviceFormData.code || !serviceFormData.nom || !serviceFormData.entiteId) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (selectedService) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === selectedService.id ? { ...s, ...serviceFormData } as Service : s
        )
      );
      toast.success("Service modifié avec succès");
    } else {
      const newService: Service = {
        id: `srv-${Date.now()}`,
        code: serviceFormData.code!,
        nom: serviceFormData.nom!,
        type: serviceFormData.type as ServiceType,
        entiteId: serviceFormData.entiteId!,
        parentServiceId: serviceFormData.parentServiceId || undefined,
        responsable: serviceFormData.responsable,
        email: serviceFormData.email,
        telephone: serviceFormData.telephone,
        description: serviceFormData.description,
        actif: serviceFormData.actif ?? true,
      };
      setServices((prev) => [...prev, newService]);
      toast.success("Service ajouté avec succès");
    }
    setServiceDialogOpen(false);
  };

  const handleServiceDelete = () => {
    if (selectedService) {
      const hasChildren = services.some((s) => s.parentServiceId === selectedService.id);
      if (hasChildren) {
        toast.error("Impossible de supprimer: ce service a des sous-services");
        setServiceDeleteDialogOpen(false);
        return;
      }
      setServices((prev) => prev.filter((s) => s.id !== selectedService.id));
      toast.success("Service supprimé avec succès");
      setServiceDeleteDialogOpen(false);
      setSelectedService(null);
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    if (activeTab === "entites") {
      const data = filteredEntites.map((e) => ({
        code: e.code,
        nom: e.nom,
        type: ENTITE_TYPE_LABELS[e.type],
        adresse: e.adresse || "",
        responsable: e.responsable || "",
        email: e.email || "",
        telephone: e.telephone || "",
        statut: e.actif ? "Actif" : "Inactif",
      }));
      exportToCSV(data, [
        { key: "code", header: "Code" },
        { key: "nom", header: "Nom" },
        { key: "type", header: "Type" },
        { key: "adresse", header: "Adresse" },
        { key: "responsable", header: "Responsable" },
        { key: "email", header: "Email" },
        { key: "telephone", header: "Téléphone" },
        { key: "statut", header: "Statut" },
      ], "referentiel_entites");
    } else {
      const data = filteredServices.map((s) => {
        const entite = entites.find((e) => e.id === s.entiteId);
        const parent = s.parentServiceId ? getServiceById(s.parentServiceId) : null;
        return {
          code: s.code,
          nom: s.nom,
          type: SERVICE_TYPE_LABELS[s.type],
          entite: entite?.code || "",
          parent: parent?.code || "",
          responsable: s.responsable || "",
          email: s.email || "",
          statut: s.actif ? "Actif" : "Inactif",
        };
      });
      exportToCSV(data, [
        { key: "code", header: "Code" },
        { key: "nom", header: "Nom" },
        { key: "type", header: "Type" },
        { key: "entite", header: "Entité" },
        { key: "parent", header: "Parent" },
        { key: "responsable", header: "Responsable" },
        { key: "email", header: "Email" },
        { key: "statut", header: "Statut" },
      ], "referentiel_services");
    }
    toast.success("Export CSV généré");
  };

  const handleExportPDF = () => {
    if (activeTab === "entites") {
      const data = filteredEntites.map((e) => ({
        code: e.code,
        nom: e.nom,
        type: ENTITE_TYPE_LABELS[e.type],
        responsable: e.responsable || "-",
        contact: [e.email, e.telephone].filter(Boolean).join(" / ") || "-",
        statut: e.actif ? "Actif" : "Inactif",
      }));
      exportToPDF("Référentiel des Entités d'Exécution", data, [
        { key: "code", header: "Code", width: "10%" },
        { key: "nom", header: "Nom", width: "30%" },
        { key: "type", header: "Type", width: "15%" },
        { key: "responsable", header: "Responsable", width: "15%" },
        { key: "contact", header: "Contact", width: "22%" },
        { key: "statut", header: "Statut", width: "8%" },
      ], "referentiel_entites", {
        subtitle: "Liste des entités d'exécution",
        summary: [
          { label: "Total", value: String(filteredEntites.length) },
          { label: "Actives", value: String(filteredEntites.filter((e) => e.actif).length) },
        ],
      });
    } else {
      const data = filteredServices.map((s) => {
        const entite = entites.find((e) => e.id === s.entiteId);
        return {
          code: s.code,
          nom: s.nom,
          type: SERVICE_TYPE_LABELS[s.type],
          entite: entite?.code || "-",
          responsable: s.responsable || "-",
          statut: s.actif ? "Actif" : "Inactif",
        };
      });
      exportToPDF("Référentiel des Services", data, [
        { key: "code", header: "Code", width: "10%" },
        { key: "nom", header: "Nom", width: "35%" },
        { key: "type", header: "Type", width: "15%" },
        { key: "entite", header: "Entité", width: "15%" },
        { key: "responsable", header: "Responsable", width: "17%" },
        { key: "statut", header: "Statut", width: "8%" },
      ], "referentiel_services", {
        subtitle: "Liste des services par entité",
        summary: [
          { label: "Total", value: String(filteredServices.length) },
          { label: "Actifs", value: String(filteredServices.filter((s) => s.actif).length) },
        ],
      });
    }
    toast.success("Export PDF généré");
  };

  const getEntiteServices = (entiteId: string) => services.filter((s) => s.entiteId === entiteId);

  return (
    <DashboardLayout title="Entités & Services" subtitle="Gestion des entités et leurs services">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Entités d'Exécution & Services
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestion des entités partenaires et de leurs services internes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButtons onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
            {activeTab === "entites" ? (
              <Button onClick={() => handleOpenDialog()} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Entité
              </Button>
            ) : (
              <Button onClick={() => handleOpenServiceDialog()} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Service
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="entites" className="gap-2">
              <Building2 className="w-4 h-4" />
              Entités ({entites.length})
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <Network className="w-4 h-4" />
              Services ({services.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab Entités */}
          <TabsContent value="entites" className="space-y-4">
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
                  {Object.entries(ENTITE_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
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
              <Badge variant="secondary">{filteredEntites.length} résultats</Badge>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Code</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead className="w-[140px]">Type</TableHead>
                    <TableHead className="w-[120px]">Services</TableHead>
                    <TableHead className="w-[80px]">Statut</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntites.map((e) => {
                    const entiteServices = getEntiteServices(e.id);
                    return (
                      <TableRow
                        key={e.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleOpenDetail(e)}
                      >
                        <TableCell className="font-mono text-xs font-medium">{e.code}</TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{e.nom}</p>
                          {e.adresse && (
                            <p className="text-xs text-muted-foreground truncate max-w-[250px]">{e.adresse}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {ENTITE_TYPE_LABELS[e.type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {entiteServices.length} service(s)
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={e.actif ? "default" : "secondary"} className="text-xs">
                            {e.actif ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(ev) => ev.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenDetail(e)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenDialog(e)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedEntite(e);
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
                  {filteredEntites.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Aucune entité trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Tab Services */}
          <TabsContent value="services" className="space-y-4">
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
              <Select value={filterEntite} onValueChange={setFilterEntite}>
                <SelectTrigger className="w-[200px] h-9">
                  <SelectValue placeholder="Entité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les entités</SelectItem>
                  {entites.filter((e) => e.actif).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.code} - {e.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterServiceType} onValueChange={setFilterServiceType}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
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
              <Badge variant="secondary">{filteredServices.length} résultats</Badge>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Code</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead className="w-[120px]">Entité</TableHead>
                    <TableHead>Hiérarchie</TableHead>
                    <TableHead className="w-[80px]">Statut</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((s) => {
                    const entite = entites.find((e) => e.id === s.entiteId);
                    const parent = s.parentServiceId ? services.find((ps) => ps.id === s.parentServiceId) : null;
                    return (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleOpenServiceDetail(s)}
                      >
                        <TableCell className="font-mono text-xs font-medium">{s.code}</TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{s.nom}</p>
                          {s.responsable && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {s.responsable}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {SERVICE_TYPE_LABELS[s.type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium">{entite?.code || "-"}</span>
                        </TableCell>
                        <TableCell>
                          {parent ? (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              {parent.code} <ChevronRight className="w-3 h-3" /> {s.code}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Racine</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.actif ? "default" : "secondary"} className="text-xs">
                            {s.actif ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(ev) => ev.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenServiceDetail(s)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenServiceDialog(s)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedService(s);
                                  setServiceDeleteDialogOpen(true);
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
                  {filteredServices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Aucun service trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Formulaire Entité */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedEntite ? "Modifier l'entité" : "Ajouter une entité"}
            </DialogTitle>
            <DialogDescription>
              {selectedEntite
                ? "Modifiez les informations de l'entité"
                : "Remplissez les informations pour ajouter une nouvelle entité"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Code *</Label>
                <Input
                  value={formData.code || ""}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="EX: HYDRO-SN"
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
                placeholder="Nom complet de l'entité"
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as EntiteType })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ENTITE_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            <div className="space-y-1.5">
              <Label className="text-xs">Site Web</Label>
              <Input
                value={formData.siteWeb || ""}
                onChange={(e) => setFormData({ ...formData, siteWeb: e.target.value })}
                placeholder="www.example.com"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {selectedEntite ? "Enregistrer" : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Détail Entité */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {selectedEntite?.nom}
            </DialogTitle>
            <DialogDescription>
              Détails de l'entité et liste des services rattachés
            </DialogDescription>
          </DialogHeader>
          {selectedEntite && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Code</p>
                    <p className="font-mono font-medium">{selectedEntite.code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <Badge variant="outline">{ENTITE_TYPE_LABELS[selectedEntite.type]}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Responsable</p>
                    <p className="text-sm">{selectedEntite.responsable || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Statut</p>
                    <Badge variant={selectedEntite.actif ? "default" : "secondary"}>
                      {selectedEntite.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Adresse</p>
                    <p className="text-sm">{selectedEntite.adresse || "-"}</p>
                  </div>
                  {selectedEntite.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {selectedEntite.email}
                    </div>
                  )}
                  {selectedEntite.telephone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {selectedEntite.telephone}
                    </div>
                  )}
                  {selectedEntite.siteWeb && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      {selectedEntite.siteWeb}
                    </div>
                  )}
                </div>
              </div>

              {selectedEntite.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{selectedEntite.description}</p>
                </div>
              )}

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Network className="w-4 h-4" />
                    Services ({getEntiteServices(selectedEntite.id).length})
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDetailDialogOpen(false);
                      setServiceFormData({ ...serviceFormData, entiteId: selectedEntite.id });
                      handleOpenServiceDialog();
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Ajouter
                  </Button>
                </div>
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Code</TableHead>
                        <TableHead className="text-xs">Nom</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getEntiteServices(selectedEntite.id).map((s) => (
                        <TableRow key={s.id} className="cursor-pointer" onClick={() => {
                          setDetailDialogOpen(false);
                          handleOpenServiceDetail(s);
                        }}>
                          <TableCell className="font-mono text-xs">{s.code}</TableCell>
                          <TableCell className="text-sm">{s.nom}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{SERVICE_TYPE_LABELS[s.type]}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={s.actif ? "default" : "secondary"} className="text-xs">
                              {s.actif ? "Actif" : "Inactif"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {getEntiteServices(selectedEntite.id).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-4">
                            Aucun service
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                  Fermer
                </Button>
                <Button onClick={() => {
                  setDetailDialogOpen(false);
                  handleOpenDialog(selectedEntite);
                }}>
                  <Pencil className="w-4 h-4 mr-1" />
                  Modifier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Formulaire Service */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedService ? "Modifier le service" : "Ajouter un service"}
            </DialogTitle>
            <DialogDescription>
              {selectedService
                ? "Modifiez les informations du service"
                : "Remplissez les informations pour ajouter un nouveau service"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleServiceSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Code *</Label>
                <Input
                  value={serviceFormData.code || ""}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, code: e.target.value.toUpperCase() })}
                  placeholder="EX: DAF"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Statut</Label>
                <div className="flex items-center gap-2 h-9">
                  <Switch
                    checked={serviceFormData.actif}
                    onCheckedChange={(checked) => setServiceFormData({ ...serviceFormData, actif: checked })}
                  />
                  <span className="text-sm">{serviceFormData.actif ? "Actif" : "Inactif"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Nom *</Label>
              <Input
                value={serviceFormData.nom || ""}
                onChange={(e) => setServiceFormData({ ...serviceFormData, nom: e.target.value })}
                placeholder="Nom du service"
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Entité *</Label>
                <Select
                  value={serviceFormData.entiteId || ""}
                  onValueChange={(v) => setServiceFormData({ ...serviceFormData, entiteId: v, parentServiceId: "" })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {entites.filter((e) => e.actif).map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.code} - {e.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Type *</Label>
                <Select
                  value={serviceFormData.type}
                  onValueChange={(v) => setServiceFormData({ ...serviceFormData, type: v as ServiceType })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Service parent (optionnel)</Label>
              <Select
                value={serviceFormData.parentServiceId || "none"}
                onValueChange={(v) => setServiceFormData({ ...serviceFormData, parentServiceId: v === "none" ? "" : v })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Aucun (service racine)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun (service racine)</SelectItem>
                  {services
                    .filter((s) => s.entiteId === serviceFormData.entiteId && s.id !== selectedService?.id && s.actif)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.code} - {s.nom}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Responsable</Label>
                <Input
                  value={serviceFormData.responsable || ""}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, responsable: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={serviceFormData.email || ""}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, email: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Téléphone</Label>
              <Input
                value={serviceFormData.telephone || ""}
                onChange={(e) => setServiceFormData({ ...serviceFormData, telephone: e.target.value })}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={serviceFormData.description || ""}
                onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setServiceDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {selectedService ? "Enregistrer" : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Détail Service */}
      <Dialog open={serviceDetailDialogOpen} onOpenChange={setServiceDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              {selectedService?.nom}
            </DialogTitle>
            <DialogDescription>
              Détails du service
            </DialogDescription>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4">
              {(() => {
                const entite = entites.find((e) => e.id === selectedService.entiteId);
                const parent = selectedService.parentServiceId
                  ? services.find((s) => s.id === selectedService.parentServiceId)
                  : null;
                const children = services.filter((s) => s.parentServiceId === selectedService.id);

                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Code</p>
                          <p className="font-mono font-medium">{selectedService.code}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Type</p>
                          <Badge variant="outline">{SERVICE_TYPE_LABELS[selectedService.type]}</Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Entité</p>
                          <p className="text-sm font-medium">{entite?.nom || "-"}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Responsable</p>
                          <p className="text-sm">{selectedService.responsable || "-"}</p>
                        </div>
                        {selectedService.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            {selectedService.email}
                          </div>
                        )}
                        {selectedService.telephone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            {selectedService.telephone}
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Statut</p>
                          <Badge variant={selectedService.actif ? "default" : "secondary"}>
                            {selectedService.actif ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {parent && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Service parent</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{parent.code}</Badge>
                          <span className="text-sm">{parent.nom}</span>
                        </div>
                      </div>
                    )}

                    {children.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Sous-services ({children.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {children.map((c) => (
                            <Badge key={c.id} variant="outline" className="cursor-pointer" onClick={() => {
                              setSelectedService(c);
                            }}>
                              {c.code} - {c.nom}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedService.description && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Description</p>
                        <p className="text-sm">{selectedService.description}</p>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" onClick={() => setServiceDetailDialogOpen(false)}>
                        Fermer
                      </Button>
                      <Button onClick={() => {
                        setServiceDetailDialogOpen(false);
                        handleOpenServiceDialog(selectedService);
                      }}>
                        <Pencil className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Alert Dialogs */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'entité ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'entité "{selectedEntite?.nom}" sera définitivement supprimée.
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

      <AlertDialog open={serviceDeleteDialogOpen} onOpenChange={setServiceDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le service ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le service "{selectedService?.nom}" sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleServiceDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ReferentielEntites;
