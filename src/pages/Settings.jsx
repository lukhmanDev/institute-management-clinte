import React, { useState } from "react";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Lock, 
  Globe, 
  Palette, 
  Database, 
  ShieldCheck, 
  Cpu, 
  Save,
  Moon,
  Sun,
  Laptop,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";
import { useTheme } from "../context/ThemeContext";

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("General");
  const [isSaving, setIsSaving] = useState(false);

  const tabs = [
    { id: "General", icon: SettingsIcon },
    { id: "Account", icon: User },
    { id: "Notifications", icon: Bell },
    { id: "Security", icon: Lock },
    { id: "Appearance", icon: Palette },
    { id: "System", icon: Cpu },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">Configure institutional preferences and account settings.</p>
        </div>
        <Button onClick={handleSave} className="gap-2 min-w-[120px]" disabled={isSaving}>
          {isSaving ? (
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : <Save size={16} />}
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                    activeTab === tab.id 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <tab.icon size={18} className={cn("transition-transform group-hover:scale-110", activeTab === tab.id ? "text-white" : "text-muted-foreground")} />
                  {tab.id}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === "General" && (
              <motion.div
                key="general"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Institution Profile</CardTitle>
                    <CardDescription>Basic information about your institution.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Institution Name</label>
                        <input type="text" defaultValue="EduNexus Global School" className="w-full bg-secondary/50 border-none rounded-xl px-4 py-2.5 text-sm ring-1 ring-border focus:ring-2 focus:ring-primary/20" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Institution ID</label>
                        <input type="text" defaultValue="EDU-8829-X" disabled className="w-full bg-secondary/30 border-none rounded-xl px-4 py-2.5 text-sm ring-1 ring-border opacity-50 cursor-not-allowed" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                      <input type="email" defaultValue="admin@edunexus.org" className="w-full bg-secondary/50 border-none rounded-xl px-4 py-2.5 text-sm ring-1 ring-border focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Regional & Localization</CardTitle>
                    <CardDescription>Configure language and time zone preferences.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border bg-secondary/20">
                      <div className="flex items-center gap-3">
                        <Globe size={18} className="text-primary" />
                        <div>
                          <p className="text-sm font-bold">System Language</p>
                          <p className="text-xs text-muted-foreground">Select your preferred display language.</p>
                        </div>
                      </div>
                      <select className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs">
                        <option>English (US)</option>
                        <option>Spanish</option>
                        <option>French</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "Appearance" && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Theme Preferences</CardTitle>
                    <CardDescription>Customize how EduNexus looks on your device.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'system', label: 'System', icon: Laptop },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => mode.id === 'light' ? toggleTheme() : mode.id === 'dark' ? toggleTheme() : null}
                          className={cn(
                            "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all",
                            (theme === mode.id || (mode.id === 'system' && false)) 
                              ? "border-primary bg-primary/5 shadow-inner" 
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <mode.icon size={24} className={theme === mode.id ? "text-primary" : "text-muted-foreground"} />
                          <span className="text-sm font-bold">{mode.label}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Interface Density</CardTitle>
                    <CardDescription>Adjust the spacing and size of UI elements.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <span>Compact</span>
                        <span>Normal</span>
                        <span>Relaxed</span>
                      </div>
                      <div className="relative h-2 bg-secondary rounded-full">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-lg border-2 border-white cursor-pointer" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "System" && (
              <motion.div
                key="system"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card className="bg-card/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="text-primary w-5 h-5" /> Data Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-border">
                      <div>
                        <h4 className="text-sm font-bold">Auto-Backup</h4>
                        <p className="text-xs text-muted-foreground">Schedule daily backups of institutional data.</p>
                      </div>
                      <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                      <Button variant="outline" className="flex-1 text-xs uppercase font-bold">Export All Data</Button>
                      <Button variant="outline" className="flex-1 text-xs uppercase font-bold text-red-500 hover:bg-red-500/5">Flush Cache</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">System Status: healthy</h4>
                      <p className="text-xs text-muted-foreground">All AI models and background services are operational.</p>
                    </div>
                    <Button variant="ghost" className="ml-auto text-xs text-primary font-bold">View Uptime</Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;
