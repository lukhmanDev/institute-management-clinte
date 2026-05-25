import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Upload,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  X,
  User,
  Edit3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";
import { api } from "../lib/api";
import { getUser } from "../lib/auth";
import { toast } from "../lib/toast";
import { parseStudentCsv, STUDENT_CSV_TEMPLATE } from "../lib/csvParse";
import BulkImportPanel from "../components/admin/BulkImportPanel";

const mockStudents = [
  { id: "STU001", name: "Alice Johnson", class: "10-A", parent: "Robert Johnson", phone: "+1 234 567 890", status: "Active", image: "https://i.pravatar.cc/150?u=alice" },
  { id: "STU002", name: "Bob Smith", class: "9-B", parent: "Mary Smith", phone: "+1 234 567 891", status: "Active", image: "https://i.pravatar.cc/150?u=bob" },
  { id: "STU003", name: "Charlie Brown", class: "12-C", parent: "Linda Brown", phone: "+1 234 567 892", status: "Inactive", image: "https://i.pravatar.cc/150?u=charlie" },
  { id: "STU004", name: "Diana Prince", class: "11-A", parent: "Hippolyta", phone: "+1 234 567 893", status: "Active", image: "https://i.pravatar.cc/150?u=diana" },
  { id: "STU005", name: "Ethan Hunt", class: "10-B", parent: "Unknown", phone: "+1 234 567 894", status: "Active", image: "https://i.pravatar.cc/150?u=ethan" },
];

