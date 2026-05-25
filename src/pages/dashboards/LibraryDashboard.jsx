import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Library, BookOpen, Users, AlertCircle, ArrowRight, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import StatsGrid from "../../components/dashboard/StatsGrid";
import { api } from "../../lib/api";
import { getUser } from "../../lib/auth";
import { cn } from "../../lib/utils";

const mockData = {
  stats: [
    { label: "Total Books", value: "6", change: "+24 new", trend: "up", color: "blue" },
    { label: "Available", value: "35", change: "On shelf", trend: "up", color: "emerald" },
    { label: "Active Loans", value: "3", change: "Borrowed", trend: "up", color: "purple" },
    { label: "Overdue", value: "1", change: "Action needed", trend: "down", color: "orange" },
  ],
};

const LibraryDashboard = () => {
  const user = getUser();
  const [data, setData] = useState(mockData);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getLibraryDashboard(mockData);
        if (res?.stats) {
          setData({
            ...mockData,
            ...res,
            stats: res.stats,
            popularBooks: res.popularBooks ?? [],
            activeLoans: res.activeLoans ?? [],
            categories: res.categories ?? [],
            recentActivity: res.recentActivity ?? [],
          });
        }
      } catch {
        setData(mockData);
      }
    };
    load();
  }, []);

  const statIcons = {
    "Total Books": Library,
    Available: BookOpen,
    "Active Loans": Users,
    Overdue: AlertCircle,
    default: Library,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {user?.name || "Librarian"} — manage catalog & loans</p>
        </div>
        <Link to="/library"><Button className="gap-2"><BookOpen size={16} />Open Catalog</Button></Link>
      </div>

      <StatsGrid stats={data.stats || mockData.stats} icons={statIcons} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Popular Books</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(data.popularBooks || []).map((b) => (
              <div key={b.id} className="flex justify-between p-3 rounded-xl bg-secondary/30">
                <div>
                  <p className="font-semibold text-sm">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.author} · {b.category}</p>
                </div>
                <span className="text-xs font-bold text-primary">{b.available} available</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Active Loans</CardTitle><CardDescription>Borrowed & overdue items</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {(data.activeLoans || []).map((l) => (
              <div key={l.id} className="flex justify-between p-3 rounded-xl border border-border/50">
                <div>
                  <p className="font-medium text-sm">{l.book}</p>
                  <p className="text-xs text-muted-foreground">{l.student}</p>
                </div>
                <div className="text-right">
                  <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                    l.status === "Overdue" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500")}>{l.status}</span>
                  <p className="text-xs text-muted-foreground mt-1">Due {l.dueDate}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>By Category</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(data.categories || []).map((c, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm"><span>{c.name}</span><span className="font-bold">{c.count}</span></div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, c.count * 15)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock size={18} />Recent Activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(data.recentActivity || []).map((a, i) => (
              <div key={i} className="text-sm border-b border-border/50 pb-2 last:border-0">
                <p className="font-medium">{a.action}</p>
                <p className="text-xs text-muted-foreground">{a.detail} · {a.time}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default LibraryDashboard;
