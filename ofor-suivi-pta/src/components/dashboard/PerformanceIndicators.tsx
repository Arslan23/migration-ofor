import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { mockProjects } from "@/data/mockProjects";
import { Badge } from "@/components/ui/badge";

interface PerformanceIndicatorsProps {
  filterProjectId?: string;
}

const PerformanceIndicators = ({ filterProjectId = "all" }: PerformanceIndicatorsProps) => {
  const { chartData, stats } = useMemo(() => {
    const filteredProjects = filterProjectId === "all" 
      ? mockProjects 
      : mockProjects.filter(p => p.id === filterProjectId);

    // Simuler des données mensuelles basées sur les projets
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun"];
    const baseProgress = filteredProjects.reduce((sum, p) => {
      const activities = p.activities?.length || 0;
      const completed = p.activities?.filter(a => a.status === "termine").length || 0;
      return sum + (activities > 0 ? (completed / activities) * 100 : 0);
    }, 0) / Math.max(filteredProjects.length, 1);

    const data = months.map((month, index) => {
      const progression = Math.min(100, Math.round(baseProgress * (0.5 + (index * 0.1)) + Math.random() * 10));
      return {
        month,
        prevu: Math.min(100, 70 + index * 5),
        realise: progression,
      };
    });

    // Calculer les stats
    const totalActivities = filteredProjects.reduce((sum, p) => sum + (p.activities?.length || 0), 0);
    const completedActivities = filteredProjects.reduce((sum, p) => 
      sum + (p.activities?.filter(a => a.status === "termine").length || 0), 0);
    const inProgressActivities = filteredProjects.reduce((sum, p) => 
      sum + (p.activities?.filter(a => a.status === "en_cours").length || 0), 0);
    
    const executionRate = totalActivities > 0 
      ? Math.round((completedActivities / totalActivities) * 100) 
      : 0;

    return {
      chartData: data,
      stats: {
        executionRate,
        completed: completedActivities,
        inProgress: inProgressActivities,
      },
    };
  }, [filterProjectId]);

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-semibold text-base">Performance PTA</h3>
          <p className="text-xs text-muted-foreground">Objectifs vs Réalisations</p>
        </div>
        <div className="flex items-center gap-2">
          {filterProjectId !== "all" && (
            <Badge variant="outline" className="text-[10px]">Filtré</Badge>
          )}
          <select className="text-xs border border-border rounded-lg px-2 py-1 bg-background">
            <option>2024</option>
            <option>2023</option>
            <option>2022</option>
          </select>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "11px",
              }}
              formatter={(value: number, name: string) => [
                `${value}%`,
                name === "prevu" ? "Prévu" : "Réalisé",
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: "10px" }}
              formatter={(value) => (
                <span className="text-[10px] text-muted-foreground">
                  {value === "prevu" ? "Prévu" : "Réalisé"}
                </span>
              )}
            />
            <Bar
              dataKey="prevu"
              fill="hsl(204, 100%, 35%)"
              radius={[3, 3, 0, 0]}
              name="prevu"
            />
            <Bar
              dataKey="realise"
              fill="hsl(82, 100%, 36%)"
              radius={[3, 3, 0, 0]}
              name="realise"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-border">
        <div className="text-center">
          <p className="text-xl font-heading font-bold text-primary">{stats.executionRate}%</p>
          <p className="text-[10px] text-muted-foreground">Taux d'exécution</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-heading font-bold text-secondary">{stats.completed}</p>
          <p className="text-[10px] text-muted-foreground">Activités réalisées</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-heading font-bold text-foreground">{stats.inProgress}</p>
          <p className="text-[10px] text-muted-foreground">En cours</p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceIndicators;