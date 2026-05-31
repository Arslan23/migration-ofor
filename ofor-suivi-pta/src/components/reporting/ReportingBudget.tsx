import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";
import { TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

interface BudgetProjectData {
  name: string;
  fullName: string;
  region: string;
  budget: number;
  spent: number;
  disponible: number;
  execution: number;
}

interface BudgetReportData {
  byProject: BudgetProjectData[];
  byRegion: { region: string; budget: number; spent: number; disponible: number; execution: number; projectCount: number }[];
  byBailleur: { name: string; budget: number; spent: number; disponible: number; execution: number }[];
  projectsUnderExecution: BudgetProjectData[];
  projectsOverExecution: BudgetProjectData[];
  totalBudget: number;
  totalSpent: number;
  totalDisponible: number;
  globalExecution: number;
}

interface ReportingBudgetProps {
  viewMode: "graphique" | "tableau";
  budgetReportData: BudgetReportData;
}

const formatBudget = (amount: number) => {
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} Mds`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} M`;
  return amount.toLocaleString("fr-FR");
};

const COLORS = ["#0066b2", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export const ReportingBudget = ({ viewMode, budgetReportData }: ReportingBudgetProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-primary/5">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Budget total</p>
            <p className="text-xl font-bold">{formatBudget(budgetReportData.totalBudget)}</p>
            <p className="text-[9px] text-muted-foreground">FCFA</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/10">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Dépensé</p>
            <p className="text-xl font-bold text-green-600">{formatBudget(budgetReportData.totalSpent)}</p>
            <p className="text-[9px] text-muted-foreground">FCFA</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-900/10">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Disponible</p>
            <p className="text-xl font-bold text-amber-600">{formatBudget(budgetReportData.totalDisponible)}</p>
            <p className="text-[9px] text-muted-foreground">FCFA</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold">{budgetReportData.globalExecution}%</p>
            <p className="text-[10px] text-muted-foreground">Taux d'exécution</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats supplémentaires */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Projets total</p>
            <p className="text-sm font-bold">{budgetReportData.byProject.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2">
            <p className="text-[9px] text-muted-foreground">Bailleurs</p>
            <p className="text-sm font-bold">{budgetReportData.byBailleur.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/10">
          <CardContent className="p-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-600" />
            <div>
              <p className="text-[9px] text-muted-foreground">Exécution &gt;90%</p>
              <p className="text-sm font-bold text-green-600">{budgetReportData.projectsOverExecution.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 dark:bg-red-900/10">
          <CardContent className="p-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            <div>
              <p className="text-[9px] text-muted-foreground">Exécution &lt;50%</p>
              <p className="text-sm font-bold text-red-600">{budgetReportData.projectsUnderExecution.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === "graphique" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Répartition budget/dépenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Dépensé", value: budgetReportData.totalSpent },
                        { name: "Disponible", value: budgetReportData.totalDisponible },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip formatter={(value: number) => formatBudget(value) + " FCFA"} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Budget par bailleur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetReportData.byBailleur} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => formatBudget(v)} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 8 }} width={80} />
                    <Tooltip formatter={(value: number) => formatBudget(value) + " FCFA"} />
                    <Bar dataKey="budget" name="Budget" fill="#0066b2" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="spent" name="Dépensé" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Exécution par région</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetReportData.byRegion}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" tick={{ fontSize: 8 }} angle={-45} textAnchor="end" height={50} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Bar dataKey="execution" name="Taux exécution" fill="#0066b2" radius={[4, 4, 0, 0]}>
                      {budgetReportData.byRegion.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.execution >= 80 ? "#22c55e" : entry.execution >= 50 ? "#f59e0b" : "#ef4444"} 
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
              <CardTitle className="text-sm">Top 10 projets par budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetReportData.byProject.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => formatBudget(v)} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 8 }} width={80} />
                    <Tooltip formatter={(value: number) => formatBudget(value) + " FCFA"} />
                    <Bar dataKey="budget" name="Budget" fill="#0066b2" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="spent" name="Dépensé" fill="#22c55e" radius={[0, 4, 4, 0]} />
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
              <CardTitle className="text-sm">Budget par projet</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs py-2">Projet</TableHead>
                      <TableHead className="text-xs py-2 w-20">Région</TableHead>
                      <TableHead className="text-xs py-2 w-24 text-right">Budget</TableHead>
                      <TableHead className="text-xs py-2 w-24 text-right">Dépensé</TableHead>
                      <TableHead className="text-xs py-2 w-24 text-right">Disponible</TableHead>
                      <TableHead className="text-xs py-2 w-20 text-center">Exécution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetReportData.byProject.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="py-1.5 text-xs" title={p.fullName}>{p.name}</TableCell>
                        <TableCell className="py-1.5 text-[10px] text-muted-foreground">{p.region}</TableCell>
                        <TableCell className="py-1.5 text-xs text-right">{formatBudget(p.budget)}</TableCell>
                        <TableCell className="py-1.5 text-xs text-right text-green-600">{formatBudget(p.spent)}</TableCell>
                        <TableCell className="py-1.5 text-xs text-right text-amber-600">{formatBudget(p.disponible)}</TableCell>
                        <TableCell className="py-1.5 text-center">
                          <div className="flex items-center gap-1">
                            <Progress value={p.execution} className="h-1.5 flex-1" />
                            <span className="text-[9px] w-8">{p.execution}%</span>
                          </div>
                        </TableCell>
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
                      <TableHead className="text-[10px] py-1.5 w-24 text-right">Budget</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-24 text-right">Dépensé</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-24 text-right">Disponible</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-20 text-center">Exécution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetReportData.byBailleur.map((b, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="py-1 text-[10px] font-medium">{b.name}</TableCell>
                        <TableCell className="py-1 text-[10px] text-right">{formatBudget(b.budget)}</TableCell>
                        <TableCell className="py-1 text-[10px] text-right text-green-600">{formatBudget(b.spent)}</TableCell>
                        <TableCell className="py-1 text-[10px] text-right text-amber-600">{formatBudget(b.disponible)}</TableCell>
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
                      <TableHead className="text-[10px] py-1.5 w-24 text-right">Dépensé</TableHead>
                      <TableHead className="text-[10px] py-1.5 w-20 text-center">Exécution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetReportData.byRegion.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="py-1 text-[10px] font-medium">{r.region}</TableCell>
                        <TableCell className="py-1 text-[10px] text-center">{r.projectCount}</TableCell>
                        <TableCell className="py-1 text-[10px] text-right">{formatBudget(r.budget)}</TableCell>
                        <TableCell className="py-1 text-[10px] text-right text-green-600">{formatBudget(r.spent)}</TableCell>
                        <TableCell className="py-1 text-center">
                          <div className="flex items-center gap-1">
                            <Progress value={r.execution} className="h-1.5 flex-1" />
                            <span className="text-[9px] w-8">{r.execution}%</span>
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
