import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  variant?: "default" | "primary" | "secondary";
  className?: string;
}

const StatCard = ({ title, value, icon, trend, variant = "default", className }: StatCardProps) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="w-4 h-4" />;
    if (trend.value < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.value > 0) return "text-secondary";
    if (trend.value < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <div
      className={cn(
        "stat-card relative overflow-hidden",
        variant === "primary" && "bg-primary text-primary-foreground border-0",
        variant === "secondary" && "bg-secondary text-secondary-foreground border-0",
        className
      )}
    >
      {/* Background decoration */}
      <div
        className={cn(
          "absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2",
          variant === "default" && "bg-primary",
          variant === "primary" && "bg-white",
          variant === "secondary" && "bg-white"
        )}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p
              className={cn(
                "text-sm font-medium mb-1",
                variant === "default" && "text-muted-foreground",
                (variant === "primary" || variant === "secondary") && "opacity-90"
              )}
            >
              {title}
            </p>
            <p className="text-3xl font-heading font-bold">{value}</p>
          </div>
          <div
            className={cn(
              "p-3 rounded-xl",
              variant === "default" && "bg-primary/10 text-primary",
              variant === "primary" && "bg-white/20 text-white",
              variant === "secondary" && "bg-white/20 text-white"
            )}
          >
            {icon}
          </div>
        </div>

        {trend && (
          <div className={cn("flex items-center gap-1 mt-4 text-sm", getTrendColor())}>
            {getTrendIcon()}
            <span className="font-medium">{Math.abs(trend.value)}%</span>
            <span
              className={cn(
                variant === "default" && "text-muted-foreground",
                (variant === "primary" || variant === "secondary") && "opacity-80"
              )}
            >
              {trend.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
