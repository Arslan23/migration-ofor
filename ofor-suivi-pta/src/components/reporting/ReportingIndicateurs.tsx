import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Target, CheckCircle2, Clock, AlertTriangle, TrendingUp } from "lucide-react";

interface IndicatorData {
  id: string;
  name: string;
  type: string;
  targetValue: number;
  currentValue: number;
  projectName: string;
  projectRegion: string;
  performance: number;
}

interface IndicateursReportData {
  indicators: IndicatorData[];
  total: number;
  byType: { quantitatif: number; qualitatif: number };
  byProject: { name: string; fullName: string; count: number; avgPerf: number; atteints: number; tauxAtteinte: number }[];
  criticalIndicators: IndicatorData[];
  topIndicators: IndicatorData[];
  atteints: number;
  enCours: number;
  enRetard: number;
  avgPerformance: number;
  tauxAtteinte: number;
}

interface ReportingIndicateursProps {
  viewMode: "graphique" | "tableau";
  indicateursReportData: IndicateursReportData;
}

const formatNumber = (num: number) => num.toLocaleString("fr-FR");

const getPerformanceColor = (perf: number) => {
  if (perf >= 100) return "text-green-600";
  if (perf >= 80) return "text-amber-600";
  return "text-red-600";
};

export const ReportingIndicateurs = ({ viewMode, indicateursReportData }: ReportingIndicateursProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold">{indicateursReportData.total}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-green-600" />
            <p className="text-xl font-bold text-green-600">{indicateursReportData.atteints}</p>
            <p className="text-[10px] text-muted-foreground">Atteints</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-amber-600" />
            <p className="text-xl font-bold text-amber-600">{indicateursReportData.enCours}</p>
            <p className="text-[10px] text-muted-foreground">En cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-red-600" />
            <p className="text-xl font-bold text-red-600">{indicateursReportData.enRetard}</p>
            <p className="text-[10px] text-muted-foreground">En retard</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold">{indicateursReportData.avgPerformance}%</p>
            <p className="text-[10px] text-muted-foreground">Performance moy.</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats supplémentaires */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="bg-primary/5">
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Taux d'atteinte</p>
            <p className="text-sm font-bold">{indicateursReportData.tauxAtteinte}%</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/10">
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Quantitatifs</p>
            <p className="text-sm font-bold text-blue-600">{indicateursReportData.byType.quantitatif}</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 dark:bg-purple-900/10">
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Qualitatifs</p>
            <p className="text-sm font-bold text-purple-600">{indicateursReportData.byType.qualitatif}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-900/10">
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Projets concernés</p>
            <p className="text-sm font-bold text-amber-600">{indicateursReportData.byProject.length}</p>
          </CardContent>
        </Card>
      </div>

      {viewMode === "graphique" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Répartition par type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Quantitatifs", value: indicateursReportData.byType.quantitatif },
                        { name: "Qualitatifs", value: indicateursReportData.byType.qualitatif },
                      ].filter(s => s.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#8b5cf6" />
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Statut des indicateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Atteints", value: indicateursReportData.atteints },
                        { name: "En cours", value: indicateursReportData.enCours },
                        { name: "En retard", value: indicateursReportData.enRetard },
                      ].filter(s => s.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Performance par projet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={indicateursReportData.byProject.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 8 }} width={100} />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Bar dataKey="avgPerf" name="Performance moy." fill="#0066b2" radius={[0, 4, 4, 0]}>
                      {indicateursReportData.byProject.slice(0, 8).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.avgPerf >= 100 ? "#22c55e" : entry.avgPerf >= 50 ? "#f59e0b" : "#ef4444"} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top/Bottom indicateurs */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Indicateurs - Performance extrêmes</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 space-y-2">
              <div>
                <p className="text-[10px] font-medium text-green-600 mb-1">Top 3 meilleurs</p>
                {indicateursReportData.topIndicators.slice(0, 3).map((ind, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[10px] py-0.5">
                    <span className="truncate flex-1">{ind.name}</span>
                    <Badge className="bg-green-100 text-green-700 text-[9px] ml-1">{ind.performance}%</Badge>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-medium text-red-600 mb-1">3 en difficulté</p>
                {indicateursReportData.criticalIndicators.slice(0, 3).map((ind, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[10px] py-0.5">
                    <span className="truncate flex-1">{ind.name}</span>
                    <Badge className="bg-red-100 text-red-700 text-[9px] ml-1">{ind.performance}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Liste des indicateurs</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs py-2">Indicateur</TableHead>
                      <TableHead className="text-xs py-2 w-32">Projet</TableHead>
                      <TableHead className="text-xs py-2 w-20">Type</TableHead>
                      <TableHead className="text-xs py-2 w-16 text-right">Cible</TableHead>
                      <TableHead className="text-xs py-2 w-16 text-right">Actuel</TableHead>
                      <TableHead className="text-xs py-2 w-16 text-center">Perf.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {indicateursReportData.indicators.map((ind, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="py-1.5 text-xs">{ind.name}</TableCell>
                        <TableCell className="py-1.5 text-[10px] text-muted-foreground">{ind.projectName}</TableCell>
                        <TableCell className="py-1.5">
                          <Badge variant="outline" className="text-[10px]">{ind.type}</Badge>
                        </TableCell>
                        <TableCell className="py-1.5 text-xs text-right">{formatNumber(ind.targetValue)}</TableCell>
                        <TableCell className="py-1.5 text-xs text-right">{formatNumber(ind.currentValue)}</TableCell>
                        <TableCell className="py-1.5 text-center">
                          <span className={`text-xs font-bold ${getPerformanceColor(ind.performance)}`}>
                            {ind.performance}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Synthèse par projet */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Synthèse par projet</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="border rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-[10px] py-1.5">Projet</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-16 text-center">Indicateurs</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-16 text-center">Atteints</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-20 text-center">Taux att.</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-20 text-center">Perf. moy.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {indicateursReportData.byProject.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="py-1 text-[10px] font-medium" title={p.fullName}>{p.name}</TableCell>
                        <TableCell className="py-1 text-[10px] text-center">{p.count}</TableCell>
                        <TableCell className="py-1 text-[10px] text-center text-green-600">{p.atteints}</TableCell>
                        <TableCell className="py-1 text-center">
                          <div className="flex items-center gap-1">
                            <Progress value={p.tauxAtteinte} className="h-1.5 flex-1" />
                            <span className="text-[9px] w-8">{p.tauxAtteinte}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-1 text-center">
                          <span className={`text-[10px] font-bold ${getPerformanceColor(p.avgPerf)}`}>
                            {p.avgPerf}%
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
