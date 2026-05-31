import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  CDP, CDPEvaluationAnnuelle, CDPFicheSuiviIndicateur, 
  CDP_STATUS_LABELS, CDP_STATUS_COLORS,
  CDP_FICHE_STATUS_LABELS, CDP_FICHE_STATUS_COLORS,
  CDPFicheSuiviStatus,
  mockCDPComposantes, mockCDPCategories,
  calculatePerformanceRate
} from "@/types/cdp";
import { cn } from "@/lib/utils";
import { formatMontant, exportToCSV } from "@/lib/exportUtils";
import { exportFichesSuiviToPDF } from "@/lib/exportCDPUtils";
import { Eye, Edit, Send, CheckCircle, Award, Lock, Unlock, FileText, Filter, ChevronDown, ChevronRight, History, Plus } from "lucide-react";
import CDPFicheSuiviForm from "./CDPFicheSuiviForm";
import CDPCollecteForm, { CDPCollecteSuivi } from "./CDPCollecteForm";
import CDPCollecteList from "./CDPCollecteList";
import CDPCollecteDetail from "./CDPCollecteDetail";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExportButtons from "@/components/ui/ExportButtons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CDPEvaluationDetailProps {
  cdp: CDP;
  evaluation: CDPEvaluationAnnuelle;
  fiches: CDPFicheSuiviIndicateur[];
  onUpdateFiche: (fiche: CDPFicheSuiviIndicateur) => void;
  canValidate?: boolean;
  canApprove?: boolean;
}

// Données mock pour les collectes
const generateMockCollectes = (evaluationId: string, year: number): CDPCollecteSuivi[] => {
  if (year === 2024) {
    return [
      {
        id: `collecte-${evaluationId}-1`,
        evaluationId,
        date: "2024-06-30T00:00:00Z",
        libelle: `Suivi S1 ${year}`,
        observations: "Collecte semestrielle des indicateurs",
        createdAt: "2024-07-01T10:00:00Z",
        createdBy: "Chef Service Suivi",
        status: "approuve",
        submittedAt: "2024-07-05T14:00:00Z",
        submittedBy: "Chef Service Suivi",
        validatedAt: "2024-07-10T09:00:00Z",
        validatedBy: "Directeur Technique",
        approvedAt: "2024-07-15T11:00:00Z",
        approvedBy: "DG OFOR",
      },
      {
        id: `collecte-${evaluationId}-2`,
        evaluationId,
        date: "2024-12-31T00:00:00Z",
        libelle: `Bilan annuel ${year}`,
        observations: "Bilan de fin d'année",
        createdAt: "2025-01-02T10:00:00Z",
        createdBy: "Chef Service Suivi",
        status: "approuve",
        submittedAt: "2025-01-05T14:00:00Z",
        submittedBy: "Chef Service Suivi",
        validatedAt: "2025-01-10T09:00:00Z",
        validatedBy: "Directeur Technique",
        approvedAt: "2025-01-15T11:00:00Z",
        approvedBy: "DG OFOR",
      },
    ];
  } else if (year === 2025) {
    return [
      {
        id: `collecte-${evaluationId}-1`,
        evaluationId,
        date: "2025-06-30T00:00:00Z",
        libelle: `Suivi S1 ${year}`,
        observations: "Collecte en cours",
        createdAt: "2025-07-01T10:00:00Z",
        createdBy: "Chef Service Suivi",
        status: "soumis",
        submittedAt: "2025-07-05T14:00:00Z",
        submittedBy: "Chef Service Suivi",
      },
    ];
  }
  return [];
};

