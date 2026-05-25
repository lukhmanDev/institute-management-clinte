import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "../ui/Card";
import { cn } from "../../lib/utils";

const StatsGrid = ({ stats = [], icons = {} }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {(Array.isArray(stats) ? stats : []).map((stat, index) => {
      const Icon = icons[stat.label] || icons.default;
      return (
        <Card key={index} className="hover:shadow-md transition-all relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {Icon && (
                <div
                  className={cn(
                    "p-2.5 rounded-xl bg-opacity-10",
                    stat.color === "blue" && "bg-blue-500 text-blue-500",
                    stat.color === "purple" && "bg-purple-500 text-purple-500",
                    stat.color === "orange" && "bg-orange-500 text-orange-500",
                    stat.color === "emerald" && "bg-emerald-500 text-emerald-500"
                  )}
                >
                  <Icon size={20} />
                </div>
              )}
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                  stat.trend === "up"
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10"
                    : "bg-red-100 text-red-600 dark:bg-red-500/10"
                )}
              >
                {stat.trend === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1 tracking-tight">{stat.value}</h3>
            </div>
          </CardContent>
        </Card>
      );
    })}
  </div>
);

export default StatsGrid;
