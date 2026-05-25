import React, { useState, useEffect } from "react";
import { 
  BookMarked, 
  Plus, 
  Search, 
  FileText, 
  Trash2, 
  BookOpen, 
  Loader2, 
  X,
  Check,
  AlertTriangle
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

const mockSubjectsData = [
  { id: 1, name: "Mathematics", code: "SUB-MAT", description: "Study of numbers, formulas, shapes, and patterns." },
  { id: 2, name: "Biology", code: "SUB-BIO", description: "Exploration of life, living organisms, and their ecosystems." },
  { id: 3, name: "Chemistry", code: "SUB-CHEM", description: "Science of substances, atomic properties, and molecular reactions." },
  { id: 4, name: "Physics", code: "SUB-PHYS", description: "Study of matter, forces, spacetime, and universal energy." },
  { id: 5, name: "English Literature", code: "SUB-ENGL", description: "Deep analysis of classic and contemporary literacy works." }
];

/* ───────────── Create Subject Modal ───────────── */
const AddSubjectModal = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: ""
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Subject name and code are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || ""
      };
      const created = await api.addSubject(payload);
      toast.success(`Subject "${created.name}" created successfully!`);
      setForm({ name: "", code: "", description: "" });
      onCreated(created);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to create subject.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            className="relative z-10 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
          >
            <Card className="border-primary/20 shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <BookMarked size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Create New Subject</CardTitle>
                    <CardDescription className="text-xs">Add a subject to your curriculum.</CardDescription>
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
                  {/* Subject Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                      Subject Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Mathematics"
                      className="w-full bg-secondary/50 border rounded-xl py-2.5 px-3 text-sm ring-1 ring-border focus:ring-primary focus:outline-none transition-all"
                      required
                    />
                  </div>

                  {/* Subject Code */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                      Subject Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="code"
                      value={form.code}
                      onChange={handleChange}
                      placeholder="e.g. SUB-MAT"
                      className="w-full bg-secondary/50 border rounded-xl py-2.5 px-3 text-sm ring-1 ring-border focus:ring-primary focus:outline-none transition-all"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Enter a brief overview of the course syllabus..."
                      rows="3"
                      className="w-full bg-secondary/50 border rounded-xl py-2.5 px-3 text-sm ring-1 ring-border focus:ring-primary focus:outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose} className="text-sm">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving} className="gap-2 text-sm">
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      {saving ? "Creating…" : "Create Subject"}
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* ───────────── Delete Confirm Modal ───────────── */
const DeleteConfirmModal = ({ open, subject, onClose, onConfirm, deleting }) => {
  if (!open || !subject) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative z-10 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
          >
            <Card className="border-destructive/30 shadow-2xl">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Delete Subject</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Are you sure you want to delete <strong>{subject.name}</strong> ({subject.code})?
                    </p>
                    <p className="text-xs text-red-500/80 font-semibold mt-1">
                      Warning: This will also unassign this subject from any classes and student rosters.
                    </p>
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
                    {deleting ? "Deleting…" : "Delete Subject"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* ───────────── Main Page Component ───────────── */
const Subjects = () => {
  const [subjectsList, setSubjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const data = await api.getSubjects(mockSubjectsData);
      setSubjectsList(data);
    } catch (err) {
      console.error(err);
      setSubjectsList(mockSubjectsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleCreated = (created) => {
    setSubjectsList((prev) => [...prev, created]);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteSubject(deleteTarget.id);
      toast.success(`Subject "${deleteTarget.name}" deleted.`);
      setSubjectsList((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      if (err.message && err.message.includes("404")) {
        // If mock data (not on server), delete locally
        setSubjectsList((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        toast.success(`Subject "${deleteTarget.name}" removed.`);
        setDeleteTarget(null);
      } else {
        toast.error(err.message || "Failed to delete subject.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const filteredSubjects = subjectsList.filter((s) =>
    (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.code || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subject Management</h1>
          <p className="text-muted-foreground">Configure the core curriculum, subject catalogs, and course codes.</p>
        </div>
        {isAdmin && (
          <Button className="gap-2 shrink-0" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            <span>Create Subject</span>
          </Button>
        )}
      </div>

      {/* Analytics Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <BookMarked size={24} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Subjects</p>
              <h3 className="text-2xl font-bold mt-0.5">{subjectsList.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Curriculum</p>
              <h3 className="text-2xl font-bold mt-0.5">100% Core Coverage</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20 shadow-sm sm:col-span-2 lg:col-span-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Syllabus Registered</p>
              <h3 className="text-2xl font-bold mt-0.5">Active</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card/45 p-2 rounded-2xl border">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2">Subject Directory</div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search subjects by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background border-none rounded-xl py-2 pl-10 pr-4 text-xs ring-1 ring-border focus:ring-primary focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Subjects Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Loading subjects directory...</p>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card/20 rounded-2xl border border-dashed border-border">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <BookMarked size={32} />
          </div>
          <h3 className="text-lg font-bold">No subjects found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            {searchTerm ? "No results match your search query." : "Click Create Subject above to add subjects to the curriculum."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="group hover:border-primary/50 transition-all duration-300 shadow-md flex flex-col h-full">
                <CardHeader className="pb-3 border-b flex flex-row items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <BookMarked size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">{s.name}</CardTitle>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-primary/10 text-primary">
                        {s.code}
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setDeleteTarget(s)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    {s.description || "No description provided for this core curriculum subject."}
                  </p>
                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-[10px] uppercase font-bold text-muted-foreground">
                    <span>Syllabus Verified</span>
                    <span className="flex items-center gap-1 text-emerald-500">
                      <Check size={12} /> Active
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AddSubjectModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={handleCreated}
      />
      <DeleteConfirmModal
        open={!!deleteTarget}
        subject={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
};

export default Subjects;
