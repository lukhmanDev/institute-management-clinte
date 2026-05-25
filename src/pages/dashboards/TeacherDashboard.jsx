import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, MessageSquare, FileSpreadsheet, ClipboardList, ArrowRight, X, Calendar, Check, AlertCircle, Loader2, User, Camera, Mail, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import StatsGrid from "../../components/dashboard/StatsGrid";
import { api } from "../../lib/api";
import { getUser } from "../../lib/auth";
import { cn } from "../../lib/utils";
import { toast } from "../../lib/toast";

const mockData = {
  stats: [
    { label: "My Classes", value: "3", change: "Today", trend: "up", color: "blue" },
    { label: "Students", value: "95", change: "Total", trend: "up", color: "purple" },
    { label: "Remarks Given", value: "12", change: "This term", trend: "up", color: "emerald" },
    { label: "Status", value: "In Class", change: "Physics", trend: "up", color: "orange" },
  ],
  pendingTasks: [
    { id: 1, task: "Publish Chemistry results", due: "Today", priority: "high" },
    { id: 2, task: "Submit attendance for 10-A", due: "Tomorrow", priority: "medium" },
  ],
};

const TeacherDashboard = () => {
  const user = getUser();
  const [data, setData] = useState(mockData);
  const [activeClass, setActiveClass] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loadingModal, setLoadingModal] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        setSelectedFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePhoto = async () => {
    const finalUrl = previewUrl || newImageUrl;
    if (!finalUrl) {
      toast.error("Please select a file or enter an image URL.");
      return;
    }
    setUploadingPhoto(true);
    try {
      await api.updateTeacherPhoto(data.profile?.teacher_id, finalUrl);
      toast.success("Profile photo updated successfully!");
      setPhotoModalOpen(false);
      setSelectedFile(null);
      setPreviewUrl("");
      setNewImageUrl("");
      load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile photo: " + err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const load = async () => {
    try {
      const res = await api.getTeacherDashboard(user?.email, mockData);
      if (res?.stats) {
        setData({
          ...mockData,
          ...res,
          stats: res.stats,
          classes: res.classes ?? [],
          exams: res.exams ?? [],
          my_students: res.my_students ?? [],
          pendingTasks: res.pendingTasks ?? mockData.pendingTasks,
        });
      }
    } catch {
      setData(mockData);
    }
  };

  useEffect(() => {
    load();
  }, [user?.email]);

  const loadAttendanceData = async (cls, date) => {
    setLoadingModal(true);
    try {
      const allStudents = await api.getStudents([]);
      const filtered = allStudents.filter(
        (s) =>
          s.classroom === (cls.class_id || cls.id) ||
          (s.grade || "").toLowerCase() === (cls.name || "").toLowerCase() ||
          (s.grade || "").toLowerCase() === (cls.grade || "").toLowerCase()
      );
      setStudents(filtered);

      const marked = await api.getAttendance(cls.class_id, date, []);
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
      setLoadingModal(false);
    }
  };

  const handleOpenAttendance = (cls) => {
    setActiveClass(cls);
    const today = new Date().toISOString().split("T")[0];
    setAttendanceDate(today);
    loadAttendanceData(cls, today);
  };

  const handleDateChange = (newDate) => {
    setAttendanceDate(newDate);
    if (activeClass) {
      loadAttendanceData(activeClass, newDate);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    if (!activeClass) return;
    setSavingAttendance(true);
    try {
      const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
        student_id: studentId,
        status: status
      }));

      await api.bulkSaveAttendance({
        classroom: activeClass.class_id,
        date: attendanceDate,
        records: records
      });

      toast.success(`Attendance saved for ${activeClass.name || `Grade ${activeClass.grade}`} on ${attendanceDate}!`);
      setActiveClass(null);
      load();
    } catch (err) {
      console.error("Failed to save attendance:", err);
      toast.error("Failed to save attendance: " + err.message);
    } finally {
      setSavingAttendance(false);
    }
  };

  const statIcons = {
    "My Classes": BookOpen,
    Students: Users,
    "Remarks Given": MessageSquare,
    Status: FileSpreadsheet,
    default: BookOpen,
  };

  const teacherProfile = data.profile || {};
  const presentCount = Object.values(attendanceMap).filter(v => v === "Present").length;
  const absentCount = Object.values(attendanceMap).filter(v => v === "Absent").length;
  const lateCount = Object.values(attendanceMap).filter(v => v === "Late").length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-lg">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Interactive Avatar */}
          <div 
            onClick={() => setPhotoModalOpen(true)}
            className="group relative cursor-pointer overflow-hidden rounded-full w-20 h-20 border-2 border-primary/20 bg-secondary hover:border-primary/60 transition-all duration-300 shadow-md"
          >
            {teacherProfile.image_url ? (
              <img 
                src={teacherProfile.image_url} 
                alt={teacherProfile.name || "Teacher"}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/80">
                <User size={36} />
              </div>
            )}
            {/* Hover overlay with camera icon */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-300">
              <Camera size={18} className="animate-pulse" />
              <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Edit</span>
            </div>
          </div>

          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Teacher Dashboard</h1>
            <p className="text-muted-foreground mt-1 font-medium">
              Welcome back, <span className="text-foreground font-semibold">{user?.name || teacherProfile.name || "Teacher"}</span> · {teacherProfile.subject || "Faculty"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Teacher ID: {teacherProfile.teacher_id || "—"} · Email: {teacherProfile.email || "—"}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0 justify-center sm:justify-start">
          <Link to="/remarks"><Button className="gap-2 shadow-sm"><MessageSquare size={16} />Add Remark</Button></Link>
        </div>
      </div>

      <StatsGrid stats={data.stats || mockData.stats} icons={statIcons} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>My Classes Today</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(data.classes || []).map((c, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-secondary/30">
                <div>
                  <p className="font-semibold">{c.name || `Grade ${c.grade}`}</p>
                  <p className="text-xs text-muted-foreground">{c.students || c.student_count} students · {c.attendance} attendance</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">{c.status || c.session_status}</span>
                  <Button size="sm" variant="outline" className="text-xs py-1 px-3 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors" onClick={() => handleOpenAttendance(c)}>
                    Attendance
                  </Button>
                </div>
              </div>
            ))}
            <Link to="/classes"><Button variant="outline" className="w-full gap-2">Manage Classes <ArrowRight size={14} /></Button></Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList size={18} />Pending Tasks</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(data.pendingTasks || []).map((t) => (
              <div key={t.id} className="flex justify-between items-start p-3 rounded-xl border border-border/50">
                <p className="text-sm font-medium">{t.task}</p>
                <div className="text-right">
                  <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                    t.priority === "high" ? "bg-red-500/10 text-red-500" : t.priority === "medium" ? "bg-orange-500/10 text-orange-500" : "bg-blue-500/10 text-blue-500")}>{t.priority}</span>
                  <p className="text-xs text-muted-foreground mt-1">{t.due}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Exam Status</CardTitle><CardDescription>Subjects you may oversee</CardDescription></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(data.exams || []).map((e, i) => (
              <div key={i} className="p-4 rounded-xl bg-secondary/20 flex justify-between">
                <span className="font-medium">{e.subject}</span>
                <span className="text-sm text-muted-foreground">{e.status} · {e.avg_score || e.avg}% avg</span>
              </div>
            ))}
          </div>
          <Link to="/exams"><Button className="mt-4 gap-2">Open Exams <ArrowRight size={14} /></Button></Link>
        </CardContent>
      </Card>

      {/* My Classroom Students Roster */}
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-lg overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/30 bg-secondary/5 py-4 px-6">
          <div>
            <CardTitle>My Classroom Students</CardTitle>
            <CardDescription className="text-xs">Roster and key metrics for students enrolled in your assigned classrooms.</CardDescription>
          </div>
          <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
            {(data.my_students || []).length} Students
          </span>
        </CardHeader>
        <CardContent className="p-6">
          {(data.my_students || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/60 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                    <th className="pb-3 text-left">Student</th>
                    <th className="pb-3 text-left">Student ID</th>
                    <th className="pb-3 text-left">Class & Roll No</th>
                    <th className="pb-3 text-center">GPA</th>
                    <th className="pb-3 text-center">Attendance</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {(data.my_students || []).map((student, i) => {
                    const gpa = student.gpa ?? 4.0;
                    const attendance = student.attendance_percentage ?? 95.0;
                    return (
                      <tr key={student.student_id || i} className="hover:bg-secondary/15 transition-all">
                        <td className="py-3.5">
                          <div className="flex items-center gap-3">
                            {student.image_url ? (
                              <img 
                                src={student.image_url} 
                                alt={student.name} 
                                className="w-8 h-8 rounded-full object-cover border"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border text-muted-foreground">
                                <User size={14} />
                              </div>
                            )}
                            <span className="font-bold text-sm text-foreground">{student.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-xs font-mono text-muted-foreground">{student.student_id}</td>
                        <td className="py-3.5 text-xs text-muted-foreground font-medium">
                          Grade {student.grade} · Roll #{student.roll_no || "—"}
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border",
                            gpa >= 3.5 ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20" :
                            gpa >= 3.0 ? "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20" :
                            "bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-500/20"
                          )}>
                            {gpa.toFixed(2)} GPA
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={cn(
                            "text-xs font-bold",
                            attendance >= 90 ? "text-emerald-500" :
                            attendance >= 75 ? "text-amber-500" : "text-red-500"
                          )}>
                            {attendance}%
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {student.email && (
                              <a href={`mailto:${student.email}`}>
                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" title={`Email ${student.name}`}>
                                  <Mail size={13} />
                                </Button>
                              </a>
                            )}
                            {student.phone && (
                              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => toast.info(`Call student at ${student.phone}`)} title={`Call ${student.name}`}>
                                <Phone size={13} />
                              </Button>
                            )}
                            <Link to="/remarks">
                              <Button size="sm" variant="outline" className="text-[10px] font-bold uppercase h-7 px-2.5">
                                Remark
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center bg-secondary/5 rounded-xl border border-dashed border-border/40">
              <Users size={32} className="text-muted-foreground/30 mb-2 animate-pulse" />
              <p className="text-xs font-bold text-muted-foreground">No enrolled students found</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">There are no students listed in your assigned classroom roster.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modern Attendance Modal */}
      <AnimatePresence>
        {activeClass && (
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
                  <h2 className="text-xl font-bold tracking-tight">{activeClass.name || `Grade ${activeClass.grade}`}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Mark daily student presence</p>
                </div>
                <button 
                  onClick={() => setActiveClass(null)}
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
                  <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">{presentCount} Present</span>
                  <span className="px-2 py-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400">{absentCount} Absent</span>
                  <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">{lateCount} Late</span>
                </div>
              </div>

              {/* Students List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 min-h-[300px]">
                {loadingModal ? (
                  <div className="h-full flex flex-col items-center justify-center py-12 space-y-3">
                    <Loader2 size={32} className="animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading student roster...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle size={36} className="text-muted-foreground mb-2" />
                    <p className="font-semibold">No Students Registered</p>
                    <p className="text-xs text-muted-foreground mt-0.5">There are no students listed in {activeClass.grade}.</p>
                  </div>
                ) : (
                  students.map((student) => {
                    const status = attendanceMap[student.student_id] || "Present";
                    return (
                      <div key={student.student_id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-secondary/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-muted-foreground w-6 text-center bg-secondary/50 py-0.5 rounded">
                            {student.roll_no || "-"}
                          </span>
                          {student.image_url ? (
                            <img 
                              src={student.image_url} 
                              alt={student.name}
                              className="w-9 h-9 rounded-full object-cover border border-border/80"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-secondary/80 flex items-center justify-center border border-border/80 text-muted-foreground">
                              <User size={16} />
                            </div>
                          )}
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
                  onClick={() => setActiveClass(null)}
                  disabled={savingAttendance}
                >
                  Cancel
                </Button>
                <Button 
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/95"
                  onClick={handleSaveAttendance}
                  disabled={savingAttendance || loadingModal || students.length === 0}
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

      {/* Update Profile Photo Modal */}
      <AnimatePresence>
        {photoModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-background border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/10">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Update Profile Photo</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Customize your dashboard avatar</p>
                </div>
                <button
                  onClick={() => {
                    setPhotoModalOpen(false);
                    setPreviewUrl("");
                    setSelectedFile(null);
                    setNewImageUrl("");
                  }}
                  className="p-1.5 rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Preview Container */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative group overflow-hidden rounded-full w-24 h-24 border-2 border-dashed border-primary/30 bg-secondary/30 flex items-center justify-center shadow-inner">
                    {(previewUrl || newImageUrl || teacherProfile.image_url) ? (
                      <img
                        src={previewUrl || newImageUrl || teacherProfile.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={40} className="text-muted-foreground/60" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground mt-2">Avatar Preview</span>
                </div>

                <div className="space-y-4">
                  {/* File Upload Option */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Upload from Computer</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        id="photo-upload-input"
                        className="hidden"
                      />
                      <label
                        htmlFor="photo-upload-input"
                        className="flex-1 cursor-pointer flex items-center justify-center gap-2 border border-border border-dashed hover:border-primary/50 hover:bg-secondary/30 rounded-xl py-3 px-4 text-sm font-medium transition-all duration-200"
                      >
                        <Camera size={16} className="text-muted-foreground" />
                        {selectedFile ? selectedFile.name : "Select Image File"}
                      </label>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground my-3">
                    <div className="flex-1 h-[1px] bg-border"></div>
                    <span>OR</span>
                    <div className="flex-1 h-[1px] bg-border"></div>
                  </div>

                  {/* URL Input Option */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Image URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/photo.jpg"
                      value={newImageUrl}
                      onChange={(e) => {
                        setNewImageUrl(e.target.value);
                        setPreviewUrl("");
                      }}
                      className="w-full text-sm py-2.5 px-3.5 rounded-xl border border-border bg-transparent focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-border flex items-center justify-end gap-3 bg-secondary/5">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPhotoModalOpen(false);
                    setPreviewUrl("");
                    setSelectedFile(null);
                    setNewImageUrl("");
                  }}
                  disabled={uploadingPhoto}
                >
                  Cancel
                </Button>
                <Button
                  className="gap-2"
                  onClick={handleSavePhoto}
                  disabled={uploadingPhoto || (!previewUrl && !newImageUrl)}
                >
                  {uploadingPhoto ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Save Avatar
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TeacherDashboard;
