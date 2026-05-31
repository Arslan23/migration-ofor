import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Area,
} from "recharts";
import { TrendingUp, TrendingDown, Target, Wallet, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PTA, PTAActivity } from "@/types/pta";

interface PTAExecutionDashboardProps {
  pta: PTA;
}

const formatBudget = (amount: number) => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(2)} Mds`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(0)} M`;
  }
  return amount.toLocaleString("fr-FR");
};

const PTAExecutionDashboard = ({ pta }: PTAExecutionDashboardProps) => {
  // Calculs des données d'exécution
  const budgetByQuarter = {
    T1: { prevu: 0, realise: 0 },
    T2: { prevu: 0, realise: 0 },
    T3: { prevu: 0, realise: 0 },
    T4: { prevu: 0, realise: 0 },
  };

  pta.activities.forEach((activity) => {
    budgetByQuarter.T1.prevu += activity.budgetT1;
    budgetByQuarter.T2.prevu += activity.budgetT2;
    budgetByQuarter.T3.prevu += activity.budgetT3;
    budgetByQuarter.T4.prevu += activity.budgetT4;
    // Simulated realized values (in real app, these would come from actual tracking)
    budgetByQuarter.T1.realise += Math.round(activity.budgetT1 * (0.85 + Math.random() * 0.2));
    budgetByQuarter.T2.realise += Math.round(activity.budgetT2 * (0.75 + Math.random() * 0.3));
    budgetByQuarter.T3.realise += Math.round(activity.budgetT3 * (0.6 + Math.random() * 0.3));
    budgetByQuarter.T4.realise += Math.round(activity.budgetT4 * (0.3 + Math.random() * 0.2));
  });

  const quarterData = [
    {
      name: "T1",
      prevu: budgetByQuarter.T1.prevu,
      realise: budgetByQuarter.T1.realise,
      taux: budgetByQuarter.T1.prevu > 0 
        ? Math.round((budgetByQuarter.T1.realise / budgetByQuarter.T1.prevu) * 100) 
        : 0,
    },
    {
      name: "T2",
      prevu: budgetByQuarter.T2.prevu,
      realise: budgetByQuarter.T2.realise,
      taux: budgetByQuarter.T2.prevu > 0 
        ? Math.round((budgetByQuarter.T2.realise / budgetByQuarter.T2.prevu) * 100) 
        : 0,
    },
    {
      name: "T3",
      prevu: budgetByQuarter.T3.prevu,
      realise: budgetByQuarter.T3.realise,
      taux: budgetByQuarter.T3.prevu > 0 
        ? Math.round((budgetByQuarter.T3.realise / budgetByQuarter.T3.prevu) * 100) 
        : 0,
    },
    {
      name: "T4",
      prevu: budgetByQuarter.T4.prevu,
      realise: budgetByQuarter.T4.realise,
      taux: budgetByQuarter.T4.prevu > 0 
        ? Math.round((budgetByQuarter.T4.realise / budgetByQuarter.T4.prevu) * 100) 
        : 0,
    },
  ];

  const totalPrevu = Object.values(budgetByQuarter).reduce((sum, q) => sum + q.prevu, 0);
  const totalRealise = Object.values(budgetByQuarter).reduce((sum, q) => sum + q.realise, 0);
  const tauxGlobal = totalPrevu > 0 ? Math.round((totalRealise / totalPrevu) * 100) : 0;

  // Répartition par nature d'activité
  const activitiesByNature = pta.activities.reduce((acc, activity) => {
    const nature = activity.nature || "Autre";
    if (!acc[nature]) {
      acc[nature] = { prevu: 0, realise: 0, count: 0 };
    }
    acc[nature].prevu += activity.budgetTotal;
    acc[nature].realise += Math.round(activity.budgetTotal * (0.6 + Math.random() * 0.35));
    acc[nature].count++;
    return acc;
  }, {} as Record<string, { prevu: number; realise: number; count: number }>);

  const natureColors = [
    "hsl(204, 100%, 35%)",
    "hsl(82, 100%, 36%)",
    "hsl(38, 92%, 50%)",
    "hsl(280, 70%, 50%)",
    "hsl(180, 70%, 40%)",
  ];

  const natureData = Object.entries(activitiesByNature).map(([name, data], idx) => ({
    name,
    value: data.prevu,
    realise: data.realise,
    count: data.count,
    color: natureColors[idx % natureColors.length],
    taux: data.prevu > 0 ? Math.round((data.realise / data.prevu) * 100) : 0,
  }));

  // Indicateurs d'exécution par projet
  const projectExecution = pta.activities.reduce((acc, activity) => {
    if (!acc[activity.project]) {
      acc[activity.project] = { prevu: 0, realise: 0, activities: 0 };
    }
    acc[activity.project].prevu += activity.budgetTotal;
    acc[activity.project].realise += Math.round(activity.budgetTotal * (0.5 + Math.random() * 0.45));
    acc[activity.project].activities++;
    return acc;
  }, {} as Record<string, { prevu: number; realise: number; activities: number }>);

  const projectData = Object.entries(projectExecution)
    .map(([project, data]) => ({
      project,
      prevu: data.prevu,
      realise: data.realise,
      activities: data.activities,
      taux: data.prevu > 0 ? Math.round((data.realise / data.prevu) * 100) : 0,
    }))
    .sort((a, b) => b.taux - a.taux)
    .slice(0, 6);

  // Indicateurs performance
  const indicatorExecution = pta.indicators.map((ind) => {
    const realT1 = Math.round(ind.targetT1 * (0.8 + Math.random() * 0.3));
    const realT2 = Math.round(ind.targetT2 * (0.7 + Math.random() * 0.35));
    const realT3 = Math.round(ind.targetT3 * (0.5 + Math.random() * 0.3));
    const realT4 = Math.round(ind.targetT4 * (0.2 + Math.random() * 0.2));
    const totalReal = realT1 + realT2 + realT3 + realT4;
    return {
      name: ind.indicatorName.substring(0, 30) + (ind.indicatorName.length > 30 ? "..." : ""),
      code: ind.indicatorCode,
      annualTarget: ind.annualTarget,
      realise: totalReal,
      taux: ind.annualTarget > 0 ? Math.round((totalReal / ind.annualTarget) * 100) : 0,
    };
  }).slice(0, 5);

  return (
    <div className="space-y-4">
      {/* KPIs principaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Budget prévu</p>
                <p className="text-xl font-bold">{formatBudget(totalPrevu)}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Budget réalisé</p>
                <p className="text-xl font-bold">{formatBudget(totalRealise)}</p>
              </div>
              <div className="p-2 rounded-lg bg-secondary/10">
                <CheckCircle className="w-5 h-5 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Taux d'exécution</p>
                <p className={cn(
                  "text-xl font-bold",
                  tauxGlobal >= 80 ? "text-secondary" : tauxGlobal >= 60 ? "text-amber-600" : "text-destructive"
                )}>
                  {tauxGlobal}%
                </p>
              </div>
              <div className={cn(
                "p-2 rounded-lg",
                tauxGlobal >= 80 ? "bg-secondary/10" : tauxGlobal >= 60 ? "bg-amber-100" : "bg-destructive/10"
              )}>
                {tauxGlobal >= 80 ? (
                  <TrendingUp className="w-5 h-5 text-secondary" />
                ) : tauxGlobal >= 60 ? (
                  <Clock className="w-5 h-5 text-amber-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-destructive" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Activités planifiées</p>
                <p className="text-xl font-bold">{pta.activities.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Exécution par trimestre */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Exécution budgétaire par trimestre</span>
              <Badge variant="outline" className="text-xs">{pta.year}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={quarterData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    yAxisId="budget"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickFormatter={(value) => formatBudget(value)}
                  />
                  <YAxis
                    yAxisId="taux"
                    orientation="right"
                    domain={[0, 120]}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "taux") return [`${value}%`, "Taux"];
                      return [formatBudget(value), name === "prevu" ? "Prévu" : "Réalisé"];
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-muted-foreground">
                        {value === "prevu" ? "Prévu" : value === "realise" ? "Réalisé" : "Taux"}
                      </span>
                    )}
                  />
                  <Bar yAxisId="budget" dataKey="prevu" fill="hsl(204, 100%, 35%)" radius={[4, 4, 0, 0]} name="prevu" />
                  <Bar yAxisId="budget" dataKey="realise" fill="hsl(82, 100%, 36%)" radius={[4, 4, 0, 0]} name="realise" />
                  <Line yAxisId="taux" type="monotone" dataKey="taux" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 4 }} name="taux" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Répartition par nature */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Répartition par nature d'activité</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-56 flex">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={natureData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {natureData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [formatBudget(value), "Budget"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 flex flex-col justify-center space-y-2">
                {natureData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="flex-1 truncate">{item.name}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        item.taux >= 80 ? "text-secondary border-secondary" : 
                        item.taux >= 60 ? "text-amber-600 border-amber-600" : 
                        "text-destructive border-destructive"
                      )}
                    >
                      {item.taux}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détails projets et indicateurs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Exécution par projet */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Taux d'exécution par projet</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-3">
              {projectData.map((project, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate max-w-[60%]">{project.project}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{formatBudget(project.realise)}/{formatBudget(project.prevu)}</span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs min-w-[45px] justify-center",
                          project.taux >= 80 ? "text-secondary border-secondary" : 
                          project.taux >= 60 ? "text-amber-600 border-amber-600" : 
                          "text-destructive border-destructive"
                        )}
                      >
                        {project.taux}%
                      </Badge>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        project.taux >= 80 ? "bg-secondary" : 
                        project.taux >= 60 ? "bg-amber-500" : 
                        "bg-destructive"
                      )}
                      style={{ width: `${Math.min(project.taux, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance indicateurs */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Performance des indicateurs clés</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-3">
              {indicatorExecution.map((ind, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">{ind.code}</Badge>
                      <span className="text-xs truncate">{ind.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-2">
                    <span className="text-xs text-muted-foreground">
                      {ind.realise}/{ind.annualTarget}
                    </span>
                    <div className={cn(
                      "flex items-center gap-1 text-xs font-medium",
                      ind.taux >= 80 ? "text-secondary" : 
                      ind.taux >= 60 ? "text-amber-600" : 
                      "text-destructive"
                    )}>
                      {ind.taux >= 80 ? <TrendingUp className="w-3 h-3" /> : 
                       ind.taux >= 60 ? <Clock className="w-3 h-3" /> : 
                       <AlertTriangle className="w-3 h-3" />}
                      {ind.taux}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PTAExecutionDashboard;
