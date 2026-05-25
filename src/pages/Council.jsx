import React, { useState, useEffect } from "react";
import { 
  Users2, 
  Trophy, 
  Music, 
  Camera, 
  BookOpen, 
  DollarSign, 
  Mail, 
  Phone, 
  Award,
  ChevronRight,
  Shield,
  CalendarCheck,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";
import { api } from "../lib/api";
import { motion } from "framer-motion";

const ICON_MAP = { Users2, Music, Trophy, Camera, BookOpen, DollarSign };

const mockCommitteeMembers = [
  { position: "General Secretary", name: "Alex Rivera", class: "12-A", icon: Users2, color: "blue" },
  { position: "Arts Secretary", name: "Maya Chen", class: "11-B", icon: Music, color: "purple" },
  { position: "Sports Secretary", name: "Jordan Smith", class: "12-C", icon: Trophy, color: "orange" },
  { position: "Media Secretary", name: "Sam Wilson", class: "10-A", icon: Camera, color: "cyan" },
  { position: "Magazine Editor", name: "Emily Blunt", class: "11-A", icon: BookOpen, color: "emerald" },
  { position: "Finance Secretary", name: "David Miller", class: "12-B", icon: DollarSign, color: "red" },
];

const Council = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const memberData = await api.getAssociationMembers(mockCommitteeMembers);
        setMembers(memberData.map((m) => ({
          position: m.position,
          name: m.name,
          class: m.grade || m.class,
          icon: ICON_MAP[m.icon] || Users2,
          color: m.color || "blue",
          is_committee: m.is_committee ?? true,
        })));
      } catch (err) {
        console.warn("Failed to load council members:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const committeeMembers = members.length ? members : mockCommitteeMembers.map((m) => ({
    ...m,
    icon: m.icon,
  }));

  const activeLeaders = committeeMembers.filter(m => m.is_committee);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Executive Council Chamber Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-card/70 to-purple-950/20 p-8 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl -z-10"></div>
        
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 font-bold uppercase tracking-wider">
            <Shield size={14} className="animate-pulse" />
            <span>Executive Chamber</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/95 to-muted-foreground bg-clip-text text-transparent">
            Student Council Directory
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Welcome to the official leadership directory of the Student Association. These elected committee representatives represent student interests, direct major events, and steer campus governance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section - Members Roster */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/30 bg-secondary/5 py-4 px-6">
              <div>
                <CardTitle className="text-lg">Active Committee Members</CardTitle>
                <CardDescription className="text-xs">Elected executive officers for the current academic session</CardDescription>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {activeLeaders.length} Officers
              </span>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <span className="animate-pulse font-semibold">Loading Council Directory...</span>
                </div>
              ) : activeLeaders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeLeaders.map((member, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ y: -2, scale: 1.01 }}
                      className="rounded-2xl border border-border/40 bg-secondary/10 hover:border-indigo-500/30 transition-all overflow-hidden flex flex-col group"
                    >
                      {/* Top colored accent ribbon */}
                      <div className={cn(
                        "h-1.5 w-full",
                        member.color === 'blue' ? "bg-blue-500" :
                        member.color === 'purple' ? "bg-purple-500" :
                        member.color === 'orange' ? "bg-orange-500" :
                        member.color === 'cyan' ? "bg-cyan-500" :
                        member.color === 'emerald' ? "bg-emerald-500" : "bg-red-500"
                      )}></div>
                      
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-xl bg-opacity-10 shrink-0",
                              member.color === 'blue' ? "bg-blue-500 text-blue-400" :
                              member.color === 'purple' ? "bg-purple-500 text-purple-400" :
                              member.color === 'orange' ? "bg-orange-500 text-orange-400" :
                              member.color === 'cyan' ? "bg-cyan-500 text-cyan-400" :
                              member.color === 'emerald' ? "bg-emerald-500 text-emerald-400" : "bg-red-500 text-red-400"
                            )}>
                              <member.icon size={18} />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{member.position}</span>
                              <h3 className="font-extrabold text-sm text-foreground group-hover:text-primary transition-colors mt-0.5">{member.name}</h3>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs border-t border-border/30 pt-3">
                          <span className="text-muted-foreground font-medium">Class: <span className="text-foreground font-semibold">Grade {member.class}</span></span>
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                            <Award size={12} /> Active Leader
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users2 size={40} className="text-muted-foreground/30 mb-2 animate-bounce" />
                  <p className="text-sm font-semibold text-muted-foreground">No active committee members</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Use the Student Association page to assign members.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Section - Directives & Agenda */}
        <div className="space-y-6">
          <Card className="border border-indigo-500/20 bg-indigo-950/10 backdrop-blur-md shadow-lg">
            <CardHeader>
              <CardTitle className="text-indigo-300 flex items-center gap-2">
                <CalendarCheck size={18} className="text-indigo-400" />
                <span>Boardroom Agenda</span>
              </CardTitle>
              <CardDescription className="text-indigo-400/70 text-xs">Upcoming Council assemblies and coordinates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { date: "May 25", time: "04:00 PM", title: "Cultural Festival Review", room: "Conference Room A" },
                { date: "Jun 02", time: "02:30 PM", title: "Inter-School Sports Meet", room: "Main Auditorium Office" },
                { date: "Jun 10", time: "11:00 AM", title: "Charity Funding Layout", room: "Boardroom Suite 2" },
              ].map((agenda, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-indigo-500/10 bg-indigo-500/5 flex justify-between items-center gap-2 group hover:bg-indigo-500/10 transition-colors">
                  <div>
                    <h5 className="font-bold text-xs text-indigo-200 group-hover:text-indigo-300">{agenda.title}</h5>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{agenda.room}</p>
                  </div>
                  <div className="text-right text-[10px] font-mono shrink-0">
                    <span className="font-bold text-indigo-400 block">{agenda.date}</span>
                    <span className="text-muted-foreground">{agenda.time}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <MessageSquare size={16} className="text-primary" />
                <span>Executive Directives</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="p-3.5 rounded-xl border border-border/50 bg-secondary/10">
                <h6 className="font-bold text-xs text-foreground">Directive #041: Academic Club Incentives</h6>
                <p className="text-[10px] text-muted-foreground mt-1">AI-driven analysis indicates dropping participation. Exec-Council resolves to introduce gamified credential badges.</p>
              </div>
              <div className="p-3.5 rounded-xl border border-border/50 bg-secondary/10">
                <h6 className="font-bold text-xs text-foreground">Directive #040: Green Campus Proposal</h6>
                <p className="text-[10px] text-muted-foreground mt-1">Elected council submits green campaign layout for solar-powered study desks directly to institutional finance board.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default Council;
