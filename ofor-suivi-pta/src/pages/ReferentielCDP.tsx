import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Search, Eye, ArrowUpDown, Target, Layers, Activity } from "lucide-react";
import { toast } from "sonner";
import { CDPCategorie, CDPComposante, CDPIndicateurRef, mockCDPCategories, mockCDPComposantes, mockCDPIndicateurs } from "@/types/cdp";
import ExportButtons from "@/components/ui/ExportButtons";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import UniteMesureMultiSelect from "@/components/cdp/UniteMesureMultiSelect";
import UniteMesureBadge from "@/components/cdp/UniteMesureBadge";
import { getAllUnitesMesure } from "@/types/project";

const ReferentielCDP = () => {
  const [activeTab, setActiveTab] = useState("categories");
  
  // États Catégories
  const [categories, setCategories] = useState<CDPCategorie[]>(mockCDPCategories);
  const [searchCategorie, setSearchCategorie] = useState("");
  const [isDialogCategorieOpen, setIsDialogCategorieOpen] = useState(false);
  const [editingCategorie, setEditingCategorie] = useState<CDPCategorie | null>(null);
  const [formCategorie, setFormCategorie] = useState({ code: "", name: "", description: "", order: 1 });
  
  // États Composantes
  const [composantes, setComposantes] = useState<CDPComposante[]>(mockCDPComposantes);
  const [searchComposante, setSearchComposante] = useState("");
  const [filterCategorieComp, setFilterCategorieComp] = useState<string>("all");
  const [isDialogComposanteOpen, setIsDialogComposanteOpen] = useState(false);
  const [editingComposante, setEditingComposante] = useState<CDPComposante | null>(null);
  const [formComposante, setFormComposante] = useState({ code: "", name: "", description: "", categorieId: "", order: 1 });
  
  // États Indicateurs
  const [indicateurs, setIndicateurs] = useState<CDPIndicateurRef[]>(mockCDPIndicateurs);
  const [searchIndicateur, setSearchIndicateur] = useState("");
  const [filterCategorieInd, setFilterCategorieInd] = useState<string>("all");
  const [filterComposanteInd, setFilterComposanteInd] = useState<string>("all");
  const [isDialogIndicateurOpen, setIsDialogIndicateurOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingIndicateur, setEditingIndicateur] = useState<CDPIndicateurRef | null>(null);
  const [viewingIndicateur, setViewingIndicateur] = useState<CDPIndicateurRef | null>(null);
  const [formIndicateur, setFormIndicateur] = useState<{ code: string; name: string; description: string; composanteId: string; unit: string; uniteMesureIds: string[]; formula: string; source: string; order: number }>({ code: "", name: "", description: "", composanteId: "", unit: "", uniteMesureIds: [], formula: "", source: "", order: 1 });

  // ==================== CATÉGORIES ====================
  const filteredCategories = categories.filter(
    (cat) => cat.name.toLowerCase().includes(searchCategorie.toLowerCase()) || cat.code.toLowerCase().includes(searchCategorie.toLowerCase())
  );

  const handleOpenCategorieDialog = (category?: CDPCategorie) => {
    if (category) {
      setEditingCategorie(category);
      setFormCategorie({ code: category.code, name: category.name, description: category.description || "", order: category.order });
    } else {
      setEditingCategorie(null);
      setFormCategorie({ code: "", name: "", description: "", order: categories.length + 1 });
    }
    setIsDialogCategorieOpen(true);
  };

  const handleSaveCategorie = () => {
    if (!formCategorie.code.trim() || !formCategorie.name.trim()) {
      toast.error("Code et nom sont obligatoires");
      return;
    }
    if (editingCategorie) {
      setCategories(categories.map((c) => (c.id === editingCategorie.id ? { ...c, ...formCategorie } : c)));
      toast.success("Catégorie modifiée");
    } else {
      const newCategory: CDPCategorie = { id: `cat-${Date.now()}`, ...formCategorie };
      setCategories([...categories, newCategory]);
      toast.success("Catégorie ajoutée");
    }
    setIsDialogCategorieOpen(false);
  };

  const handleDeleteCategorie = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
    toast.success("Catégorie supprimée");
  };

  // ==================== COMPOSANTES ====================
  const filteredComposantes = composantes.filter((comp) => {
    const matchSearch = comp.name.toLowerCase().includes(searchComposante.toLowerCase()) || comp.code.toLowerCase().includes(searchComposante.toLowerCase());
    const matchCategory = filterCategorieComp === "all" || comp.categorieId === filterCategorieComp;
    return matchSearch && matchCategory;
  });

  const handleOpenComposanteDialog = (composante?: CDPComposante) => {
    if (composante) {
      setEditingComposante(composante);
      setFormComposante({ code: composante.code, name: composante.name, description: composante.description || "", categorieId: composante.categorieId, order: composante.order });
    } else {
      setEditingComposante(null);
      setFormComposante({ code: "", name: "", description: "", categorieId: "", order: composantes.length + 1 });
    }
    setIsDialogComposanteOpen(true);
  };

  const handleSaveComposante = () => {
    if (!formComposante.code.trim() || !formComposante.name.trim() || !formComposante.categorieId) {
      toast.error("Code, nom et catégorie sont obligatoires");
      return;
    }
    const categorie = categories.find((c) => c.id === formComposante.categorieId);
    if (editingComposante) {
      setComposantes(composantes.map((c) => c.id === editingComposante.id ? { ...c, ...formComposante, categorieName: categorie?.name } : c));
      toast.success("Composante modifiée");
    } else {
      const newComposante: CDPComposante = { id: `comp-${Date.now()}`, ...formComposante, categorieName: categorie?.name };
      setComposantes([...composantes, newComposante]);
      toast.success("Composante ajoutée");
    }
    setIsDialogComposanteOpen(false);
  };

  const handleDeleteComposante = (id: string) => {
    setComposantes(composantes.filter((c) => c.id !== id));
    toast.success("Composante supprimée");
  };

  // ==================== INDICATEURS ====================
  const filteredComposantesInd = filterCategorieInd === "all" ? composantes : composantes.filter(c => c.categorieId === filterCategorieInd);
  
  const filteredIndicateurs = indicateurs.filter((ind) => {
    const matchSearch = ind.name.toLowerCase().includes(searchIndicateur.toLowerCase()) || ind.code.toLowerCase().includes(searchIndicateur.toLowerCase());
    const matchComposante = filterComposanteInd === "all" || ind.composanteId === filterComposanteInd;
    const matchCategorie = filterCategorieInd === "all" || ind.categorieId === filterCategorieInd;
    return matchSearch && matchComposante && matchCategorie;
  });

  const handleOpenIndicateurDialog = (indicateur?: CDPIndicateurRef) => {
    if (indicateur) {
      setEditingIndicateur(indicateur);
      setFormIndicateur({ code: indicateur.code, name: indicateur.name, description: indicateur.description || "", composanteId: indicateur.composanteId, unit: indicateur.unit, uniteMesureIds: indicateur.uniteMesureIds || [], formula: indicateur.formula || "", source: indicateur.source || "", order: indicateur.order });
    } else {
      setEditingIndicateur(null);
      setFormIndicateur({ code: "", name: "", description: "", composanteId: "", unit: "", uniteMesureIds: [], formula: "", source: "", order: indicateurs.length + 1 });
    }
    setIsDialogIndicateurOpen(true);
  };

  const handleViewIndicateur = (indicateur: CDPIndicateurRef) => {
    setViewingIndicateur(indicateur);
    setIsViewDialogOpen(true);
  };

  const handleSaveIndicateur = () => {
    if (!formIndicateur.code.trim() || !formIndicateur.name.trim() || !formIndicateur.composanteId || !formIndicateur.unit.trim()) {
      toast.error("Code, nom, composante et unité sont obligatoires");
      return;
    }
    const composante = composantes.find((c) => c.id === formIndicateur.composanteId);
    if (editingIndicateur) {
      setIndicateurs(indicateurs.map((ind) => ind.id === editingIndicateur.id ? { ...ind, ...formIndicateur, composanteName: composante?.name, categorieId: composante?.categorieId, categorieName: composante?.categorieName } : ind));
      toast.success("Indicateur modifié");
    } else {
      const newIndicateur: CDPIndicateurRef = { id: `ind-${Date.now()}`, ...formIndicateur, composanteName: composante?.name, categorieId: composante?.categorieId, categorieName: composante?.categorieName };
      setIndicateurs([...indicateurs, newIndicateur]);
      toast.success("Indicateur ajouté");
    }
    setIsDialogIndicateurOpen(false);
  };

  const handleDeleteIndicateur = (id: string) => {
    setIndicateurs(indicateurs.filter((ind) => ind.id !== id));
    toast.success("Indicateur supprimé");
  };

  // ==================== EXPORTS ====================
  const handleExportCategoriesCSV = () => exportToCSV(filteredCategories.map(c => ({ code: c.code, name: c.name, description: c.description || "", order: c.order })), [{ key: "code", header: "Code" }, { key: "name", header: "Nom" }, { key: "description", header: "Description" }, { key: "order", header: "Ordre" }], "categories-cdp");
  const handleExportCategoriesPDF = () => exportToPDF("Catégories CDP", filteredCategories.map(c => ({ code: c.code, name: c.name, description: c.description || "", order: c.order })), [{ key: "code", header: "Code" }, { key: "name", header: "Nom" }, { key: "description", header: "Description" }, { key: "order", header: "Ordre" }], "categories-cdp");
  
  const handleExportComposantesCSV = () => exportToCSV(filteredComposantes.map(c => ({ code: c.code, name: c.name, categorieName: c.categorieName || "", description: c.description || "", order: c.order })), [{ key: "code", header: "Code" }, { key: "name", header: "Nom" }, { key: "categorieName", header: "Catégorie" }, { key: "description", header: "Description" }, { key: "order", header: "Ordre" }], "composantes-cdp");
  const handleExportComposantesPDF = () => exportToPDF("Composantes CDP", filteredComposantes.map(c => ({ code: c.code, name: c.name, categorieName: c.categorieName || "", description: c.description || "", order: c.order })), [{ key: "code", header: "Code" }, { key: "name", header: "Nom" }, { key: "categorieName", header: "Catégorie" }, { key: "description", header: "Description" }, { key: "order", header: "Ordre" }], "composantes-cdp");
  
  const handleExportIndicateursCSV = () => exportToCSV(filteredIndicateurs.map(ind => ({ code: ind.code, name: ind.name, composanteName: ind.composanteName || "", categorieName: ind.categorieName || "", unit: ind.unit, formula: ind.formula || "", source: ind.source || "" })), [{ key: "code", header: "Code" }, { key: "name", header: "Nom" }, { key: "composanteName", header: "Composante" }, { key: "categorieName", header: "Catégorie" }, { key: "unit", header: "Unité" }, { key: "formula", header: "Formule" }, { key: "source", header: "Source" }], "indicateurs-cdp");
  const handleExportIndicateursPDF = () => exportToPDF("Indicateurs CDP", filteredIndicateurs.map(ind => ({ code: ind.code, name: ind.name, composanteName: ind.composanteName || "", categorieName: ind.categorieName || "", unit: ind.unit, formula: ind.formula || "", source: ind.source || "" })), [{ key: "code", header: "Code" }, { key: "name", header: "Nom" }, { key: "composanteName", header: "Composante" }, { key: "categorieName", header: "Catégorie" }, { key: "unit", header: "Unité" }, { key: "formula", header: "Formule" }, { key: "source", header: "Source" }], "indicateurs-cdp");

  return (
    <DashboardLayout title="Référentiel CDP" subtitle="Catégories, composantes et indicateurs du contrat de performance">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Target className="w-4 h-4" /> Catégories <Badge variant="secondary" className="ml-1">{categories.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="composantes" className="flex items-center gap-2">
            <Layers className="w-4 h-4" /> Composantes <Badge variant="secondary" className="ml-1">{composantes.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="indicateurs" className="flex items-center gap-2">
            <Activity className="w-4 h-4" /> Indicateurs <Badge variant="secondary" className="ml-1">{indicateurs.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* TAB CATÉGORIES */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={() => handleOpenCategorieDialog()} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Ajouter
            </Button>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={searchCategorie} onChange={(e) => setSearchCategorie(e.target.value)} className="pl-9 h-9" />
            </div>
            <ExportButtons onExportCSV={handleExportCategoriesCSV} onExportPDF={handleExportCategoriesPDF} />
          </div>
          <div className="border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16"><div className="flex items-center gap-1">Ordre <ArrowUpDown className="w-3 h-3" /></div></TableHead>
                  <TableHead className="w-24">Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Aucune catégorie</TableCell></TableRow>
                ) : (
                  filteredCategories.sort((a, b) => a.order - b.order).map((cat) => (
                    <TableRow key={cat.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{cat.order}</TableCell>
                      <TableCell className="font-mono font-medium">{cat.code}</TableCell>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{cat.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenCategorieDialog(cat)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCategorie(cat.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB COMPOSANTES */}
        <TabsContent value="composantes" className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={() => handleOpenComposanteDialog()} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Ajouter
            </Button>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={searchComposante} onChange={(e) => setSearchComposante(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={filterCategorieComp} onValueChange={setFilterCategorieComp}>
              <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Catégorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <ExportButtons onExportCSV={handleExportComposantesCSV} onExportPDF={handleExportComposantesPDF} />
          </div>
          <div className="border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Ordre</TableHead>
                  <TableHead className="w-28">Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="w-36">Catégorie</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComposantes.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Aucune composante</TableCell></TableRow>
                ) : (
                  filteredComposantes.sort((a, b) => {
                    const catA = categories.find((c) => c.id === a.categorieId)?.order || 0;
                    const catB = categories.find((c) => c.id === b.categorieId)?.order || 0;
                    if (catA !== catB) return catA - catB;
                    return a.order - b.order;
                  }).map((comp) => (
                    <TableRow key={comp.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{comp.order}</TableCell>
                      <TableCell className="font-mono font-medium">{comp.code}</TableCell>
                      <TableCell className="font-medium">{comp.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{comp.categorieName}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{comp.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenComposanteDialog(comp)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteComposante(comp.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB INDICATEURS */}
        <TabsContent value="indicateurs" className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={() => handleOpenIndicateurDialog()} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Ajouter
            </Button>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={searchIndicateur} onChange={(e) => setSearchIndicateur(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={filterCategorieInd} onValueChange={(v) => { setFilterCategorieInd(v); setFilterComposanteInd("all"); }}>
              <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Catégorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={filterComposanteInd} onValueChange={setFilterComposanteInd}>
              <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Composante" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes composantes</SelectItem>
                {filteredComposantesInd.map((comp) => (<SelectItem key={comp.id} value={comp.id}>{comp.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <ExportButtons onExportCSV={handleExportIndicateursCSV} onExportPDF={handleExportIndicateursPDF} />
          </div>
          <div className="border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="w-32">Composante</TableHead>
                  <TableHead className="w-28">Catégorie</TableHead>
                  <TableHead className="w-16">Unité</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIndicateurs.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Aucun indicateur</TableCell></TableRow>
                ) : (
                  filteredIndicateurs.sort((a, b) => {
                    const catA = categories.find((c) => c.id === a.categorieId)?.order || 0;
                    const catB = categories.find((c) => c.id === b.categorieId)?.order || 0;
                    if (catA !== catB) return catA - catB;
                    const compA = composantes.find((c) => c.id === a.composanteId)?.order || 0;
                    const compB = composantes.find((c) => c.id === b.composanteId)?.order || 0;
                    if (compA !== compB) return compA - compB;
                    return a.order - b.order;
                  }).map((ind) => (
                    <TableRow key={ind.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewIndicateur(ind)}>
                      <TableCell className="font-mono font-medium text-sm">{ind.code}</TableCell>
                      <TableCell className="font-medium">{ind.name}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{ind.composanteName}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{ind.categorieName}</Badge></TableCell>
                      <TableCell className="text-sm">{ind.unit}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleViewIndicateur(ind)}><Eye className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenIndicateurDialog(ind)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteIndicateur(ind.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* DIALOG CATÉGORIE */}
      <Dialog open={isDialogCategorieOpen} onOpenChange={setIsDialogCategorieOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingCategorie ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Code *</Label>
                <Input value={formCategorie.code} onChange={(e) => setFormCategorie({ ...formCategorie, code: e.target.value.toUpperCase() })} placeholder="TECH" />
              </div>
              <div className="space-y-1">
                <Label>Ordre</Label>
                <Input type="number" min={1} value={formCategorie.order} onChange={(e) => setFormCategorie({ ...formCategorie, order: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Nom *</Label>
              <Input value={formCategorie.name} onChange={(e) => setFormCategorie({ ...formCategorie, name: e.target.value })} placeholder="Technique" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={formCategorie.description} onChange={(e) => setFormCategorie({ ...formCategorie, description: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogCategorieOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveCategorie}>{editingCategorie ? "Modifier" : "Ajouter"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG COMPOSANTE */}
      <Dialog open={isDialogComposanteOpen} onOpenChange={setIsDialogComposanteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingComposante ? "Modifier la composante" : "Nouvelle composante"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Code *</Label>
                <Input value={formComposante.code} onChange={(e) => setFormComposante({ ...formComposante, code: e.target.value.toUpperCase() })} placeholder="QUAL-EAU" />
              </div>
              <div className="space-y-1">
                <Label>Ordre</Label>
                <Input type="number" min={1} value={formComposante.order} onChange={(e) => setFormComposante({ ...formComposante, order: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Catégorie *</Label>
              <Select value={formComposante.categorieId} onValueChange={(v) => setFormComposante({ ...formComposante, categorieId: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Nom *</Label>
              <Input value={formComposante.name} onChange={(e) => setFormComposante({ ...formComposante, name: e.target.value })} placeholder="Qualité de l'eau" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={formComposante.description} onChange={(e) => setFormComposante({ ...formComposante, description: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogComposanteOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveComposante}>{editingComposante ? "Modifier" : "Ajouter"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG INDICATEUR */}
      <Dialog open={isDialogIndicateurOpen} onOpenChange={setIsDialogIndicateurOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingIndicateur ? "Modifier l'indicateur" : "Nouvel indicateur"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Code *</Label>
                <Input value={formIndicateur.code} onChange={(e) => setFormIndicateur({ ...formIndicateur, code: e.target.value.toUpperCase() })} placeholder="QUAL-01" />
              </div>
              <div className="space-y-1">
                <Label>Unité *</Label>
                <Input value={formIndicateur.unit} onChange={(e) => setFormIndicateur({ ...formIndicateur, unit: e.target.value })} placeholder="%" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Unités de mesure impliquées dans le calcul</Label>
              <UniteMesureMultiSelect
                value={formIndicateur.uniteMesureIds}
                onChange={(ids) => setFormIndicateur({ ...formIndicateur, uniteMesureIds: ids })}
                placeholder="Sélectionner les unités contribuant à l'agrégat…"
              />
              <p className="text-[10px] text-muted-foreground">
                Sert à agréger automatiquement la dernière situation des réalisations PTA partageant ces unités.
              </p>
            </div>
            <div className="space-y-1">
              <Label>Composante *</Label>
              <Select value={formIndicateur.composanteId} onValueChange={(v) => setFormIndicateur({ ...formIndicateur, composanteId: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {composantes.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      <span className="flex items-center gap-2"><Badge variant="outline" className="text-xs">{comp.categorieName}</Badge>{comp.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Nom *</Label>
              <Input value={formIndicateur.name} onChange={(e) => setFormIndicateur({ ...formIndicateur, name: e.target.value })} placeholder="Taux de conformité" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={formIndicateur.description} onChange={(e) => setFormIndicateur({ ...formIndicateur, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Formule</Label>
                <Input value={formIndicateur.formula} onChange={(e) => setFormIndicateur({ ...formIndicateur, formula: e.target.value })} placeholder="(A/B) × 100" />
              </div>
              <div className="space-y-1">
                <Label>Source</Label>
                <Input value={formIndicateur.source} onChange={(e) => setFormIndicateur({ ...formIndicateur, source: e.target.value })} placeholder="Laboratoire" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogIndicateurOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveIndicateur}>{editingIndicateur ? "Modifier" : "Ajouter"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG VUE INDICATEUR */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Détail de l'indicateur</DialogTitle></DialogHeader>
          {viewingIndicateur && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Code</p><p className="font-mono font-medium">{viewingIndicateur.code}</p></div>
                <div><p className="text-xs text-muted-foreground">Unité</p><p className="font-medium">{viewingIndicateur.unit}</p></div>
              </div>
              <div><p className="text-xs text-muted-foreground">Nom</p><p className="font-medium">{viewingIndicateur.name}</p></div>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Catégorie</p><Badge variant="outline">{viewingIndicateur.categorieName}</Badge></div>
                <div><p className="text-xs text-muted-foreground">Composante</p><Badge variant="secondary">{viewingIndicateur.composanteName}</Badge></div>
              </div>
              {viewingIndicateur.description && (<div><p className="text-xs text-muted-foreground">Description</p><p className="text-sm">{viewingIndicateur.description}</p></div>)}
              {viewingIndicateur.formula && (<div><p className="text-xs text-muted-foreground">Formule</p><p className="font-mono text-sm bg-muted px-2 py-1 rounded">{viewingIndicateur.formula}</p></div>)}
              {viewingIndicateur.source && (<div><p className="text-xs text-muted-foreground">Source</p><p className="text-sm">{viewingIndicateur.source}</p></div>)}
              {viewingIndicateur.uniteMesureIds && viewingIndicateur.uniteMesureIds.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Unités de mesure impliquées</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {viewingIndicateur.uniteMesureIds.map((uid) => (
                      <UniteMesureBadge key={uid} uniteId={uid} variant="full" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
            <Button onClick={() => { setIsViewDialogOpen(false); handleOpenIndicateurDialog(viewingIndicateur!); }}>Modifier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ReferentielCDP;
