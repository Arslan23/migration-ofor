import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, TrendingUp, BarChart3 } from "lucide-react";
import { Project } from "@/types/project";

interface ProjectsReportData {
  byStatus: { en_cours: number; termine: number; retard: number; planifie: number };
  byRegion: { region: string; count: number; budget: number; spent: number; avgProgress: number }[];
  byBailleur: { name: string; count: number; budget: number; spent: number; execution: number }[];
  topProjects: Project[];
  bottomProjects: Project[];
  criticalProjects: Project[];
  totalBudget: number;
  totalSpent: number;
  avgProgress: number;
  executionRate: number;
}

interface ReportingProjetsProps {
  viewMode: "graphique" | "tableau";
  filteredProjects: Project[];
  projectsReportData: ProjectsReportData;
}

const STATUS_COLORS = {
  en_cours: "#3b82f6",
  termine: "#22c55e",
  retard: "#ef4444",
  planifie: "#94a3b8",
};

const formatBudget = (amount: number) => {
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} Mds`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} M`;
  return amount.toLocaleString("fr-FR");
};

const getPerformanceColor = (perf: number) => {
  if (perf >= 100) return "text-green-600";
  if (perf >= 80) return "text-amber-600";
  return "text-red-600";
};

const getStatusBadge = (status: string) => {
  const colors: Record<string, string> = {
    en_cours: "bg-blue-100 text-blue-700",
    termine: "bg-green-100 text-green-700",
    retard: "bg-red-100 text-red-700",
    planifie: "bg-gray-100 text-gray-700",
  };
  return <Badge className={`${colors[status] || ""} text-[9px]`}>{status.replace("_", " ")}</Badge>;
};

