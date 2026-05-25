import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Users, GraduationCap, DollarSign, Activity, Sparkles, ArrowRight, Calendar, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { statsData as mockStats, revenueData as mockRevenue, recentActivities as mockActivities, aiInsights as mockInsights } from "../../data/mockData";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { api } from "../../lib/api";
import { getUser } from "../../lib/auth";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

const AdminDashboard = () => {
  const user = getUser();
  const [stats, setStats] = useState(mockStats);
  const [revenue, setRevenue] = useState(mockRevenue);
  const [activities, setActivities] = useState(mockActivities);
  const [insights, setInsights] = useState(mockInsights);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await api.getDashboard({
          stats: mockStats,
          revenueData: mockRevenue,
          recentActivities: mockActivities,
          aiInsights: mockInsights,
        });
        if (data) {
          setStats(Array.isArray(data.stats) ? data.stats : mockStats);
          setRevenue(Array.isArray(data.revenueData) ? data.revenueData : mockRevenue);
          setActivities(Array.isArray(data.recentActivities) ? data.recentActivities : mockActivities);
          setInsights(Array.isArray(data.aiInsights) ? data.aiInsights : mockInsights);
        }
      } catch {
        setStats(mockStats);
        setRevenue(mockRevenue);
        setActivities(mockActivities);
        setInsights(mockInsights);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name || "Administrator"}.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2"><Calendar size={16} /><span>Last 30 Days</span></Button>
          <Button className="gap-2"><Sparkles size={16} /><span>AI Report</span></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Array.isArray(stats) ? stats : mockStats).map((stat, index) => (
          <motion.div key={index} variants={item}>
            <Card className="hover:shadow-md transition-all group overflow-hidden relative">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={cn("p-2.5 rounded-xl bg-opacity-10",
                    stat.color === 'blue' ? "bg-blue-500 text-blue-500" : stat.color === 'purple' ? "bg-purple-500 text-purple-500" :
                    stat.color === 'orange' ? "bg-orange-500 text-orange-500" : "bg-emerald-500 text-emerald-500")}>
                    {stat.label.includes("Students") ? <Users size={20} /> : stat.label.includes("Teachers") ? <GraduationCap size={20} /> :
                     stat.label.includes("Fees") ? <DollarSign size={20} /> : <Activity size={20} />}
                  </div>
                  <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                    stat.trend === 'up' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10" : "bg-red-100 text-red-600 dark:bg-red-500/10")}>
                    {stat.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <motion.div variants={item}>
          <Card>
            <CardHeader><CardTitle>Revenue & Expenses</CardTitle><CardDescription>Monthly financial overview.</CardDescription></CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenue}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {activities.map((a) => (
              <div key={a.id} className="flex justify-between text-sm border-b border-border/50 pb-3 last:border-0">
                <div><span className="font-semibold">{a.user}</span><p className="text-muted-foreground text-xs">{a.action}</p></div>
                <span className="text-xs text-muted-foreground">{a.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
