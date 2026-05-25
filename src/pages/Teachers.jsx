import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Mail, Phone, GraduationCap, Clock, Award, ArrowRight, Users, X, Upload, Trash2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";
import { api } from "../lib/api";
import { getUser } from "../lib/auth";
import { toast } from "../lib/toast";
import { parseTeacherCsv, TEACHER_CSV_TEMPLATE } from "../lib/csvParse";
import BulkImportPanel from "../components/admin/BulkImportPanel";

const mockTeachers = [
  { id: "TCH001", name: "Dr. Sarah Miller", subject: "Physics", exp: "12 years", qualification: "PhD in Astrophysics", image: "https://i.pravatar.cc/150?u=sarah", status: "In Class" },
  { id: "TCH002", name: "Prof. James Wilson", subject: "Mathematics", exp: "8 years", qualification: "MSc Mathematics", image: "https://i.pravatar.cc/150?u=james", status: "Available" },
  { id: "TCH003", name: "Elena Gilbert", subject: "Literature", exp: "5 years", qualification: "MA English", image: "https://i.pravatar.cc/150?u=elena", status: "On Leave" },
  { id: "TCH004", name: "Dr. Gregory House", subject: "Biology", exp: "20 years", qualification: "MD, Genetics", image: "https://i.pravatar.cc/150?u=house", status: "In Class" },
  { id: "TCH005", name: "Ross Geller", subject: "History", exp: "10 years", qualification: "PhD Paleontology", image: "https://i.pravatar.cc/150?u=ross", status: "Available" },
  { id: "TCH006", name: "Walter White", subject: "Chemistry", exp: "15 years", qualification: "MSc Chemistry", image: "https://i.pravatar.cc/150?u=walter", status: "In Class" },
];

