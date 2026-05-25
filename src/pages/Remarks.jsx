import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Smile, 
  Frown, 
  AlertTriangle, 
  Clock, 
  User, 
  Filter,
  CheckCircle2,
  Trash2,
  Edit3,
  Sparkles,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";
import { api } from "../lib/api";
import { getUser } from "../lib/auth";
import { toast } from "../lib/toast";

const mockRemarksData = [
  { 
    id: 1, 
    student: "Alice Johnson", 
    teacher: "Dr. Sarah Miller", 
    type: "Positive", 
    category: "Academic",
    content: "Alice showed exceptional problem-solving skills during the Physics lab session today. She helped her peers understand the circuit diagrams.",
    date: "May 10, 2026",
    avatar: "https://i.pravatar.cc/150?u=alice"
  },
  { 
    id: 2, 
    student: "Bob Smith", 
    teacher: "James Wilson", 
    type: "Warning", 
    category: "Behavior",
    content: "Bob was caught using his mobile phone during the Mathematics lecture. This is his second warning this month.",
    date: "May 09, 2026",
    avatar: "https://i.pravatar.cc/150?u=bob"
  },
  { 
    id: 3, 
    student: "Charlie Brown", 
    teacher: "Elena Gilbert", 
    type: "Positive", 
    category: "Extracurricular",
    content: "Charlie's contribution to the Literary Club's annual newsletter has been outstanding. Great creativity and commitment.",
    date: "May 08, 2026",
    avatar: "https://i.pravatar.cc/150?u=charlie"
  },
];

const Remarks = () => {
  const user = getUser();
  const isTeacher = user?.role === "Teacher" || user?.role === "Admin" || user?.role === "Staff";
  const [remarksList, setRemarksList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  // Add Remarks modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState([]);

  // Form states
  const [selectedStudent, setSelectedStudent] = useState("");
  const [remarkType, setRemarkType] = useState("Positive");
  const [remarkCategory, setRemarkCategory] = useState("Academic");
  const [remarkContent, setRemarkContent] = useState("");

  const loadRemarks = async () => {
    const data = await api.getRemarks(mockRemarksData);
    setRemarksList(data.map((r) => ({
      id: r.id,
      student: r.student_name || r.student,
      teacher: r.teacher_name || r.teacher,
      type: r.remark_type || r.type,
      category: r.category,
      content: r.content,
      date: r.date,
      avatar: r.avatar || `https://i.pravatar.cc/150?u=${r.student_name || "student"}`,
    })));
  };

  useEffect(() => {
    loadRemarks();
    if (isTeacher) {
      api.getStudents([]).then(setStudents);
    }
  }, []);

  const handleSubmitRemark = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error("Please select a student.");
      return;
    }
    if (!remarkContent.trim()) {
      toast.error("Please write a remark comment.");
      return;
    }

    const studentObj = students.find(s => s.student_id === selectedStudent || s.id?.toString() === selectedStudent.toString());
    if (!studentObj) {
      toast.error("Invalid student selected.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.addRemark({
        student: studentObj.student_id,
        teacher_name: user?.name || "Dr. Sarah Miller",
        teacher_role: user?.role || "Teacher",
        remark_type: remarkType,
        category: remarkCategory,
        content: remarkContent,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      });

      if (res) {
        toast.success("Remark recorded successfully!");
        setShowAddModal(false);
        setRemarkContent("");
        loadRemarks();
      } else {
        toast.error("Failed to submit remark.");
      }
    } catch (err) {
      toast.error("Error submitting remark: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRemarks = remarksList.filter(remark => {
    const matchesSearch = remark.student.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         remark.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === "All" || remark.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Remarks</h1>
          <p className="text-muted-foreground">Track behavior, academic feedback, and teacher observations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => toast.info("Active filters are Positive and Warning tabs.")}>
            <Filter size={16} /> Filter
          </Button>
          {isTeacher && (
            <Button className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md transform hover:-translate-y-0.5 transition-all" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> 
              <span>Add Remark</span>
            </Button>
          )}
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Smile size={28} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Positive Remarks</p>
              <h3 className="text-2xl font-bold">142</h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">+12% from last month</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <AlertTriangle size={28} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Warnings</p>
              <h3 className="text-2xl font-bold">28</h3>
              <p className="text-[10px] text-orange-600 font-bold mt-1">-5% from last month</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Info size={28} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">AI Insight</p>
              <p className="text-xs text-muted-foreground mt-1">Behavior patterns are <span className="text-primary font-bold">94% positive</span> institutional wide.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/50 p-2 rounded-2xl border">
        <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl">
          {["All", "Positive", "Warning"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                activeFilter === f ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search remarks..."
            className="w-full bg-background border-none rounded-xl py-2 pl-10 pr-4 text-xs ring-1 ring-border focus:ring-2 focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Timeline View */}
      <div className="space-y-6 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-px before:bg-border">
        {filteredRemarks.map((remark, i) => (
          <motion.div 
            key={remark.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative pl-16"
          >
            {/* Timeline Dot/Icon */}
            <div className={cn(
              "absolute left-5 top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-background z-10 shadow-sm",
              remark.type === 'Positive' ? "bg-emerald-500 text-white" : "bg-orange-500 text-white"
            )}>
              {remark.type === 'Positive' ? <Smile size={14} /> : <AlertTriangle size={14} />}
            </div>

            <Card className="group hover:shadow-lg transition-all duration-300 border-none shadow-md overflow-hidden">
              <CardContent className="p-0 flex flex-col md:flex-row">
                {/* Left Side - Student Info */}
                <div className="p-6 md:w-64 border-b md:border-b-0 md:border-r bg-secondary/20 flex flex-col items-center text-center justify-center">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-background shadow-md mb-3">
                    <img src={remark.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <h4 className="font-bold text-sm">{remark.student}</h4>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Class 10-A</p>
                </div>

                {/* Right Side - Content */}
                <div className="p-6 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                        remark.type === 'Positive' ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
                      )}>
                        {remark.type} Remark
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-primary/10 text-primary">
                        {remark.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock size={12} />
                      {remark.date}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    "{remark.content}"
                  </p>

                  <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Reported By</span>
                        <span className="text-xs font-bold">{remark.teacher}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Edit3 size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                        <Trash2 size={14} />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase">Notify Parent</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>



      {/* Add Remark Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-secondary/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b bg-secondary/10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-card-foreground">Add Student Remark</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Record behavior notes, warnings, or academic feedback</p>
              </div>
              <Button size="sm" variant="ghost" className="h-8 text-xs font-bold text-muted-foreground hover:bg-secondary" onClick={() => setShowAddModal(false)}>
                Close
              </Button>
            </div>

            <form onSubmit={handleSubmitRemark} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select Student</label>
                <select
                  className="w-full bg-secondary/50 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  required
                >
                  <option value="">-- Choose student from roster --</option>
                  {students.map(std => (
                    <option key={std.student_id} value={std.student_id}>{std.name} ({std.student_id}) - {std.grade}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Remark Type</label>
                  <select
                    className="w-full bg-secondary/50 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                    value={remarkType}
                    onChange={(e) => setRemarkType(e.target.value)}
                  >
                    <option value="Positive">Positive feedback</option>
                    <option value="Warning">Warning / Issue</option>
                    <option value="Note">General observation note</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</label>
                  <select
                    className="w-full bg-secondary/50 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                    value={remarkCategory}
                    onChange={(e) => setRemarkCategory(e.target.value)}
                  >
                    <option value="Academic">Academic performance</option>
                    <option value="Behavior">Behavioral conduct</option>
                    <option value="Extracurricular">Extracurricular activities</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Detailed Observations</label>
                <textarea
                  rows={4}
                  placeholder="Describe your detailed remarks, behavioral observations, or academic guidance notes here..."
                  className="w-full bg-secondary/50 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary/20 leading-relaxed resize-none"
                  value={remarkContent}
                  onChange={(e) => setRemarkContent(e.target.value)}
                  required
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2"
                >
                  {submitting && <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Add Observation</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Internal icon helpers
function ChevronRight({ size, className }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 18l6-6-6-6" /></svg>;
}

export default Remarks;
