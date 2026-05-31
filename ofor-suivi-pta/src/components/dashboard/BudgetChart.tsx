import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { mockProjects } from "@/data/mockProjects";
import { Badge } from "@/components/ui/badge";

interface BudgetChartProps {
  filterProjectId?: string;
}

const COLORS = [
  "hsl(204, 100%, 35%)",
  "hsl(82, 100%, 36%)",
  "hsl(204, 70%, 50%)",
  "hsl(82, 70%, 50%)",
  "hsl(45, 100%, 50%)",
  "hsl(280, 70%, 50%)",
];

const BudgetChart = ({ filterProjectId = "all" }: BudgetChartProps) => {
  const { data, totalBudget } = useMemo(() => {
    const filteredProjects = filterProjectId === "all" 
      ? mockProjects 
      : mockProjects.filter(p => p.id === filterProjectId);

    // Regrouper par nature d'activité
    const categoryMap: Record<string, number> = {};
    
    filteredProjects.forEach(project => {
      project.activities?.forEach(activity => {
        const nature = activity.nature || "Autres";
        categoryMap[nature] = (categoryMap[nature] || 0) + (activity.budget || 0);
      });
    });

    const total = Object.values(categoryMap).reduce((sum, val) => sum + val, 0);
    
    const chartData = Object.entries(categoryMap)
      .map(([name, value], index) => ({
        name,
        value: total > 0 ? Math.round((value / total) * 100) : 0,
        amount: value,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return { data: chartData, totalBudget: total };
  }, [filterProjectId]);

  const formatBudget = (amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)} Mds`;
    }
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(0)} M`;
    }
    return amount.toLocaleString("fr-FR");
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-heading font-semibold text-base">Répartition du budget</h3>
          <p className="text-xs text-muted-foreground">Par catégorie d'activité</p>
        </div>
        {filterProjectId !== "all" && (
          <Badge variant="outline" className="text-[10px]">Filtré</Badge>
        )}
      </div>

      <div className="h-52">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Aucune donnée disponible
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, props: any) => [
                  `${value}% (${formatBudget(props.payload.amount)} FCFA)`,
                  name,
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={32}
                formatter={(value) => (
                  <span className="text-[10px] text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Budget total</span>
          <span className="font-semibold text-foreground">{formatBudget(totalBudget)} FCFA</span>
        </div>
      </div>
    </div>
  );
};

export default BudgetChart;