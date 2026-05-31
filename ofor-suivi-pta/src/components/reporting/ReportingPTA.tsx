import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Activity, CheckCircle2, Clock, Calendar, TrendingUp } from "lucide-react";
import { Project } from "@/types/project";

interface PTAReportData {
  total: number;
  allActivities: any[];
  byNature: { name: string; count: number; budget: number; termine: number; tauxExecution: number }[];
  byQuarter: { quarter: string; count: number; budget: number }[];
  byStatus: { planifie: number; en_cours: number; termine: number; annule: number };
  byProject: { name: string; fullName: string; count: number; termine: number; budget: number; tauxExecution: number }[];
  criticalActivities: any[];
  totalBudget: number;
  budgetTermine: number;
  tauxExecution: number;
}

interface ReportingPTAProps {
  viewMode: "graphique" | "tableau";
  filteredProjects: Project[];
  ptaReportData: PTAReportData;
}

const STATUS_COLORS = {
  en_cours: "#3b82f6",
  termine: "#22c55e",
  planifie: "#f59e0b",
  annule: "#6b7280",
};

const formatBudget = (amount: number) => {
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} Mds`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} M`;
  return amount.toLocaleString("fr-FR");
};

export const ReportingPTA = ({ viewMode, filteredProjects, ptaReportData }: ReportingPTAProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Activity className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold">{ptaReportData.total}</p>
            <p className="text-[10px] text-muted-foreground">Activités</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-green-600" />
            <p className="text-xl font-bold text-green-600">{ptaReportData.byStatus.termine}</p>
            <p className="text-[10px] text-muted-foreground">Terminées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-blue-600" />
            <p className="text-xl font-bold text-blue-600">{ptaReportData.byStatus.en_cours}</p>
            <p className="text-[10px] text-muted-foreground">En cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Calendar className="w-5 h-5 mx-auto mb-1 text-amber-600" />
            <p className="text-xl font-bold text-amber-600">{ptaReportData.byStatus.planifie}</p>
            <p className="text-[10px] text-muted-foreground">Planifiées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold">
              {ptaReportData.total > 0 ? Math.round((ptaReportData.byStatus.termine / ptaReportData.total) * 100) : 0}%
            </p>
            <p className="text-[10px] text-muted-foreground">Taux exécution</p>
          </CardContent>
        </Card>
      </div>

      {/* Synthèse budget PTA */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="bg-primary/5">
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Budget total activités</p>
            <p className="text-sm font-bold">{formatBudget(ptaReportData.totalBudget)} FCFA</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/10">
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Budget activités terminées</p>
            <p className="text-sm font-bold text-green-600">{formatBudget(ptaReportData.budgetTermine)} FCFA</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-900/10">
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Activités critiques</p>
            <p className="text-sm font-bold text-amber-600">{ptaReportData.criticalActivities.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/10">
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Types de nature</p>
            <p className="text-sm font-bold text-blue-600">{ptaReportData.byNature.length}</p>
          </CardContent>
        </Card>
      </div>

      {viewMode === "graphique" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Activités par nature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ptaReportData.byNature}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Activités" fill="#0066b2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Répartition par statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Terminées", value: ptaReportData.byStatus.termine },
                        { name: "En cours", value: ptaReportData.byStatus.en_cours },
                        { name: "Planifiées", value: ptaReportData.byStatus.planifie },
                        { name: "Annulées", value: ptaReportData.byStatus.annule },
                      ].filter(s => s.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill={STATUS_COLORS.termine} />
                      <Cell fill={STATUS_COLORS.en_cours} />
                      <Cell fill={STATUS_COLORS.planifie} />
                      <Cell fill={STATUS_COLORS.annule} />
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
              <CardTitle className="text-sm">Budget par trimestre</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ptaReportData.byQuarter}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => formatBudget(v)} />
                    <Tooltip formatter={(value: number) => formatBudget(value) + " FCFA"} />
                    <Bar dataKey="budget" name="Budget" fill="#0066b2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Taux d'exécution par projet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ptaReportData.byProject.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 8 }} width={100} />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Bar dataKey="tauxExecution" name="Taux exécution" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Liste des activités</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs py-2">Activité</TableHead>
                      <TableHead className="text-xs py-2 w-32">Projet</TableHead>
                      <TableHead className="text-xs py-2 w-20">Nature</TableHead>
                      <TableHead className="text-xs py-2 w-24 text-right">Budget</TableHead>
                      <TableHead className="text-xs py-2 w-20">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.flatMap(p => 
                      (p.activities || []).map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="py-1.5 text-xs">{a.name}</TableCell>
                          <TableCell className="py-1.5 text-[10px] text-muted-foreground">{p.name}</TableCell>
                          <TableCell className="py-1.5 text-[10px]">{a.nature || "-"}</TableCell>
                          <TableCell className="py-1.5 text-xs text-right">{formatBudget(a.budget)}</TableCell>
                          <TableCell className="py-1.5">
                            <Badge variant="outline" className="text-[10px]">{a.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Synthèse par nature */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Synthèse par nature</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-[10px] py-1.5">Nature</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-16 text-center">Activités</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-16 text-center">Terminées</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-24 text-right">Budget</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-20 text-center">Exécution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ptaReportData.byNature.map((n, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="py-1 text-[10px] font-medium">{n.name}</TableCell>
                        <TableCell className="py-1 text-[10px] text-center">{n.count}</TableCell>
                        <TableCell className="py-1 text-[10px] text-center text-green-600">{n.termine}</TableCell>
                        <TableCell className="py-1 text-[10px] text-right">{formatBudget(n.budget)}</TableCell>
                        <TableCell className="py-1 text-center">
                          <div className="flex items-center gap-1">
                            <Progress value={n.tauxExecution} className="h-1.5 flex-1" />
                            <span className="text-[9px] w-8">{n.tauxExecution}%</span>
                          </div>
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
              <div className="border rounded-lg overflow-hidden max-h-[250px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-[10px] py-1.5">Projet</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-16 text-center">Activités</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-16 text-center">Terminées</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-24 text-right">Budget</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-20 text-center">Taux</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ptaReportData.byProject.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="py-1 text-[10px] font-medium" title={p.fullName}>{p.name}</TableCell>
                        <TableCell className="py-1 text-[10px] text-center">{p.count}</TableCell>
                        <TableCell className="py-1 text-[10px] text-center text-green-600">{p.termine}</TableCell>
                        <TableCell className="py-1 text-[10px] text-right">{formatBudget(p.budget)}</TableCell>
                        <TableCell className="py-1 text-center">
                          <div className="flex items-center gap-1">
                            <Progress value={p.tauxExecution} className="h-1.5 flex-1" />
                            <span className="text-[9px] w-8">{p.tauxExecution}%</span>
                          </div>
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