const CDPEvaluationDetail = ({ cdp, evaluation, fiches, onUpdateFiche, canValidate = true, canApprove = true }: CDPEvaluationDetailProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("collectes");
  const [selectedFiche, setSelectedFiche] = useState<CDPFicheSuiviIndicateur | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [collecteFormOpen, setCollecteFormOpen] = useState(false);
  const [filterCategorie, setFilterCategorie] = useState<string>("all");
  const [filterComposante, setFilterComposante] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(mockCDPCategories.map(c => c.id));
  
  // États pour les collectes
  const [collectes, setCollectes] = useState<CDPCollecteSuivi[]>(
    generateMockCollectes(evaluation.id, evaluation.year)
  );
  const [selectedCollecte, setSelectedCollecte] = useState<CDPCollecteSuivi | null>(null);
  const [collecteFichesData, setCollecteFichesData] = useState<Record<string, any[]>>({});

  // Initialiser les données des fiches pour chaque collecte
  const getCollecteFiches = (collecteId: string) => {
    if (collecteFichesData[collecteId]) {
      return collecteFichesData[collecteId];
    }
    // Générer les données basées sur les fiches existantes
    return cdp.indicateurs.map(ind => {
      const existingFiche = fiches.find(f => f.indicateurRefId === ind.indicateurRefId);
      const yearIdx = evaluation.year - cdp.startYear;
      const target = yearIdx === 0 ? ind.targetYear1 : yearIdx === 1 ? ind.targetYear2 : ind.targetYear3;
      return {
        indicateurRefId: ind.indicateurRefId,
        indicateurCode: ind.indicateurCode,
        indicateurName: ind.indicateurName,
        composanteId: ind.composanteId,
        composanteName: ind.composanteName,
        unit: ind.unit,
        uniteMesureIds: ind.uniteMesureIds,
        targetValue: target,
        currentValue: existingFiche?.currentValue,
        observations: existingFiche?.observations,
      };
    });
  };

  // Calculer les stats pour chaque collecte
  const collectesWithStats = collectes.map(collecte => {
    const fichesData = getCollecteFiches(collecte.id);
    const renseignes = fichesData.filter(f => f.currentValue !== undefined).length;
    const avgPerf = fichesData
      .filter(f => f.currentValue !== undefined)
      .reduce((acc, f) => acc + calculatePerformanceRate(f.targetValue, f.currentValue), 0) / renseignes || 0;
    return {
      collecte,
      totalIndicateurs: fichesData.length,
      renseignes,
      avgPerformance: avgPerf,
    };
  }).sort((a, b) => new Date(b.collecte.date).getTime() - new Date(a.collecte.date).getTime());

  // Obtenir les cibles de l'année
  const getTargetForYear = (indicateurRefId: string): number => {
    const ind = cdp.indicateurs.find(i => i.indicateurRefId === indicateurRefId);
    if (!ind) return 0;
    const yearIndex = evaluation.year - cdp.startYear;
    if (yearIndex === 0) return ind.targetYear1;
    if (yearIndex === 1) return ind.targetYear2;
    return ind.targetYear3;
  };

  // Filtrer les fiches
  const filteredFiches = fiches.filter(f => {
    const composante = mockCDPComposantes.find(c => c.id === f.composanteId);
    if (filterCategorie !== "all" && composante?.categorieId !== filterCategorie) return false;
    if (filterComposante !== "all" && f.composanteId !== filterComposante) return false;
    if (filterStatus !== "all" && f.status !== filterStatus) return false;
    return true;
  });

  // Composantes filtrées par catégorie sélectionnée
  const filteredComposantes = filterCategorie === "all" 
    ? mockCDPComposantes 
    : mockCDPComposantes.filter(c => c.categorieId === filterCategorie);

  // Composantes uniques présentes dans les fiches
  const composantesPresentes = [...new Set(fiches.map(f => f.composanteId))].map(id => 
    mockCDPComposantes.find(c => c.id === id)
  ).filter(Boolean);

  // Regrouper par catégorie puis composante
  const fichesByCategory = mockCDPCategories.map(cat => {
    const catComposantes = mockCDPComposantes.filter(c => c.categorieId === cat.id);
    const composantesWithFiches = catComposantes.map(comp => {
      const compFiches = filteredFiches.filter(f => f.composanteId === comp.id);
      const avgPerf = compFiches.filter(f => f.performanceRate).reduce((acc, f) => acc + (f.performanceRate || 0), 0) / compFiches.filter(f => f.performanceRate).length || 0;
      return { composante: comp, fiches: compFiches, avgPerf };
    }).filter(c => c.fiches.length > 0);
    return { categorie: cat, composantes: composantesWithFiches };
  }).filter(c => c.composantes.length > 0);

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleOpenFiche = (fiche: CDPFicheSuiviIndicateur) => {
    setSelectedFiche(fiche);
    setFormOpen(true);
  };

  const handleSaveFiche = (updatedFiche: CDPFicheSuiviIndicateur) => {
    onUpdateFiche(updatedFiche);
    toast({ title: "Fiche mise à jour", description: "Les données ont été enregistrées" });
  };

  const handleWorkflowAction = (fiche: CDPFicheSuiviIndicateur, action: "submit" | "validate" | "approve" | "reject") => {
    let newStatus: CDPFicheSuiviStatus = fiche.status;
    let updates: Partial<CDPFicheSuiviIndicateur> = {};
    const now = new Date().toISOString();

    switch (action) {
      case "submit":
        newStatus = "soumis";
        updates = { submittedAt: now, submittedBy: "Utilisateur" };
        break;
      case "validate":
        newStatus = "valide";
        updates = { validatedAt: now, validatedBy: "Validateur" };
        break;
      case "approve":
        newStatus = "approuve";
        updates = { approvedAt: now, approvedBy: "Approbateur" };
        break;
      case "reject":
        newStatus = "brouillon";
        break;
    }

    onUpdateFiche({ ...fiche, status: newStatus, ...updates });
    toast({ 
      title: "Statut mis à jour", 
      description: `Fiche ${CDP_FICHE_STATUS_LABELS[newStatus].toLowerCase()}` 
    });
  };

  // Handlers pour les collectes
  const handleCreateCollecte = (data: Omit<CDPCollecteSuivi, "id" | "createdAt" | "createdBy" | "status">) => {
    const newCollecte: CDPCollecteSuivi = {
      ...data,
      id: `collecte-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: "Utilisateur actuel",
      status: "brouillon",
    };
    setCollectes(prev => [...prev, newCollecte]);
    
    // Initialiser les données des fiches pour cette collecte (avec valeurs précédentes si disponibles)
    const previousCollecte = collectes.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    const previousFiches = previousCollecte ? getCollecteFiches(previousCollecte.id) : [];
    
    const newFichesData = cdp.indicateurs.map(ind => {
      const prevFiche = previousFiches.find(f => f.indicateurRefId === ind.indicateurRefId);
      const yearIdx = evaluation.year - cdp.startYear;
      const target = yearIdx === 0 ? ind.targetYear1 : yearIdx === 1 ? ind.targetYear2 : ind.targetYear3;
      return {
        indicateurRefId: ind.indicateurRefId,
        indicateurCode: ind.indicateurCode,
        indicateurName: ind.indicateurName,
        composanteId: ind.composanteId,
        composanteName: ind.composanteName,
        unit: ind.unit,
        uniteMesureIds: ind.uniteMesureIds,
        targetValue: target,
        currentValue: undefined,
        previousValue: prevFiche?.currentValue,
        observations: undefined,
      };
    });
    
    setCollecteFichesData(prev => ({ ...prev, [newCollecte.id]: newFichesData }));
    toast({ title: "Fiche créée", description: `${newCollecte.libelle} a été créée` });
    setSelectedCollecte(newCollecte);
  };

  const handleSaveCollecte = (collecte: CDPCollecteSuivi, fichesData: any[]) => {
    setCollecteFichesData(prev => ({ ...prev, [collecte.id]: fichesData }));
  };

  const handleCollecteWorkflowAction = (action: "submit" | "validate" | "approve" | "reject") => {
    if (!selectedCollecte) return;
    
    let newStatus: CDPCollecteSuivi["status"] = selectedCollecte.status;
    let updates: Partial<CDPCollecteSuivi> = {};
    const now = new Date().toISOString();

    switch (action) {
      case "submit":
        newStatus = "soumis";
        updates = { submittedAt: now, submittedBy: "Utilisateur" };
        break;
      case "validate":
        newStatus = "valide";
        updates = { validatedAt: now, validatedBy: "Validateur" };
        break;
      case "approve":
        newStatus = "approuve";
        updates = { approvedAt: now, approvedBy: "Approbateur" };
        break;
      case "reject":
        newStatus = "brouillon";
        break;
    }

    const updatedCollecte = { ...selectedCollecte, status: newStatus, ...updates };
    setCollectes(prev => prev.map(c => c.id === selectedCollecte.id ? updatedCollecte : c));
    setSelectedCollecte(updatedCollecte);
    
    toast({ 
      title: "Statut mis à jour", 
      description: `Fiche ${CDP_FICHE_STATUS_LABELS[newStatus].toLowerCase()}` 
    });
  };

  const handleExportCollecte = (collecte: CDPCollecteSuivi) => {
    const fichesData = getCollecteFiches(collecte.id);
    exportFichesSuiviToPDF({
      cdpName: cdp.name,
      year: evaluation.year,
      fiches: fichesData.map(f => ({
        id: `${collecte.id}-${f.indicateurRefId}`,
        evaluationId: evaluation.id,
        indicateurRefId: f.indicateurRefId,
        indicateurCode: f.indicateurCode,
        indicateurName: f.indicateurName,
        composanteId: f.composanteId,
        composanteName: f.composanteName,
        unit: f.unit,
        targetValue: f.targetValue,
        currentValue: f.currentValue,
        performanceRate: f.currentValue !== undefined ? calculatePerformanceRate(f.targetValue, f.currentValue) : undefined,
        status: collecte.status,
        observations: f.observations,
      })),
    });
  };

  const getPerformanceColor = (rate: number | undefined) => {
    if (rate === undefined) return "";
    if (rate >= 100) return "text-green-600 bg-green-50 dark:bg-green-900/20";
    if (rate >= 80) return "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
    return "text-red-600 bg-red-50 dark:bg-red-900/20";
  };

  // Export data
  const exportColumns = [
    { key: "Code", header: "Code" },
    { key: "Indicateur", header: "Indicateur" },
    { key: "Catégorie", header: "Catégorie" },
    { key: "Composante", header: "Composante" },
    { key: "Unité", header: "Unité" },
    { key: "Cible", header: "Cible" },
    { key: "Réalisé", header: "Réalisé" },
    { key: "Performance", header: "Performance (%)" },
    { key: "Statut", header: "Statut" },
    { key: "Observations", header: "Observations" },
  ];

  const exportData = fiches.map(f => {
    const composante = mockCDPComposantes.find(c => c.id === f.composanteId);
    const categorie = mockCDPCategories.find(c => c.id === composante?.categorieId);
    return {
      Code: f.indicateurCode,
      Indicateur: f.indicateurName,
      Catégorie: categorie?.name || "",
      Composante: f.composanteName,
      Unité: f.unit,
      Cible: f.targetValue,
      Réalisé: f.currentValue || "",
      Performance: f.performanceRate || "",
      Statut: CDP_FICHE_STATUS_LABELS[f.status],
      Observations: f.observations || "",
    };
  });

  // Si une collecte est sélectionnée, afficher le détail
  if (selectedCollecte) {
    const previousCollectes = collectes
      .filter(c => new Date(c.date) < new Date(selectedCollecte.date))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const previousCollecte = previousCollectes[0];
    
    const fichesData = getCollecteFiches(selectedCollecte.id);
    const previousFichesData = previousCollecte ? getCollecteFiches(previousCollecte.id) : [];
    
    // Ajouter les valeurs précédentes
    const fichesWithPrevious = fichesData.map(f => ({
      ...f,
      previousValue: previousFichesData.find(pf => pf.indicateurRefId === f.indicateurRefId)?.currentValue,
    }));

    return (
      <CDPCollecteDetail
        cdp={cdp}
        collecte={selectedCollecte}
        fichesData={fichesWithPrevious}
        previousCollecte={previousCollecte}
        year={evaluation.year}
        onBack={() => setSelectedCollecte(null)}
        onSave={handleSaveCollecte}
        onWorkflowAction={handleCollecteWorkflowAction}
        canValidate={canValidate}
        canApprove={canApprove}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Évaluation {evaluation.year}</h3>
          <p className="text-sm text-muted-foreground">{cdp.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("text-xs", CDP_STATUS_COLORS[evaluation.status])}>
            {CDP_STATUS_LABELS[evaluation.status]}
          </Badge>
          <ExportButtons 
            onExportCSV={() => exportToCSV(exportData, exportColumns, `CDP_Evaluation_${evaluation.year}`)} 
            onExportPDF={() => exportFichesSuiviToPDF({ cdpName: cdp.name, year: evaluation.year, fiches })} 
          />
        </div>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="collectes" className="gap-1">
            <History className="w-4 h-4" /> Fiches de suivi
          </TabsTrigger>
          <TabsTrigger value="indicateurs" className="gap-1">
            <FileText className="w-4 h-4" /> Vue indicateurs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="collectes" className="mt-4">
          <CDPCollecteList
            collectes={collectesWithStats}
            onNewCollecte={() => setCollecteFormOpen(true)}
            onViewCollecte={setSelectedCollecte}
            onExportCollecte={handleExportCollecte}
          />
        </TabsContent>

        <TabsContent value="indicateurs" className="mt-4">
          {/* Filtres */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterCategorie} onValueChange={(v) => { setFilterCategorie(v); setFilterComposante("all"); }}>
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {mockCDPCategories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterComposante} onValueChange={setFilterComposante}>
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="Composante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes composantes</SelectItem>
                {filteredComposantes.filter(c => composantesPresentes.some(cp => cp?.id === c.id)).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {Object.entries(CDP_FICHE_STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Liste des fiches groupées par catégorie/composante */}
          {fichesByCategory.map(({ categorie, composantes }) => (
            <Collapsible 
              key={categorie.id}
              open={expandedCategories.includes(categorie.id)}
              onOpenChange={() => toggleCategory(categorie.id)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg hover:bg-primary/15 transition-colors">
                  {expandedCategories.includes(categorie.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <Badge className="text-xs font-mono bg-primary text-primary-foreground">{categorie.code}</Badge>
                  <span className="font-semibold text-sm">{categorie.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {composantes.reduce((acc, c) => acc + c.fiches.length, 0)} indicateur(s)
                  </span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {composantes.map(({ composante, fiches: compFiches, avgPerf }) => (
                  <Card key={composante.id}>
                    <CardHeader className="py-2 px-4 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs font-mono">{composante.code}</Badge>
                          <CardTitle className="text-sm font-medium">{composante.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{compFiches.length} indicateur(s)</span>
                          {avgPerf > 0 && (
                            <Badge variant="outline" className={cn("text-xs", getPerformanceColor(avgPerf))}>
                              {Math.round(avgPerf)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20">Code</TableHead>
                            <TableHead>Indicateur</TableHead>
                            <TableHead className="text-right w-20">Cible</TableHead>
                            <TableHead className="text-right w-20">Réalisé</TableHead>
                            <TableHead className="w-24">Perf.</TableHead>
                            <TableHead className="w-20">Statut</TableHead>
                            <TableHead className="text-right w-28">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {compFiches.map(fiche => (
                            <TableRow
                              key={fiche.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleOpenFiche(fiche)}
                            >
                              <TableCell className="font-mono text-xs">{fiche.indicateurCode}</TableCell>
                              <TableCell className="text-sm">{fiche.indicateurName}</TableCell>
                              <TableCell className="text-right text-sm">{formatMontant(fiche.targetValue)} {fiche.unit}</TableCell>
                              <TableCell className="text-right text-sm">
                                {fiche.currentValue !== undefined ? formatMontant(fiche.currentValue) : "-"} {fiche.unit}
                              </TableCell>
                              <TableCell>
                                {fiche.performanceRate !== undefined ? (
                                  <div className="flex items-center gap-1">
                                    <Progress value={Math.min(fiche.performanceRate, 100)} className="h-2 flex-1" />
                                    <span className={cn("text-xs font-medium w-9", getPerformanceColor(fiche.performanceRate))}>
                                      {fiche.performanceRate}%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge className={cn("text-xs", CDP_FICHE_STATUS_COLORS[fiche.status])}>
                                  {fiche.status === "approuve" && <Lock className="w-3 h-3 mr-1" />}
                                  {CDP_FICHE_STATUS_LABELS[fiche.status]}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenFiche(fiche)}>
                                    {fiche.status === "approuve" ? <Eye className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
                                  </Button>
                                  {fiche.status === "brouillon" && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => handleWorkflowAction(fiche, "submit")} title="Soumettre">
                                      <Send className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                  {fiche.status === "soumis" && canValidate && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => handleWorkflowAction(fiche, "validate")} title="Valider">
                                      <CheckCircle className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                  {fiche.status === "valide" && canApprove && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => handleWorkflowAction(fiche, "approve")} title="Approuver">
                                      <Award className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                  {(fiche.status === "soumis" || fiche.status === "valide") && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-600" onClick={() => handleWorkflowAction(fiche, "reject")} title="Rejeter">
                                      <Unlock className="w-3.5 h-3.5" />
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
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}

          {filteredFiches.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucune fiche de suivi trouvée</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de fiche */}
      {selectedFiche && (
        <CDPFicheSuiviForm
          open={formOpen}
          onOpenChange={setFormOpen}
          fiche={selectedFiche}
          onSave={handleSaveFiche}
          readOnly={selectedFiche.status === "approuve"}
        />
      )}

      {/* Dialog de création de collecte */}
      <CDPCollecteForm
        open={collecteFormOpen}
        onOpenChange={setCollecteFormOpen}
        evaluationId={evaluation.id}
        year={evaluation.year}
        existingCollectes={collectes}
        onSave={handleCreateCollecte}
      />
    </div>
  );
};

export default CDPEvaluationDetail;