export const ReportingProjets = ({ viewMode, filteredProjects, projectsReportData }: ReportingProjetsProps) => {
  return (
    <div className="space-y-4">
      {/* KPIs enrichis */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <Card>
          <CardContent className="p-2 text-center">
            <FolderKanban className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{filteredProjects.length}</p>
            <p className="text-[9px] text-muted-foreground">Projets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-green-600" />
            <p className="text-lg font-bold text-green-600">{projectsReportData.byStatus.termine}</p>
            <p className="text-[9px] text-muted-foreground">Terminés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <Clock className="w-4 h-4 mx-auto mb-1 text-blue-600" />
            <p className="text-lg font-bold text-blue-600">{projectsReportData.byStatus.en_cours}</p>
            <p className="text-[9px] text-muted-foreground">En cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-red-600" />
            <p className="text-lg font-bold text-red-600">{projectsReportData.byStatus.retard}</p>
            <p className="text-[9px] text-muted-foreground">En retard</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{projectsReportData.avgProgress}%</p>
            <p className="text-[9px] text-muted-foreground">Avancement</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <BarChart3 className="w-4 h-4 mx-auto mb-1 text-amber-600" />
            <p className="text-lg font-bold text-amber-600">{projectsReportData.executionRate}%</p>
            <p className="text-[9px] text-muted-foreground">Exécution budg.</p>
          </CardContent>
        </Card>
      </div>

      {/* Synthèse budget */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="bg-primary/5">
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Budget total</p>
            <p className="text-sm font-bold">{formatBudget(projectsReportData.totalBudget)} FCFA</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/10">
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Dépensé</p>
            <p className="text-sm font-bold text-green-600">{formatBudget(projectsReportData.totalSpent)} FCFA</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-900/10">
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Disponible</p>
            <p className="text-sm font-bold text-amber-600">{formatBudget(projectsReportData.totalBudget - projectsReportData.totalSpent)} FCFA</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 dark:bg-red-900/10">
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Projets critiques</p>
            <p className="text-sm font-bold text-red-600">{projectsReportData.criticalProjects.length}</p>
          </CardContent>
        </Card>
      </div>

      {viewMode === "graphique" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Répartition par statut */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Répartition par statut</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Terminés", value: projectsReportData.byStatus.termine, color: STATUS_COLORS.termine },
                        { name: "En cours", value: projectsReportData.byStatus.en_cours, color: STATUS_COLORS.en_cours },
                        { name: "En retard", value: projectsReportData.byStatus.retard, color: STATUS_COLORS.retard },
                        { name: "Planifiés", value: projectsReportData.byStatus.planifie, color: STATUS_COLORS.planifie },
                      ].filter(s => s.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {[STATUS_COLORS.termine, STATUS_COLORS.en_cours, STATUS_COLORS.retard, STATUS_COLORS.planifie].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, "Projets"]} />
                    <Legend wrapperStyle={{ fontSize: "9px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Budget par bailleur */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Budget par bailleur</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectsReportData.byBailleur.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 8 }} tickFormatter={(v) => formatBudget(v)} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 8 }} width={80} />
                    <Tooltip formatter={(value: number) => formatBudget(value) + " FCFA"} />
                    <Bar dataKey="budget" name="Budget" fill="#0066b2" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="spent" name="Dépensé" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Avancement par région */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Avancement par région</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectsReportData.byRegion}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" tick={{ fontSize: 8 }} angle={-45} textAnchor="end" height={50} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Bar dataKey="avgProgress" name="Avancement" fill="#0066b2" radius={[4, 4, 0, 0]}>
                      {projectsReportData.byRegion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.avgProgress >= 80 ? "#22c55e" : entry.avgProgress >= 50 ? "#f59e0b" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top/Bottom projets */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Projets - Performance extrêmes</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 space-y-2">
              <div>
                <p className="text-[10px] font-medium text-green-600 mb-1">Top 3 meilleurs</p>
                {projectsReportData.topProjects.slice(0, 3).map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[10px] py-0.5">
                    <span className="truncate flex-1">{p.name}</span>
                    <Badge className="bg-green-100 text-green-700 text-[9px] ml-1">{p.progress}%</Badge>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-medium text-red-600 mb-1">3 projets en difficulté</p>
                {projectsReportData.bottomProjects.slice(0, 3).map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[10px] py-0.5">
                    <span className="truncate flex-1">{p.name}</span>
                    <Badge className="bg-red-100 text-red-700 text-[9px] ml-1">{p.progress}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tableau projets */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Liste des projets</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-[10px] py-1.5">Projet</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-20">Région</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-20">Bailleur</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-20 text-right">Budget</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-20 text-right">Dépensé</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-16 text-center">Avance.</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-16">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="py-1 text-[10px] font-medium">{p.name}</TableCell>
                        <TableCell className="py-1 text-[10px] text-muted-foreground">{p.region}</TableCell>
                        <TableCell className="py-1 text-[10px] text-muted-foreground">{p.bailleur || "-"}</TableCell>
                        <TableCell className="py-1 text-[10px] text-right">{formatBudget(p.budget)}</TableCell>
                        <TableCell className="py-1 text-[10px] text-right">{formatBudget(p.spent || 0)}</TableCell>
                        <TableCell className="py-1 text-center">
                          <span className={`text-[10px] font-bold ${getPerformanceColor(p.progress)}`}>{p.progress}%</span>
                        </TableCell>
                        <TableCell className="py-1">{getStatusBadge(p.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Synthèse par bailleur */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Synthèse par bailleur</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-[10px] py-1.5">Bailleur</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-12 text-center">Projets</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-24 text-right">Budget</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-24 text-right">Dépensé</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-16 text-center">Exécution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectsReportData.byBailleur.map((b, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="py-1 text-[10px] font-medium">{b.name}</TableCell>
                        <TableCell className="py-1 text-[10px] text-center">{b.count}</TableCell>
                        <TableCell className="py-1 text-[10px] text-right">{formatBudget(b.budget)}</TableCell>
                        <TableCell className="py-1 text-[10px] text-right">{formatBudget(b.spent)}</TableCell>
                        <TableCell className="py-1 text-center">
                          <div className="flex items-center gap-1">
                            <Progress value={b.execution} className="h-1.5 flex-1" />
                            <span className="text-[9px] w-8">{b.execution}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Synthèse par région */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Synthèse par région</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-[10px] py-1.5">Région</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-12 text-center">Projets</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-24 text-right">Budget</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-16 text-center">Avancement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectsReportData.byRegion.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="py-1 text-[10px] font-medium">{r.region}</TableCell>
                        <TableCell className="py-1 text-[10px] text-center">{r.count}</TableCell>
                        <TableCell className="py-1 text-[10px] text-right">{formatBudget(r.budget)}</TableCell>
                        <TableCell className="py-1 text-center">
                          <div className="flex items-center gap-1">
                            <Progress value={r.avgProgress} className="h-1.5 flex-1" />
                            <span className="text-[9px] w-8">{r.avgProgress}%</span>
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
