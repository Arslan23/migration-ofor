import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CDP, CDPIndicateurRef, CDPIndicateurCible, generateCDPCode, mockCDPIndicateurs, mockCDPComposantes, mockCDPCategories } from "@/types/cdp";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Search, CheckSquare, Square } from "lucide-react";
interface CDPFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (cdp: Omit<CDP, "id" | "createdAt" | "createdBy">) => void;
  initialData?: CDP;
}

const CDPForm = ({ open, onOpenChange, onSave, initialData }: CDPFormProps) => {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [startYear, setStartYear] = useState(initialData?.startYear || currentYear);
  const [selectedIndicateurs, setSelectedIndicateurs] = useState<CDPIndicateurCible[]>(initialData?.indicateurs || []);
  const [activeTab, setActiveTab] = useState("info");
  const [searchTerm, setSearchTerm] = useState("");

  const code = generateCDPCode(startYear);
  const endYear = startYear + 2;

  const handleToggleIndicateur = (indicateur: CDPIndicateurRef) => {
    const exists = selectedIndicateurs.find(i => i.indicateurRefId === indicateur.id);
    if (exists) {
      setSelectedIndicateurs(prev => prev.filter(i => i.indicateurRefId !== indicateur.id));
    } else {
      const composante = mockCDPComposantes.find(c => c.id === indicateur.composanteId);
      setSelectedIndicateurs(prev => [...prev, {
        indicateurRefId: indicateur.id,
        indicateurCode: indicateur.code,
        indicateurName: indicateur.name,
        composanteId: indicateur.composanteId,
        composanteName: composante?.name || "",
        unit: indicateur.unit,
        uniteMesureIds: indicateur.uniteMesureIds || [],
        baselineValue: 0,
        targetYear1: 0,
        targetYear2: 0,
        targetYear3: 0,
      }]);
    }
  };

  const handleUpdateTarget = (indicateurRefId: string, field: keyof CDPIndicateurCible, value: number) => {
    setSelectedIndicateurs(prev => prev.map(i => 
      i.indicateurRefId === indicateurRefId ? { ...i, [field]: value } : i
    ));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: "Erreur", description: "Veuillez saisir un nom", variant: "destructive" });
      return;
    }
    if (selectedIndicateurs.length === 0) {
      toast({ title: "Erreur", description: "Veuillez sélectionner au moins un indicateur", variant: "destructive" });
      return;
    }

    onSave({
      code,
      name,
      description,
      startYear,
      endYear,
      status: "brouillon",
      indicateurs: selectedIndicateurs,
    });
    onOpenChange(false);
  };

  // State pour les catégories et composantes ouvertes
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => 
    mockCDPCategories.reduce((acc, cat) => ({ ...acc, [cat.id]: true }), {})
  );
  const [openComposantes, setOpenComposantes] = useState<Record<string, boolean>>(() =>
    mockCDPComposantes.reduce((acc, comp) => ({ ...acc, [comp.id]: true }), {})
  );

  // Filtrer les indicateurs selon la recherche
  const filterIndicateurs = (indicateurs: CDPIndicateurRef[]) => {
    if (!searchTerm.trim()) return indicateurs;
    const term = searchTerm.toLowerCase();
    return indicateurs.filter(i => 
      i.name.toLowerCase().includes(term) || 
      i.code.toLowerCase().includes(term)
    );
  };

  // Grouper les indicateurs par catégorie puis par composante (avec filtre)
  const indicateursByCategorieAndComposante = mockCDPCategories
    .sort((a, b) => a.order - b.order)
    .map(categorie => {
      const composantes = mockCDPComposantes
        .filter(c => c.categorieId === categorie.id)
        .sort((a, b) => a.order - b.order)
        .map(composante => {
          const indicateurs = filterIndicateurs(
            mockCDPIndicateurs
              .filter(i => i.composanteId === composante.id)
              .sort((a, b) => a.order - b.order)
          );
          return { composante, indicateurs };
        })
        .filter(({ indicateurs }) => indicateurs.length > 0);
      return { categorie, composantes };
    })
    .filter(({ composantes }) => composantes.length > 0);

  const toggleCategorie = (catId: string) => {
    setOpenCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const toggleComposante = (compId: string) => {
    setOpenComposantes(prev => ({ ...prev, [compId]: !prev[compId] }));
  };

  const getSelectedCountForCategorie = (catId: string) => {
    return selectedIndicateurs.filter(s => {
      const ind = mockCDPIndicateurs.find(i => i.id === s.indicateurRefId);
      return ind?.categorieId === catId;
    }).length;
  };

  const getSelectedCountForComposante = (compId: string) => {
    return selectedIndicateurs.filter(s => {
      const ind = mockCDPIndicateurs.find(i => i.id === s.indicateurRefId);
      return ind?.composanteId === compId;
    }).length;
  };

  const getTotalForCategorie = (catId: string) => {
    return mockCDPIndicateurs.filter(i => i.categorieId === catId).length;
  };

  const getTotalForComposante = (compId: string) => {
    return mockCDPIndicateurs.filter(i => i.composanteId === compId).length;
  };

  // Sélection/désélection groupée
  const handleToggleAllCategorie = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const catIndicateurs = mockCDPIndicateurs.filter(i => i.categorieId === catId);
    const allSelected = catIndicateurs.every(ind => 
      selectedIndicateurs.some(s => s.indicateurRefId === ind.id)
    );
    
    if (allSelected) {
      setSelectedIndicateurs(prev => 
        prev.filter(s => !catIndicateurs.some(ind => ind.id === s.indicateurRefId))
      );
    } else {
      const toAdd = catIndicateurs.filter(ind => 
        !selectedIndicateurs.some(s => s.indicateurRefId === ind.id)
      ).map(ind => {
        const composante = mockCDPComposantes.find(c => c.id === ind.composanteId);
        return {
          indicateurRefId: ind.id,
          indicateurCode: ind.code,
          indicateurName: ind.name,
          composanteId: ind.composanteId,
          composanteName: composante?.name || "",
          unit: ind.unit,
          uniteMesureIds: ind.uniteMesureIds || [],
          baselineValue: 0,
          targetYear1: 0,
          targetYear2: 0,
          targetYear3: 0,
        };
      });
      setSelectedIndicateurs(prev => [...prev, ...toAdd]);
    }
  };

  const handleToggleAllComposante = (compId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const compIndicateurs = mockCDPIndicateurs.filter(i => i.composanteId === compId);
    const allSelected = compIndicateurs.every(ind => 
      selectedIndicateurs.some(s => s.indicateurRefId === ind.id)
    );
    
    if (allSelected) {
      setSelectedIndicateurs(prev => 
        prev.filter(s => !compIndicateurs.some(ind => ind.id === s.indicateurRefId))
      );
    } else {
      const composante = mockCDPComposantes.find(c => c.id === compId);
      const toAdd = compIndicateurs.filter(ind => 
        !selectedIndicateurs.some(s => s.indicateurRefId === ind.id)
      ).map(ind => ({
        indicateurRefId: ind.id,
        indicateurCode: ind.code,
        indicateurName: ind.name,
        composanteId: ind.composanteId,
        composanteName: composante?.name || "",
        unit: ind.unit,
        uniteMesureIds: ind.uniteMesureIds || [],
        baselineValue: 0,
        targetYear1: 0,
        targetYear2: 0,
        targetYear3: 0,
      }));
      setSelectedIndicateurs(prev => [...prev, ...toAdd]);
    }
  };

  const isCategorieAllSelected = (catId: string) => {
    const catIndicateurs = mockCDPIndicateurs.filter(i => i.categorieId === catId);
    return catIndicateurs.length > 0 && catIndicateurs.every(ind => 
      selectedIndicateurs.some(s => s.indicateurRefId === ind.id)
    );
  };

  const isComposanteAllSelected = (compId: string) => {
    const compIndicateurs = mockCDPIndicateurs.filter(i => i.composanteId === compId);
    return compIndicateurs.length > 0 && compIndicateurs.every(ind => 
      selectedIndicateurs.some(s => s.indicateurRefId === ind.id)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Modifier le CDP" : "Nouveau Contrat de Performance"}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">1. Informations</TabsTrigger>
            <TabsTrigger value="indicateurs">2. Indicateurs ({selectedIndicateurs.length})</TabsTrigger>
            <TabsTrigger value="cibles">3. Cibles annuelles</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Code</Label>
                <Input value={code} disabled className="font-mono" />
              </div>
              <div>
                <Label>Année de début</Label>
                <Input 
                  type="number" 
                  value={startYear} 
                  onChange={(e) => setStartYear(parseInt(e.target.value) || currentYear)}
                  min={currentYear - 5}
                  max={currentYear + 5}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Période</Label>
                <Input value={`${startYear} - ${endYear} (3 ans)`} disabled />
              </div>
            </div>
            <div>
              <Label>Nom du contrat</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Contrat de Performance 2024-2026" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Description du contrat..." />
            </div>
          </TabsContent>

          <TabsContent value="indicateurs" className="mt-4 space-y-2">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un indicateur (code ou nom)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            
            <ScrollArea className="h-[360px] border rounded-lg p-2">
              <div className="space-y-1">
                {indicateursByCategorieAndComposante.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Aucun indicateur trouvé pour "{searchTerm}"
                  </div>
                ) : (
                  indicateursByCategorieAndComposante.map(({ categorie, composantes }) => {
                    const selectedCount = getSelectedCountForCategorie(categorie.id);
                    const totalCount = getTotalForCategorie(categorie.id);
                    const isOpen = openCategories[categorie.id];
                    const allSelected = isCategorieAllSelected(categorie.id);
                    
                    return (
                      <Collapsible key={categorie.id} open={isOpen} onOpenChange={() => toggleCategorie(categorie.id)}>
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 hover:bg-primary/15 transition-colors">
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            {isOpen ? <FolderOpen className="h-4 w-4 text-primary" /> : <Folder className="h-4 w-4 text-primary" />}
                            <span className="font-semibold text-sm flex-1 text-left">{categorie.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 hover:bg-primary/20"
                              onClick={(e) => handleToggleAllCategorie(categorie.id, e)}
                              title={allSelected ? "Tout désélectionner" : "Tout sélectionner"}
                            >
                              {allSelected ? (
                                <CheckSquare className="h-4 w-4 text-primary" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </Button>
                            <Badge variant={selectedCount > 0 ? "default" : "outline"} className="text-xs">
                              {selectedCount}/{totalCount}
                            </Badge>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="ml-4 mt-1 space-y-1">
                            {composantes.map(({ composante, indicateurs }) => {
                              const compSelectedCount = getSelectedCountForComposante(composante.id);
                              const compTotalCount = getTotalForComposante(composante.id);
                              const isCompOpen = openComposantes[composante.id];
                              const compAllSelected = isComposanteAllSelected(composante.id);
                              
                              return (
                                <Collapsible key={composante.id} open={isCompOpen} onOpenChange={() => toggleComposante(composante.id)}>
                                  <CollapsibleTrigger className="w-full">
                                    <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                                      {isCompOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                      <span className="text-sm flex-1 text-left font-medium">{composante.name}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 px-1.5 hover:bg-secondary"
                                        onClick={(e) => handleToggleAllComposante(composante.id, e)}
                                        title={compAllSelected ? "Tout désélectionner" : "Tout sélectionner"}
                                      >
                                        {compAllSelected ? (
                                          <CheckSquare className="h-3.5 w-3.5 text-primary" />
                                        ) : (
                                          <Square className="h-3.5 w-3.5" />
                                        )}
                                      </Button>
                                      <Badge variant={compSelectedCount > 0 ? "secondary" : "outline"} className="text-xs">
                                        {compSelectedCount}/{compTotalCount}
                                      </Badge>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="ml-4 mt-1 space-y-0.5">
                                      {indicateurs.map((ind) => {
                                        const isSelected = selectedIndicateurs.some(s => s.indicateurRefId === ind.id);
                                        return (
                                          <div
                                            key={ind.id}
                                            className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${
                                              isSelected ? "bg-primary/20 border border-primary/30" : "hover:bg-accent"
                                            }`}
                                            onClick={() => handleToggleIndicateur(ind)}
                                          >
                                            <Checkbox 
                                              checked={isSelected} 
                                              onCheckedChange={() => handleToggleIndicateur(ind)}
                                              className="h-4 w-4"
                                            />
                                            <span className="font-mono text-xs text-muted-foreground w-16">{ind.code}</span>
                                            <span className="text-sm flex-1">{ind.name}</span>
                                            <span className="text-xs text-muted-foreground">{ind.unit}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })
                )}
              </div>
            </ScrollArea>
            <p className="text-sm text-muted-foreground">
              {selectedIndicateurs.length} indicateur(s) sélectionné(s) sur {mockCDPIndicateurs.length} disponibles
            </p>
          </TabsContent>

          <TabsContent value="cibles" className="mt-4">
            <ScrollArea className="h-[400px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Indicateur</TableHead>
                    <TableHead>Unité</TableHead>
                    <TableHead className="text-right">Baseline</TableHead>
                    <TableHead className="text-right">Cible {startYear}</TableHead>
                    <TableHead className="text-right">Cible {startYear + 1}</TableHead>
                    <TableHead className="text-right">Cible {startYear + 2}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedIndicateurs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucun indicateur sélectionné. Retournez à l'onglet "Indicateurs".
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedIndicateurs.map((ind) => (
                      <TableRow key={ind.indicateurRefId}>
                        <TableCell>
                          <div>
                            <div className="font-mono text-xs text-muted-foreground">{ind.indicateurCode}</div>
                            <div className="text-sm">{ind.indicateurName}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{ind.unit}</TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={ind.baselineValue} 
                            onChange={(e) => handleUpdateTarget(ind.indicateurRefId, "baselineValue", parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-right text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={ind.targetYear1} 
                            onChange={(e) => handleUpdateTarget(ind.indicateurRefId, "targetYear1", parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-right text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={ind.targetYear2} 
                            onChange={(e) => handleUpdateTarget(ind.indicateurRefId, "targetYear2", parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-right text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={ind.targetYear3} 
                            onChange={(e) => handleUpdateTarget(ind.indicateurRefId, "targetYear3", parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-right text-sm"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit}>
            {initialData ? "Mettre à jour" : "Créer le CDP"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CDPForm;
