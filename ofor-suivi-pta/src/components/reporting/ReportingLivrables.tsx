import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Package, CheckCircle2, Clock, AlertTriangle, TrendingUp } from "lucide-react";

interface DeliverableData {
  name: string;
  projectName: string;
  activityName: string;
  unit: string;
  target: number;
  current: number;
  performance: number;
}

interface DeliverablesReportData {
  deliverables: DeliverableData[];
  total: number;
  completed: number;
  inProgress: number;
  delayed: number;
  byProject: { name: string; fullName: string; count: number; completed: number; avgPerf: number; tauxLivraison: number }[];
  byUnit: { unit: string; count: number; completed: number; tauxLivraison: number }[];
  topDeliverables: DeliverableData[];
  bottomDeliverables: DeliverableData[];
  avgPerformance: number;
  tauxLivraison: number;
}

interface ReportingLivrablesProps {
  viewMode: "graphique" | "tableau";
  deliverablesReportData: DeliverablesReportData;
}

const formatNumber = (num: number) => num.toLocaleString("fr-FR");

const getPerformanceColor = (perf: number) => {
  if (perf >= 100) return "text-green-600";
  if (perf >= 80) return "text-amber-600";
  return "text-red-600";
};

const getPerformanceBadge = (perf: number) => {
  if (perf >= 100) return <Badge className="bg-green-100 text-green-700 text-[10px]">Atteint</Badge>;
  if (perf >= 80) return <Badge className="bg-amber-100 text-amber-700 text-[10px]">En cours</Badge>;
  return <Badge className="bg-red-100 text-red-700 text-[10px]">En retard</Badge>;
};

export const ReportingLivrables = ({ viewMode, deliverablesReportData }: ReportingLivrablesProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Package className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold">{deliverablesReportData.total}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-green-600" />
            <p className="text-xl font-bold text-green-600">{deliverablesReportData.completed}</p>
            <p className="text-[10px] text-muted-foreground">Atteints</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-amber-600" />
            <p className="text-xl font-bold text-amber-600">{deliverablesReportData.inProgress}</p>
            <p className="text-[10px] text-muted-foreground">En cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-red-600" />
            <p className="text-xl font-bold text-red-600">{deliverablesReportData.delayed}</p>
            <p className="text-[10px] text-muted-foreground">En retard</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold">{deliverablesReportData.avgPerformance}%</p>
            <p className="text-[10px] text-muted-foreground">Performance moy.</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats supplémentaires */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="bg-primary/5">
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Taux de livraison</p>
            <p className="text-sm font-bold">{deliverablesReportData.tauxLivraison}%</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/10">
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Top performer</p>
            <p className="text-sm font-bold text-green-600 truncate">
              {deliverablesReportData.topDeliverables[0]?.name || "-"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-900/10">
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Projets concernés</p>
            <p className="text-sm font-bold text-amber-600">{deliverablesReportData.byProject.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/10">
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Types d'unités</p>
            <p className="text-sm font-bold text-blue-600">{deliverablesReportData.byUnit.length}</p>
          </CardContent>
        </Card>
      </div>

      {viewMode === "graphique" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Statut des livrables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Atteints", value: deliverablesReportData.completed, color: "#22c55e" },
                        { name: "En cours", value: deliverablesReportData.inProgress, color: "#f59e0b" },
                        { name: "En retard", value: deliverablesReportData.delayed, color: "#ef4444" },
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
              <CardTitle className="text-sm">Top 10 livrables par performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={deliverablesReportData.deliverables.slice(0, 10).map(d => ({
                      name: d.name.length > 15 ? d.name.substring(0, 15) + "..." : d.name,
                      performance: d.performance,
                    }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 8 }} width={100} />
                    <Tooltip formatter={(value: number) => [`${value}%`, "Performance"]} />
                    <Bar dataKey="performance" fill="#0066b2" radius={[0, 4, 4, 0]}>
                      {deliverablesReportData.deliverables.slice(0, 10).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.performance >= 100 ? "#22c55e" : entry.performance >= 50 ? "#f59e0b" : "#ef4444"} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Par projet */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Performance par projet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deliverablesReportData.byProject.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 8 }} width={100} />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Bar dataKey="avgPerf" name="Perf. moyenne" fill="#0066b2" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top/Bottom livrables */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Livrables - Performance extrêmes</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 space-y-2">
              <div>
                <p className="text-[10px] font-medium text-green-600 mb-1">Top 3 meilleurs</p>
                {deliverablesReportData.topDeliverables.slice(0, 3).map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[10px] py-0.5">
                    <span className="truncate flex-1">{d.name}</span>
                    <Badge className="bg-green-100 text-green-700 text-[9px] ml-1">{d.performance}%</Badge>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-medium text-red-600 mb-1">3 en difficulté</p>
                {deliverablesReportData.bottomDeliverables.slice(0, 3).map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[10px] py-0.5">
                    <span className="truncate flex-1">{d.name}</span>
                    <Badge className="bg-red-100 text-red-700 text-[9px] ml-1">{d.performance}%</Badge>
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
              <CardTitle className="text-sm">Liste des livrables</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs py-2">Livrable</TableHead>
                      <TableHead className="text-xs py-2 w-32">Projet</TableHead>
                      <TableHead className="text-xs py-2 w-16 text-center">Unité</TableHead>
                      <TableHead className="text-xs py-2 w-16 text-right">Cible</TableHead>
                      <TableHead className="text-xs py-2 w-16 text-right">Réalisé</TableHead>
                      <TableHead className="text-xs py-2 w-16 text-center">Perf.</TableHead>
                      <TableHead className="text-xs py-2 w-20">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliverablesReportData.deliverables.map((d, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="py-1.5 text-xs">{d.name}</TableCell>
                        <TableCell className="py-1.5 text-[10px] text-muted-foreground">{d.projectName}</TableCell>
                        <TableCell className="py-1.5 text-[10px] text-center">{d.unit}</TableCell>
                        <TableCell className="py-1.5 text-xs text-right">{formatNumber(d.target)}</TableCell>
                        <TableCell className="py-1.5 text-xs text-right">{formatNumber(d.current)}</TableCell>
                        <TableCell className="py-1.5 text-center">
                          <span className={`text-xs font-bold ${getPerformanceColor(d.performance)}`}>
                            {d.performance}%
                          </span>
                        </TableCell>
                        <TableCell className="py-1.5">{getPerformanceBadge(d.performance)}</TableCell>
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
                      <TableHead className="text-[10px] py-1.5 w-16 text-center">Livrables</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-16 text-center">Atteints</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-20 text-center">Taux livr.</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-20 text-center">Perf. moy.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliverablesReportData.byProject.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="py-1 text-[10px] font-medium" title={p.fullName}>{p.name}</TableCell>
                        <TableCell className="py-1 text-[10px] text-center">{p.count}</TableCell>
                        <TableCell className="py-1 text-[10px] text-center text-green-600">{p.completed}</TableCell>
                        <TableCell className="py-1 text-center">
                          <div className="flex items-center gap-1">
                            <Progress value={p.tauxLivraison} className="h-1.5 flex-1" />
                            <span className="text-[9px] w-8">{p.tauxLivraison}%</span>
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
