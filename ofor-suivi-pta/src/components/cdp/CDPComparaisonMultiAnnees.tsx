import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Search, TrendingUp, TrendingDown, Minus, FileSpreadsheet, FileText, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CDP, CDPFicheSuiviIndicateur, mockCDPs, mockCDPFichesSuivi, mockCDPCategories, mockCDPComposantes } from "@/types/cdp";
import ExportButtons from "@/components/ui/ExportButtons";

interface ComparaisonData {
  indicateurCode: string;
  indicateurName: string;
  composanteId: string;
  composanteName: string;
  categorieId: string;
  categorieName: string;
  unit: string;
  annees: Record<number, { cible: number; realise: number | null; performance: number | null }>;
}

const CDPComparaisonMultiAnnees = () => {
  const [cdpId, setCdpId] = useState<string>(mockCDPs[0]?.id || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategorie, setFilterCategorie] = useState<string>("all");
  const [filterComposante, setFilterComposante] = useState<string>("all");
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const cdp = mockCDPs.find(c => c.id === cdpId);

  // Construire les données de comparaison
  const comparaisonData = useMemo(() => {
    if (!cdp) return [];

    const data: ComparaisonData[] = [];
    const years = [cdp.startYear, cdp.startYear + 1, cdp.startYear + 2];

    cdp.indicateurs.forEach(indicateur => {
      const composante = mockCDPComposantes.find(c => c.id === indicateur.composanteId);
      const categorie = mockCDPCategories.find(c => c.id === composante?.categorieId);
      
      const annees: Record<number, { cible: number; realise: number | null; performance: number | null }> = {};
      
      years.forEach((year, index) => {
        const cible = index === 0 ? indicateur.targetYear1 : index === 1 ? indicateur.targetYear2 : indicateur.targetYear3;
        
        // Chercher la fiche de suivi pour cette année
        const fiche = mockCDPFichesSuivi.find(
          f => f.indicateurRefId === indicateur.indicateurRefId &&
               mockCDPs.find(c => c.id === cdpId)?.indicateurs.find(i => i.indicateurRefId === f.indicateurRefId) &&
               // On simule l'année via l'evaluationId
               (year === cdp.startYear && f.evaluationId === "eval-2024" ||
                year === cdp.startYear + 1 && f.evaluationId === "eval-2025")
        );
        
        annees[year] = {
          cible,
          realise: fiche?.currentValue ?? null,
          performance: fiche?.performanceRate ?? null
        };
      });

      data.push({
        indicateurCode: indicateur.indicateurCode,
        indicateurName: indicateur.indicateurName,
        composanteId: indicateur.composanteId,
        composanteName: indicateur.composanteName,
        categorieId: categorie?.id || "",
        categorieName: categorie?.name || "",
        unit: indicateur.unit,
        annees
      });
    });

    return data;
  }, [cdp, cdpId]);

  // Filtrage
  const filteredData = useMemo(() => {
    return comparaisonData.filter(item => {
      const matchSearch = item.indicateurName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.indicateurCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategorie = filterCategorie === "all" || item.categorieId === filterCategorie;
      const matchComposante = filterComposante === "all" || item.composanteId === filterComposante;
      return matchSearch && matchCategorie && matchComposante;
    });
  }, [comparaisonData, searchTerm, filterCategorie, filterComposante]);

  // Grouper par catégorie puis composante
  const groupedData = useMemo(() => {
    const groups: Record<string, Record<string, ComparaisonData[]>> = {};
    
    filteredData.forEach(item => {
      if (!groups[item.categorieId]) {
        groups[item.categorieId] = {};
      }
      if (!groups[item.categorieId][item.composanteId]) {
        groups[item.categorieId][item.composanteId] = [];
      }
      groups[item.categorieId][item.composanteId].push(item);
    });

    return groups;
  }, [filteredData]);

  const years = cdp ? [cdp.startYear, cdp.startYear + 1, cdp.startYear + 2] : [];

  const toggleCategory = (catId: string) => {
    setOpenCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const getPerformanceColor = (perf: number | null) => {
    if (perf === null) return "text-muted-foreground";
    if (perf >= 100) return "text-green-600 dark:text-green-400";
    if (perf >= 80) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getTrendIcon = (current: number | null, previous: number | null) => {
    if (current === null || previous === null) return <Minus className="w-3 h-3 text-muted-foreground" />;
    if (current > previous) return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (current < previous) return <TrendingDown className="w-3 h-3 text-red-500" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  const formatNumber = (num: number | null) => {
    if (num === null) return "-";
    return num.toLocaleString("fr-FR");
  };

  const filteredComposantes = filterCategorie === "all"
    ? mockCDPComposantes
    : mockCDPComposantes.filter(c => c.categorieId === filterCategorie);

  // Export functions
  const handleExportCSV = () => {
    if (!cdp) return;
    const rows: string[] = [];
    const headers = ["Catégorie", "Composante", "Code", "Indicateur", "Unité"];
    years.forEach(year => {
      headers.push(`Cible ${year}`, `Réalisé ${year}`, `Perf. ${year} (%)`);
    });
    rows.push(headers.join(";"));

    filteredData.forEach(item => {
      const row = [item.categorieName, item.composanteName, item.indicateurCode, item.indicateurName, item.unit];
      years.forEach(year => {
        const data = item.annees[year];
        row.push(formatNumber(data?.cible), formatNumber(data?.realise), data?.performance !== null ? `${data.performance}` : "-");
      });
      rows.push(row.join(";"));
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `comparaison-cdp-${cdp.code}.csv`;
    link.click();
  };

  const handleExportPDF = () => {
    if (!cdp) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    let tableRows = "";
    Object.entries(groupedData).forEach(([catId, composantesGroup]) => {
      const categorie = mockCDPCategories.find(c => c.id === catId);
      Object.entries(composantesGroup).forEach(([compId, items]) => {
        const composante = mockCDPComposantes.find(c => c.id === compId);
        items.forEach((item, idx) => {
          tableRows += `<tr>
            ${idx === 0 ? `<td rowspan="${items.length}" style="background:#f5f5f5;font-weight:600;">${categorie?.name || ""}</td>` : ""}
            ${idx === 0 ? `<td rowspan="${items.length}" style="background:#fafafa;">${composante?.name || ""}</td>` : ""}
            <td style="font-family:monospace;font-size:11px;">${item.indicateurCode}</td>
            <td>${item.indicateurName}</td>
            <td style="text-align:center;">${item.unit}</td>
            ${years.map(year => {
              const data = item.annees[year];
              const perfColor = data?.performance === null ? "#888" : data.performance >= 100 ? "#16a34a" : data.performance >= 80 ? "#ca8a04" : "#dc2626";
              return `<td style="text-align:right;">${formatNumber(data?.cible)}</td>
                      <td style="text-align:right;">${formatNumber(data?.realise)}</td>
                      <td style="text-align:center;font-weight:600;color:${perfColor};">${data?.performance !== null ? `${data.performance}%` : "-"}</td>`;
            }).join("")}
          </tr>`;
        });
      });
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comparaison multi-années - ${cdp.name}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
          h1 { font-size: 18px; margin-bottom: 5px; }
          h2 { font-size: 14px; color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th, td { border: 1px solid #ddd; padding: 4px 6px; }
          th { background: #1e3a5f; color: white; text-align: center; }
          .year-header { background: #2563eb; }
        </style>
      </head>
      <body>
        <h1>Comparaison multi-années</h1>
        <h2>${cdp.name} (${cdp.startYear}-${cdp.endYear})</h2>
        <table>
          <thead>
            <tr>
              <th rowspan="2">Catégorie</th>
              <th rowspan="2">Composante</th>
              <th rowspan="2">Code</th>
              <th rowspan="2">Indicateur</th>
              <th rowspan="2">Unité</th>
              ${years.map(year => `<th colspan="3" class="year-header">${year}</th>`).join("")}
            </tr>
            <tr>
              ${years.map(() => `<th>Cible</th><th>Réalisé</th><th>Perf.</th>`).join("")}
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (mockCDPs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucun contrat de performance disponible
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={cdpId} onValueChange={setCdpId}>
          <SelectTrigger className="w-64 h-9">
            <SelectValue placeholder="Sélectionner un CDP" />
          </SelectTrigger>
          <SelectContent>
            {mockCDPs.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} ({c.startYear}-{c.endYear})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un indicateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Select value={filterCategorie} onValueChange={(v) => { setFilterCategorie(v); setFilterComposante("all"); }}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {mockCDPCategories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterComposante} onValueChange={setFilterComposante}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Composante" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes composantes</SelectItem>
            {filteredComposantes.map(comp => (
              <SelectItem key={comp.id} value={comp.id}>{comp.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ExportButtons onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
      </div>

      {/* Tableau de comparaison */}
      {cdp && (
        <div className="border rounded-lg bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-32">Code</TableHead>
                <TableHead>Indicateur</TableHead>
                <TableHead className="w-16 text-center">Unité</TableHead>
                {years.map(year => (
                  <TableHead key={year} colSpan={3} className="text-center border-l bg-primary/10">
                    <div className="font-semibold">{year}</div>
                  </TableHead>
                ))}
                <TableHead className="w-16 text-center">Trend</TableHead>
              </TableRow>
              <TableRow>
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
                {years.map(year => (
                  <>
                    <TableHead key={`${year}-cible`} className="text-right text-xs border-l w-20">Cible</TableHead>
                    <TableHead key={`${year}-real`} className="text-right text-xs w-20">Réalisé</TableHead>
                    <TableHead key={`${year}-perf`} className="text-center text-xs w-16">Perf.</TableHead>
                  </>
                ))}
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedData).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4 + years.length * 3 + 1} className="text-center py-8 text-muted-foreground">
                    Aucun indicateur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(groupedData)
                  .sort(([a], [b]) => {
                    const catA = mockCDPCategories.find(c => c.id === a)?.order || 0;
                    const catB = mockCDPCategories.find(c => c.id === b)?.order || 0;
                    return catA - catB;
                  })
                  .map(([catId, composantesGroup]) => {
                    const categorie = mockCDPCategories.find(c => c.id === catId);
                    const isOpen = openCategories[catId] !== false;

                    return (
                      <Collapsible key={catId} open={isOpen} onOpenChange={() => toggleCategory(catId)} asChild>
                        <>
                          <CollapsibleTrigger asChild>
                            <TableRow className="bg-primary/5 cursor-pointer hover:bg-primary/10">
                              <TableCell colSpan={4 + years.length * 3 + 1} className="font-semibold">
                                <div className="flex items-center gap-2">
                                  <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
                                  <Badge variant="outline" className="mr-2">{categorie?.code}</Badge>
                                  {categorie?.name}
                                  <Badge variant="secondary" className="ml-2">
                                    {Object.values(composantesGroup).flat().length} indicateurs
                                  </Badge>
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleTrigger>
                          <CollapsibleContent asChild>
                            <>
                              {Object.entries(composantesGroup)
                                .sort(([a], [b]) => {
                                  const compA = mockCDPComposantes.find(c => c.id === a)?.order || 0;
                                  const compB = mockCDPComposantes.find(c => c.id === b)?.order || 0;
                                  return compA - compB;
                                })
                                .map(([compId, items]) => {
                                  const composante = mockCDPComposantes.find(c => c.id === compId);

                                  return (
                                    <>
                                      <TableRow key={compId} className="bg-muted/30">
                                        <TableCell colSpan={4 + years.length * 3 + 1} className="py-1">
                                          <span className="text-sm font-medium text-muted-foreground ml-6">
                                            {composante?.name}
                                          </span>
                                        </TableCell>
                                      </TableRow>
                                      {items
                                        .sort((a, b) => a.indicateurCode.localeCompare(b.indicateurCode))
                                        .map(item => {
                                          const lastYear = years[years.length - 1];
                                          const prevYear = years[years.length - 2];
                                          
                                          return (
                                            <TableRow key={item.indicateurCode} className="hover:bg-muted/50">
                                              <TableCell className="font-mono text-xs">{item.indicateurCode}</TableCell>
                                              <TableCell className="text-sm">{item.indicateurName}</TableCell>
                                              <TableCell className="text-center text-xs text-muted-foreground">{item.unit}</TableCell>
                                              {years.map((year, idx) => {
                                                const data = item.annees[year];
                                                return (
                                                  <>
                                                    <TableCell key={`${year}-c`} className="text-right text-sm border-l">
                                                      {formatNumber(data?.cible)}
                                                    </TableCell>
                                                    <TableCell key={`${year}-r`} className="text-right text-sm">
                                                      {formatNumber(data?.realise)}
                                                    </TableCell>
                                                    <TableCell key={`${year}-p`} className={cn("text-center text-sm font-medium", getPerformanceColor(data?.performance))}>
                                                      {data?.performance !== null ? `${data.performance}%` : "-"}
                                                    </TableCell>
                                                  </>
                                                );
                                              })}
                                              <TableCell className="text-center">
                                                {getTrendIcon(
                                                  item.annees[lastYear]?.performance,
                                                  item.annees[prevYear]?.performance
                                                )}
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                    </>
                                  );
                                })}
                            </>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Légende */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <span>≥ 100% (Atteint)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span>80-99% (En cours)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span>&lt; 80% (En retard)</span>
        </div>
        <div className="flex items-center gap-1 ml-4">
          <TrendingUp className="w-3 h-3 text-green-500" />
          <span>Amélioration</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingDown className="w-3 h-3 text-red-500" />
          <span>Dégradation</span>
        </div>
      </div>
    </div>
  );
};

export default CDPComparaisonMultiAnnees;
