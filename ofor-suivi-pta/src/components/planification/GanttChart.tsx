import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GanttActivity {
  id: string;
  name: string;
  project: string;
  trimestres: string[];
  budgetTotal: number;
  nature: string;
  responsable: string;
}

interface GanttChartProps {
  activities: GanttActivity[];
  year: string;
}

const formatBudget = (amount: number) => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(2)} Mds`;
  }
  return `${(amount / 1000000).toFixed(0)} M`;
};

const trimestreColors: Record<string, string> = {
  T1: "bg-blue-500",
  T2: "bg-emerald-500",
  T3: "bg-amber-500",
  T4: "bg-purple-500",
};

const GanttChart = ({ activities, year }: GanttChartProps) => {
  const trimestres = ["T1", "T2", "T3", "T4"];
  
  // Group activities by project
  const activitiesByProject = activities.reduce((acc, activity) => {
    if (!acc[activity.project]) {
      acc[activity.project] = [];
    }
    acc[activity.project].push(activity);
    return acc;
  }, {} as Record<string, GanttActivity[]>);

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-[300px_1fr] border-b border-border">
            <div className="p-4 font-semibold text-muted-foreground bg-muted/30">
              Projet / Activité
            </div>
            <div className="grid grid-cols-4">
              {trimestres.map((t) => (
                <div 
                  key={t} 
                  className="p-4 text-center font-semibold text-muted-foreground bg-muted/30 border-l border-border"
                >
                  {t} {year}
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="divide-y divide-border">
            {Object.entries(activitiesByProject).map(([project, projectActivities]) => (
              <div key={project}>
                {/* Project header */}
                <div className="grid grid-cols-[300px_1fr] bg-muted/20">
                  <div className="p-3 font-semibold text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    {project}
                  </div>
                  <div className="grid grid-cols-4">
                    {trimestres.map((t) => {
                      const trimestreBudget = projectActivities
                        .filter(a => a.trimestres.includes(t))
                        .reduce((sum, a) => sum + (a.budgetTotal / a.trimestres.length), 0);
                      return (
                        <div 
                          key={t} 
                          className="p-3 text-center text-sm text-muted-foreground border-l border-border"
                        >
                          {trimestreBudget > 0 && formatBudget(trimestreBudget)}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Activities */}
                {projectActivities.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="grid grid-cols-[300px_1fr] hover:bg-muted/30 transition-colors"
                  >
                    <div className="p-3 pl-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">{activity.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{activity.nature}</Badge>
                        <span className="text-xs text-muted-foreground">{formatBudget(activity.budgetTotal)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4">
                      {trimestres.map((t) => {
                        const isActive = activity.trimestres.includes(t);
                        return (
                          <div 
                            key={t} 
                            className="p-3 border-l border-border flex items-center justify-center"
                          >
                            {isActive && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div 
                                    className={`h-8 w-full rounded-md ${trimestreColors[t]} opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center`}
                                  >
                                    <span className="text-xs font-medium text-white">
                                      {formatBudget(activity.budgetTotal / activity.trimestres.length)}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-sm">
                                    <p className="font-semibold">{activity.name}</p>
                                    <p>Budget {t}: {formatBudget(activity.budgetTotal / activity.trimestres.length)}</p>
                                    <p className="text-muted-foreground">{activity.responsable}</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Footer totals */}
          <div className="grid grid-cols-[300px_1fr] border-t-2 border-primary/30 bg-primary/5">
            <div className="p-4 font-bold text-foreground">
              Total
            </div>
            <div className="grid grid-cols-4">
              {trimestres.map((t) => {
                const trimestreBudget = activities
                  .filter(a => a.trimestres.includes(t))
                  .reduce((sum, a) => sum + (a.budgetTotal / a.trimestres.length), 0);
                return (
                  <div 
                    key={t} 
                    className="p-4 text-center font-bold border-l border-border"
                  >
                    {formatBudget(trimestreBudget)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default GanttChart;
