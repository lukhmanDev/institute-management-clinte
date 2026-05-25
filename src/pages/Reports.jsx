import React from "react";
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Users, 
  Sparkles, 
  Download, 
  Filter,
  ArrowRight,
  Target,
  Zap,
  Activity
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";

const departmentData = [
  { name: 'Science', students: 850, performance: 82 },
  { name: 'Humanities', students: 620, performance: 75 },
  { name: 'Commerce', students: 540, performance: 78 },
  { name: 'Arts', students: 440, performance: 85 },
];

const genderDistribution = [
  { name: 'Male', value: 1250, color: '#4F46E5' },
  { name: 'Female', value: 1200, color: '#EC4899' },
];

const skillData = [
  { subject: 'Math', A: 120, B: 110, fullMark: 150 },
  { subject: 'Science', A: 98, B: 130, fullMark: 150 },
  { subject: 'English', A: 86, B: 130, fullMark: 150 },
  { subject: 'History', A: 99, B: 100, fullMark: 150 },
  { subject: 'Art', A: 85, B: 90, fullMark: 150 },
  { subject: 'Physical Ed', A: 65, B: 85, fullMark: 150 },
];

const Reports = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">Comprehensive institutional reports and AI insights.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Filter size={16} /> Filter
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-primary to-purple-600 border-none">
            <Download size={16} /> Export PDF
          </Button>
        </div>
      </div>

      {/* Top Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass relative overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Zap className="text-yellow-500 w-4 h-4" /> AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Overall institutional performance has increased by <span className="text-primary font-bold">4.2%</span> compared to the previous semester. Science department leads in attendance.
            </p>
          </CardContent>
          <div className="absolute right-0 bottom-0 opacity-10">
            <Sparkles size={80} />
          </div>
        </Card>

        <Card className="glass relative overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Target className="text-blue-500 w-4 h-4" /> Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Annual Revenue Target</span>
                <span>82%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[82%]"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass relative overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="text-emerald-500 w-4 h-4" /> Active Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">94.8%</div>
              <div className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">
                <TrendingUp size={10} /> +1.2%
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 uppercase font-bold tracking-wider">Student Retention Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Departmental Distribution</CardTitle>
            <CardDescription>Number of students per department.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }} />
                  <Bar dataKey="students" radius={[0, 4, 4, 0]} barSize={30}>
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - index * 0.2})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart for Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance Matrix</CardTitle>
            <CardDescription>Comparative analysis of student scores by subject.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                  <PolarGrid stroke="hsl(var(--muted))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Radar name="Current Year" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                  <Radar name="Previous Year" dataKey="B" stroke="#8884d8" fill="#8884d8" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Demographic Distribution</CardTitle>
            <CardDescription>Gender ratio across the institution.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {genderDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-8 mt-4">
              {genderDistribution.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs font-medium">{item.name} ({Math.round(item.value / 2450 * 100)}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insight Card */}
        <Card className="bg-card/50 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-primary w-5 h-5" /> AI Predictive Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="text-primary w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Growth Forecast</h4>
                  <p className="text-xs text-muted-foreground">Estimated 15% increase in student enrollment for the next academic year based on social trends and inquiry data.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                  <Target className="text-red-500 w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Risk Identification</h4>
                  <p className="text-xs text-muted-foreground">Identified 12 students at high risk of drop-out due to consistent low attendance and performance patterns.</p>
                </div>
              </div>
            </div>
            <Button className="w-full gap-2">
              Generate Detailed AI Strategy <ArrowRight size={14} />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
