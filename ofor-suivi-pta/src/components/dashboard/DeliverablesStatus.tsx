import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockProjects } from "@/data/mockProjects";
import { Package, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";

interface DeliverableData {
  id: string;
  name: string;
  description: string;
  projectId: string;
  projectName: string;
  activityName: string;
  unit: string;
  targetValue: number;
  currentValue: number;
  performance: number;
}

interface DeliverablesStatusProps {
  filterProjectId?: string;
}

const DeliverablesStatus = ({ filterProjectId = "all" }: DeliverablesStatusProps) => {

  // Collecter tous les livrables des projets
  const allDeliverables = useMemo<DeliverableData[]>(() => {
    const deliverables: DeliverableData[] = [];
    
    mockProjects.forEach(project => {
      project.activities?.forEach(activity => {
        activity.deliverables?.forEach((del, idx) => {
          // Simuler des valeurs réalisées
          const targetValue = del.targetValue || 0;
          const currentValue = Math.round(targetValue * (0.5 + Math.random() * 0.6));
          const performance = targetValue > 0 ? Math.round((currentValue / targetValue) * 100) : 0;
          
          deliverables.push({
            id: `${activity.id}-del-${idx}`,
            name: del.name || `Livrable ${idx + 1}`,
            description: del.uniteMesure?.description || del.description || del.name || `Livrable ${idx + 1}`,
            projectId: project.id,
            projectName: project.name,
            activityName: activity.name,
            unit: del.uniteMesure?.name || del.unit || "unité",
            targetValue,
            currentValue,
            performance,
          });
        });
      });
    });
    
    return deliverables;
  }, []);

  // Filtrer par projet
  const filteredDeliverables = useMemo(() => {
    if (filterProjectId === "all") return allDeliverables;
    return allDeliverables.filter(d => d.projectId === filterProjectId);
  }, [allDeliverables, filterProjectId]);

  // Stats globales
  const totalDeliverables = filteredDeliverables.length;
  const completedDeliverables = filteredDeliverables.filter(d => d.performance >= 100).length;
  const inProgressDeliverables = filteredDeliverables.filter(d => d.performance >= 50 && d.performance < 100).length;
  const delayedDeliverables = filteredDeliverables.filter(d => d.performance < 50).length;

  // Données par projet pour le graphique
  const dataByProject = useMemo(() => {
    const projectMap: Record<string, { name: string; prevu: number; realise: number }> = {};
    
    filteredDeliverables.forEach(d => {
      if (!projectMap[d.projectId]) {
        projectMap[d.projectId] = {
          name: d.projectName.length > 15 ? d.projectName.substring(0, 15) + "..." : d.projectName,
          prevu: 0,
          realise: 0,
        };
      }
      projectMap[d.projectId].prevu += d.targetValue;
      projectMap[d.projectId].realise += d.currentValue;
    });
    
    return Object.values(projectMap);
  }, [filteredDeliverables]);

  const formatNumber = (num: number) => num.toLocaleString("fr-FR");

  const getPerformanceColor = (perf: number) => {
    if (perf >= 100) return "text-green-600";
    if (perf >= 80) return "text-amber-600";
    return "text-red-600";
  };

  const getPerformanceBadge = (perf: number) => {
    if (perf >= 100) return <Badge className="bg-green-100 text-green-700 text-xs">Atteint</Badge>;
    if (perf >= 80) return <Badge className="bg-amber-100 text-amber-700 text-xs">En cours</Badge>;
    return <Badge className="bg-red-100 text-red-700 text-xs">En retard</Badge>;
  };

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Package className="w-4 h-4" />
          Situation des livrables
          {filterProjectId !== "all" && (
            <Badge variant="outline" className="text-[10px] ml-2">
              {mockProjects.find(p => p.id === filterProjectId)?.name || "Projet filtré"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* KPIs livrables */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 bg-muted/50 rounded-lg text-center">
            <Package className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{totalDeliverables}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
            <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-green-600" />
            <p className="text-lg font-bold text-green-600">{completedDeliverables}</p>
            <p className="text-[10px] text-muted-foreground">Atteints</p>
          </div>
          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
            <Clock className="w-4 h-4 mx-auto mb-1 text-amber-600" />
            <p className="text-lg font-bold text-amber-600">{inProgressDeliverables}</p>
            <p className="text-[10px] text-muted-foreground">En cours</p>
          </div>
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
            <AlertCircle className="w-4 h-4 mx-auto mb-1 text-red-600" />
            <p className="text-lg font-bold text-red-600">{delayedDeliverables}</p>
            <p className="text-[10px] text-muted-foreground">En retard</p>
          </div>
        </div>

        {/* Graphique par projet */}
        {filterProjectId === "all" && dataByProject.length > 0 && (
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataByProject} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip 
                  formatter={(value: number) => formatNumber(value)}
                  labelStyle={{ fontSize: 11 }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="prevu" name="Prévu" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="realise" name="Réalisé" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tableau des livrables */}
        <div className="border rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs py-2">Livrable</TableHead>
                {filterProjectId === "all" && <TableHead className="text-xs py-2 w-24">Projet</TableHead>}
                <TableHead className="text-xs py-2 w-16 text-center">Unité</TableHead>
                <TableHead className="text-xs py-2 w-16 text-right">Prévu</TableHead>
                <TableHead className="text-xs py-2 w-16 text-right">Réalisé</TableHead>
                <TableHead className="text-xs py-2 w-20 text-center">Perf.</TableHead>
                <TableHead className="text-xs py-2 w-24">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliverables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={filterProjectId === "all" ? 7 : 6} className="text-center py-6 text-muted-foreground text-sm">
                    Aucun livrable trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeliverables.slice(0, 10).map(del => (
                  <TableRow key={del.id} className="hover:bg-muted/30">
                    <TableCell className="py-1.5">
                      <div>
                        <p className="text-xs font-medium truncate max-w-[220px]" title={del.description}>{del.description}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[220px]">{del.activityName}</p>
                      </div>
                    </TableCell>
                    {filterProjectId === "all" && (
                      <TableCell className="py-1.5">
                        <span className="text-[10px] text-muted-foreground truncate block max-w-[80px]">{del.projectName}</span>
                      </TableCell>
                    )}
                    <TableCell className="py-1.5 text-center text-xs text-muted-foreground">{del.unit}</TableCell>
                    <TableCell className="py-1.5 text-right text-xs font-medium">{formatNumber(del.targetValue)}</TableCell>
                    <TableCell className="py-1.5 text-right text-xs font-medium">{formatNumber(del.currentValue)}</TableCell>
                    <TableCell className="py-1.5 text-center">
                      <span className={`text-xs font-bold ${getPerformanceColor(del.performance)}`}>
                        {del.performance}%
                      </span>
                    </TableCell>
                    <TableCell className="py-1.5">{getPerformanceBadge(del.performance)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {filteredDeliverables.length > 10 && (
          <p className="text-xs text-muted-foreground text-center">
            Affichage de 10 sur {filteredDeliverables.length} livrables
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliverablesStatus;
