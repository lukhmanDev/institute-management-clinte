import React, { useState, useEffect } from "react";
import {
  Bell,
  Megaphone,
  Plus,
  Search,
  Clock,
  Send,
  Trash2,
  AlertTriangle,
  Info,
  Users,
  GraduationCap,
  UserSquare2,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";
import { api } from "../lib/api";
import { getUser } from "../lib/auth";
import { toast } from "../lib/toast";

const AUDIENCE_OPTIONS = [
  { value: "Students", label: "Students only", icon: GraduationCap },
  { value: "Teachers", label: "Teachers only", icon: UserSquare2 },
  { value: "Both", label: "Students & Teachers", icon: Users },
];

const mockByRole = {
  Admin: [
    { id: 1, title: "Annual Sports Meet 2026", content: "Sports meet on May 25th.", type: "Announcement", audience: "Students", target: "All Students", status: "Published", date: "2 hours ago", priority: "High" },
    { id: 2, title: "Staff Meeting", content: "Teachers briefing May 22.", type: "Announcement", audience: "Teachers", target: "Teachers only", status: "Published", date: "1 hour ago", priority: "High" },
    { id: 3, title: "Exam Schedule", content: "Timetable released for all.", type: "Announcement", audience: "Both", target: "Students & Teachers", status: "Published", date: "3 hours ago", priority: "Normal" },
  ],
  Student: [
    { id: 1, title: "Annual Sports Meet 2026", content: "Sports meet on May 25th. Register by Friday.", type: "Announcement", audience: "Students", target: "All Students", status: "Published", date: "2 hours ago", priority: "High" },
    { id: 3, title: "Exam Schedule", content: "Final exam timetable is now available.", type: "Announcement", audience: "Both", target: "Students & Teachers", status: "Published", date: "3 hours ago", priority: "Normal" },
  ],
  Teacher: [
    { id: 2, title: "Staff Meeting", content: "All teaching staff must attend May 22 at 3 PM.", type: "Announcement", audience: "Teachers", target: "Teachers only", status: "Published", date: "1 hour ago", priority: "High" },
    { id: 3, title: "Exam Schedule", content: "Review room assignments with your classes.", type: "Announcement", audience: "Both", target: "Students & Teachers", status: "Published", date: "3 hours ago", priority: "Normal" },
  ],
};

const mapNotification = (n) => ({
  id: n.id,
  title: n.title,
  content: n.content,
  type: n.notification_type || n.type || "Announcement",
  audience: n.audience || "Students",
  target: n.target || n.audience_label || n.audience,
  status: n.publish_status || n.status || "Published",
  date: n.display_date || n.date || "Recently",
  priority: n.priority || "Normal",
  createdBy: n.created_by,
});

const Notifications = () => {
  const user = getUser();
  const role = user?.role || "Student";
  const isAdmin = role === "Admin";
  const [isSecretary, setIsSecretary] = useState(false);
  const canManage = isAdmin;

  const [activeTab, setActiveTab] = useState("Published");
  const [notificationsList, setNotificationsList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    notification_type: "Announcement",
    audience: "Students",
    priority: "Normal",
    publish_status: "Published",
  });

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const fallback = mockByRole[role] || mockByRole.Student;
      const data = await api.getNotifications(role, fallback);
      setNotificationsList(data.map(mapNotification));
    } catch {
      setNotificationsList((mockByRole[role] || mockByRole.Student).map(mapNotification));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [role]);

  useEffect(() => {
    if (role === "Student") {
      api.getStudentDashboard(user?.email)
        .then(res => {
          if (res?.is_secretary) {
            setIsSecretary(true);
          }
        })
        .catch(err => console.warn("Failed to check secretary status:", err));
    }
  }, [role, user?.email]);

  const filtered = notificationsList.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    if (activeTab === "Published") return matchesSearch && n.status === "Published";
    if (activeTab === "Scheduled") return matchesSearch && n.status === "Scheduled";
    if (activeTab === "All") return matchesSearch;
    return matchesSearch && n.status === "Published";
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    try {
      await api.createNotification({
        ...form,
        requester_role: isAdmin ? "Admin" : "Student",
        requester_name: user?.name,
        created_by: user?.name || (isAdmin ? "Administrator" : "Association Secretary"),
        display_date: "Just now",
        category: form.notification_type === "Alert" ? "warning" : "info",
      });
      setForm({
        title: "",
        content: "",
        notification_type: "Announcement",
        audience: "Students",
        priority: "Normal",
        publish_status: "Published",
      });
      await loadNotifications();
      toast.success("Notification sent successfully!");
    } catch (err) {
      toast.error("Failed to send: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canManage || !confirm("Delete this notification?")) return;
    try {
      await api.deleteNotification(id, isAdmin ? "Admin" : "Student");
      await loadNotifications();
      toast.success("Notification deleted.");
    } catch (err) {
      toast.error("Failed to delete: " + err.message);
    }
  };

  const audienceIcon = (audience) => {
    if (audience === "Teachers") return UserSquare2;
    if (audience === "Both") return Users;
    return GraduationCap;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {canManage ? "Notification Center" : "My Notifications"}
          </h1>
          <p className="text-muted-foreground">
            {canManage
              ? "Create and send announcements to students, teachers, or both."
              : role === "Teacher"
              ? "Announcements sent to teachers and shared updates."
              : "Announcements sent to students and shared updates."}
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
            <Send size={14} className="text-primary" />
            Authorized to create and broadcast announcements
          </div>
        )}
        {!canManage && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-xl px-3 py-2">
            <Eye size={14} />
            View only — contact admin/association secretary to broadcast
          </div>
        )}
      </div>

      <div className={cn("grid grid-cols-1 gap-6", canManage ? "lg:grid-cols-4" : "")}>
        {canManage && (
          <div className="space-y-6">
            <Card className="glass border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Plus className="text-primary w-4 h-4" /> Create Notification
                </CardTitle>
                <CardDescription>Choose who receives this message</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Title</label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Notification title"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Message</label>
                    <textarea
                      required
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      placeholder="Write your message..."
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Send to</label>
                    <div className="grid grid-cols-1 gap-2">
                      {AUDIENCE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm({ ...form, audience: opt.value })}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-sm transition-all",
                            form.audience === opt.value
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border hover:bg-secondary/50"
                          )}
                        >
                          <opt.icon size={16} />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Type</label>
                      <select
                        value={form.notification_type}
                        onChange={(e) => setForm({ ...form, notification_type: e.target.value })}
                        className="w-full bg-background border border-border rounded-xl px-2 py-2 text-xs"
                      >
                        <option>Announcement</option>
                        <option>Alert</option>
                        <option>Reminder</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Priority</label>
                      <select
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        className="w-full bg-background border border-border rounded-xl px-2 py-2 text-xs"
                      >
                        <option>Normal</option>
                        <option>High</option>
                        <option>Urgent</option>
                      </select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={submitting}>
                    <Send size={14} />
                    {submitting ? "Sending..." : `Send to ${form.audience === "Both" ? "Students & Teachers" : form.audience}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        <div className={cn("space-y-4", canManage ? "lg:col-span-3" : "")}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/50 p-2 rounded-2xl border">
            <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl flex-wrap">
              {["Published", "Scheduled", ...(canManage ? ["All"] : [])].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTab(t)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                    activeTab === t ? "bg-background shadow-sm text-primary" : "text-muted-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-background border border-border rounded-xl py-2 pl-9 pr-3 text-xs w-full sm:w-48"
              />
            </div>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-12">Loading notifications...</p>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No notifications in this tab.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((notif, i) => {
                const AudIcon = audienceIcon(notif.audience);
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="hover:border-primary/30 transition-all">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                              notif.type === "Announcement"
                                ? "bg-blue-500/10 text-blue-500"
                                : notif.type === "Alert"
                                ? "bg-red-500/10 text-red-500"
                                : "bg-orange-500/10 text-orange-500"
                            )}
                          >
                            {notif.type === "Announcement" ? (
                              <Megaphone size={20} />
                            ) : notif.type === "Alert" ? (
                              <AlertTriangle size={20} />
                            ) : (
                              <Bell size={20} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-bold text-sm">{notif.title}</h3>
                              <span
                                className={cn(
                                  "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                                  notif.priority === "Urgent"
                                    ? "bg-red-500 text-white"
                                    : notif.priority === "High"
                                    ? "bg-orange-500/10 text-orange-500"
                                    : "bg-secondary text-muted-foreground"
                                )}
                              >
                                {notif.priority}
                              </span>
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                                <AudIcon size={10} />
                                {notif.audience === "Both" ? "Students & Teachers" : notif.audience}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{notif.content}</p>
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              <span className="flex items-center gap-1">
                                <Clock size={12} /> {notif.date}
                              </span>
                              {notif.createdBy && canManage && (
                                <span>By {notif.createdBy}</span>
                              )}
                              {canManage && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-1"
                                  onClick={() => handleDelete(notif.id)}
                                >
                                  <Trash2 size={12} /> Delete
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