const Students = () => {
  const user = getUser();
  const isAdmin = user?.role === "Admin";
  const canAdd = isAdmin || user?.role === "Staff";
  const [view, setView] = useState("list");
  const [studentsList, setStudentsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [classesList, setClassesList] = useState([]);
  const [bulkCsv, setBulkCsv] = useState("");

  // Edit classroom states
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [updatingClass, setUpdatingClass] = useState(false);
  const [bulkPassword, setBulkPassword] = useState("");
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [newStudent, setNewStudent] = useState({
    student_id: "",
    name: "",
    grade: "",
    roll_no: "",
    parent_name: "",
    phone: "",
    email: "",
    password: "",
    status: "Active"
  });

  const fetchStudents = async () => {
    const data = await api.getStudents(mockStudents.map(s => ({
      student_id: s.id,
      name: s.name,
      grade: s.class,
      parent_name: s.parent,
      phone: s.phone,
      status: s.status,
      image_url: s.image
    })));
    setStudentsList(data);
  };

  useEffect(() => {
    fetchStudents();

    const fetchClasses = async () => {
      try {
        const classes = await api.getClasses([]);
        setClassesList(classes);
      } catch (err) {
        console.warn("Failed to load classes for student selector:", err);
      }
    };
    fetchClasses();
  }, []);

  const handleEditClass = (student) => {
    setEditingStudent(student);
    setSelectedClass(student.class);
  };

  const handleUpdateClassSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass) {
      toast.error("Please select a classroom.");
      return;
    }
    setUpdatingClass(true);
    try {
      const res = await api.updateStudent(editingStudent.id, { grade: selectedClass });
      if (res) {
        toast.success("Student classroom updated successfully!");
        setEditingStudent(null);
        fetchStudents();
      } else {
        toast.error("Failed to update student classroom.");
      }
    } catch (err) {
      toast.error("Failed to update student classroom: " + err.message);
    } finally {
      setUpdatingClass(false);
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!confirm(`Delete student "${studentName}" (${studentId})? Their login account and related fees/remarks/loans will be removed.`)) {
      return;
    }
    try {
      const res = await api.deleteStudent(studentId, user?.role || "Admin");
      setStudentsList((prev) => prev.filter((s) => (s.student_id || s.id) !== studentId));
      toast.success(res.message || "Student deleted.");
    } catch (err) {
      toast.error("Failed to delete student: " + err.message);
    }
  };

  const handleClearAll = async () => {
    if (
      !confirm(
        "Delete ALL students? This removes student records, fees, remarks, library loans, and Student login accounts. This cannot be undone."
      )
    ) {
      return;
    }
    if (!confirm("Are you absolutely sure? Type OK in the next prompt.") ) {
      return;
    }
    const sure = prompt('Type DELETE to confirm clearing all students:');
    if (sure !== "DELETE") {
      toast.info("Cancelled — confirmation text did not match.");
      return;
    }
    try {
      const res = await api.clearAllStudents(user?.role || "Admin");
      setStudentsList([]);
      toast.success(res.message || `Removed ${res.students_deleted} student(s).`);
    } catch (err) {
      toast.error("Failed to clear students: " + err.message);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    const rows = parseStudentCsv(bulkCsv);
    if (rows.length === 0) {
      toast.error("Paste CSV data or upload a file. Need header row and at least one student row.");
      return;
    }
    setBulkSubmitting(true);
    setBulkResult(null);
    try {
      const res = await api.bulkUploadStudents(rows, user?.role || "Admin", bulkPassword);
      setBulkResult(res);
      if (res.created_count > 0) {
        const refreshed = await api.getStudents([]);
        setStudentsList(refreshed);
      }
      if (res.created_count === 0) {
        toast.error(res.message || "Bulk upload failed: Added 0 student(s) with login accounts.");
      } else {
        toast.success(res.message || `Added ${res.created_count} student(s).`);
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
    try {
      const payload = { ...newStudent };
      if (!payload.password) delete payload.password;
      const added = await api.addStudent(payload, user?.role || "Admin"); // Admin/Staff
      setStudentsList(prev => [added, ...prev]);
      setIsAdding(false);
      setNewStudent({
        student_id: "",
        name: "",
        grade: "",
        roll_no: "",
        parent_name: "",
        phone: "",
        email: "",
        password: "",
        status: "Active"
      });
      toast.success(
        added.login_message ||
          `Student added. Login: ${added.auth_user?.email || added.email} / password123`
      );
    } catch (err) {
      toast.error("Failed to add student: " + err.message);
    }
  };

  const mapStudent = (s) => ({
    id: s.student_id || s.id,
    name: s.name,
    class: s.grade || s.class,
    parent: s.parent_name || s.parent,
    phone: s.phone,
    email: s.email || `${(s.student_id || s.id).toLowerCase()}@edu.com`,
    status: s.status,
    image: s.image_url || s.image || null
  });

  const allMapped = studentsList.map(mapStudent);

  // Extract unique class/grade values for the filter dropdown
  const uniqueClasses = [...new Set(allMapped.map((s) => s.class).filter(Boolean))].sort();

  const filteredStudents = allMapped.filter((student) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      student.name.toLowerCase().includes(term) ||
      student.id.toLowerCase().includes(term) ||
      student.parent.toLowerCase().includes(term);
    const matchesClass = !classFilter || student.class === classFilter;
    return matchesSearch && matchesClass;
  });


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Students Management</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage students, add individually, or bulk import with login accounts." : "View and search student records."}
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
              <span>Add Student</span>
            </Button>
          )}
          {isAdmin && studentsList.length > 0 && (
            <Button variant="outline" className="gap-2 text-red-600 border-red-200 hover:bg-red-50" onClick={handleClearAll}>
              <Trash2 size={16} />
              <span>Clear All</span>
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
            All Students
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
          title="Bulk Student Import (Admin)"
          description="Import many students from CSV. Each row creates a student record and a Student login account. Columns: student_id (optional), name, grade, roll_no, email, phone, parent_name, password, status"
          template={STUDENT_CSV_TEMPLATE}
          templateFilename="students_import_template.csv"
          csv={bulkCsv}
          onCsvChange={setBulkCsv}
          defaultPassword={bulkPassword}
          onPasswordChange={setBulkPassword}
          onFileSelect={handleCsvFile}
          onSubmit={handleBulkUpload}
          rowCount={parseStudentCsv(bulkCsv).length}
          submitting={bulkSubmitting}
          result={bulkResult}
          entityLabel="student(s)"
          importLabel="Import students & create logins"
        />
      )}

      {view === "list" && (
        <>
      {/* Filters and Search */}
      <Card className="border-none shadow-sm bg-card/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search by name, ID or parent..."
                className="w-full bg-background border-none rounded-xl py-2 pl-10 pr-4 text-sm ring-1 ring-border focus:ring-2 focus:ring-primary/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <Filter size={14} />
                Filter
              </Button>
              <select
                id="filter-class"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-background border border-border rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Classes</option>
                {uniqueClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="overflow-hidden border-none shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Student</th>
                <th className="px-6 py-4 font-semibold">Student ID</th>
                <th className="px-6 py-4 font-semibold">Class</th>
                <th className="px-6 py-4 font-semibold">Parent Details</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.map((student, i) => (
                <motion.tr 
                  key={student.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link to={`/students/${student.id}`} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-background shadow-sm bg-secondary flex items-center justify-center">
                        {student.image ? (
                          <img src={student.image} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground">
                            <User size={16} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm group-hover:text-primary transition-colors">{student.name}</span>
                        <span className="text-xs text-muted-foreground">{student.email}</span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{student.id}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {student.class}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{student.parent}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone size={10} /> {student.phone}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                      student.status === 'Active' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10" : "bg-red-100 text-red-600 dark:bg-red-500/10"
                    )}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            onClick={() => handleEditClass(student)}
                            title="Change Class"
                          >
                            <Edit3 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            onClick={() => handleDeleteStudent(student.id, student.name)}
                            title="Delete Student"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-secondary/20 flex items-center justify-between border-t border-border">
          <p className="text-xs text-muted-foreground">Showing {filteredStudents.length} of {studentsList.length} students</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </Card>
        </>
      )}

      {/* Add Student Modal — Admin/Staff */}
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
                <h3 className="text-xl font-bold">Add New Student</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)} className="rounded-full">
                  <X size={18} />
                </Button>
              </div>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Student ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. STU006"
                      required
                      value={newStudent.student_id}
                      onChange={(e) => setNewStudent({...newStudent, student_id: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe"
                      required
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Grade/Class</label>
                    <select 
                      required
                      value={newStudent.grade}
                      onChange={(e) => setNewStudent({...newStudent, grade: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">-- Select Class --</option>
                      {classesList.map(cls => (
                        <option key={cls.class_id || cls.name} value={cls.name}>{cls.name} ({cls.teacher_name || 'Unassigned'})</option>
                      ))}
                      {classesList.length === 0 && (
                        <>
                          <option value="10-A">10-A</option>
                          <option value="10-B">10-B</option>
                          <option value="9-A">9-A</option>
                          <option value="9-B">9-B</option>
                          <option value="8-A">8-A</option>
                          <option value="8-B">8-B</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Roll No</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 28"
                      value={newStudent.roll_no}
                      onChange={(e) => setNewStudent({...newStudent, roll_no: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Parent Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Robert Doe"
                      required
                      value={newStudent.parent_name}
                      onChange={(e) => setNewStudent({...newStudent, parent_name: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Phone</label>
                    <input 
                      type="text" 
                      placeholder="e.g. +1 234 567 890"
                      required
                      value={newStudent.phone}
                      onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Login email</label>
                  <input 
                    type="email" 
                    placeholder="Leave blank for auto (e.g. stu006@eduhub.com)"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[10px] text-muted-foreground">An auth account with Student role is created automatically.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Login password (optional)</label>
                  <input 
                    type="password" 
                    placeholder="Default: password123"
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({...newStudent, password: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setIsAdding(false)}>Cancel</Button>
                  <Button type="submit" className="w-full">Register Student</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Student Class Modal — Admin/Staff */}
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingStudent(null)}
              className="absolute inset-0 bg-background/85 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border shadow-2xl rounded-3xl p-6 overflow-hidden z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">Change Student Class</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Relocate student to a new classroom roster</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setEditingStudent(null)} className="rounded-full">
                  <X size={18} />
                </Button>
              </div>

              <form onSubmit={handleUpdateClassSubmit} className="space-y-4">
                <div className="p-4 rounded-2xl bg-secondary/30 text-xs space-y-2">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Student Name:</span>
                    <span className="font-bold text-foreground">{editingStudent.name}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Student ID:</span>
                    <span className="font-mono font-semibold text-foreground">{editingStudent.id}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Current Class:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{editingStudent.class}</span>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Select New Class</label>
                  <select 
                    required
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">-- Select Class --</option>
                    {classesList.map(cls => (
                      <option key={cls.class_id || cls.name} value={cls.name}>{cls.name} ({cls.teacher_name || 'Unassigned'})</option>
                    ))}
                    {classesList.length === 0 && (
                      <>
                        <option value="10-A">10-A</option>
                        <option value="10-B">10-B</option>
                        <option value="9-A">9-A</option>
                        <option value="9-B">9-B</option>
                        <option value="8-A">8-A</option>
                        <option value="8-B">8-B</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-border/50">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setEditingStudent(null)}>Cancel</Button>
                  <Button type="submit" disabled={updatingClass} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2">
                    {updatingClass && <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    <span>Save Relocation</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Students;
