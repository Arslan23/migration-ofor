import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell } from "recharts";
import { Target, TrendingUp, Calendar, CheckCircle2, AlertTriangle } from "lucide-react";
import { CDP } from "@/types/cdp";

interface CDPReportData {
  cdp: CDP;
  byYear: { year: number; performance: number; count: number; fichesWithData: number; atteints: number; enCours: number; enRetard: number }[];
  byCategorie: { id: string; name: string; code: string; performance: number; count: number; atteints: number; enRetard: number; composantes: any[] }[];
  avgPerformance: number;
  totalIndicateurs: number;
  fichesRenseignees: number;
  atteints: number;
  enCours: number;
  enRetard: number;
  criticalIndicators: any[];
  topPerformers: any[];
}

interface ReportingCDPProps {
  viewMode: "graphique" | "tableau";
  cdpReportData: CDPReportData | null;
}

const getPerformanceColor = (perf: number) => {
  if (perf >= 100) return "text-green-600";
  if (perf >= 80) return "text-amber-600";
  return "text-red-600";
};

export const ReportingCDP = ({ viewMode, cdpReportData }: ReportingCDPProps) => {
  if (!cdpReportData) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucun CDP sélectionné
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <Card>
          <CardContent className="p-2 text-center">
            <Target className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{cdpReportData.totalIndicateurs}</p>
            <p className="text-[9px] text-muted-foreground">Indicateurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-green-600" />
            <p className="text-lg font-bold text-green-600">{cdpReportData.avgPerformance}%</p>
            <p className="text-[9px] text-muted-foreground">Performance moy.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-green-600" />
            <p className="text-lg font-bold text-green-600">{cdpReportData.atteints}</p>
            <p className="text-[9px] text-muted-foreground">Atteints</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-red-600" />
            <p className="text-lg font-bold text-red-600">{cdpReportData.enRetard}</p>
            <p className="text-[9px] text-muted-foreground">En retard</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <Calendar className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{cdpReportData.cdp.startYear}</p>
            <p className="text-[9px] text-muted-foreground">Début</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <Calendar className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{cdpReportData.cdp.endYear}</p>
            <p className="text-[9px] text-muted-foreground">Fin</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats par catégorie */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="bg-primary/5">
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Catégories</p>
            <p className="text-sm font-bold">{cdpReportData.byCategorie.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/10">
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Fiches renseignées</p>
            <p className="text-sm font-bold text-green-600">{cdpReportData.fichesRenseignees}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-900/10">
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">En cours</p>
            <p className="text-sm font-bold text-amber-600">{cdpReportData.enCours}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 dark:bg-red-900/10">
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Indicateurs critiques</p>
            <p className="text-sm font-bold text-red-600">{cdpReportData.criticalIndicators.length}</p>
          </CardContent>
        </Card>
      </div>

      {viewMode === "graphique" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Performance par année</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cdpReportData.byYear}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: number) => [`${value}%`, "Performance"]} />
                    <Bar dataKey="performance" name="Performance" fill="#0066b2" radius={[4, 4, 0, 0]}>
                      {cdpReportData.byYear.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.performance >= 80 ? "#22c55e" : entry.performance >= 50 ? "#f59e0b" : "#ef4444"} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Performance par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={cdpReportData.byCategorie}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="code" tick={{ fontSize: 9 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                    <Radar name="Performance" dataKey="performance" stroke="#0066b2" fill="#0066b2" fillOpacity={0.5} />
                    <Tooltip formatter={(value: number) => [`${value}%`, "Performance"]} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top performers */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Top indicateurs performants</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              {cdpReportData.topPerformers.slice(0, 5).map((f, idx) => (
                <div key={idx} className="flex items-center justify-between text-[10px] py-0.5 border-b last:border-0">
                  <span className="truncate flex-1">{f.indicateurName || `Indicateur ${idx + 1}`}</span>
                  <Badge className="bg-green-100 text-green-700 text-[9px] ml-1">{f.performanceRate}%</Badge>
                </div>
              ))}
              {cdpReportData.topPerformers.length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center py-2">Aucune donnée</p>
              )}
            </CardContent>
          </Card>

          {/* Indicateurs critiques */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Indicateurs critiques (&lt;50%)</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              {cdpReportData.criticalIndicators.slice(0, 5).map((f, idx) => (
                <div key={idx} className="flex items-center justify-between text-[10px] py-0.5 border-b last:border-0">
                  <span className="truncate flex-1">{f.indicateurName || `Indicateur ${idx + 1}`}</span>
                  <Badge className="bg-red-100 text-red-700 text-[9px] ml-1">{f.performanceRate}%</Badge>
                </div>
              ))}
              {cdpReportData.criticalIndicators.length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center py-2">Aucun indicateur critique</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Indicateurs CDP</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs py-2">Indicateur</TableHead>
                      <TableHead className="text-xs py-2 w-24">Composante</TableHead>
                      <TableHead className="text-xs py-2 w-16 text-center">Unité</TableHead>
                      <TableHead className="text-xs py-2 w-16 text-right">Base</TableHead>
                      <TableHead className="text-xs py-2 w-16 text-right">{cdpReportData.cdp.startYear}</TableHead>
                      <TableHead className="text-xs py-2 w-16 text-right">{cdpReportData.cdp.startYear + 1}</TableHead>
                      <TableHead className="text-xs py-2 w-16 text-right">{cdpReportData.cdp.startYear + 2}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cdpReportData.cdp.indicateurs.map(ind => (
                      <TableRow key={ind.indicateurRefId}>
                        <TableCell className="py-1.5 text-xs">{ind.indicateurName}</TableCell>
                        <TableCell className="py-1.5 text-[10px] text-muted-foreground">{ind.composanteName}</TableCell>
                        <TableCell className="py-1.5 text-[10px] text-center">{ind.unit}</TableCell>
                        <TableCell className="py-1.5 text-xs text-right">{ind.baselineValue}</TableCell>
                        <TableCell className="py-1.5 text-xs text-right">{ind.targetYear1}</TableCell>
                        <TableCell className="py-1.5 text-xs text-right">{ind.targetYear2}</TableCell>
                        <TableCell className="py-1.5 text-xs text-right">{ind.targetYear3}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Synthèse par catégorie */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Synthèse par catégorie</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-[10px] py-1.5">Catégorie</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-16 text-center">Indicateurs</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-16 text-center">Atteints</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-16 text-center">En retard</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-20 text-center">Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cdpReportData.byCategorie.map((cat, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="py-1 text-[10px] font-medium">{cat.name}</TableCell>
                        <TableCell className="py-1 text-[10px] text-center">{cat.count}</TableCell>
                        <TableCell className="py-1 text-[10px] text-center text-green-600">{cat.atteints}</TableCell>
                        <TableCell className="py-1 text-[10px] text-center text-red-600">{cat.enRetard}</TableCell>
                        <TableCell className="py-1 text-center">
                          <span className={`text-[10px] font-bold ${getPerformanceColor(cat.performance)}`}>
                            {cat.performance}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