const Teachers = () => {
  const user = getUser();
  const isAdmin = user?.role === "Admin";
  const canAdd = isAdmin || user?.role === "Staff";
  const [view, setView] = useState("list");
  const [teachersList, setTeachersList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [isAdding, setIsAdding] = useState(false);
  const [bulkCsv, setBulkCsv] = useState("");
  const [bulkPassword, setBulkPassword] = useState("");
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    teacher_id: "",
    name: "",
    subject: "",
    experience: "",
    qualification: "",
    email: "",
    phone: "",
    password: "",
    status: "Available"
  });

  const [assignment, setAssignment] = useState({
    teacherId: "",
    grade: ""
  });

  useEffect(() => {
    const fetchTeachers = async () => {
      const data = await api.getTeachers(mockTeachers.map(t => ({
        teacher_id: t.id,
        name: t.name,
        subject: t.subject,
        experience: t.exp,
        qualification: t.qualification,
        image_url: t.image,
        status: t.status
      })));
      setTeachersList(data);
    };
    fetchTeachers();
  }, []);

  const handleDeleteTeacher = async (teacherId, teacherName) => {
    if (!confirm(`Delete teacher "${teacherName}" (${teacherId})? Their login account will be removed.`)) {
      return;
    }
    try {
      const res = await api.deleteTeacher(teacherId, user?.role || "Admin");
      setTeachersList((prev) => prev.filter((t) => (t.teacher_id || t.id) !== teacherId));
      toast.success(res.message || "Teacher deleted.");
    } catch (err) {
      toast.error("Failed to delete teacher: " + err.message);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    const rows = parseTeacherCsv(bulkCsv);
    if (rows.length === 0) {
      toast.error("Paste CSV data or upload a file. Need header row and at least one teacher row.");
      return;
    }
    setBulkSubmitting(true);
    setBulkResult(null);
    try {
      const res = await api.bulkUploadTeachers(rows, user?.role || "Admin", bulkPassword);
      setBulkResult(res);
      if (res.created_count > 0) {
        const refreshed = await api.getTeachers([]);
        setTeachersList(refreshed);
      }
      if (res.created_count === 0) {
        toast.error(res.message || "Bulk upload failed: Added 0 teacher(s) with login accounts.");
      } else {
        toast.success(res.message || `Added ${res.created_count} teacher(s).`);
      }
    } catch (err) {
      toast.error("Bulk upload failed: " + err.message);
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleCsvFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBulkCsv(String(reader.result || ""));
    reader.readAsText(file);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const user = getUser();
    try {
      const payload = { ...newTeacher };
      if (!payload.password) delete payload.password;
      const added = await api.addTeacher(payload, user?.role || "Admin");
      setTeachersList(prev => [added, ...prev]);
      setIsAdding(false);
      setNewTeacher({
        teacher_id: "",
        name: "",
        subject: "",
        experience: "",
        qualification: "",
        email: "",
        phone: "",
        password: "",
        status: "Available"
      });
      toast.success(
        added.login_message ||
          `Teacher added. Login: ${added.auth_user?.email || added.email} / password123`
      );
    } catch (err) {
      toast.error("Failed to add teacher: " + err.message);
    }
  };

  const handleAssignRole = (e) => {
    e.preventDefault();
    if (!assignment.teacherId || !assignment.grade) {
      toast.error("Please select both a teacher and a grade.");
      return;
    }
    const t = teachersList.find(x => (x.teacher_id || x.id) === assignment.teacherId);
    toast.success(`Successfully assigned ${t?.name || "teacher"} to Grade ${assignment.grade}!`);
    setAssignment({ teacherId: "", grade: "" });
  };

  const mapTeacher = (t) => ({
    id: t.teacher_id || t.id,
    name: t.name,
    subject: t.subject,
    exp: t.experience || t.exp || "0 years",
    qualification: t.qualification || "B.Ed",
    image: t.image_url || t.image || null,
    status: t.status || "Available",
    email: t.email || `${(t.teacher_id || t.id).toLowerCase()}@eduhub.com`,
    phone: t.phone || "+1 234 567 890"
  });

  const filteredTeachers = teachersList.map(mapTeacher).filter(t => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = t.name.toLowerCase().includes(term) ||
      t.id.toLowerCase().includes(term) ||
      t.subject.toLowerCase().includes(term);

    const matchesDept = departmentFilter === "All Departments" ||
      t.subject.toLowerCase() === departmentFilter.toLowerCase();

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teachers Directory</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage faculty, add individually, or bulk import with login accounts." : "View faculty directory and assignments."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Button
              variant={view === "bulk" ? "default" : "outline"}
              className="gap-2"
              onClick={() => setView("bulk")}
            >
              <Upload size={16} />
              <span>Bulk Import</span>
            </Button>
          )}
          {canAdd && (
            <Button className="gap-2" onClick={() => { setView("list"); setIsAdding(true); }}>
              <Plus size={16} />
              <span>Add Teacher</span>
            </Button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              view === "list" ? "bg-background shadow-sm text-primary" : "text-muted-foreground"
            )}
          >
            All Teachers
          </button>
          <button
            type="button"
            onClick={() => setView("bulk")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              view === "bulk" ? "bg-background shadow-sm text-primary" : "text-muted-foreground"
            )}
          >
            <Upload size={14} /> Bulk Import
          </button>
        </div>
      )}

      {isAdmin && view === "bulk" && (
        <BulkImportPanel
          title="Bulk Teacher Import (Admin)"
          description="Import many teachers from CSV. Each row creates a teacher record and a Teacher login account. Columns: teacher_id (optional), name, subject, experience, qualification, email, phone, password, status"
          template={TEACHER_CSV_TEMPLATE}
          templateFilename="teachers_import_template.csv"
          csv={bulkCsv}
          onCsvChange={setBulkCsv}
          defaultPassword={bulkPassword}
          onPasswordChange={setBulkPassword}
          onFileSelect={handleCsvFile}
          onSubmit={handleBulkUpload}
          rowCount={parseTeacherCsv(bulkCsv).length}
          submitting={bulkSubmitting}
          result={bulkResult}
          entityLabel="teacher(s)"
          importLabel="Import teachers & create logins"
        />
      )}

      {view === "list" && (
      <>
      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="bg-card/50">
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search teachers by name, subject, or ID..."
                  className="w-full bg-background border-none rounded-xl py-2 pl-10 pr-4 text-sm ring-1 ring-border focus:ring-2 focus:ring-primary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2"><Filter size={14} /> Filter</Button>
                <select 
                  className="bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option>All Departments</option>
                  <option>Science</option>
                  <option>Physics</option>
                  <option>Chemistry</option>
                  <option>Biology</option>
                  <option>Mathematics</option>
                  <option>Literature</option>
                  <option>History</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Teacher Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
            {filteredTeachers.map((teacher, i) => (
              <Card key={teacher.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border-none shadow-md">
                <CardContent className="p-0">
                  <div className="h-24 bg-gradient-to-r from-primary to-purple-600 relative">
                    <div className={cn(
                      "absolute top-4 right-4 px-2 py-1 rounded-full text-[10px] font-bold uppercase ring-2 ring-white/20 text-white",
                      teacher.status === 'In Class' ? "bg-orange-500" :
                      teacher.status === 'Available' ? "bg-emerald-500" : "bg-red-500"
                    )}>
                      {teacher.status}
                    </div>
                  </div>
                  <div className="px-6 pb-6 relative -mt-12">
                    <div className="w-20 h-20 rounded-2xl border-4 border-background overflow-hidden shadow-lg mb-4 bg-background flex items-center justify-center">
                      {teacher.image ? (
                        <img src={teacher.image} alt={teacher.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground">
                          <User size={32} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{teacher.name}</h3>
                      <p className="text-sm text-primary font-medium">{teacher.subject} Department</p>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <GraduationCap size={14} /> {teacher.qualification}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock size={14} /> {teacher.exp} experience
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg" onClick={() => window.open(`mailto:${teacher.email}`)}>
                          <Mail size={14} />
                        </Button>
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg" onClick={() => toast.info(`Call ${teacher.phone}`)}>
                          <Phone size={14} />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-500/10"
                            title="Delete teacher"
                            onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                      <Button variant="ghost" className="text-xs gap-1 font-semibold group/btn">
                        View Profile <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <Card className="bg-primary text-primary-foreground overflow-hidden relative">
            <CardHeader>
              <CardTitle className="text-lg">Staff Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm opacity-80">Total Faculty</span>
                <span className="text-3xl font-bold">{teachersList.length}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white w-3/4"></div>
              </div>
              <p className="text-[10px] opacity-70">
                {teachersList.filter(x => x.status === "Available").length} teachers currently available.
              </p>
            </CardContent>
            <div className="absolute -right-6 -bottom-6 opacity-10">
              <Users size={120} />
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignRole} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Select Teacher</label>
                  <select 
                    className="w-full bg-secondary/50 border-none rounded-lg px-3 py-2 text-sm outline-none"
                    value={assignment.teacherId}
                    onChange={(e) => setAssignment({...assignment, teacherId: e.target.value})}
                  >
                    <option value="">Choose...</option>
                    {teachersList.map(t => <option key={t.teacher_id || t.id} value={t.teacher_id || t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Assign To Class</label>
                  <select 
                    className="w-full bg-secondary/50 border-none rounded-lg px-3 py-2 text-sm outline-none"
                    value={assignment.grade}
                    onChange={(e) => setAssignment({...assignment, grade: e.target.value})}
                  >
                    <option value="">Select Class...</option>
                    <option value="10-A">Grade 10-A</option>
                    <option value="11-B">Grade 11-B</option>
                    <option value="12-C">Grade 12-C</option>
                  </select>
                </div>
                <Button type="submit" className="w-full">Assign Role</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      </>
      )}

      {/* Add Teacher Modal — Admin/Staff */}
      <AnimatePresence>
        {isAdding && canAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-background/85 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-3xl p-6 overflow-hidden z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Add New Teacher</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)} className="rounded-full">
                  <X size={18} />
                </Button>
              </div>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Teacher ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. TCH007"
                      required
                      value={newTeacher.teacher_id}
                      onChange={(e) => setNewTeacher({...newTeacher, teacher_id: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Smith"
                      required
                      value={newTeacher.name}
                      onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Subject/Dept</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Chemistry"
                      required
                      value={newTeacher.subject}
                      onChange={(e) => setNewTeacher({...newTeacher, subject: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Experience</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 5 years"
                      value={newTeacher.experience}
                      onChange={(e) => setNewTeacher({...newTeacher, experience: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Qualification</label>
                    <input 
                      type="text" 
                      placeholder="e.g. PhD Chemistry"
                      required
                      value={newTeacher.qualification}
                      onChange={(e) => setNewTeacher({...newTeacher, qualification: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Phone</label>
                    <input 
                      type="text" 
                      placeholder="e.g. +1 234 567 890"
                      required
                      value={newTeacher.phone}
                      onChange={(e) => setNewTeacher({...newTeacher, phone: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Login email</label>
                  <input 
                    type="email" 
                    placeholder="e.g. smith@eduhub.com (or auto from ID)"
                    value={newTeacher.email}
                    onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[10px] text-muted-foreground">An auth account with Teacher role is created automatically.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Login password (optional)</label>
                  <input 
                    type="password" 
                    placeholder="Default: password123"
                    value={newTeacher.password}
                    onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setIsAdding(false)}>Cancel</Button>
                  <Button type="submit" className="w-full">Register Teacher</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Teachers;
