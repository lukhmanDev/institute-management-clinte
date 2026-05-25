import React from "react";
import { NavLink } from "react-router-dom";
import { ChevronLeft, ChevronRight, GraduationCap, LogOut } from "lucide-react";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import { getUser, getDashboardPath } from "../../lib/auth";
import { getNavItems, getPortalTitle, getInitials } from "../../config/roleConfig";
import { useLogout } from "../../hooks/useLogout";

const Sidebar = ({ collapsed, setCollapsed }) => {
  const user = getUser();
  const role = user?.role || "Admin";
  const navItems = getNavItems(role);
  const handleLogout = useLogout();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? "80px" : "260px" }}
      className={cn(
        "fixed left-0 top-0 h-screen z-40 bg-card/80 backdrop-blur-xl border-r transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6">
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight">Edu hub</span>
            </motion.div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )
              }
            >
              <item.icon className={cn("w-5 h-5", collapsed && "mx-auto")} />
              {!collapsed && (
                <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="font-medium">
                  {item.label}
                </motion.span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t space-y-2">
          {!collapsed ? (
            <NavLink
              to={getDashboardPath(role)}
              className="flex items-center gap-3 p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                {getInitials(user?.name)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate">{user?.name || "User"}</span>
                <span className="text-xs text-muted-foreground">{getPortalTitle(role)} · {role}</span>
              </div>
            </NavLink>
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary mx-auto text-sm">
              {getInitials(user?.name)}
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-2 w-full px-3 py-2 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors text-sm",
              collapsed && "justify-center"
            )}
          >
            <LogOut size={16} />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
