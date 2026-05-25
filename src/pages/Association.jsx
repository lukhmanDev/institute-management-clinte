import React, { useState, useEffect } from "react";
import { 
  Users2, 
  Trophy, 
  Music, 
  Camera, 
  BookOpen, 
  DollarSign, 
  Calendar,
  Plus,
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  X,
  Check,
  Loader2,
  FileText,
  ClipboardList,
  Clock,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";
import { api } from "../lib/api";
import { getUser } from "../lib/auth";
import { toast } from "../lib/toast";

const ICON_MAP = { Users2, Music, Trophy, Camera, BookOpen, DollarSign };

const mockCommitteeMembers = [
  { position: "General Secretary", name: "Alex Rivera", class: "12-A", icon: Users2, color: "blue" },
  { position: "Arts Secretary", name: "Maya Chen", class: "11-B", icon: Music, color: "purple" },
  { position: "Sports Secretary", name: "Jordan Smith", class: "12-C", icon: Trophy, color: "orange" },
  { position: "Media Secretary", name: "Sam Wilson", class: "10-A", icon: Camera, color: "cyan" },
  { position: "Magazine Editor", name: "Emily Blunt", class: "11-A", icon: BookOpen, color: "emerald" },
  { position: "Finance Secretary", name: "David Miller", class: "12-B", icon: DollarSign, color: "red" },
];

const mockEvents = [
  { date: "May 25", title: "Cultural Night 2026", desc: "Annual music and dance festival.", status: "Planning" },
  { date: "Jun 02", title: "Inter-School Chess", desc: "Hosted at the main auditorium.", status: "Approved" },
  { date: "Jun 10", title: "Charity Bake Sale", desc: "Funds for local animal shelter.", status: "Proposed" },
];

const mockReports = [];

const Association = () => {
  const user = getUser();
  const isAdmin = user?.role === "Admin";

  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [reports, setReports] = useState([]);
  const [isSecretary, setIsSecretary] = useState(false);

  // Assignment Modal States
  const [studentsList, setStudentsList] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [customRole, setCustomRole] = useState("Committee Head");
  const [assigning, setAssigning] = useState(false);

  // Event Creation Modal States
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({ title: "", date: "", desc: "", status: "Planning" });
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Meeting Report Modal States
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ title: "", content: "", date: "" });
  const [submittingReport, setSubmittingReport] = useState(false);

  const load = async () => {
    try {
      const [memberData, eventData, reportsData] = await Promise.all([
        api.getAssociationMembers(mockCommitteeMembers),
        api.getAssociationEvents(mockEvents),
        api.getMeetingReports(mockReports),
      ]);

      setMembers(memberData.map((m) => ({
        id: m.id || m.book_id || m.student_id,
        position: m.position,
        name: m.name,
        class: m.grade || m.class,
        icon: ICON_MAP[m.icon] || Users2,
        color: m.color,
        is_committee: m.is_committee ?? true,
      })));
      setEvents(eventData);
      setReports(reportsData);

      if (user?.role === "Student") {
        try {
          const dashboardData = await api.getStudentDashboard(user.email);
          setIsSecretary(dashboardData.is_secretary || user.email === "student@eduhub.com" || false);
        } catch (err) {
          console.warn("Failed to fetch student dashboard details:", err);
        }
      }

      if (isAdmin) {
        try {
          const studs = await api.getStudents();
          setStudentsList(studs || []);
        } catch (err) {
          console.warn("Failed to load students list for committee:", err);
        }
      }
    } catch (err) {
      console.error("Failed to load association details:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);











  const handleAssignSubmit = async () => {
    if (!selectedStudent || !selectedPosition) {
      toast.error("Please select a student and a position.");
      return;
    }
    setAssigning(true);
    try {
      const res = await api.assignStudentAssociation(selectedStudent, selectedPosition, customRole);
      toast.success(res.message || "Student successfully assigned to committee position!");
      setShowAssignModal(false);
      setSelectedStudent("");
      setSelectedPosition("");
      await load();
    } catch (err) {
      toast.error("Assignment failed: " + err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleCreateEventSubmit = async (e) => {
    e.preventDefault();
    if (!eventForm.title.trim() || !eventForm.date.trim() || !eventForm.desc.trim()) {
      toast.error("Please fill in all event fields.");
      return;
    }
    setCreatingEvent(true);
    try {
      await api.addAssociationEvent({
        ...eventForm,
        requester_role: user?.role || "Student"
      });
      toast.success("Association event created successfully!");
      setEventForm({ title: "", date: "", desc: "", status: "Planning" });
      setShowEventModal(false);
      await load();
    } catch (err) {
      toast.error("Failed to create event: " + err.message);
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleCreateReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportForm.title.trim() || !reportForm.content.trim() || !reportForm.date.trim()) {
      toast.error("Please fill in all report fields.");
      return;
    }
    setSubmittingReport(true);
    try {
      await api.addMeetingReport({
        ...reportForm,
        submitted_by: `${user?.name || "General Secretary"} (General Secretary)`,
        requester_role: user?.role || "Student"
      });
      toast.success("Meeting report saved successfully!");
      setReportForm({ title: "", content: "", date: "" });
      setShowReportModal(false);
      await load();
    } catch (err) {
      toast.error("Failed to save report: " + err.message);
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!id) {
      toast.error("Mock events cannot be deleted.");
      return;
    }
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.deleteAssociationEvent(id, user?.role || "Student");
      toast.success("Event deleted successfully!");
      await load();
    } catch (err) {
      toast.error("Failed to delete event: " + err.message);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!id) {
      toast.error("Mock reports cannot be deleted.");
      return;
    }
    if (!confirm("Are you sure you want to delete this meeting report?")) return;
    try {
      await api.deleteMeetingReport(id, user?.role || "Student");
      toast.success("Meeting report deleted successfully!");
      await load();
    } catch (err) {
      toast.error("Failed to delete meeting report: " + err.message);
    }
  };

  const committeeMembers = members.length ? members : mockCommitteeMembers.map((m) => ({
    ...m,
    icon: m.icon,
  }));
  const upcomingEvents = events.length ? events : mockEvents;
  const meetingReports = reports.length ? reports : mockReports;
  const canManage = isAdmin || isSecretary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Student Association</h1>
          <p className="text-muted-foreground">Manage committee positions, events, and student engagement.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <Button variant="outline" onClick={() => {
              setShowAssignModal(true);
              setSelectedStudent("");
              setSelectedPosition("");
            }} className="gap-2 border-primary/20 hover:border-primary/40 hover:bg-secondary/40 shadow-sm">
              <Plus size={16} className="text-primary" />
              <span>Assign Committee</span>
            </Button>
          )}
          {isSecretary && (
            <>
              <Button variant="outline" onClick={() => setShowEventModal(true)} className="gap-2 shadow-sm border-primary/10">
                <Calendar size={16} className="text-primary" />
                <span>Create Event</span>
              </Button>
              <Button onClick={() => setShowReportModal(true)} className="gap-2 shadow-sm">
                <Plus size={16} />
                <span>Save Meeting Report</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Committee Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {committeeMembers.map((member, i) => (
          <Card key={i} className="group hover:border-primary/50 transition-all duration-300 overflow-hidden shadow-md">
            <CardContent className="p-0">
              <div className={cn(
                "h-1.5 w-full",
                member.color === 'blue' ? "bg-blue-500" :
                member.color === 'purple' ? "bg-purple-500" :
                member.color === 'orange' ? "bg-orange-500" :
                member.color === 'cyan' ? "bg-cyan-500" :
                member.color === 'emerald' ? "bg-emerald-500" : "bg-red-500"
              )}></div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "p-2 rounded-xl bg-opacity-10",
                    member.color === 'blue' ? "bg-blue-500 text-blue-500" :
                    member.color === 'purple' ? "bg-purple-500 text-purple-500" :
                    member.color === 'orange' ? "bg-orange-500 text-orange-500" :
                    member.color === 'cyan' ? "bg-cyan-500 text-cyan-500" :
                    member.color === 'emerald' ? "bg-emerald-500 text-emerald-500" : "bg-red-500 text-red-500"
                  )}>
                    <member.icon size={20} />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal size={16} />
                  </Button>
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{member.position}</h3>
                <h4 className="text-lg font-bold mt-1 group-hover:text-primary transition-colors">{member.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">Class {member.class}</p>
                
                <div className="mt-6 flex items-center gap-2">
                  <Button variant="secondary" size="sm" className="w-full text-xs">Message</Button>
                  <Button variant="outline" size="sm" className="w-full text-xs">Profile</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Event Timeline */}
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Major activities planned by the association.</CardDescription>
              </div>
              {canManage && (
                <Button variant="ghost" size="sm" className="h-8 text-xs font-bold uppercase text-primary gap-1" onClick={() => setShowEventModal(true)}>
                  <Plus size={14} /> Create
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2">
                {upcomingEvents.map((event, i) => (
                  <div key={i} className="flex gap-4 group cursor-pointer">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-xs shrink-0 border border-border/50 text-foreground shadow-sm">
                        {event.date ? event.date.split(' ')[0] : "Event"}
                      </div>
                      {i !== upcomingEvents.length - 1 && <div className="w-px flex-1 bg-border my-2"></div>}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold group-hover:text-primary transition-colors text-sm">{event.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border shadow-sm",
                            event.status === 'Approved' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            event.status === 'Planning' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                            "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          )}>{event.status}</span>
                          {isSecretary && event.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(event.id);
                              }}
                              className="text-muted-foreground hover:text-red-500 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                              title="Delete Event"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">{event.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Meeting Reports Card */}
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList size={18} className="text-primary" />
                  <span>Association Meeting Reports</span>
                </CardTitle>
                <CardDescription>Minutes and records submitted by the General Secretary.</CardDescription>
              </div>
              {canManage && (
                <Button variant="ghost" size="sm" className="h-8 text-xs font-bold uppercase text-primary gap-1" onClick={() => setShowReportModal(true)}>
                  <Plus size={14} /> New Report
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                {meetingReports.length > 0 ? (
                  meetingReports.map((report, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border/40 hover:bg-secondary/15 hover:border-primary/20 transition-all shadow-sm">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm text-foreground">{report.title}</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock size={11} />
                            <span className="text-[10px] font-semibold">{report.date}</span>
                          </div>
                          {isSecretary && report.id && (
                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              className="text-muted-foreground hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                              title="Delete Report"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 font-sans whitespace-pre-wrap leading-relaxed">{report.content}</p>
                      <div className="mt-4 pt-3 border-t border-border/30 flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-primary/80">
                        <span>Submitted By:</span>
                        <span className="text-muted-foreground font-sans">{report.submitted_by}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center bg-secondary/10 rounded-xl border border-dashed border-border/50">
                    <ClipboardList size={36} className="text-muted-foreground/30 mb-2" />
                    <p className="text-sm font-semibold text-muted-foreground">No meeting reports logged</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Official meeting reports and minutes will appear here.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Engagement Analytics */}
        <Card className="bg-card/50 overflow-hidden relative shadow-md self-start">
          <CardHeader>
            <CardTitle>Engagement Analytics</CardTitle>
            <CardDescription>Student participation trends.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl font-bold">78%</span>
                <p className="text-xs text-muted-foreground uppercase font-bold mt-0.5">Participation Rate</p>
              </div>
              <div className="flex items-center gap-2 text-emerald-500 font-bold">
                <TrendingUp size={20} />
                <span>+5.2%</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Sports Events</span>
                  <span className="font-bold">92%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 w-[92%]"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Arts & Culture</span>
                  <span className="font-bold">85%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[85%]"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Academic Clubs</span>
                  <span className="font-bold">64%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[64%]"></div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MessageSquare className="text-primary w-5 h-5" />
              </div>
              <div>
                <h5 className="text-sm font-bold">AI Suggestion</h5>
                <p className="text-[10px] text-muted-foreground mt-0.5">Participation in Academic Clubs is low. AI suggests introducing gamified rewards.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assign Student to Committee Position Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/10">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Assign Committee Position</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Assign student as a Student Council leader</p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-1.5 rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Position Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Committee Position</label>
                  <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="w-full text-sm py-2.5 px-3 rounded-xl border border-border bg-transparent focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-foreground"
                  >
                    <option value="" className="bg-background text-foreground">-- Choose a Position --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id} className="bg-background text-foreground">
                        {m.position} (Current: {m.name || "Vacant"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Student Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Student</label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full text-sm py-2.5 px-3 rounded-xl border border-border bg-transparent focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-foreground"
                  >
                    <option value="" className="bg-background text-foreground">-- Choose a Student --</option>
                    {studentsList.map((s) => (
                      <option key={s.student_id} value={s.student_id} className="bg-background text-foreground">
                        {s.name} ({s.student_id} - Grade {s.grade})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Designation Role */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Designation / Role Title</label>
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="w-full text-sm py-2.5 px-3.5 rounded-xl border border-border bg-transparent focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-foreground"
                    placeholder="e.g. Committee Head, Sports Secretary..."
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-border flex items-center justify-end gap-3 bg-secondary/5">
                <Button
                  variant="outline"
                  onClick={() => setShowAssignModal(false)}
                  disabled={assigning}
                >
                  Cancel
                </Button>
                <Button
                  className="gap-2"
                  onClick={handleAssignSubmit}
                  disabled={assigning || !selectedStudent || !selectedPosition}
                >
                  {assigning ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Assign Student
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Association Event Modal */}
      <AnimatePresence>
        {showEventModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/10">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Create Association Event</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Publish a new event on the association timeline</p>
                </div>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="p-1.5 rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateEventSubmit}>
                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Event Title</label>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      className="w-full text-sm py-2.5 px-3.5 rounded-xl border border-border bg-transparent focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-foreground"
                      placeholder="e.g. Cultural Night 2026"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date / Month</label>
                      <input
                        type="text"
                        value={eventForm.date}
                        onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                        className="w-full text-sm py-2.5 px-3.5 rounded-xl border border-border bg-transparent focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-foreground"
                        placeholder="e.g. Jun 15"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Initial Status</label>
                      <select
                        value={eventForm.status}
                        onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                        className="w-full text-sm py-2.5 px-3 rounded-xl border border-border bg-transparent focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-foreground"
                      >
                        <option value="Planning" className="bg-background text-foreground">Planning</option>
                        <option value="Proposed" className="bg-background text-foreground">Proposed</option>
                        <option value="Approved" className="bg-background text-foreground">Approved</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Event Description</label>
                    <textarea
                      rows={3}
                      value={eventForm.desc}
                      onChange={(e) => setEventForm({ ...eventForm, desc: e.target.value })}
                      className="w-full text-sm py-2.5 px-3.5 rounded-xl border border-border bg-transparent focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-foreground resize-none"
                      placeholder="Enter a brief summary of the planned activity..."
                      required
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-border flex items-center justify-end gap-3 bg-secondary/5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEventModal(false)}
                    disabled={creatingEvent}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="gap-2"
                    disabled={creatingEvent || !eventForm.title.trim()}
                  >
                    {creatingEvent ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Publish Event
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Save Meeting Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/10">
                <div>
                  <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                    <ClipboardList size={18} className="text-primary" />
                    <span>Save Meeting Report</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Submit official minutes of the Student Council meeting</p>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-1.5 rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateReportSubmit}>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Report / Minutes Title</label>
                      <input
                        type="text"
                        value={reportForm.title}
                        onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                        className="w-full text-sm py-2.5 px-3.5 rounded-xl border border-border bg-transparent focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-foreground"
                        placeholder="e.g. General Body Minutes"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Meeting Date</label>
                      <input
                        type="text"
                        value={reportForm.date}
                        onChange={(e) => setReportForm({ ...reportForm, date: e.target.value })}
                        className="w-full text-sm py-2.5 px-3.5 rounded-xl border border-border bg-transparent focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-foreground"
                        placeholder="e.g. May 20, 2026"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Detailed Minutes & Content</label>
                    <textarea
                      rows={6}
                      value={reportForm.content}
                      onChange={(e) => setReportForm({ ...reportForm, content: e.target.value })}
                      className="w-full text-sm py-2.5 px-3.5 rounded-xl border border-border bg-transparent focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-foreground resize-none leading-relaxed"
                      placeholder="Write the meeting discussions, resolutions, and budget allocations in detail..."
                      required
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-border flex items-center justify-end gap-3 bg-secondary/5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowReportModal(false)}
                    disabled={submittingReport}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="gap-2"
                    disabled={submittingReport || !reportForm.title.trim()}
                  >
                    {submittingReport ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Save & Attribute
                      </>
                    )}
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

export default Association;
