import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Activity, Award, BookOpen, CreditCard, Bell, ArrowRight, ChevronRight, Calendar, BookMarked, User, Camera, X, Check, Loader2, Users2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "../../lib/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import StatsGrid from "../../components/dashboard/StatsGrid";
import { api } from "../../lib/api";
import { getUser } from "../../lib/auth";
import { cn } from "../../lib/utils";

const mockData = {
  stats: [
    { label: "Attendance", value: "96%", change: "+2%", trend: "up", color: "emerald" },
    { label: "GPA", value: "3.8", change: "Current", trend: "up", color: "blue" },
    { label: "Class", value: "10-A", change: "Active", trend: "up", color: "purple" },
    { label: "Fee Status", value: "Paid", change: "Clear", trend: "up", color: "orange" },
  ],
  schedule: [
    { time: "09:00", subject: "Mathematics", room: "201" },
    { time: "11:00", subject: "Physics", room: "Lab 1" },
  ],
};

const StudentDashboard = () => {
  const user = getUser();
  const [data, setData] = useState(mockData);

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

  const load = async () => {
    try {
      const res = await api.getStudentDashboard(user?.email, mockData);
      if (res?.stats) {
        setData({
          ...mockData,
          ...res,
          stats: res.stats,
          schedule: res.schedule ?? mockData.schedule,
          remarks: res.remarks ?? [],
          exams: res.exams ?? [],
          notifications: res.notifications ?? [],
          bookLoans: res.bookLoans ?? [],
          my_marks: res.my_marks ?? [],
          is_committee: res.is_committee ?? false,
        });
      }
    } catch (err) {
      console.warn("Failed to load student dashboard:", err);
      setData(mockData);
    }
  };

  useEffect(() => {
    load();
  }, [user?.email]);

  const handleSavePhoto = async () => {
    const finalUrl = previewUrl || newImageUrl;
    if (!finalUrl) {
      toast.error("Please select a file or enter an image URL.");
      return;
    }
    setUploadingPhoto(true);
    try {
      await api.updateStudentPhoto(data.profile?.student_id, finalUrl);
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

  const profile = data.profile || {};
  const statIcons = {
    Attendance: Activity,
    GPA: Award,
    Class: BookOpen,
    "Fee Status": CreditCard,
    default: Activity,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-lg">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Interactive Avatar */}
          <div 
            onClick={() => setPhotoModalOpen(true)}
            className="group relative cursor-pointer overflow-hidden rounded-full w-20 h-20 border-2 border-primary/20 bg-secondary hover:border-primary/60 transition-all duration-300 shadow-md"
          >
            {profile.image_url ? (
              <img 
                src={profile.image_url} 
                alt={profile.name || "Student"}
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
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Student Dashboard</h1>
            <p className="text-muted-foreground mt-1 font-medium">
              Hello, <span className="text-foreground font-semibold">{user?.name || profile.name || "Student"}</span> · Grade {profile.grade || "10-A"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Student ID: {profile.student_id || "—"} · Email: {profile.email || "—"}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0 justify-center sm:justify-start">
          <Link to="/library"><Button variant="outline" className="gap-2 shadow-sm"><BookMarked size={16} />My Books</Button></Link>
          <Link to="/exams"><Button className="gap-2 shadow-sm"><Award size={16} />View Results</Button></Link>
        </div>
      </div>

      {/* Student Council / Committee Leader Panel */}
      {data.is_committee && (
        <Card className="border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 backdrop-blur-md shadow-lg overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-indigo-500/10 blur-xl group-hover:scale-125 transition-transform duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between border-b border-indigo-500/10 bg-indigo-500/5 py-4 px-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-widest bg-indigo-600 text-white px-2.5 py-0.5 rounded-full border border-indigo-400/20">Council Member</span>
                <span className="text-xs text-indigo-400 font-semibold">Special Leadership Authorization</span>
              </div>
              <CardTitle className="flex items-center gap-2 text-lg text-indigo-300 mt-1.5 font-bold">
                <Users2 size={20} className="text-indigo-400 animate-pulse" />
                <span>Student Council Control Portal</span>
              </CardTitle>
            </div>
            <Link to="/council">
              <Button size="sm" variant="glass" className="text-xs border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 shadow-inner">
                Council Page <ArrowRight size={12} className="ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between cursor-pointer group">
              <div>
                <h5 className="font-bold text-sm text-indigo-200 group-hover:text-indigo-300 transition-colors">Manage Events</h5>
                <p className="text-[10px] text-muted-foreground mt-1">Schedule cultural nights, sports events, and direct council campaigns.</p>
              </div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-4 flex items-center gap-1 group-hover:text-indigo-300 transition-colors">
                Go to Events <ArrowRight size={10} />
              </span>
            </div>
            
            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between cursor-pointer group">
              <div>
                <h5 className="font-bold text-sm text-indigo-200 group-hover:text-indigo-300 transition-colors">Budget Proposal</h5>
                <p className="text-[10px] text-muted-foreground mt-1">Draft and submit council budgets directly to the Office of the Admin.</p>
              </div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-4 flex items-center gap-1 group-hover:text-indigo-300 transition-colors">
                Request Budget <ArrowRight size={10} />
              </span>
            </div>

            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between cursor-pointer group">
              <div>
                <h5 className="font-bold text-sm text-indigo-200 group-hover:text-indigo-300 transition-colors">Council Directives</h5>
                <p className="text-[10px] text-muted-foreground mt-1">Publish announcements and guidelines directly to student feeds.</p>
              </div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-4 flex items-center gap-1 group-hover:text-indigo-300 transition-colors">
                Send Directive <ArrowRight size={10} />
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <StatsGrid stats={data.stats || mockData.stats} icons={statIcons} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar size={18} />Today&apos;s Schedule</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(data.schedule || []).map((s, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30">
                <span className="text-sm font-mono font-bold text-primary">{s.time}</span>
                <div><p className="font-semibold text-sm">{s.subject}</p><p className="text-xs text-muted-foreground">Room {s.room}</p></div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Remarks</CardTitle><CardDescription>Feedback from teachers</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {(data.remarks || []).slice(0, 3).map((r, i) => (
              <div key={i} className="p-3 rounded-xl border border-border/50">
                <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                  r.remark_type === "Positive" ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500")}>{r.remark_type || r.type}</span>
                <p className="text-sm mt-2 text-muted-foreground">
                  {r.content ? (r.content.length > 80 ? `${r.content.slice(0, 80)}...` : r.content) : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{r.teacher_name || r.teacher} · {r.date}</p>
              </div>
            ))}
            <Link to="/remarks"><Button variant="outline" className="w-full gap-2">All Remarks <ArrowRight size={14} /></Button></Link>
          </CardContent>
        </Card>
      </div>

      {(data.bookLoans || []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookMarked size={18} />Borrowed Books</CardTitle>
            <CardDescription>Books you have checked out from the library</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.bookLoans.map((loan) => (
              <div key={loan.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-secondary/30">
                <div>
                  <p className="font-semibold text-sm">{loan.book_title || loan.book}</p>
                  <p className="text-xs text-muted-foreground">{loan.book_author}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span>Borrowed: {loan.borrowed_date}</span>
                  <span className="mx-2">·</span>
                  <span className="font-medium text-foreground">Due: {loan.due_date}</span>
                  <span className={cn("ml-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                    loan.status === "Overdue" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500")}>
                    {loan.status}
                  </span>
                </div>
              </div>
            ))}
            <Link to="/library"><Button variant="outline" className="w-full gap-2">All My Books <ArrowRight size={14} /></Button></Link>
          </CardContent>
        </Card>
      )}

      {/* Dynamic Academic Performance (Marks) Section */}
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-lg overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/30 bg-secondary/5 py-4 px-6">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award size={20} className="text-primary animate-pulse" />
              <span>My Academic Performance</span>
            </CardTitle>
            <CardDescription className="text-xs">Published subject grades and examination marks</CardDescription>
          </div>
          <Link to="/exams">
            <Button size="sm" variant="ghost" className="text-primary gap-1 hover:bg-secondary/40 text-xs px-3">
              View Exams Page <ChevronRight size={14} />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-6">
          {data.my_marks && data.my_marks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/60 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                    <th className="pb-3 text-left">Subject</th>
                    <th className="pb-3 text-left">Exam Type</th>
                    <th className="pb-3 text-center">Score</th>
                    <th className="pb-3 text-center">Max Marks</th>
                    <th className="pb-3 text-center">Percentage</th>
                    <th className="pb-3 text-right">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {data.my_marks.map((m, i) => {
                    const percentage = (m.score / m.max_score) * 100;
                    const gradeColors = {
                      "A+": "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20",
                      "A": "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20",
                      "B": "bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20",
                      "C": "bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-500/20",
                      "D": "bg-yellow-500/10 text-yellow-500 dark:text-yellow-400 border-yellow-500/20",
                      "F": "bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20",
                    };
                    const badgeColor = gradeColors[m.grade] || "bg-secondary text-muted-foreground border-border";
                    
                    return (
                      <tr key={i} className="hover:bg-secondary/15 transition-all">
                        <td className="py-3.5 font-bold text-sm text-foreground">{m.subject_name || m.subject_code}</td>
                        <td className="py-3.5 text-xs text-muted-foreground uppercase font-bold tracking-wider">{m.exam_type}</td>
                        <td className="py-3.5 text-sm font-mono text-center font-bold text-foreground">{m.score}</td>
                        <td className="py-3.5 text-sm font-mono text-center text-muted-foreground">{m.max_score}</td>
                        <td className="py-3.5">
                          <div className="flex items-center justify-center gap-2.5">
                            <div className="w-24 h-1.5 bg-secondary/50 rounded-full overflow-hidden shrink-0 hidden sm:block">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  percentage >= 90 ? "bg-emerald-500" :
                                  percentage >= 80 ? "bg-blue-500" :
                                  percentage >= 70 ? "bg-purple-500" :
                                  percentage >= 60 ? "bg-orange-500" : "bg-red-500"
                                )}
                                style={{ width: `${Math.min(100, percentage)}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-xs">{percentage.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-right">
                          <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border", badgeColor)}>
                            {m.grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center bg-secondary/10 rounded-xl border border-dashed border-border/50">
              <Award size={36} className="text-muted-foreground/30 mb-2 animate-bounce" />
              <p className="text-sm font-semibold text-muted-foreground">No published results found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Your exam marks will appear here once published by the Admin.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell size={18} />Announcements</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(data.notifications || []).map((n, i) => (
              <div key={i} className="p-3 rounded-xl border border-border/50">
                <p className="font-semibold text-sm">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.content?.slice(0, 60)}...</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

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
                    {(previewUrl || newImageUrl || profile.image_url) ? (
                      <img
                        src={previewUrl || newImageUrl || profile.image_url}
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

export default StudentDashboard;
