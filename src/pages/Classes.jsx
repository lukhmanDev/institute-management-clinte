import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { 
  BookOpen, 
  Users, 
  UserSquare2, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MoreVertical,
  ChevronRight,
  GraduationCap,
  LayoutGrid,
  List,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";
import { api } from "../lib/api";
import { toast } from "../lib/toast";
import { getUser } from "../lib/auth";
const user = getUser();
const isAdmin = user?.role === "Admin";

const mockClassesData = [
  { id: "C10A", name: "Grade 10-A", teacher: "Dr. Sarah Miller", students: 32, attendance: "98%", status: "In Session" },
  { id: "C11B", name: "Grade 11-B", teacher: "Prof. James Wilson", students: 28, attendance: "94%", status: "Next: 10:00 AM" },
  { id: "C12C", name: "Grade 12-C", teacher: "Elena Gilbert", students: 35, attendance: "92%", status: "In Session" },
  { id: "C10B", name: "Grade 10-B", teacher: "Dr. Gregory House", students: 30, attendance: "88%", status: "Completed" },
  { id: "C09A", name: "Grade 9-A", teacher: "Ross Geller", students: 25, attendance: "96%", status: "Next: 11:30 AM" },
];

/* ───────────── Add Class Modal ───────────── */
const AddClassModal = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: "",
    grade: "",
    teacher: "",
    student_count: "",
    attendance: "95%",
  });
  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  useEffect(() => {
    if (!open) return;
    const fetchTeachersAndSubjects = async () => {
      setLoadingTeachers(true);
      setLoadingSubjects(true);
      try {
        const teachersData = await api.getTeachers([]);
        setTeachers(teachersData);
      } catch {
        setTeachers([]);
      } finally {
        setLoadingTeachers(false);
      }

      try {
        const subjectsData = await api.getSubjects([]);
        setSubjects(subjectsData);
      } catch {
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchTeachersAndSubjects();
  }, [open]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const toggleSubject = (subjId) => {
    setSelectedSubjects(prev => 
      prev.includes(subjId) ? prev.filter(id => id !== subjId) : [...prev, subjId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.grade.trim()) {
      toast.error("Class name and grade are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        grade: form.grade.trim(),
        teacher: form.teacher || null,
        student_count: parseInt(form.student_count, 10) || 0,
        attendance: form.attendance.trim() || "95%",
        subjects: selectedSubjects,
      };
      const created = await api.addClass(payload);
      toast.success(`Class "${created.name || payload.name}" created successfully!`);
      setForm({ name: "", grade: "", teacher: "", student_count: "", attendance: "95%" });
      setSelectedSubjects([]);
      onCreated(created);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to create class.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-lg mx-4"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <Card className="border-primary/20 shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Add New Class</CardTitle>
                    <CardDescription className="text-xs">Fill in the details below to create a class.</CardDescription>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="pt-6 space-y-4">
                  {/* Row 1: Name + Grade */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                        Class Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="add-class-name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="e.g. Grade 10-A"
                        className="w-full bg-secondary/50 border rounded-xl py-2.5 px-3 text-sm ring-1 ring-border focus:ring-primary focus:outline-none transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                        Grade <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="add-class-grade"
                        name="grade"
                        value={form.grade}
                        onChange={handleChange}
                        placeholder="e.g. 10"
                        className="w-full bg-secondary/50 border rounded-xl py-2.5 px-3 text-sm ring-1 ring-border focus:ring-primary focus:outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 2: Teacher (dropdown) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                      Class Teacher
                    </label>
                    <select
                      id="add-class-teacher"
                      name="teacher"
                      value={form.teacher}
                      onChange={handleChange}
                      disabled={loadingTeachers}
                      className="w-full bg-secondary/50 border rounded-xl py-2.5 px-3 text-sm ring-1 ring-border focus:ring-primary focus:outline-none transition-all"
                    >
                      <option value="">{loadingTeachers ? "Loading teachers…" : "— Select a teacher —"}</option>
                      {teachers.map((t) => (
                        <option key={t.teacher_id} value={t.teacher_id}>
                          {t.name} — {t.subject || "General"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Row 3: Assign Subjects */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">
                      Assign Subjects
                    </label>
                    {loadingSubjects ? (
                      <p className="text-xs text-muted-foreground">Loading subjects...</p>
                    ) : subjects.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No subjects found. Create subjects first.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-secondary/30 rounded-xl border border-border/60">
                        {subjects.map((s) => {
                          const isSelected = selectedSubjects.includes(s.id);
                          return (
                            <button
                              type="button"
                              key={s.id}
                              onClick={() => toggleSubject(s.id)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer shadow-sm select-none",
                                isSelected 
                                  ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" 
                                  : "bg-background text-muted-foreground border-border hover:border-muted hover:text-foreground"
                              )}
                            >
                              {isSelected && <Check size={12} />}
                              {s.name} ({s.code})
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Row 4: Student Count */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                      Student Count
                    </label>
                    <input
                      id="add-class-students"
                      name="student_count"
                      type="number"
                      min="0"
                      value={form.student_count}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full bg-secondary/50 border rounded-xl py-2.5 px-3 text-sm ring-1 ring-border focus:ring-primary focus:outline-none transition-all"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose} className="text-sm">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving} className="gap-2 text-sm">
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      {saving ? "Creating…" : "Create Class"}
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


/* ───────────── Edit Class Modal ───────────── */
const EditClassModal = ({ open, cls, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    name: "",
    grade: "",
    teacher: "",
    student_count: "",
    attendance: "95%",
  });
  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  useEffect(() => {
    if (!open || !cls) return;
    setForm({
      name: cls.name || "",
      grade: cls.grade || "",
      teacher: cls.teacher_id || "",
      student_count: cls.students || "0",
      attendance: cls.attendance || "95%",
    });
    // Set initially assigned subjects
    setSelectedSubjects(cls.subjects || []);

    const fetchTeachersAndSubjects = async () => {
      setLoadingTeachers(true);
      setLoadingSubjects(true);
      try {
        const teachersData = await api.getTeachers([]);
        setTeachers(teachersData);
      } catch {
        setTeachers([]);
      } finally {
        setLoadingTeachers(false);
      }

      try {
        const subjectsData = await api.getSubjects([]);
        setSubjects(subjectsData);
      } catch {
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchTeachersAndSubjects();
  }, [open, cls]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const toggleSubject = (subjId) => {
    setSelectedSubjects(prev => 
      prev.includes(subjId) ? prev.filter(id => id !== subjId) : [...prev, subjId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.grade.trim()) {
      toast.error("Class name and grade are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        grade: form.grade.trim(),
        teacher: form.teacher || null,
        student_count: parseInt(form.student_count, 10) || 0,
        attendance: form.attendance.trim() || "95%",
        subjects: selectedSubjects,
      };
      const updated = await api.updateClass(cls.id || cls.class_id, payload);
      toast.success(`Class "${updated.name || payload.name}" updated successfully!`);
      onUpdated(updated);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to update class.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-lg mx-4"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <Card className="border-primary/20 shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Edit Class: {cls.name}</CardTitle>
                    <CardDescription className="text-xs">Update teacher, subjects, or details of this class.</CardDescription>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="pt-6 space-y-4">
                  {/* Row 1: Name + Grade */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                        Class Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="e.g. Grade 10-A"
                        className="w-full bg-secondary/50 border rounded-xl py-2.5 px-3 text-sm ring-1 ring-border focus:ring-primary focus:outline-none transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                        Grade <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="grade"
                        value={form.grade}
                        onChange={handleChange}
                        placeholder="e.g. 10"
                        className="w-full bg-secondary/50 border rounded-xl py-2.5 px-3 text-sm ring-1 ring-border focus:ring-primary focus:outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 2: Teacher (dropdown) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                      Class Teacher
                    </label>
                    <select
                      name="teacher"
                      value={form.teacher}
                      onChange={handleChange}
                      disabled={loadingTeachers}
                      className="w-full bg-secondary/50 border rounded-xl py-2.5 px-3 text-sm ring-1 ring-border focus:ring-primary focus:outline-none transition-all"
                    >
                      <option value="">{loadingTeachers ? "Loading teachers…" : "— Select a teacher —"}</option>
                      {teachers.map((t) => (
                        <option key={t.teacher_id} value={t.teacher_id}>
                          {t.name} — {t.subject || "General"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Row 3: Assign Subjects */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">
                      Assign Subjects
                    </label>
                    {loadingSubjects ? (
                      <p className="text-xs text-muted-foreground">Loading subjects...</p>
                    ) : subjects.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No subjects found. Create subjects first.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-secondary/30 rounded-xl border border-border/60">
                        {subjects.map((s) => {
                          const isSelected = selectedSubjects.includes(s.id);
                          return (
                            <button
                              type="button"
                              key={s.id}
                              onClick={() => toggleSubject(s.id)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer shadow-sm select-none",
                                isSelected 
                                  ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" 
                                  : "bg-background text-muted-foreground border-border hover:border-muted hover:text-foreground"
                              )}
                            >
                              {isSelected && <Check size={12} />}
                              {s.name} ({s.code})
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Row 4: Student Count */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                      Student Count
                    </label>
                    <input
                      name="student_count"
                      type="number"
                      min="0"
                      value={form.student_count}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full bg-secondary/50 border rounded-xl py-2.5 px-3 text-sm ring-1 ring-border focus:ring-primary focus:outline-none transition-all"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose} className="text-sm">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving} className="gap-2 text-sm">
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      {saving ? "Saving…" : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ───────────── Delete Confirmation Modal ───────────── */
const DeleteConfirmModal = ({ open, cls, onClose, onConfirm, deleting }) => {
  if (!open || !cls) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative z-10 w-full max-w-md mx-4"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <Card className="border-destructive/30 shadow-2xl">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Delete Class</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Are you sure you want to delete <strong>{cls.name}</strong>? This action cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{cls.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{cls.id} · {cls.teacher}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={onClose} className="text-sm">
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={onConfirm}
                    disabled={deleting}
                    className="gap-2 text-sm"
                  >
                    {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    {deleting ? "Deleting…" : "Delete Class"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ───────────── Dropdown Menu ───────────── */
const ActionMenu = ({ onDelete, onEdit }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
      >
        <MoreVertical size={16} />
      </Button>
      <AnimatePresence>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-1 z-40 w-40 bg-card border rounded-xl shadow-xl overflow-hidden"
            >
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors border-b"
                >
                  <UserSquare2 size={14} className="text-primary" />
                  Edit Class
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete Class
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ───────────── Main Component ───────────── */
const Classes = () => {
  const location = useLocation();
  const [viewMode, setViewMode] = useState("grid");
  const [activeTab, setActiveTab] = useState(
    location.pathname === "/attendance" ? "Attendance" : "Classes"
  );
  const [classesList, setClassesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Attendance modal states
  const [activeClassForAttendance, setActiveClassForAttendance] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceStudents, setAttendanceStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loadingAttendanceModal, setLoadingAttendanceModal] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  const loadAttendanceData = async (cls, date) => {
    setLoadingAttendanceModal(true);
    try {
      const allStudents = await api.getStudents([]);
      const filtered = allStudents.filter(
        (s) =>
          s.classroom === (cls.class_id || cls.id) ||
          (s.grade || "").toLowerCase() === (cls.name || "").toLowerCase() ||
          (s.grade || "").toLowerCase() === (cls.grade || "").toLowerCase()
      );
      setAttendanceStudents(filtered);

      const marked = await api.getAttendance(cls.id || cls.class_id, date, []);
      const map = {};
      
      filtered.forEach(s => {
        map[s.student_id] = "Present";
      });

      marked.forEach(rec => {
        const sId = rec.student_id || rec.student;
        if (sId) {
          map[sId] = rec.status;
        }
      });

      setAttendanceMap(map);
    } catch (err) {
      console.error("Failed to load attendance details:", err);
      toast.error("Failed to load students list.");
    } finally {
      setLoadingAttendanceModal(false);
    }
  };

  const handleOpenAttendance = (cls) => {
    // Find the original classroom grade/details if needed
    setActiveClassForAttendance(cls);
    const today = new Date().toISOString().split("T")[0];
    setAttendanceDate(today);
    loadAttendanceData(cls, today);
  };

  const handleDateChange = (newDate) => {
    setAttendanceDate(newDate);
    if (activeClassForAttendance) {
      loadAttendanceData(activeClassForAttendance, newDate);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    if (!activeClassForAttendance) return;
    setSavingAttendance(true);
    try {
      const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
        student_id: studentId,
        status: status
      }));

      await api.bulkSaveAttendance({
        classroom: activeClassForAttendance.id || activeClassForAttendance.class_id,
        date: attendanceDate,
        records: records
      });

      toast.success(`Attendance saved for ${activeClassForAttendance.name} on ${attendanceDate}!`);
      setActiveClassForAttendance(null);
      loadClasses(); // Refresh data to show new attendance averages
    } catch (err) {
      console.error("Failed to save attendance:", err);
      toast.error("Failed to save attendance: " + err.message);
    } finally {
      setSavingAttendance(false);
    }
  };

  const loadClasses = useCallback(async () => {
    const data = await api.getClasses(mockClassesData);
    setClassesList(data.map((c) => ({
      id: c.class_id || c.id,
      class_id: c.class_id || c.id,
      name: c.name,
      grade: c.grade || "",
      teacher: c.teacher_name || c.teacher || "Unassigned",
      teacher_id: c.teacher || "",
      students: c.student_count ?? c.students ?? 0,
      attendance: c.attendance || "95%",
      status: c.session_status || c.status || "In Session",
      subjects: c.subjects || [],
    })));
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const filteredClasses = searchQuery.trim()
    ? classesList.filter((cls) =>
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : classesList;

  const handleCreated = (created) => {
    const mapped = {
      id: created.class_id || created.id,
      class_id: created.class_id || created.id,
      name: created.name,
      grade: created.grade || "",
      teacher: created.teacher_name || created.teacher || "Unassigned",
      teacher_id: created.teacher || "",
      students: created.student_count ?? created.students ?? 0,
      attendance: created.attendance || "95%",
      status: created.session_status || created.status || "In Session",
      subjects: created.subjects || [],
    };
    setClassesList((prev) => [...prev, mapped]);
  };

  const handleUpdated = (updated) => {
    const mapped = {
      id: updated.class_id || updated.id,
      class_id: updated.class_id || updated.id,
      name: updated.name,
      grade: updated.grade || "",
      teacher: updated.teacher_name || updated.teacher || "Unassigned",
      teacher_id: updated.teacher || "",
      students: updated.student_count ?? updated.students ?? 0,
      attendance: updated.attendance || "95%",
      status: updated.session_status || updated.status || "In Session",
      subjects: updated.subjects || [],
    };
    setClassesList((prev) => prev.map((c) => c.id === mapped.id ? mapped : c));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteClass(deleteTarget.id);
      toast.success(`Class "${deleteTarget.name}" deleted.`);
    } catch (err) {
      // If 404, the class was mock data (not in DB) — remove locally
      if (err.message && err.message.includes("404")) {
        toast.success(`Class "${deleteTarget.name}" removed.`);
      } else {
        toast.error(err.message || "Failed to delete class.");
        setDeleting(false);
        return;
      }
    }
    setClassesList((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Academic Management</h1>
          <p className="text-muted-foreground">Manage class schedules, teacher assignments, and attendance logs.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-secondary rounded-xl border">
            <button 
              onClick={() => setActiveTab("Classes")}
              className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-all", activeTab === "Classes" ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
            >
              Classes
            </button>
            <button 
              onClick={() => setActiveTab("Attendance")}
              className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-all", activeTab === "Attendance" ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
            >
              Attendance
            </button>
          </div>
          {isAdmin && activeTab === "Classes" && (
            <Button className="gap-2" onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              <span>Create Class</span>
            </Button>
          )}
        </div>
      </div>

      {activeTab === "Classes" ? (
        <div className="space-y-6">
          {/* Filters & View Toggle */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  id="search-classes"
                  type="text"
                  placeholder="Search classes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-card border-none rounded-xl py-2 pl-10 pr-4 text-xs ring-1 ring-border"
                />
              </div>
              <Button variant="outline" size="icon" className="shrink-0"><Filter size={16} /></Button>
            </div>
            <div className="flex p-1 bg-secondary rounded-xl border shrink-0">
              <button 
                onClick={() => setViewMode("grid")}
                className={cn("p-1.5 rounded-lg transition-all", viewMode === "grid" ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={cn("p-1.5 rounded-lg transition-all", viewMode === "list" ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Empty state */}
          {filteredClasses.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <BookOpen size={32} />
              </div>
              <h3 className="text-lg font-bold mb-1">No classes found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search." : "Create your first class to get started."}
              </p>
              {!searchQuery && (
                <Button className="gap-2" onClick={() => setShowAddModal(true)}>
                  <Plus size={16} /> Create Class
                </Button>
              )}
            </motion.div>
          )}

          {/* Classes Grid/List */}
          {filteredClasses.length > 0 && viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredClasses.map((cls, i) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="group hover:border-primary/50 transition-all duration-300 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{cls.name}</CardTitle>
                          <CardDescription className="text-[10px] uppercase font-bold">{cls.id}</CardDescription>
                        </div>
                      </div>
                      {isAdmin && (
                        <ActionMenu onDelete={() => setDeleteTarget(cls)} onEdit={() => setEditTarget(cls)} />
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                        <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-muted-foreground">
                          <UserSquare2 size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Class Teacher</span>
                          <span className="text-xs font-bold">{cls.teacher}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Students</span>
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-primary" />
                            <span className="text-sm font-bold">{cls.students}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Attendance</span>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            <span className="text-sm font-bold">{cls.attendance}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t flex items-center justify-between">
                        <div className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          cls.status === 'In Session' ? "bg-emerald-500/10 text-emerald-500" :
                          cls.status === 'Completed' ? "bg-secondary text-muted-foreground" : "bg-orange-500/10 text-orange-500"
                        )}>
                          {cls.status}
                        </div>
                        <Button variant="ghost" className="text-xs gap-1 group/btn p-0 h-auto font-semibold">
                          View Details <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : filteredClasses.length > 0 && viewMode === "list" ? (
            <Card className="overflow-hidden border-none shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Class Name</th>
                      <th className="px-6 py-4 font-semibold">Class Teacher</th>
                      <th className="px-6 py-4 font-semibold">Total Students</th>
                      <th className="px-6 py-4 font-semibold">Avg Attendance</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      {isAdmin && <th className="px-6 py-4 font-semibold text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredClasses.map((cls) => (
                      <tr key={cls.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><BookOpen size={16} /></div>
                            <span className="font-bold text-sm">{cls.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{cls.teacher}</td>
                        <td className="px-6 py-4 text-sm font-mono">{cls.students}</td>
                        <td className="px-6 py-4 text-sm text-emerald-500 font-bold">{cls.attendance}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            cls.status === 'In Session' ? "bg-emerald-500/10 text-emerald-500" : "bg-secondary text-muted-foreground"
                          )}>
                            {cls.status}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                                onClick={() => setDeleteTarget(cls)}
                              >
                                <Trash2 size={15} />
                              </Button>
                              <ActionMenu onDelete={() => setDeleteTarget(cls)} onEdit={() => setEditTarget(cls)} />
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Attendance Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Daily Attendance Log</CardTitle>
                  <CardDescription>Mark and track attendance for current classes.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                    {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classesList.map((cls, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border bg-secondary/20 hover:bg-secondary/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-muted-foreground border"><Clock size={18} /></div>
                        <div>
                          <h4 className="text-sm font-bold">{cls.name}</h4>
                          <p className="text-[10px] text-muted-foreground uppercase">{cls.teacher}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end mr-4">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Students</span>
                          <span className="text-xs font-bold text-emerald-500">{cls.students} Total</span>
                        </div>
                        <Button size="sm" className="h-8 text-xs font-bold uppercase" onClick={() => handleOpenAttendance(cls)}>Mark Attendance</Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenAttendance(cls)}><ChevronRight size={16} /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="bg-primary text-white overflow-hidden relative">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold">Attendance Insight</h3>
                  <p className="text-xs opacity-80 mt-2">Average attendance is up by 2.4% this week. Grade 10-A maintains a perfect 100% streak.</p>
                  <div className="mt-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white flex items-center justify-center text-sm font-bold">96%</div>
                    <div>
                      <p className="text-[10px] uppercase font-bold opacity-70">Weekly Average</p>
                      <p className="text-sm font-bold">Excellent</p>
                    </div>
                  </div>
                </CardContent>
                <div className="absolute -right-4 -bottom-4 opacity-10"><Calendar size={120} /></div>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Absence Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "Charlie Brown", class: "12-C", days: "3 days", reason: "Fever" },
                    { name: "John Doe", class: "10-B", days: "2 days", reason: "Unexplained" },
                  ].map((abs, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500"><XCircle size={14} /></div>
                        <div>
                          <h5 className="text-xs font-bold">{abs.name}</h5>
                          <p className="text-[10px] text-muted-foreground">{abs.class} | {abs.days}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-primary">Contact</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddClassModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={handleCreated}
      />
      <EditClassModal
        open={!!editTarget}
        cls={editTarget}
        onClose={() => setEditTarget(null)}
        onUpdated={handleUpdated}
      />
      <DeleteConfirmModal
        open={!!deleteTarget}
        cls={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />

      {/* Modern Attendance Modal */}
      <AnimatePresence>
        {activeClassForAttendance && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/10">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">{activeClassForAttendance.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 font-sans">Mark daily student presence</p>
                </div>
                <button 
                  onClick={() => setActiveClassForAttendance(null)}
                  className="p-1.5 rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Date & Quick Info Selector */}
              <div className="px-6 py-4 border-b border-border/60 bg-secondary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  <input 
                    type="date" 
                    value={attendanceDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="bg-transparent border-0 font-medium text-sm focus:ring-0 focus:outline-none cursor-pointer text-foreground"
                  />
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {Object.values(attendanceMap).filter(v => v === "Present").length} Present
                  </span>
                  <span className="px-2 py-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400">
                    {Object.values(attendanceMap).filter(v => v === "Absent").length} Absent
                  </span>
                  <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    {Object.values(attendanceMap).filter(v => v === "Late").length} Late
                  </span>
                </div>
              </div>

              {/* Students List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 min-h-[300px]">
                {loadingAttendanceModal ? (
                  <div className="h-full flex flex-col items-center justify-center py-12 space-y-3">
                    <Loader2 size={32} className="animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading student roster...</p>
                  </div>
                ) : attendanceStudents.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle size={36} className="text-muted-foreground mb-2" />
                    <p className="font-semibold">No Students Registered</p>
                    <p className="text-xs text-muted-foreground mt-0.5">There are no students listed in this classroom.</p>
                  </div>
                ) : (
                  attendanceStudents.map((student) => {
                    const status = attendanceMap[student.student_id] || "Present";
                    return (
                      <div key={student.student_id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-secondary/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-muted-foreground w-6 text-center bg-secondary/50 py-0.5 rounded">
                            {student.roll_no || "-"}
                          </span>
                          <img 
                            src={student.image_url || `https://i.pravatar.cc/150?u=${student.student_id}`} 
                            alt={student.name}
                            className="w-9 h-9 rounded-full object-cover border border-border/80"
                          />
                          <div>
                            <p className="text-sm font-semibold">{student.name}</p>
                            <p className="text-[10px] text-muted-foreground">{student.student_id}</p>
                          </div>
                        </div>

                        {/* Attendance Switcher */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.student_id, "Present")}
                            className={cn(
                              "text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-150",
                              status === "Present"
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                                : "bg-transparent text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10"
                            )}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.student_id, "Absent")}
                            className={cn(
                              "text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-150",
                              status === "Absent"
                                ? "bg-red-500 text-white border-red-500 shadow-sm"
                                : "bg-transparent text-red-500 border-red-500/20 hover:bg-red-500/10"
                            )}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.student_id, "Late")}
                            className={cn(
                              "text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-150",
                              status === "Late"
                                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                : "bg-transparent text-amber-500 border-amber-500/20 hover:bg-amber-500/10"
                            )}
                          >
                            Late
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-6 border-t border-border flex items-center justify-end gap-3 bg-secondary/5">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveClassForAttendance(null)}
                  disabled={savingAttendance}
                >
                  Cancel
                </Button>
                <Button 
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/95"
                  onClick={handleSaveAttendance}
                  disabled={savingAttendance || loadingAttendanceModal || attendanceStudents.length === 0}
                >
                  {savingAttendance ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Save Attendance
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Classes;
