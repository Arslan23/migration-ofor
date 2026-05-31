import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, Legend } from "recharts";
import { CDP, CDPFicheSuiviIndicateur, CDPEvaluationAnnuelle, mockCDPComposantes, mockCDPCategories } from "@/types/cdp";
import { formatMontant } from "@/lib/exportUtils";
import { exportCDPReport, exportCDPToCSV } from "@/lib/exportCDPUtils";
import { TrendingUp, TrendingDown, Target, Award, AlertTriangle, Filter, ChevronDown, ChevronRight, FileText, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CDPDashboardProps {
  cdp: CDP;
  evaluations: CDPEvaluationAnnuelle[];
  fiches: CDPFicheSuiviIndicateur[];
  selectedYear?: number;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const CDPDashboard = ({ cdp, evaluations, fiches, selectedYear }: CDPDashboardProps) => {
  const [filterCategorie, setFilterCategorie] = useState<string>("all");
  const [filterComposante, setFilterComposante] = useState<string>("all");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(mockCDPCategories.map(c => c.id));

  const year = selectedYear || cdp.startYear;
  const yearFiches = fiches.filter(f => {
    const eval_ = evaluations.find(e => e.id === f.evaluationId);
    return eval_?.year === year;
  });

  // Filtrer les fiches selon les filtres
  const filteredFiches = yearFiches.filter(f => {
    const composante = mockCDPComposantes.find(c => c.id === f.composanteId);
    if (filterCategorie !== "all" && composante?.categorieId !== filterCategorie) return false;
    if (filterComposante !== "all" && f.composanteId !== filterComposante) return false;
    return true;
  });

  // Composantes filtrées par catégorie sélectionnée
  const filteredComposantes = filterCategorie === "all" 
    ? mockCDPComposantes 
    : mockCDPComposantes.filter(c => c.categorieId === filterCategorie);

  // Calcul des statistiques globales
  const totalIndicateurs = cdp.indicateurs.length;
  const fichesWithData = filteredFiches.filter(f => f.currentValue !== undefined);
  const avgPerformance = fichesWithData.length > 0 
    ? Math.round(fichesWithData.reduce((acc, f) => acc + (f.performanceRate || 0), 0) / fichesWithData.length)
    : 0;
  
  const atteints = fichesWithData.filter(f => (f.performanceRate || 0) >= 100).length;
  const enProgres = fichesWithData.filter(f => (f.performanceRate || 0) >= 80 && (f.performanceRate || 0) < 100).length;
  const enRetard = fichesWithData.filter(f => (f.performanceRate || 0) < 80).length;

  // Données par composante
  const performanceByComposante = mockCDPComposantes.map(comp => {
    const compFiches = fichesWithData.filter(f => f.composanteId === comp.id);
    const avgPerf = compFiches.length > 0 
      ? Math.round(compFiches.reduce((acc, f) => acc + (f.performanceRate || 0), 0) / compFiches.length)
      : 0;
    return {
      name: comp.name.length > 15 ? comp.name.substring(0, 15) + "..." : comp.name,
      fullName: comp.name,
      performance: avgPerf,
      count: compFiches.length,
    };
  }).filter(c => c.count > 0);

  // Données pour le radar par catégorie
  const performanceByCategorie = mockCDPCategories.map(cat => {
    const catComposantes = mockCDPComposantes.filter(c => c.categorieId === cat.id);
    const catFiches = fichesWithData.filter(f => catComposantes.some(c => c.id === f.composanteId));
    const avgPerf = catFiches.length > 0 
      ? Math.round(catFiches.reduce((acc, f) => acc + (f.performanceRate || 0), 0) / catFiches.length)
      : 0;
    return {
      category: cat.name,
      performance: avgPerf,
      fullMark: 100,
    };
  });

  // Données pour le pie chart des statuts
  const statusData = [
    { name: "Objectifs atteints", value: atteints, color: "#10b981" },
    { name: "En progression", value: enProgres, color: "#f59e0b" },
    { name: "En retard", value: enRetard, color: "#ef4444" },
  ].filter(s => s.value > 0);

  // Évolution annuelle
  const evolutionData = [cdp.startYear, cdp.startYear + 1, cdp.startYear + 2].map(y => {
    const yEval = evaluations.find(e => e.year === y);
    if (!yEval) return { year: y.toString(), performance: null };
    const yFiches = fiches.filter(f => f.evaluationId === yEval.id && f.currentValue !== undefined);
    const avgPerf = yFiches.length > 0 
      ? Math.round(yFiches.reduce((acc, f) => acc + (f.performanceRate || 0), 0) / yFiches.length)
      : null;
    return { year: y.toString(), performance: avgPerf };
  });

  // Regrouper les fiches par catégorie puis composante
  const fichesByCategory = mockCDPCategories.map(cat => {
    const catComposantes = mockCDPComposantes.filter(c => c.categorieId === cat.id);
    const composantesWithFiches = catComposantes.map(comp => {
      const compFiches = filteredFiches.filter(f => f.composanteId === comp.id);
      return { composante: comp, fiches: compFiches };
    }).filter(c => c.fiches.length > 0);
    return { categorie: cat, composantes: composantesWithFiches };
  }).filter(c => c.composantes.length > 0);

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const getPerformanceColor = (rate: number | undefined) => {
    if (rate === undefined) return "";
    if (rate >= 100) return "text-green-600";
    if (rate >= 80) return "text-amber-600";
    return "text-red-600";
  };

  const handleExportPDF = () => {
    exportCDPReport({
      cdp,
      evaluations,
      fiches,
      selectedYear: year,
    });
  };

  const handleExportCSV = () => {
    exportCDPToCSV({
      cdp,
      evaluations,
      fiches,
      selectedYear: year,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header avec boutons d'export */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Tableau de bord - Année {year}</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-7 text-xs">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="h-7 text-xs">
            <FileText className="w-3.5 h-3.5 mr-1" />
            Rapport PDF
          </Button>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Indicateurs</p>
              <p className="text-lg font-bold">{totalIndicateurs}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Performance moy.</p>
              <p className={cn("text-lg font-bold", avgPerformance >= 80 ? "text-green-600" : "text-amber-600")}>{avgPerformance}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Award className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Atteints</p>
              <p className="text-lg font-bold text-green-600">{atteints}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <TrendingDown className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">En progression</p>
              <p className="text-lg font-bold text-amber-600">{enProgres}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">En retard</p>
              <p className="text-lg font-bold text-red-600">{enRetard}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance par composante */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Performance par composante</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceByComposante} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 120]} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, "Performance"]}
                  labelFormatter={(label) => performanceByComposante.find(c => c.name === label)?.fullName}
                />
                <Bar 
                  dataKey="performance" 
                  fill="#3b82f6"
                  radius={[0, 4, 4, 0]}
                  label={{ position: 'right', fontSize: 11 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radar par catégorie */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Performance par catégorie</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={performanceByCategorie}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Performance" dataKey="performance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                <Tooltip formatter={(value: number) => [`${value}%`, "Performance"]} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition des objectifs */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Répartition des objectifs - {year}</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [value, name]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Évolution annuelle */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Évolution de la performance</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolutionData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis domain={[0, 120]} />
                <Tooltip formatter={(value: number | null) => value !== null ? [`${value}%`, "Performance"] : ["N/A", "Performance"]} />
                <Bar 
                  dataKey="performance" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]}
                  label={{ position: 'top', fontSize: 11 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Détail des indicateurs groupés par catégorie/composante */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Détail des indicateurs - {year}</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filterCategorie} onValueChange={(v) => { setFilterCategorie(v); setFilterComposante("all"); }}>
                <SelectTrigger className="w-[180px] h-7 text-xs">
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
                <SelectTrigger className="w-[180px] h-7 text-xs">
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
        <CardContent className="space-y-2 pt-0">
          {fichesByCategory.map(({ categorie, composantes }) => (
            <Collapsible 
              key={categorie.id} 
              open={expandedCategories.includes(categorie.id)}
              onOpenChange={() => toggleCategory(categorie.id)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  {expandedCategories.includes(categorie.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <Badge variant="outline" className="text-xs font-mono">{categorie.code}</Badge>
                  <span className="font-medium text-sm">{categorie.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {composantes.reduce((acc, c) => acc + c.fiches.length, 0)} indicateur(s)
                  </span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-2 mt-2">
                {composantes.map(({ composante, fiches: compFiches }) => (
                  <div key={composante.id} className="border rounded-lg">
                    <div className="flex items-center gap-2 p-2 bg-muted/30 border-b">
                      <Badge variant="secondary" className="text-xs font-mono">{composante.code}</Badge>
                      <span className="text-sm font-medium">{composante.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{compFiches.length} indicateur(s)</span>
                    </div>
                    <div className="divide-y">
                      {compFiches.map(fiche => {
                        const perf = fiche.performanceRate || 0;
                        return (
                          <div key={fiche.id} className="flex items-center gap-3 p-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-muted-foreground">{fiche.indicateurCode}</span>
                              </div>
                              <p className="text-sm truncate">{fiche.indicateurName}</p>
                            </div>
                            <div className="text-right text-xs w-20">
                              <p className="text-muted-foreground">Cible</p>
                              <p className="font-medium">{formatMontant(fiche.targetValue)} {fiche.unit}</p>
                            </div>
                            <div className="text-right text-xs w-20">
                              <p className="text-muted-foreground">Réalisé</p>
                              <p className="font-medium">{fiche.currentValue !== undefined ? formatMontant(fiche.currentValue) : "-"} {fiche.unit}</p>
                            </div>
                            <div className="w-24">
                              <Progress value={Math.min(perf, 100)} className="h-2" />
                              <p className={cn("text-xs text-right mt-1 font-medium", getPerformanceColor(perf))}>
                                {perf}%
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
          {fichesByCategory.length === 0 && (
            <p className="text-center text-muted-foreground py-4 text-sm">
              Aucune fiche de suivi pour cette année
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CDPDashboard;
