import React, { useState, useEffect } from "react";
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  Target,
  X,
  Check,
  Loader2,
  Trash2,
  User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";
import { api } from "../lib/api";
import { toast } from "../lib/toast";
import { getUser } from "../lib/auth";

const user = getUser();
const isAdmin = user?.role === "Admin";
const isStudent = user?.role === "Student";

const mockExamData = [
  { subject: "Math", avg_score: 78, max_score: 98, status: "Published" },
  { subject: "Physics", avg_score: 65, max_score: 95, status: "Published" },
  { subject: "Chemistry", avg_score: 72, max_score: 92, status: "Processing" },
  { subject: "Biology", avg_score: 85, max_score: 100, status: "Draft" },
];

const performanceTrend = [
  { name: "Unit 1", score: 65 },
  { name: "Unit 2", score: 72 },
  { name: "Quarterly", score: 68 },
  { name: "Unit 3", score: 85 },
  { name: "Half Yearly", score: 82 },
];

const Exams = () => {
  const [examList, setExamList] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [subjectList, setSubjectList] = useState([]);
  
  // Marks list & search query
  const [marksList, setMarksList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("All Classes");

  // Import results modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [successDetails, setSuccessDetails] = useState(null);

  const load = async () => {
    const data = await api.getExams(mockExamData);
    setExamList(data);
    try {
      const subs = await api.getSubjects();
      setSubjectList(subs || []);
    } catch (err) {
      console.warn("Failed to load subjects:", err);
    }
    try {
      const marksData = await api.getMarks();
      setMarksList(marksData || []);
    } catch (err) {
      console.warn("Failed to load marks list:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDeleteMark = async (id) => {
    if (!window.confirm("Are you sure you want to delete this mark record?")) return;
    try {
      await api.deleteMark(id);
      toast.success("Mark record deleted successfully!");
      await load();
    } catch (err) {
      toast.error("Failed to delete mark: " + err.message);
    }
  };

  const mapExam = (e) => ({
    subject: e.subject,
    avg: e.avg ?? e.avg_score ?? 0,
    max: e.max ?? e.max_score ?? 100,
    status: e.status,
  });

  const handlePublish = async () => {
    try {
      await api.publishResults();
      await load();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      toast.error("Failed to publish results: " + err.message);
    }
  };

  const handleDownloadTemplate = () => {
    const subNames = subjectList.length > 0 
      ? subjectList.map(s => s.name)
      : ["Mathematics", "Physics", "Chemistry", "Biology", "English"];
      
    const headers = `student_id,${subNames.join(",")}\n`;
    const rows = [
      `STU001,${subNames.map(() => 85).join(",")}`,
      `STU002,${subNames.map(() => 90).join(",")}`,
      `STU003,${subNames.map(() => 78).join(",")}`
    ].join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "student_exam_marks_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV template generated with all registered subjects!");
  };

  const parseRows = (text) => {
    if (!text || !text.trim()) return [];
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    const headerLine = lines[0];
    let delimiter = ",";
    if (headerLine.includes("\t")) {
      delimiter = "\t";
    } else if (headerLine.includes(";")) {
      delimiter = ";";
    }

    const headers = headerLine.split(delimiter).map(h => h.trim());
    const lowerHeaders = headers.map(h => h.toLowerCase().replace(/['"_]/g, ""));

    const hasScoreColumn = lowerHeaders.some(h => h.includes("score") || h.includes("mark") || h.includes("result"));

    if (hasScoreColumn) {
      // Flat Format: has a score/mark column
      let studentIdx = lowerHeaders.findIndex(h => h.includes("student") || h === "id");
      let subjectIdx = lowerHeaders.findIndex(h => h.includes("subject") || h.includes("code") || h.includes("sub"));
      let scoreIdx = lowerHeaders.findIndex(h => h.includes("score") || h.includes("mark") || h.includes("result"));
      let maxScoreIdx = lowerHeaders.findIndex(h => h.includes("max") || h.includes("total"));
      let examTypeIdx = lowerHeaders.findIndex(h => h.includes("type") || h.includes("exam"));

      if (studentIdx === -1) studentIdx = 0;
      if (subjectIdx === -1) subjectIdx = 1;
      if (scoreIdx === -1) scoreIdx = 2;
      if (maxScoreIdx === -1) maxScoreIdx = 3;
      if (examTypeIdx === -1) examTypeIdx = 4;

      const parsed = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map(c => c.trim());
        if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

        const student_id = cols[studentIdx] || "";
        const subject_code = cols[subjectIdx] || "";
        const score = parseFloat(cols[scoreIdx]) || 0;
        const max_score = maxScoreIdx !== -1 && cols[maxScoreIdx] ? parseFloat(cols[maxScoreIdx]) : 100;
        const exam_type = examTypeIdx !== -1 && cols[examTypeIdx] ? cols[examTypeIdx] : "Final";

        if (student_id && subject_code) {
          parsed.push({ student_id, subject_code, score, max_score, exam_type });
        }
      }
      return parsed;
    } else {
      // Wide Format: Subject column headers (Excel Template style)
      let studentIdx = lowerHeaders.findIndex(h => h.includes("student") || h === "id");
      if (studentIdx === -1) studentIdx = 0;

      const parsed = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map(c => c.trim());
        if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

        const student_id = cols[studentIdx] || "";
        if (!student_id) continue;

        headers.forEach((subjectName, colIdx) => {
          if (colIdx === studentIdx) return;
          
          const rawValue = cols[colIdx];
          if (rawValue === undefined || rawValue === "") return;

          const score = parseFloat(rawValue);
          if (!isNaN(score)) {
            parsed.push({
              student_id,
              subject_code: subjectName,
              score,
              max_score: 100,
              exam_type: "Final",
            });
          }
        });
      }
      return parsed;
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt") && !file.name.endsWith(".tsv")) {
      toast.error("Please upload a CSV, TSV or plain text file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setImportText(text);
      toast.success(`Loaded file: ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    const parsedData = parseRows(importText);
    if (!parsedData.length) {
      toast.error("No valid data rows detected. Check headers or data format.");
      return;
    }

    setImporting(true);
    setImportErrors([]);
    setSuccessDetails(null);

    try {
      const res = await api.bulkImportMarks(parsedData);
      if (res.success) {
        toast.success(res.message || "Results successfully imported!");
        setSuccessDetails(res);
        setImportText("");
        await load();
      } else {
        if (res.errors && res.errors.length > 0) {
          setImportErrors(res.errors);
          toast.error("Some rows had validation errors.");
        } else {
          toast.error(res.message || "Failed to import marks.");
        }
      }
    } catch (err) {
      toast.error("Import failed: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  const parsedRows = parseRows(importText);

  const classesList = Array.from(
    new Set(marksList.map(m => m.student_grade).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exams & Results</h1>
          <p className="text-muted-foreground">Schedule examinations and manage academic results.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <>
              <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2 shadow-sm border-primary/20 hover:border-primary/40 hover:bg-secondary/40">
                <FileSpreadsheet size={16} className="text-primary animate-pulse" />
                <span>Template</span>
              </Button>
              <Button variant="outline" onClick={() => {
                setShowImportModal(true);
                setImportText("");
                setImportErrors([]);
                setSuccessDetails(null);
              }} className="gap-2 shadow-sm border-primary/20 hover:border-primary/40 hover:bg-secondary/40">
                <Plus size={16} />
                <span>Import Result</span>
              </Button>
              <Button className="gap-2" onClick={handlePublish}>
                <CheckCircle2 size={16} />
                <span>Publish Results</span>
              </Button>
            </>
          )}
          <Button variant="outline">Grade Scales</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Active Exams */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-lg">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Award size={18} className="text-primary animate-pulse" />
                  <span>{isStudent ? "My Examination Results" : "Student Marks & Results Database"}</span>
                </CardTitle>
                <CardDescription>
                  {isStudent ? "Your personal academic scores and subject grades." : "Database of imported academic scores and subject grades."}
                </CardDescription>
              </div>
              {!isStudent && (
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
                  {/* Class Filter Dropdown */}
                  <div className="flex items-center gap-1.5 bg-secondary/15 px-3 py-1.5 rounded-xl border border-border/50 max-w-[150px] w-full">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground shrink-0">Class:</span>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="bg-transparent border-none focus:ring-0 focus:outline-none text-xs w-full text-foreground cursor-pointer font-semibold py-0"
                    >
                      <option value="All Classes" className="bg-card text-foreground">All</option>
                      {classesList.map((cls, idx) => (
                        <option key={idx} value={cls} className="bg-card text-foreground">{cls}</option>
                      ))}
                    </select>
                  </div>

                  {/* Search Input */}
                  <div className="flex items-center gap-2 bg-secondary/15 px-3 py-1.5 rounded-xl border border-border/50 max-w-xs w-full">
                    <Search size={14} className="text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      placeholder="Search student name, ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none focus:outline-none text-xs w-full placeholder:text-muted-foreground/50 text-foreground"
                    />
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="max-h-[420px] overflow-y-auto pr-1">
                {marksList.length > 0 ? (
                  (() => {
                    const filtered = marksList.filter(m => {
                      if (isStudent) return true;
                      if (selectedClass !== "All Classes" && m.student_grade !== selectedClass) {
                        return false;
                      }
                      const q = searchQuery.toLowerCase();
                      return (
                        (m.student_name || "").toLowerCase().includes(q) ||
                        (m.student_id || "").toLowerCase().includes(q) ||
                        (m.subject_name || "").toLowerCase().includes(q) ||
                        (m.subject_code || "").toLowerCase().includes(q)
                      );
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-8 text-xs text-muted-foreground font-semibold">
                          No marks match your search query.
                        </div>
                      );
                    }

                    const studentGroups = {};
                    filtered.forEach(m => {
                      const sId = m.student_id || "unknown";
                      if (!studentGroups[sId]) {
                        studentGroups[sId] = {
                          student_name: m.student_name || "Unknown Student",
                          student_id: sId,
                          student_image_url: m.student_image_url || null,
                          marks: {}
                        };
                      }
                      const subKey = m.subject_name || m.subject_code || "Unknown";
                      studentGroups[sId].marks[subKey] = m;
                    });

                    const studentsArray = Object.values(studentGroups);

                    const subjectKeys = Array.from(
                      new Set([
                        ...subjectList.map(s => s.name || s.subject_code),
                        ...filtered.map(m => m.subject_name || m.subject_code)
                      ])
                    ).filter(Boolean).sort((a, b) => a.localeCompare(b));

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border/60 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                              <th className="pb-3 text-left">Student</th>
                              <th className="pb-3 text-left">Student ID</th>
                              {subjectKeys.map((sub, idx) => (
                                <th key={idx} className="pb-3 text-center min-w-[110px]">{sub}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {studentsArray.map((student, i) => (
                              <tr key={student.student_id || i} className="hover:bg-secondary/15 transition-all">
                                <td className="py-3.5">
                                  <div className="flex items-center gap-3">
                                    {student.student_image_url ? (
                                      <img 
                                        src={student.student_image_url} 
                                        alt={student.student_name} 
                                        className="w-8 h-8 rounded-full object-cover border"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border text-muted-foreground">
                                        <User size={14} />
                                      </div>
                                    )}
                                    <span className="font-bold text-sm text-foreground">{student.student_name}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 text-xs font-mono text-muted-foreground">{student.student_id}</td>
                                {subjectKeys.map((sub, idx) => {
                                  const m = student.marks[sub];
                                  if (!m) {
                                    return (
                                      <td key={idx} className="py-3.5 text-center text-xs text-muted-foreground/30 font-semibold">—</td>
                                    );
                                  }

                                  return (
                                    <td key={idx} className="py-3.5 px-2">
                                      <div className="flex flex-col items-center justify-center gap-0.5 group/cell">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-mono font-bold text-sm text-foreground">{m.score}</span>
                                          {!isStudent && (
                                            <button
                                              onClick={() => handleDeleteMark(m.id)}
                                              className="opacity-0 group-hover/cell:opacity-100 p-0.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-opacity"
                                              title={`Delete ${sub} mark for ${student.student_name}`}
                                            >
                                              <Trash2 size={11} />
                                            </button>
                                          )}
                                        </div>
                                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{m.exam_type}</span>
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center bg-secondary/5 rounded-xl border border-dashed border-border/44">
                    <FileSpreadsheet size={32} className="text-muted-foreground/30 mb-2 animate-pulse" />
                    <p className="text-xs font-bold text-muted-foreground">No imported marks found</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">Click the "Import Result" button at the top to upload scores.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Global Performance Trend</CardTitle>
              <CardDescription>Academic progress across all departments.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Import Results Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-background border border-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/10">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Import Student Results</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Bulk register subject marks via Excel or CSV</p>
                </div>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-1.5 rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                <div className="p-3.5 rounded-xl border border-primary/10 bg-primary/5 text-xs space-y-1 text-muted-foreground">
                  <span className="font-bold text-foreground">💡 How to Import:</span>
                  <p>1. Copy columns directly from Excel and paste below OR upload a <b>.csv</b> file.</p>
                  <p>2. Column headers should be <code className="text-primary font-bold">student_id</code> followed by individual <b>Subject Names</b> (e.g., Mathematics, English, Biology) or codes.</p>
                  <p className="mt-1 font-semibold text-foreground">Example row values:</p>
                  <code className="block bg-secondary/30 p-2 rounded mt-1 font-mono text-[11px] text-foreground">
                    student_id,Mathematics,Physics,Chemistry,Biology<br/>
                    STU001,85,92,78,88<br/>
                    STU002,90,85,82,90
                  </code>
                </div>

                {/* Upload File Box */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CSV File</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept=".csv,.txt,.tsv"
                      onChange={handleFileUpload}
                      id="result-csv-file"
                      className="hidden"
                    />
                    <label
                      htmlFor="result-csv-file"
                      className="flex-1 cursor-pointer flex items-center justify-center gap-2 border border-border border-dashed hover:border-primary/50 hover:bg-secondary/30 rounded-xl py-3 px-4 text-sm font-medium transition-all duration-200"
                    >
                      <FileSpreadsheet size={16} className="text-primary" />
                      Upload CSV/TSV File
                    </label>
                    <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="text-xs font-medium">
                      Download Template
                    </Button>
                  </div>
                </div>

                {/* Textarea Paste */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Or Paste Excel/CSV Data Here</label>
                  <textarea
                    rows={6}
                    placeholder="Paste cells here (tab or comma separated)..."
                    value={importText}
                    onChange={(e) => {
                      setImportText(e.target.value);
                      setSuccessDetails(null);
                      setImportErrors([]);
                    }}
                    className="w-full font-mono text-xs p-3.5 rounded-xl border border-border bg-transparent focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none placeholder:text-muted-foreground/50 resize-y"
                  />
                </div>

                {/* Live Validation Counter */}
                {parsedRows.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-emerald-500 font-semibold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                    <Check size={14} />
                    <span>Parsed {parsedRows.length} valid student score row(s). Ready to import.</span>
                  </div>
                )}

                {/* Backend Errors Display */}
                {importErrors.length > 0 && (
                  <div className="space-y-2 max-h-[150px] overflow-y-auto border border-red-500/20 bg-red-500/5 rounded-xl p-3">
                    <div className="flex items-center gap-1 text-xs text-red-500 font-bold">
                      <AlertCircle size={14} />
                      <span>Validation Errors found in uploaded rows:</span>
                    </div>
                    <ul className="list-disc pl-5 text-[11px] text-red-400 space-y-1 font-mono">
                      {importErrors.map((err, i) => (
                        <li key={i}>Row {err.row}: {err.error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Backend Success Display */}
                {successDetails && (
                  <div className="space-y-2 border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-3.5 text-xs text-emerald-500">
                    <div className="flex items-center gap-1 font-bold text-emerald-400">
                      <CheckCircle2 size={14} />
                      <span>{successDetails.message}</span>
                    </div>
                    <p className="opacity-90">
                      Registered: {successDetails.created_count} new mark(s) · Updated: {successDetails.updated_count} mark(s) · Failures: {successDetails.error_count}
                    </p>
                    {successDetails.errors && successDetails.errors.length > 0 && (
                      <ul className="list-disc pl-5 mt-1 text-[11px] text-orange-400 font-mono space-y-0.5">
                        {successDetails.errors.map((e, idx) => (
                          <li key={idx}>Row {e.row}: {e.error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-border flex items-center justify-end gap-3 bg-secondary/5">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportText("");
                    setImportErrors([]);
                    setSuccessDetails(null);
                  }}
                  disabled={importing}
                >
                  Cancel
                </Button>
                <Button
                  className="gap-2"
                  onClick={handleImportSubmit}
                  disabled={importing || parsedRows.length === 0}
                >
                  {importing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Import {parsedRows.length || ""} Rows
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Popup Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 right-10 z-50 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 className="font-bold">Results Published!</h4>
              <p className="text-xs text-white/80">Students and parents have been notified.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Exams;
