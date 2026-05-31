import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  CDP, CDPEvaluationAnnuelle, CDPFicheSuiviIndicateur,
  CDP_STATUS_LABELS, CDP_STATUS_COLORS,
  mockCDPs, mockCDPEvaluations, mockCDPFichesSuivi, mockCDPCategories, mockCDPComposantes,
  calculatePerformanceRate
} from "@/types/cdp";
import { cn } from "@/lib/utils";
import { ArrowLeft, Play, Lock, Edit, BarChart3, FileText, Calendar, Settings, Filter, ChevronDown, ChevronRight, AlertTriangle, CheckCircle } from "lucide-react";
import CDPDashboard from "@/components/cdp/CDPDashboard";
import CDPEvaluationDetail from "@/components/cdp/CDPEvaluationDetail";
import CDPForm from "@/components/cdp/CDPForm";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { useIsMobile } from "@/hooks/use-mobile";

const CDPDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [cdp, setCDP] = useState<CDP | null>(null);
  const [evaluations, setEvaluations] = useState<CDPEvaluationAnnuelle[]>([]);
  const [fiches, setFiches] = useState<CDPFicheSuiviIndicateur[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  // Récupérer l'onglet depuis l'URL si présent
  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = searchParams.get("tab") || "dashboard";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editOpen, setEditOpen] = useState(false);
  const [filterCategorie, setFilterCategorie] = useState<string>("all");
  const [filterComposante, setFilterComposante] = useState<string>("all");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(mockCDPCategories.map(c => c.id));
  const [showActivationDialog, setShowActivationDialog] = useState(false);

  useEffect(() => {
    // Charger les données du CDP
    const foundCDP = mockCDPs.find(c => c.id === id);
    if (foundCDP) {
      setCDP(foundCDP);
      const cdpEvaluations = mockCDPEvaluations.filter(e => e.cdpId === foundCDP.id);
      setEvaluations(cdpEvaluations);
      setFiches(mockCDPFichesSuivi.filter(f => cdpEvaluations.some(e => e.id === f.evaluationId)));
      setSelectedYear(foundCDP.startYear);
    }
  }, [id]);

  if (!cdp) {
    return (
      <DashboardLayout title="CDP introuvable" subtitle="">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Ce contrat de performance n'existe pas</p>
            <Button className="mt-4" onClick={() => navigate("/contrat-performance")}>
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const currentEvaluation = evaluations.find(e => e.year === selectedYear);
  const yearFiches = fiches.filter(f => f.evaluationId === currentEvaluation?.id);

  const handleActivateCDP = () => {
    setCDP(prev => prev ? { ...prev, status: "actif", activatedAt: new Date().toISOString(), activatedBy: "Utilisateur" } : null);
    // Créer les évaluations annuelles et les fiches
    const newEvaluations: CDPEvaluationAnnuelle[] = [cdp.startYear, cdp.startYear + 1, cdp.startYear + 2].map((year, idx) => ({
      id: `eval-new-${idx}`,
      cdpId: cdp.id,
      cdpName: cdp.name,
      year,
      status: year === cdp.startYear ? "actif" : "brouillon",
      createdAt: new Date().toISOString(),
      createdBy: "Utilisateur",
    }));
    setEvaluations(newEvaluations);
    
    // Créer les fiches pour chaque évaluation
    const newFiches: CDPFicheSuiviIndicateur[] = [];
    newEvaluations.forEach((eval_) => {
      cdp.indicateurs.forEach(ind => {
        const yearIdx = eval_.year - cdp.startYear;
        const target = yearIdx === 0 ? ind.targetYear1 : yearIdx === 1 ? ind.targetYear2 : ind.targetYear3;
        newFiches.push({
          id: `fiche-${eval_.id}-${ind.indicateurRefId}`,
          evaluationId: eval_.id,
          indicateurRefId: ind.indicateurRefId,
          indicateurCode: ind.indicateurCode,
          indicateurName: ind.indicateurName,
          composanteId: ind.composanteId,
          composanteName: ind.composanteName,
          unit: ind.unit,
          targetValue: target,
          status: "brouillon",
        });
      });
    });
    setFiches(newFiches);
    
    toast({ title: "CDP activé", description: "Le contrat de performance est maintenant actif" });
  };

  const handleCloseCDP = () => {
    setCDP(prev => prev ? { ...prev, status: "cloture", closedAt: new Date().toISOString(), closedBy: "Utilisateur" } : null);
    toast({ title: "CDP clôturé", description: "Le contrat de performance a été clôturé" });
  };

  const handleUpdateFiche = (updatedFiche: CDPFicheSuiviIndicateur) => {
    setFiches(prev => prev.map(f => f.id === updatedFiche.id ? updatedFiche : f));
  };

  const handleSaveCDP = (updatedCDP: Omit<CDP, "id" | "createdAt" | "createdBy">) => {
    setCDP(prev => prev ? { ...prev, ...updatedCDP } : null);
    toast({ title: "CDP mis à jour", description: "Les modifications ont été enregistrées" });
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  // Filtrer les composantes selon la catégorie
  const filteredComposantes = filterCategorie === "all" 
    ? mockCDPComposantes 
    : mockCDPComposantes.filter(c => c.categorieId === filterCategorie);

  // Filtrer et regrouper les indicateurs pour l'onglet Configuration
  const filteredIndicateurs = cdp.indicateurs.filter(ind => {
    const composante = mockCDPComposantes.find(c => c.id === ind.composanteId);
    if (filterCategorie !== "all" && composante?.categorieId !== filterCategorie) return false;
    if (filterComposante !== "all" && ind.composanteId !== filterComposante) return false;
    return true;
  });

  const indicateursByCategory = mockCDPCategories.map(cat => {
    const catComposantes = mockCDPComposantes.filter(c => c.categorieId === cat.id);
    const composantesWithIndicateurs = catComposantes.map(comp => {
      const compIndicateurs = filteredIndicateurs.filter(ind => ind.composanteId === comp.id);
      return { composante: comp, indicateurs: compIndicateurs };
    }).filter(c => c.indicateurs.length > 0);
    return { categorie: cat, composantes: composantesWithIndicateurs };
  }).filter(c => c.composantes.length > 0);

  return (
    <DashboardLayout 
      title={cdp.name} 
      subtitle={`${cdp.code} • ${cdp.startYear} - ${cdp.endYear}`}
    >
      <div className="space-y-4">
        {/* En-tête - Responsive */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/contrat-performance")} className="h-8 px-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Retour</span>
          </Button>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Badge className={cn("text-[10px] sm:text-xs", CDP_STATUS_COLORS[cdp.status])}>
              {CDP_STATUS_LABELS[cdp.status]}
            </Badge>
            {cdp.status === "brouillon" && (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="h-7 text-xs px-2">
                  <Edit className="w-3.5 h-3.5 sm:mr-1" /> <span className="hidden sm:inline">Modifier</span>
                </Button>
                <Button size="sm" onClick={() => setShowActivationDialog(true)} className="h-7 text-xs px-2">
                  <Play className="w-3.5 h-3.5 sm:mr-1" /> <span className="hidden sm:inline">Activer</span>
                </Button>
              </>
            )}
            {cdp.status === "actif" && (
              <Button variant="outline" size="sm" onClick={handleCloseCDP} className="h-7 text-xs px-2">
                <Lock className="w-3.5 h-3.5 sm:mr-1" /> <span className="hidden sm:inline">Clôturer</span>
              </Button>
            )}
          </div>
        </div>

        {/* Sélecteur d'année - Responsive */}
        {cdp.status !== "brouillon" && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedYear?.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[100px] sm:w-[120px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[cdp.startYear, cdp.startYear + 1, cdp.startYear + 2].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Contenu selon le statut */}
        {cdp.status === "brouillon" ? (
          <Card>
            <CardHeader className="py-3 px-3 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-sm sm:text-base">Configuration du CDP</CardTitle>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <Select value={filterCategorie} onValueChange={(v) => { setFilterCategorie(v); setFilterComposante("all"); }}>
                    <SelectTrigger className="w-[120px] sm:w-[160px] h-7 text-xs">
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
                    <SelectTrigger className="w-[120px] sm:w-[160px] h-7 text-xs">
                      <SelectValue placeholder="Composante" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes composantes</SelectItem>
                      {filteredComposantes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-3 sm:px-6">
              {/* Mobile: Accordion stats */}
              <div className="md:hidden">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Période</p>
                    <p className="font-semibold text-sm">{cdp.startYear} - {cdp.endYear}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Indicateurs</p>
                    <p className="font-semibold text-sm">{cdp.indicateurs.length}</p>
                  </div>
                </div>
                <Accordion type="single" collapsible className="mt-2">
                  <AccordionItem value="more" className="border-0">
                    <AccordionTrigger className="py-1.5 text-xs text-muted-foreground hover:no-underline">
                      Plus de détails
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-[10px] text-muted-foreground">Créé le</p>
                          <p className="font-medium text-xs">{new Date(cdp.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-[10px] text-muted-foreground">Par</p>
                          <p className="font-medium text-xs">{cdp.createdBy}</p>
                        </div>
                      </div>
                      {cdp.description && (
                        <div className="mt-2">
                          <p className="text-[10px] text-muted-foreground mb-1">Description</p>
                          <p className="text-xs">{cdp.description}</p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Desktop: Grid stats */}
              <div className="hidden md:grid grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Période</p>
                  <p className="font-semibold">{cdp.startYear} - {cdp.endYear}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Indicateurs</p>
                  <p className="font-semibold">{cdp.indicateurs.length}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Créé le</p>
                  <p className="font-semibold">{new Date(cdp.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Par</p>
                  <p className="font-semibold">{cdp.createdBy}</p>
                </div>
              </div>

              {cdp.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{cdp.description}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-2">Indicateurs sélectionnés ({filteredIndicateurs.length})</p>
                <div className="space-y-2 max-h-[400px] overflow-auto">
                  {indicateursByCategory.map(({ categorie, composantes }) => (
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
                            {composantes.reduce((acc, c) => acc + c.indicateurs.length, 0)} indicateur(s)
                          </span>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2 mt-2 pl-4">
                        {composantes.map(({ composante, indicateurs }) => (
                          <div key={composante.id} className="border rounded-lg">
                            <div className="flex items-center gap-2 p-2 bg-muted/30 border-b">
                              <Badge variant="secondary" className="text-xs font-mono">{composante.code}</Badge>
                              <span className="text-sm font-medium">{composante.name}</span>
                              <span className="text-xs text-muted-foreground ml-auto">{indicateurs.length} indicateur(s)</span>
                            </div>
                            <div className="divide-y">
                              {indicateurs.map(ind => (
                                <div key={ind.indicateurRefId} className="p-2 flex items-center justify-between text-sm">
                                  <div className="flex-1 min-w-0">
                                    <span className="font-mono text-xs text-muted-foreground mr-2">{ind.indicateurCode}</span>
                                    <span className="text-sm">{ind.indicateurName}</span>
                                  </div>
                                  <div className="flex gap-3 text-xs text-muted-foreground whitespace-nowrap">
                                    <span>Base: {ind.baselineValue}{ind.unit}</span>
                                    <span>{cdp.startYear}: {ind.targetYear1}{ind.unit}</span>
                                    <span>{cdp.startYear + 1}: {ind.targetYear2}{ind.unit}</span>
                                    <span>{cdp.startYear + 2}: {ind.targetYear3}{ind.unit}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3 h-9 sm:h-10">
              <TabsTrigger value="dashboard" className="gap-1 text-xs sm:text-sm px-1 sm:px-3">
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Tableau de bord</span><span className="sm:hidden">TB</span>
              </TabsTrigger>
              <TabsTrigger value="fiches" className="gap-1 text-xs sm:text-sm px-1 sm:px-3">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Fiches de suivi</span><span className="sm:hidden">Fiches</span>
              </TabsTrigger>
              <TabsTrigger value="config" className="gap-1 text-xs sm:text-sm px-1 sm:px-3">
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Configuration</span><span className="sm:hidden">Config</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-4">
              <CDPDashboard 
                cdp={cdp} 
                evaluations={evaluations} 
                fiches={fiches}
                selectedYear={selectedYear || cdp.startYear}
              />
            </TabsContent>

            <TabsContent value="fiches" className="mt-4">
              {currentEvaluation ? (
                <CDPEvaluationDetail
                  cdp={cdp}
                  evaluation={currentEvaluation}
                  fiches={yearFiches}
                  onUpdateFiche={handleUpdateFiche}
                />
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Aucune évaluation pour cette année
                  </CardContent>
                </Card>
              )}
            </TabsContent>


            <TabsContent value="config" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Configuration du CDP</CardTitle>
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <Select value={filterCategorie} onValueChange={(v) => { setFilterCategorie(v); setFilterComposante("all"); }}>
                        <SelectTrigger className="w-[160px] h-7 text-xs">
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
                        <SelectTrigger className="w-[160px] h-7 text-xs">
                          <SelectValue placeholder="Composante" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes composantes</SelectItem>
                          {filteredComposantes.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Période</p>
                      <p className="font-semibold">{cdp.startYear} - {cdp.endYear}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Indicateurs</p>
                      <p className="font-semibold">{cdp.indicateurs.length}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Activé le</p>
                      <p className="font-semibold">{cdp.activatedAt ? new Date(cdp.activatedAt).toLocaleDateString('fr-FR') : "-"}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Par</p>
                      <p className="font-semibold">{cdp.activatedBy || "-"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Cibles par année ({filteredIndicateurs.length} indicateurs)</p>
                    <div className="space-y-2 max-h-[400px] overflow-auto">
                      {indicateursByCategory.map(({ categorie, composantes }) => (
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
                                {composantes.reduce((acc, c) => acc + c.indicateurs.length, 0)} indicateur(s)
                              </span>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2 pl-4">
                            <div className="border rounded-lg overflow-hidden">
                              <div className="grid grid-cols-7 gap-2 p-2 bg-muted/50 text-xs font-medium border-b">
                                <div className="col-span-3">Indicateur</div>
                                <div className="text-right">Base</div>
                                <div className="text-right">{cdp.startYear}</div>
                                <div className="text-right">{cdp.startYear + 1}</div>
                                <div className="text-right">{cdp.startYear + 2}</div>
                              </div>
                              {composantes.map(({ composante, indicateurs }) => (
                                <div key={composante.id}>
                                  <div className="flex items-center gap-2 p-2 bg-muted/30 border-b">
                                    <Badge variant="secondary" className="text-xs font-mono">{composante.code}</Badge>
                                    <span className="text-sm font-medium">{composante.name}</span>
                                  </div>
                                  <div className="divide-y">
                                    {indicateurs.map(ind => (
                                      <div key={ind.indicateurRefId} className="grid grid-cols-7 gap-2 p-2 text-sm">
                                        <div className="col-span-3 flex items-center gap-1">
                                          <span className="font-mono text-xs text-muted-foreground">{ind.indicateurCode}</span>
                                          <span className="text-sm truncate">{ind.indicateurName}</span>
                                        </div>
                                        <div className="text-right text-xs">{ind.baselineValue} {ind.unit}</div>
                                        <div className="text-right text-xs">{ind.targetYear1} {ind.unit}</div>
                                        <div className="text-right text-xs">{ind.targetYear2} {ind.unit}</div>
                                        <div className="text-right text-xs">{ind.targetYear3} {ind.unit}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Dialog d'édition */}
      <CDPForm 
        open={editOpen} 
        onOpenChange={setEditOpen} 
        initialData={cdp}
        onSave={handleSaveCDP}
      />

      {/* Dialog de confirmation d'activation */}
      <AlertDialog open={showActivationDialog} onOpenChange={setShowActivationDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirmer l'activation du CDP
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>Vous êtes sur le point d'activer le contrat de performance <strong>{cdp.name}</strong>.</p>
                
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <div className="text-sm font-medium text-foreground">Vérification des données :</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Période : {cdp.startYear} - {cdp.endYear}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {cdp.indicateurs.length > 0 ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                      <span>{cdp.indicateurs.length} indicateur(s)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {cdp.indicateurs.every(i => i.targetYear1 > 0 || i.targetYear2 > 0 || i.targetYear3 > 0) ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      <span>Cibles définies</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Créé par {cdp.createdBy}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Attention :</strong> Une fois activé, le CDP ne pourra plus être modifié. 
                    Les fiches de suivi annuelles seront automatiquement créées.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleActivateCDP}
              disabled={cdp.indicateurs.length === 0}
              className="bg-primary"
            >
              <Play className="w-4 h-4 mr-1" />
              Confirmer l'activation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default CDPDetail;
