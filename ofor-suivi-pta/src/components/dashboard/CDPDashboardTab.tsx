import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Filter, Target, TrendingUp, Award, AlertTriangle, TrendingDown, ChevronRight, Download, FileSpreadsheet, Eye, Send } from "lucide-react";
import ShareByEmailDialog from "@/components/share/ShareByEmailDialog";
import { CDP, mockCDPs, mockCDPCategories, mockCDPComposantes, mockCDPEvaluations, mockCDPFichesSuivi } from "@/types/cdp";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell, PieChart, Pie, Legend, LineChart, Line } from "recharts";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ReportHeaderSettings } from "@/lib/exportReportUtils";
import {
  exportCDPDashboardToPDF,
  exportCDPDashboardToCSV,
  CDPExportData,
  CDPExportFilters,
} from "@/lib/exportDashboardUtils";
import CDPUnitAggregation from "@/components/cdp/CDPUnitAggregation";

interface CDPDashboardTabProps {
  selectedCDPId: string;
  onCDPChange: (cdpId: string) => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
  headerSettings?: ReportHeaderSettings;
}

const CDPDashboardTab = ({ selectedCDPId, onCDPChange, selectedYear, onYearChange, headerSettings }: CDPDashboardTabProps) => {
  const { toast } = useToast();
  const [selectedCategorieId, setSelectedCategorieId] = useState("all");
  const [selectedComposanteId, setSelectedComposanteId] = useState("all");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(mockCDPCategories.map(c => c.id)));
  const [selectedIndicateurRefId, setSelectedIndicateurRefId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const selectedCDP = mockCDPs.find(c => c.id === selectedCDPId) || mockCDPs[0];
  const cdpYears = selectedCDP ? [selectedCDP.startYear, selectedCDP.startYear + 1, selectedCDP.startYear + 2] : [];

  // Composantes filtrées selon la catégorie sélectionnée
  const filteredComposantes = useMemo(() => {
    if (selectedCategorieId === "all") return mockCDPComposantes;
    return mockCDPComposantes.filter(c => c.categorieId === selectedCategorieId);
  }, [selectedCategorieId]);

  // Récupérer les fiches de suivi pour l'année sélectionnée
  const cdpFiches = useMemo(() => {
    const evaluation = mockCDPEvaluations.find(e => e.cdpId === selectedCDPId && e.year === selectedYear);
    if (!evaluation) return [];
    return mockCDPFichesSuivi.filter(f => f.evaluationId === evaluation.id);
  }, [selectedCDPId, selectedYear]);

  // Fiches filtrées selon catégorie et composante
  const filteredFiches = useMemo(() => {
    let fiches = cdpFiches;
    if (selectedCategorieId !== "all") {
      const catComposantes = mockCDPComposantes.filter(c => c.categorieId === selectedCategorieId);
      fiches = fiches.filter(f => catComposantes.some(c => c.id === f.composanteId));
    }
    if (selectedComposanteId !== "all") {
      fiches = fiches.filter(f => f.composanteId === selectedComposanteId);
    }
    return fiches;
  }, [cdpFiches, selectedCategorieId, selectedComposanteId]);

  const fichesWithData = filteredFiches.filter(f => f.currentValue !== undefined);
  const avgPerformance = fichesWithData.length > 0 
    ? Math.round(fichesWithData.reduce((acc, f) => acc + (f.performanceRate || 0), 0) / fichesWithData.length)
    : 0;
  const atteints = fichesWithData.filter(f => (f.performanceRate || 0) >= 100).length;
  const enProgres = fichesWithData.filter(f => (f.performanceRate || 0) >= 80 && (f.performanceRate || 0) < 100).length;
  const enRetard = fichesWithData.filter(f => (f.performanceRate || 0) < 80).length;

  // Performance par catégorie pour radar
  const performanceByCategorie = useMemo(() => {
    return mockCDPCategories.map(cat => {
      const catComposantes = mockCDPComposantes.filter(c => c.categorieId === cat.id);
      const catFiches = cdpFiches.filter(f => catComposantes.some(c => c.id === f.composanteId) && f.currentValue !== undefined);
      const avgPerf = catFiches.length > 0 
        ? Math.round(catFiches.reduce((acc, f) => acc + (f.performanceRate || 0), 0) / catFiches.length)
        : 0;
      return { category: cat.name, performance: avgPerf, fullMark: 100 };
    });
  }, [cdpFiches]);

  // Données pour le pie chart
  const statusData = [
    { name: "Atteints", value: atteints, color: "#10b981" },
    { name: "En progression", value: enProgres, color: "#f59e0b" },
    { name: "En retard", value: enRetard, color: "#ef4444" },
  ].filter(s => s.value > 0);

  // Regrouper les indicateurs par catégorie et composante
  const indicateursByCategorie = useMemo(() => {
    const result: Record<string, {
      categorie: typeof mockCDPCategories[0];
      composantes: Record<string, {
        composante: typeof mockCDPComposantes[0];
        indicateurs: typeof selectedCDP.indicateurs;
        fiches: typeof cdpFiches;
      }>;
      totalIndicateurs: number;
      avgPerformance: number;
      atteints: number;
      enRetard: number;
    }> = {};

    // Filtrer les catégories selon le filtre
    const categories = selectedCategorieId === "all" 
      ? mockCDPCategories 
      : mockCDPCategories.filter(c => c.id === selectedCategorieId);

    categories.forEach(cat => {
      const catComposantes = mockCDPComposantes.filter(c => c.categorieId === cat.id);
      const catFiches = cdpFiches.filter(f => catComposantes.some(c => c.id === f.composanteId));
      const fichesWithData = catFiches.filter(f => f.currentValue !== undefined);
      
      result[cat.id] = {
        categorie: cat,
        composantes: {},
        totalIndicateurs: catFiches.length,
        avgPerformance: fichesWithData.length > 0 
          ? Math.round(fichesWithData.reduce((sum, f) => sum + (f.performanceRate || 0), 0) / fichesWithData.length)
          : 0,
        atteints: fichesWithData.filter(f => (f.performanceRate || 0) >= 100).length,
        enRetard: fichesWithData.filter(f => (f.performanceRate || 0) < 80).length,
      };

      // Filtrer les composantes selon le filtre
      const composantesToProcess = selectedComposanteId === "all"
        ? catComposantes
        : catComposantes.filter(c => c.id === selectedComposanteId);

      composantesToProcess.forEach(comp => {
        const compFiches = cdpFiches.filter(f => f.composanteId === comp.id);
        const compIndicateurs = selectedCDP?.indicateurs.filter(ind => ind.composanteId === comp.id) || [];
        
        result[cat.id].composantes[comp.id] = {
          composante: comp,
          indicateurs: compIndicateurs,
          fiches: compFiches,
        };
      });
    });

    return result;
  }, [selectedCDP, cdpFiches, selectedCategorieId, selectedComposanteId]);

  const toggleCategory = (catId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(catId)) {
      newExpanded.delete(catId);
    } else {
      newExpanded.add(catId);
    }
    setExpandedCategories(newExpanded);
  };

  const getPerformanceColor = (perf: number) => {
    if (perf >= 100) return "text-green-600";
    if (perf >= 80) return "text-amber-600";
    return "text-red-600";
  };

  const getPerformanceBg = (perf: number) => {
    if (perf >= 100) return "bg-green-500";
    if (perf >= 80) return "bg-amber-500";
    return "bg-red-500";
  };

  // Reset composante when category changes
  const handleCategorieChange = (catId: string) => {
    setSelectedCategorieId(catId);
    setSelectedComposanteId("all");
  };

  // Préparer les données pour l'export
  const exportData: CDPExportData = useMemo(() => ({
    cdpName: selectedCDP?.name || "",
    cdpCode: selectedCDP?.code || "",
    year: selectedYear,
    avgPerformance,
    atteints,
    enProgres,
    enRetard,
    totalIndicateurs: filteredFiches.length,
    categories: Object.values(indicateursByCategorie).map(({ categorie, composantes, avgPerformance: catAvg, atteints: catAtteints, enRetard: catEnRetard }) => ({
      code: categorie.code,
      name: categorie.name,
      avgPerformance: catAvg,
      atteints: catAtteints,
      enRetard: catEnRetard,
      composantes: Object.values(composantes).map(({ composante, indicateurs, fiches }) => {
        const compFichesWithData = fiches.filter(f => f.currentValue !== undefined);
        const compAvgPerf = compFichesWithData.length > 0 
          ? Math.round(compFichesWithData.reduce((sum, f) => sum + (f.performanceRate || 0), 0) / compFichesWithData.length)
          : 0;
        
        return {
          code: composante.code,
          name: composante.name,
          avgPerformance: compAvgPerf,
          indicateurs: indicateurs.map(ind => {
            const fiche = fiches.find(f => f.indicateurRefId === ind.indicateurRefId);
            const targetValue = selectedYear === selectedCDP?.startYear ? ind.targetYear1 
              : selectedYear === selectedCDP?.startYear! + 1 ? ind.targetYear2 
              : ind.targetYear3;
            
            return {
              code: ind.indicateurCode,
              name: ind.indicateurName,
              unit: ind.unit,
              target: targetValue || 0,
              current: fiche?.currentValue ?? 0,
              performance: fiche?.performanceRate ?? 0,
            };
          }),
        };
      }),
    })),
  }), [selectedCDP, selectedYear, avgPerformance, atteints, enProgres, enRetard, filteredFiches, indicateursByCategorie]);

  const exportFilters: CDPExportFilters = useMemo(() => ({
    cdpId: selectedCDPId,
    year: selectedYear,
    categoryId: selectedCategorieId,
    categoryName: selectedCategorieId !== "all" ? mockCDPCategories.find(c => c.id === selectedCategorieId)?.name : undefined,
    componentId: selectedComposanteId,
    componentName: selectedComposanteId !== "all" ? mockCDPComposantes.find(c => c.id === selectedComposanteId)?.name : undefined,
  }), [selectedCDPId, selectedYear, selectedCategorieId, selectedComposanteId]);

  const handleExportPDF = useCallback(() => {
    exportCDPDashboardToPDF(exportData, exportFilters, headerSettings);
    toast({
      title: "Export PDF",
      description: `Le rapport CDP ${selectedYear} a été généré avec les filtres appliqués.`,
    });
  }, [exportData, exportFilters, headerSettings, selectedYear, toast]);

  const handleExportExcel = useCallback(() => {
    exportCDPDashboardToCSV(exportData, exportFilters);
    toast({
      title: "Export Excel",
      description: `Le fichier CSV CDP ${selectedYear} a été téléchargé.`,
    });
  }, [exportData, exportFilters, selectedYear, toast]);

  return (
    <div className="space-y-4">
      {/* Header avec boutons d'export */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">Suivi CDP - {selectedYear}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShareOpen(true)}>
            <Send className="w-3.5 h-3.5" /> Partager
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </Button>
          <Button size="sm" className="h-7 text-xs gap-1" onClick={handleExportPDF}>
            <Download className="w-3.5 h-3.5" /> PDF
          </Button>
        </div>
      </div>

      {/* Filtres CDP */}
      <Card className="py-2">
        <CardContent className="py-2 px-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Filtres:</span>
            </div>

            <Select value={selectedCDPId} onValueChange={(v) => { onCDPChange(v); const cdp = mockCDPs.find(c => c.id === v); if (cdp) onYearChange(cdp.startYear); }}>
              <SelectTrigger className="w-52 h-7 text-xs">
                <SelectValue placeholder="Contrat de Performance" />
              </SelectTrigger>
              <SelectContent>
                {mockCDPs.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear.toString()} onValueChange={(v) => onYearChange(parseInt(v))}>
              <SelectTrigger className="w-24 h-7 text-xs">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {cdpYears.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategorieId} onValueChange={handleCategorieChange}>
              <SelectTrigger className="w-44 h-7 text-xs">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {mockCDPCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedComposanteId} onValueChange={setSelectedComposanteId}>
              <SelectTrigger className="w-44 h-7 text-xs">
                <SelectValue placeholder="Composante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes composantes</SelectItem>
                {filteredComposantes.map(comp => (
                  <SelectItem key={comp.id} value={comp.id}>{comp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10"><Target className="w-4 h-4 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Indicateurs</p>
              <p className="text-lg font-bold">{filteredFiches.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <div className={`p-2 rounded-lg ${avgPerformance >= 80 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
              <TrendingUp className={`w-4 h-4 ${avgPerformance >= 80 ? 'text-green-600' : 'text-amber-600'}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Performance moy.</p>
              <p className={`text-lg font-bold ${avgPerformance >= 80 ? 'text-green-600' : 'text-amber-600'}`}>{avgPerformance}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><Award className="w-4 h-4 text-green-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Atteints</p>
              <p className="text-lg font-bold text-green-600">{atteints}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><TrendingDown className="w-4 h-4 text-amber-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">En progression</p>
              <p className="text-lg font-bold text-amber-600">{enProgres}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">En retard</p>
              <p className="text-lg font-bold text-red-600">{enRetard}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Performance par catégorie</CardTitle></CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={performanceByCategorie}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                <Radar name="Performance" dataKey="performance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                <Tooltip formatter={(value: number) => [`${value}%`, "Performance"]} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Répartition des indicateurs - {selectedYear}</CardTitle></CardHeader>
          <CardContent className="h-[220px]">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="value" label={({ value }) => `${value}`}>
                    {statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [value, name]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (<div className="h-full flex items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>)}
          </CardContent>
        </Card>
      </div>

      {/* Tableau hiérarchique avec catégories collapsibles */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Indicateurs par catégorie et composante - {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {Object.values(indicateursByCategorie).map(({ categorie, composantes, totalIndicateurs, avgPerformance: catAvgPerf, atteints: catAtteints, enRetard: catEnRetard }) => (
              <Collapsible
                key={categorie.id}
                open={expandedCategories.has(categorie.id)}
                onOpenChange={() => toggleCategory(categorie.id)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-4 py-2 bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                      <ChevronRight className={cn("w-4 h-4 transition-transform", expandedCategories.has(categorie.id) && "rotate-90")} />
                      <Badge variant="outline" className="font-mono text-[10px]">{categorie.code}</Badge>
                      <span className="text-sm font-medium">{categorie.name}</span>
                      <span className="text-xs text-muted-foreground">({totalIndicateurs} indicateurs)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">Atteints:</span>
                        <Badge className="bg-green-100 text-green-700 text-[10px]">{catAtteints}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">Retard:</span>
                        <Badge className="bg-red-100 text-red-700 text-[10px]">{catEnRetard}</Badge>
                      </div>
                      <div className="w-24 flex items-center gap-1">
                        <Progress value={catAvgPerf} className="h-1.5 flex-1" />
                        <span className={cn("text-xs font-bold w-10 text-right", getPerformanceColor(catAvgPerf))}>{catAvgPerf}%</span>
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {Object.values(composantes).map(({ composante, indicateurs, fiches }) => {
                    const compFichesWithData = fiches.filter(f => f.currentValue !== undefined);
                    const compAvgPerf = compFichesWithData.length > 0 
                      ? Math.round(compFichesWithData.reduce((sum, f) => sum + (f.performanceRate || 0), 0) / compFichesWithData.length)
                      : 0;
                    
                    return (
                      <div key={composante.id} className="border-t">
                        {/* Header composante */}
                        <div className="flex items-center justify-between px-4 py-1.5 bg-muted/30 pl-10">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-mono text-[9px]">{composante.code}</Badge>
                            <span className="text-xs font-medium">{composante.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">{fiches.length} ind.</span>
                            <div className="w-16 flex items-center gap-1">
                              <Progress value={compAvgPerf} className="h-1 flex-1" />
                              <span className={cn("text-[10px] font-bold w-8 text-right", getPerformanceColor(compAvgPerf))}>{compAvgPerf}%</span>
                            </div>
                          </div>
                        </div>
                        {/* Indicateurs */}
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b bg-background">
                              <th className="text-left py-1 px-4 pl-14 font-medium text-[10px] text-muted-foreground">Indicateur</th>
                              <th className="text-center py-1 px-2 font-medium text-[10px] text-muted-foreground w-12">Unité</th>
                              <th className="text-right py-1 px-2 font-medium text-[10px] text-muted-foreground w-14">Cible</th>
                              <th className="text-right py-1 px-2 font-medium text-[10px] text-muted-foreground w-14">Réalisé</th>
                              <th className="text-right py-1 px-2 font-medium text-[10px] text-muted-foreground w-16">Performance</th>
                              <th className="text-center py-1 px-2 font-medium text-[10px] text-muted-foreground w-20">Tendance</th>
                              <th className="text-center py-1 px-2 font-medium text-[10px] text-muted-foreground w-24">Dernière fiche</th>
                            </tr>
                          </thead>
                          <tbody>
                            {indicateurs.map(ind => {
                              const fiche = fiches.find(f => f.indicateurRefId === ind.indicateurRefId);
                              const targetValue = selectedYear === selectedCDP?.startYear ? ind.targetYear1 
                                : selectedYear === selectedCDP?.startYear! + 1 ? ind.targetYear2 
                                : ind.targetYear3;
                              // Historique sur les 3 années (toutes évaluations CDP confondues)
                              const histYears = [selectedCDP!.startYear, selectedCDP!.startYear + 1, selectedCDP!.startYear + 2];
                              const trend = histYears.map(y => {
                                const ev = mockCDPEvaluations.find(e => e.cdpId === selectedCDPId && e.year === y);
                                const f = ev ? mockCDPFichesSuivi.find(x => x.evaluationId === ev.id && x.indicateurRefId === ind.indicateurRefId) : undefined;
                                return { year: y, perf: f?.performanceRate ?? null };
                              });
                              const trendData = trend.filter(t => t.perf !== null) as { year: number; perf: number }[];
                              // Dernière mise à jour
                              const lastDate = fiche?.validatedAt || fiche?.submittedAt || fiche?.approvedAt;
                              return (
                                <tr
                                  key={ind.indicateurRefId}
                                  className="border-b hover:bg-primary/10 cursor-pointer"
                                  onClick={() => setSelectedIndicateurRefId(ind.indicateurRefId)}
                                  title="Cliquer pour voir le détail"
                                >
                                  <td className="py-1 px-4 pl-14 text-[11px]">
                                    <span className="font-mono text-muted-foreground mr-1">{ind.indicateurCode}</span>
                                    {ind.indicateurName}
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10px] text-muted-foreground">{ind.unit}</td>
                                  <td className="py-1 px-2 text-right text-[11px]">{targetValue?.toLocaleString('fr-FR')}</td>
                                  <td className="py-1 px-2 text-right text-[11px]">
                                    {fiche?.currentValue !== undefined ? fiche.currentValue.toLocaleString('fr-FR') : '-'}
                                  </td>
                                  <td className="py-1 px-2 text-right">
                                    {fiche?.performanceRate !== undefined ? (
                                      <span className={cn("font-bold text-[11px]", getPerformanceColor(fiche.performanceRate))}>
                                        {fiche.performanceRate}%
                                      </span>
                                    ) : '-'}
                                  </td>
                                  <td className="py-1 px-2 text-center">
                                    {trendData.length >= 2 ? (
                                      <div className="h-6 w-16 mx-auto">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <LineChart data={trendData}>
                                            <Line type="monotone" dataKey="perf" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={{ r: 1.5 }} />
                                          </LineChart>
                                        </ResponsiveContainer>
                                      </div>
                                    ) : trendData.length === 1 ? (
                                      <span className="text-[10px] text-muted-foreground">{trendData[0].perf}%</span>
                                    ) : (<span className="text-[10px] text-muted-foreground">—</span>)}
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10px] text-muted-foreground">
                                    <div className="flex items-center justify-center gap-1">
                                      <span>{lastDate ? new Date(lastDate).toLocaleDateString('fr-FR') : '—'}</span>
                                      <Eye className="w-3 h-3 text-muted-foreground/60" />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Détail d'un indicateur */}
      {(() => {
        if (!selectedIndicateurRefId || !selectedCDP) return null;
        const ind = selectedCDP.indicateurs.find(i => i.indicateurRefId === selectedIndicateurRefId);
        if (!ind) return null;
        const composante = mockCDPComposantes.find(c => c.id === ind.composanteId);
        const categorie = composante ? mockCDPCategories.find(c => c.id === composante.categorieId) : undefined;
        const histYears = [selectedCDP.startYear, selectedCDP.startYear + 1, selectedCDP.startYear + 2];
        const targets = [ind.targetYear1, ind.targetYear2, ind.targetYear3];
        const rows = histYears.map((y, idx) => {
          const ev = mockCDPEvaluations.find(e => e.cdpId === selectedCDPId && e.year === y);
          const f = ev ? mockCDPFichesSuivi.find(x => x.evaluationId === ev.id && x.indicateurRefId === ind.indicateurRefId) : undefined;
          return {
            year: y,
            target: targets[idx],
            current: f?.currentValue,
            perf: f?.performanceRate,
            status: f?.status,
            date: f?.validatedAt || f?.submittedAt || f?.approvedAt,
            observations: (f as any)?.observations,
          };
        });
        const trend = rows.filter(r => r.perf !== undefined && r.perf !== null) as { year: number; perf: number }[];
        const lastFiche = [...rows].reverse().find(r => r.current !== undefined);
        return (
          <Dialog open onOpenChange={(o) => !o && setSelectedIndicateurRefId(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-mono text-xs text-muted-foreground">{ind.indicateurCode}</span>
                  <span>{ind.indicateurName}</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {categorie?.name} {composante ? `· ${composante.name}` : ""} · Unité : {ind.unit}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Card><CardContent className="p-2 text-center">
                  <p className="text-[9px] text-muted-foreground">Valeur de base</p>
                  <p className="text-sm font-bold">{ind.baselineValue?.toLocaleString('fr-FR') ?? '—'}</p>
                </CardContent></Card>
                <Card><CardContent className="p-2 text-center">
                  <p className="text-[9px] text-muted-foreground">Cible finale</p>
                  <p className="text-sm font-bold">{ind.targetYear3?.toLocaleString('fr-FR') ?? '—'}</p>
                </CardContent></Card>
                <Card><CardContent className="p-2 text-center">
                  <p className="text-[9px] text-muted-foreground">Dernière valeur</p>
                  <p className="text-sm font-bold">{lastFiche?.current !== undefined ? lastFiche.current.toLocaleString('fr-FR') : '—'}</p>
                </CardContent></Card>
                <Card><CardContent className="p-2 text-center">
                  <p className="text-[9px] text-muted-foreground">Perf. dernière</p>
                  <p className={cn("text-sm font-bold", lastFiche?.perf !== undefined ? getPerformanceColor(lastFiche.perf) : "")}>
                    {lastFiche?.perf !== undefined ? `${lastFiche.perf}%` : '—'}
                  </p>
                </CardContent></Card>
              </div>

              <Card>
                <CardHeader className="py-2"><CardTitle className="text-xs">Évolution annuelle</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="text-left py-1 px-2 text-[10px] font-medium text-muted-foreground">Année</th>
                          <th className="text-right py-1 px-2 text-[10px] font-medium text-muted-foreground">Cible</th>
                          <th className="text-right py-1 px-2 text-[10px] font-medium text-muted-foreground">Réalisé</th>
                          <th className="text-right py-1 px-2 text-[10px] font-medium text-muted-foreground">Performance</th>
                          <th className="text-center py-1 px-2 text-[10px] font-medium text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(r => (
                          <tr key={r.year} className="border-b">
                            <td className="py-1 px-2 font-medium">{r.year}</td>
                            <td className="py-1 px-2 text-right">{r.target?.toLocaleString('fr-FR') ?? '—'}</td>
                            <td className="py-1 px-2 text-right">{r.current !== undefined ? r.current.toLocaleString('fr-FR') : '—'}</td>
                            <td className="py-1 px-2 text-right">
                              {r.perf !== undefined ? (
                                <span className={cn("font-bold", getPerformanceColor(r.perf))}>{r.perf}%</span>
                              ) : '—'}
                            </td>
                            <td className="py-1 px-2 text-center text-[10px] text-muted-foreground">
                              {r.date ? new Date(r.date).toLocaleDateString('fr-FR') : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {trend.length >= 2 && (
                    <div className="h-40 mt-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 'dataMax + 20']} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v: number) => [`${v}%`, 'Performance']} />
                          <Line type="monotone" dataKey="perf" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <CDPUnitAggregation uniteMesureIds={ind.uniteMesureIds} year={selectedYear} resultUnit={ind.unit} variant="full" />

              {lastFiche?.observations && (
                <Card>
                  <CardHeader className="py-2"><CardTitle className="text-xs">Observations</CardTitle></CardHeader>
                  <CardContent className="pt-0 text-xs text-muted-foreground whitespace-pre-wrap">
                    {lastFiche.observations}
                  </CardContent>
                </Card>
              )}
            </DialogContent>
          </Dialog>
        );
      })()}
      <ShareByEmailDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        subject={`Tableau de bord CDP — ${selectedCDP?.name || ''} (${selectedYear})`}
        contextLabel={`CDP ${selectedCDP?.code || ''} • ${selectedYear}`}
        attachmentName={`tableau-bord-cdp-${selectedCDP?.code || 'cdp'}-${selectedYear}.pdf`}
        htmlPreview={`
          <h2 style="margin:0 0 8px 0;">${selectedCDP?.name || 'CDP'}</h2>
          <p style="margin:0 0 12px 0;color:#666;font-size:12px;">${selectedCDP?.code || ''} • Année ${selectedYear}</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Performance moyenne</strong></td><td style="padding:4px 8px;">${avgPerformance}%</td></tr>
            <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Indicateurs atteints</strong></td><td style="padding:4px 8px;">${atteints}</td></tr>
            <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>En progrès</strong></td><td style="padding:4px 8px;">${enProgres}</td></tr>
            <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>En retard</strong></td><td style="padding:4px 8px;">${enRetard}</td></tr>
            <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Total indicateurs</strong></td><td style="padding:4px 8px;">${filteredFiches.length}</td></tr>
          </table>
        `}
      />
    </div>
  );
};

export default CDPDashboardTab;
