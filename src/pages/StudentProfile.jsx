import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  TrendingUp, 
  Award,
  Clock,
  ArrowLeft,
  Sparkles,
  Zap,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { api } from "../lib/api";

const performanceData = [
  { month: 'Jan', score: 75 },
  { month: 'Feb', score: 78 },
  { month: 'Mar', score: 82 },
  { month: 'Apr', score: 80 },
  { month: 'May', score: 85 },
];

const StudentProfile = () => {
  const { id } = useParams();
  const studentId = id || "STU001";
  
  const mockStudent = {
    id: studentId,
    name: "Alice Johnson",
    class: "10-A",
    roll: "24",
    email: "alice.j@edu.com",
    phone: "+1 234 567 890",
    address: "123 Academic Ave, Edu City",
    parent: "Robert Johnson",
    attendance: "96%",
    gpa: "3.8",
    image: null,
  };

  const [student, setStudent] = useState(mockStudent);
  const [remarksList, setRemarksList] = useState([]);
  const [loading, setLoading] = useState(true);

  const mapStudent = (s) => ({
    id: s.student_id || s.id || studentId,
    name: s.name || "Alice Johnson",
    class: s.grade || s.class || "10-A",
    roll: s.roll_no || s.roll || "24",
    email: s.email || `${(s.student_id || s.id || studentId).toLowerCase()}@edu.com`,
    phone: s.phone || "+1 234 567 890",
    address: s.address || "123 Academic Ave, Edu City",
    parent: s.parent_name || s.parent || "Robert Johnson",
    attendance: typeof s.attendance_percentage === "number" ? `${s.attendance_percentage}%` : (s.attendance || "96%"),
    gpa: typeof s.gpa === "number" ? s.gpa.toString() : (s.gpa || "3.8"),
    image: s.image_url || s.image || null
  });

  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true);
      try {
        const data = await api.getStudent(studentId, {
          student_id: mockStudent.id,
          name: mockStudent.name,
          grade: mockStudent.class,
          roll_no: mockStudent.roll,
          email: mockStudent.email,
          phone: mockStudent.phone,
          address: mockStudent.address,
          parent_name: mockStudent.parent,
          attendance_percentage: 96.0,
          gpa: 3.8,
          image_url: mockStudent.image
        });
        setStudent(mapStudent(data));

        // Load Remarks
        const defaultRemarks = [
          { student: studentId, teacher_name: "Dr. Sarah Miller", teacher_role: "Physics Teacher", remark_type: "Positive", content: "Excellent participation in the science fair project. Shows great leadership.", date: "2 days ago" },
          { student: studentId, teacher_name: "James Wilson", teacher_role: "Class Teacher", remark_type: "Note", content: "Maintains consistent attendance. Prompt in submitting assignments.", date: "1 week ago" },
        ];
        const allRemarks = await api.getRemarks(defaultRemarks);
        const filtered = allRemarks.filter(r => {
          const rStudentId = r.student && typeof r.student === "object"
            ? r.student.student_id
            : r.student;
          const rStudentName = r.student_name;
          return String(rStudentId) === String(studentId)
            || (rStudentName && data.name && rStudentName === data.name);
        });
        setRemarksList(filtered);
      } catch (err) {
        console.error("Error loading student profile details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [studentId]);

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center gap-4">
        <Link to="/students">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Profile</h1>
          <p className="text-xs text-muted-foreground">ID: {student.id} | {student.class}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary to-purple-600"></div>
            <CardContent className="p-6 relative -mt-12 text-center">
              <div className="w-24 h-24 rounded-2xl border-4 border-background overflow-hidden shadow-lg mx-auto bg-background flex items-center justify-center">
                <img
  src={student.image || '/static/default_profile.png'}
  alt={student.name}
  className="w-full h-full object-cover"
/>
              </div>
              <h2 className="text-xl font-bold mt-4">{student.name}</h2>
              <p className="text-sm text-primary font-semibold">Grade {student.class}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="p-3 rounded-xl bg-secondary/50">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Attendance</span>
                  <span className="text-lg font-bold text-emerald-500">{student.attendance}</span>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Current GPA</span>
                  <span className="text-lg font-bold text-primary">{student.gpa}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                  <Mail size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Email</span>
                  <span className="text-xs font-medium">{student.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                  <Phone size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Phone</span>
                  <span className="text-xs font-medium">{student.phone}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                  <MapPin size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Address</span>
                  <span className="text-xs font-medium">{student.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Academic & AI Analytics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Performance Prediction */}
            <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20 relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary w-5 h-5" />
                  <CardTitle className="text-lg">AI Performance Insight</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Alice is showing a strong upward trend in STEM subjects. Projected to achieve <span className="text-primary font-bold">A+</span> in the upcoming Mathematics final.
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[92%]"></div>
                  </div>
                  <span className="text-xs font-bold">92% Confidence</span>
                </div>
              </CardContent>
              <div className="absolute -right-4 -bottom-4 opacity-5">
                <TrendingUp size={120} />
              </div>
            </Card>

            {/* Career Guidance */}
            <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-200/20 relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="text-orange-500 w-5 h-5" />
                  <CardTitle className="text-lg">Career Guidance</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Based on aptitude tests and academic patterns, Alice shows high potential in:
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 text-[10px] font-bold uppercase">Software Engineering</span>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-bold uppercase">Data Science</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Academic Progress Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Academic Progress</CardTitle>
                <CardDescription>Performance trend over the current semester.</CardDescription>
              </div>
              <Button variant="outline" size="sm">Download Transcript</Button>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Remarks Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Behavioral Remarks</CardTitle>
              <CardDescription>Teacher observations and parent feedback.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {remarksList.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No behavioral remarks recorded.</p>
                ) : (
                  remarksList.map((remark, i) => {
                    const type = remark.remark_type || remark.type || "Note";
                    return (
                      <div key={i} className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <Zap size={18} className={type === 'Positive' ? 'text-orange-500' : 'text-blue-500'} />
                        </div>
                        <div className="flex-1 pb-6 border-b border-border/50 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-bold">
                              {remark.teacher_name || remark.teacher}{" "}
                              <span className="font-normal text-muted-foreground text-xs">
                                ({remark.teacher_role || remark.role})
                              </span>
                            </h4>
                            <span className="text-[10px] text-muted-foreground">{remark.date}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {remark.content || remark.text}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
